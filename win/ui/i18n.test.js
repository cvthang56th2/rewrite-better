const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'i18n.js'), 'utf8');
const context = { RewriteBetter: undefined, window: undefined, self: undefined };
context.globalThis = context;
vm.runInNewContext(code, context);
const RB = context.RewriteBetter;

assert.ok(RB, 'RewriteBetter should be defined');
assert.strictEqual(RB.parseLanguage(undefined), 'en');
assert.strictEqual(RB.parseLanguage('fr'), 'en');
assert.strictEqual(RB.parseLanguage('vi'), 'vi');
assert.strictEqual(RB.t('settings.save', 'en'), 'Save');
assert.strictEqual(RB.t('settings.save', 'vi'), 'Lưu');
assert.strictEqual(RB.t('__missing__', 'vi'), '__missing__');
assert.strictEqual(
  RB.t('error.http', 'en', '418', 'teapot'),
  '❌ AI API error: HTTP 418 - teapot'
);

const enKeys = Object.keys(RB.I18N.en).sort();
const viKeys = Object.keys(RB.I18N.vi).sort();
assert.deepStrictEqual(enKeys, viKeys, 'en and vi catalogs must have the same keys');
assert.ok(enKeys.length > 10, 'catalog should include UI strings');

console.log(`ok — ${enKeys.length} keys, default English, vi lookup, fallback`);
