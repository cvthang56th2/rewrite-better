const assert = require("assert");
const {
  buildReleaseMessage,
  postAlreadyExists,
  publishReleasePost,
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

assert.ok(message.startsWith("Rewrite Better 1.2.3 đã có."));
assert.ok(message.includes(`Tải về: ${siteUrl}`));
assert.ok(message.includes(`Ghi chú phiên bản: ${releaseUrl}`));
assert.ok(message.includes("Thay đổi:\n### Features\n\n- Fix the panel on Windows"));

const withoutNotes = buildReleaseMessage({
  version: "1.2.3",
  notes: "  \n",
  siteUrl,
  releaseUrl,
});
assert.equal(withoutNotes.includes("Thay đổi:"), false);

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
  assert.ok(body.message.startsWith("Rewrite Better 1.2.3 đã có."));
  assert.ok(body.message.includes("Thay đổi:\n### Features\n\n- Ship it"));
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

runPublishCases()
  .then(() => {
    console.log("scripts/facebook-release-post.test.js ok");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
