(function (root) {
  const GITHUB_RELEASES_LATEST = "https://github.com/cvthang56th2/rewrite-better/releases/latest";
  const RELEASE_CACHE_KEY = "rb-releases-cache";
  const RELEASE_CACHE_TTL_MS = 10 * 60 * 1000;
  const DISMISSED_RELEASE_KEY = "rb-dismissed-release";

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

  function asReleaseList(payload) {
    if (Array.isArray(payload)) return payload.filter(Boolean);
    if (payload && typeof payload === "object" && (payload.tag_name || payload.name || payload.assets)) {
      return [payload];
    }
    return [];
  }

  function publishedReleases(payload) {
    return asReleaseList(payload).filter((release) => release && !release.draft && !release.prerelease);
  }

  function latestPublishedRelease(payload) {
    const list = asReleaseList(payload);
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

  function releaseDownloadUrls(release) {
    const picked = pickDesktopAssets(release);
    const page = (release && release.html_url) || GITHUB_RELEASES_LATEST;
    return {
      mac: picked.mac || page,
      win: picked.win || page,
    };
  }

  function shouldShowReleaseBanner(latestTag, dismissedTag) {
    const tag = String(latestTag || "").trim();
    if (!tag) return false;
    return tag !== String(dismissedTag || "").trim();
  }

  function shouldUseReleaseCache(cached, latest) {
    const cachedTag = (publishedReleases(cached)[0] || {}).tag_name;
    const latestTag = latest && latest.tag_name;
    if (!cachedTag || !latestTag) return false;
    return String(cachedTag).trim() === String(latestTag).trim();
  }

  function formatReleaseDate(iso, lang) {
    const date = new Date(iso);
    if (!iso || Number.isNaN(date.getTime())) return "";
    const locale = lang === "vi" ? "vi-VN" : "en-GB";
    return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }

  function fillReleaseBanner(template, { tag, date } = {}) {
    let out = String(template || "").replace(/\{tag\}/g, tag || "");
    const when = String(date || "").trim();
    if (when) out = out.replace(/\{date\}/g, when);
    else out = out.replace(/\s*[·•|]\s*\{date\}/g, "").replace(/\{date\}/g, "");
    return out.replace(/\s+/g, " ").trim();
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inlineMarkdown(text) {
    let out = escapeHtml(text);
    out = out.replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
    );
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(
      /(^|[\s>(])(https?:\/\/[^\s<]+)/g,
      '$1<a href="$2" rel="noopener noreferrer" target="_blank">$2</a>',
    );
    return out;
  }

  function renderReleaseNotes(markdown) {
    const source = String(markdown || "")
      .replace(/\r\n/g, "\n")
      .trim();
    if (!source) return "";
    const html = [];
    let items = [];
    const flushList = () => {
      if (!items.length) return;
      html.push(`<ul>${items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      items = [];
    };
    source.split("\n").forEach((line) => {
      const heading = line.match(/^(#{1,3})\s+(.+)$/);
      const bullet = line.match(/^\s*[-*]\s+(.+)$/);
      if (heading) {
        flushList();
        const tag = heading[1].length >= 3 ? "h4" : "h3";
        html.push(`<${tag}>${inlineMarkdown(heading[2])}</${tag}>`);
        return;
      }
      if (bullet) {
        items.push(bullet[1]);
        return;
      }
      flushList();
      if (!line.trim()) return;
      html.push(`<p>${inlineMarkdown(line)}</p>`);
    });
    flushList();
    return html.join("");
  }

  function readReleaseCache(storage, now = Date.now()) {
    if (!storage || typeof storage.getItem !== "function") return null;
    try {
      const raw = storage.getItem(RELEASE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.expiresAt <= now) return null;
      return parsed.payload == null ? null : parsed.payload;
    } catch {
      return null;
    }
  }

  function writeReleaseCache(storage, payload, now = Date.now()) {
    if (!storage || typeof storage.setItem !== "function") return;
    storage.setItem(
      RELEASE_CACHE_KEY,
      JSON.stringify({
        expiresAt: now + RELEASE_CACHE_TTL_MS,
        payload,
      }),
    );
  }

  const api = {
    GITHUB_RELEASES_LATEST,
    RELEASE_CACHE_KEY,
    RELEASE_CACHE_TTL_MS,
    DISMISSED_RELEASE_KEY,
    pickDesktopAssets,
    publishedReleases,
    latestPublishedRelease,
    desktopDownloadUrls,
    releaseDownloadUrls,
    shouldShowReleaseBanner,
    formatReleaseDate,
    fillReleaseBanner,
    escapeHtml,
    renderReleaseNotes,
    readReleaseCache,
    writeReleaseCache,
    shouldUseReleaseCache,
  };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.RewriteBetterWeb = Object.assign(root.RewriteBetterWeb || {}, api);
})(typeof globalThis !== "undefined" ? globalThis : this);
