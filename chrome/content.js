let currentPopup = null;
let mousePosition = { x: 0, y: 0 };
let panelApi = null;
let capturedTarget = null;

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

function captureEditableTarget() {
  const el = document.activeElement;
  if (
    el &&
    (el.tagName === 'TEXTAREA' ||
      (el.tagName === 'INPUT' &&
        /^(text|search|email|url|tel|password|)$/i.test(el.type || 'text')))
  ) {
    return {
      type: 'input',
      el,
      start: el.selectionStart,
      end: el.selectionEnd,
      hadSelection: el.selectionStart !== el.selectionEnd
    };
  }
  if (el && el.isContentEditable) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      return {
        type: 'range',
        range: sel.getRangeAt(0).cloneRange(),
        hadSelection: !sel.isCollapsed
      };
    }
  }
  const sel = window.getSelection();
  return {
    type: 'none',
    hadSelection: !!(sel && String(sel).trim())
  };
}

function replaceCapturedSelection(text) {
  const captured = capturedTarget;
  if (!captured) return false;
  if (captured.type === 'input' && captured.el && document.contains(captured.el)) {
    const el = captured.el;
    const start = captured.start;
    const end = captured.end;
    const value = el.value;
    el.focus();
    el.value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    el.setSelectionRange(pos, pos);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  if (captured.type === 'range' && captured.range) {
    const range = captured.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    return true;
  }
  return false;
}

async function copyFallback(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
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
  capturedTarget = captureEditableTarget();
  closePopup();
  ensureInlineStyles();

  const popup = document.createElement('div');
  popup.id = 'rewrite-better-popup';
  popup.className = 'rb-inline-shell';
  popup.style.top = `${mousePosition.y + 10}px`;
  popup.style.left = `${mousePosition.x}px`;

  document.body.appendChild(popup);
  currentPopup = popup;

  RewriteBetter.loadUiLanguage().then(() => {
    if (currentPopup !== popup) return;
    panelApi = RewriteBetter.mountPanel(popup, {
      initialText: selectedText,
      showHeader: true,
      showSettings: true,
      showApiStatus: false,
      compact: true,
      onClose: closePopup,
      pasteBack: {
        hadSelection: !!(capturedTarget && capturedTarget.hadSelection) || !!String(selectedText || '').trim(),
        appName: RewriteBetter.t('paste.previousApp'),
        async perform(text) {
          const replaced = replaceCapturedSelection(text);
          if (!replaced) await copyFallback(text);
          if (replaced) closePopup();
          return replaced;
        }
      }
    });

    const rect = popup.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      popup.style.left = `${Math.max(8, mousePosition.x - rect.width)}px`;
    }
    if (rect.bottom > window.innerHeight) {
      popup.style.top = `${Math.max(8, mousePosition.y - rect.height - 10)}px`;
    }
  });

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
