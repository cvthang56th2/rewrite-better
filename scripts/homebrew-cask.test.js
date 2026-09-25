const assert = require("assert");
const { renderHomebrewCask, INSTALL_COMMAND } = require("./homebrew-cask");

const cask = renderHomebrewCask({
  version: "v1.0.8",
  sha256: "sha256:7542b3443124460146bc8afb2985a46b750da0f6b4340c9e60a243ab4042b21a",
});

assert.ok(cask.startsWith('cask "rewrite-better" do\n'));
assert.ok(cask.includes('  version "1.0.8"\n'));
assert.ok(cask.includes('  sha256 "7542b3443124460146bc8afb2985a46b750da0f6b4340c9e60a243ab4042b21a"\n'));
assert.ok(
  cask.includes(
    'url "https://github.com/cvthang56th2/rewrite-better/releases/download/v#{version}/RewriteBetter-#{version}.dmg"',
  ),
);
assert.ok(cask.includes('app "RewriteBetter.app"'));
assert.ok(cask.includes("depends_on macos: :ventura"));
assert.strictEqual(
  INSTALL_COMMAND,
  `brew tap cvthang56th2/rewrite-better
brew trust cvthang56th2/rewrite-better
brew install --cask rewrite-better`,
);

assert.throws(() => renderHomebrewCask({ version: "latest", sha256: "a".repeat(64) }), /version/);
assert.throws(() => renderHomebrewCask({ version: "1.0.8", sha256: "not-a-hash" }), /sha256/);

console.log("scripts/homebrew-cask.test.js ok");
