const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
assert.deepStrictEqual(snapshot(queued.context.vaq.map((item) => Array.from(item))), [
  ['event', { name: 'download_mac' }],
]);

const events = [];
const hooked = load({
  va(type, payload) {
    events.push({ type, payload });
  },
});
hooked.api.track('download_win');
assert.deepStrictEqual(snapshot(events), [{ type: 'event', payload: { name: 'download_win' } }]);

hooked.api.track('');
hooked.api.track(null);
assert.strictEqual(events.length, 1);

const clicks = [];
const bound = load({
  va(type, payload) {
    clicks.push({ type, payload });
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
  { type: 'event', payload: { name: 'download_mac' } },
  { type: 'event', payload: { name: 'download_win' } },
  { type: 'event', payload: { name: 'download_chrome' } },
]);

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const privacyHtml = fs.readFileSync(path.join(__dirname, 'privacy.html'), 'utf8');
for (const html of [indexHtml, privacyHtml]) {
  assert.ok(html.includes('/_vercel/insights/script.js'));
  assert.ok(html.includes('analytics.js'));
}
assert.strictEqual((indexHtml.match(/data-download="mac"/g) || []).length, 2);
assert.strictEqual((indexHtml.match(/data-download="win"/g) || []).length, 2);
assert.strictEqual((indexHtml.match(/data-download="chrome"/g) || []).length, 1);

console.log('web/analytics.test.js ok');
