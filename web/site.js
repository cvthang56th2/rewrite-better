const COPY = {
  en: {
    "nav.download": "Download",
    "nav.privacy": "Privacy",
    "hero.title": "Rewrite without leaving the page.",
    "hero.sub": "A panel for Chrome and the Mac menu bar. Tone, format, and replies, using your own Groq key.",
    "cta.mac": "Download for Mac",
    "cta.chrome": "Get the Chrome zip",
    "cta.zip": "Download zip",
    "demo.in": "pls send the file asap thx",
    "demo.run": "Rewrite with Groq AI",
    "demo.hint": "Sample result. No API call here.",
    "mode.rewrite": "Rewrite",
    "mode.format": "Format",
    "mode.reply": "Reply",
    "dl.title": "Install on the device you write on.",
    "dl.lede": "The Mac app is a menu bar panel. The Chrome build is an unpacked zip until it is on the Chrome Web Store.",
    "mac.title": "macOS menu bar",
    "mac.body": "Select text in Mail, Slack, or a browser, press the shortcut, then copy or paste the result back.",
    "mac.warn": "macOS 13 or later. Grant Accessibility when asked. If Gatekeeper blocks the first open, right-click the app and choose Open.",
    "chrome.title": "Chrome extension",
    "chrome.body": "Works on any site from the toolbar, the context menu, or Ctrl/Cmd Shift E.",
    "chrome.s1": "Unzip the file.",
    "chrome.s2": "Open chrome://extensions and turn on Developer mode.",
    "chrome.s3": "Load unpacked and select the unzipped folder (the one with manifest.json).",
    "modes.title": "Three jobs. One panel.",
    "modes.rewrite": "Change tone, tighten a draft, or translate. Friendly, professional, concise, persuasive, or casual.",
    "modes.format": "Turn notes into Markdown, HTML, bullets, a table, an outline, a summary, or an FAQ.",
    "modes.reply": "Paste a received message, add a few notes, and draft a chat or email reply in the length and language you want.",
    "setup.title": "Bring your own Groq key.",
    "setup.body": "There is no Rewrite Better account. Create a free key at console.groq.com, paste it in Settings, and requests go from your device to Groq.",
    "setup.link": "Open Groq console",
    "privacy.title": "Your key stays on your device.",
    "privacy.body": "This site does not receive your text or API key. The apps talk to Groq directly. Read the full note on the privacy page.",
    "privacy.link": "Privacy",
    "p.h1": "Privacy",
    "p.updated": "Last updated 15 September 2026.",
    "p.s1": "No Rewrite Better servers",
    "p.s1b": "The Chrome extension and macOS app have no account system and no backend of ours. We do not receive, store, or log the text you rewrite.",
    "p.s2": "API keys",
    "p.s2b": "Your Groq API key stays on your device. In Chrome it is saved with chrome.storage.sync. On Mac it is stored in Keychain. This website never asks for a key.",
    "p.s3": "Where text goes",
    "p.s3b": "When you run Rewrite, Format, or Reply, the selected text and your options are sent from your device to Groq’s API (api.groq.com). Groq’s own privacy policy applies to that request.",
    "p.s4": "Chrome permissions",
    "p.s4b": "The extension can run on any site so the inline panel and keyboard shortcut work wherever you write. It also needs storage (for the key), contextMenus, activeTab, and scripting. Host access includes api.groq.com.",
    "p.s5": "macOS permissions",
    "p.s5b": "The Mac app asks for Accessibility so it can read the current text selection. You can deny that permission; the panel still opens, but it will not capture selected text automatically.",
    "p.s6": "This website",
    "p.s6b": "The download site is static files on Vercel. Language preference is stored in your browser (localStorage). We do not run analytics on this page unless Vercel’s platform logs apply to HTTP requests.",
    "p.s7": "Contact",
    "p.s7b": "Questions: open an issue on the GitHub repository.",
    "p.home": "Home",
  },
  vi: {
    "nav.download": "Tải về",
    "nav.privacy": "Quyền riêng tư",
    "hero.title": "Viết lại ngay, không cần rời trang.",
    "hero.sub": "Panel trên Chrome và thanh menu Mac. Đổi giọng, format, soạn reply, dùng Groq key của bạn.",
    "cta.mac": "Tải cho Mac",
    "cta.chrome": "Tải bản Chrome",
    "cta.zip": "Tải file zip",
    "demo.in": "gửi file giúp e với, gấp ạ",
    "demo.run": "Viết lại với Groq AI",
    "demo.hint": "Kết quả mẫu. Trang này không gọi API.",
    "mode.rewrite": "Rewrite",
    "mode.format": "Format",
    "mode.reply": "Reply",
    "dl.title": "Cài trên máy bạn đang viết.",
    "dl.lede": "Bản Mac nằm trên thanh menu. Bản Chrome là zip Load unpacked cho đến khi lên Chrome Web Store.",
    "mac.title": "Thanh menu macOS",
    "mac.body": "Bôi text trong Mail, Slack, hoặc trình duyệt, bấm phím tắt, rồi copy hoặc dán kết quả lại.",
    "mac.warn": "macOS 13 trở lên. Cấp Accessibility khi hệ thống hỏi. Nếu Gatekeeper chặn lần đầu, chuột phải app rồi chọn Open.",
    "chrome.title": "Tiện ích Chrome",
    "chrome.body": "Dùng trên mọi trang từ thanh công cụ, menu chuột phải, hoặc Ctrl/Cmd Shift E.",
    "chrome.s1": "Giải nén file zip.",
    "chrome.s2": "Mở chrome://extensions và bật Developer mode.",
    "chrome.s3": "Load unpacked và chọn thư mục vừa giải nén (có file manifest.json).",
    "modes.title": "Ba việc. Một panel.",
    "modes.rewrite": "Đổi giọng, rút gọn bản nháp, hoặc dịch. Friendly, professional, concise, persuasive, hoặc casual.",
    "modes.format": "Đổi ghi chú thành Markdown, HTML, bullet, bảng, dàn ý, tóm tắt, hoặc FAQ.",
    "modes.reply": "Dán tin nhắn nhận được, thêm vài ý, rồi soạn reply chat hoặc email đúng độ dài và ngôn ngữ bạn muốn.",
    "setup.title": "Dùng Groq key của bạn.",
    "setup.body": "Không có tài khoản Rewrite Better. Tạo key miễn phí tại console.groq.com, dán vào Settings, request đi thẳng từ máy bạn tới Groq.",
    "setup.link": "Mở Groq console",
    "privacy.title": "Key ở lại trên máy bạn.",
    "privacy.body": "Site này không nhận text hay API key. App gọi Groq trực tiếp. Chi tiết nằm ở trang quyền riêng tư.",
    "privacy.link": "Quyền riêng tư",
    "p.h1": "Quyền riêng tư",
    "p.updated": "Cập nhật 15 tháng 9 2026.",
    "p.s1": "Không có server của Rewrite Better",
    "p.s1b": "Tiện ích Chrome và app macOS không có tài khoản, không có backend của chúng tôi. Chúng tôi không nhận, lưu, hay log đoạn text bạn viết lại.",
    "p.s2": "API key",
    "p.s2b": "Groq API key nằm trên máy bạn. Chrome lưu bằng chrome.storage.sync. Mac lưu trong Keychain. Website này không hỏi key.",
    "p.s3": "Text đi đâu",
    "p.s3b": "Khi chạy Rewrite, Format, hoặc Reply, đoạn text và tùy chọn được gửi từ máy bạn tới API của Groq (api.groq.com). Chính sách của Groq áp dụng cho request đó.",
    "p.s4": "Quyền Chrome",
    "p.s4b": "Tiện ích chạy được trên mọi site để panel và phím tắt hoạt động chỗ bạn đang viết. Cần thêm storage (cho key), contextMenus, activeTab, và scripting. Host gồm api.groq.com.",
    "p.s5": "Quyền macOS",
    "p.s5b": "App Mac xin Accessibility để đọc text đang chọn. Bạn có thể từ chối; panel vẫn mở, nhưng không tự lấy đoạn đang bôi.",
    "p.s6": "Website này",
    "p.s6b": "Trang tải về là file tĩnh trên Vercel. Ngôn ngữ giao diện lưu trong trình duyệt (localStorage). Chúng tôi không gắn analytics, trừ log HTTP của Vercel nếu có.",
    "p.s7": "Liên hệ",
    "p.s7b": "Câu hỏi: mở issue trên GitHub.",
    "p.home": "Trang chủ",
  },
};

const DEMO = {
  rewrite: {
    chips: [
      { label: { en: "Friendly", vi: "Friendly" }, active: true },
      { label: { en: "Professional", vi: "Professional" } },
      { label: { en: "Concise", vi: "Concise" } },
    ],
    run: { en: "Rewrite with Groq AI", vi: "Viết lại với Groq AI" },
    out: {
      en: "Could you please send the file as soon as you can? Thank you.",
      vi: "Bạn gửi giúp mình file được không? Mình cần gấp. Cảm ơn bạn.",
    },
  },
  format: {
    chips: [
      { label: { en: "Markdown", vi: "Markdown" }, active: true },
      { label: { en: "Bullets", vi: "Bullets" } },
      { label: { en: "Summary", vi: "Summary" } },
    ],
    run: { en: "Format Document", vi: "Format Document" },
    out: {
      en: "- Send the file\n- Needed as soon as possible\n- Thank the recipient",
      vi: "- Gửi file\n- Cần gấp\n- Cảm ơn người nhận",
    },
  },
  reply: {
    chips: [
      { label: { en: "Email", vi: "Email" }, active: true },
      { label: { en: "Follow up", vi: "Follow up" } },
      { label: { en: "Short", vi: "Short" } },
    ],
    run: { en: "Generate Reply", vi: "Generate Reply" },
    out: {
      en: "Hi, just checking in on the file when you have a moment. Thank you.",
      vi: "Chào bạn, mình hỏi lại file giúp khi bạn rảnh được không? Cảm ơn bạn.",
    },
  },
};

function detectLang() {
  const saved = localStorage.getItem("rb-lang");
  if (saved === "en" || saved === "vi") return saved;
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

function applyLang(lang) {
  const dict = COPY[lang] || COPY.en;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const on = btn.dataset.lang === lang;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
  const demo = document.querySelector("[data-demo]");
  if (demo) renderChips(demo.dataset.mode || "rewrite", lang);
}

function renderChips(mode, lang) {
  const host = document.querySelector("[data-demo-chips]");
  const run = document.querySelector("[data-demo-run]");
  if (!host) return;
  const spec = DEMO[mode];
  host.innerHTML = spec.chips
    .map((chip) => `<span class="chip${chip.active ? " is-active" : ""}">${chip.label[lang]}</span>`)
    .join("");
  if (run) run.textContent = spec.run[lang];
}

async function resolveMacUrl() {
  const local = "downloads/RewriteBetter.dmg";
  try {
    const res = await fetch(local, { method: "HEAD" });
    if (res.ok) return local;
  } catch {
    /* use GitHub */
  }
  return "https://github.com/cvthang56th2/rewrite-better/releases/latest/download/RewriteBetter-1.0.dmg";
}

function initDemo() {
  const root = document.querySelector("[data-demo]");
  if (!root) return;
  root.dataset.mode = "rewrite";
  const out = root.querySelector("[data-demo-out]");
  const lang = () => document.documentElement.lang || "en";

  root.querySelectorAll("[data-demo-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll("[data-demo-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      root.dataset.mode = btn.dataset.demoMode;
      renderChips(btn.dataset.demoMode, lang());
      out.classList.add("is-empty");
      out.textContent = COPY[lang()]["demo.hint"];
    });
  });

  root.querySelector("[data-demo-run]").addEventListener("click", () => {
    const mode = root.dataset.mode || "rewrite";
    out.classList.remove("is-empty");
    out.textContent = DEMO[mode].out[lang()];
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.setItem("rb-lang", btn.dataset.lang);
    applyLang(btn.dataset.lang);
  });
});

applyLang(detectLang());
initDemo();
resolveMacUrl().then((url) => {
  document.querySelectorAll("#macDownload, #macDownload2").forEach((a) => {
    a.href = url;
  });
});
