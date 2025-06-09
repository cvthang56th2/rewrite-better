
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
      func: (text) => {
        navigator.clipboard.writeText(text);
        alert("Selected text copied. Open Rewrite Better to process.");
      },
      args: [info.selectionText]
    });
  }
});
