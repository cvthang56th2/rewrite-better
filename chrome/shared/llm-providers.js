/* Multi-provider chat backends with quota failover (same order as the macOS app). */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  RB.PROVIDER_SPECS = {
    gemini: {
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      defaultModel: 'gemini-flash-latest',
      defaultMaxTokens: 8192
    },
    groq: {
      baseURL: 'https://api.groq.com/openai/v1',
      defaultModel: 'openai/gpt-oss-20b',
      defaultMaxTokens: 4096
    },
    cerebras: {
      baseURL: 'https://api.cerebras.ai/v1',
      defaultModel: 'gpt-oss-120b',
      defaultMaxTokens: 8192
    },
    openai: {
      baseURL: 'https://api.openai.com/v1',
      defaultModel: 'gpt-4o-mini',
      defaultMaxTokens: 16384
    }
  };

  RB.FALLBACK_ORDER = ['gemini', 'groq', 'cerebras'];

  RB.parseApiKeys = function () {
    const keys = [];
    const seen = new Set();
    for (let i = 0; i < arguments.length; i++) {
      const value = arguments[i] == null ? '' : String(arguments[i]);
      value.split(/[,;\n\r]/).forEach((part) => {
        const key = part.trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        keys.push(key);
      });
    }
    return keys;
  };

  function fingerprint(apiKey) {
    let hash = 5381n;
    const bytes = typeof TextEncoder === 'undefined'
      ? Buffer.from(apiKey, 'utf8')
      : new TextEncoder().encode(apiKey);
    for (const byte of bytes) {
      hash = ((hash << 5n) + hash + BigInt(byte)) & 0xffffffffffffffffn;
    }
    return hash.toString(16);
  }

  function buildBackends(provider, raw) {
    const spec = RB.PROVIDER_SPECS[provider];
    if (!spec) return [];
    return RB.parseApiKeys(raw).map((apiKey, index) => ({
      id: `${provider}#${index + 1}`,
      skipId: `${provider}:${fingerprint(apiKey)}`,
      provider,
      keyIndex: index + 1,
      apiKey,
      baseURL: spec.baseURL,
      model: spec.defaultModel,
      defaultMaxTokens: spec.defaultMaxTokens
    }));
  }

  RB.normalizeEnabledProviders = function (raw) {
    const out = { gemini: true, groq: true, cerebras: true, openai: true };
    if (!raw || typeof raw !== 'object') return out;
    Object.keys(out).forEach((key) => {
      if (raw[key] === false) out[key] = false;
    });
    return out;
  };

  RB.resolveChatBackends = function (keysByProvider, enabledProviders) {
    const source = keysByProvider || {};
    const enabled = RB.normalizeEnabledProviders(enabledProviders);
    const chain = RB.FALLBACK_ORDER.flatMap((provider) =>
      enabled[provider] ? buildBackends(provider, source[provider] || '') : []
    );
    const openai = enabled.openai ? buildBackends('openai', source.openai || '') : [];
    if (chain.length) {
      return openai.length ? chain.concat(openai) : chain;
    }
    return openai;
  };

  function matchesQuotaText(message) {
    const lower = String(message || '').toLowerCase();
    if (/payment required|visit your billing/.test(lower)) return true;
    return /quota|rate.?limit|resource.?exhausted|too many requests|insufficient_quota/.test(lower);
  }

  RB.isQuotaError = function (error) {
    const status = error && error.status;
    if (status === 429 || status === 402) return true;
    return matchesQuotaText(error && error.message);
  };

  /// Auth / quota failures rest until tomorrow — not blips like network errors.
  RB.isStickySkipError = function (error) {
    if (RB.isQuotaError(error)) return true;
    const status = error && error.status;
    return status === 401 || status === 403 || status === 404;
  };

  function codedError(code, message) {
    const err = new Error(message || code);
    err.code = code;
    return err;
  }

  RB.callWithQuotaFallback = async function (backends, skipped, call) {
    if (!backends || !backends.length) {
      throw codedError('missingKey');
    }
    const active = backends.filter((backend) => !skipped.has(backend.skipId));
    if (!active.length) {
      throw codedError('allKeysResting');
    }
    let lastError;
    for (let i = 0; i < active.length; i++) {
      const backend = active[i];
      try {
        return await call(backend);
      } catch (error) {
        lastError = error;
        if (RB.isStickySkipError(error)) {
          skipped.add(backend.skipId);
        }
        if (i + 1 < active.length) continue;
        throw error;
      }
    }
    throw lastError || codedError('emptyResponse');
  };

  RB.chatCompletionExtras = function (provider, model) {
    const id = String(model || '').toLowerCase();
    if (provider === 'groq') {
      if (id.includes('qwen')) {
        return { reasoning_effort: 'none', reasoning_format: 'parsed' };
      }
      if (id.includes('gpt-oss')) {
        return { reasoning_effort: 'low', include_reasoning: false };
      }
      return {};
    }
    if (provider === 'cerebras') {
      if (id.includes('qwen')) return { reasoning_effort: 'none' };
      if (id.includes('gpt-oss')) return { reasoning_effort: 'low' };
      return {};
    }
    return {};
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis);
