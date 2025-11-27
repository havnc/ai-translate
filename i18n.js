// Custom i18n implementation for dynamic locale switching
// Chrome extensions' built-in i18n is based on browser locale only
// This implementation allows users to switch language without changing browser settings

const translations = {
  en: {
    extName: "AI Webpage Translator",
    extDescription: "Translate webpages using AI API",
    appTitle: "🌐 AI Translator",
    settings: "Settings",
    settingsTitle: "⚙️ Settings",
    targetLanguage: "Target Language:",
    languageEnglish: "English",
    languageJapanese: "Japanese",
    languageVietnamese: "Vietnamese",
    showBelowMode: "Show translation below original text",
    showBelowModeHint: "Original text will remain, translation appears underneath",
    customTextTranslation: "Custom Text Translation:",
    customTextPlaceholder: "Enter text to translate...",
    customTextHint: "Enter your own text to translate directly in the popup",
    translateText: "🔤 Translate Text",
    translatePage: "Translate Page",
    restoreOriginal: "↺ Restore Original",
    aiService: "AI Service:",
    geminiApiKey: "Gemini API Key:",
    perplexityApiKey: "Perplexity API Key:",
    chatgptApiKey: "ChatGPT API Key:",
    grokApiKey: "Grok API Key:",
    apiKeyPlaceholderGemini: "Enter your Gemini API key",
    apiKeyPlaceholderPerplexity: "Enter your Perplexity API key",
    apiKeyPlaceholderChatGPT: "Enter your OpenAI API key",
    apiKeyPlaceholderGrok: "Enter your xAI API key",
    save: "Save",
    getApiKeyGemini: "Get your API key from",
    getApiKeyPerplexity: "Get your API key from",
    getApiKeyChatGPT: "Get your API key from",
    getApiKeyGrok: "Get your API key from",
    googleAIStudio: "Google AI Studio",
    perplexitySettings: "Perplexity Settings",
    openAIPlatform: "OpenAI Platform",
    xAIConsole: "xAI Console",
    translating: "Translating...",
    errorEnterApiKey: "Please enter an API key",
    successApiKeySaved: "API key saved successfully!",
    successPerplexityApiKeySaved: "Perplexity API key saved successfully!",
    successChatGPTApiKeySaved: "ChatGPT API key saved successfully!",
    successGrokApiKeySaved: "Grok API key saved successfully!",
    errorEnterAndSaveApiKey: "Please enter and save your API key first",
    errorNoActiveTab: "No active tab found",
    successTranslationCompleted: "Translation completed successfully!",
    errorTranslationFailed: "Translation failed:",
    successOriginalRestored: "Original text restored!",
    errorRestoreFailed: "Restore failed:",
    errorEnterText: "Please enter text to translate",
    successCustomTranslationCompleted: "Translation completed!",
    interfaceLanguage: "Interface Language:",
    languageEnglishFull: "English",
    languageVietnameseFull: "Tiếng Việt"
  },
  vi: {
    extName: "Dịch Trang Web AI",
    extDescription: "Dịch trang web sử dụng AI API",
    appTitle: "🌐 Phiên Dịch AI",
    settings: "Cài đặt",
    settingsTitle: "⚙️ Cài Đặt",
    targetLanguage: "Ngôn ngữ đích:",
    languageEnglish: "Tiếng Anh",
    languageJapanese: "Tiếng Nhật",
    languageVietnamese: "Tiếng Việt",
    showBelowMode: "Hiển thị bản dịch bên dưới văn bản gốc",
    showBelowModeHint: "Văn bản gốc sẽ được giữ nguyên, bản dịch xuất hiện bên dưới",
    customTextTranslation: "Dịch Văn Bản Tùy Chỉnh:",
    customTextPlaceholder: "Nhập văn bản cần dịch...",
    customTextHint: "Nhập văn bản của bạn để dịch trực tiếp trong popup",
    translateText: "🔤 Dịch Văn Bản",
    translatePage: "Dịch Trang",
    restoreOriginal: "↺ Khôi Phục Gốc",
    aiService: "Dịch vụ AI:",
    geminiApiKey: "Khóa API Gemini:",
    perplexityApiKey: "Khóa API Perplexity:",
    chatgptApiKey: "Khóa API ChatGPT:",
    grokApiKey: "Khóa API Grok:",
    apiKeyPlaceholderGemini: "Nhập khóa API Gemini của bạn",
    apiKeyPlaceholderPerplexity: "Nhập khóa API Perplexity của bạn",
    apiKeyPlaceholderChatGPT: "Nhập khóa API OpenAI của bạn",
    apiKeyPlaceholderGrok: "Nhập khóa API xAI của bạn",
    save: "Lưu",
    getApiKeyGemini: "Lấy khóa API từ",
    getApiKeyPerplexity: "Lấy khóa API từ",
    getApiKeyChatGPT: "Lấy khóa API từ",
    getApiKeyGrok: "Lấy khóa API từ",
    googleAIStudio: "Google AI Studio",
    perplexitySettings: "Cài Đặt Perplexity",
    openAIPlatform: "Nền Tảng OpenAI",
    xAIConsole: "Bảng Điều Khiển xAI",
    translating: "Đang dịch...",
    errorEnterApiKey: "Vui lòng nhập khóa API",
    successApiKeySaved: "Đã lưu khóa API thành công!",
    successPerplexityApiKeySaved: "Đã lưu khóa API Perplexity thành công!",
    successChatGPTApiKeySaved: "Đã lưu khóa API ChatGPT thành công!",
    successGrokApiKeySaved: "Đã lưu khóa API Grok thành công!",
    errorEnterAndSaveApiKey: "Vui lòng nhập và lưu khóa API của bạn trước",
    errorNoActiveTab: "Không tìm thấy tab đang hoạt động",
    successTranslationCompleted: "Dịch hoàn tất thành công!",
    errorTranslationFailed: "Dịch thất bại:",
    successOriginalRestored: "Đã khôi phục văn bản gốc!",
    errorRestoreFailed: "Khôi phục thất bại:",
    errorEnterText: "Vui lòng nhập văn bản cần dịch",
    successCustomTranslationCompleted: "Dịch hoàn tất!",
    interfaceLanguage: "Ngôn ngữ giao diện:",
    languageEnglishFull: "English",
    languageVietnameseFull: "Tiếng Việt"
  }
};

let currentLocale = 'en';

// Initialize i18n with saved locale
function initI18n(callback) {
  chrome.storage.local.get(['interfaceLanguage'], (result) => {
    currentLocale = result.interfaceLanguage || 'en';
    if (callback) callback();
  });
}

// Get translated message
function getMessage(key) {
  return translations[currentLocale][key] || translations['en'][key] || key;
}

// Set locale and update UI
function setLocale(locale, callback) {
  currentLocale = locale;
  chrome.storage.local.set({ interfaceLanguage: locale }, () => {
    updateUILanguage();
    if (callback) callback();
  });
}

// Update all UI elements with current locale
function updateUILanguage() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageName = element.getAttribute('data-i18n');
    element.textContent = getMessage(messageName);
  });
  
  // Update all elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const messageName = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getMessage(messageName);
  });
  
  // Update all elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const messageName = element.getAttribute('data-i18n-title');
    element.title = getMessage(messageName);
  });
  
  // Update document title
  document.title = getMessage('extName');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initI18n, getMessage, setLocale, updateUILanguage };
}
