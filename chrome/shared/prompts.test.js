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

function requiresVariants(prompt) {
  assert.ok(prompt.includes('{"variants":['), prompt);
  assert.ok(prompt.includes('exactly 3'), prompt);
}

const plain = RB.buildRewritePrompt('hello', 'friendly');
assert.ok(plain.includes('friendly'));
requiresVariants(plain);
assert.ok(plain.includes('\n\nhello'));
assert.ok(!plain.includes('Writer\'s voice'));

const withExtra = RB.buildRewritePrompt('hello', 'friendly', null, 'Always write in Vietnamese. No emoji.');
assert.ok(withExtra.includes('Always write in Vietnamese. No emoji.'));
assert.ok(withExtra.includes('hello'));
requiresVariants(withExtra);
assert.ok(
  withExtra.indexOf('Always write in Vietnamese. No emoji.') < withExtra.lastIndexOf('hello')
);

const blankExtra = RB.buildRewritePrompt('hello', 'friendly', null, '   \n  ');
assert.strictEqual(blankExtra, plain);

const voiced = RB.buildRewritePrompt(
  'hello',
  'friendly',
  null,
  '',
  'hey can you send that when you get a chance? thanks!'
);
assert.ok(voiced.includes("Writer's voice"));
assert.ok(voiced.includes('hey can you send that when you get a chance? thanks!'));
assert.ok(voiced.indexOf('hey can you send that') < voiced.lastIndexOf('hello'));
assert.notStrictEqual(voiced, plain);

const blankVoice = RB.buildRewritePrompt('hello', 'friendly', null, '', '  \n');
assert.strictEqual(blankVoice, plain);

const format = RB.buildFormatPrompt('markdown', 'notes here', 'Never wrap the result in a code fence.');
assert.ok(format.includes('Never wrap the result in a code fence.'));
assert.ok(format.includes('notes here'));
assert.ok(!format.includes('{"variants":['));
assert.ok(
  format.indexOf('Never wrap the result in a code fence.') < format.lastIndexOf('notes here')
);
assert.ok(
  !RB.buildFormatPrompt('markdown', 'notes here', '', 'this is my voice sample').includes("Writer's voice")
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
requiresVariants(reply);
assert.ok(reply.includes('Sign off as Thang.'));
assert.ok(reply.includes('Hi'));
assert.ok(reply.indexOf('Sign off as Thang.') < reply.indexOf('--- Received message ---'));

const replyVoice = RB.buildReplyPrompt({
  channel: 'message',
  intent: 'thank',
  tone: 'friendly',
  length: 'short',
  outputLanguage: 'en',
  incomingText: 'Hi',
  notes: '',
  extraInstructions: '',
  voiceSamples: 'yeah that works, I can do Thursday.'
});
assert.ok(replyVoice.includes("Writer's voice"));
assert.ok(replyVoice.includes('yeah that works, I can do Thursday.'));
assert.ok(replyVoice.indexOf('yeah that works') < replyVoice.indexOf('--- Received message ---'));

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

const refine = RB.buildRefinePrompt('Hello there.', 'Make it shorter.');
assert.ok(refine, 'refine prompt should be built when text and instruction exist');
assert.ok(refine.includes('Hello there.'));
assert.ok(refine.includes('Make it shorter.'));
assert.ok(refine.indexOf('Make it shorter.') < refine.lastIndexOf('Hello there.'));
assert.ok(!refine.includes('{"variants":['), 'refine must not ask for three variants');
assert.ok(/return only the revised text/i.test(refine));
assert.ok(!refine.includes("Writer's voice"));

assert.strictEqual(RB.buildRefinePrompt('Hello there.', '   \n'), null);
assert.strictEqual(RB.buildRefinePrompt('  ', 'Make it shorter.'), null);
assert.strictEqual(RB.buildRefinePrompt('', 'Make it shorter.'), null);

const refineVoice = RB.buildRefinePrompt(
  'Hello there.',
  'Make it shorter.',
  'hey can you send that when you get a chance? thanks!'
);
assert.ok(refineVoice.includes("Writer's voice"));
assert.ok(refineVoice.includes('hey can you send that when you get a chance? thanks!'));
assert.ok(refineVoice.indexOf('hey can you send that') < refineVoice.lastIndexOf('Hello there.'));

assert.ok(!refine.includes('--- Conversation ---'));

const refineWithHistory = RB.buildRefinePrompt('Hello.', 'Add a greeting.', '', [
  { role: 'user', text: 'Make it shorter.' },
  { role: 'assistant', text: 'Hi.' }
]);
assert.ok(refineWithHistory.includes('--- Conversation ---'));
assert.ok(refineWithHistory.includes('User: Make it shorter.'));
assert.ok(refineWithHistory.includes('Assistant: Hi.'));
assert.ok(refineWithHistory.includes('Add a greeting.'));
assert.ok(refineWithHistory.indexOf('Make it shorter.') < refineWithHistory.indexOf('Add a greeting.'));
assert.ok(refineWithHistory.indexOf('Add a greeting.') < refineWithHistory.lastIndexOf('Hello.'));

console.log('ok — prompts request variants and attach voice samples');
