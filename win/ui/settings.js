(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});
  const DEFAULT_HOTKEY = navigator.platform.toLowerCase().includes('mac')
    ? 'Command+Shift+E'
    : 'Control+Shift+E';

  RB.settingsPageHeaderHtml = function () {
    return `<header class="rb-settings-header">
      <h1 data-i18n="options.title">Rewrite Better Settings</h1>
      <p data-i18n="options.subtitle">Configure API keys to rewrite text anywhere on Windows</p>
    </header>`;
  };

  RB.settingsFormHtml = function () {
    return `<nav class="rb-settings-tabs" role="tablist" aria-label="Settings">
      <button type="button" role="tab" data-tab="keys" aria-selected="true" data-i18n="settings.tab.keys">Keys</button>
      <button type="button" role="tab" data-tab="writing" aria-selected="false" tabindex="-1" data-i18n="settings.tab.writing">Writing</button>
      <button type="button" role="tab" data-tab="general" aria-selected="false" tabindex="-1" data-i18n="settings.tab.general">General</button>
    </nav>
    <section class="rb-settings-panel" role="tabpanel" data-tab-panel="keys">
      <p class="rb-disclaimer" data-i18n="settings.disclaimer"></p>
      <p class="rb-hint" data-i18n="settings.failoverOrder"></p>
      <div data-role="provider-fields"></div>
      <div class="rb-settings-actions">
        <button type="button" data-role="test-keys" class="rb-primary-btn" data-i18n="settings.testKeys">Test keys</button>
      </div>
      <p data-role="settings-message" class="rb-hint"></p>
      <div data-role="test-results"></div>
      <p class="rb-hint" data-i18n="settings.multipleKeys"></p>
    </section>
    <section class="rb-settings-panel" role="tabpanel" data-tab-panel="writing" hidden>
      <h2 data-i18n="settings.extraTitle">Extra instructions</h2>
      <p class="rb-hint" data-i18n="settings.extraHelp"></p>
      <label class="rb-field">
        <span class="rb-field-label" data-i18n="mode.rewrite">Rewrite</span>
        <textarea data-role="extra-rewrite" rows="2"></textarea>
      </label>
      <label class="rb-field">
        <span class="rb-field-label" data-i18n="mode.format">Format</span>
        <textarea data-role="extra-format" rows="2"></textarea>
      </label>
      <label class="rb-field">
        <span class="rb-field-label" data-i18n="mode.reply">Reply</span>
        <textarea data-role="extra-reply" rows="2"></textarea>
      </label>
      <h2 data-i18n="settings.voiceTitle">Voice profile</h2>
      <p class="rb-hint" data-i18n="settings.voiceHelp"></p>
      <label class="rb-field">
        <span class="rb-field-label" data-i18n="settings.voiceTitle">Voice profile</span>
        <textarea data-role="voice-samples" rows="5"></textarea>
      </label>
    </section>
    <section class="rb-settings-panel" role="tabpanel" data-tab-panel="general" hidden>
      <label class="rb-field">
        <span class="rb-field-label" data-i18n="settings.language">Interface language</span>
        <select data-role="ui-language">
          <option value="en">English</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </label>
      <label class="rb-check rb-login">
        <input type="checkbox" data-role="open-at-login" />
        <span data-i18n="settings.openAtLogin">Open at login</span>
      </label>
      <p class="rb-hint" data-i18n="settings.openAtLoginHelp"></p>
      <div class="rb-hotkey-row">
        <span class="rb-field-label" data-i18n="settings.shortcut">Open panel shortcut</span>
        <button type="button" data-role="reset-hotkey" class="rb-text-btn" data-i18n="settings.reset">Reset</button>
        <button type="button" data-role="hotkey" class="rb-hotkey-btn">Control+Shift+E</button>
      </div>
      <p class="rb-hint" data-i18n="settings.shortcutHelp"></p>
      <div class="rb-settings-actions" data-role="update-row" hidden>
        <button type="button" data-role="check-updates" class="rb-copy-btn" data-i18n="settings.checkForUpdates">Check for updates</button>
      </div>
      <p class="rb-hint" data-role="update-help" hidden data-i18n="settings.checkForUpdatesHelp"></p>
      <p data-role="general-message" class="rb-hint"></p>
    </section>`;
  };

  RB.bindSettings = function (root, hooks) {
    const opt = hooks || {};
    const els = {
      language: root.querySelector('[data-role="ui-language"]'),
      providers: root.querySelector('[data-role="provider-fields"]'),
      login: root.querySelector('[data-role="open-at-login"]'),
      hotkey: root.querySelector('[data-role="hotkey"]'),
      resetHotkey: root.querySelector('[data-role="reset-hotkey"]'),
      extraRewrite: root.querySelector('[data-role="extra-rewrite"]'),
      extraFormat: root.querySelector('[data-role="extra-format"]'),
      extraReply: root.querySelector('[data-role="extra-reply"]'),
      voiceSamples: root.querySelector('[data-role="voice-samples"]'),
      test: root.querySelector('[data-role="test-keys"]'),
      message: root.querySelector('[data-role="settings-message"]'),
      generalMessage: root.querySelector('[data-role="general-message"]'),
      checkUpdates: root.querySelector('[data-role="check-updates"]'),
      updateRow: root.querySelector('[data-role="update-row"]'),
      updateHelp: root.querySelector('[data-role="update-help"]'),
      results: root.querySelector('[data-role="test-results"]')
    };

    const keyInputs = {};
    let currentHotkey = DEFAULT_HOTKEY;
    let recording = false;
    let ready = false;
    let saveTimer = null;
    let lastSignature = '';
    let lastKeysSignature = '';

    function isWindowsApp() {
      return /Windows/i.test(navigator.userAgent);
    }

    function applyI18n() {
      if (document.body && document.body.classList.contains('rb-settings-body')) {
        document.documentElement.lang = RB.uiLanguage;
        document.title = RB.t('settings.windowTitle');
      }
      root.querySelectorAll('[data-i18n]').forEach((node) => {
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
      if (!recording) els.hotkey.textContent = currentHotkey;
      els.hotkey.title = RB.t('settings.changeShortcut');
      if (opt.onLanguage) opt.onLanguage();
    }

    function showTab(id) {
      root.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        panel.hidden = panel.getAttribute('data-tab-panel') !== id;
      });
      root.querySelectorAll('[data-tab]').forEach((tab) => {
        const on = tab.getAttribute('data-tab') === id;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
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

    function setGeneralMessage(text) {
      if (els.generalMessage) els.generalMessage.textContent = text || '';
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
        const toggle = els.providers.querySelector(`[data-enabled="${provider.value}"]`);
        if (toggle) toggle.checked = RB.normalizeEnabledProviders(prefs.enabledProviders)[provider.value];
      });
      syncProviderState();
      els.login.checked = !!autostart;
      currentHotkey = prefs.hotkey || DEFAULT_HOTKEY;
      const extra = prefs.extraInstructions || {};
      els.extraRewrite.value = extra.rewrite || '';
      els.extraFormat.value = extra.format || '';
      els.extraReply.value = extra.reply || '';
      els.voiceSamples.value = prefs.voiceSamples || '';
      applyI18n();
      if (isWindowsApp()) {
        els.updateRow.hidden = false;
        els.updateHelp.hidden = false;
      }
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
        enabledProviders: enabledProvidersFromUI(),
        login: els.login.checked
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
      await RB.invoke('save_api_keys', { keys: collectKeys() });
      await RB.invoke('save_prefs', {
        prefs: {
          uiLanguage: els.language.value,
          extraInstructions: {
            rewrite: els.extraRewrite.value,
            format: els.extraFormat.value,
            reply: els.extraReply.value
          },
          voiceSamples: els.voiceSamples.value,
          enabledProviders: enabledProvidersFromUI()
        }
      });
      try {
        await RB.invoke('set_autostart', { enabled: els.login.checked });
      } catch (e) {
        setGeneralMessage(RB.t('settings.openAtLoginFail'));
        throw e;
      }
      rememberSaved();
      if (keysChanged) RB.dailySkip.clearAll();
    }

    root.querySelectorAll('[data-tab]').forEach((tab) => {
      tab.addEventListener('click', () => showTab(tab.getAttribute('data-tab')));
    });
    renderProviders();

    els.checkUpdates.addEventListener('click', async () => {
      els.checkUpdates.disabled = true;
      setGeneralMessage(RB.t('updater.checking'));
      try {
        await RB.invoke('check_for_updates');
        setGeneralMessage('');
      } catch (err) {
        setGeneralMessage(RB.formatCompleteError(err));
      } finally {
        els.checkUpdates.disabled = false;
      }
    });

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
    els.login.addEventListener('change', () => {
      saveNow()
        .then(() => setGeneralMessage(RB.t(els.login.checked ? 'settings.openAtLoginOn' : 'settings.openAtLoginOff')))
        .catch(() => {});
    });
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

    els.hotkey.addEventListener('click', () => {
      recording = true;
      els.hotkey.textContent = RB.t('settings.pressShortcut');
    });

    els.resetHotkey.addEventListener('click', async () => {
      try {
        await RB.invoke('set_hotkey', { shortcut: DEFAULT_HOTKEY });
        currentHotkey = DEFAULT_HOTKEY;
        els.hotkey.textContent = currentHotkey;
        setGeneralMessage(RB.t('settings.shortcutSet', currentHotkey));
      } catch (e) {
        setGeneralMessage(RB.t('settings.shortcutFail', DEFAULT_HOTKEY));
      }
    });

    document.addEventListener('keydown', async (event) => {
      if (!recording) return;
      event.preventDefault();
      event.stopPropagation();
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
        setGeneralMessage(RB.t('settings.shortcutSet', currentHotkey));
      } catch (e) {
        els.hotkey.textContent = currentHotkey;
        setGeneralMessage(RB.t('settings.shortcutFail', shortcut));
      }
    }, true);

    load().catch((err) => {
      setMessage(RB.t('panel.settingsError'));
      console.error(err);
    });

    return {
      showTab,
      saveNow,
      reload() {
        return load().catch((err) => {
          setMessage(RB.t('panel.settingsError'));
          console.error(err);
        });
      }
    };
  };

  function bootSettingsPage() {
    if (!document.body || !document.body.classList.contains('rb-settings-body')) return;
    const host = document.getElementById('settingsRoot');
    if (!host || host.getAttribute('data-bound') === '1') return;
    host.setAttribute('data-bound', '1');
    host.innerHTML = RB.settingsPageHeaderHtml() + RB.settingsFormHtml();
    RB.bindSettings(host);
  }

  if (typeof document !== 'undefined' && document.body) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootSettingsPage);
    } else {
      bootSettingsPage();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
