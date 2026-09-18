document.addEventListener('DOMContentLoaded', function () {
  const RB = window.RewriteBetter;
  const els = {
    language: document.getElementById('uiLanguage'),
    providers: document.getElementById('providerFields'),
    extraRewrite: document.getElementById('extraRewrite'),
    extraFormat: document.getElementById('extraFormat'),
    extraReply: document.getElementById('extraReply'),
    voiceSamples: document.getElementById('voiceSamples'),
    test: document.getElementById('testBtn'),
    message: document.getElementById('message'),
    results: document.getElementById('testResults')
  };
  const keyInputs = {};
  let ready = false;
  let saveTimer = null;
  let lastSignature = '';
  let lastKeysSignature = '';

  function applyI18n() {
    document.documentElement.lang = RB.uiLanguage;
    document.title = RB.t('settings.windowTitle');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = RB.t(node.getAttribute('data-i18n'));
    });
    els.extraRewrite.placeholder = RB.t('settings.extraRewritePlaceholder');
    els.extraFormat.placeholder = RB.t('settings.extraFormatPlaceholder');
    els.extraReply.placeholder = RB.t('settings.extraReplyPlaceholder');
    els.voiceSamples.placeholder = RB.t('settings.voicePlaceholder');
    RB.PROVIDERS.forEach((provider) => {
      const input = keyInputs[provider.value];
      if (!input) return;
      input.placeholder = RB.t('settings.placeholder.' + provider.value);
      const card = input.closest('.rb-provider');
      const summary = card.querySelector('.rb-provider-summary');
      if (summary) summary.textContent = RB.t('provider.' + provider.value + '.summary');
      const label = card.querySelector('.rb-provider-name');
      if (label) label.textContent = provider.displayName;
      const toggleLabel = card.querySelector('.rb-switch-label');
      if (toggleLabel) toggleLabel.textContent = RB.t('settings.providerEnabled');
      const toggle = card.querySelector('[data-enabled]');
      if (toggle) {
        toggle.setAttribute('aria-label', RB.t('settings.providerEnabled') + ' ' + provider.displayName);
      }
    });
  }

  function bindTabs() {
    const tabs = Array.from(document.querySelectorAll('[data-tab]'));
    function show(id) {
      document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        panel.hidden = panel.getAttribute('data-tab-panel') !== id;
      });
      tabs.forEach((tab) => {
        const on = tab.getAttribute('data-tab') === id;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
      });
    }
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => show(tab.getAttribute('data-tab')));
    });
  }

  function renderProviders() {
    els.providers.innerHTML = RB.PROVIDERS.map((provider) => {
      return `<div class="rb-provider">
        <div class="rb-provider-head">
          <div class="rb-provider-title">
            <span class="rb-provider-name">${provider.displayName}</span>
            <a href="${provider.helpURL}" target="_blank" rel="noreferrer">${provider.helpURL.replace(/^https?:\/\//, '')}</a>
          </div>
          <label class="rb-switch">
            <input type="checkbox" data-enabled="${provider.value}" checked>
            <span class="rb-switch-track" aria-hidden="true"></span>
            <span class="rb-switch-label">${RB.t('settings.providerEnabled')}</span>
          </label>
        </div>
        <p class="rb-hint rb-provider-summary">${RB.t('provider.' + provider.value + '.summary')}</p>
        <textarea data-provider="${provider.value}" rows="2" spellcheck="false"></textarea>
      </div>`;
    }).join('');
    RB.PROVIDERS.forEach((provider) => {
      keyInputs[provider.value] = els.providers.querySelector(`[data-provider="${provider.value}"]`);
    });
    els.providers.querySelectorAll('[data-enabled]').forEach((toggle) => {
      toggle.addEventListener('change', () => {
        syncProviderState();
        saveNow().catch(() => {});
      });
    });
    syncProviderState();
  }

  function enabledProvidersFromUI() {
    const enabled = {};
    RB.PROVIDERS.forEach((provider) => {
      const toggle = els.providers.querySelector(`[data-enabled="${provider.value}"]`);
      enabled[provider.value] = !toggle || toggle.checked;
    });
    return enabled;
  }

  function syncProviderState() {
    RB.PROVIDERS.forEach((provider) => {
      const toggle = els.providers.querySelector(`[data-enabled="${provider.value}"]`);
      const card = toggle && toggle.closest('.rb-provider');
      if (card) card.classList.toggle('is-disabled', !toggle.checked);
    });
  }

  function setMessage(text) {
    els.message.textContent = text || '';
  }

  function chromeUnavailable() {
    return typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync;
  }

  async function load() {
    if (chromeUnavailable()) {
      setMessage(RB.t('options.chromeMissing'));
      return;
    }
    const [keys, prefs] = await Promise.all([RB.getKeysByProvider(), RB.getPrefs()]);
    RB.setLanguage(prefs.uiLanguage);
    els.language.value = RB.uiLanguage;
    RB.PROVIDERS.forEach((provider) => {
      keyInputs[provider.value].value = keys[provider.value] || '';
      const toggle = els.providers.querySelector(`[data-enabled="${provider.value}"]`);
      if (toggle) toggle.checked = RB.normalizeEnabledProviders(prefs.enabledProviders)[provider.value];
    });
    syncProviderState();
    const extra = prefs.extraInstructions || {};
    els.extraRewrite.value = extra.rewrite || '';
    els.extraFormat.value = extra.format || '';
    els.extraReply.value = extra.reply || '';
    els.voiceSamples.value = prefs.voiceSamples || '';
    applyI18n();
    rememberSaved();
    ready = true;
  }

  function collectKeys() {
    const keys = {};
    RB.PROVIDERS.forEach((provider) => {
      keys[provider.value] = keyInputs[provider.value].value;
    });
    return keys;
  }

  function signature() {
    return JSON.stringify({
      keys: collectKeys(),
      uiLanguage: els.language.value,
      extraInstructions: {
        rewrite: els.extraRewrite.value,
        format: els.extraFormat.value,
        reply: els.extraReply.value
      },
      voiceSamples: els.voiceSamples.value,
      enabledProviders: enabledProvidersFromUI()
    });
  }

  function keysSignature() {
    return JSON.stringify({
      keys: collectKeys(),
      enabledProviders: enabledProvidersFromUI()
    });
  }

  function rememberSaved() {
    lastSignature = signature();
    lastKeysSignature = keysSignature();
  }

  function scheduleSave() {
    if (!ready) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      save().catch((err) => setMessage(RB.t('options.saveError', err.message || err)));
    }, 600);
  }

  function saveNow() {
    if (!ready) return Promise.resolve();
    clearTimeout(saveTimer);
    return save().catch((err) => {
      setMessage(RB.t('options.saveError', err.message || err));
      throw err;
    });
  }

  async function save() {
    if (!ready) return;
    const next = signature();
    if (next === lastSignature) return;
    const keysChanged = keysSignature() !== lastKeysSignature;
    await RB.saveKeysAndPrefs(collectKeys(), {
      uiLanguage: els.language.value,
      extraInstructions: {
        rewrite: els.extraRewrite.value,
        format: els.extraFormat.value,
        reply: els.extraReply.value
      },
      voiceSamples: els.voiceSamples.value,
      enabledProviders: enabledProvidersFromUI()
    });
    rememberSaved();
    if (keysChanged) RB.dailySkip.clearAll();
  }

  bindTabs();
  renderProviders();

  els.language.addEventListener('change', () => {
    RB.setLanguage(els.language.value);
    applyI18n();
    saveNow().catch(() => {});
  });

  [els.extraRewrite, els.extraFormat, els.extraReply, els.voiceSamples].forEach((field) => {
    field.addEventListener('input', scheduleSave);
    field.addEventListener('blur', () => saveNow().catch(() => {}));
  });
  els.providers.addEventListener('input', scheduleSave);
  els.providers.addEventListener('focusout', () => saveNow().catch(() => {}));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) saveNow().catch(() => {});
  });

  els.test.addEventListener('click', async () => {
    els.test.disabled = true;
    setMessage(RB.t('settings.testing'));
    els.results.innerHTML = '';
    try {
      await saveNow();
      const results = await RB.testAllKeys();
      if (!results.length) {
        setMessage(RB.t('error.missingKey'));
        return;
      }
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;
      if (fail === 0) setMessage(RB.t('settings.allKeysOk', String(ok)));
      else if (ok === 0) setMessage(RB.t('settings.allKeysFailed', String(fail)));
      else setMessage(RB.t('settings.keysPartial', String(ok), String(fail)));
      els.results.innerHTML = results
        .map((r) => {
          const name = (RB.PROVIDERS.find((p) => p.value === r.provider) || {}).displayName || r.provider;
          return `<div class="rb-test-row ${r.ok ? 'is-ok' : 'is-fail'}">
            <span class="rb-test-icon" aria-hidden="true"></span>
            <div>
              <div>${name} ${r.id} (${r.keyHint})</div>
              ${r.ok ? '' : `<div class="rb-hint">${r.detail}</div>`}
            </div>
          </div>`;
        })
        .join('');
    } catch (err) {
      setMessage(RB.formatCompleteError(err));
    } finally {
      els.test.disabled = false;
    }
  });

  load().catch((err) => {
    setMessage(RB.t('panel.settingsError'));
    console.error(err);
  });
});
