/* Tauri invoke helpers + LLM complete with daily skip / failover. */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function invoke(cmd, args) {
    const core = global.__TAURI__ && global.__TAURI__.core;
    if (!core || !core.invoke) {
      return Promise.reject(new Error('Tauri API is not available'));
    }
    return core.invoke(cmd, args || {});
  }

  RB.invoke = invoke;

  RB.openSettings = function () {
    invoke('open_settings').catch((err) => console.error(err));
  };

  RB.hidePanel = function () {
    invoke('hide_panel').catch((err) => console.error(err));
  };

  RB.copyText = function (text) {
    return invoke('copy_text', { text });
  };

  RB.pasteBack = function (text) {
    return invoke('paste_back', { text });
  };

  function localSkipStore() {
    return RB.createDailySkipStore({
      load() {
        try {
          return JSON.parse(localStorage.getItem('rbDailySkipped') || '{}');
        } catch (e) {
          return {};
        }
      },
      save(value) {
        localStorage.setItem('rbDailySkipped', JSON.stringify(value || {}));
      }
    });
  }

  RB.dailySkip = localSkipStore();

  RB.getKeysByProvider = function () {
    return invoke('get_api_keys');
  };

  RB.getPrefs = function () {
    return invoke('get_prefs');
  };

  RB.formatCompleteError = function (error) {
    const code = error && error.code;
    if (code === 'missingKey') return RB.t('error.missingKey');
    if (code === 'allKeysResting') return RB.t('error.allKeysResting');
    if (code === 'emptyResponse') return RB.t('error.emptyResponse');
    const status = error && error.status;
    if (status === 401) return RB.t('error.401');
    if (status === 403) return RB.t('error.403');
    if (status === 429 || status === 413) return RB.t('error.429');
    if (status === 402) return RB.t('error.402');
    if (status === 500 || status === 502 || status === 503) return RB.t('error.5xx');
    if (status) return RB.t('error.http', String(status), error.message || RB.t('error.unknown'));
    if (error && error.message) return RB.t('error.network', error.message);
    return RB.t('panel.error', RB.t('error.unknown'));
  };

  function parseInvokeError(raw) {
    let payload = raw;
    if (typeof raw === 'string') {
      try {
        payload = JSON.parse(raw);
      } catch (e) {
        payload = { message: raw };
      }
    } else if (!raw || typeof raw !== 'object') {
      payload = { message: String(raw) };
    }
    const err = new Error(payload.message || RB.t('error.unknown'));
    err.status = payload.status;
    err.code = payload.code;
    return err;
  }

  async function completeOnce(prompt, backend, options) {
    const opts = options || {};
    try {
      return await invoke('chat_completion', {
        request: {
          baseUrl: backend.baseURL,
          apiKey: backend.apiKey,
          model: backend.model,
          prompt,
          maxTokens: opts.maxTokens || backend.defaultMaxTokens,
          temperature: opts.temperature == null ? 0.7 : opts.temperature,
          extras: RB.chatCompletionExtras(backend.provider, backend.model)
        }
      });
    } catch (raw) {
      throw parseInvokeError(raw);
    }
  }

  async function probeOnce(backend) {
    try {
      await invoke('probe_api_key', {
        request: {
          baseUrl: backend.baseURL,
          apiKey: backend.apiKey
        }
      });
    } catch (raw) {
      throw parseInvokeError(raw);
    }
  }

  RB.complete = async function (prompt, options) {
    const keys = await RB.getKeysByProvider();
    const backends = RB.resolveChatBackends(keys);
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
    const keys = await RB.getKeysByProvider();
    const backends = RB.resolveChatBackends(keys);
    const results = [];
    for (const backend of backends) {
      const hint =
        backend.apiKey.length > 8
          ? `${backend.apiKey.slice(0, 4)}…${backend.apiKey.slice(-4)}`
          : '••••';
      try {
        // Auth-only probe — avoids model/token quirks that made valid keys look broken.
        await probeOnce(backend);
        results.push({
          id: backend.id,
          provider: backend.provider,
          keyHint: hint,
          ok: true,
          detail: 'OK'
        });
      } catch (error) {
        const formatted = RB.formatCompleteError(error);
        const raw = error && error.message ? String(error.message) : '';
        const detail =
          raw && formatted.indexOf(raw) === -1 ? `${formatted} (${raw})` : formatted;
        results.push({
          id: backend.id,
          provider: backend.provider,
          keyHint: hint,
          ok: false,
          detail
        });
      }
    }
    return results;
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
