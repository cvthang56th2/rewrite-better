/* Parse multi-variant LLM output and word-level diffs. */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function stringifyVariant(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      if (typeof value.text === 'string') return value.text;
      if (typeof value.content === 'string') return value.content;
      if (typeof value.variant === 'string') return value.variant;
    }
    return '';
  }

  function uniqueTrimmed(values) {
    const seen = {};
    const out = [];
    (values || []).forEach((value) => {
      const text = stringifyVariant(value).trim();
      if (!text || seen[text]) return;
      seen[text] = true;
      out.push(text);
    });
    return out.slice(0, 3);
  }

  function repairJson(json) {
    let out = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < json.length; i += 1) {
      const ch = json.charAt(i);
      if (inString) {
        if (escaped) {
          out += ch;
          escaped = false;
          continue;
        }
        if (ch === '\\') {
          out += ch;
          escaped = true;
          continue;
        }
        if (ch === '"') {
          out += ch;
          inString = false;
          continue;
        }
        if (ch === '\n' || ch === '\r') {
          out += '\\n';
          continue;
        }
        if (ch === '\t') {
          out += '\\t';
          continue;
        }
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = true;
        out += ch;
        continue;
      }
      if (ch === ',') {
        let j = i + 1;
        while (j < json.length && /\s/.test(json.charAt(j))) j += 1;
        const next = json.charAt(j);
        if (next === ']' || next === '}') continue;
      }
      out += ch;
    }
    return out;
  }

  function parseObject(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function extractJson(raw) {
    const source = String(raw || '');
    const start = source.indexOf('{');
    const end = source.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    const slice = source.slice(start, end + 1);
    return parseObject(slice) || parseObject(repairJson(slice));
  }

  RB.parseVariants = function (raw) {
    const obj = extractJson(raw);
    if (obj && Array.isArray(obj.variants)) {
      return uniqueTrimmed(obj.variants);
    }
    const text = String(raw || '').trim();
    if (!text) return [];
    return uniqueTrimmed([text]);
  };

  function stripCodeFence(text) {
    let s = String(text || '').trim();
    if (s.indexOf('```') !== 0) return s;
    s = s.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/```$/, '').trim();
    return s;
  }

  RB.parseRefineText = function (raw) {
    const parsed = RB.parseVariants(raw);
    return parsed.length ? stripCodeFence(parsed[0]) : '';
  };

  RB.replaceSelectedVariant = function (variants, index, text) {
    const next = Array.isArray(variants) ? variants.slice() : [];
    const refined = String(text || '').trim();
    if (!refined || index < 0 || index >= next.length) return next;
    next[index] = refined;
    return next;
  };

  RB.emptyRefineHistories = function (count) {
    const n = Math.max(0, Number(count) || 0);
    const out = [];
    for (let i = 0; i < n; i += 1) out.push([]);
    return out;
  };

  RB.refineHistoryForVariant = function (histories, index) {
    const list = Array.isArray(histories) ? histories : [];
    const i = Number(index) || 0;
    return Array.isArray(list[i]) ? list[i].slice() : [];
  };

  RB.appendRefineTurn = function (histories, index, userText, assistantText) {
    const i = Number(index) || 0;
    const next = Array.isArray(histories)
      ? histories.map((thread) => (Array.isArray(thread) ? thread.slice() : []))
      : [];
    while (next.length <= i) next.push([]);
    const user = String(userText || '').trim();
    const assistant = String(assistantText || '').trim();
    if (user) next[i].push({ role: 'user', text: user });
    if (assistant) next[i].push({ role: 'assistant', text: assistant });
    return next;
  };

  function tokenize(text) {
    return String(text || '')
      .split(/(\s+)/)
      .filter((token) => token.length);
  }

  RB.diffWords = function (original, next) {
    const a = tokenize(original);
    const b = tokenize(next);
    if (!a.length && !b.length) return [];
    if (a.join('') === b.join('')) {
      return [{ type: 'equal', text: a.join('') }];
    }

    const n = a.length;
    const m = b.length;
    if (n * m > 40000) {
      const parts = [];
      if (String(original || '')) parts.push({ type: 'delete', text: String(original) });
      if (String(next || '')) parts.push({ type: 'insert', text: String(next) });
      return parts;
    }

    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        dp[i + 1][j + 1] =
          a[i] === b[j] ? dp[i][j] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const rev = [];
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        rev.push({ type: 'equal', text: a[i - 1] });
        i--;
        j--;
      } else if (dp[i][j - 1] >= dp[i - 1][j]) {
        rev.push({ type: 'insert', text: b[j - 1] });
        j--;
      } else {
        rev.push({ type: 'delete', text: a[i - 1] });
        i--;
      }
    }
    while (i > 0) {
      rev.push({ type: 'delete', text: a[--i] });
    }
    while (j > 0) {
      rev.push({ type: 'insert', text: b[--j] });
    }

    const parts = [];
    for (let k = rev.length - 1; k >= 0; k--) {
      const piece = rev[k];
      const last = parts[parts.length - 1];
      if (last && last.type === piece.type) last.text += piece.text;
      else parts.push({ type: piece.type, text: piece.text });
    }
    return parts;
  };

  RB.hasVisibleDiff = function (parts) {
    return (parts || []).some((part) => part && part.type !== 'equal' && String(part.text || '').length);
  };

  RB.renderDiffHtml = function (parts) {
    return (parts || [])
      .map((part) => {
        const text = escapeHtml(part && part.text);
        if (part.type === 'delete') return '<del>' + text + '</del>';
        if (part.type === 'insert') return '<ins>' + text + '</ins>';
        return text;
      })
      .join('');
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
