const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  githubAssetUrl,
  pickNsisSetup,
  buildWindowsUpdaterManifest,
  writeWindowsUpdaterManifest,
} = require("./windows-updater-manifest");

assert.strictEqual(
  githubAssetUrl("cvthang56th2/rewrite-better", "v1.2.0", "Rewrite Better_1.2.0_x64-setup.exe"),
  "https://github.com/cvthang56th2/rewrite-better/releases/download/v1.2.0/Rewrite%20Better_1.2.0_x64-setup.exe",
);

assert.strictEqual(
  pickNsisSetup(["latest.json", "Rewrite Better_1.2.0_x64-setup.exe.sig", "notes.txt"]),
  null,
);
assert.strictEqual(
  pickNsisSetup([
    "helper.exe",
    "Rewrite Better_1.2.0_x64-setup.exe",
    "Rewrite Better_1.2.0_x64-setup.exe.sig",
    "latest.json",
  ]),
  "Rewrite Better_1.2.0_x64-setup.exe",
);

const signature = "dW50cnVzdGVkIGNvbW1lbnQ6IHNpZ25hdHVyZQ==\n";
const manifest = buildWindowsUpdaterManifest({
  version: "1.2.0",
  notes: "Tray updater",
  pubDate: "2026-09-20T05:00:00Z",
  repo: "cvthang56th2/rewrite-better",
  tag: "v1.2.0",
  setupName: "Rewrite Better_1.2.0_x64-setup.exe",
  signature,
});
assert.strictEqual(manifest.version, "1.2.0");
assert.strictEqual(manifest.notes, "Tray updater");
assert.strictEqual(manifest.pub_date, "2026-09-20T05:00:00Z");
assert.strictEqual(
  manifest.platforms["windows-x86_64"].url,
  "https://github.com/cvthang56th2/rewrite-better/releases/download/v1.2.0/Rewrite%20Better_1.2.0_x64-setup.exe",
);
assert.strictEqual(manifest.platforms["windows-x86_64"].signature, signature.trim());
assert.deepStrictEqual(
  manifest.platforms["windows-x86_64"],
  manifest.platforms["windows-x86_64-nsis"],
);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rb-updater-"));
fs.writeFileSync(path.join(dir, "Rewrite Better_1.2.0_x64-setup.exe"), "installer");
fs.writeFileSync(path.join(dir, "Rewrite Better_1.2.0_x64-setup.exe.sig"), `${signature}\n`);
const out = path.join(dir, "latest.json");
const written = writeWindowsUpdaterManifest({
  dir,
  out,
  version: "1.2.0",
  tag: "v1.2.0",
  repo: "cvthang56th2/rewrite-better",
  notes: "Tray updater",
  pubDate: "2026-09-20T05:00:00Z",
});
assert.strictEqual(written, out);
const parsed = JSON.parse(fs.readFileSync(out, "utf8"));
assert.strictEqual(parsed.platforms["windows-x86_64"].signature, signature.trim());
assert.ok(parsed.platforms["windows-x86_64"].url.includes("Rewrite%20Better"));

fs.rmSync(dir, { recursive: true, force: true });
console.log("scripts/windows-updater-manifest.test.js ok");
