(function (root) {
  root.va =
    root.va ||
    function () {
      (root.vaq = root.vaq || []).push(arguments);
    };

  function track(name) {
    if (!name) return;
    root.va("event", { name });
  }

  function bindDownloadClicks(rootEl) {
    const scope = rootEl || (typeof document !== "undefined" ? document : null);
    if (!scope || typeof scope.querySelectorAll !== "function") return;
    scope.querySelectorAll("[data-download]").forEach((el) => {
      el.addEventListener("click", () => {
        const platform = el.getAttribute("data-download");
        if (platform) track(`download_${platform}`);
      });
    });
  }

  const api = { track, bindDownloadClicks };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RewriteBetterWeb = Object.assign(root.RewriteBetterWeb || {}, api);

  if (typeof document !== "undefined") bindDownloadClicks(document);
})(typeof globalThis !== "undefined" ? globalThis : this);
