const assert = require("assert");
const { versionFromEnv } = require("./release-version");

assert.strictEqual(
  versionFromEnv({ GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "v1.0.6" }),
  "1.0.6",
);
assert.strictEqual(
  versionFromEnv({ GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "1.2.3" }),
  "1.2.3",
);
assert.strictEqual(
  versionFromEnv({ GITHUB_REF_TYPE: "branch", GITHUB_REF_NAME: "main", VERSION: "v1.0.6" }),
  "1.0.6",
);
assert.strictEqual(versionFromEnv({ GITHUB_REF_TYPE: "branch", GITHUB_REF_NAME: "main" }), "1.0.0");
assert.strictEqual(versionFromEnv({}), "1.0.0");

console.log("scripts/release-version.test.js ok");
