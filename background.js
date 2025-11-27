// This background script helps handle locale switching
// Note: Chrome extensions i18n is primarily based on browser locale settings

chrome.runtime.onInstalled.addListener(() => {
  // Set default interface language to 'en' if not set
  chrome.storage.local.get(['interfaceLanguage'], (result) => {
    if (!result.interfaceLanguage) {
      chrome.storage.local.set({ interfaceLanguage: 'en' });
    }
  });
});
