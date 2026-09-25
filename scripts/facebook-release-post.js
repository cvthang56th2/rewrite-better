const fs = require("fs");

const GRAPH_VERSION = "v25.0";
const DEFAULT_SITE_URL = "https://rewrite-better-ai.vercel.app/";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";
const SUMMARY_ATTEMPTS = 3;
const SUMMARY_SYSTEM = [
  "Bạn viết mục thay đổi song ngữ cho bài Facebook của Rewrite Better.",
  'Chỉ trả về các gạch đầu dòng. Mỗi dòng bắt đầu bằng "- ".',
  'Mỗi dòng là một thay đổi: tiếng Việt, rồi " / ", rồi tiếng Anh.',
  'Ví dụ: "- Chỉnh tiếp một bản viết ngay trong panel. / Adjust a draft in the panel."',
  "Viết cho người dùng ứng dụng. Không nhắc commit, merge, CI, tên file, hay chi tiết kỹ thuật nội bộ.",
  "Bỏ thay đổi mà người dùng không thấy.",
  'Nếu không còn gì đáng kể, trả về đúng dòng "- Không có thay đổi đáng kể. / No notable changes."',
].join(" ");

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

function parseApiKeys(raw) {
  const source = Array.isArray(raw) ? raw.join("\n") : raw;
  const keys = [];
  const seen = new Set();
  String(source || "")
    .split(/[,;\n\r]/)
    .forEach((part) => {
      const key = part.trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      keys.push(key);
    });
  return keys;
}

function commitSubjects(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^merge(\s|$)/i.test(line));
}

function normalizeSummary(text) {
  let raw = String(text || "").trim();
  raw = raw.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const body = lines.length && /^thay đổi\b/i.test(lines[0]) ? lines.slice(1) : lines;
  const bullets = [];
  for (const line of body) {
    const match = line.match(/^(?:[-*•]\s+)(.+)$/);
    if (!match) return "";
    const sides = match[1].split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean);
    if (sides.length < 2 || !looksVietnamese(sides[0])) return "";
    bullets.push(`- ${sides[0]} / ${sides.slice(1).join(" / ")}`);
  }
  return bullets.join("\n");
}

function looksVietnamese(text) {
  return /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(text);
}

function isStickyGroqFailure(status, message) {
  if (status === 401 || status === 403 || status === 404 || status === 429 || status === 402) return true;
  const lower = String(message || "").toLowerCase();
  return /quota|rate.?limit|resource.?exhausted|too many requests|insufficient_quota|payment required/.test(lower);
}

function isTransientGroqFailure(status) {
  return status === 408 || status === 500 || status === 502 || status === 503 || status === 504;
}

function redactKeys(text, keys) {
  return (keys || []).reduce((value, key) => redact(value, key), String(text || ""));
}

async function summarizeReleaseChanges({
  commits,
  apiKeys,
  fallbackNotes = "",
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  maxAttempts = SUMMARY_ATTEMPTS,
}) {
  const fallback = String(fallbackNotes || "").trim();
  const subjects = commitSubjects(commits);
  const keys = parseApiKeys(apiKeys);
  const releaseFallback = () => ({ notes: fallback, source: "release" });
  if (!subjects.length) {
    console.error("No commit subjects to summarize; using the GitHub release description.");
    return releaseFallback();
  }
  if (!keys.length) {
    console.error("No Groq API keys configured; using the GitHub release description.");
    return releaseFallback();
  }

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const result = await summarizeWithKey({ fetchImpl, key, subjects, sleep, maxAttempts, keys });
    if (result.ok) return { notes: result.summary, source: "groq" };
    console.error(`Groq key ${index + 1} skipped (${redactKeys(result.reason, keys)}).`);
  }
  console.error("Groq summary unavailable; using the GitHub release description.");
  return releaseFallback();
}

async function summarizeWithKey({ fetchImpl, key, subjects, sleep, maxAttempts, keys }) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetchImpl(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: SUMMARY_SYSTEM },
            { role: "user", content: subjects.join("\n") },
          ],
          max_tokens: 1024,
          reasoning_effort: "low",
          include_reasoning: false,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      const message = (payload.error && payload.error.message) || "";
      const status = response.status || (response.ok ? 200 : 0);
      if (!response.ok) {
        if (isStickyGroqFailure(status, message)) return { ok: false, reason: "quota or auth" };
        if (isTransientGroqFailure(status) && attempt < maxAttempts) {
          await sleep(200 * attempt);
          continue;
        }
        return { ok: false, reason: redactKeys(message || `HTTP ${status}`, keys) };
      }
      const content =
        payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
      const summary = normalizeSummary(content);
      if (!summary) return { ok: false, reason: "unusable summary" };
      return { ok: true, summary };
    } catch (error) {
      if (attempt < maxAttempts) {
        await sleep(200 * attempt);
        continue;
      }
      return { ok: false, reason: redactKeys(error && error.message, keys) };
    }
  }
  return { ok: false, reason: "failed" };
}

function splitBilingualNotes(notes) {
  const raw = String(notes || "").trim();
  if (!raw) return { vi: "", en: "" };
  const vi = [];
  const en = [];
  let pairs = 0;
  let other = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^-\s+(.+)$/);
    const sides = match ? match[1].split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean) : [];
    if (sides.length >= 2 && looksVietnamese(sides[0])) {
      pairs += 1;
      vi.push(`- ${sides[0]}`);
      en.push(`- ${sides.slice(1).join(" / ")}`);
    } else {
      other += 1;
    }
  }
  if (pairs > 0 && other === 0) return { vi: vi.join("\n"), en: en.join("\n") };
  return { vi: "", en: raw };
}

function postSection({ title, downloadLabel, notesLabel, siteUrl, releaseUrl, changesLabel, changes }) {
  const lines = [title, "", `${downloadLabel}: ${siteUrl}`, `${notesLabel}: ${releaseUrl}`];
  if (changes) lines.push("", `${changesLabel}:`, changes);
  return lines.join("\n");
}

function buildReleaseMessage({ version, notes, siteUrl, releaseUrl }) {
  const { vi, en } = splitBilingualNotes(notes);
  return [
    postSection({
      title: `Rewrite Better ${version} đã có. (English below)`,
      downloadLabel: "Tải về",
      notesLabel: "Ghi chú phiên bản",
      siteUrl,
      releaseUrl,
      changesLabel: "Thay đổi",
      changes: vi,
    }),
    "---------",
    postSection({
      title: `Rewrite Better ${version} is available.`,
      downloadLabel: "Download",
      notesLabel: "Release notes",
      siteUrl,
      releaseUrl,
      changesLabel: "Changes",
      changes: en,
    }),
  ].join("\n\n");
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
  resolveNotes,
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

  const changelog = resolveNotes ? await resolveNotes() : notes;
  const message = buildReleaseMessage({
    version,
    notes: changelog,
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

function readText(env, inlineName, fileName) {
  if (env[inlineName] != null) return String(env[inlineName]);
  if (env[fileName]) return fs.readFileSync(env[fileName], "utf8");
  return "";
}

async function main(env = process.env) {
  const result = await publishReleasePost({
    pageId: env.FACEBOOK_PAGE_ID,
    accessToken: env.FACEBOOK_PAGE_ACCESS_TOKEN,
    tag: env.RELEASE_TAG,
    repository: env.GITHUB_REPOSITORY,
    siteUrl: env.SITE_URL,
    resolveNotes: async () => {
      const summary = await summarizeReleaseChanges({
        commits: readText(env, "RELEASE_COMMITS", "RELEASE_COMMITS_FILE"),
        apiKeys: env.GROQ_API_KEY,
        fallbackNotes: readText(env, "RELEASE_NOTES", "RELEASE_NOTES_FILE"),
      });
      if (summary.source === "groq") console.log("Using a bilingual Groq summary.");
      return summary.notes;
    },
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
  summarizeReleaseChanges,
};
