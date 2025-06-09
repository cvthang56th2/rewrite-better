
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
