const fs = require("fs");
const path = require("path");

function githubAssetUrl(repo, tag, filename) {
  const encoded = String(filename || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://github.com/${repo}/releases/download/${tag}/${encoded}`;
}

function pickNsisSetup(names) {
  const files = (Array.isArray(names) ? names : []).map((name) => String(name));
  const exes = files.filter((name) => /\.exe$/i.test(name) && !/\.sig$/i.test(name));
  return (
    exes.find((name) => /setup|nsis|installer/i.test(name)) ||
    exes[0] ||
    null
  );
}

function buildWindowsUpdaterManifest({
  version,
  notes = "",
  pubDate,
  repo,
  tag,
  setupName,
  signature,
}) {
  const url = githubAssetUrl(repo, tag, setupName);
  const platform = {
    url,
    signature: String(signature || "").trim(),
  };
  return {
    version,
    notes: String(notes || ""),
    pub_date: pubDate,
    platforms: {
      "windows-x86_64": platform,
      "windows-x86_64-nsis": { ...platform },
    },
  };
}

function writeWindowsUpdaterManifest({
  dir,
  out,
  version,
  tag,
  repo,
  notes = "",
  pubDate = new Date().toISOString(),
}) {
  const names = fs.readdirSync(dir);
  const setupName = pickNsisSetup(names);
  if (!setupName) {
    throw new Error(`No Windows setup .exe in ${dir}`);
  }
  const sigPath = path.join(dir, `${setupName}.sig`);
  if (!fs.existsSync(sigPath)) {
    throw new Error(`Missing updater signature ${sigPath}`);
  }
  const manifest = buildWindowsUpdaterManifest({
    version,
    notes,
    pubDate,
    repo,
    tag,
    setupName,
    signature: fs.readFileSync(sigPath, "utf8"),
  });
  const destination = out || path.join(dir, "latest.json");
  fs.writeFileSync(destination, `${JSON.stringify(manifest, null, 2)}\n`);
  return destination;
}

function argValue(argv, name) {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return "";
  return String(argv[index + 1] || "").trim();
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const dir = argValue(argv, "dir");
  const version = argValue(argv, "version");
  const tag = argValue(argv, "tag") || `v${version}`;
  const repo = argValue(argv, "repo") || process.env.GITHUB_REPOSITORY || "";
  if (!dir || !version || !repo) {
    throw new Error("Usage: windows-updater-manifest.js --dir DIR --version VERSION --repo OWNER/NAME [--tag TAG]");
  }
  const written = writeWindowsUpdaterManifest({
    dir,
    out: argValue(argv, "out") || path.join(dir, "latest.json"),
    version,
    tag,
    repo,
    notes: argValue(argv, "notes"),
    pubDate: argValue(argv, "pub-date") || new Date().toISOString(),
  });
  process.stdout.write(`${written}\n`);
}

module.exports = {
  githubAssetUrl,
  pickNsisSetup,
  buildWindowsUpdaterManifest,
  writeWindowsUpdaterManifest,
};
