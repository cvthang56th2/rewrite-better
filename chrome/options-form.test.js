const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(file) {
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
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
  return context.RewriteBetter;
}

function assertTabs(html, label) {
  assert.ok(html.includes('data-tab="keys"'), label + ' keys tab');
  assert.ok(html.includes('data-tab="writing"'), label + ' writing tab');
  assert.ok(html.includes('data-tab="general"'), label + ' general tab');
  assert.ok(html.includes('data-role="ui-language"'), label + ' language');
  assert.ok(html.includes('data-role="extra-rewrite"'), label + ' rewrite extra');
  assert.ok(html.includes('data-role="voice-samples"'), label + ' voice');
}

const chrome = load(path.join(__dirname, 'options.js'));
assert.strictEqual(typeof chrome.bindSettings, 'function');
assertTabs(chrome.settingsFormHtml(), 'chrome');
assert.ok(!chrome.settingsFormHtml().includes('data-role="hotkey"'));

console.log('ok — chrome settings form has Keys, Writing, and General');
