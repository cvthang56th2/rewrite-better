const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'release-assets.js'), 'utf8');
const context = { module: { exports: {} } };
context.globalThis = context;
vm.runInNewContext(code, context);
const {
  pickDesktopAssets,
  latestPublishedRelease,
  desktopDownloadUrls,
  GITHUB_RELEASES_LATEST,
  publishedReleases,
  shouldShowReleaseBanner,
  releaseDownloadUrls,
  formatReleaseDate,
  fillReleaseBanner,
  renderReleaseNotes,
  readReleaseCache,
  writeReleaseCache,
  shouldUseReleaseCache,
  RELEASE_CACHE_KEY,
  RELEASE_CACHE_TTL_MS,
  DISMISSED_RELEASE_KEY,
} = context.module.exports;

function asset(name, url) {
  return { name, browser_download_url: url };
}

const empty = pickDesktopAssets({ assets: [] });
assert.strictEqual(empty.mac, null);
assert.strictEqual(empty.win, null);
assert.strictEqual(pickDesktopAssets(null).mac, null);

const hardcoded = pickDesktopAssets({
  assets: [
    asset('RewriteBetter-1.0.dmg', 'https://example/mac.dmg'),
    asset('RewriteBetter-1.0.0-x64-setup.exe', 'https://example/win.exe'),
  ],
});
assert.strictEqual(hardcoded.mac, 'https://example/mac.dmg');
assert.strictEqual(hardcoded.win, 'https://example/win.exe');

const tauri = pickDesktopAssets({
  assets: [
    asset('Rewrite Better_1.0.0_x64-setup.exe', 'https://example/tauri.exe'),
    asset('RewriteBetter-1.0.dmg', 'https://example/mac.dmg'),
  ],
});
assert.strictEqual(tauri.mac, 'https://example/mac.dmg');
assert.strictEqual(tauri.win, 'https://example/tauri.exe');

const prefersSetup = pickDesktopAssets({
  assets: [
    asset('helper.exe', 'https://example/helper.exe'),
    asset('RewriteBetter-setup.exe', 'https://example/setup.exe'),
  ],
});
assert.strictEqual(prefersSetup.win, 'https://example/setup.exe');

const ignoresUpdaterSidecars = pickDesktopAssets({
  assets: [
    asset('latest.json', 'https://example/latest.json'),
    asset('Rewrite Better_1.2.0_x64-setup.exe.sig', 'https://example/setup.exe.sig'),
    asset('Rewrite Better_1.2.0_x64-setup.exe', 'https://example/setup.exe'),
  ],
});
assert.strictEqual(ignoresUpdaterSidecars.win, 'https://example/setup.exe');

assert.strictEqual(latestPublishedRelease(null), null);
assert.strictEqual(
  latestPublishedRelease({ tag_name: 'v1', draft: false, prerelease: false }).tag_name,
  'v1',
);

const published = latestPublishedRelease([
  { tag_name: 'v2-draft', draft: true, prerelease: false },
  { tag_name: 'v2-beta', draft: false, prerelease: true },
  { tag_name: 'v1', draft: false, prerelease: false },
]);
assert.strictEqual(published.tag_name, 'v1');

assert.ok(GITHUB_RELEASES_LATEST.includes('/releases/latest'));

const withLocal = desktopDownloadUrls({
  localMac: 'downloads/RewriteBetter.dmg',
  localWin: 'downloads/RewriteBetter-setup.exe',
  remote: { assets: [asset('RewriteBetter-1.0.dmg', 'https://example/mac.dmg')] },
});
assert.strictEqual(withLocal.mac, 'downloads/RewriteBetter.dmg');
assert.strictEqual(withLocal.win, 'downloads/RewriteBetter-setup.exe');

const remoteOnly = desktopDownloadUrls({
  localMac: null,
  localWin: null,
  remote: {
    assets: [
      asset('RewriteBetter-1.0.dmg', 'https://example/mac.dmg'),
      asset('Rewrite Better_1.0.0_x64-setup.exe', 'https://example/win.exe'),
    ],
  },
});
assert.strictEqual(remoteOnly.mac, 'https://example/mac.dmg');
assert.strictEqual(remoteOnly.win, 'https://example/win.exe');

const missing = desktopDownloadUrls({ localMac: null, localWin: null, remote: { assets: [] } });
assert.strictEqual(missing.mac, GITHUB_RELEASES_LATEST);
assert.strictEqual(missing.win, GITHUB_RELEASES_LATEST);

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
assert.ok(
  !html.includes('/releases/latest/download/'),
  'download buttons should not hardcode GitHub asset filenames that 404',
);
assert.ok(html.includes('release-assets.js'));
assert.ok(html.includes('data-release-banner'));
assert.ok(html.includes('releases.html'));
assert.strictEqual(DISMISSED_RELEASE_KEY, 'rb-dismissed-release');

const listed = publishedReleases([
  { tag_name: 'v2-draft', draft: true, prerelease: false },
  { tag_name: 'v2-beta', draft: false, prerelease: true },
  { tag_name: 'v2', draft: false, prerelease: false },
  { tag_name: 'v1', draft: false, prerelease: false },
]);
assert.deepStrictEqual(
  listed.map((release) => release.tag_name),
  ['v2', 'v1'],
);
assert.strictEqual(JSON.stringify(publishedReleases(null)), "[]");
assert.strictEqual(JSON.stringify(publishedReleases({ message: "Not Found" })), "[]");

assert.strictEqual(shouldShowReleaseBanner('', null), false);
assert.strictEqual(shouldShowReleaseBanner('v2', null), true);
assert.strictEqual(shouldShowReleaseBanner('v2', 'v2'), false);
assert.strictEqual(shouldShowReleaseBanner('v3', 'v2'), true);

const row = releaseDownloadUrls({
  html_url: 'https://github.com/cvthang56th2/rewrite-better/releases/tag/v1',
  assets: [asset('RewriteBetter-1.0.dmg', 'https://example/mac.dmg')],
});
assert.strictEqual(row.mac, 'https://example/mac.dmg');
assert.strictEqual(row.win, 'https://github.com/cvthang56th2/rewrite-better/releases/tag/v1');

assert.ok(formatReleaseDate('2026-09-18T00:00:00Z', 'en').includes('2026'));
assert.strictEqual(formatReleaseDate('not-a-date', 'en'), '');
assert.strictEqual(
  fillReleaseBanner('{tag} is out · {date}', { tag: 'v1.0.6', date: '18 Sep 2026' }),
  'v1.0.6 is out · 18 Sep 2026',
);
assert.strictEqual(fillReleaseBanner('{tag} is out · {date}', { tag: 'v1.0.6', date: '' }), 'v1.0.6 is out');

const notes = renderReleaseNotes(
  '## What\'s Changed\n* Fix banner by @thang in https://github.com/cvthang56th2/rewrite-better/pull/1\n\n**Full Changelog**: https://example.com/compare',
);
assert.ok(notes.includes('<h3>'));
assert.ok(notes.includes('What\'s Changed'));
assert.ok(notes.includes('<li>'));
assert.ok(notes.includes('href="https://github.com/cvthang56th2/rewrite-better/pull/1"'));
assert.ok(notes.includes('<strong>Full Changelog</strong>'));
assert.ok(!renderReleaseNotes('<script>alert(1)</script>').includes('<script>'));
assert.strictEqual(renderReleaseNotes(''), '');

function memoryStorage() {
  const data = {};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

const storage = memoryStorage();
const payload = [{ tag_name: 'v2' }];
assert.strictEqual(readReleaseCache(storage, 1000), null);
writeReleaseCache(storage, payload, 1000);
assert.deepStrictEqual(JSON.parse(JSON.stringify(readReleaseCache(storage, 1000))), payload);
assert.ok(storage.getItem(RELEASE_CACHE_KEY));
assert.strictEqual(readReleaseCache(storage, 1000 + RELEASE_CACHE_TTL_MS + 1), null);

assert.strictEqual(
  shouldUseReleaseCache([{ tag_name: 'v1.0.5', draft: false, prerelease: false }], { tag_name: 'v1.0.5' }),
  true,
);
assert.strictEqual(
  shouldUseReleaseCache([{ tag_name: 'v1.0.5', draft: false, prerelease: false }], { tag_name: 'v1.0.6' }),
  false,
);
assert.strictEqual(shouldUseReleaseCache(null, { tag_name: 'v1.0.6' }), false);
assert.strictEqual(shouldUseReleaseCache([{ tag_name: 'v1.0.6' }], null), false);

const releasesPage = fs.readFileSync(path.join(__dirname, 'releases.html'), 'utf8');
assert.ok(releasesPage.includes('data-release-list'));
assert.ok(releasesPage.includes('release-assets.js'));

console.log('web/release-assets.test.js ok');
