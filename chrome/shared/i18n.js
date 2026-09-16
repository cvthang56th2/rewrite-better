/* UI language catalogs. Default is English; in-app Settings can switch to Vietnamese. */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  RB.I18N = {
    en: {
      'settings.save': 'Save',
      'settings.language': 'Interface language',
      'settings.windowTitle': 'Rewrite Better Settings',
      'settings.keysTitle': 'API keys',
      'settings.showKeys': 'Show keys',
      'settings.hideKeys': 'Hide keys',
      'settings.testOk': 'Works',
      'settings.testFail': 'Failed',
      'settings.failoverOrder':
        'Failover order: Gemini → Groq → Cerebras → OpenAI. Multiple keys per provider: separate with comma or newline. On quota/rate-limit, the next key is used until all are exhausted.',
      'settings.extraTitle': 'Extra instructions',
      'settings.extraHelp':
        'Optional. Added on top of the built-in prompt for that mode. The app still requires only the final text back — these cannot replace that rule.',
      'settings.extraRewritePlaceholder': 'e.g. Always write in Vietnamese. Keep my voice. No emoji.',
      'settings.extraFormatPlaceholder': 'e.g. Prefer ATX headings. Never wrap in a code fence.',
      'settings.extraReplyPlaceholder': 'e.g. Sign off as Thắng. Be warm but brief.',
      'settings.voiceTitle': 'Voice profile',
      'settings.voiceHelp':
        'Optional. Paste 3–5 short samples of how you write (Slack, email). Rewrite, Reply, and writing assist match this voice. Stored only on this device.',
      'settings.voicePlaceholder':
        'e.g. hey, just circling back on the file — can you send when you get a chance? thanks!',
      'settings.saved': 'Saved',
      'settings.testKeys': 'Test keys',
      'settings.testing': 'Testing each key…',
      'settings.disclaimer':
        'API keys are stored only in this browser (Chrome sync storage if signed in). They are never uploaded to Rewrite Better. You are responsible for keeping them private.',
      'settings.multipleKeys': 'You can add more than one key, separated by comma or newline.',
      'settings.allKeysOk': 'All %@ key(s) work',
      'settings.allKeysFailed': 'All %@ key(s) failed',
      'settings.keysPartial': '%@ OK · %@ failed',
      'settings.placeholder.gemini': 'AIza… (comma or newline for multiple)',
      'settings.placeholder.groq': 'gsk_… (comma or newline for multiple)',
      'settings.placeholder.cerebras': 'csk_… (comma or newline for multiple)',
      'settings.placeholder.openai': 'sk-… (comma or newline for multiple)',
      'options.title': 'Rewrite Better Settings',
      'options.subtitle': 'Configure API keys to rewrite text on any webpage',
      'options.saveError': 'Could not save settings: %@',
      'options.chromeMissing': 'Error: Chrome extension APIs are not available. Please reload the extension.',
      'options.storageMissing': 'Error: Chrome storage API is not available. Please check extension permissions.',
      'context.rewrite': 'Rewrite with Rewrite Better',
      'panel.title': 'Rewrite Better',
      'panel.settings': 'Settings',
      'panel.close': 'Close',
      'panel.input': 'Input',
      'panel.receivedMessage': 'Received message',
      'panel.notes': 'Your notes (optional)',
      'panel.placeholder.input': 'Paste or type text here...',
      'panel.placeholder.reply': 'Paste received message to reply (or leave empty to compose)...',
      'panel.placeholder.notes': 'What you want to say / key points...',
      'panel.result': 'Result',
      'panel.resultHint': '⌘↩ / Ctrl+Enter to rewrite.',
      'panel.copy': 'Copy',
      'panel.copied': 'Copied',
      'panel.copy': 'Copy',
      'panel.copied': 'Copied',
      'panel.tone': 'Tone',
      'panel.enableTranslation': 'Enable Translation',
      'panel.from': 'From',
      'panel.to': 'To',
      'panel.format': 'Format',
      'panel.type': 'Type',
      'panel.intent': 'Intent',
      'panel.length': 'Length',
      'panel.language': 'Language',
      'panel.replyHint': 'Leave message empty and use notes to compose new.',
      'panel.extraHint': 'Using extra instructions from Settings.',
      'panel.voiceHint': 'Using your voice profile from Settings.',
      'panel.variants': 'Variants',
      'panel.changes': 'Changes',
      'panel.variant': 'Variant %@',
      'panel.writingAssist': 'Writing assist',
      'panel.suggesting': 'Suggesting…',
      'panel.tabHint': 'Tab to accept · Esc to dismiss',
      'panel.checkWriting': 'Check writing',
      'panel.checking': 'Checking…',
      'panel.suggestions': 'Suggestions',
      'panel.apply': 'Apply',
      'panel.emptyInput': 'Enter some text to rewrite.',
      'panel.emptyReply': 'Paste a received message or add notes.',
      'panel.processing': 'Working...',
      'panel.settingsError': 'Could not read settings.',
      'panel.missingKey': 'Add an API key in Settings to start.',
      'panel.emptyResponse': 'Could not process the text. Try again.',
      'panel.network': 'Network error. Check your internet connection.',
      'panel.error': 'Error: %@',
      'panel.apiOk': 'API key is configured',
      'panel.apiInvalid': 'This API key needs a check. <a href="#" data-action="settings">Check</a>',
      'panel.apiMissing': 'Add an API key to start. <a href="#" data-action="settings">Add key</a>',
      'panel.apiCheckError': 'Could not check API key',
      'panel.loadFailed': 'Failed to load Rewrite Better panel.',
      'panel.pasteNoTarget': 'Could not replace the selection on this page. Result is on the clipboard.',
      'panel.pasteActivateFailed': 'Could not insert into the page. Result is on the clipboard.',
      'mode.rewrite': 'Rewrite',
      'mode.format': 'Format',
      'mode.reply': 'Reply',
      'action.rewrite': 'Rewrite',
      'action.format': 'Format',
      'action.reply': 'Draft Reply',
      'action.process': 'Process',
      'tone.friendly': 'Friendly',
      'tone.professional': 'Professional',
      'tone.concise': 'Concise',
      'tone.persuasive': 'Persuasive',
      'tone.casual': 'Casual',
      'format.markdown': 'Markdown',
      'format.html': 'HTML',
      'format.bullet-points': 'Bullets',
      'format.numbered-list': 'Numbered',
      'format.table': 'Table',
      'format.outline': 'Outline',
      'format.summary': 'Summary',
      'format.faq': 'FAQ',
      'channel.message': 'Message',
      'channel.email': 'Email',
      'intent.accept': 'Accept',
      'intent.decline': 'Decline',
      'intent.ask': 'Ask',
      'intent.follow-up': 'Follow up',
      'intent.thank': 'Thank',
      'intent.general': 'General',
      'length.short': 'Short',
      'length.medium': 'Medium',
      'length.long': 'Long',
      'provider.gemini.summary': 'Tried first. Google AI Studio gives a free quota after you sign in with Google.',
      'provider.groq.summary': 'Second fallback. Groq is fast and has a free tier after you create an account.',
      'provider.cerebras.summary': 'Third fallback. Cerebras Cloud has a free trial.',
      'provider.openai.summary': 'Last in the chain. Create a secret key on the OpenAI platform.',
      'error.missingKey': 'Add an API key in Settings to start.',
      'error.allKeysResting': 'All API keys are resting until tomorrow. Add a new key or try again later.',
      'error.401': 'API key is invalid or expired.',
      'error.403': 'No permission to access the API.',
      'error.429': 'Request limit exceeded on all API keys.',
      'error.402': 'Quota exhausted / payment required on all API keys.',
      'error.5xx': 'AI server error. Please try again later.',
      'error.http': 'AI API error: HTTP %@ - %@',
      'error.emptyResponse': 'Could not process the text.',
      'error.network': 'Network error. %@',
      'error.unknown': 'Unknown error',
      'paste.replace': 'Replace',
      'paste.paste': 'Paste',
      'paste.replaceIn': 'Replace on this page',
      'paste.pasteIn': 'Insert on this page',
      'paste.replaceHelp': 'Replace the selection on this page.',
      'paste.pasteHelp': 'Insert at the caret on this page.',
      'paste.previousApp': 'this page'
    },
    vi: {
      'settings.save': 'Lưu',
      'settings.language': 'Ngôn ngữ giao diện',
      'settings.windowTitle': 'Cài đặt Rewrite Better',
      'settings.keysTitle': 'API key',
      'settings.showKeys': 'Hiện key',
      'settings.hideKeys': 'Ẩn key',
      'settings.testOk': 'Dùng được',
      'settings.testFail': 'Lỗi',
      'settings.failoverOrder':
        'Thứ tự failover: Gemini → Groq → Cerebras → OpenAI. Nhiều key mỗi nhà cung cấp: cách nhau bằng dấu phẩy hoặc xuống dòng. Khi hết quota/rate-limit, key tiếp theo được dùng cho đến khi hết.',
      'settings.extraTitle': 'Hướng dẫn thêm',
      'settings.extraHelp':
        'Tuỳ chọn. Được thêm vào prompt sẵn có của mode đó. App vẫn chỉ nhận văn bản cuối — không thay được quy tắc đó.',
      'settings.extraRewritePlaceholder': 'vd. Luôn viết tiếng Việt. Giữ giọng của tôi. Không dùng emoji.',
      'settings.extraFormatPlaceholder': 'vd. Ưu tiên heading ATX. Không bọc trong code fence.',
      'settings.extraReplyPlaceholder': 'vd. Ký tên Thắng. Thân thiện nhưng ngắn.',
      'settings.voiceTitle': 'Giọng viết',
      'settings.voiceHelp':
        'Tuỳ chọn. Dán 3–5 đoạn ngắn theo cách bạn thường viết (Slack, email). Rewrite, Reply và hỗ trợ viết sẽ bám giọng này. Chỉ lưu trên thiết bị này.',
      'settings.voicePlaceholder': 'vd. ơi gửi lại file lúc tiện nhé, cảm ơn!',
      'settings.saved': 'Đã lưu',
      'settings.testKeys': 'Kiểm tra key',
      'settings.testing': 'Đang kiểm tra từng key…',
      'settings.disclaimer':
        'API key chỉ lưu trong trình duyệt này (Chrome sync nếu đã đăng nhập). Không được tải lên Rewrite Better. Bạn chịu trách nhiệm giữ chúng bí mật.',
      'settings.multipleKeys': 'Có thể thêm nhiều key, cách nhau bằng dấu phẩy hoặc xuống dòng.',
      'settings.allKeysOk': 'Cả %@ key đều dùng được',
      'settings.allKeysFailed': 'Cả %@ key đều lỗi',
      'settings.keysPartial': '%@ OK · %@ lỗi',
      'settings.placeholder.gemini': 'AIza… (dấu phẩy hoặc xuống dòng nếu nhiều key)',
      'settings.placeholder.groq': 'gsk_… (dấu phẩy hoặc xuống dòng nếu nhiều key)',
      'settings.placeholder.cerebras': 'csk_… (dấu phẩy hoặc xuống dòng nếu nhiều key)',
      'settings.placeholder.openai': 'sk-… (dấu phẩy hoặc xuống dòng nếu nhiều key)',
      'options.title': 'Cài đặt Rewrite Better',
      'options.subtitle': 'Cấu hình API key để viết lại văn bản trên mọi trang web',
      'options.saveError': 'Lỗi khi lưu cài đặt: %@',
      'options.chromeMissing': 'Lỗi: Chrome extension APIs không khả dụng. Hãy reload extension.',
      'options.storageMissing': 'Lỗi: Chrome storage API không khả dụng. Kiểm tra quyền của extension.',
      'context.rewrite': 'Viết lại với Rewrite Better',
      'panel.title': 'Rewrite Better',
      'panel.settings': 'Cài đặt',
      'panel.close': 'Đóng',
      'panel.input': 'Văn bản',
      'panel.receivedMessage': 'Tin nhắn nhận được',
      'panel.notes': 'Ghi chú (tuỳ chọn)',
      'panel.placeholder.input': 'Dán hoặc nhập văn bản...',
      'panel.placeholder.reply': 'Dán tin nhắn nhận được để trả lời (hoặc để trống để soạn mới)...',
      'panel.placeholder.notes': 'Điều bạn muốn nói / ý chính...',
      'panel.result': 'Kết quả',
      'panel.resultHint': '⌘↩ / Ctrl+Enter để viết lại.',
      'panel.copy': 'Sao chép',
      'panel.copied': 'Đã sao chép',
      'panel.tone': 'Giọng',
      'panel.enableTranslation': 'Bật dịch',
      'panel.from': 'Từ',
      'panel.to': 'Sang',
      'panel.format': 'Định dạng',
      'panel.type': 'Loại',
      'panel.intent': 'Mục đích',
      'panel.length': 'Độ dài',
      'panel.language': 'Ngôn ngữ',
      'panel.replyHint': 'Để trống tin nhắn và dùng ghi chú để soạn mới.',
      'panel.extraHint': 'Đang dùng hướng dẫn thêm từ Cài đặt.',
      'panel.voiceHint': 'Đang dùng giọng viết từ Cài đặt.',
      'panel.variants': 'Bản khác',
      'panel.changes': 'Thay đổi',
      'panel.variant': 'Bản %@',
      'panel.writingAssist': 'Hỗ trợ viết',
      'panel.suggesting': 'Đang gợi ý…',
      'panel.tabHint': 'Tab để nhận · Esc để bỏ',
      'panel.checkWriting': 'Kiểm tra',
      'panel.checking': 'Đang kiểm tra…',
      'panel.suggestions': 'Gợi ý',
      'panel.apply': 'Áp dụng',
      'panel.emptyInput': 'Nhập văn bản cần viết lại.',
      'panel.emptyReply': 'Dán tin nhắn nhận được hoặc thêm ghi chú.',
      'panel.processing': 'Đang xử lý...',
      'panel.settingsError': 'Lỗi truy cập cài đặt.',
      'panel.missingKey': 'Thêm API key trong Cài đặt để bắt đầu.',
      'panel.emptyResponse': 'Không thể xử lý văn bản. Thử lại.',
      'panel.network': 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
      'panel.error': 'Lỗi: %@',
      'panel.apiOk': 'Đã cấu hình API key',
      'panel.apiInvalid': 'API key này cần kiểm tra lại. <a href="#" data-action="settings">Kiểm tra lại</a>',
      'panel.apiMissing': 'Thêm API key để bắt đầu. <a href="#" data-action="settings">Thêm key</a>',
      'panel.apiCheckError': 'Lỗi kiểm tra API Key',
      'panel.loadFailed': 'Không tải được bảng Rewrite Better.',
      'panel.pasteNoTarget': 'Không thay được phần chọn trên trang. Kết quả đang ở clipboard.',
      'panel.pasteActivateFailed': 'Không chèn được vào trang. Kết quả đang ở clipboard.',
      'mode.rewrite': 'Viết lại',
      'mode.format': 'Định dạng',
      'mode.reply': 'Trả lời',
      'action.rewrite': 'Viết lại',
      'action.format': 'Định dạng',
      'action.reply': 'Soạn trả lời',
      'action.process': 'Xử lý',
      'tone.friendly': 'Thân thiện',
      'tone.professional': 'Chuyên nghiệp',
      'tone.concise': 'Ngắn gọn',
      'tone.persuasive': 'Thuyết phục',
      'tone.casual': 'Thoải mái',
      'format.markdown': 'Markdown',
      'format.html': 'HTML',
      'format.bullet-points': 'Gạch đầu dòng',
      'format.numbered-list': 'Đánh số',
      'format.table': 'Bảng',
      'format.outline': 'Dàn ý',
      'format.summary': 'Tóm tắt',
      'format.faq': 'FAQ',
      'channel.message': 'Tin nhắn',
      'channel.email': 'Email',
      'intent.accept': 'Đồng ý',
      'intent.decline': 'Từ chối',
      'intent.ask': 'Hỏi',
      'intent.follow-up': 'Theo dõi',
      'intent.thank': 'Cảm ơn',
      'intent.general': 'Chung',
      'length.short': 'Ngắn',
      'length.medium': 'Vừa',
      'length.long': 'Dài',
      'provider.gemini.summary': 'Dùng trước. Google AI Studio có hạn mức miễn phí sau khi đăng nhập Google.',
      'provider.groq.summary': 'Fallback thứ hai. Groq nhanh và có gói miễn phí sau khi tạo tài khoản.',
      'provider.cerebras.summary': 'Fallback thứ ba. Cerebras Cloud có dùng thử miễn phí.',
      'provider.openai.summary': 'Cuối chuỗi. Tạo secret key trên nền tảng OpenAI.',
      'error.missingKey': 'Thêm API key trong Cài đặt để bắt đầu.',
      'error.allKeysResting': 'Tất cả API key đang tạm nghỉ đến ngày mai. Thêm key mới hoặc thử lại sau.',
      'error.401': 'API Key không hợp lệ hoặc đã hết hạn.',
      'error.403': 'Không có quyền truy cập API.',
      'error.429': 'Đã vượt quá giới hạn requests trên tất cả API key.',
      'error.402': 'Hết quota / cần thanh toán trên tất cả API key.',
      'error.5xx': 'Lỗi server AI. Vui lòng thử lại sau.',
      'error.http': 'Lỗi AI API: HTTP %@ - %@',
      'error.emptyResponse': 'Không thể xử lý văn bản.',
      'error.network': 'Lỗi kết nối mạng. %@',
      'error.unknown': 'Lỗi không xác định',
      'paste.replace': 'Thay thế',
      'paste.paste': 'Dán',
      'paste.replaceIn': 'Thay trên trang này',
      'paste.pasteIn': 'Chèn trên trang này',
      'paste.replaceHelp': 'Thay phần đang chọn trên trang này.',
      'paste.pasteHelp': 'Chèn tại con trỏ trên trang này.',
      'paste.previousApp': 'trang này'
    }
  };

  RB.uiLanguage = 'en';

  RB.parseLanguage = function (raw) {
    return raw === 'vi' ? 'vi' : 'en';
  };

  RB.setLanguage = function (raw) {
    RB.uiLanguage = RB.parseLanguage(raw);
    return RB.uiLanguage;
  };

  RB.t = function (key, language) {
    const args = Array.prototype.slice.call(arguments, 1);
    let lang = RB.uiLanguage;
    if (language === 'en' || language === 'vi') {
      lang = language;
      args.shift();
    }
    const table = RB.I18N[lang] || RB.I18N.en;
    let value = table[key] || RB.I18N.en[key] || key;
    args.forEach((arg) => {
      value = value.replace('%@', String(arg));
    });
    return value;
  };

  RB.localizeOptions = function (items, prefix) {
    return items.map((item) => ({
      value: item.value,
      label: RB.t(prefix + '.' + item.value)
    }));
  };

  RB.loadUiLanguage = function () {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        resolve(RB.setLanguage('en'));
        return;
      }
      chrome.storage.sync.get(['uiLanguage'], (result) => {
        resolve(RB.setLanguage(result && result.uiLanguage));
      });
    });
  };
  RB.watchUiLanguage = function (callback) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.onChanged) return;
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' || !changes.uiLanguage) return;
      const lang = RB.setLanguage(changes.uiLanguage.newValue);
      if (typeof callback === 'function') callback(lang);
    });
  };
})(typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this);
