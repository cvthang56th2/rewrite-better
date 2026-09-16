document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('optionsForm');
  const apiKeyInput = document.getElementById('apiKey');
  const successMessage = document.getElementById('successMessage');
  const languageSelect = document.getElementById('uiLanguage');

  applyI18n();
  loadSavedSettings();

  languageSelect.addEventListener('change', function () {
    const lang = RewriteBetter.setLanguage(languageSelect.value);
    chrome.storage.sync.set({ uiLanguage: lang }, function () {
      applyI18n();
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    saveSettings();
  });

  function applyI18n() {
    document.documentElement.lang = RewriteBetter.uiLanguage;
    document.title = RewriteBetter.t('options.title');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = RewriteBetter.t(el.dataset.i18n);
    });
  }

  function showSuccessMessage() {
    successMessage.style.display = 'block';
    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  }

  function chromeUnavailable() {
    return typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync;
  }

  function loadSavedSettings() {
    if (chromeUnavailable()) {
      alert(RewriteBetter.t('options.chromeMissing'));
      return;
    }

    chrome.storage.sync.get(['groqApiKey', 'uiLanguage'], function (result) {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        return;
      }
      if (result.groqApiKey) {
        apiKeyInput.value = result.groqApiKey;
      }
      languageSelect.value = RewriteBetter.setLanguage(result.uiLanguage);
      applyI18n();
    });
  }

  function saveSettings() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      alert(RewriteBetter.t('options.needKey'));
      return;
    }

    if (!apiKey.startsWith('gsk_')) {
      alert(RewriteBetter.t('options.invalidKey'));
      return;
    }

    if (chromeUnavailable()) {
      alert(RewriteBetter.t('options.storageMissing'));
      return;
    }

    chrome.storage.sync.set(
      {
        groqApiKey: apiKey,
        uiLanguage: RewriteBetter.setLanguage(languageSelect.value)
      },
      function () {
        if (chrome.runtime.lastError) {
          alert(RewriteBetter.t('options.saveError', chrome.runtime.lastError.message));
        } else {
          applyI18n();
          showSuccessMessage();
        }
      }
    );
  }

  apiKeyInput.addEventListener('input', function () {
    const value = this.value.trim();
    if (value && !value.startsWith('gsk_')) {
      this.style.borderColor = '#e74c3c';
    } else {
      this.style.borderColor = '#e0e6ed';
    }
  });
});
