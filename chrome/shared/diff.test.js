const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const context = { RewriteBetter: undefined, window: undefined, self: undefined };
  context.globalThis = context;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'diff.js'), 'utf8'), context);
  return context.RewriteBetter;
}

const RB = load();

function list(value) {
  return Array.from(value);
}

function parts(value) {
  return Array.from(value).map((part) => ({ type: part.type, text: part.text }));
}

assert.deepStrictEqual(list(RB.parseVariants('{"variants":["A","B","C"]}')), ['A', 'B', 'C']);
assert.deepStrictEqual(
  list(RB.parseVariants('```json\n{"variants":["one","two","three"]}\n```')),
  ['one', 'two', 'three']
);
assert.deepStrictEqual(list(RB.parseVariants('just a rewrite')), ['just a rewrite']);
assert.deepStrictEqual(list(RB.parseVariants('{"variants":["keep","keep","other"]}')), ['keep', 'other']);
assert.deepStrictEqual(list(RB.parseVariants('{"variants":["a","b","c","d"]}')), ['a', 'b', 'c']);
assert.deepStrictEqual(list(RB.parseVariants('{"variants":["","  "]}')), []);
assert.deepStrictEqual(list(RB.parseVariants('  {"variants":[" spaced "]}  extra')), ['spaced']);

const equal = parts(RB.diffWords('hello world', 'hello world'));
assert.deepStrictEqual(equal, [{ type: 'equal', text: 'hello world' }]);

const swapped = RB.diffWords('send the file', 'send the docs');
assert.ok(swapped.some((p) => p.type === 'delete' && p.text.includes('file')));
assert.ok(swapped.some((p) => p.type === 'insert' && p.text.includes('docs')));

const html = RB.renderDiffHtml([
  { type: 'equal', text: 'send ' },
  { type: 'delete', text: 'file' },
  { type: 'insert', text: 'docs' }
]);
assert.strictEqual(html, 'send <del>file</del><ins>docs</ins>');
assert.ok(RB.hasVisibleDiff(swapped));
assert.ok(!RB.hasVisibleDiff(equal));

console.log('ok — parse variants and word-level diff');
