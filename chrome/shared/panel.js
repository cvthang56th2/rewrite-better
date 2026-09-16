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
          <h1 class="rb-title">${escapeHtml(RB.t('panel.title'))}</h1>
          <div class="rb-header-actions">
            ${showSettings ? `<button type="button" class="rb-icon-btn" data-action="settings" title="${escapeHtml(RB.t('panel.settings'))}">⚙️</button>` : ''}
            ${onClose ? `<button type="button" class="rb-icon-btn" data-action="close" title="${escapeHtml(RB.t('panel.close'))}">&times;</button>` : ''}
          </div>
        </div>`
      : '';

    const apiStatusHtml = showApiStatus ? '<div class="rb-api-status" data-role="api-status"></div>' : '';

    const modeChips = RB.localizeOptions(RB.MODES, 'mode').map((m, i) => {
      const active = i === 0 ? ' is-active' : '';
      return `<button type="button" class="rb-mode-chip${active}" data-mode="${m.value}">${escapeHtml(m.label)}</button>`;
    }).join('');

    root.innerHTML = `
      ${headerHtml}
      ${apiStatusHtml}
      <textarea class="rb-input" data-role="input" rows="4" placeholder="${escapeHtml(RB.t('panel.placeholder.input'))}">${escapeHtml(initialText)}</textarea>
      <div class="rb-mode-selector" role="tablist">${modeChips}</div>

      <div class="rb-mode-panel" data-mode-panel="rewrite">
        ${chipGroupHtml('tone', RB.localizeOptions(RB.TONES, 'tone'), 'friendly', RB.t('panel.tone'))}
        <label class="rb-check">
          <input type="checkbox" data-role="enable-translate" />
          <span>${escapeHtml(RB.t('panel.enableTranslation'))}</span>
        </label>
        <div class="rb-translate" data-role="translate-options" hidden>
          ${chipGroupHtml('fromLanguage', RB.LANGUAGES, 'auto', RB.t('panel.from'))}
          ${chipGroupHtml('toLanguage', RB.OUTPUT_LANGUAGES, 'en', RB.t('panel.to'))}
        </div>
      </div>

      <div class="rb-mode-panel" data-mode-panel="format" hidden>
        ${chipGroupHtml('formatType', RB.localizeOptions(RB.FORMAT_TYPES, 'format'), 'markdown', RB.t('panel.format'))}
      </div>

      <div class="rb-mode-panel" data-mode-panel="reply" hidden>
        <div class="rb-field">
          <div class="rb-field-label">${escapeHtml(RB.t('panel.notes'))}</div>
          <textarea class="rb-notes" data-role="notes" rows="2" placeholder="${escapeHtml(RB.t('panel.placeholder.notes'))}"></textarea>
        </div>
        ${chipGroupHtml('channel', RB.localizeOptions(RB.CHANNELS, 'channel'), 'message', RB.t('panel.type'))}
        ${chipGroupHtml('intent', RB.localizeOptions(RB.INTENTS, 'intent'), 'general', RB.t('panel.intent'))}
        ${chipGroupHtml('tone', RB.localizeOptions(RB.TONES, 'tone'), 'professional', RB.t('panel.tone'))}
        ${chipGroupHtml('length', RB.localizeOptions(RB.LENGTHS, 'length'), 'medium', RB.t('panel.length'))}
        ${chipGroupHtml('outputLanguage', RB.OUTPUT_LANGUAGES, 'en', RB.t('panel.language'))}
        <p class="rb-hint">${escapeHtml(RB.t('panel.replyHint'))}</p>
      </div>

      <button type="button" class="rb-primary-btn" data-role="process">${escapeHtml(RB.t('action.rewrite'))}</button>
      <button type="button" class="rb-copy-btn" data-role="copy" hidden>${escapeHtml(RB.t('panel.copy'))}</button>
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
      processBtn.textContent = RB.t('action.' + mode) || RB.t('action.process');
      if (mode === 'reply') {
        inputEl.placeholder = RB.t('panel.placeholder.reply');
      } else {
        inputEl.placeholder = RB.t('panel.placeholder.input');
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
      copyBtn.textContent = RB.t('panel.copied');
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
          resultEl.textContent = RB.t('panel.emptyReply');
          return;
        }
      } else if (!input.trim()) {
        resultEl.textContent = RB.t('panel.emptyInput');
        return;
      }

      let apiKey;
      try {
        apiKey = await RB.getApiKey();
      } catch (err) {
        resultEl.textContent = RB.t('panel.settingsError');
        return;
      }
      if (!apiKey) {
        resultEl.textContent = RB.t('panel.missingKey');
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
          resultEl.textContent = RB.t('panel.emptyReply');
          return;
        }
      }

      processBtn.disabled = true;
      resultEl.textContent = RB.t('panel.processing');

      try {
        const text = await RB.callGroq(prompt, apiKey);
        if (!text) {
          resultEl.textContent = RB.t('panel.emptyResponse');
          return;
        }
        resultEl.textContent = text;
        copyBtn.hidden = false;
      } catch (error) {
        console.error('Error:', error);
        if (error.message && error.message.startsWith('❌')) {
          resultEl.textContent = error.message;
        } else if (error.name === 'TypeError' && String(error.message).includes('fetch')) {
          resultEl.textContent = RB.t('panel.network');
        } else {
          resultEl.textContent = RB.t('panel.error', error.message);
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
            apiStatusEl.textContent = RB.t('panel.apiOk');
          } else {
            apiStatusEl.className = 'rb-api-status is-warning';
            apiStatusEl.innerHTML = RB.t('panel.apiInvalid');
          }
        } else {
          apiStatusEl.className = 'rb-api-status is-warning';
          apiStatusEl.innerHTML = RB.t('panel.apiMissing');
        }
      } catch (e) {
        apiStatusEl.className = 'rb-api-status is-error';
        apiStatusEl.textContent = RB.t('panel.apiCheckError');
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
