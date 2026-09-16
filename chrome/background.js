importScripts('shared/i18n.js');

function syncContextMenu(language) {
  RewriteBetter.setLanguage(language);
  const title = RewriteBetter.t('context.rewrite');
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'rewriteSelection',
      title,
      contexts: ['selection']
    });
  });
}

function loadAndSyncMenu() {
  chrome.storage.sync.get(['uiLanguage'], (result) => {
    syncContextMenu(result && result.uiLanguage);
  });
}

chrome.runtime.onInstalled.addListener(loadAndSyncMenu);
chrome.runtime.onStartup.addListener(loadAndSyncMenu);
loadAndSyncMenu();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.uiLanguage) {
    syncContextMenu(changes.uiLanguage.newValue);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'rewriteSelection') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText) => {
        window.postMessage(
          {
            type: 'REWRITE_BETTER_SHOW_POPUP',
            selectedText: selectedText
          },
          '*'
        );
      },
      args: [info.selectionText]
    });
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'open-rewrite-popup') {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        window.postMessage(
          {
            type: 'REWRITE_BETTER_SHOW_POPUP',
            selectedText: selectedText || ''
          },
          '*'
        );
      }
    });
  }
});
