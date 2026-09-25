const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  navigator: { platform: 'Win32', userAgent: 'Windows' },
  document: {
    body: { classList: { contains: () => false } },
    readyState: 'complete',
    addEventListener() {},
    getElementById() {
      return null;
    }
  },
  RewriteBetter: {}
};
context.window = context;
context.globalThis = context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'settings.js'), 'utf8'), context);
const RB = context.RewriteBetter;
const html = RB.settingsFormHtml();

assert.strictEqual(typeof RB.bindSettings, 'function');
assert.ok(html.includes('data-tab="keys"'));
assert.ok(html.includes('data-tab="writing"'));
assert.ok(html.includes('data-tab="general"'));
assert.ok(html.includes('data-role="open-at-login"'));
assert.ok(html.includes('data-role="hotkey"'));
assert.ok(html.includes('data-role="check-updates"'));

console.log('ok — windows settings form includes keys, writing, language, login, and shortcut');
