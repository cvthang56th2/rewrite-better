let currentPopup = null;
let mousePosition = { x: 0, y: 0 };
let panelApi = null;

function closePopup() {
  if (panelApi) {
    panelApi.destroy();
    panelApi = null;
  }
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
}

document.addEventListener('contextmenu', (e) => {
  mousePosition.x = e.pageX;
  mousePosition.y = e.pageY;
});

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REWRITE_BETTER_SHOW_POPUP') {
    showInlinePopup(event.data.selectedText || '');
  }
});

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : '';
    if (mousePosition.x === 0 && mousePosition.y === 0) {
      mousePosition.x = window.innerWidth / 2;
      mousePosition.y = window.innerHeight / 2;
    }
    showInlinePopup(selectedText);
  }

  if (e.key === 'Escape' && currentPopup) {
    e.preventDefault();
    closePopup();
  }
});

function ensureInlineStyles() {
  if (document.getElementById('rewrite-better-styles-link')) return;
  const link = document.createElement('link');
  link.id = 'rewrite-better-styles-link';
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('styles.css');
  document.documentElement.appendChild(link);
}

function showInlinePopup(selectedText) {
  closePopup();
  ensureInlineStyles();

  const popup = document.createElement('div');
  popup.id = 'rewrite-better-popup';
  popup.className = 'rb-inline-shell';
  popup.style.top = `${mousePosition.y + 10}px`;
  popup.style.left = `${mousePosition.x}px`;

  document.body.appendChild(popup);
  currentPopup = popup;

  panelApi = RewriteBetter.mountPanel(popup, {
    initialText: selectedText,
    showHeader: true,
    showSettings: true,
    showApiStatus: false,
    compact: true,
    onClose: closePopup
  });

  const rect = popup.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    popup.style.left = `${Math.max(8, mousePosition.x - rect.width)}px`;
  }
  if (rect.bottom > window.innerHeight) {
    popup.style.top = `${Math.max(8, mousePosition.y - rect.height - 10)}px`;
  }

  setTimeout(() => {
    const closeOnClickOutside = (e) => {
      if (currentPopup && !currentPopup.contains(e.target)) {
        closePopup();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 100);
}
