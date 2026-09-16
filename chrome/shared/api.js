/* Groq API helpers */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  RB.getApiKey = function () {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined') {
        reject(new Error('Chrome extension APIs are not available. Please make sure the extension is properly loaded.'));
        return;
      }
      if (!chrome.storage || !chrome.storage.sync) {
        reject(new Error('Chrome storage API is not available. Please check extension permissions.'));
        return;
      }
      chrome.storage.sync.get(['groqApiKey'], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result.groqApiKey || null);
        }
      });
    });
  };

  RB.formatApiError = function (status, errorData) {
    switch (status) {
      case 401:
        return RB.t('error.401');
      case 403:
        return RB.t('error.403');
      case 429:
        return RB.t('error.429');
      case 500:
      case 502:
      case 503:
        return RB.t('error.5xx');
      default:
        return RB.t('error.http', String(status), errorData?.error?.message || RB.t('error.unknown'));
    }
  };

  RB.callGroq = async function (prompt, apiKey) {
    const model = RB.MODEL || 'openai/gpt-oss-20b';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(RB.formatApiError(response.status, errorData));
      err.status = response.status;
      err.errorData = errorData;
      throw err;
    }

    const data = await response.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  };

  RB.testApiKey = async function () {
    try {
      const apiKey = await RB.getApiKey();
      if (!apiKey) return false;
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      return response.ok;
    } catch (e) {
      console.error('Error testing API key:', e);
      return false;
    }
  };

  RB.openSettings = function () {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const url = chrome.runtime.getURL('options.html');
      if (chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    }
  };
})(typeof window !== 'undefined' ? window : self);
