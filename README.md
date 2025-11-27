# AI Webpage Translator - Chrome Extension

Translate webpages and text using AI (Google Gemini, Perplexity, ChatGPT, or Grok) while preserving page structure.

## ✨ Features

- **4 AI Services**: Choose between Google Gemini, Perplexity AI, ChatGPT (OpenAI), or Grok (xAI)
- **Full Page Translation**: Translates entire webpages while preserving structure and styling
- **Text Selection**: Select and translate specific text with a floating popup
- **Translation Modes**: Replace text or show translation below original
- **3 Languages**: English, Japanese, and Vietnamese
- **Secure**: API keys stored locally in your browser

## 📦 Installation

1. **Get an API Key** (choose one):
   - [Google Gemini](https://makersuite.google.com/app/apikey) (Recommended)
   - [Perplexity AI](https://www.perplexity.ai/settings/api)
   - [OpenAI ChatGPT](https://platform.openai.com/api-keys)
   - [xAI Grok](https://console.x.ai/)

2. **Load Extension**:
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select the extension folder

3. **Configure**:
   - Click extension icon → Settings ⚙️
   - Select AI service
   - Enter and save your API key
   - Choose target language

## 🚀 Usage

**Full Page Translation:**
- Click extension icon → "Translate Page"
- Toggle "Show translation below" to keep original text visible
- Click "Restore Original" to revert changes

**Text Selection Translation:**
- Select any text on a webpage
- Click the 🌐 icon that appears
- View instant translation in popup

**Custom Text Translation:**
- Open extension popup
- Enter text in the text area
- Click "Translate Text"

## 🔧 How It Works

- **TreeWalker DOM**: Preserves HTML structure by only replacing text nodes
- **Chunked Processing**: Handles large pages by batching API calls
- **Multi-AI Support**: Dynamic routing to your selected AI service
- **Local Storage**: API keys never leave your browser

## 🛠️ Troubleshooting

**Translation not working?**
- Verify API key is saved
- Check API quota/billing for your service
- Ensure page is fully loaded
- Try a different AI service

**Partial translation?**
- Page may have dynamic content
- Scroll to load all content first
- Some elements (scripts, styles) are intentionally skipped

## 📝 License

Free to use and modify

## 🔗 Resources

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Gemini API](https://ai.google.dev/docs)
- [Perplexity API](https://docs.perplexity.ai/)
- [OpenAI API](https://platform.openai.com/docs)
- [xAI Grok API](https://docs.x.ai/)
