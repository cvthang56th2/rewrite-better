const fs = require("fs");
const crypto = require("crypto");

const INSTALL_COMMAND = `brew tap cvthang56th2/rewrite-better
brew trust cvthang56th2/rewrite-better
brew install --cask rewrite-better`;

function renderHomebrewCask({ version, sha256 }) {
  const ver = String(version || "").trim().replace(/^v/i, "");
  const hash = String(sha256 || "").trim().replace(/^sha256:/i, "");
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(ver)) {
    throw new Error(`Invalid Homebrew cask version: ${version}`);
  }
  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error(`Invalid Homebrew cask sha256: ${sha256}`);
  }
  return `cask "rewrite-better" do
  version "${ver}"
  sha256 "${hash}"

  url "https://github.com/cvthang56th2/rewrite-better/releases/download/v#{version}/RewriteBetter-#{version}.dmg"
  name "Rewrite Better"
  desc "Rewrite, format, and reply from the macOS menu bar"
  homepage "https://rewrite-better-ai.vercel.app/"

  depends_on macos: :ventura

  app "RewriteBetter.app"

  zap trash: [
    "~/Library/Preferences/com.rewritebetter.macos.plist",
  ]

  caveats <<~EOS
    macOS may block the first open because this build is not notarized.
    Right-click Rewrite Better in Applications and choose Open.
    Grant Accessibility when asked so Rewrite Better can read the text you select.
  EOS
end
`;
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function argValue(argv, name) {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return "";
  return String(argv[index + 1] || "").trim();
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const version = argValue(argv, "version");
  const sha256 = argValue(argv, "sha256") || (argValue(argv, "dmg") ? sha256File(argValue(argv, "dmg")) : "");
  const out = argValue(argv, "out");
  const body = renderHomebrewCask({ version, sha256 });
  if (out) fs.writeFileSync(out, body);
  else process.stdout.write(body);
}

module.exports = { INSTALL_COMMAND, renderHomebrewCask, sha256File };
