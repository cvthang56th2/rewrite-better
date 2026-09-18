function versionFromEnv(env = process.env) {
  const explicit = String(env.VERSION || "").trim();
  if (explicit) return explicit.replace(/^v/i, "");
  if (env.GITHUB_REF_TYPE === "tag") {
    const tag = String(env.GITHUB_REF_NAME || "").trim().replace(/^v/i, "");
    if (tag) return tag;
  }
  return "1.0.0";
}

if (require.main === module) {
  process.stdout.write(versionFromEnv());
}

module.exports = { versionFromEnv };
