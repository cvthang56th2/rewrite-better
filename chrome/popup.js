document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('panelRoot');
  if (!window.RewriteBetter || !RewriteBetter.mountPanel) {
    root.textContent = 'Failed to load Rewrite Better panel.';
    return;
  }

  RewriteBetter.mountPanel(root, {
    showHeader: true,
    showSettings: true,
    showApiStatus: true,
    compact: false
  });
});
