(function () {
  const RB = window.RewriteBetter;

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') RB.hidePanel();
  });

  async function boot() {
    try {
      const prefs = await RB.getPrefs();
      RB.setLanguage(prefs && prefs.uiLanguage);
    } catch (e) {
      RB.setLanguage('en');
    }

    const panel = RB.mountPanel(document.getElementById('panelRoot'), {
      showHeader: true,
      showSettings: true,
      showApiStatus: true,
      onClose: () => RB.hidePanel()
    });

    const eventApi = window.__TAURI__ && window.__TAURI__.event;
    if (eventApi && eventApi.listen) {
      await eventApi.listen('panel-open', (event) => {
        const payload = event.payload;
        const text = typeof payload === 'string' ? payload : (payload && payload.text) || '';
        const hadSelection =
          typeof payload === 'object' && payload
            ? !!payload.hadSelection || !!payload.had_selection
            : !!String(text).trim();
        panel.setInput(text);
        panel.setPasteBack({ hadSelection, canPaste: true });
        panel.refreshApiStatus();
        panel.refreshPrefs();
      });
    }
  }

  boot().catch((err) => {
    console.error(err);
    document.getElementById('panelRoot').textContent = RB.t('panel.loadFailed');
  });
})();
