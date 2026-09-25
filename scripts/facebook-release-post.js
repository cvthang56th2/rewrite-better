const fs = require("fs");

const GRAPH_VERSION = "v25.0";
const DEFAULT_SITE_URL = "https://rewrite-better-ai.vercel.app/";

const MISSING_SECRETS_MESSAGE = [
  "Set the FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN repository secrets.",
  "Create a Meta app, add pages_show_list, pages_manage_posts, and pages_read_engagement, then store a long-lived Page access token.",
  "The Page ID comes from GET /me/accounts, not necessarily the number in the page URL.",
  "Switch the app to Live so the post is visible to everyone.",
].join(" ");

function versionFromTag(tag) {
  const version = String(tag || "")
    .trim()
    .replace(/^v/i, "");
  if (!version) throw new Error("Release tag is required.");
  return version;
}

function releasePageUrl(repository, version) {
  return `https://github.com/${repository}/releases/tag/v${version}`;
}

function buildReleaseMessage({ version, notes, siteUrl, releaseUrl }) {
  const lines = [
    `Rewrite Better ${version} đã có.`,
    "",
    `Tải về: ${siteUrl}`,
    `Ghi chú phiên bản: ${releaseUrl}`,
  ];
  const changelog = String(notes || "").trim();
  if (changelog) {
    lines.push("", "Thay đổi:", changelog);
  }
  return lines.join("\n");
}

function containsBounded(message, needle) {
  if (!needle) return false;
  let from = 0;
  while (from <= message.length) {
    const index = message.indexOf(needle, from);
    if (index === -1) return false;
    const next = message.charAt(index + needle.length);
    if (!next || !/[0-9.]/.test(next)) return true;
    from = index + needle.length;
  }
  return false;
}

function postAlreadyExists(posts, { version, releaseUrl }) {
  const marker = `Rewrite Better ${version} đã có`;
  return (posts || []).some((post) => {
    const message = String((post && post.message) || "");
    return message.includes(marker) || containsBounded(message, releaseUrl);
  });
}

function redact(text, secret) {
  const value = String(text || "");
  if (!secret) return value;
  return value.split(secret).join("[redacted]");
}

async function graphRequest(fetchImpl, url, { token, method, body }) {
  let response;
  try {
    response = await fetchImpl(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`Facebook API failed: ${redact(error && error.message, token)}`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const detail = (payload.error && payload.error.message) || `HTTP ${response.status}`;
    throw new Error(`Facebook API failed: ${redact(detail, token)}`);
  }
  return payload;
}

async function publishReleasePost({
  pageId,
  accessToken,
  tag,
  notes,
  repository,
  siteUrl = DEFAULT_SITE_URL,
  fetchImpl = fetch,
  graphVersion = GRAPH_VERSION,
}) {
  const id = String(pageId || "").trim();
  const token = String(accessToken || "").trim();
  if (!id || !token) {
    throw new Error(MISSING_SECRETS_MESSAGE);
  }
  const repo = String(repository || "").trim();
  if (!repo) throw new Error("GITHUB_REPOSITORY is required.");

  const version = versionFromTag(tag);
  const releaseUrl = releasePageUrl(repo, version);
  const postsUrl = new URL(`https://graph.facebook.com/${graphVersion}/${encodeURIComponent(id)}/posts`);
  postsUrl.searchParams.set("fields", "message");
  postsUrl.searchParams.set("limit", "50");
  postsUrl.searchParams.set("access_token", token);

  const postsPayload = await graphRequest(fetchImpl, postsUrl, { token, method: "GET" });
  if (!Array.isArray(postsPayload.data)) {
    throw new Error("Facebook API failed: missing posts list");
  }
  if (postAlreadyExists(postsPayload.data, { version, releaseUrl })) {
    return { posted: false, reason: "already-posted", version };
  }

  const message = buildReleaseMessage({
    version,
    notes,
    siteUrl: siteUrl || DEFAULT_SITE_URL,
    releaseUrl,
  });
  const feedUrl = `https://graph.facebook.com/${graphVersion}/${encodeURIComponent(id)}/feed`;
  const created = await graphRequest(fetchImpl, feedUrl, {
    token,
    method: "POST",
    body: {
      message,
      link: releaseUrl,
      access_token: token,
    },
  });
  return { posted: true, id: created.id, version };
}

function readNotes(env) {
  if (env.RELEASE_NOTES != null) return String(env.RELEASE_NOTES);
  if (env.RELEASE_NOTES_FILE) return fs.readFileSync(env.RELEASE_NOTES_FILE, "utf8");
  return "";
}

async function main(env = process.env) {
  const result = await publishReleasePost({
    pageId: env.FACEBOOK_PAGE_ID,
    accessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN,
    tag: env.RELEASE_TAG,
    notes: readNotes(env),
    repository: env.GITHUB_REPOSITORY,
    siteUrl: env.SITE_URL,
  });
  if (result.posted) {
    console.log(`Posted Rewrite Better ${result.version} to Facebook (${result.id}).`);
    return;
  }
  console.log(`Facebook already has a post for Rewrite Better ${result.version}; skipping.`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}

module.exports = {
  MISSING_SECRETS_MESSAGE,
  buildReleaseMessage,
  postAlreadyExists,
  publishReleasePost,
};
