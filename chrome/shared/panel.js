/* Shared panel UI — used by toolbar popup and inline content script */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function chipGroupHtml(name, options, selectedValue, label) {
    const chips = options
      .map((opt) => {
        const active = opt.value === selectedValue ? ' is-active' : '';
        return `<button type="button" class="rb-chip${active}" data-group="${name}" data-value="${escapeHtml(opt.value)}">${escapeHtml(opt.label)}</button>`;
      })
      .join('');
    return `
      <div class="rb-field">
        ${label ? `<div class="rb-field-label">${escapeHtml(label)}</div>` : ''}
        <div class="rb-chip-group" data-chip-group="${name}" role="group">${chips}</div>
      </div>`;
  }

  function getSelectedChip(scope, group) {
    const active = scope.querySelector(`.rb-chip[data-group="${group}"].is-active`);
    return active ? active.dataset.value : null;
  }

  function setActiveChip(chip) {
    const group = chip.dataset.group;
    const panel = chip.closest('[data-mode-panel]') || chip.parentElement;
    panel.querySelectorAll(`.rb-chip[data-group="${group}"]`).forEach((c) => {
      c.classList.toggle('is-active', c === chip);
    });
  }

  /**
   * Mount the shared panel into a container.
   * @param {HTMLElement} container
   * @param {{ initialText?: string, showHeader?: boolean, showSettings?: boolean, showApiStatus?: boolean, onClose?: function|null, compact?: boolean }} opts
   * @returns {{ root: HTMLElement, destroy: function, setInput: function }}
   */
  RB.mountPanel = function (container, opts) {
    const options = opts || {};
    const initialText = options.initialText || '';
    const showHeader = options.showHeader !== false;
    const showSettings = !!options.showSettings;
    const showApiStatus = !!options.showApiStatus;
    const onClose = options.onClose || null;

    const root = document.createElement('div');
    root.className = 'rb-root' + (options.compact ? ' rb-root--compact' : '');

    const headerHtml = showHeader
      ? `<div class="rb-header">
          <h1 class="rb-title">Rewrite Better</h1>
          <div class="rb-header-actions">
            ${showSettings ? '<button type="button" class="rb-icon-btn" data-action="settings" title="Settings">⚙️</button>' : ''}
            ${onClose ? '<button type="button" class="rb-icon-btn" data-action="close" title="Close">&times;</button>' : ''}
          </div>
        </div>`
      : '';

    const apiStatusHtml = showApiStatus ? '<div class="rb-api-status" data-role="api-status"></div>' : '';

    const modeChips = RB.MODES.map((m, i) => {
      const active = i === 0 ? ' is-active' : '';
      return `<button type="button" class="rb-mode-chip${active}" data-mode="${m.value}">${escapeHtml(m.label)}</button>`;
    }).join('');

    root.innerHTML = `
      ${headerHtml}
      ${apiStatusHtml}
      <textarea class="rb-input" data-role="input" rows="4" placeholder="Paste or type text here...">${escapeHtml(initialText)}</textarea>
      <div class="rb-mode-selector" role="tablist">${modeChips}</div>

      <div class="rb-mode-panel" data-mode-panel="rewrite">
        ${chipGroupHtml('tone', RB.TONES, 'friendly', 'Tone')}
        <label class="rb-check">
          <input type="checkbox" data-role="enable-translate" />
          <span>Enable Translation</span>
        </label>
        <div class="rb-translate" data-role="translate-options" hidden>
          ${chipGroupHtml('fromLanguage', RB.LANGUAGES, 'auto', 'From')}
          ${chipGroupHtml('toLanguage', RB.OUTPUT_LANGUAGES, 'en', 'To')}
        </div>
      </div>

      <div class="rb-mode-panel" data-mode-panel="format" hidden>
        ${chipGroupHtml('formatType', RB.FORMAT_TYPES, 'markdown', 'Format')}
      </div>

      <div class="rb-mode-panel" data-mode-panel="reply" hidden>
        <div class="rb-field">
          <div class="rb-field-label">Your notes (optional)</div>
          <textarea class="rb-notes" data-role="notes" rows="2" placeholder="What you want to say / key points..."></textarea>
        </div>
        ${chipGroupHtml('channel', RB.CHANNELS, 'message', 'Type')}
        ${chipGroupHtml('intent', RB.INTENTS, 'general', 'Intent')}
        ${chipGroupHtml('tone', RB.TONES, 'professional', 'Tone')}
        ${chipGroupHtml('length', RB.LENGTHS, 'medium', 'Length')}
        ${chipGroupHtml('outputLanguage', RB.OUTPUT_LANGUAGES, 'en', 'Language')}
        <p class="rb-hint">Paste the received message above to reply, or leave it empty and use notes to compose new.</p>
      </div>

      <button type="button" class="rb-primary-btn" data-role="process">${RB.MODE_BUTTON_LABELS.rewrite}</button>
      <button type="button" class="rb-copy-btn" data-role="copy" hidden>📋 Copy to Clipboard</button>
      <div class="rb-result" data-role="result"></div>
    `;

    container.appendChild(root);

    const inputEl = root.querySelector('[data-role="input"]');
    const notesEl = root.querySelector('[data-role="notes"]');
    const processBtn = root.querySelector('[data-role="process"]');
    const copyBtn = root.querySelector('[data-role="copy"]');
    const resultEl = root.querySelector('[data-role="result"]');
    const translateToggle = root.querySelector('[data-role="enable-translate"]');
    const translateOptions = root.querySelector('[data-role="translate-options"]');
    const apiStatusEl = root.querySelector('[data-role="api-status"]');

    let currentMode = 'rewrite';

    function setMode(mode) {
      currentMode = mode;
      root.querySelectorAll('.rb-mode-chip').forEach((chip) => {
        chip.classList.toggle('is-active', chip.dataset.mode === mode);
      });
      root.querySelectorAll('[data-mode-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.modePanel !== mode;
      });
      processBtn.textContent = RB.MODE_BUTTON_LABELS[mode] || 'Process';
      if (mode === 'reply') {
        inputEl.placeholder = 'Paste received message to reply (or leave empty to compose)...';
      } else {
        inputEl.placeholder = 'Paste or type text here...';
      }
    }

    // Chip selection (event delegation)
    root.addEventListener('click', (e) => {
      const chip = e.target.closest('.rb-chip');
      if (chip && root.contains(chip)) {
        e.preventDefault();
        setActiveChip(chip);
        return;
      }
      const modeChip = e.target.closest('.rb-mode-chip');
      if (modeChip && root.contains(modeChip)) {
        e.preventDefault();
        setMode(modeChip.dataset.mode);
        return;
      }
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn && root.contains(actionBtn)) {
        e.preventDefault();
        if (actionBtn.dataset.action === 'close' && onClose) onClose();
        if (actionBtn.dataset.action === 'settings') RB.openSettings();
      }
    });

    translateToggle.addEventListener('change', () => {
      translateOptions.hidden = !translateToggle.checked;
    });

    inputEl.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!processBtn.disabled) processBtn.click();
      }
    });

    copyBtn.addEventListener('click', async () => {
      const text = resultEl.innerText;
      if (!text.trim()) return;
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
      const original = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      copyBtn.classList.add('is-copied');
      setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 2000);
    });

    processBtn.addEventListener('click', async () => {
      const input = inputEl.value;
      const notes = notesEl.value;
      copyBtn.hidden = true;
      resultEl.textContent = '';

      if (currentMode === 'reply') {
        if (!input.trim() && !notes.trim()) {
          resultEl.textContent = '❌ Enter a received message and/or your notes.';
          return;
        }
      } else if (!input.trim()) {
        resultEl.textContent = '❌ Vui lòng nhập văn bản cần xử lý.';
        return;
      }

      let apiKey;
      try {
        apiKey = await RB.getApiKey();
      } catch (err) {
        resultEl.textContent = '❌ Lỗi truy cập cài đặt.';
        return;
      }
      if (!apiKey) {
        resultEl.textContent = '❌ Chưa cấu hình Groq API Key. Vui lòng vào Cài đặt.';
        return;
      }

      let prompt;
      if (currentMode === 'rewrite') {
        const rewritePanel = root.querySelector('[data-mode-panel="rewrite"]');
        const tone = getSelectedChip(rewritePanel, 'tone') || 'friendly';
        prompt = RB.buildRewritePrompt(input, tone, {
          enabled: translateToggle.checked,
          fromLanguage: getSelectedChip(rewritePanel, 'fromLanguage') || 'auto',
          toLanguage: getSelectedChip(rewritePanel, 'toLanguage') || 'en'
        });
      } else if (currentMode === 'format') {
        const formatPanel = root.querySelector('[data-mode-panel="format"]');
        prompt = RB.buildFormatPrompt(getSelectedChip(formatPanel, 'formatType') || 'markdown', input);
      } else {
        const replyPanel = root.querySelector('[data-mode-panel="reply"]');
        prompt = RB.buildReplyPrompt({
          channel: getSelectedChip(replyPanel, 'channel') || 'message',
          intent: getSelectedChip(replyPanel, 'intent') || 'general',
          tone: getSelectedChip(replyPanel, 'tone') || 'professional',
          length: getSelectedChip(replyPanel, 'length') || 'medium',
          outputLanguage: getSelectedChip(replyPanel, 'outputLanguage') || 'en',
          incomingText: input,
          notes
        });
        if (!prompt) {
          resultEl.textContent = '❌ Enter a received message and/or your notes.';
          return;
        }
      }

      processBtn.disabled = true;
      resultEl.textContent = '⏳ Đang xử lý...';

      try {
        const text = await RB.callGroq(prompt, apiKey);
        if (!text) {
          resultEl.textContent = '❌ Không thể xử lý văn bản.';
          return;
        }
        resultEl.textContent = text;
        copyBtn.hidden = false;
      } catch (error) {
        console.error('Error:', error);
        if (error.message && error.message.startsWith('❌')) {
          resultEl.textContent = error.message;
        } else if (error.name === 'TypeError' && String(error.message).includes('fetch')) {
          resultEl.textContent = '❌ Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.';
        } else {
          resultEl.textContent = `❌ Lỗi: ${error.message}`;
        }
      } finally {
        processBtn.disabled = false;
      }
    });

    async function refreshApiStatus() {
      if (!apiStatusEl) return;
      try {
        const apiKey = await RB.getApiKey();
        if (apiKey && apiKey.startsWith('gsk_')) {
          const valid = await RB.testApiKey();
          if (valid) {
            apiStatusEl.className = 'rb-api-status is-success';
            apiStatusEl.textContent = '✅ Groq API Key hoạt động bình thường';
          } else {
            apiStatusEl.className = 'rb-api-status is-warning';
            apiStatusEl.innerHTML = '⚠️ API Key có vấn đề. <a href="#" data-action="settings">Kiểm tra lại</a>';
          }
        } else {
          apiStatusEl.className = 'rb-api-status is-warning';
          apiStatusEl.innerHTML = '⚠️ Chưa cấu hình Groq API Key. <a href="#" data-action="settings">Cấu hình ngay</a>';
        }
      } catch (e) {
        apiStatusEl.className = 'rb-api-status is-error';
        apiStatusEl.textContent = '❌ Lỗi kiểm tra API Key';
      }
    }

    if (showApiStatus) {
      refreshApiStatus();
    }

    // Focus input
    setTimeout(() => {
      inputEl.focus();
      const len = inputEl.value.length;
      inputEl.setSelectionRange(len, len);
      inputEl.scrollTop = inputEl.scrollHeight;
    }, 50);

    return {
      root,
      destroy() {
        root.remove();
      },
      setInput(text) {
        inputEl.value = text || '';
      },
      refreshApiStatus
    };
  };
})(typeof window !== 'undefined' ? window : self);
