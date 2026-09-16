const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadAll() {
  const context = { RewriteBetter: undefined, window: undefined, self: undefined };
  context.globalThis = context;
  for (const file of ['options.js', 'prompts.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
  }
  return context.RewriteBetter;
}

const RB = loadAll();

const plain = RB.buildRewritePrompt('hello', 'friendly');
assert.strictEqual(
  plain,
  'Rewrite the following text in a friendly tone. Return only the rewritten text without any additional comments or explanations:\n\nhello'
);

const withExtra = RB.buildRewritePrompt('hello', 'friendly', null, 'Always write in Vietnamese. No emoji.');
assert.ok(withExtra.includes('Always write in Vietnamese. No emoji.'));
assert.ok(withExtra.includes('hello'));
assert.ok(
  withExtra.includes('Return only the rewritten text') ||
    withExtra.toLowerCase().includes('return only the final output')
);
assert.ok(
  withExtra.indexOf('Always write in Vietnamese. No emoji.') < withExtra.lastIndexOf('hello')
);

const blankExtra = RB.buildRewritePrompt('hello', 'friendly', null, '   \n  ');
assert.strictEqual(blankExtra, plain);

const format = RB.buildFormatPrompt('markdown', 'notes here', 'Never wrap the result in a code fence.');
assert.ok(format.includes('Never wrap the result in a code fence.'));
assert.ok(format.includes('notes here'));
assert.ok(
  format.indexOf('Never wrap the result in a code fence.') < format.lastIndexOf('notes here')
);

const reply = RB.buildReplyPrompt({
  channel: 'message',
  intent: 'thank',
  tone: 'friendly',
  length: 'short',
  outputLanguage: 'en',
  incomingText: 'Hi',
  notes: '',
  extraInstructions: 'Sign off as Thang.'
});
assert.ok(reply);
assert.ok(reply.includes('Sign off as Thang.'));
assert.ok(reply.includes('Hi'));
assert.ok(reply.indexOf('Sign off as Thang.') < reply.indexOf('--- Received message ---'));

const replyBlank = RB.buildReplyPrompt({
  channel: 'message',
  intent: 'general',
  tone: 'friendly',
  length: 'short',
  outputLanguage: 'en',
  incomingText: 'Hi',
  notes: '',
  extraInstructions: '\n\t'
});
const replyNone = RB.buildReplyPrompt({
  channel: 'message',
  intent: 'general',
  tone: 'friendly',
  length: 'short',
  outputLanguage: 'en',
  incomingText: 'Hi',
  notes: ''
});
assert.strictEqual(replyBlank, replyNone);

assert.strictEqual(
  RB.buildReplyPrompt({
    channel: 'message',
    intent: 'general',
    tone: 'friendly',
    length: 'short',
    outputLanguage: 'en',
    incomingText: '  ',
    notes: ''
  }),
  null
);

console.log('ok — prompts extra instructions stay before user content');
