document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('panelRoot');
  if (!window.RewriteBetter || !RewriteBetter.mountPanel) {
    root.textContent = (window.RewriteBetter && RewriteBetter.t)
      ? RewriteBetter.t('panel.loadFailed')
      : 'Failed to load Rewrite Better panel.';
    return;
  }

  await RewriteBetter.loadUiLanguage();
  document.documentElement.lang = RewriteBetter.uiLanguage;

  let panelApi = RewriteBetter.mountPanel(root, {
    showHeader: true,
    showSettings: true,
    showApiStatus: true,
    compact: false
  });

  RewriteBetter.watchUiLanguage(() => {
    const input = panelApi && panelApi.root
      ? panelApi.root.querySelector('[data-role="input"]')?.value
      : '';
    if (panelApi) panelApi.destroy();
    root.innerHTML = '';
    document.documentElement.lang = RewriteBetter.uiLanguage;
    panelApi = RewriteBetter.mountPanel(root, {
      initialText: input || '',
      showHeader: true,
      showSettings: true,
      showApiStatus: true,
      compact: false
    });
  });
});
