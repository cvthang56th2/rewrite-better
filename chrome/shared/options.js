/* Shared option definitions for Rewrite Better panel */
(function (global) {
  const RB = (global.RewriteBetter = global.RewriteBetter || {});

  RB.MODEL = 'openai/gpt-oss-20b';

  RB.MODES = [
    { value: 'rewrite', label: 'Rewrite' },
    { value: 'format', label: 'Format' },
    { value: 'reply', label: 'Reply' }
  ];

  RB.TONES = [
    { value: 'friendly', label: 'Friendly' },
    { value: 'professional', label: 'Professional' },
    { value: 'concise', label: 'Concise' },
    { value: 'persuasive', label: 'Persuasive' },
    { value: 'casual', label: 'Casual' }
  ];

  RB.FORMAT_TYPES = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'html', label: 'HTML' },
    { value: 'bullet-points', label: 'Bullets' },
    { value: 'numbered-list', label: 'Numbered' },
    { value: 'table', label: 'Table' },
    { value: 'outline', label: 'Outline' },
    { value: 'summary', label: 'Summary' },
    { value: 'faq', label: 'FAQ' }
  ];

  RB.CHANNELS = [
    { value: 'message', label: 'Message' },
    { value: 'email', label: 'Email' }
  ];

  RB.INTENTS = [
    { value: 'accept', label: 'Accept' },
    { value: 'decline', label: 'Decline' },
    { value: 'ask', label: 'Ask' },
    { value: 'follow-up', label: 'Follow up' },
    { value: 'thank', label: 'Thank' },
    { value: 'general', label: 'General' }
  ];

  RB.LENGTHS = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' }
  ];

  RB.LANGUAGES = [
    { value: 'auto', label: 'Auto' },
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ja', label: 'Japanese' },
    { value: 'ko', label: 'Korean' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'es', label: 'Spanish' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'ru', label: 'Russian' },
    { value: 'ar', label: 'Arabic' },
    { value: 'hi', label: 'Hindi' },
    { value: 'th', label: 'Thai' }
  ];

  RB.OUTPUT_LANGUAGES = RB.LANGUAGES.filter((l) => l.value !== 'auto');

  RB.LANGUAGE_NAMES = {
    auto: 'automatically detected language',
    en: 'English',
    vi: 'Vietnamese',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    th: 'Thai'
  };

  RB.MODE_BUTTON_LABELS = {
    rewrite: 'Rewrite with Groq AI',
    format: 'Format Document',
    reply: 'Generate Reply'
  };
})(typeof window !== 'undefined' ? window : self);
