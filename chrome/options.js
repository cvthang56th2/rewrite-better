document.addEventListener('DOMContentLoaded', function () {
  const RB = window.RewriteBetter;
  const els = {
    language: document.getElementById('uiLanguage'),
    providers: document.getElementById('providerFields'),
    extraRewrite: document.getElementById('extraRewrite'),
    extraFormat: document.getElementById('extraFormat'),
    extraReply: document.getElementById('extraReply'),
    voiceSamples: document.getElementById('voiceSamples'),
    save: document.getElementById('saveBtn'),
    test: document.getElementById('testBtn'),
    message: document.getElementById('message'),
    results: document.getElementById('testResults')
  };
  const keyInputs = {};

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
      const summary = input.closest('.rb-provider').querySelector('.rb-provider-summary');
      if (summary) summary.textContent = RB.t('provider.' + provider.value + '.summary');
      const label = input.closest('.rb-provider').querySelector('.rb-provider-name');
      if (label) label.textContent = provider.displayName;
    });
  }

  function renderProviders() {
    els.providers.innerHTML = RB.PROVIDERS.map((provider) => {
      return `<div class="rb-provider">
        <div class="rb-provider-head">
          <span class="rb-provider-name">${provider.displayName}</span>
          <a href="${provider.helpURL}" target="_blank" rel="noreferrer">${provider.helpURL.replace(/^https?:\/\//, '')}</a>
        </div>
        <p class="rb-hint rb-provider-summary">${RB.t('provider.' + provider.value + '.summary')}</p>
        <textarea data-provider="${provider.value}" rows="2" spellcheck="false"></textarea>
      </div>`;
    }).join('');
    RB.PROVIDERS.forEach((provider) => {
      keyInputs[provider.value] = els.providers.querySelector(`[data-provider="${provider.value}"]`);
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
    });
    const extra = prefs.extraInstructions || {};
    els.extraRewrite.value = extra.rewrite || '';
    els.extraFormat.value = extra.format || '';
    els.extraReply.value = extra.reply || '';
    els.voiceSamples.value = prefs.voiceSamples || '';
    applyI18n();
  }

  async function save() {
    const keys = {};
    RB.PROVIDERS.forEach((provider) => {
      keys[provider.value] = keyInputs[provider.value].value;
    });
    await RB.saveKeysAndPrefs(keys, {
      uiLanguage: els.language.value,
      extraInstructions: {
        rewrite: els.extraRewrite.value,
        format: els.extraFormat.value,
        reply: els.extraReply.value
      },
      voiceSamples: els.voiceSamples.value
    });
    RB.dailySkip.clearAll();
    applyI18n();
    setMessage(RB.t('settings.saved'));
  }

  renderProviders();

  els.language.addEventListener('change', () => {
    RB.setLanguage(els.language.value);
    applyI18n();
  });

  els.save.addEventListener('click', () => {
    save().catch((err) => setMessage(RB.t('options.saveError', err.message || err)));
  });

  els.test.addEventListener('click', async () => {
    els.test.disabled = true;
    setMessage(RB.t('settings.testing'));
    els.results.innerHTML = '';
    try {
      await save();
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
