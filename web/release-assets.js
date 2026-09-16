(function (root) {
  const GITHUB_RELEASES_LATEST = "https://github.com/cvthang56th2/rewrite-better/releases/latest";

  function pickDesktopAssets(release) {
    const assets = Array.isArray(release && release.assets) ? release.assets : [];
    const urlFor = (predicate) => {
      const hit = assets.find((asset) => predicate(String((asset && asset.name) || "")));
      return (hit && hit.browser_download_url) || null;
    };
    return {
      mac: urlFor((name) => /\.dmg$/i.test(name)),
      win:
        urlFor((name) => /\.exe$/i.test(name) && /setup|nsis|installer/i.test(name)) ||
        urlFor((name) => /\.exe$/i.test(name)),
    };
  }

  function latestPublishedRelease(payload) {
    const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
    return (
      list.find((release) => release && !release.draft && !release.prerelease) ||
      list.find((release) => release && !release.draft) ||
      null
    );
  }

  function desktopDownloadUrls({ localMac, localWin, remote }) {
    const picked = pickDesktopAssets(remote);
    return {
      mac: localMac || picked.mac || GITHUB_RELEASES_LATEST,
      win: localWin || picked.win || GITHUB_RELEASES_LATEST,
    };
  }

  const api = { GITHUB_RELEASES_LATEST, pickDesktopAssets, latestPublishedRelease, desktopDownloadUrls };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RewriteBetterWeb = Object.assign(root.RewriteBetterWeb || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this);
