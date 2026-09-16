const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load() {
  const code = fs.readFileSync(path.join(__dirname, 'daily-skip.js'), 'utf8');
  const context = { RewriteBetter: undefined, window: undefined, self: undefined };
  context.globalThis = context;
  vm.runInNewContext(code, context);
  return context.RewriteBetter;
}

const RB = load();
const store = RB.createDailySkipStore({
  today: '2026-09-15',
  load: () => ({ old: '2026-09-14', groq: '2026-09-15' }),
  save() {}
});

assert.deepStrictEqual([...store.activeSkipIds()].sort(), ['groq']);

const memory = {};
const writable = RB.createDailySkipStore({
  today: '2026-09-15',
  load: () => ({ ...memory }),
  save: (value) => {
    Object.keys(memory).forEach((k) => delete memory[k]);
    Object.assign(memory, value);
  }
});
writable.markSkipped(new Set(['gemini:abc']));
assert.deepStrictEqual(memory, { 'gemini:abc': '2026-09-15' });
writable.clearAll();
assert.deepStrictEqual(memory, {});

console.log('ok — daily skip keeps today only');
