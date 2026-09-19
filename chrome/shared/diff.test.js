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
assert.deepStrictEqual(
  list(RB.parseVariants('{"variants":["Hello\nthere","Other take","Third"]}')),
  ['Hello\nthere', 'Other take', 'Third']
);
assert.deepStrictEqual(list(RB.parseVariants('{"variants":["A","B","C",]}')), ['A', 'B', 'C']);
assert.deepStrictEqual(
  list(RB.parseVariants('{"variants":[{"text":"A"},{"text":"B"},{"content":"C"}]}')),
  ['A', 'B', 'C']
);

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

assert.strictEqual(RB.parseRefineText('just a rewrite'), 'just a rewrite');
assert.strictEqual(RB.parseRefineText('{"variants":["A","B","C"]}'), 'A');
assert.strictEqual(RB.parseRefineText('```\nhello\n```'), 'hello');
assert.strictEqual(RB.parseRefineText('  '), '');

const originalVariants = ['one', 'two', 'three'];
assert.deepStrictEqual(RB.replaceSelectedVariant(originalVariants, 1, 'TWO'), ['one', 'TWO', 'three']);
assert.deepStrictEqual(originalVariants, ['one', 'two', 'three'], 'must not mutate the input array');
assert.deepStrictEqual(RB.replaceSelectedVariant(['one', 'two'], 0, '  '), ['one', 'two']);
assert.deepStrictEqual(RB.replaceSelectedVariant(['one'], 4, 'x'), ['one']);

function host(value) {
  return JSON.parse(JSON.stringify(value));
}

const emptyThreads = host(RB.emptyRefineHistories(3));
assert.strictEqual(emptyThreads.length, 3);
assert.deepStrictEqual(emptyThreads[0], []);
assert.deepStrictEqual(host(RB.refineHistoryForVariant(emptyThreads, 1)), []);

const afterOne = host(RB.appendRefineTurn(RB.emptyRefineHistories(3), 1, 'Make it shorter.', 'Hi.'));
assert.deepStrictEqual(host(RB.refineHistoryForVariant(RB.emptyRefineHistories(3), 1)), []);
assert.deepStrictEqual(afterOne[0], []);
assert.deepStrictEqual(afterOne[1], [
  { role: 'user', text: 'Make it shorter.' },
  { role: 'assistant', text: 'Hi.' }
]);
assert.deepStrictEqual(afterOne[2], []);

const afterTwo = host(RB.appendRefineTurn(afterOne, 1, 'Add a greeting.', 'Hi there.'));
assert.strictEqual(afterTwo[1].length, 4);
assert.strictEqual(afterOne[1].length, 2);

console.log('ok — parse variants and word-level diff');
