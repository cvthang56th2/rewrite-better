/* Cursor-like Tab autocomplete + grammar suggestions (same prompts as the macOS app). */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function withVoice(prompt, voiceSamples) {
    if (typeof RB.appendVoiceProfile === 'function') {
      return RB.appendVoiceProfile(prompt, voiceSamples);
    }
    const samples = String(voiceSamples || '').trim();
    if (!samples) return prompt;
    return `${prompt}

--- Writer's voice ---
Match this writer's voice: vocabulary, sentence length, punctuation habits, and any mix of languages. Do not copy sentences verbatim.

${samples}`;
  }

  RB.writingAssistPrompts = {
    autocomplete(prefix, voiceSamples) {
      const trimmed = String(prefix || '').trim();
      const last = trimmed.slice(-1);
      const endsSentence = !trimmed || '.!?…'.indexOf(last) !== -1 || /\n$/.test(prefix);
      const body = endsSentence
        ? `You are a writing autocomplete engine like Cursor Tab.
The writer just finished a sentence or paragraph. Suggest a short natural continuation (1–3 sentences) that could come next.
Match the writer's language and style.
Return ONLY the continuation text to append — no quotes, no explanation, no repeating the existing text.

Existing text:
${prefix}`
        : `You are a writing autocomplete engine like Cursor Tab.
The writer is mid-sentence. Complete the current sentence naturally (and only that sentence ending).
Match the writer's language and style.
Return ONLY the missing suffix to append at the caret — no quotes, no explanation, no repeating text already written.

Text so far:
${prefix}`;
      return withVoice(body, voiceSamples);
    },
    grammarCheck(text, voiceSamples) {
      return withVoice(
        `Review the text for grammar, spelling, clarity, and tone issues.
Return ONLY valid JSON (no markdown) with this shape:
{"issues":[{"kind":"grammar|spelling|tone|clarity","message":"short reason","original":"exact substring from text","replacement":"fixed substring"}]}
Rules:
- "original" MUST be an exact contiguous substring of the input.
- Prefer at most 8 high-value issues.
- If nothing to fix, return {"issues":[]}.

Text:
${text}`,
        voiceSamples
      );
    }
  };

  RB.sanitizeSuggestion = function (raw, prefix) {
    let s = String(raw || '').trim();
    if (s.indexOf('```') === 0) {
      s = s.replace(/```/g, '').trim();
    }
    if (s.charAt(0) === '"' || s.charAt(0) === "'" || s.charAt(0) === '“') {
      s = s.slice(1);
    }
    const last = s.slice(-1);
    if (last === '"' || last === "'" || last === '”') {
      s = s.slice(0, -1);
    }
    const p = String(prefix || '');
    if (p && s.indexOf(p) === 0) {
      s = s.slice(p.length);
    }
    return s;
  };

  RB.parseWritingIssues = function (raw, text) {
    const source = String(raw || '');
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    const jsonString = start !== -1 && end !== -1 ? source.slice(start, end + 1) : source;
    let obj;
    try {
      obj = JSON.parse(jsonString);
    } catch (e) {
      return [];
    }
    const arr = obj && Array.isArray(obj.issues) ? obj.issues : [];
    const haystack = String(text || '');
    const kinds = { grammar: 1, spelling: 1, tone: 1, clarity: 1 };
    return arr
      .map((item, index) => {
        const original = item && item.original != null ? String(item.original) : '';
        const replacement = item && item.replacement != null ? String(item.replacement) : '';
        if (!original || haystack.indexOf(original) === -1) return null;
        const kindRaw = String((item && item.kind) || 'grammar').toLowerCase();
        return {
          id: 'issue-' + index + '-' + original.slice(0, 12),
          kind: kinds[kindRaw] ? kindRaw : 'grammar',
          message: (item && item.message) || kindRaw,
          original,
          replacement
        };
      })
      .filter(Boolean);
  };

  RB.createWritingAssist = function (opts) {
    const options = opts || {};
    const complete = options.complete;
    const onUpdate = options.onUpdate || function () {};
    function voiceSamples() {
      if (typeof options.voiceSamples === 'function') return options.voiceSamples();
      return options.voiceSamples || '';
    }

    let ghostText = '';
    let issues = [];
    let isSuggesting = false;
    let isChecking = false;
    let assistEnabled = false;
    let suggestTimer = null;
    let checkTimer = null;
    let generation = 0;
    let lastSuggestedFor = '';

    function snapshot() {
      return {
        ghostText,
        issues,
        isSuggesting,
        isChecking,
        assistEnabled
      };
    }

    function emit() {
      onUpdate(snapshot());
    }

    function clearTimers() {
      if (suggestTimer) {
        clearTimeout(suggestTimer);
        suggestTimer = null;
      }
      if (checkTimer) {
        clearTimeout(checkTimer);
        checkTimer = null;
      }
    }

    async function fetchSuggestion(text, token) {
      if (!complete || !assistEnabled) return;
      isSuggesting = true;
      emit();
      try {
        const raw = await complete(RB.writingAssistPrompts.autocomplete(text, voiceSamples()), {
          temperature: 0.4,
          maxTokens: 512
        });
        if (token !== generation) return;
        const cleaned = RB.sanitizeSuggestion(raw, text);
        lastSuggestedFor = text;
        ghostText = cleaned;
      } catch (e) {
        if (token === generation) ghostText = '';
      } finally {
        if (token === generation) isSuggesting = false;
        emit();
      }
    }

    async function fetchIssues(text, token) {
      const trimmed = String(text || '').trim();
      if (trimmed.length < 12) {
        issues = [];
        emit();
        return;
      }
      if (!complete) return;
      isChecking = true;
      emit();
      try {
        const raw = await complete(RB.writingAssistPrompts.grammarCheck(text, voiceSamples()), {
          temperature: 0.2,
          maxTokens: 700
        });
        if (token !== generation) return;
        issues = RB.parseWritingIssues(raw, text);
      } catch (e) {
        /* keep prior issues on transient failure */
      } finally {
        if (token === generation) isChecking = false;
        emit();
      }
    }

    return {
      snapshot,
      setEnabled(value) {
        assistEnabled = !!value;
        if (!assistEnabled) {
          generation += 1;
          clearTimers();
          ghostText = '';
          isSuggesting = false;
        }
        emit();
      },
      textDidChange(text, caretAtEnd) {
        ghostText = '';
        if (!assistEnabled || !caretAtEnd) {
          generation += 1;
          clearTimers();
          emit();
          return;
        }
        if (String(text || '').trim().length < 3) {
          generation += 1;
          clearTimers();
          emit();
          return;
        }
        generation += 1;
        const token = generation;
        clearTimers();
        suggestTimer = setTimeout(() => {
          if (text === lastSuggestedFor) return;
          fetchSuggestion(text, token);
        }, 500);
        checkTimer = setTimeout(() => {
          fetchIssues(text, token);
        }, 1600);
        emit();
      },
      dismissGhost() {
        ghostText = '';
        emit();
      },
      acceptGhost() {
        const accepted = ghostText;
        ghostText = '';
        emit();
        return accepted;
      },
      applyIssue(issue, text) {
        const value = String(text || '');
        const original = issue && issue.original;
        if (!original) return value;
        const next = value.replace(original, issue.replacement || '');
        issues = issues.filter((item) => item.id !== issue.id);
        ghostText = '';
        emit();
        return next;
      },
      checkNow(text) {
        generation += 1;
        if (checkTimer) {
          clearTimeout(checkTimer);
          checkTimer = null;
        }
        return fetchIssues(text, generation);
      },
      destroy() {
        generation += 1;
        clearTimers();
      }
    };
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
