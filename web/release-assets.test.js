const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'release-assets.js'), 'utf8');
const context = { module: { exports: {} } };
context.globalThis = context;
vm.runInNewContext(code, context);
const { pickDesktopAssets, latestPublishedRelease, desktopDownloadUrls, GITHUB_RELEASES_LATEST } =
  context.module.exports;

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

console.log('web/release-assets.test.js ok');
