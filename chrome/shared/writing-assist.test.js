const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, 'writing-assist.js'), 'utf8');
const context = { RewriteBetter: undefined, window: undefined, self: undefined };
context.globalThis = context;
vm.runInNewContext(code, context);
const RB = context.RewriteBetter;

assert.strictEqual(RB.sanitizeSuggestion('```ok```', ''), 'ok');
assert.strictEqual(RB.sanitizeSuggestion('"next sentence"', 'Hi. '), 'next sentence');
assert.strictEqual(RB.sanitizeSuggestion('Hello world', 'Hello'), ' world');

const issues = RB.parseWritingIssues(
  '{"issues":[{"kind":"grammar","message":"tense","original":"was go","replacement":"went"}]}',
  'I was go home'
);
assert.strictEqual(issues.length, 1);
assert.strictEqual(issues[0].replacement, 'went');

const ignored = RB.parseWritingIssues(
  '{"issues":[{"kind":"grammar","message":"x","original":"not in text","replacement":"y"}]}',
  'hello'
);
assert.strictEqual(ignored.length, 0);

assert.ok(RB.writingAssistPrompts.autocomplete('I am writ').includes('mid-sentence'));
assert.ok(RB.writingAssistPrompts.autocomplete('Done.').includes('continuation'));

console.log('ok — writing assist sanitize, parse, prompts');
