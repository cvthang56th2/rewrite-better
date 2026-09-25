const assert = require("assert");
const {
  buildReleaseMessage,
  postAlreadyExists,
  publishReleasePost,
  summarizeReleaseChanges,
  MISSING_SECRETS_MESSAGE,
} = require("./facebook-release-post");

const siteUrl = "https://rewrite-better-ai.vercel.app/";
const releaseUrl = "https://github.com/cvthang56th2/rewrite-better/releases/tag/v1.2.3";

const message = buildReleaseMessage({
  version: "1.2.3",
  notes: "### Features\n\n- Fix the panel on Windows",
  siteUrl,
  releaseUrl,
});

assert.ok(message.startsWith("Rewrite Better 1.2.3 đã có. (English below)\n"));
assert.ok(message.includes(`Tải về: ${siteUrl}`));
assert.ok(message.includes(`Ghi chú phiên bản: ${releaseUrl}`));
assert.equal(message.includes("Thay đổi:"), false);
assert.ok(message.includes("Changes:\n### Features\n\n- Fix the panel on Windows"));
assert.equal(message.includes("\n\nEnglish below\n\n"), false);
assert.ok(message.includes("Rewrite Better 1.2.3 is available."));
assert.ok(message.includes(`Download: ${siteUrl}`));
assert.ok(message.includes(`Release notes: ${releaseUrl}`));
assert.ok(message.indexOf("(English below)") < message.indexOf("Changes:"));
assert.ok(message.includes("\n\n---------\n\n"));
assert.ok(message.indexOf("Changes:") > message.indexOf("\n\n---------\n\n"));
assert.ok(message.indexOf("\n\n---------\n\n") < message.indexOf("Rewrite Better 1.2.3 is available."));

const withoutNotes = buildReleaseMessage({
  version: "1.2.3",
  notes: "  \n",
  siteUrl,
  releaseUrl,
});
assert.equal(withoutNotes.includes("Thay đổi:"), false);
assert.equal(withoutNotes.includes("Changes:"), false);
assert.ok(withoutNotes.startsWith("Rewrite Better 1.2.3 đã có. (English below)\n"));

const bilingual = buildReleaseMessage({
  version: "1.2.3",
  notes: "- Chỉnh tiếp một bản viết ngay trong panel. / Adjust a draft in the panel.",
  siteUrl,
  releaseUrl,
});
assert.ok(bilingual.startsWith("Rewrite Better 1.2.3 đã có. (English below)\n"));
assert.ok(bilingual.includes("Thay đổi:\n- Chỉnh tiếp một bản viết ngay trong panel."));
assert.ok(bilingual.includes("Changes:\n- Adjust a draft in the panel."));
assert.ok(bilingual.includes("\n\n---------\n\n"));
assert.ok(bilingual.indexOf("Thay đổi:") < bilingual.indexOf("\n\n---------\n\n"));
assert.ok(bilingual.indexOf("\n\n---------\n\n") < bilingual.indexOf("Changes:"));

assert.equal(
  postAlreadyExists([{ message: "Rewrite Better 1.2.3 đã có.\n\nTải về: https://example.com" }], {
    version: "1.2.3",
    releaseUrl,
  }),
  true,
);
assert.equal(
  postAlreadyExists([{ message: "Rewrite Better 1.2.30 đã có." }], {
    version: "1.2.3",
    releaseUrl,
  }),
  false,
);
assert.equal(
  postAlreadyExists([{ message: `Xem ${releaseUrl}` }], {
    version: "9.9.9",
    releaseUrl,
  }),
  true,
);
assert.equal(
  postAlreadyExists([{ message: `${releaseUrl}0 extra` }], {
    version: "9.9.9",
    releaseUrl,
  }),
  false,
);

async function runPublishCases() {
  const token = "page-token-secret";
  const calls = [];

  function mockFetch(pages) {
    return async (url, options) => {
      calls.push({ url: String(url), options });
      const payload = String(url).includes("/posts") ? { data: pages } : { id: "page_post_1" };
      return {
        ok: true,
        json: async () => payload,
      };
    };
  }

  calls.length = 0;
  const skipped = await publishReleasePost({
    pageId: "111",
    accessToken: token,
    tag: "v1.2.3",
    notes: "notes",
    repository: "cvthang56th2/rewrite-better",
    fetchImpl: mockFetch([{ message: "Rewrite Better 1.2.3 đã có." }]),
  });
  assert.equal(skipped.posted, false);
  assert.equal(skipped.reason, "already-posted");
  assert.equal(calls.length, 1);

  calls.length = 0;
  const posted = await publishReleasePost({
    pageId: "111",
    accessToken: token,
    tag: "v1.2.3",
    notes: "### Features\n\n- Ship it",
    repository: "cvthang56th2/rewrite-better",
    fetchImpl: mockFetch([]),
  });
  assert.equal(posted.posted, true);
  assert.equal(posted.id, "page_post_1");
  const postCall = calls.find((call) => String(call.url).endsWith("/feed"));
  assert.ok(postCall, "expected a feed post");
  const body = JSON.parse(postCall.options.body);
  assert.equal(body.link, releaseUrl);
  assert.equal(body.access_token, token);
  assert.ok(body.message.includes("Rewrite Better 1.2.3 đã có."));
  assert.ok(body.message.includes("Tải về:"));
  assert.ok(body.message.includes("Changes:\n### Features\n\n- Ship it"));
  assert.equal(body.message.includes("Thay đổi:"), false);
  assert.ok(body.message.includes("English below"));
  assert.ok(body.message.includes("Rewrite Better 1.2.3 is available."));
  assert.ok(String(postCall.url).includes("/v25.0/111/feed"));

  await assert.rejects(
    () =>
      publishReleasePost({
        pageId: "",
        accessToken: "",
        tag: "v1.2.3",
        notes: "",
        repository: "cvthang56th2/rewrite-better",
        fetchImpl: async () => {
          throw new Error("fetch should not run");
        },
      }),
    (error) => {
      assert.ok(error.message.includes(MISSING_SECRETS_MESSAGE));
      assert.equal(error.message.includes(token), false);
      return true;
    },
  );

  await assert.rejects(
    () =>
      publishReleasePost({
        pageId: "111",
        accessToken: token,
        tag: "v1.2.3",
        notes: "",
        repository: "cvthang56th2/rewrite-better",
        fetchImpl: async (url) => {
          throw new Error(`network ${url}`);
        },
      }),
    (error) => {
      assert.ok(error.message.includes("Facebook API failed"));
      assert.equal(error.message.includes(token), false);
      return true;
    },
  );

  await assert.rejects(
    () =>
      publishReleasePost({
        pageId: "111",
        accessToken: token,
        tag: "v1.2.3",
        notes: "",
        repository: "cvthang56th2/rewrite-better",
        fetchImpl: async (url) => {
          calls.push(String(url));
          return {
            ok: false,
            json: async () => ({ error: { message: `bad token ${token}` } }),
          };
        },
      }),
    (error) => {
      assert.ok(error.message.includes("Facebook API failed"));
      assert.equal(error.message.includes(token), false);
      return true;
    },
  );
}

function groqReply(content, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () =>
      status >= 200 && status < 300
        ? { choices: [{ message: { content } }] }
        : { error: { message: content } },
  };
}

async function runSummaryCases() {
  const fallback = "**Full Changelog**: https://github.com/cvthang56th2/rewrite-better/compare/v1.0.7...v1.0.8";
  const commits = "Implement refine in the panel\nMerge branch 'main'\nAdd the release banner";
  const sleep = async () => {};

  const noKeys = await summarizeReleaseChanges({
    commits,
    apiKeys: "",
    fallbackNotes: fallback,
    fetchImpl: async () => {
      throw new Error("Groq should not be called");
    },
    sleep,
  });
  assert.equal(noKeys.source, "release");
  assert.equal(noKeys.notes, fallback);

  const tried = [];
  const failover = await summarizeReleaseChanges({
    commits,
    apiKeys: "key-one, key-two",
    fallbackNotes: fallback,
    sleep,
    fetchImpl: async (url, options) => {
      const auth = options.headers.Authorization;
      tried.push(auth);
      if (auth.endsWith("key-one")) return groqReply("rate limit", 429);
      const body = JSON.parse(options.body);
      assert.equal(body.model, "openai/gpt-oss-20b");
      assert.equal(String(url).includes("api.groq.com/openai/v1/chat/completions"), true);
      assert.equal(body.messages[1].content.includes("Merge branch"), false);
      assert.ok(body.messages[1].content.includes("Implement refine in the panel"));
      assert.ok(body.messages[1].content.includes("Add the release banner"));
      return groqReply(
        "- Chỉnh tiếp một bản viết ngay trong panel. / Adjust a draft in the panel.\n- Trang web có banner phiên bản mới. / The site shows a banner for the new version.",
      );
    },
  });
  assert.deepEqual(tried, ["Bearer key-one", "Bearer key-two"]);
  assert.equal(failover.source, "groq");
  assert.equal(
    failover.notes,
    "- Chỉnh tiếp một bản viết ngay trong panel. / Adjust a draft in the panel.\n- Trang web có banner phiên bản mới. / The site shows a banner for the new version.",
  );

  let attempts = 0;
  const exhausted = await summarizeReleaseChanges({
    commits,
    apiKeys: "key-one\nkey-two",
    fallbackNotes: fallback,
    sleep,
    fetchImpl: async () => {
      attempts += 1;
      return groqReply("unavailable", 503);
    },
  });
  assert.equal(attempts, 6);
  assert.equal(exhausted.source, "release");
  assert.equal(exhausted.notes, fallback);

  const skippedProse = [];
  const afterProse = await summarizeReleaseChanges({
    commits,
    apiKeys: "key-one;key-two",
    fallbackNotes: fallback,
    sleep,
    fetchImpl: async (_url, options) => {
      const auth = options.headers.Authorization;
      skippedProse.push(auth);
      if (auth.endsWith("key-one")) return groqReply("- Auto update on Windows. / Windows updates itself.");
      return groqReply("- Windows tự cập nhật khi có bản mới. / Windows updates itself when a new version is ready.");
    },
  });
  assert.deepEqual(skippedProse, ["Bearer key-one", "Bearer key-two"]);
  assert.equal(
    afterProse.notes,
    "- Windows tự cập nhật khi có bản mới. / Windows updates itself when a new version is ready.",
  );

  const redacted = await summarizeReleaseChanges({
    commits,
    apiKeys: "secret-groq-key",
    fallbackNotes: fallback,
    sleep,
    maxAttempts: 1,
    fetchImpl: async () => {
      throw new Error("network while using secret-groq-key");
    },
  });
  assert.equal(redacted.source, "release");
  assert.equal(redacted.notes, fallback);
  assert.equal(JSON.stringify(redacted).includes("secret-groq-key"), false);
}

runPublishCases()
  .then(() => runSummaryCases())
  .then(() => {
    console.log("scripts/facebook-release-post.test.js ok");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
