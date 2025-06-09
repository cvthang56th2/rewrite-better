
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "rewriteSelection",
    title: "Rewrite with Rewrite Better",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "rewriteSelection") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (selectedText) => {
        // Gửi message tới content script để hiển thị popup tại vị trí chuột
        window.postMessage({
          type: 'REWRITE_BETTER_SHOW_POPUP',
          selectedText: selectedText
        }, '*');
      },
      args: [info.selectionText]
    });
  }
});

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "open-rewrite-popup") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get selected text
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        // If no text selected, show popup with empty content
        window.postMessage({
          type: 'REWRITE_BETTER_SHOW_POPUP',
          selectedText: selectedText || ''
        }, '*');
      }
    });
  }
});
