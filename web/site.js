const COPY = {
  en: {
    "nav.download": "Download",
    "nav.privacy": "Privacy",
    "nav.releases": "Releases",
    "nav.feedback": "Feedback",
    "nav.skip": "Skip to content",
    "nav.shots": "Screenshots",
    "hero.title": "Rewrite without leaving the\u00a0page",
    "hero.sub": "A panel on Chrome, Mac, and Windows. Rewrite, format, reply, and writing assist, using your own API key.",
    "cta.mac": "Download for Mac",
    "cta.win": "Download for Windows",
    "cta.chrome": "Get the Chrome zip",
    "cta.zip": "Download zip",
    "video.play": "Play demo",
    "video.soon": "Demo video coming soon",
    "video.caption": "See the panel on Chrome, Mac, and Windows.",
    "story.a": "You finish a draft, you're not sure, so you paste it into ChatGPT and type rewrite better. Don't. Select the text, press",
    "story.b": ", pick a style and language, then Rewrite Better. Then you get a better version. Beautiful!",
    "try.title": "Try a sample rewrite.",
    "try.lede": "Same panel as Chrome, Mac, and Windows. No API call on this page.",
    "shots.title": "The panel on Chrome, Mac, and Windows.",
    "shots.lede": "Screenshots from the live apps. Same rewrite flow on every device.",
    "shots.platforms": "Platforms",
    "shots.chrome": "Chrome",
    "shots.mac": "Mac",
    "shots.win": "Windows",
    "shots.chromeCap": "Chrome panel, on the page you are writing.",
    "shots.macCap": "Mac menu bar app, over the desktop.",
    "shots.winCap": "Windows tray app, over the desktop.",
    "shots.chromeAlt": "Rewrite Better Chrome panel over the page you are writing.",
    "shots.macAlt": "Rewrite Better Mac menu bar app over the desktop.",
    "shots.winAlt": "Rewrite Better Windows tray app over the desktop.",
    "shots.settings": "Settings",
    "shots.welcome": "Welcome",
    "shots.privacyWin": "Privacy",
    "shots.settingsCap": "Settings on Mac. API keys stay in Keychain.",
    "shots.welcomeCap": "Welcome on Mac. Accessibility, API key, then the shortcut.",
    "shots.privacyCap": "Privacy on Mac. No account, no Rewrite Better server.",
    "shots.settingsAlt": "Rewrite Better Settings on Mac, with API keys and the panel shortcut.",
    "shots.welcomeAlt": "Rewrite Better Welcome window on Mac.",
    "shots.privacyAlt": "Rewrite Better Privacy window on Mac.",
    "shots.settingsOpen": "View Settings",
    "shots.welcomeOpen": "View Welcome",
    "shots.privacyOpen": "View Privacy",
    "shots.expand": "View larger",
    "shots.close": "Close",
    "shots.prev": "Previous screenshot",
    "shots.next": "Next screenshot",
    "shots.macWindows": "Mac windows",
    "demo.in": "pls send the file asap thx",
    "demo.run": "Rewrite with Groq AI",
    "demo.working": "Rewriting…",
    "demo.hint": "Sample result. No API call here.",
    "demo.modes": "Demo modes",
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
    "mac.brew": "Or with Homebrew",
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
    "help.title": "Feedback",
    "help.lede": "Email me, message me on Facebook, or open a GitHub issue for a bug, a feature idea, or a question.",
    "help.email": "Email",
    "help.facebook": "Facebook",
    "help.bug": "Report a bug",
    "help.idea": "Request a feature",
    "help.ask": "Ask a question",
    "trust.account": "No Rewrite Better account",
    "trust.key": "API key stays on your device",
    "trust.mit": "Open source, MIT",
    "trust.label": "Trust notes",
    "foot.note": "MIT license. No account. Keys stay on your device.",
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
    "p.s6b": "The download site is static files on Vercel. Language preference is stored in your browser (localStorage). We use Google Analytics 4 for page views and download-button clicks. That data is processed by Google; we do not use it for ads.",
    "p.s7": "Contact",
    "p.s7b": "Email me, message me on Facebook, or open a GitHub issue for a bug, a feature idea, or a question.",
    "p.home": "Home",
    "p.fact1": "No account, no backend of ours. We never receive the text you rewrite.",
    "p.fact2": "Chrome, Mac, and Windows keep your key locally. This website never asks for it.",
    "p.fact3": "Selected text goes from your device to the AI provider you configured. This website never sees it.",
    "rel.h1": "Releases",
    "rel.lede": "Desktop builds from GitHub. The Chrome zip stays on the homepage download section.",
    "rel.loading": "Loading releases…",
    "rel.error": "Couldn't load releases.",
    "rel.github": "Open GitHub Releases",
    "rel.empty": "No published releases yet.",
    "rel.notesEmpty": "No notes for this release.",
    "rel.banner": "{tag} is out · {date}",
    "rel.bannerLink": "What's new",
    "rel.dismiss": "Dismiss",
  },
  vi: {
    "nav.download": "Tải về",
    "nav.privacy": "Quyền riêng tư",
    "nav.releases": "Bản phát hành",
    "nav.feedback": "Góp ý",
    "nav.skip": "Bỏ qua đến nội dung",
    "nav.shots": "Ảnh chụp",
    "hero.title": "Viết lại ngay, không cần rời\u00a0trang",
    "hero.sub": "Panel trên Chrome, Mac, và Windows. Viết lại, format, soạn reply, và hỗ trợ viết, dùng API key của bạn.",
    "cta.mac": "Tải cho Mac",
    "cta.win": "Tải cho Windows",
    "cta.chrome": "Tải bản Chrome",
    "cta.zip": "Tải file zip",
    "video.play": "Phát video",
    "video.soon": "Video demo sắp có",
    "video.caption": "Xem panel trên Chrome, Mac, và Windows.",
    "story.a": "Viết xong một đoạn, chưa tự tin, bạn mở ChatGPT rồi gõ rewrite better. Đừng. Bôi đen, bấm",
    "story.b": ", chọn phong cách và ngôn ngữ, rồi Rewrite Better. Xong, bạn có bản hay hơn. Beautiful!",
    "try.title": "Thử một lần viết lại.",
    "try.lede": "Cùng panel như Chrome, Mac, và Windows. Trang này không gọi API.",
    "shots.title": "Panel trên Chrome, Mac, và Windows.",
    "shots.lede": "Ảnh chụp từ app đang chạy. Cùng một luồng viết lại trên mọi máy.",
    "shots.platforms": "Nền tảng",
    "shots.chrome": "Chrome",
    "shots.mac": "Mac",
    "shots.win": "Windows",
    "shots.chromeCap": "Panel Chrome, ngay trên trang bạn đang viết.",
    "shots.macCap": "App thanh menu Mac, trên desktop.",
    "shots.winCap": "App khay hệ thống Windows, trên desktop.",
    "shots.chromeAlt": "Panel Rewrite Better trên Chrome, đè lên trang đang viết.",
    "shots.macAlt": "App menu bar Rewrite Better trên Mac.",
    "shots.winAlt": "App khay hệ thống Rewrite Better trên Windows.",
    "shots.settings": "Settings",
    "shots.welcome": "Welcome",
    "shots.privacyWin": "Privacy",
    "shots.settingsCap": "Settings trên Mac. API key nằm trong Keychain.",
    "shots.welcomeCap": "Welcome trên Mac. Accessibility, API key, rồi phím tắt.",
    "shots.privacyCap": "Privacy trên Mac. Không tài khoản, không server của Rewrite Better.",
    "shots.settingsAlt": "Cửa sổ Settings trên Mac, với API key và phím tắt.",
    "shots.welcomeAlt": "Cửa sổ Welcome trên Mac.",
    "shots.privacyAlt": "Cửa sổ Privacy trên Mac.",
    "shots.settingsOpen": "Xem Settings",
    "shots.welcomeOpen": "Xem Welcome",
    "shots.privacyOpen": "Xem Privacy",
    "shots.expand": "Xem ảnh lớn",
    "shots.close": "Đóng",
    "shots.prev": "Ảnh trước",
    "shots.next": "Ảnh sau",
    "shots.macWindows": "Cửa sổ trên Mac",
    "demo.in": "gửi file giúp e với, gấp ạ",
    "demo.run": "Viết lại với Groq AI",
    "demo.working": "Đang viết lại…",
    "demo.hint": "Kết quả mẫu. Trang này không gọi API.",
    "demo.modes": "Chế độ demo",
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
    "mac.brew": "Hoặc dùng Homebrew",
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
    "help.title": "Góp ý",
    "help.lede": "Gửi email cho tôi, nhắn trên Facebook, hoặc mở issue trên GitHub cho lỗi, ý tưởng, hoặc câu hỏi.",
    "help.email": "Email",
    "help.facebook": "Facebook",
    "help.bug": "Báo lỗi",
    "help.idea": "Đề xuất tính năng",
    "help.ask": "Đặt câu hỏi",
    "trust.account": "Không cần tài khoản",
    "trust.key": "API key ở lại trên máy bạn",
    "trust.mit": "Mã nguồn mở, MIT",
    "trust.label": "Ghi chú tin cậy",
    "foot.note": "Giấy phép MIT. Không cần tài khoản. Key ở lại trên máy.",
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
    "p.s6b": "Trang tải về là file tĩnh trên Vercel. Ngôn ngữ giao diện lưu trong trình duyệt (localStorage). Chúng tôi dùng Google Analytics 4 cho lượt xem trang và click nút tải. Dữ liệu do Google xử lý; không dùng để quảng cáo.",
    "p.s7": "Liên hệ",
    "p.s7b": "Gửi email cho tôi, nhắn trên Facebook, hoặc mở issue trên GitHub cho lỗi, ý tưởng, hoặc câu hỏi.",
    "p.home": "Trang chủ",
    "p.fact1": "Không tài khoản, không backend của chúng tôi. Chúng tôi không nhận đoạn text bạn viết lại.",
    "p.fact2": "Chrome, Mac, và Windows giữ key trên máy. Website này không hỏi key.",
    "p.fact3": "Text đang chọn đi từ máy bạn tới nhà cung cấp AI bạn cấu hình. Website này không thấy nội dung đó.",
    "rel.h1": "Bản phát hành",
    "rel.lede": "Bản desktop từ GitHub. File zip Chrome vẫn nằm ở mục tải trên trang chủ.",
    "rel.loading": "Đang tải bản phát hành…",
    "rel.error": "Không tải được danh sách bản phát hành.",
    "rel.github": "Mở GitHub Releases",
    "rel.empty": "Chưa có bản phát hành.",
    "rel.notesEmpty": "Bản này chưa có ghi chú.",
    "rel.banner": "{tag} đã ra mắt · {date}",
    "rel.bannerLink": "Có gì mới",
    "rel.dismiss": "Đóng",
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
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (dict[key]) el.setAttribute("aria-label", dict[key]);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (dict[key]) el.setAttribute("alt", dict[key]);
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
  refreshShotCopy(lang);
  refreshReleaseBanner();
  if (releasePayload !== undefined) renderReleaseList(releasePayload);
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

let releasePayload;

async function loadReleasePayload() {
  const api = window.RewriteBetterWeb;
  if (!api) return null;
  const cached = api.readReleaseCache(sessionStorage);
  try {
    const latestRes = await fetch(`${RELEASE.api}/latest`);
    const latest = latestRes.ok ? await latestRes.json() : null;
    if (cached && api.shouldUseReleaseCache(cached, latest)) return cached;
    const all = await fetch(RELEASE.api);
    if (all.ok) {
      const payload = await all.json();
      api.writeReleaseCache(sessionStorage, payload);
      return payload;
    }
    if (cached) return cached;
    return latest ? [latest] : null;
  } catch {
    return cached || null;
  }
}

function copyFor(lang) {
  return COPY[lang] || COPY.en;
}

function refreshReleaseBanner() {
  const api = window.RewriteBetterWeb;
  const banner = document.querySelector("[data-release-banner]");
  const tag = banner?.dataset.tag;
  if (!api || !banner || banner.hidden || !tag) return;
  const lang = document.documentElement.lang || "en";
  const dict = copyFor(lang);
  const date = api.formatReleaseDate(banner.dataset.published, lang);
  const title = banner.querySelector("[data-release-banner-title]");
  const link = banner.querySelector("[data-release-banner-link]");
  if (title) title.textContent = api.fillReleaseBanner(dict["rel.banner"], { tag, date });
  if (link) link.textContent = dict["rel.bannerLink"];
}

function showReleaseBanner(release) {
  const api = window.RewriteBetterWeb;
  const banner = document.querySelector("[data-release-banner]");
  if (!api || !banner || !release) return;
  const tag = String(release.tag_name || "").trim();
  const dismissed = localStorage.getItem(api.DISMISSED_RELEASE_KEY);
  if (!api.shouldShowReleaseBanner(tag, dismissed)) return;
  banner.dataset.tag = tag;
  banner.dataset.published = release.published_at || release.created_at || "";
  banner.hidden = false;
  refreshReleaseBanner();
}

function initReleaseBanner() {
  const banner = document.querySelector("[data-release-banner]");
  const api = window.RewriteBetterWeb;
  if (!banner || !api) return;
  banner.querySelector("[data-release-dismiss]")?.addEventListener("click", () => {
    const tag = banner.dataset.tag;
    if (tag) localStorage.setItem(api.DISMISSED_RELEASE_KEY, tag);
    banner.hidden = true;
  });
}

const DOWNLOAD_ICON =
  '<span class="btn-icon" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M224,152v56a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V152a8,8,0,0,1,16,0v56H208V152a8,8,0,0,1,16,0Zm-101.66,2.34a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,132.69V40a8,8,0,0,0-16,0v92.69L93.66,103a8,8,0,0,0-11.32,11.32Z"/></svg></span>';

function renderReleaseList(payload) {
  const api = window.RewriteBetterWeb;
  const list = document.querySelector("[data-release-list]");
  const status = document.querySelector("[data-release-status]");
  if (!api || !list) return;
  const dict = copyFor(document.documentElement.lang || "en");
  const releases = api.publishedReleases(payload);
  if (!payload) {
    if (status) {
      status.hidden = false;
      status.removeAttribute("data-i18n");
      status.innerHTML = `${api.escapeHtml(dict["rel.error"])} <a href="${api.GITHUB_RELEASES_LATEST}">${api.escapeHtml(dict["rel.github"])}</a>`;
    }
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  if (!releases.length) {
    if (status) {
      status.hidden = false;
      status.removeAttribute("data-i18n");
      status.textContent = dict["rel.empty"];
    }
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  if (status) status.hidden = true;
  list.hidden = false;
  list.innerHTML = releases
    .map((release) => {
      const urls = api.releaseDownloadUrls(release);
      const iso = release.published_at || release.created_at || "";
      const date = api.formatReleaseDate(iso, document.documentElement.lang || "en");
      const title = api.escapeHtml(release.name || release.tag_name || dict["rel.h1"]);
      const tag = api.escapeHtml(release.tag_name || "");
      const notes = api.renderReleaseNotes(release.body) || `<p>${api.escapeHtml(dict["rel.notesEmpty"])}</p>`;
      return `<article class="release">
        <header class="release-head">
          <p class="release-tag">${tag}</p>
          <div>
            <h2>${title}</h2>
            ${date ? `<time datetime="${api.escapeHtml(iso)}">${api.escapeHtml(date)}</time>` : ""}
          </div>
        </header>
        <div class="release-actions">
          <a class="btn btn-primary" data-download="mac" href="${api.escapeHtml(urls.mac)}"><span>${api.escapeHtml(dict["cta.mac"])}</span>${DOWNLOAD_ICON}</a>
          <a class="btn btn-secondary" data-download="win" href="${api.escapeHtml(urls.win)}"><span>${api.escapeHtml(dict["cta.win"])}</span>${DOWNLOAD_ICON}</a>
        </div>
        <div class="prose release-notes">${notes}</div>
      </article>`;
    })
    .join("");
  if (typeof api.bindDownloadClicks === "function") api.bindDownloadClicks(list);
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
  const label = os === "mac" ? "Cmd Shift E" : "Ctrl Shift E";
  document.querySelectorAll("[data-shortcut], [data-demo] .kbd").forEach((el) => {
    el.textContent = label;
  });
}

function initDemo() {
  const root = document.querySelector("[data-demo]");
  if (!root) return;
  root.dataset.mode = "rewrite";
  const lang = () => document.documentElement.lang || "en";

  root.querySelectorAll("[data-demo-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      root.querySelectorAll("[data-demo-mode]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
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
    const run = root.querySelector("[data-demo-run]");
    const lang = document.documentElement.lang || "en";
    const mode = root.dataset.mode || "rewrite";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      showDemoResult(mode, 0);
      run.disabled = false;
      run.removeAttribute("aria-busy");
      run.textContent = DEMO[mode].run[lang];
    };
    run.disabled = true;
    run.setAttribute("aria-busy", "true");
    run.textContent = COPY[lang]["demo.working"];
    if (reduce) finish();
    else setTimeout(finish, 380);
  });
}

document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    localStorage.setItem("rb-lang", btn.dataset.lang);
    applyLang(btn.dataset.lang);
  });
});

const MEDIA = {
  video: "demo.mp4",
  poster: "demo-poster.jpg",
};

function initVideoStage() {
  const stage = document.querySelector("[data-video-stage]");
  const video = document.querySelector("[data-product-video]");
  const play = document.querySelector("[data-video-play]");
  const soon = document.querySelector("[data-video-soon]");
  const posterImg = stage?.querySelector(".video-poster");
  if (!stage || !video || !play) return;

  const showOverlay = () => stage.classList.remove("is-playing");
  const hideOverlay = () => stage.classList.add("is-playing");
  const ready = () => {
    video.hidden = false;
    play.disabled = false;
    stage.classList.add("is-ready");
    if (soon) soon.hidden = true;
  };

  play.addEventListener("click", () => {
    if (video.hidden) return;
    video.controls = true;
    video.play();
    hideOverlay();
  });

  video.addEventListener("play", hideOverlay);
  video.addEventListener("pause", () => {
    if (!video.ended) showOverlay();
  });
  video.addEventListener("ended", () => {
    video.currentTime = 0;
    showOverlay();
  });
  video.addEventListener("error", () => {
    video.hidden = true;
    play.disabled = true;
    stage.classList.remove("is-ready", "is-playing");
    if (soon) soon.hidden = false;
  });

  new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && !video.paused) video.pause();
      });
    },
    { threshold: 0.2 },
  ).observe(stage);

  Promise.all([existingLocalUrl(MEDIA.video), existingLocalUrl(MEDIA.poster)]).then(([src, poster]) => {
    if (poster) {
      video.poster = poster;
      if (posterImg) posterImg.src = poster;
    }
    if (!src) return;
    const source = video.querySelector("source");
    if (source) source.src = src;
    else video.src = src;
    video.load();
    ready();
  });
}

const SHOTS = {
  chrome: {
    src: "images/app-chrome.jpg",
    width: 1024,
    height: 809,
    tab: "shotTabChrome",
    cap: "shots.chromeCap",
    alt: "shots.chromeAlt",
  },
  mac: {
    src: "images/app-mac.jpg",
    width: 1024,
    height: 596,
    tab: "shotTabMac",
    cap: "shots.macCap",
    alt: "shots.macAlt",
  },
  win: {
    src: "images/app-win.jpg",
    width: 1024,
    height: 580,
    tab: "shotTabWin",
    cap: "shots.winCap",
    alt: "shots.winAlt",
  },
  settings: {
    src: "images/app-settings.jpg",
    width: 546,
    height: 1024,
    cap: "shots.settingsCap",
    alt: "shots.settingsAlt",
  },
  welcome: {
    src: "images/app-welcome.jpg",
    width: 566,
    height: 504,
    cap: "shots.welcomeCap",
    alt: "shots.welcomeAlt",
  },
  privacy: {
    src: "images/app-privacy.jpg",
    width: 584,
    height: 484,
    cap: "shots.privacyCap",
    alt: "shots.privacyAlt",
  },
};

const SHOT_ORDER = ["chrome", "mac", "win", "settings", "welcome", "privacy"];
const SHOT_TABS = ["chrome", "mac", "win"];

function shotLang() {
  return document.documentElement.lang || "en";
}

function shotCopy(key) {
  const dict = COPY[shotLang()] || COPY.en;
  return dict[key] || COPY.en[key] || "";
}

function currentShotId() {
  const root = document.querySelector("[data-shots]");
  return root?.dataset.current || "chrome";
}

function selectShot(id) {
  if (!SHOT_TABS.includes(id)) return;
  const root = document.querySelector("[data-shots]");
  const stage = document.getElementById("shotStage");
  const hero = document.querySelector("[data-shot-hero]");
  const cap = document.querySelector("[data-shot-cap]");
  const open = document.querySelector(".shot-open");
  const shot = SHOTS[id];
  if (!root || !stage || !hero || !shot) return;
  root.dataset.current = id;
  stage.classList.remove("is-chrome", "is-mac", "is-win");
  stage.classList.add(`is-${id}`);
  stage.setAttribute("aria-labelledby", shot.tab);
  hero.src = shot.src;
  hero.width = shot.width;
  hero.height = shot.height;
  hero.alt = shotCopy(shot.alt);
  hero.setAttribute("data-i18n-alt", shot.alt);
  if (cap) cap.textContent = shotCopy(shot.cap);
  if (open) open.setAttribute("data-shot-open", id);
  root.querySelectorAll(".shot-tab").forEach((tab) => {
    const on = tab.dataset.shot === id;
    tab.classList.toggle("is-active", on);
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
  });
}

function refreshShotCopy(lang) {
  const dict = COPY[lang] || COPY.en;
  const id = currentShotId();
  const shot = SHOTS[id];
  const cap = document.querySelector("[data-shot-cap]");
  const hero = document.querySelector("[data-shot-hero]");
  if (shot && cap) cap.textContent = dict[shot.cap] || shotCopy(shot.cap);
  if (shot && hero) hero.alt = dict[shot.alt] || shotCopy(shot.alt);
  const dialog = document.querySelector("[data-shot-dialog]");
  if (dialog?.open) renderShotDialog(dialog.dataset.shotId || id);
}

function renderShotDialog(id) {
  const shot = SHOTS[id];
  const dialog = document.querySelector("[data-shot-dialog]");
  const img = document.querySelector("[data-shot-dialog-img]");
  const cap = document.querySelector("[data-shot-dialog-cap]");
  if (!shot || !dialog || !img) return;
  dialog.dataset.shotId = id;
  img.src = shot.src;
  img.width = shot.width;
  img.height = shot.height;
  img.alt = shotCopy(shot.alt);
  if (cap) cap.textContent = shotCopy(shot.cap);
}

function openShotDialog(id) {
  const dialog = document.querySelector("[data-shot-dialog]");
  if (!dialog || !SHOTS[id]) return;
  renderShotDialog(id);
  if (typeof dialog.showModal === "function") dialog.showModal();
}

function shiftShotDialog(step) {
  const dialog = document.querySelector("[data-shot-dialog]");
  const current = dialog?.dataset.shotId || currentShotId();
  const index = SHOT_ORDER.indexOf(current);
  const next = SHOT_ORDER[(index + step + SHOT_ORDER.length) % SHOT_ORDER.length];
  renderShotDialog(next);
}

function initShots() {
  const root = document.querySelector("[data-shots]");
  const dialog = document.querySelector("[data-shot-dialog]");
  if (!root) return;

  root.querySelectorAll(".shot-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectShot(tab.dataset.shot));
  });

  root.addEventListener("keydown", (event) => {
    const tab = event.target.closest(".shot-tab");
    if (!tab || !root.contains(tab)) return;
    const index = SHOT_TABS.indexOf(tab.dataset.shot);
    if (index < 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const next = event.key === "ArrowRight"
        ? SHOT_TABS[(index + 1) % SHOT_TABS.length]
        : SHOT_TABS[(index - 1 + SHOT_TABS.length) % SHOT_TABS.length];
      selectShot(next);
      root.querySelector(`.shot-tab[data-shot="${next}"]`)?.focus();
    }
  });

  root.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-shot-open]");
    if (!opener || !root.contains(opener)) return;
    openShotDialog(opener.getAttribute("data-shot-open") || currentShotId());
  });

  if (dialog) {
    dialog.querySelector("[data-shot-prev]")?.addEventListener("click", () => shiftShotDialog(-1));
    dialog.querySelector("[data-shot-next]")?.addEventListener("click", () => shiftShotDialog(1));
    dialog.addEventListener("keydown", (event) => {
      if (!dialog.open) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        shiftShotDialog(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        shiftShotDialog(-1);
      }
    });
  }

  const start = detectOs() === "win" ? "win" : detectOs() === "mac" ? "mac" : "chrome";
  selectShot(start);
}

function initReveals() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
  );
  nodes.forEach((node) => io.observe(node));
}

const os = detectOs();
applyLang(detectLang());
styleHeroCtas(os);
setDemoShortcut(os);
initDemo();
initVideoStage();
initShots();
initReveals();

initReleaseBanner();

if (window.RewriteBetterWeb && (document.getElementById("macDownload") || document.querySelector("[data-release-list]"))) {
  const payloadPromise = loadReleasePayload().then((payload) => {
    releasePayload = payload;
    return payload;
  });

  if (document.getElementById("macDownload")) {
    Promise.all([
      existingLocalUrl(RELEASE.macLocal),
      existingLocalUrl(RELEASE.winLocal),
      payloadPromise,
    ]).then(([localMac, localWin, payload]) => {
      const api = window.RewriteBetterWeb;
      const remote = api.latestPublishedRelease(payload);
      const urls = api.desktopDownloadUrls({ localMac, localWin, remote });
      document.querySelectorAll("#macDownload, #macDownload2").forEach((a) => {
        a.href = urls.mac;
      });
      document.querySelectorAll("#winDownload, #winDownload2").forEach((a) => {
        a.href = urls.win;
      });
      showReleaseBanner(api.publishedReleases(payload)[0]);
    });
  }

  if (document.querySelector("[data-release-list]")) {
    payloadPromise.then((payload) => renderReleaseList(payload));
  }
}
