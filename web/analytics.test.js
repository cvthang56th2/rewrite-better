const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const GA_ID = 'G-YH6PG7WBWS';
const code = fs.readFileSync(path.join(__dirname, 'analytics.js'), 'utf8');

function load(extra) {
  const context = { module: { exports: {} }, ...extra };
  context.globalThis = context;
  vm.runInNewContext(code, context);
  return { context, api: context.module.exports };
}

function snapshot(value) {
  return JSON.parse(JSON.stringify(value));
}

const queued = load();
queued.api.track('download_mac');
assert.deepStrictEqual(snapshot(queued.context.dataLayer.map((item) => Array.from(item))), [
  ['event', 'download_mac'],
]);

const events = [];
const hooked = load({
  gtag(command, name) {
    events.push({ command, name });
  },
});
hooked.api.track('download_win');
assert.deepStrictEqual(snapshot(events), [{ command: 'event', name: 'download_win' }]);

hooked.api.track('');
hooked.api.track(null);
assert.strictEqual(events.length, 1);

const clicks = [];
const bound = load({
  gtag(command, name) {
    clicks.push({ command, name });
  },
});
const nodes = ['mac', 'win', 'chrome', ''].map((platform) => {
  const listeners = [];
  return {
    platform,
    listeners,
    getAttribute(name) {
      return name === 'data-download' ? platform : null;
    },
    addEventListener(type, fn) {
      if (type === 'click') listeners.push(fn);
    },
  };
});
bound.api.bindDownloadClicks({
  querySelectorAll(selector) {
    assert.strictEqual(selector, '[data-download]');
    return nodes;
  },
});
nodes.forEach((node) => node.listeners.forEach((fn) => fn()));
assert.deepStrictEqual(snapshot(clicks), [
  { command: 'event', name: 'download_mac' },
  { command: 'event', name: 'download_win' },
  { command: 'event', name: 'download_chrome' },
]);

const htmlFiles = ['index.html', 'privacy.html', 'releases.html'].map((name) =>
  fs.readFileSync(path.join(__dirname, name), 'utf8')
);
for (const html of htmlFiles) {
  assert.ok(html.includes(`googletagmanager.com/gtag/js?id=${GA_ID}`));
  assert.ok(html.includes(`gtag('config', '${GA_ID}')`));
  assert.ok(html.includes('analytics.js'));
  assert.ok(!html.includes('/_vercel/insights/script.js'));
}

const indexHtml = htmlFiles[0];
assert.strictEqual((indexHtml.match(/data-download="mac"/g) || []).length, 2);
assert.strictEqual((indexHtml.match(/data-download="win"/g) || []).length, 2);
assert.strictEqual((indexHtml.match(/data-download="chrome"/g) || []).length, 1);

const privacyMd = fs.readFileSync(path.join(__dirname, '..', 'PRIVACY.md'), 'utf8');
assert.ok(privacyMd.includes('Google Analytics 4'));
assert.ok(!privacyMd.includes('Vercel Web Analytics'));

const siteJs = fs.readFileSync(path.join(__dirname, 'site.js'), 'utf8');
assert.ok(siteJs.includes('Google Analytics 4'));
assert.ok(!siteJs.includes('Vercel Web Analytics'));

console.log('web/analytics.test.js ok');
