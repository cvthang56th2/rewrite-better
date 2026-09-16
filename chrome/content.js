let currentPopup = null;
let mousePosition = { x: 0, y: 0 };
let panelApi = null;
let capturedTarget = null;
let unbindPanelGuard = null;
let unbindPopupFit = null;

function closePopup() {
  if (unbindPopupFit) {
    unbindPopupFit();
    unbindPopupFit = null;
  }
  if (unbindPanelGuard) {
    unbindPanelGuard();
    unbindPanelGuard = null;
  }
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

function rememberPointer(event) {
  if (typeof event.clientX !== 'number' || typeof event.clientY !== 'number') return;
  mousePosition.x = event.clientX;
  mousePosition.y = event.clientY;
}

document.addEventListener('pointerdown', rememberPointer, true);
document.addEventListener('contextmenu', rememberPointer, true);

function selectionAnchor() {
  const sel = window.getSelection && window.getSelection();
  if (sel && sel.rangeCount) {
    const range = sel.getRangeAt(0);
    const rect = range && range.getBoundingClientRect && range.getBoundingClientRect();
    if (rect && (rect.width || rect.height)) {
      return { x: rect.left, y: rect.bottom };
    }
  }
  return { x: mousePosition.x, y: mousePosition.y };
}

function fitPopupToViewport(popup, anchor) {
  if (!popup || !RewriteBetter.fitFixedPopup) return;
  const rect = popup.getBoundingClientRect();
  const next = RewriteBetter.fitFixedPopup({
    width: rect.width || 720,
    height: Math.max(popup.scrollHeight, rect.height),
    left: rect.left,
    anchorX: anchor.x,
    anchorY: anchor.y,
    viewport: { width: window.innerWidth, height: window.innerHeight }
  });
  const left = `${Math.round(next.left)}px`;
  const top = `${Math.round(next.top)}px`;
  const maxHeight = `${Math.round(next.maxHeight)}px`;
  const height = next.constrain ? `${Math.round(next.height)}px` : '';
  if (
    popup.style.left === left &&
    popup.style.top === top &&
    popup.style.maxHeight === maxHeight &&
    popup.style.height === height
  ) {
    return;
  }
  popup.style.left = left;
  popup.style.top = top;
  popup.style.maxHeight = maxHeight;
  popup.style.height = height;
}

function bindPopupFit(popup, anchor) {
  const fit = () => {
    if (currentPopup !== popup) return;
    fitPopupToViewport(popup, anchor);
  };
  fit();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  if (ro) ro.observe(popup);
  window.addEventListener('resize', fit);
  return function unbind() {
    if (ro) ro.disconnect();
    window.removeEventListener('resize', fit);
  };
}

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

  const anchor = selectionAnchor();
  const popup = document.createElement('div');
  popup.id = 'rewrite-better-popup';
  popup.className = 'rb-inline-shell';
  popup.style.position = 'fixed';
  popup.style.zIndex = '2147483646';
  popup.style.top = `${anchor.y + 10}px`;
  popup.style.left = `${anchor.x}px`;

  document.body.appendChild(popup);
  currentPopup = popup;
  unbindPopupFit = bindPopupFit(popup, anchor);
  unbindPanelGuard = RewriteBetter.guardPanelInteractions(popup, closePopup);

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

    fitPopupToViewport(popup, anchor);
  });
}
