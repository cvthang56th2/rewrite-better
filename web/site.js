const COPY = {
  en: {
    "nav.download": "Download",
    "nav.privacy": "Privacy",
    "hero.title": "Rewrite without leaving the page.",
    "hero.sub": "A panel on Chrome, Mac, and Windows. Rewrite, format, reply, and writing assist, using your own API key.",
    "cta.mac": "Download for Mac",
    "cta.win": "Download for Windows",
    "cta.chrome": "Get the Chrome zip",
    "cta.zip": "Download zip",
    "demo.in": "pls send the file asap thx",
    "demo.run": "Rewrite with Groq AI",
    "demo.hint": "Sample result. No API call here.",
    "demo.assist": "Writing assist",
    "demo.tab": "Tab to accept",
    "demo.variant": "Variant",
    "demo.changes": "Changes",
    "mode.rewrite": "Rewrite",
    "mode.format": "Format",
    "mode.reply": "Reply",
    "dl.title": "Install on the device you write on.",
    "dl.lede": "Native apps for Mac and Windows, plus a Chrome zip until the extension is on the Chrome Web Store.",
    "mac.title": "macOS menu bar",
    "mac.body": "Select text in Mail, Slack, or a browser, press the shortcut, then Replace or copy the result back.",
    "mac.warn": "macOS 13 or later. Grant Accessibility when asked. If Gatekeeper blocks the first open, right-click the app and choose Open.",
    "win.title": "Windows tray",
    "win.body": "Select text in any app, press Ctrl Shift E, then Replace to put the result back, or copy from the tray panel.",
    "win.warn": "Windows 10 or later. SmartScreen may warn on unsigned builds: More info, then Run anyway.",
    "chrome.title": "Chrome extension",
    "chrome.body": "Works on any site from the toolbar, the context menu, or Ctrl/Cmd Shift E. Replace puts the result back into the field.",
    "chrome.s1": "Unzip the file.",
    "chrome.s2": "Open chrome://extensions and turn on Developer mode.",
    "chrome.s3": "Load unpacked and select the unzipped folder (the one with manifest.json).",
    "modes.title": "The same panel on every device.",
    "modes.rewrite": "Change tone, tighten a draft, or translate. Three variants plus a word-level diff of what changed.",
    "modes.format": "Turn notes into Markdown, HTML, bullets, a table, an outline, a summary, or an FAQ.",
    "modes.reply": "Paste a received message, add a few notes, and draft a chat or email reply in the length and language you want.",
    "mode.assist": "Writing assist",
    "modes.assist": "Tab autocomplete as you type, plus Check writing for grammar and wording.",
    "mode.voice": "Voice profile",
    "modes.voice": "Paste a few samples of how you write. Rewrite, Reply, and writing assist match that voice. Stays on the device.",
    "mode.replace": "Replace",
    "modes.replace": "Copy the result, or Replace to put it back into the field or app you came from.",
    "setup.title": "Bring your own API key.",
    "setup.body": "There is no Rewrite Better account. Paste a Gemini, Groq, Cerebras, or OpenAI key in Settings. Keys are tried in that order when one hits quota. Requests go from your device to the provider.",
    "setup.link": "Open Groq console",
    "privacy.title": "Your key stays on your device.",
    "privacy.body": "This site does not receive your text or API key. The apps talk to your AI provider directly. Read the full note on the privacy page.",
    "privacy.link": "Privacy",
    "p.h1": "Privacy",
    "p.updated": "Last updated 16 September 2026.",
    "p.s1": "No Rewrite Better servers",
    "p.s1b": "The Chrome extension, macOS app, and Windows app have no account system and no backend of ours. We do not receive, store, or log the text you rewrite.",
    "p.s2": "API keys",
    "p.s2b": "Your API key stays on your device. Chrome uses chrome.storage.sync. Mac uses Keychain. Windows keeps keys in local app storage. This website never asks for a key.",
    "p.s3": "Where text goes",
    "p.s3b": "When you run Rewrite, Format, Reply, or writing assist, the selected text and your options are sent from your device to the AI provider whose key you configured (for example Groq at api.groq.com). That provider’s privacy policy applies.",
    "p.s4": "Chrome permissions",
    "p.s4b": "The extension can run on any site so the inline panel and keyboard shortcut work wherever you write. It also needs storage (for the key), contextMenus, activeTab, and scripting. Host access includes the provider APIs you use.",
    "p.s5": "macOS permissions",
    "p.s5b": "The Mac app asks for Accessibility so it can read the current text selection and put a result back. You can deny that permission; the panel still opens, but it will not capture selected text automatically.",
    "p.s5w": "Windows behavior",
    "p.s5wb": "The Windows app captures selected text with a Ctrl+C probe, then restores the previous clipboard. It does not require a special Accessibility toggle. Elevated windows may not be readable unless Rewrite Better is also elevated.",
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
    "hero.sub": "Panel trên Chrome, Mac, và Windows. Viết lại, format, soạn reply, và hỗ trợ viết, dùng API key của bạn.",
    "cta.mac": "Tải cho Mac",
    "cta.win": "Tải cho Windows",
    "cta.chrome": "Tải bản Chrome",
    "cta.zip": "Tải file zip",
    "demo.in": "gửi file giúp e với, gấp ạ",
    "demo.run": "Viết lại với Groq AI",
    "demo.hint": "Kết quả mẫu. Trang này không gọi API.",
    "demo.assist": "Hỗ trợ viết",
    "demo.tab": "Tab để nhận",
    "demo.variant": "Bản",
    "demo.changes": "Thay đổi",
    "mode.rewrite": "Rewrite",
    "mode.format": "Format",
    "mode.reply": "Reply",
    "dl.title": "Cài trên máy bạn đang viết.",
    "dl.lede": "App native cho Mac và Windows, cùng bản Chrome zip cho đến khi lên Chrome Web Store.",
    "mac.title": "Thanh menu macOS",
    "mac.body": "Bôi text trong Mail, Slack, hoặc trình duyệt, bấm phím tắt, rồi Thay thế hoặc copy kết quả lại.",
    "mac.warn": "macOS 13 trở lên. Cấp Accessibility khi hệ thống hỏi. Nếu Gatekeeper chặn lần đầu, chuột phải app rồi chọn Open.",
    "win.title": "Khay hệ thống Windows",
    "win.body": "Bôi text trong app bất kỳ, bấm Ctrl Shift E, rồi Thay thế để đưa kết quả lại, hoặc copy từ panel trên khay.",
    "win.warn": "Windows 10 trở lên. SmartScreen có thể cảnh báo bản chưa ký: More info, rồi Run anyway.",
    "chrome.title": "Tiện ích Chrome",
    "chrome.body": "Dùng trên mọi trang từ thanh công cụ, menu chuột phải, hoặc Ctrl/Cmd Shift E. Thay thế đưa kết quả lại vào ô đang viết.",
    "chrome.s1": "Giải nén file zip.",
    "chrome.s2": "Mở chrome://extensions và bật Developer mode.",
    "chrome.s3": "Load unpacked và chọn thư mục vừa giải nén (có file manifest.json).",
    "modes.title": "Cùng một panel trên mọi máy.",
    "modes.rewrite": "Đổi giọng, rút gọn bản nháp, hoặc dịch. Ba bản khác, kèm diff từng từ những chỗ đã đổi.",
    "modes.format": "Đổi ghi chú thành Markdown, HTML, bullet, bảng, dàn ý, tóm tắt, hoặc FAQ.",
    "modes.reply": "Dán tin nhắn nhận được, thêm vài ý, rồi soạn reply chat hoặc email đúng độ dài và ngôn ngữ bạn muốn.",
    "mode.assist": "Hỗ trợ viết",
    "modes.assist": "Gợi ý Tab khi đang gõ, cộng Kiểm tra ngữ pháp và cách diễn đạt.",
    "mode.voice": "Giọng viết",
    "modes.voice": "Dán vài đoạn theo cách bạn thường viết. Rewrite, Reply, và hỗ trợ viết bám giọng đó. Chỉ lưu trên máy.",
    "mode.replace": "Thay thế",
    "modes.replace": "Copy kết quả, hoặc Thay thế để đưa lại vào ô hoặc app bạn vừa viết.",
    "setup.title": "Dùng API key của bạn.",
    "setup.body": "Không có tài khoản Rewrite Better. Dán key Gemini, Groq, Cerebras, hoặc OpenAI vào Settings. Hết quota thì thử key tiếp theo theo thứ tự đó. Request đi thẳng từ máy bạn tới nhà cung cấp.",
    "setup.link": "Mở Groq console",
    "privacy.title": "Key ở lại trên máy bạn.",
    "privacy.body": "Site này không nhận text hay API key. App gọi trực tiếp nhà cung cấp AI của bạn. Chi tiết nằm ở trang quyền riêng tư.",
    "privacy.link": "Quyền riêng tư",
    "p.h1": "Quyền riêng tư",
    "p.updated": "Cập nhật 16 tháng 9 2026.",
    "p.s1": "Không có server của Rewrite Better",
    "p.s1b": "Tiện ích Chrome, app macOS, và app Windows không có tài khoản, không có backend của chúng tôi. Chúng tôi không nhận, lưu, hay log đoạn text bạn viết lại.",
    "p.s2": "API key",
    "p.s2b": "API key nằm trên máy bạn. Chrome dùng chrome.storage.sync. Mac dùng Keychain. Windows lưu local trong app. Website này không hỏi key.",
    "p.s3": "Text đi đâu",
    "p.s3b": "Khi chạy Rewrite, Format, Reply, hoặc hỗ trợ viết, đoạn text và tùy chọn được gửi từ máy bạn tới nhà cung cấp AI bạn đã cấu hình (ví dụ Groq tại api.groq.com). Chính sách của nhà cung cấp đó áp dụng.",
    "p.s4": "Quyền Chrome",
    "p.s4b": "Tiện ích chạy được trên mọi site để panel và phím tắt hoạt động chỗ bạn đang viết. Cần thêm storage (cho key), contextMenus, activeTab, và scripting. Host gồm API của nhà cung cấp bạn dùng.",
    "p.s5": "Quyền macOS",
    "p.s5b": "App Mac xin Accessibility để đọc text đang chọn và dán kết quả lại. Bạn có thể từ chối; panel vẫn mở, nhưng không tự lấy đoạn đang bôi.",
    "p.s5w": "Cách Windows hoạt động",
    "p.s5wb": "App Windows lấy text đang chọn bằng Ctrl+C probe, rồi khôi phục clipboard trước đó. Không cần bật Accessibility riêng. Cửa sổ chạy elevated có thể không đọc được nếu Rewrite Better không elevated.",
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
      { label: { en: "Friendly", vi: "Thân thiện" }, active: true },
      { label: { en: "Translate", vi: "Dịch" } },
      { label: { en: "Concise", vi: "Ngắn gọn" } },
    ],
    run: { en: "Rewrite with Groq AI", vi: "Viết lại với Groq AI" },
    variants: [
      {
        en: "Could you please send the file as soon as you can? Thank you.",
        vi: "Bạn gửi giúp mình file được không? Mình cần gấp. Cảm ơn bạn.",
      },
      {
        en: "Please send over the file when you can. Thanks.",
        vi: "Gửi giúp mình file lúc tiện nhé. Cảm ơn bạn.",
      },
      {
        en: "Quick nudge: could you share the file today?",
        vi: "Nhắc nhẹ: hôm nay gửi được file không?",
      },
    ],
    diff: {
      en: "asap → as soon as you can · thx → Thank you",
      vi: "gấp ạ → Mình cần gấp · e → bạn",
    },
  },
  format: {
    chips: [
      { label: { en: "Markdown", vi: "Markdown" }, active: true },
      { label: { en: "Bullets", vi: "Bullets" } },
      { label: { en: "Summary", vi: "Summary" } },
    ],
    run: { en: "Format Document", vi: "Format Document" },
    variants: [
      {
        en: "- Send the file\n- Needed as soon as possible\n- Thank the recipient",
        vi: "- Gửi file\n- Cần gấp\n- Cảm ơn người nhận",
      },
    ],
  },
  reply: {
    chips: [
      { label: { en: "Email", vi: "Email" }, active: true },
      { label: { en: "Follow up", vi: "Follow up" } },
      { label: { en: "Short", vi: "Short" } },
    ],
    run: { en: "Generate Reply", vi: "Generate Reply" },
    variants: [
      {
        en: "Hi, just checking in on the file when you have a moment. Thank you.",
        vi: "Chào bạn, mình hỏi lại file giúp khi bạn rảnh được không? Cảm ơn bạn.",
      },
    ],
  },
};

const RELEASE = {
  macLocal: "downloads/RewriteBetter.dmg",
  winLocal: "downloads/RewriteBetter-setup.exe",
  api: "https://api.github.com/repos/cvthang56th2/rewrite-better/releases",
};

function detectLang() {
  const saved = localStorage.getItem("rb-lang");
  if (saved === "en" || saved === "vi") return saved;
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

function detectOs() {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "win";
  if (/Mac OS X|Macintosh/i.test(ua)) return "mac";
  return "other";
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
  if (demo) {
    const mode = demo.dataset.mode || "rewrite";
    renderChips(mode, lang);
    if (demo.dataset.hasResult === "1") {
      showDemoResult(mode, Number(demo.dataset.variantIndex) || 0);
    }
  }
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

function resetDemoResult() {
  const root = document.querySelector("[data-demo]");
  const out = document.querySelector("[data-demo-out]");
  const variants = document.querySelector("[data-demo-variants]");
  const diff = document.querySelector("[data-demo-diff]");
  const lang = document.documentElement.lang || "en";
  if (root) {
    root.dataset.hasResult = "0";
    root.dataset.variantIndex = "0";
  }
  if (out) {
    out.classList.add("is-empty");
    out.textContent = COPY[lang]["demo.hint"];
  }
  if (variants) {
    variants.hidden = true;
    variants.innerHTML = "";
  }
  if (diff) {
    diff.hidden = true;
    diff.textContent = "";
  }
}

function showDemoResult(mode, variantIndex = 0) {
  const spec = DEMO[mode];
  const lang = document.documentElement.lang || "en";
  const root = document.querySelector("[data-demo]");
  const out = document.querySelector("[data-demo-out]");
  const variantsEl = document.querySelector("[data-demo-variants]");
  const diff = document.querySelector("[data-demo-diff]");
  const list = spec.variants || [];
  const index = Math.min(Math.max(variantIndex, 0), Math.max(list.length - 1, 0));
  if (root) {
    root.dataset.hasResult = "1";
    root.dataset.variantIndex = String(index);
  }
  if (out && list[index]) {
    out.classList.remove("is-empty");
    out.textContent = list[index][lang];
  }
  if (variantsEl) {
    if (list.length < 2) {
      variantsEl.hidden = true;
      variantsEl.innerHTML = "";
    } else {
      variantsEl.hidden = false;
      variantsEl.innerHTML = list
        .map((_, i) => {
          const active = i === index ? " is-active" : "";
          return `<button type="button" class="chip${active}" data-demo-variant="${i}">${COPY[lang]["demo.variant"]} ${i + 1}</button>`;
        })
        .join("");
    }
  }
  if (diff) {
    if (mode === "rewrite" && spec.diff) {
      diff.hidden = false;
      diff.textContent = `${COPY[lang]["demo.changes"]}: ${spec.diff[lang]}`;
    } else {
      diff.hidden = true;
      diff.textContent = "";
    }
  }
}

async function existingLocalUrl(path) {
  try {
    const res = await fetch(path, { method: "HEAD" });
    if (res.ok) return path;
  } catch {
    /* missing */
  }
  return null;
}

async function fetchPublishedRelease() {
  const api = window.RewriteBetterWeb;
  if (!api) return null;
  try {
    const latest = await fetch(`${RELEASE.api}/latest`);
    if (latest.ok) return api.latestPublishedRelease(await latest.json());
    const all = await fetch(RELEASE.api);
    if (all.ok) return api.latestPublishedRelease(await all.json());
  } catch {
    /* use fallback */
  }
  return null;
}

function styleHeroCtas(os) {
  const mac = document.getElementById("macDownload");
  const win = document.getElementById("winDownload");
  if (!mac || !win) return;
  if (os === "win") {
    win.classList.add("btn-primary");
    win.classList.remove("btn-secondary");
    mac.classList.add("btn-secondary");
    mac.classList.remove("btn-primary");
  } else {
    mac.classList.add("btn-primary");
    mac.classList.remove("btn-secondary");
    win.classList.add("btn-secondary");
    win.classList.remove("btn-primary");
  }
}

function setDemoShortcut(os) {
  const kbd = document.querySelector("[data-demo] .kbd");
  if (!kbd) return;
  kbd.textContent = os === "mac" ? "Cmd Shift E" : "Ctrl Shift E";
}

function initDemo() {
  const root = document.querySelector("[data-demo]");
  if (!root) return;
  root.dataset.mode = "rewrite";
  const lang = () => document.documentElement.lang || "en";

  root.querySelectorAll("[data-demo-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll("[data-demo-mode]").forEach((b) => b.classList.toggle("is-active", b === btn));
      root.dataset.mode = btn.dataset.demoMode;
      renderChips(btn.dataset.demoMode, lang());
      resetDemoResult();
    });
  });

  root.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-demo-variant]");
    if (!chip || !root.contains(chip)) return;
    showDemoResult(root.dataset.mode || "rewrite", Number(chip.dataset.demoVariant) || 0);
  });

  root.querySelector("[data-demo-run]").addEventListener("click", () => {
    showDemoResult(root.dataset.mode || "rewrite", 0);
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.setItem("rb-lang", btn.dataset.lang);
    applyLang(btn.dataset.lang);
  });
});

const os = detectOs();
applyLang(detectLang());
styleHeroCtas(os);
setDemoShortcut(os);
initDemo();

if (window.RewriteBetterWeb && document.getElementById("macDownload")) {
  Promise.all([
    existingLocalUrl(RELEASE.macLocal),
    existingLocalUrl(RELEASE.winLocal),
    fetchPublishedRelease(),
  ]).then(([localMac, localWin, remote]) => {
    const urls = window.RewriteBetterWeb.desktopDownloadUrls({ localMac, localWin, remote });
    document.querySelectorAll("#macDownload, #macDownload2").forEach((a) => {
      a.href = urls.mac;
    });
    document.querySelectorAll("#winDownload, #winDownload2").forEach((a) => {
      a.href = urls.win;
    });
  });
}
