/* Multi-provider chat client with daily skip / failover (same order as the macOS app). */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function chromeUnavailable() {
    return typeof chrome === 'undefined' || !chrome.storage;
  }

  function emptyKeys() {
    return { gemini: '', groq: '', cerebras: '', openai: '' };
  }

  let skipCache = {};
  const skipReady = new Promise((resolve) => {
    if (chromeUnavailable() || !chrome.storage.local) {
      resolve();
      return;
    }
    chrome.storage.local.get(['rbDailySkipped'], (result) => {
      skipCache = (result && result.rbDailySkipped) || {};
      resolve();
    });
  });

  RB.dailySkip = RB.createDailySkipStore({
    load() {
      return skipCache;
    },
    save(value) {
      skipCache = value || {};
      if (!chromeUnavailable() && chrome.storage.local) {
        chrome.storage.local.set({ rbDailySkipped: skipCache });
      }
    }
  });

  RB.getKeysByProvider = function () {
    return new Promise((resolve, reject) => {
      if (chromeUnavailable() || !chrome.storage.sync) {
        reject(new Error('Chrome storage API is not available. Please check extension permissions.'));
        return;
      }
      chrome.storage.sync.get(['apiKeys', 'groqApiKey'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        const keys = Object.assign(emptyKeys(), result.apiKeys || {});
        if (!String(keys.groq || '').trim() && result.groqApiKey) {
          keys.groq = result.groqApiKey;
        }
        resolve(keys);
      });
    });
  };

  RB.getPrefs = function () {
    return new Promise((resolve, reject) => {
      if (chromeUnavailable() || !chrome.storage.sync) {
        reject(new Error('Chrome storage API is not available. Please check extension permissions.'));
        return;
      }
      chrome.storage.sync.get(['uiLanguage', 'extraInstructions', 'voiceSamples', 'enabledProviders'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve({
          uiLanguage: result.uiLanguage,
          extraInstructions: result.extraInstructions || { rewrite: '', format: '', reply: '' },
          voiceSamples: result.voiceSamples || '',
          enabledProviders: RB.normalizeEnabledProviders(result.enabledProviders)
        });
      });
    });
  };

  RB.saveKeysAndPrefs = function (keys, prefs) {
    return new Promise((resolve, reject) => {
      if (chromeUnavailable() || !chrome.storage.sync) {
        reject(new Error('Chrome storage API is not available. Please check extension permissions.'));
        return;
      }
      const payload = {
        apiKeys: Object.assign(emptyKeys(), keys || {}),
        extraInstructions: (prefs && prefs.extraInstructions) || {
          rewrite: '',
          format: '',
          reply: ''
        },
        voiceSamples: (prefs && prefs.voiceSamples) || '',
        uiLanguage: RB.setLanguage(prefs && prefs.uiLanguage),
        enabledProviders: RB.normalizeEnabledProviders(prefs && prefs.enabledProviders)
      };
      if (payload.apiKeys.groq) payload.groqApiKey = payload.apiKeys.groq;
      chrome.storage.sync.set(payload, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(payload);
      });
    });
  };

  RB.formatCompleteError = function (error) {
    const code = error && error.code;
    if (code === 'missingKey') return RB.t('error.missingKey');
    if (code === 'allKeysResting') return RB.t('error.allKeysResting');
    const status = error && error.status;
    if (status === 401) return RB.t('error.401');
    if (status === 403) return RB.t('error.403');
    if (status === 429) return RB.t('error.429');
    if (status === 402) return RB.t('error.402');
    if (status === 500 || status === 502 || status === 503) return RB.t('error.5xx');
    if (status) return RB.t('error.http', String(status), error.message || RB.t('error.unknown'));
    if (error && error.name === 'TypeError' && String(error.message || '').indexOf('fetch') !== -1) {
      return RB.t('panel.network');
    }
    if (error && error.message) return RB.t('error.network', error.message);
    return RB.t('panel.error', RB.t('error.unknown'));
  };

  function completionsUrl(baseURL) {
    return String(baseURL || '').replace(/\/?$/, '/') + 'chat/completions';
  }

  function extractContent(data) {
    const message = data && data.choices && data.choices[0] && data.choices[0].message;
    if (!message) return '';
    return String(
      message.content || message.reasoning_content || message.reasoning || ''
    ).trim();
  }

  async function completeOnce(prompt, backend, options) {
    const opts = options || {};
    const body = {
      model: backend.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature == null ? 0.7 : opts.temperature,
      max_tokens: opts.maxTokens || backend.defaultMaxTokens
    };
    Object.assign(body, RB.chatCompletionExtras(backend.provider, backend.model) || {});

    let response;
    try {
      response = await fetch(completionsUrl(backend.baseURL), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + backend.apiKey
        },
        body: JSON.stringify(body)
      });
    } catch (error) {
      const err = new Error(error && error.message ? error.message : 'network');
      err.code = 'network';
      throw err;
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const err = new Error((data.error && data.error.message) || RB.t('error.unknown'));
      err.status = response.status;
      err.errorData = data;
      throw err;
    }
    const text = extractContent(data);
    if (!text) {
      const err = new Error(RB.t('error.emptyResponse'));
      err.code = 'emptyResponse';
      throw err;
    }
    return text;
  }

  function isExtensionDocument() {
    try {
      const href =
        (typeof location !== 'undefined' && location.href) ||
        (typeof self !== 'undefined' && self.location && self.location.href) ||
        '';
      return href.indexOf('chrome-extension://') === 0;
    } catch (e) {
      return false;
    }
  }

  function sendRuntime(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (res) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!res || !res.ok) {
          const payload = (res && res.error) || {};
          const err = new Error(payload.message || RB.t('error.unknown'));
          err.status = payload.status;
          err.code = payload.code;
          reject(err);
          return;
        }
        resolve(res.value);
      });
    });
  }

  RB.resolveActiveBackends = async function () {
    const keys = await RB.getKeysByProvider();
    let enabled;
    try {
      const prefs = await RB.getPrefs();
      enabled = prefs && prefs.enabledProviders;
    } catch (e) {
      enabled = undefined;
    }
    return RB.resolveChatBackends(keys, enabled);
  };

  RB.complete = async function (prompt, options) {
    if (!isExtensionDocument() && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return sendRuntime({ type: 'rb-complete', prompt, options });
    }
    await skipReady;
    const backends = await RB.resolveActiveBackends();
    const skipped = RB.dailySkip.activeSkipIds();
    try {
      const text = await RB.callWithQuotaFallback(backends, skipped, (backend) =>
        completeOnce(prompt, backend, options)
      );
      RB.dailySkip.markSkipped(skipped);
      return text;
    } catch (error) {
      RB.dailySkip.markSkipped(skipped);
      throw error;
    }
  };

  RB.testAllKeys = async function () {
    if (!isExtensionDocument() && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      return sendRuntime({ type: 'rb-test-keys' });
    }
    const backends = await RB.resolveActiveBackends();
    const results = [];
    for (const backend of backends) {
      const hint =
        backend.apiKey.length > 8
          ? backend.apiKey.slice(0, 4) + '…' + backend.apiKey.slice(-4)
          : '••••';
      try {
        await completeOnce('Reply with exactly: OK', backend, { maxTokens: 512 });
        results.push({
          id: backend.id,
          provider: backend.provider,
          keyHint: hint,
          ok: true,
          detail: 'OK'
        });
      } catch (error) {
        results.push({
          id: backend.id,
          provider: backend.provider,
          keyHint: hint,
          ok: false,
          detail: RB.formatCompleteError(error)
        });
      }
    }
    return results;
  };

  RB.openSettings = function () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const url = chrome.runtime.getURL('options.html');
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    }
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
