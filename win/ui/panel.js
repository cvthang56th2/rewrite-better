/* Shared panel UI — two-column layout matching the macOS app. */
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
        ${label ? `<div class="rb-field-label" data-i18n="${escapeHtml(label)}">${escapeHtml(RB.t(label))}</div>` : ''}
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

  function caretAtEnd(el) {
    return el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
  }

  function bindGhostEditor(textarea, layer, assist) {
    const prefix = layer.querySelector('.rb-ghost-prefix');
    const suffix = layer.querySelector('.rb-ghost-suffix');

    function render() {
      prefix.textContent = textarea.value;
      suffix.textContent = assist.snapshot().ghostText || '';
      layer.scrollTop = textarea.scrollTop;
      layer.scrollLeft = textarea.scrollLeft;
    }

    textarea.addEventListener('scroll', () => {
      layer.scrollTop = textarea.scrollTop;
      layer.scrollLeft = textarea.scrollLeft;
    });
    textarea.addEventListener('input', () => {
      assist.textDidChange(textarea.value, caretAtEnd(textarea));
      render();
    });
    textarea.addEventListener('keydown', (event) => {
      const ghost = assist.snapshot().ghostText;
      if (event.key === 'Tab' && ghost && caretAtEnd(textarea)) {
        event.preventDefault();
        textarea.value += assist.acceptGhost();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (event.key === 'Escape' && ghost) {
        event.preventDefault();
        event.stopPropagation();
        assist.dismissGhost();
        render();
      }
    });
    assist._renderGhost = render;
    render();
    return render;
  }

  function issueHtml(issue) {
    return `<div class="rb-issue" data-issue-id="${escapeHtml(issue.id)}">
      <div class="rb-issue-body">
        <div class="rb-issue-kind">${escapeHtml(issue.kind)}</div>
        <div class="rb-issue-message">${escapeHtml(issue.message)}</div>
        <div class="rb-issue-swap">“${escapeHtml(issue.original)}” → “${escapeHtml(issue.replacement)}”</div>
      </div>
      <button type="button" class="rb-text-btn" data-apply-issue="${escapeHtml(issue.id)}">${escapeHtml(RB.t('panel.apply'))}</button>
    </div>`;
  }

  RB.mountPanel = function (container, opts) {
    const options = opts || {};
    const initialText = options.initialText || '';
    const showHeader = options.showHeader !== false;
    const showSettings = !!options.showSettings;
    const showApiStatus = !!options.showApiStatus;
    const onClose = options.onClose || null;
    let pasteBack = options.pasteBack || null;

    const root = document.createElement('div');
    root.className = 'rb-root' + (options.compact ? ' rb-root--compact' : '');

    const headerHtml = showHeader
      ? `<div class="rb-header" data-tauri-drag-region>
          <div class="rb-header-leading">
            <button type="button" class="rb-icon-btn" data-action="settings-back" hidden title="${escapeHtml(RB.t('panel.back'))}" aria-label="${escapeHtml(RB.t('panel.back'))}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
            </button>
            <h1 class="rb-title" data-role="header-title">${escapeHtml(RB.t('panel.title'))}</h1>
          </div>
          <div class="rb-header-actions">
            ${showSettings ? `<button type="button" class="rb-icon-btn" data-action="settings" title="${escapeHtml(RB.t('panel.settings'))}" aria-label="${escapeHtml(RB.t('panel.settings'))}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></svg>
            </button>` : ''}
            ${onClose ? `<button type="button" class="rb-icon-btn" data-action="close" title="${escapeHtml(RB.t('panel.close'))}" aria-label="${escapeHtml(RB.t('panel.close'))}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>` : ''}
          </div>
        </div>`
      : '';

    const apiStatusHtml = showApiStatus ? '<div class="rb-api-status" data-role="api-status" hidden></div>' : '';

    const modeChips = RB.localizeOptions(RB.MODES, 'mode')
      .map((m, i) => {
        const active = i === 0 ? ' is-active' : '';
        return `<button type="button" class="rb-mode-chip${active}" data-mode="${m.value}">${escapeHtml(m.label)}</button>`;
      })
      .join('');

    root.innerHTML = `
      ${headerHtml}
      <div class="rb-writing" data-role="writing">
      <div class="rb-mode-selector" role="tablist">${modeChips}</div>
      ${apiStatusHtml}
      <div class="rb-columns">
        <div class="rb-left">
          <div class="rb-field rb-input-field">
            <div class="rb-field-head">
              <div class="rb-field-label" data-role="input-label">${escapeHtml(RB.t('panel.input'))}</div>
              <span class="rb-assist-hint" data-role="input-hint"></span>
            </div>
            <div class="rb-ghost-editor">
              <div class="rb-ghost-layer" data-role="input-ghost" aria-hidden="true">
                <span class="rb-ghost-prefix"></span><span class="rb-ghost-suffix"></span>
              </div>
              <textarea class="rb-input" data-role="input" rows="6" placeholder="${escapeHtml(RB.t('panel.placeholder.input'))}">${escapeHtml(initialText)}</textarea>
            </div>
          </div>
          <div class="rb-field rb-notes-field" data-role="notes-wrap" hidden>
            <div class="rb-field-head">
              <div class="rb-field-label">${escapeHtml(RB.t('panel.notes'))}</div>
              <span class="rb-assist-hint" data-role="notes-hint"></span>
            </div>
            <div class="rb-ghost-editor rb-ghost-editor--notes">
              <div class="rb-ghost-layer" data-role="notes-ghost" aria-hidden="true">
                <span class="rb-ghost-prefix"></span><span class="rb-ghost-suffix"></span>
              </div>
              <textarea class="rb-notes" data-role="notes" rows="3" placeholder="${escapeHtml(RB.t('panel.placeholder.notes'))}"></textarea>
            </div>
          </div>
          <div class="rb-assist" data-role="assist">
            <div class="rb-assist-row">
              <label class="rb-check">
                <input type="checkbox" data-role="assist-enabled" />
                <span>${escapeHtml(RB.t('panel.writingAssist'))}</span>
              </label>
              <button type="button" class="rb-text-btn" data-role="check-writing">${escapeHtml(RB.t('panel.checkWriting'))}</button>
            </div>
            <div class="rb-issues" data-role="issues" hidden></div>
          </div>
          <p class="rb-hint" data-role="extra-hint" hidden>${escapeHtml(RB.t('panel.extraHint'))}</p>
          <p class="rb-hint" data-role="voice-hint" hidden>${escapeHtml(RB.t('panel.voiceHint'))}</p>
          <div class="rb-actions">
            <button type="button" class="rb-primary-btn" data-role="process">${escapeHtml(RB.t('action.rewrite'))}</button>
            <button type="button" class="rb-copy-btn" data-role="copy" hidden>${escapeHtml(RB.t('panel.copy'))}</button>
            <button type="button" class="rb-paste-btn" data-role="paste" hidden></button>
          </div>
          <div class="rb-status" data-role="status"></div>
          <div class="rb-result-wrap">
            <div class="rb-field-label">${escapeHtml(RB.t('panel.result'))}</div>
            <div class="rb-variants" data-role="variants" hidden></div>
            <div class="rb-result" data-role="result"></div>
            <div class="rb-refine" data-role="refine-wrap" hidden>
              <div class="rb-field-label">${escapeHtml(RB.t('panel.refine'))}</div>
              <div class="rb-refine-thread" data-role="refine-thread" hidden></div>
              <div class="rb-refine-row">
                <textarea class="rb-refine-input" data-role="refine" rows="2" placeholder="${escapeHtml(RB.t('panel.refinePlaceholder'))}" aria-label="${escapeHtml(RB.t('panel.refine'))}"></textarea>
                <button type="button" class="rb-text-btn" data-role="refine-send">${escapeHtml(RB.t('action.refine'))}</button>
              </div>
            </div>
            <div class="rb-diff" data-role="diff" hidden></div>
            <p class="rb-hint" data-role="result-hint">${escapeHtml(RB.t('panel.resultHint'))}</p>
          </div>
        </div>
        <div class="rb-divider" aria-hidden="true"></div>
        <div class="rb-right">
          <div class="rb-mode-scroll">
            <div class="rb-mode-panel" data-mode-panel="rewrite">
              ${chipGroupHtml('tone', RB.localizeOptions(RB.TONES, 'tone'), 'friendly', 'panel.tone')}
              <label class="rb-check">
                <input type="checkbox" data-role="enable-translate" />
                <span>${escapeHtml(RB.t('panel.enableTranslation'))}</span>
              </label>
              <div class="rb-translate" data-role="translate-options" hidden>
                ${chipGroupHtml('fromLanguage', RB.LANGUAGES, 'auto', 'panel.from')}
                ${chipGroupHtml('toLanguage', RB.OUTPUT_LANGUAGES, 'en', 'panel.to')}
              </div>
            </div>
            <div class="rb-mode-panel" data-mode-panel="format" hidden>
              ${chipGroupHtml('formatType', RB.localizeOptions(RB.FORMAT_TYPES, 'format'), 'markdown', 'panel.format')}
            </div>
            <div class="rb-mode-panel" data-mode-panel="reply" hidden>
              ${chipGroupHtml('channel', RB.localizeOptions(RB.CHANNELS, 'channel'), 'message', 'panel.type')}
              ${chipGroupHtml('intent', RB.localizeOptions(RB.INTENTS, 'intent'), 'general', 'panel.intent')}
              ${chipGroupHtml('tone', RB.localizeOptions(RB.TONES, 'tone'), 'professional', 'panel.tone')}
              ${chipGroupHtml('length', RB.localizeOptions(RB.LENGTHS, 'length'), 'medium', 'panel.length')}
              ${chipGroupHtml('outputLanguage', RB.OUTPUT_LANGUAGES, 'en', 'panel.language')}
              <p class="rb-hint">${escapeHtml(RB.t('panel.replyHint'))}</p>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div class="rb-settings rb-settings--embedded" data-role="settings-view" hidden></div>
    `;

    container.appendChild(root);

    const inputEl = root.querySelector('[data-role="input"]');
    const notesEl = root.querySelector('[data-role="notes"]');
    const notesWrap = root.querySelector('[data-role="notes-wrap"]');
    const inputLabel = root.querySelector('[data-role="input-label"]');
    const processBtn = root.querySelector('[data-role="process"]');
    const copyBtn = root.querySelector('[data-role="copy"]');
    const pasteBtn = root.querySelector('[data-role="paste"]');
    const resultEl = root.querySelector('[data-role="result"]');
    const resultHint = root.querySelector('[data-role="result-hint"]');
    const refineWrap = root.querySelector('[data-role="refine-wrap"]');
    const refineEl = root.querySelector('[data-role="refine"]');
    const refineSend = root.querySelector('[data-role="refine-send"]');
    const refineThread = root.querySelector('[data-role="refine-thread"]');
    const statusEl = root.querySelector('[data-role="status"]');
    const translateToggle = root.querySelector('[data-role="enable-translate"]');
    const translateOptions = root.querySelector('[data-role="translate-options"]');
    const apiStatusEl = root.querySelector('[data-role="api-status"]');
    const extraHintEl = root.querySelector('[data-role="extra-hint"]');
    const voiceHintEl = root.querySelector('[data-role="voice-hint"]');
    const variantsEl = root.querySelector('[data-role="variants"]');
    const diffEl = root.querySelector('[data-role="diff"]');
    const assistEnabledEl = root.querySelector('[data-role="assist-enabled"]');
    const checkBtn = root.querySelector('[data-role="check-writing"]');
    const issuesEl = root.querySelector('[data-role="issues"]');
    const inputHint = root.querySelector('[data-role="input-hint"]');
    const notesHint = root.querySelector('[data-role="notes-hint"]');

    let currentMode = 'rewrite';
    let extraByMode = { rewrite: '', format: '', reply: '' };
    let voiceSamples = '';
    let variants = [];
    let variantIndex = 0;
    let diffSource = '';
    let refineHistories = [];
    let copyResetTimer = null;

    function extraFor(mode) {
      return extraByMode[mode] || '';
    }

    function currentResultText() {
      return variants[variantIndex] || '';
    }

    function setStatus(message, isError) {
      statusEl.textContent = message || '';
      statusEl.classList.toggle('is-error', !!isError);
    }

    function resetRefineHistories(count) {
      refineHistories = RB.emptyRefineHistories ? RB.emptyRefineHistories(count) : [];
    }

    function showResult(text) {
      variants = String(text || '').trim() ? [String(text)] : [];
      variantIndex = 0;
      diffSource = '';
      resetRefineHistories(variants.length);
      renderOutput();
    }

    function showVariants(list, sourceText) {
      variants = (list || []).filter((item) => String(item || '').trim());
      variantIndex = 0;
      diffSource = sourceText || '';
      resetRefineHistories(variants.length);
      renderOutput();
    }

    function renderOutput() {
      const text = currentResultText();
      resultEl.textContent = text;
      resultHint.hidden = !!text.trim();
      copyBtn.hidden = !text.trim();
      if (refineWrap) refineWrap.hidden = !text.trim();
      renderVariantChips();
      renderRefineThread();
      renderDiff();
      refreshPasteButton();
    }

    function renderVariantChips() {
      if (!variantsEl) return;
      if (variants.length < 2) {
        variantsEl.hidden = true;
        variantsEl.innerHTML = '';
        return;
      }
      variantsEl.hidden = false;
      variantsEl.innerHTML =
        `<div class="rb-field-label">${escapeHtml(RB.t('panel.variants'))}</div>` +
        `<div class="rb-chip-group" role="tablist">` +
        variants
          .map((item, index) => {
            const active = index === variantIndex ? ' is-active' : '';
            return `<button type="button" class="rb-chip${active}" data-variant="${index}">${escapeHtml(
              RB.t('panel.variant', String(index + 1))
            )}</button>`;
          })
          .join('') +
        `</div>`;
    }

    function renderRefineThread() {
      if (!refineThread) return;
      const turns = RB.refineHistoryForVariant
        ? RB.refineHistoryForVariant(refineHistories, variantIndex)
        : [];
      if (!turns.length) {
        refineThread.hidden = true;
        refineThread.innerHTML = '';
        return;
      }
      refineThread.hidden = false;
      refineThread.innerHTML = turns
        .map((turn) => {
          const isUser = turn && turn.role === 'user';
          const label = RB.t(isUser ? 'panel.chatYou' : 'panel.chatAi');
          const kind = isUser ? 'user' : 'ai';
          return `<div class="rb-chat-turn rb-chat-turn--${kind}">
            <div class="rb-chat-role">${escapeHtml(label)}</div>
            <div class="rb-chat-text">${escapeHtml((turn && turn.text) || '')}</div>
          </div>`;
        })
        .join('');
      refineThread.scrollTop = refineThread.scrollHeight;
    }

    function renderDiff() {
      if (!diffEl) return;
      const text = currentResultText();
      if (!diffSource || !text || !RB.diffWords || !RB.hasVisibleDiff) {
        diffEl.hidden = true;
        diffEl.innerHTML = '';
        return;
      }
      const parts = RB.diffWords(diffSource, text);
      if (!RB.hasVisibleDiff(parts)) {
        diffEl.hidden = true;
        diffEl.innerHTML = '';
        return;
      }
      diffEl.hidden = false;
      diffEl.innerHTML =
        `<div class="rb-field-label">${escapeHtml(RB.t('panel.changes'))}</div>` +
        `<div class="rb-diff-body">${RB.renderDiffHtml(parts)}</div>`;
    }

    function refreshPasteButton() {
      const hasResult = !!currentResultText().trim();
      const canPaste = !!(pasteBack && (pasteBack.perform || RB.pasteBack));
      pasteBtn.hidden = !(hasResult && canPaste);
      if (pasteBtn.hidden) return;
      const hadSelection = !!(pasteBack && pasteBack.hadSelection);
      const appName = (pasteBack && pasteBack.appName) || RB.t('paste.previousApp');
      pasteBtn.textContent = RB.t(hadSelection ? 'paste.replaceIn' : 'paste.pasteIn', appName);
      pasteBtn.title = RB.t(
        hadSelection ? 'paste.replaceHelp' : 'paste.pasteHelp',
        appName
      );
    }

    function renderAssistHint(el, state) {
      if (state.isSuggesting) el.textContent = RB.t('panel.suggesting');
      else if (state.ghostText) el.textContent = RB.t('panel.tabHint');
      else el.textContent = '';
    }

    function renderIssues(state, textEl) {
      const list = (state.issues || []).slice(0, 6);
      if (!list.length) {
        issuesEl.hidden = true;
        issuesEl.innerHTML = '';
        return;
      }
      issuesEl.hidden = false;
      issuesEl.innerHTML =
        `<div class="rb-field-label">${escapeHtml(RB.t('panel.suggestions'))}</div>` +
        list.map(issueHtml).join('');
      issuesEl.querySelectorAll('[data-apply-issue]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const issue = list.find((item) => item.id === btn.getAttribute('data-apply-issue'));
          if (!issue) return;
          textEl.value = activeAssist.applyIssue(issue, textEl.value);
          textEl.dispatchEvent(new Event('input', { bubbles: true }));
        });
      });
    }

    function completeFn(prompt, completeOpts) {
      return RB.complete(prompt, completeOpts);
    }

    const inputAssist = RB.createWritingAssist({
      complete: completeFn,
      voiceSamples: () => voiceSamples,
      onUpdate(state) {
        if (inputAssist._renderGhost) inputAssist._renderGhost();
        renderAssistHint(inputHint, state);
        if (currentMode !== 'reply') {
          renderIssues(state, inputEl);
          syncCheckButton(state, inputEl);
        }
      }
    });
    const notesAssist = RB.createWritingAssist({
      complete: completeFn,
      voiceSamples: () => voiceSamples,
      onUpdate(state) {
        if (notesAssist._renderGhost) notesAssist._renderGhost();
        renderAssistHint(notesHint, state);
        if (currentMode === 'reply') {
          renderIssues(state, notesEl);
          syncCheckButton(state, notesEl);
        }
      }
    });

    bindGhostEditor(inputEl, root.querySelector('[data-role="input-ghost"]'), inputAssist);
    bindGhostEditor(notesEl, root.querySelector('[data-role="notes-ghost"]'), notesAssist);

    let activeAssist = inputAssist;

    function syncCheckButton(state, textEl) {
      checkBtn.disabled = !!(state && state.isChecking) || String(textEl.value || '').trim().length < 12;
      checkBtn.textContent = state && state.isChecking ? RB.t('panel.checking') : RB.t('panel.checkWriting');
    }

    function setMode(mode) {
      currentMode = mode;
      root.querySelectorAll('.rb-mode-chip').forEach((chip) => {
        chip.classList.toggle('is-active', chip.dataset.mode === mode);
      });
      root.querySelectorAll('[data-mode-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.modePanel !== mode;
      });
      processBtn.textContent = RB.t('action.' + mode) || RB.t('action.process');
      notesWrap.hidden = mode !== 'reply';
      if (mode === 'reply') {
        inputEl.placeholder = RB.t('panel.placeholder.reply');
        inputLabel.textContent = RB.t('panel.receivedMessage');
        activeAssist = notesAssist;
        renderIssues(notesAssist.snapshot(), notesEl);
        syncCheckButton(notesAssist.snapshot(), notesEl);
      } else {
        inputEl.placeholder = RB.t('panel.placeholder.input');
        inputLabel.textContent = RB.t('panel.input');
        activeAssist = inputAssist;
        renderIssues(inputAssist.snapshot(), inputEl);
        syncCheckButton(inputAssist.snapshot(), inputEl);
      }
      extraHintEl.hidden = !String(extraFor(mode)).trim();
      voiceHintEl.hidden = !String(voiceSamples).trim();
      assistEnabledEl.checked = activeAssist.snapshot().assistEnabled;
    }

    let settingsApi = null;
    const writingEl = root.querySelector('[data-role="writing"]');
    const settingsEl = root.querySelector('[data-role="settings-view"]');
    const titleEl = root.querySelector('[data-role="header-title"]');
    const settingsBtn = root.querySelector('[data-action="settings"]');
    const backBtn = root.querySelector('[data-action="settings-back"]');

    function relabelPanel() {
      if (titleEl) {
        titleEl.textContent = root.classList.contains('is-settings')
          ? RB.t('panel.settings')
          : RB.t('panel.title');
      }
      if (backBtn) {
        backBtn.title = RB.t('panel.back');
        backBtn.setAttribute('aria-label', RB.t('panel.back'));
      }
      if (settingsBtn) {
        settingsBtn.title = RB.t('panel.settings');
        settingsBtn.setAttribute('aria-label', RB.t('panel.settings'));
      }
      if (writingEl) {
        writingEl.querySelectorAll('[data-i18n]').forEach((node) => {
          node.textContent = RB.t(node.getAttribute('data-i18n'));
        });
      }
      if (RB.localizeOptions && RB.MODES) {
        const modes = RB.localizeOptions(RB.MODES, 'mode');
        root.querySelectorAll('.rb-mode-chip').forEach((btn) => {
          const match = modes.find((item) => item.value === btn.dataset.mode);
          if (match) btn.textContent = match.label;
        });
        [
          ['tone', RB.TONES, 'tone'],
          ['formatType', RB.FORMAT_TYPES, 'format'],
          ['channel', RB.CHANNELS, 'channel'],
          ['intent', RB.INTENTS, 'intent'],
          ['length', RB.LENGTHS, 'length']
        ].forEach(([group, items, prefix]) => {
          if (!items) return;
          const localized = RB.localizeOptions(items, prefix);
          root.querySelectorAll(`.rb-chip[data-group="${group}"]`).forEach((btn) => {
            const match = localized.find((item) => item.value === btn.dataset.value);
            if (match) btn.textContent = match.label;
          });
        });
      }
      if (inputLabel) {
        inputLabel.textContent = RB.t(currentMode === 'reply' ? 'panel.receivedMessage' : 'panel.input');
      }
      if (inputEl) {
        inputEl.placeholder = RB.t(currentMode === 'reply' ? 'panel.placeholder.reply' : 'panel.placeholder.input');
      }
      if (notesEl) notesEl.placeholder = RB.t('panel.placeholder.notes');
      if (processBtn && !processBtn.querySelector('.rb-spinner')) {
        processBtn.textContent = RB.t('action.' + currentMode) || processBtn.textContent;
      }
    }

    function showSettingsView(tab) {
      if (!settingsEl || typeof RB.settingsFormHtml !== 'function' || typeof RB.bindSettings !== 'function') {
        if (typeof RB.openSettings === 'function') RB.openSettings();
        return;
      }
      if (!settingsApi) {
        settingsEl.innerHTML = RB.settingsFormHtml();
        settingsApi = RB.bindSettings(settingsEl, { onLanguage: relabelPanel });
      } else if (settingsApi.reload) {
        settingsApi.reload();
      }
      if (writingEl) writingEl.hidden = true;
      settingsEl.hidden = false;
      root.classList.add('is-settings');
      if (settingsBtn) settingsBtn.hidden = true;
      if (backBtn) backBtn.hidden = false;
      relabelPanel();
      if (tab && settingsApi && settingsApi.showTab) settingsApi.showTab(tab);
    }

    function showWritingView() {
      const finish = () => {
        if (settingsEl) settingsEl.hidden = true;
        if (writingEl) writingEl.hidden = false;
        root.classList.remove('is-settings');
        if (settingsBtn) settingsBtn.hidden = false;
        if (backBtn) backBtn.hidden = true;
        relabelPanel();
        refreshPrefs();
        if (showApiStatus) refreshApiStatus();
      };
      if (settingsApi && settingsApi.saveNow) {
        settingsApi.saveNow().then(finish, finish);
        return;
      }
      finish();
    }

    root.addEventListener('click', (e) => {
      const variantChip = e.target.closest('[data-variant]');
      if (variantChip && root.contains(variantChip)) {
        e.preventDefault();
        variantIndex = Number(variantChip.getAttribute('data-variant')) || 0;
        copyBtn.textContent = RB.t('panel.copy');
        copyBtn.classList.remove('is-copied');
        renderOutput();
        return;
      }
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
        if (actionBtn.dataset.action === 'settings') showSettingsView('keys');
        if (actionBtn.dataset.action === 'settings-back') showWritingView();
      }
    });

    translateToggle.addEventListener('change', () => {
      translateOptions.hidden = !translateToggle.checked;
    });

    assistEnabledEl.addEventListener('change', () => {
      activeAssist.setEnabled(assistEnabledEl.checked);
    });

    checkBtn.addEventListener('click', () => {
      const textEl = currentMode === 'reply' ? notesEl : inputEl;
      activeAssist.checkNow(textEl.value);
    });

    root.addEventListener('keydown', (event) => {
      if (root.classList.contains('is-settings')) return;
      if ((event.ctrlKey || event.metaKey) && event.altKey && (event.key === 'Enter' || event.key === 'Return')) {
        if (!pasteBtn.hidden && !pasteBtn.disabled) {
          event.preventDefault();
          pasteBtn.click();
        }
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (refineEl && (event.target === refineEl || (refineEl.contains && refineEl.contains(event.target)))) {
          if (refineSend && !refineSend.disabled) refineSend.click();
          return;
        }
        if (!processBtn.disabled) processBtn.click();
      }
    });

    copyBtn.addEventListener('click', async () => {
      const text = currentResultText();
      if (!text.trim()) return;
      try {
        if (RB.copyText) await RB.copyText(text);
        else await navigator.clipboard.writeText(text);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const original = RB.t('panel.copy');
      copyBtn.textContent = RB.t('panel.copied');
      copyBtn.classList.add('is-copied');
      clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => {
        copyBtn.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 2000);
    });

    async function copyCurrentResult() {
      const text = currentResultText();
      if (!text.trim() || !RB.copyText) return;
      try {
        await RB.copyText(text);
        copyBtn.textContent = RB.t('panel.copied');
        copyBtn.classList.add('is-copied');
        copyBtn.hidden = false;
        clearTimeout(copyResetTimer);
        copyResetTimer = setTimeout(() => {
          copyBtn.textContent = RB.t('panel.copy');
          copyBtn.classList.remove('is-copied');
        }, 2000);
      } catch (e) {
        /* keep copy button available */
      }
    }

    function setBusy(on) {
      processBtn.disabled = on;
      if (refineSend) refineSend.disabled = on;
      if (refineEl) refineEl.disabled = on;
    }

    async function runRefine() {
      const current = currentResultText();
      const instruction = refineEl ? refineEl.value : '';
      if (!current.trim()) return;
      const history = RB.refineHistoryForVariant
        ? RB.refineHistoryForVariant(refineHistories, variantIndex)
        : [];
      const prompt = RB.buildRefinePrompt
        ? RB.buildRefinePrompt(current, instruction, voiceSamples, history)
        : null;
      if (!prompt) {
        setStatus(RB.t('panel.emptyRefine'), true);
        return;
      }

      setBusy(true);
      if (refineSend) {
        refineSend.innerHTML = `<span class="rb-spinner" aria-hidden="true"></span>${escapeHtml(RB.t('panel.processing'))}`;
      }
      setStatus(RB.t('panel.processing'));

      try {
        const raw = await RB.complete(prompt);
        const refined = RB.parseRefineText ? RB.parseRefineText(raw) : String(raw || '').trim();
        if (!refined) {
          setStatus(RB.t('panel.emptyResponse'), true);
          return;
        }
        const next = RB.replaceSelectedVariant
          ? RB.replaceSelectedVariant(variants, variantIndex, refined)
          : variants.slice();
        if (!RB.replaceSelectedVariant && next[variantIndex] != null) next[variantIndex] = refined;
        variants = next;
        refineHistories = RB.appendRefineTurn
          ? RB.appendRefineTurn(refineHistories, variantIndex, instruction, refined)
          : refineHistories;
        if (refineEl) refineEl.value = '';
        setStatus('');
        renderOutput();
        await copyCurrentResult();
      } catch (error) {
        console.error('Error:', error);
        setStatus(RB.formatCompleteError ? RB.formatCompleteError(error) : RB.t('panel.error', error.message || ''), true);
      } finally {
        setBusy(false);
        if (refineSend) refineSend.textContent = RB.t('action.refine');
      }
    }

    if (refineSend) {
      refineSend.addEventListener('click', () => {
        runRefine();
      });
    }

    pasteBtn.addEventListener('click', async () => {
      const text = currentResultText();
      if (!text.trim()) return;
      const perform = (pasteBack && pasteBack.perform) || RB.pasteBack;
      if (!perform) return;
      try {
        const ok = await perform(text);
        if (ok === false) setStatus(RB.t('panel.pasteNoTarget'), true);
        else setStatus('');
      } catch (error) {
        setStatus(error && error.message ? error.message : RB.t('panel.pasteActivateFailed'), true);
      }
    });

    processBtn.addEventListener('click', async () => {
      const input = inputEl.value;
      const notes = notesEl.value;
      copyBtn.hidden = true;
      pasteBtn.hidden = true;
      if (refineEl) refineEl.value = '';
      showResult('');
      setStatus('');

      if (currentMode === 'reply') {
        if (!input.trim() && !notes.trim()) {
          setStatus(RB.t('panel.emptyReply'), true);
          return;
        }
      } else if (!input.trim()) {
        setStatus(RB.t('panel.emptyInput'), true);
        return;
      }

      let prompt;
      const extra = extraFor(currentMode);
      if (currentMode === 'rewrite') {
        const rewritePanel = root.querySelector('[data-mode-panel="rewrite"]');
        const tone = getSelectedChip(rewritePanel, 'tone') || 'friendly';
        prompt = RB.buildRewritePrompt(
          input,
          tone,
          {
            enabled: translateToggle.checked,
            fromLanguage: getSelectedChip(rewritePanel, 'fromLanguage') || 'auto',
            toLanguage: getSelectedChip(rewritePanel, 'toLanguage') || 'en'
          },
          extra,
          voiceSamples
        );
      } else if (currentMode === 'format') {
        const formatPanel = root.querySelector('[data-mode-panel="format"]');
        prompt = RB.buildFormatPrompt(
          getSelectedChip(formatPanel, 'formatType') || 'markdown',
          input,
          extra
        );
      } else {
        const replyPanel = root.querySelector('[data-mode-panel="reply"]');
        prompt = RB.buildReplyPrompt({
          channel: getSelectedChip(replyPanel, 'channel') || 'message',
          intent: getSelectedChip(replyPanel, 'intent') || 'general',
          tone: getSelectedChip(replyPanel, 'tone') || 'professional',
          length: getSelectedChip(replyPanel, 'length') || 'medium',
          outputLanguage: getSelectedChip(replyPanel, 'outputLanguage') || 'en',
          incomingText: input,
          notes,
          extraInstructions: extra,
          voiceSamples
        });
        if (!prompt) {
          setStatus(RB.t('panel.emptyReply'), true);
          return;
        }
      }

      setBusy(true);
      processBtn.innerHTML = `<span class="rb-spinner" aria-hidden="true"></span>${escapeHtml(RB.t('panel.processing'))}`;
      setStatus(RB.t('panel.processing'));

      try {
        const text = await RB.complete(prompt);
        if (!text) {
          setStatus(RB.t('panel.emptyResponse'), true);
          return;
        }
        const parsed =
          currentMode === 'format' || !RB.parseVariants
            ? [text]
            : RB.parseVariants(text);
        if (!parsed.length) {
          setStatus(RB.t('panel.emptyResponse'), true);
          return;
        }
        setStatus('');
        showVariants(parsed, currentMode === 'rewrite' ? input : '');
        await copyCurrentResult();
      } catch (error) {
        console.error('Error:', error);
        showResult('');
        setStatus(RB.formatCompleteError ? RB.formatCompleteError(error) : RB.t('panel.error', error.message || ''), true);
      } finally {
        setBusy(false);
        processBtn.textContent = RB.t('action.' + currentMode) || RB.t('action.process');
      }
    });

    async function refreshApiStatus() {
      if (!apiStatusEl) return;
      try {
        const backends = RB.resolveActiveBackends
          ? await RB.resolveActiveBackends()
          : RB.resolveChatBackends(await RB.getKeysByProvider());
        if (backends.length) {
          apiStatusEl.hidden = true;
          apiStatusEl.className = 'rb-api-status';
          apiStatusEl.textContent = '';
        } else {
          apiStatusEl.hidden = false;
          apiStatusEl.className = 'rb-api-status is-warning';
          apiStatusEl.innerHTML = RB.t('panel.apiMissing');
        }
      } catch (e) {
        apiStatusEl.hidden = false;
        apiStatusEl.className = 'rb-api-status is-error';
        apiStatusEl.textContent = RB.t('panel.apiCheckError');
      }
    }

    async function refreshPrefs() {
      if (!RB.getPrefs) return;
      try {
        const prefs = await RB.getPrefs();
        extraByMode = (prefs && prefs.extraInstructions) || extraByMode;
        voiceSamples = (prefs && prefs.voiceSamples) || '';
        extraHintEl.hidden = !String(extraFor(currentMode)).trim();
        voiceHintEl.hidden = !String(voiceSamples).trim();
        if (prefs && prefs.uiLanguage) RB.setLanguage(prefs.uiLanguage);
      } catch (e) {
        /* ignore */
      }
    }

    if (showApiStatus) refreshApiStatus();
    refreshPrefs();
    setMode('rewrite');
    refreshPasteButton();

    setTimeout(() => {
      inputEl.focus();
      const len = inputEl.value.length;
      inputEl.setSelectionRange(len, len);
      inputEl.scrollTop = inputEl.scrollHeight;
    }, 50);

    return {
      root,
      destroy() {
        inputAssist.destroy();
        notesAssist.destroy();
        root.remove();
      },
      setInput(text) {
        inputEl.value = text || '';
        if (refineEl) refineEl.value = '';
        showResult('');
        setStatus('');
        inputAssist.dismissGhost();
        notesAssist.dismissGhost();
        setTimeout(() => {
          inputEl.focus();
          const len = inputEl.value.length;
          inputEl.setSelectionRange(len, len);
        }, 30);
      },
      setPasteBack(next) {
        pasteBack = next || null;
        refreshPasteButton();
      },
      refreshApiStatus,
      refreshPrefs,
      openSettings(tab) {
        showSettingsView(tab || 'keys');
      },
      showWriting() {
        showWritingView();
      }
    };
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
