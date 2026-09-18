const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(files) {
  const context = {
    RewriteBetter: undefined,
    window: undefined,
    self: undefined,
    console,
    TextEncoder,
    Buffer,
    Set,
    Map,
    Error
  };
  context.globalThis = context;
  files.forEach((file) => {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, file), 'utf8'), context);
  });
  return context.RewriteBetter;
}

function hostArray(value) {
  return JSON.parse(JSON.stringify(value));
}

const RB = load(['llm-providers.js']);

assert.deepStrictEqual(hostArray(RB.parseApiKeys('')), []);
assert.deepStrictEqual(hostArray(RB.parseApiKeys('  gsk_one  , gsk_two;gsk_two\ngsk_three')), [
  'gsk_one',
  'gsk_two',
  'gsk_three'
]);

const backends = hostArray(
  RB.resolveChatBackends({
    openai: 'sk-last',
    groq: 'gsk_mid',
    gemini: 'AIza-first',
    cerebras: 'csk_third'
  })
);
assert.deepStrictEqual(
  backends.map((b) => b.provider),
  ['gemini', 'groq', 'cerebras', 'openai']
);
assert.strictEqual(backends[0].model, 'gemini-flash-latest');
assert.strictEqual(backends[1].model, 'openai/gpt-oss-20b');
assert.ok(backends[0].skipId.startsWith('gemini:'));
assert.notStrictEqual(backends[0].skipId, backends[1].skipId);

const openaiOnly = hostArray(RB.resolveChatBackends({ openai: 'sk-only', groq: '' }));
assert.deepStrictEqual(
  openaiOnly.map((b) => b.provider),
  ['openai']
);

assert.deepStrictEqual(hostArray(RB.normalizeEnabledProviders(undefined)), {
  gemini: true,
  groq: true,
  cerebras: true,
  openai: true
});
assert.deepStrictEqual(hostArray(RB.normalizeEnabledProviders({ groq: false, gemini: 'no' })), {
  gemini: true,
  groq: false,
  cerebras: true,
  openai: true
});

const skippedGroq = hostArray(
  RB.resolveChatBackends(
    {
      openai: 'sk-last',
      groq: 'gsk_mid',
      gemini: 'AIza-first',
      cerebras: 'csk_third'
    },
    { groq: false }
  )
);
assert.deepStrictEqual(
  skippedGroq.map((b) => b.provider),
  ['gemini', 'cerebras', 'openai']
);

const allDisabled = hostArray(
  RB.resolveChatBackends({ gemini: 'AIza', openai: 'sk-last' }, { gemini: false, openai: false })
);
assert.deepStrictEqual(allDisabled, []);

assert.strictEqual(RB.isQuotaError({ status: 429, message: 'slow down' }), true);
assert.strictEqual(RB.isQuotaError({ status: 402, message: 'pay' }), true);
assert.strictEqual(RB.isQuotaError({ status: 500, message: 'resource exhausted' }), true);
assert.strictEqual(RB.isQuotaError({ status: 401, message: 'bad key' }), false);

(async () => {
  const calls = [];
  const skipped = new Set();
  const result = await RB.callWithQuotaFallback(
    [
      { skipId: 'a', provider: 'groq' },
      { skipId: 'b', provider: 'openai' }
    ],
    skipped,
    async (backend) => {
      calls.push(backend.skipId);
      if (backend.skipId === 'a') {
        const err = new Error('rate');
        err.status = 429;
        throw err;
      }
      return 'ok';
    }
  );
  assert.strictEqual(result, 'ok');
  assert.deepStrictEqual(calls, ['a', 'b']);
  assert.ok(skipped.has('a'));
  assert.ok(!skipped.has('b'));

  const networkSkipped = new Set();
  const networkCalls = [];
  const networkResult = await RB.callWithQuotaFallback(
    [
      { skipId: 'net', provider: 'groq' },
      { skipId: 'ok', provider: 'openai' }
    ],
    networkSkipped,
    async (backend) => {
      networkCalls.push(backend.skipId);
      if (backend.skipId === 'net') {
        const err = new Error('failed to fetch');
        err.code = 'network';
        throw err;
      }
      return 'ok';
    }
  );
  assert.strictEqual(networkResult, 'ok');
  assert.deepStrictEqual(networkCalls, ['net', 'ok']);
  assert.ok(!networkSkipped.has('net'), 'network errors must not rest the key until tomorrow');

  try {
    await RB.callWithQuotaFallback([], new Set(), async () => 'x');
    assert.fail('expected missing key');
  } catch (err) {
    assert.strictEqual(err.code, 'missingKey');
  }

  try {
    await RB.callWithQuotaFallback(
      [{ skipId: 'resting', provider: 'groq' }],
      new Set(['resting']),
      async () => 'x'
    );
    assert.fail('expected all keys resting');
  } catch (err) {
    assert.strictEqual(err.code, 'allKeysResting');
  }

  console.log('ok — llm-providers parse, failover order, quota skip');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
