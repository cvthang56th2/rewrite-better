import Combine
import Foundation

enum AppLanguage: String, CaseIterable, Identifiable {
    case en
    case vi

    var id: String { rawValue }

    static func parse(_ raw: String?) -> AppLanguage {
        guard let raw, let value = AppLanguage(rawValue: raw) else { return .en }
        return value
    }

    /// Always shown in the language’s own name so the picker is findable.
    var displayName: String {
        switch self {
        case .en: return "English"
        case .vi: return "Tiếng Việt"
        }
    }
}

enum L10n {
    static func t(_ key: String, language: AppLanguage, _ args: String...) -> String {
        t(key, language: language, arguments: args)
    }

    static func t(_ key: String, language: AppLanguage, arguments: [String]) -> String {
        let table = catalogs[language] ?? catalogs[.en]!
        var value = table[key] ?? catalogs[.en]?[key] ?? key
        for arg in arguments {
            if let range = value.range(of: "%@") {
                value.replaceSubrange(range, with: arg)
            }
        }
        return value
    }

    static func keys(for language: AppLanguage) -> Set<String> {
        Set((catalogs[language] ?? [:]).keys)
    }

    private static let catalogs: [AppLanguage: [String: String]] = [
        .en: english,
        .vi: vietnamese
    ]

    private static let english: [String: String] = [
        "menu.openPanel": "Open Panel",
        "menu.openEmptyPanel": "Open Empty Panel",
        "menu.checkForUpdates": "Check for Updates…",
        "menu.welcome": "Welcome…",
        "menu.settings": "Settings…",
        "menu.privacy": "Privacy…",
        "menu.quit": "Quit Rewrite Better",

        "onboarding.windowTitle": "Welcome",
        "onboarding.title": "Welcome to Rewrite Better",
        "onboarding.menubar": "The app lives in the menu bar (top right). There is no Dock icon.",
        "onboarding.step1": "Turn on Accessibility so Rewrite Better can read the text you select in other apps.",
        "onboarding.step2": "Add at least one API key (Gemini, Groq, Cerebras, or OpenAI). Keys stay on this Mac in Keychain.",
        "onboarding.step3": "Select text anywhere, then press %@ to open the panel. After rewriting, use Replace to put the result back.",
        "onboarding.enableAccessibility": "Enable Accessibility…",
        "onboarding.addKey": "Add API key…",
        "onboarding.privacy": "Privacy",
        "onboarding.done": "Get started",
        "onboarding.showAgain": "Show welcome…",

        "privacy.windowTitle": "Privacy",
        "privacy.title": "Privacy",
        "privacy.body": "Rewrite Better has no account and no server of its own.\n\n• API keys are stored only in the Keychain on this Mac. This app never uploads them.\n\n• When you rewrite text, the selected text and your options go directly to the AI provider whose key you configured (Google, Groq, Cerebras, or OpenAI). Nothing is sent to the Rewrite Better developer.\n\n• Accessibility permission is used only to read the text you selected and, if you choose Replace, to put the result back. The app does not record your screen or keystrokes.\n\n• There is no analytics, crash reporting, or advertising.\n\nYou are responsible for the API keys you paste and for the text you send to a provider.",
        "privacy.intro": "Rewrite Better has no account and no server of its own.",
        "privacy.keysTitle": "Keys stay on this Mac",
        "privacy.keysBody": "API keys are stored only in the Keychain. This app never uploads them.",
        "privacy.transitTitle": "Text goes to the provider you chose",
        "privacy.transitBody": "Selected text and options go directly to Google, Groq, Cerebras, or OpenAI. Nothing is sent to the Rewrite Better developer.",
        "privacy.a11yTitle": "Accessibility is only for select and replace",
        "privacy.a11yBody": "Permission is used only to read the text you selected and, if you choose Replace, to put the result back. The app does not record your screen or keystrokes.",
        "privacy.analyticsTitle": "No tracking",
        "privacy.analyticsBody": "There is no analytics, crash reporting, or advertising.",
        "privacy.responsibility": "You are responsible for the API keys you paste and for the text you send to a provider.",

        "panel.title": "Rewrite Better",
        "panel.settings": "Settings",
        "panel.close": "Close",
        "panel.input": "Input",
        "panel.receivedMessage": "Received message",
        "panel.notes": "Your notes (optional)",
        "panel.placeholder.input": "Paste or type text here…",
        "panel.placeholder.reply": "Paste received message to reply (or leave empty to compose)…",
        "panel.placeholder.notes": "What you want to say / key points…",
        "panel.result": "Result",
        "panel.resultHint": "⌘↩ to rewrite · ⌥⌘↩ to put it back in the original app.",
        "panel.copy": "Copy",
        "panel.copied": "Copied",
        "panel.tone": "Tone",
        "panel.enableTranslation": "Enable Translation",
        "panel.from": "From",
        "panel.to": "To",
        "panel.format": "Format",
        "panel.type": "Type",
        "panel.intent": "Intent",
        "panel.length": "Length",
        "panel.language": "Language",
        "panel.replyHint": "Leave message empty and use notes to compose new.",
        "panel.extraHint": "Using extra instructions from Settings.",
        "panel.voiceHint": "Using your voice profile from Settings.",
        "panel.variants": "Variants",
        "panel.changes": "Changes",
        "panel.variant": "Variant %@",
        "panel.writingAssist": "Writing assist",
        "panel.suggesting": "Suggesting…",
        "panel.tabHint": "Tab to accept · Esc to dismiss",
        "panel.checkWriting": "Check writing",
        "panel.checking": "Checking…",
        "panel.suggestions": "Suggestions",
        "panel.apply": "Apply",
        "panel.emptyInput": "Enter some text to rewrite.",
        "panel.emptyReply": "Paste a received message or add notes.",
        "panel.refine": "Adjust this version",
        "panel.refinePlaceholder": "Shorter, warmer, add a greeting…",
        "panel.chatYou": "You",
        "panel.chatAi": "AI",
        "panel.emptyRefine": "Enter how you want this version changed.",
        "panel.emptyResponse": "Could not process the text. Try again.",
        "panel.processing": "Working…",

        "mode.rewrite": "Rewrite",
        "mode.format": "Format",
        "mode.reply": "Reply",
        "action.rewrite": "Rewrite",
        "action.format": "Format",
        "action.reply": "Draft Reply",
        "action.refine": "Adjust",

        "tone.friendly": "Friendly",
        "tone.professional": "Professional",
        "tone.concise": "Concise",
        "tone.persuasive": "Persuasive",
        "tone.casual": "Casual",

        "format.markdown": "Markdown",
        "format.html": "HTML",
        "format.bullet-points": "Bullets",
        "format.numbered-list": "Numbered",
        "format.table": "Table",
        "format.outline": "Outline",
        "format.summary": "Summary",
        "format.faq": "FAQ",

        "channel.message": "Message",
        "channel.email": "Email",

        "intent.accept": "Accept",
        "intent.decline": "Decline",
        "intent.ask": "Ask",
        "intent.follow-up": "Follow up",
        "intent.thank": "Thank",
        "intent.general": "General",

        "length.short": "Short",
        "length.medium": "Medium",
        "length.long": "Long",

        "a11y.untrusted": "This Mac hasn’t allowed Rewrite Better to read selected text.",
        "a11y.steps": "1) Open Settings → Accessibility\n2) Remove every old “RewriteBetter” entry → add / enable the copy that is running\n3) Quit the app fully, reopen it → Recheck",
        "a11y.details": "Show details",
        "a11y.openSettings": "Open Settings",
        "a11y.recheck": "Recheck",

        "api.missing": "Add an API key to start.",
        "api.configure": "Add key",
        "api.invalid": "This API key needs a check.",
        "api.check": "Check",

        "settings.failoverOrder": "Failover order: Gemini → Groq → Cerebras → OpenAI. Multiple keys per provider: separate with comma or newline. On quota/rate-limit, the next key is used until all are exhausted.",
        "settings.tab.keys": "Keys",
        "settings.tab.writing": "Writing",
        "settings.tab.general": "General",
        "settings.language": "Interface language",
        "settings.windowTitle": "Rewrite Better Settings",
        "settings.keysTitle": "API keys",
        "settings.showKeys": "Show keys",
        "settings.hideKeys": "Hide keys",
        "settings.testOk": "Works",
        "settings.testFail": "Failed",
        "settings.openAtLogin": "Open at login",
        "settings.openAtLoginHelp": "Starts Rewrite Better in the menu bar when you log in to this Mac.",
        "settings.openAtLoginOn": "Will open when you log in",
        "settings.openAtLoginOff": "Won’t open at login",
        "settings.openAtLoginFail": "Could not enable Open at login",
        "settings.checkForUpdates": "Check for updates",
        "settings.checkForUpdatesHelp": "Downloads the latest Windows installer and installs it over this app. Settings and API keys stay on this PC.",
        "settings.shortcut": "Open panel shortcut",
        "settings.reset": "Reset",
        "settings.shortcutHelp": "Click the shortcut, then press a new combo. Include ⌘, ⌥, or ⌃. Esc cancels.",
        "settings.extraTitle": "Extra instructions",
        "settings.extraHelp": "Optional. Added on top of the built-in prompt for that mode. The app still requires only the final text back — these cannot replace that rule.",
        "settings.extraRewritePlaceholder": "e.g. Always write in Vietnamese. Keep my voice. No emoji.",
        "settings.extraFormatPlaceholder": "e.g. Prefer ATX headings. Never wrap in a code fence.",
        "settings.extraReplyPlaceholder": "e.g. Sign off as Thắng. Be warm but brief.",
        "settings.voiceTitle": "Voice profile",
        "settings.voiceHelp": "Optional. Paste 3–5 short samples of how you write (Slack, email). Rewrite, Reply, and writing assist match this voice. Stored only on this Mac.",
        "settings.voicePlaceholder": "e.g. hey, just circling back on the file — can you send when you get a chance? thanks!",
        "settings.save": "Save",
        "settings.saved": "Saved",
        "settings.testKeys": "Test keys",
        "settings.testing": "Testing each key…",
        "settings.openAccessibility": "Open Accessibility…",
        "settings.accessibilityFooter": "%@ needs Accessibility to read selected text. Prefer the copy in /Applications.",
        "settings.privacy": "Privacy…",
        "settings.disclaimer": "API keys are stored only on this Mac (Keychain). They are never uploaded or saved anywhere else. You are responsible for keeping them private. The developer is not liable if a key is leaked.",
        "settings.getKeyTitle": "Get a %@ API key",
        "settings.howToGetKey": "How to get a %@ API key",
        "settings.openHost": "Open %@",
        "settings.multipleKeys": "You can add more than one key, separated by comma or newline.",
        "settings.shortcutSet": "Shortcut set to %@",
        "settings.shortcutFail": "Couldn't register %@. That combo may already be in use.",
        "settings.allKeysOk": "All %@ key(s) work",
        "settings.allKeysFailed": "All %@ key(s) failed",
        "settings.keysPartial": "%@ OK · %@ failed",
        "settings.typeShortcut": "Type shortcut…",
        "settings.pressShortcut": "Press a shortcut, or Esc to cancel",
        "settings.changeShortcut": "Click to change the shortcut",
        "settings.providerEnabled": "Enabled",
        "settings.placeholder.gemini": "AIza… (comma or newline for multiple)",
        "settings.placeholder.groq": "gsk_… (comma or newline for multiple)",
        "settings.placeholder.cerebras": "csk_… (comma or newline for multiple)",
        "settings.placeholder.openai": "sk-… (comma or newline for multiple)",

        "provider.gemini.summary": "Tried first. Google AI Studio gives a free quota after you sign in with Google.",
        "provider.gemini.step1": "Open Google AI Studio (link below).",
        "provider.gemini.step2": "Sign in with your Google account.",
        "provider.gemini.step3": "Click Create API key. Create or pick a Google Cloud project if asked.",
        "provider.gemini.step4": "Copy the key and paste it here. It starts with %@.",
        "provider.groq.summary": "Second fallback. Groq is fast and has a free tier after you create an account.",
        "provider.groq.step1": "Open Groq Console (link below).",
        "provider.groq.step2": "Sign up or sign in.",
        "provider.groq.step3": "Open API Keys and create a new key.",
        "provider.groq.step4": "Copy it and paste here. It starts with %@.",
        "provider.cerebras.summary": "Third fallback. Cerebras Cloud has a free trial. Open API Keys in the left sidebar.",
        "provider.cerebras.step1": "Open Cerebras Cloud (link below).",
        "provider.cerebras.step2": "Sign up or sign in.",
        "provider.cerebras.step3": "Open API Keys in the left sidebar. On a paid account, pick a project first.",
        "provider.cerebras.step4": "Generate a key, copy it, and paste here. It starts with %@.",
        "provider.openai.summary": "Last in the chain. Create a secret key on the OpenAI platform. Billing is required after any trial.",
        "provider.openai.step1": "Open the OpenAI API keys page (link below).",
        "provider.openai.step2": "Sign in to your OpenAI account.",
        "provider.openai.step3": "Click Create new secret key and copy it immediately.",
        "provider.openai.step4": "Paste it here. It starts with %@.",

        "error.missingKey": "Add an API key in Settings to start.",
        "error.allKeysResting": "All API keys are resting until tomorrow. Add a new key or try again later.",
        "error.401": "API key is invalid or expired.",
        "error.403": "No permission to access the API.",
        "error.429": "Request limit exceeded on all API keys.",
        "error.402": "Quota exhausted / payment required on all API keys.",
        "error.5xx": "AI server error. Please try again later.",
        "error.http": "AI API error: HTTP %@ - %@",
        "error.emptyResponse": "Could not process the text.",
        "error.network": "Network error. %@",
        "paste.replace": "Replace",
        "paste.paste": "Paste",
        "paste.replaceIn": "Replace in %@",
        "paste.pasteIn": "Paste in %@",
        "paste.replaceHelp": "Replace the selection in %@. ⌥⌘↩",
        "paste.pasteHelp": "Paste into %@ at the caret. ⌥⌘↩",
        "paste.previousApp": "the previous app",
        "panel.pasteNoTarget": "No previous app to paste into. Result is on the clipboard — press ⌘V.",
        "panel.pasteActivateFailed": "Couldn’t switch back to the original app. Result is on the clipboard — press ⌘V.",

        "error.unknown": "Unknown error"
    ]

    private static let vietnamese: [String: String] = [
        "menu.openPanel": "Mở bảng",
        "menu.openEmptyPanel": "Mở bảng trống",
        "menu.checkForUpdates": "Kiểm tra cập nhật…",
        "menu.welcome": "Chào mừng…",
        "menu.settings": "Cài đặt…",
        "menu.privacy": "Quyền riêng tư…",
        "menu.quit": "Thoát Rewrite Better",

        "onboarding.windowTitle": "Chào mừng",
        "onboarding.title": "Chào mừng đến Rewrite Better",
        "onboarding.menubar": "App nằm trên thanh menu (góc phải trên). Không có icon trên Dock.",
        "onboarding.step1": "Bật Accessibility để Rewrite Better đọc được văn bản bạn đang chọn ở app khác.",
        "onboarding.step2": "Thêm ít nhất một API key (Gemini, Groq, Cerebras hoặc OpenAI). Key chỉ lưu trên máy Mac này trong Keychain.",
        "onboarding.step3": "Chọn văn bản ở bất kỳ đâu, rồi nhấn %@ để mở bảng. Sau khi viết lại, dùng Thay thế để đưa kết quả về chỗ cũ.",
        "onboarding.enableAccessibility": "Bật Accessibility…",
        "onboarding.addKey": "Thêm API key…",
        "onboarding.privacy": "Quyền riêng tư",
        "onboarding.done": "Bắt đầu",
        "onboarding.showAgain": "Hiện chào mừng…",

        "privacy.windowTitle": "Quyền riêng tư",
        "privacy.title": "Quyền riêng tư",
        "privacy.body": "Rewrite Better không có tài khoản và không có máy chủ riêng.\n\n• API key chỉ lưu trong Keychain trên máy Mac này. App không tải chúng lên đâu cả.\n\n• Khi viết lại, văn bản đang chọn và các tùy chọn được gửi thẳng tới nhà cung cấp AI mà bạn đã dán key (Google, Groq, Cerebras hoặc OpenAI). Không có gì được gửi cho nhà phát triển Rewrite Better.\n\n• Quyền Accessibility chỉ dùng để đọc văn bản bạn đang chọn và, nếu bạn chọn Thay thế, để đưa kết quả về chỗ cũ. App không ghi màn hình hay phím bấm.\n\n• Không có analytics, báo cáo crash hay quảng cáo.\n\nBạn chịu trách nhiệm về API key đã dán và về văn bản gửi tới nhà cung cấp.",
        "privacy.intro": "Rewrite Better không có tài khoản và không có máy chủ riêng.",
        "privacy.keysTitle": "Key chỉ lưu trên máy Mac này",
        "privacy.keysBody": "API key chỉ lưu trong Keychain. App không tải chúng lên đâu cả.",
        "privacy.transitTitle": "Văn bản gửi thẳng tới nhà cung cấp bạn chọn",
        "privacy.transitBody": "Văn bản đang chọn và các tùy chọn đi thẳng tới Google, Groq, Cerebras hoặc OpenAI. Không gửi gì cho nhà phát triển Rewrite Better.",
        "privacy.a11yTitle": "Accessibility chỉ để đọc và thay thế",
        "privacy.a11yBody": "Quyền này chỉ dùng để đọc văn bản bạn đang chọn và, nếu bạn chọn Thay thế, đưa kết quả về chỗ cũ. App không ghi màn hình hay phím bấm.",
        "privacy.analyticsTitle": "Không theo dõi",
        "privacy.analyticsBody": "Không có analytics, báo cáo crash hay quảng cáo.",
        "privacy.responsibility": "Bạn chịu trách nhiệm về API key đã dán và về văn bản gửi tới nhà cung cấp.",

        "panel.title": "Rewrite Better",
        "panel.settings": "Cài đặt",
        "panel.close": "Đóng",
        "panel.input": "Văn bản",
        "panel.receivedMessage": "Tin nhắn nhận được",
        "panel.notes": "Ghi chú (tuỳ chọn)",
        "panel.placeholder.input": "Dán hoặc nhập văn bản…",
        "panel.placeholder.reply": "Dán tin nhắn nhận được để trả lời (hoặc để trống để soạn mới)…",
        "panel.placeholder.notes": "Điều bạn muốn nói / ý chính…",
        "panel.result": "Kết quả",
        "panel.resultHint": "⌘↩ để viết lại · ⌥⌘↩ để đưa kết quả về app gốc.",
        "panel.copy": "Sao chép",
        "panel.copied": "Đã sao chép",
        "panel.tone": "Giọng",
        "panel.enableTranslation": "Bật dịch",
        "panel.from": "Từ",
        "panel.to": "Sang",
        "panel.format": "Định dạng",
        "panel.type": "Loại",
        "panel.intent": "Mục đích",
        "panel.length": "Độ dài",
        "panel.language": "Ngôn ngữ",
        "panel.replyHint": "Để trống tin nhắn và dùng ghi chú để soạn mới.",
        "panel.extraHint": "Đang dùng hướng dẫn thêm từ Cài đặt.",
        "panel.voiceHint": "Đang dùng giọng viết từ Cài đặt.",
        "panel.variants": "Bản khác",
        "panel.changes": "Thay đổi",
        "panel.variant": "Bản %@",
        "panel.writingAssist": "Hỗ trợ viết",
        "panel.suggesting": "Đang gợi ý…",
        "panel.tabHint": "Tab để nhận · Esc để bỏ",
        "panel.checkWriting": "Kiểm tra",
        "panel.checking": "Đang kiểm tra…",
        "panel.suggestions": "Gợi ý",
        "panel.apply": "Áp dụng",
        "panel.emptyInput": "Nhập văn bản cần viết lại.",
        "panel.emptyReply": "Dán tin nhắn nhận được hoặc thêm ghi chú.",
        "panel.refine": "Chỉnh bản này",
        "panel.refinePlaceholder": "Ngắn hơn, thân mật hơn, thêm lời chào…",
        "panel.chatYou": "Bạn",
        "panel.chatAi": "AI",
        "panel.emptyRefine": "Nhập cách bạn muốn chỉnh bản này.",
        "panel.emptyResponse": "Không thể xử lý văn bản. Thử lại.",
        "panel.processing": "Đang xử lý…",

        "mode.rewrite": "Viết lại",
        "mode.format": "Định dạng",
        "mode.reply": "Trả lời",
        "action.rewrite": "Viết lại",
        "action.format": "Định dạng",
        "action.reply": "Soạn trả lời",
        "action.refine": "Chỉnh",

        "tone.friendly": "Thân thiện",
        "tone.professional": "Chuyên nghiệp",
        "tone.concise": "Ngắn gọn",
        "tone.persuasive": "Thuyết phục",
        "tone.casual": "Thoải mái",

        "format.markdown": "Markdown",
        "format.html": "HTML",
        "format.bullet-points": "Gạch đầu dòng",
        "format.numbered-list": "Đánh số",
        "format.table": "Bảng",
        "format.outline": "Dàn ý",
        "format.summary": "Tóm tắt",
        "format.faq": "FAQ",

        "channel.message": "Tin nhắn",
        "channel.email": "Email",

        "intent.accept": "Đồng ý",
        "intent.decline": "Từ chối",
        "intent.ask": "Hỏi",
        "intent.follow-up": "Theo dõi",
        "intent.thank": "Cảm ơn",
        "intent.general": "Chung",

        "length.short": "Ngắn",
        "length.medium": "Vừa",
        "length.long": "Dài",

        "a11y.untrusted": "Máy Mac này chưa cho Rewrite Better đọc văn bản đang chọn.",
        "a11y.steps": "1) Mở Cài đặt Hệ thống → Quyền truy cập (Accessibility)\n2) Xóa mọi mục “RewriteBetter” cũ → thêm / bật bản đang chạy\n3) Thoát app hẳn rồi mở lại → Kiểm tra lại",
        "a11y.details": "Hiện chi tiết",
        "a11y.openSettings": "Mở Cài đặt",
        "a11y.recheck": "Kiểm tra lại",

        "api.missing": "Thêm API key để bắt đầu.",
        "api.configure": "Thêm key",
        "api.invalid": "API key này cần kiểm tra lại.",
        "api.check": "Kiểm tra",

        "settings.failoverOrder": "Thứ tự failover: Gemini → Groq → Cerebras → OpenAI. Nhiều key mỗi nhà cung cấp: cách nhau bằng dấu phẩy hoặc xuống dòng. Khi hết quota/rate-limit, key tiếp theo được dùng cho đến khi hết.",
        "settings.tab.keys": "API key",
        "settings.tab.writing": "Cách viết",
        "settings.tab.general": "Chung",
        "settings.language": "Ngôn ngữ giao diện",
        "settings.windowTitle": "Cài đặt Rewrite Better",
        "settings.keysTitle": "API key",
        "settings.showKeys": "Hiện key",
        "settings.hideKeys": "Ẩn key",
        "settings.testOk": "Dùng được",
        "settings.testFail": "Lỗi",
        "settings.openAtLogin": "Mở khi đăng nhập",
        "settings.openAtLoginHelp": "Khởi động Rewrite Better trên thanh menu khi bạn đăng nhập máy Mac này.",
        "settings.openAtLoginOn": "Sẽ mở khi bạn đăng nhập",
        "settings.openAtLoginOff": "Không mở khi đăng nhập",
        "settings.openAtLoginFail": "Không bật được Mở khi đăng nhập",
        "settings.checkForUpdates": "Kiểm tra cập nhật",
        "settings.checkForUpdatesHelp": "Tải bản cài Windows mới nhất và cài đè app hiện tại. Cài đặt và API key vẫn ở máy này.",
        "settings.shortcut": "Phím tắt mở bảng",
        "settings.reset": "Đặt lại",
        "settings.shortcutHelp": "Bấm phím tắt, rồi nhấn tổ hợp mới. Cần có ⌘, ⌥ hoặc ⌃. Esc để hủy.",
        "settings.extraTitle": "Hướng dẫn thêm",
        "settings.extraHelp": "Tuỳ chọn. Được thêm vào prompt sẵn có của mode đó. App vẫn chỉ nhận văn bản cuối — không thay được quy tắc đó.",
        "settings.extraRewritePlaceholder": "vd. Luôn viết tiếng Việt. Giữ giọng của tôi. Không dùng emoji.",
        "settings.extraFormatPlaceholder": "vd. Ưu tiên heading ATX. Không bọc trong code fence.",
        "settings.extraReplyPlaceholder": "vd. Ký tên Thắng. Thân thiện nhưng ngắn.",
        "settings.voiceTitle": "Giọng viết",
        "settings.voiceHelp": "Tuỳ chọn. Dán 3–5 đoạn ngắn theo cách bạn thường viết (Slack, email). Rewrite, Reply và hỗ trợ viết sẽ bám giọng này. Chỉ lưu trên máy Mac này.",
        "settings.voicePlaceholder": "vd. ơi gửi lại file lúc tiện nhé, cảm ơn!",
        "settings.save": "Lưu",
        "settings.saved": "Đã lưu",
        "settings.testKeys": "Kiểm tra key",
        "settings.testing": "Đang kiểm tra từng key…",
        "settings.openAccessibility": "Mở Accessibility…",
        "settings.accessibilityFooter": "%@ cần quyền Accessibility để đọc văn bản đang chọn. Nên dùng bản trong /Applications.",
        "settings.privacy": "Quyền riêng tư…",
        "settings.disclaimer": "API key chỉ lưu trên máy Mac này (Keychain). Không được tải lên hay lưu ở nơi khác. Bạn chịu trách nhiệm giữ chúng bí mật. Nhà phát triển không chịu trách nhiệm nếu key bị lộ.",
        "settings.getKeyTitle": "Lấy API key %@",
        "settings.howToGetKey": "Cách lấy API key %@",
        "settings.openHost": "Mở %@",
        "settings.multipleKeys": "Có thể thêm nhiều key, cách nhau bằng dấu phẩy hoặc xuống dòng.",
        "settings.shortcutSet": "Phím tắt là %@",
        "settings.shortcutFail": "Không đăng ký được %@. Tổ hợp đó có thể đang được dùng.",
        "settings.allKeysOk": "Cả %@ key đều dùng được",
        "settings.allKeysFailed": "Cả %@ key đều lỗi",
        "settings.keysPartial": "%@ OK · %@ lỗi",
        "settings.typeShortcut": "Nhấn phím tắt…",
        "settings.pressShortcut": "Nhấn tổ hợp, hoặc Esc để hủy",
        "settings.changeShortcut": "Bấm để đổi phím tắt",
        "settings.providerEnabled": "Bật",
        "settings.placeholder.gemini": "AIza… (dấu phẩy hoặc xuống dòng nếu nhiều key)",
        "settings.placeholder.groq": "gsk_… (dấu phẩy hoặc xuống dòng nếu nhiều key)",
        "settings.placeholder.cerebras": "csk_… (dấu phẩy hoặc xuống dòng nếu nhiều key)",
        "settings.placeholder.openai": "sk-… (dấu phẩy hoặc xuống dòng nếu nhiều key)",

        "provider.gemini.summary": "Dùng trước. Google AI Studio có hạn mức miễn phí sau khi đăng nhập Google.",
        "provider.gemini.step1": "Mở Google AI Studio (link bên dưới).",
        "provider.gemini.step2": "Đăng nhập tài khoản Google.",
        "provider.gemini.step3": "Bấm Create API key. Tạo hoặc chọn Google Cloud project nếu được hỏi.",
        "provider.gemini.step4": "Sao chép key và dán vào đây. Bắt đầu bằng %@.",
        "provider.groq.summary": "Fallback thứ hai. Groq nhanh và có gói miễn phí sau khi tạo tài khoản.",
        "provider.groq.step1": "Mở Groq Console (link bên dưới).",
        "provider.groq.step2": "Đăng ký hoặc đăng nhập.",
        "provider.groq.step3": "Mở API Keys và tạo key mới.",
        "provider.groq.step4": "Sao chép và dán vào đây. Bắt đầu bằng %@.",
        "provider.cerebras.summary": "Fallback thứ ba. Cerebras Cloud có dùng thử miễn phí. Mở API Keys ở thanh bên trái.",
        "provider.cerebras.step1": "Mở Cerebras Cloud (link bên dưới).",
        "provider.cerebras.step2": "Đăng ký hoặc đăng nhập.",
        "provider.cerebras.step3": "Mở API Keys ở thanh bên trái. Tài khoản trả phí cần chọn project trước.",
        "provider.cerebras.step4": "Tạo key, sao chép, rồi dán vào đây. Bắt đầu bằng %@.",
        "provider.openai.summary": "Cuối chuỗi. Tạo secret key trên nền tảng OpenAI. Cần thanh toán sau thời gian dùng thử.",
        "provider.openai.step1": "Mở trang API keys của OpenAI (link bên dưới).",
        "provider.openai.step2": "Đăng nhập tài khoản OpenAI.",
        "provider.openai.step3": "Bấm Create new secret key và sao chép ngay.",
        "provider.openai.step4": "Dán vào đây. Bắt đầu bằng %@.",

        "error.missingKey": "Thêm API key trong Cài đặt để bắt đầu.",
        "error.allKeysResting": "Tất cả API key đang tạm nghỉ đến ngày mai. Thêm key mới hoặc thử lại sau.",
        "error.401": "API Key không hợp lệ hoặc đã hết hạn.",
        "error.403": "Không có quyền truy cập API.",
        "error.429": "Đã vượt quá giới hạn requests trên tất cả API key.",
        "error.402": "Hết quota / cần thanh toán trên tất cả API key.",
        "error.5xx": "Lỗi server AI. Vui lòng thử lại sau.",
        "error.http": "Lỗi AI API: HTTP %@ - %@",
        "error.emptyResponse": "Không thể xử lý văn bản.",
        "error.network": "Lỗi kết nối mạng. %@",
        "paste.replace": "Thay thế",
        "paste.paste": "Dán",
        "paste.replaceIn": "Thay trong %@",
        "paste.pasteIn": "Dán vào %@",
        "paste.replaceHelp": "Thay phần chọn trong %@. ⌥⌘↩",
        "paste.pasteHelp": "Dán vào %@ tại con trỏ. ⌥⌘↩",
        "paste.previousApp": "app trước đó",
        "panel.pasteNoTarget": "Không có app trước để dán. Kết quả đang ở clipboard — nhấn ⌘V.",
        "panel.pasteActivateFailed": "Không chuyển lại được app gốc. Kết quả đang ở clipboard — nhấn ⌘V.",

        "error.unknown": "Lỗi không xác định"
    ]
}

final class LanguageStore: ObservableObject {
    static let shared = LanguageStore()
    static let storageKey = "uiLanguage"

    private let defaults: UserDefaults

    @Published var language: AppLanguage {
        didSet {
            defaults.set(language.rawValue, forKey: Self.storageKey)
        }
    }

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.language = AppLanguage.parse(defaults.string(forKey: Self.storageKey))
    }

    func t(_ key: String, _ args: String...) -> String {
        L10n.t(key, language: language, arguments: args)
    }
}
