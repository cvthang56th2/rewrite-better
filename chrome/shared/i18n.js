/* UI language catalogs. Default is English; in-app Settings can switch to Vietnamese. */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  RB.I18N = {
    en: {
      'settings.save': 'Save',
      'settings.language': 'Interface language',
      'options.title': 'Rewrite Better Settings',
      'options.subtitle': 'Configure your Groq API key to rewrite text',
      'options.helpTitle': 'How to get a Groq API key (free)',
      'options.help1': '1. Open',
      'options.help2': '2. Sign up or sign in (free)',
      'options.help3': '3. Create a new API key and copy it',
      'options.helpBenefit': 'Free to start, and typically much faster than OpenAI.',
      'options.apiKeyLabel': 'Groq API Key:',
      'options.apiKeyHelp': 'Paste your Groq API key. It starts with "gsk_"',
      'options.save': 'Save settings',
      'options.saved': '✅ Settings saved',
      'options.needKey': 'Please enter a Groq API key',
      'options.invalidKey': 'Invalid API key. Groq keys start with "gsk_"',
      'options.saveError': 'Could not save settings: %@',
      'options.chromeMissing': 'Error: Chrome extension APIs are not available. Please reload the extension.',
      'options.storageMissing': 'Error: Chrome storage API is not available. Please check extension permissions.',
      'context.rewrite': 'Rewrite with Rewrite Better',
      'panel.title': 'Rewrite Better',
      'panel.settings': 'Settings',
      'panel.close': 'Close',
      'panel.placeholder.input': 'Paste or type text here...',
      'panel.placeholder.reply': 'Paste received message to reply (or leave empty to compose)...',
      'panel.placeholder.notes': 'What you want to say / key points...',
      'panel.notes': 'Your notes (optional)',
      'panel.tone': 'Tone',
      'panel.enableTranslation': 'Enable Translation',
      'panel.from': 'From',
      'panel.to': 'To',
      'panel.format': 'Format',
      'panel.type': 'Type',
      'panel.intent': 'Intent',
      'panel.length': 'Length',
      'panel.language': 'Language',
      'panel.replyHint': 'Paste the received message above to reply, or leave it empty and use notes to compose new.',
      'panel.copy': '📋 Copy to Clipboard',
      'panel.copied': '✅ Copied!',
      'panel.emptyInput': '❌ Please enter text to process.',
      'panel.emptyReply': '❌ Enter a received message and/or your notes.',
      'panel.processing': '⏳ Processing...',
      'panel.settingsError': '❌ Could not read settings.',
      'panel.missingKey': '❌ Groq API key is not configured. Open Settings.',
      'panel.emptyResponse': '❌ Could not process the text.',
      'panel.network': '❌ Network error. Check your internet connection.',
      'panel.error': '❌ Error: %@',
      'panel.apiOk': '✅ Groq API key is working',
      'panel.apiInvalid': '⚠️ There is a problem with the API key. <a href="#" data-action="settings">Check</a>',
      'panel.apiMissing': '⚠️ Groq API key is not configured. <a href="#" data-action="settings">Configure</a>',
      'panel.apiCheckError': '❌ Could not check API key',
      'panel.loadFailed': 'Failed to load Rewrite Better panel.',
      'mode.rewrite': 'Rewrite',
      'mode.format': 'Format',
      'mode.reply': 'Reply',
      'action.rewrite': 'Rewrite with Groq AI',
      'action.format': 'Format Document',
      'action.reply': 'Generate Reply',
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
      'error.401': '❌ API key is invalid or expired.',
      'error.403': '❌ No permission to access the API.',
      'error.429': '❌ Request limit exceeded. Please try again later.',
      'error.5xx': '❌ Groq server error. Please try again later.',
      'error.http': '❌ AI API error: HTTP %@ - %@',
      'error.unknown': 'Unknown error'
    },
    vi: {
      'settings.save': 'Lưu',
      'settings.language': 'Ngôn ngữ giao diện',
      'options.title': 'Cài đặt Rewrite Better',
      'options.subtitle': 'Cấu hình Groq API key để sử dụng tính năng viết lại văn bản',
      'options.helpTitle': 'Hướng dẫn lấy Groq API Key (miễn phí)',
      'options.help1': '1. Truy cập',
      'options.help2': '2. Đăng ký/Đăng nhập (miễn phí)',
      'options.help3': '3. Tạo API key mới và sao chép',
      'options.helpBenefit': 'Miễn phí để bắt đầu, thường nhanh hơn OpenAI nhiều.',
      'options.apiKeyLabel': 'Groq API Key:',
      'options.apiKeyHelp': 'Nhập API key của bạn từ Groq. Bắt đầu bằng "gsk_"',
      'options.save': 'Lưu cài đặt',
      'options.saved': '✅ Đã lưu cài đặt thành công!',
      'options.needKey': 'Vui lòng nhập Groq API Key',
      'options.invalidKey': 'API Key không hợp lệ. Groq API Key phải bắt đầu bằng "gsk_"',
      'options.saveError': 'Lỗi khi lưu cài đặt: %@',
      'options.chromeMissing': 'Lỗi: Chrome extension APIs không khả dụng. Hãy reload extension.',
      'options.storageMissing': 'Lỗi: Chrome storage API không khả dụng. Kiểm tra quyền của extension.',
      'context.rewrite': 'Viết lại với Rewrite Better',
      'panel.title': 'Rewrite Better',
      'panel.settings': 'Cài đặt',
      'panel.close': 'Đóng',
      'panel.placeholder.input': 'Dán hoặc nhập văn bản...',
      'panel.placeholder.reply': 'Dán tin nhắn nhận được để trả lời (hoặc để trống để soạn mới)...',
      'panel.placeholder.notes': 'Điều bạn muốn nói / ý chính...',
      'panel.notes': 'Ghi chú (tuỳ chọn)',
      'panel.tone': 'Giọng',
      'panel.enableTranslation': 'Bật dịch',
      'panel.from': 'Từ',
      'panel.to': 'Sang',
      'panel.format': 'Định dạng',
      'panel.type': 'Loại',
      'panel.intent': 'Mục đích',
      'panel.length': 'Độ dài',
      'panel.language': 'Ngôn ngữ',
      'panel.replyHint': 'Dán tin nhắn nhận được ở trên để trả lời, hoặc để trống và dùng ghi chú để soạn mới.',
      'panel.copy': '📋 Sao chép',
      'panel.copied': '✅ Đã sao chép!',
      'panel.emptyInput': '❌ Vui lòng nhập văn bản cần xử lý.',
      'panel.emptyReply': '❌ Nhập tin nhắn nhận được và/hoặc ghi chú.',
      'panel.processing': '⏳ Đang xử lý...',
      'panel.settingsError': '❌ Lỗi truy cập cài đặt.',
      'panel.missingKey': '❌ Chưa cấu hình Groq API Key. Vui lòng vào Cài đặt.',
      'panel.emptyResponse': '❌ Không thể xử lý văn bản.',
      'panel.network': '❌ Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
      'panel.error': '❌ Lỗi: %@',
      'panel.apiOk': '✅ Groq API Key hoạt động bình thường',
      'panel.apiInvalid': '⚠️ API Key có vấn đề. <a href="#" data-action="settings">Kiểm tra lại</a>',
      'panel.apiMissing': '⚠️ Chưa cấu hình Groq API Key. <a href="#" data-action="settings">Cấu hình ngay</a>',
      'panel.apiCheckError': '❌ Lỗi kiểm tra API Key',
      'panel.loadFailed': 'Không tải được bảng Rewrite Better.',
      'mode.rewrite': 'Viết lại',
      'mode.format': 'Định dạng',
      'mode.reply': 'Trả lời',
      'action.rewrite': 'Viết lại với Groq AI',
      'action.format': 'Định dạng tài liệu',
      'action.reply': 'Tạo trả lời',
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
      'error.401': '❌ API Key không hợp lệ hoặc đã hết hạn.',
      'error.403': '❌ Không có quyền truy cập API.',
      'error.429': '❌ Đã vượt quá giới hạn requests. Vui lòng thử lại sau.',
      'error.5xx': '❌ Lỗi server Groq. Vui lòng thử lại sau.',
      'error.http': '❌ Lỗi AI API: HTTP %@ - %@',
      'error.unknown': 'Lỗi không xác định'
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
