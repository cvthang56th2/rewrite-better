(function () {
  const RB = window.RewriteBetter;
  const DEFAULT_HOTKEY = navigator.platform.toLowerCase().includes('mac')
    ? 'Command+Shift+E'
    : 'Control+Shift+E';

  const els = {
    language: document.getElementById('uiLanguage'),
    providers: document.getElementById('providerFields'),
    login: document.getElementById('openAtLogin'),
    hotkey: document.getElementById('hotkeyBtn'),
    resetHotkey: document.getElementById('resetHotkey'),
    extraRewrite: document.getElementById('extraRewrite'),
    extraFormat: document.getElementById('extraFormat'),
    extraReply: document.getElementById('extraReply'),
    save: document.getElementById('saveBtn'),
    test: document.getElementById('testBtn'),
    message: document.getElementById('message'),
    results: document.getElementById('testResults')
  };

  const keyInputs = {};
  let currentHotkey = DEFAULT_HOTKEY;
  let recording = false;

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = RB.t(node.getAttribute('data-i18n'));
    });
    document.title = RB.t('settings.windowTitle');
    els.extraRewrite.placeholder = RB.t('settings.extraRewritePlaceholder');
    els.extraFormat.placeholder = RB.t('settings.extraFormatPlaceholder');
    els.extraReply.placeholder = RB.t('settings.extraReplyPlaceholder');
    RB.PROVIDERS.forEach((provider) => {
      const input = keyInputs[provider.value];
      if (input) {
        input.placeholder = RB.t('settings.placeholder.' + provider.value);
        const summary = input.closest('.rb-provider').querySelector('.rb-provider-summary');
        if (summary) summary.textContent = RB.t('provider.' + provider.value + '.summary');
        const label = input.closest('.rb-provider').querySelector('.rb-provider-name');
        if (label) label.textContent = provider.displayName;
      }
    });
    els.hotkey.textContent = currentHotkey;
    els.hotkey.title = RB.t('settings.changeShortcut');
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

  function eventToShortcut(event) {
    const mods = [];
    if (event.ctrlKey) mods.push('Control');
    if (event.altKey) mods.push('Alt');
    if (event.shiftKey) mods.push('Shift');
    if (event.metaKey) mods.push(navigator.platform.toLowerCase().includes('mac') ? 'Command' : 'Super');
    let key = event.code;
    if (key.startsWith('Key')) key = key.slice(3);
    else if (key.startsWith('Digit')) key = key.slice(5);
    else if (key === 'Space') key = 'Space';
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return null;
    if (!mods.filter((m) => m !== 'Shift').length) return null;
    mods.push(key);
    return mods.join('+');
  }

  function setMessage(text) {
    els.message.textContent = text || '';
  }

  async function load() {
    const [keys, prefs, autostart] = await Promise.all([
      RB.invoke('get_api_keys'),
      RB.getPrefs(),
      RB.invoke('get_autostart')
    ]);
    RB.setLanguage(prefs.uiLanguage);
    els.language.value = RB.uiLanguage;
    RB.PROVIDERS.forEach((provider) => {
      keyInputs[provider.value].value = keys[provider.value] || '';
    });
    els.login.checked = !!autostart;
    currentHotkey = prefs.hotkey || DEFAULT_HOTKEY;
    const extra = prefs.extraInstructions || {};
    els.extraRewrite.value = extra.rewrite || '';
    els.extraFormat.value = extra.format || '';
    els.extraReply.value = extra.reply || '';
    applyI18n();
  }

  async function save() {
    const keys = {};
    RB.PROVIDERS.forEach((provider) => {
      keys[provider.value] = keyInputs[provider.value].value;
    });
    await RB.invoke('save_api_keys', { keys });
    await RB.invoke('save_prefs', {
      prefs: {
        uiLanguage: els.language.value,
        extraInstructions: {
          rewrite: els.extraRewrite.value,
          format: els.extraFormat.value,
          reply: els.extraReply.value
        }
      }
    });
    try {
      await RB.invoke('set_autostart', { enabled: els.login.checked });
      setMessage(RB.t(els.login.checked ? 'settings.openAtLoginOn' : 'settings.openAtLoginOff'));
    } catch (e) {
      setMessage(RB.t('settings.openAtLoginFail'));
    }
    RB.dailySkip.clearAll();
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
          return `<div class="rb-test-row">${r.ok ? '✅' : '❌'} ${name} ${r.id} (${r.keyHint})${
            r.ok ? '' : `<div class="rb-hint">${r.detail}</div>`
          }</div>`;
        })
        .join('');
    } catch (err) {
      setMessage(RB.formatCompleteError(err));
    } finally {
      els.test.disabled = false;
    }
  });

  els.hotkey.addEventListener('click', () => {
    recording = true;
    els.hotkey.textContent = RB.t('settings.pressShortcut');
  });

  els.resetHotkey.addEventListener('click', async () => {
    try {
      await RB.invoke('set_hotkey', { shortcut: DEFAULT_HOTKEY });
      currentHotkey = DEFAULT_HOTKEY;
      els.hotkey.textContent = currentHotkey;
      setMessage(RB.t('settings.shortcutSet', currentHotkey));
    } catch (e) {
      setMessage(RB.t('settings.shortcutFail', DEFAULT_HOTKEY));
    }
  });

  document.addEventListener('keydown', async (event) => {
    if (!recording) return;
    event.preventDefault();
    if (event.key === 'Escape') {
      recording = false;
      els.hotkey.textContent = currentHotkey;
      return;
    }
    const shortcut = eventToShortcut(event);
    if (!shortcut) return;
    recording = false;
    try {
      await RB.invoke('set_hotkey', { shortcut });
      currentHotkey = shortcut;
      els.hotkey.textContent = currentHotkey;
      setMessage(RB.t('settings.shortcutSet', currentHotkey));
    } catch (e) {
      els.hotkey.textContent = currentHotkey;
      setMessage(RB.t('settings.shortcutFail', shortcut));
    }
  });

  load().catch((err) => {
    setMessage(RB.t('panel.settingsError'));
    console.error(err);
  });
})();
