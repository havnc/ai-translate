# AI Webpage Translator - Chrome Extension

A powerful Chrome Extension that translates webpages using AI (Google Gemini or Perplexity AI) while preserving the original page structure and styling.

## Features

✨ **Intelligent Translation**
- Choose between Google Gemini AI or Perplexity AI for high-quality translations
- Supports English, Japanese, and Vietnamese
- Preserves page structure and styling using TreeWalker DOM manipulation

🎯 **Text Selection Translation** (NEW!)
- Select any text on a webpage
- A floating translate icon appears near your selection
- Click the icon to instantly translate just the selected text
- Results shown in a beautiful popup overlay

🎨 **Modern UI**
- Clean, intuitive popup interface
- Gradient design with smooth animations
- Real-time loading indicators

🔒 **Secure**
- API keys stored locally in browser
- No data sent to third-party servers except your selected AI service API

## Installation

1. **Get an API Key** (choose one):
   
   **Option A: Google Gemini** (Recommended for most users)
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create and copy your API key
   
   **Option B: Perplexity AI**
   - Visit [Perplexity API Settings](https://www.perplexity.ai/settings/api)
   - Sign up or log in
   - Generate and copy your API key

2. **Load the Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `trans-extension` folder

3. **Configure**
   - Click the extension icon in your toolbar
   - Select your preferred AI service (Gemini or Perplexity)
   - Paste your API key and click "Save"
   - Select your target language
   - Click "Translate Page"

## Files Structure

```
trans-extension/
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html          # Popup UI
├── popup.js            # Popup logic and messaging
├── content.js          # Translation engine and DOM manipulation
├── styles.css          # Popup styling
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── README.md           # This file
```

## How It Works

### TreeWalker DOM Manipulation
Instead of replacing the entire `innerHTML`, this extension uses `document.createTreeWalker` to:
1. Traverse all visible text nodes in the webpage
2. Filter out script, style, and hidden elements
3. Extract text while preserving DOM structure
4. Replace only text content using `nodeValue`

This approach maintains:
- Original HTML structure
- CSS styling and layout
- JavaScript functionality
- Images and media

### Chunked Translation
To handle token limits:
- Text nodes are grouped into chunks (~2000 characters)
- Multiple chunks are processed in parallel batches
- Each chunk maintains line-to-node mapping for accurate replacement

### API Integration
- Supports both Gemini and Perplexity REST APIs
- Dynamic routing based on selected AI service
- System prompt ensures translation-only responses
- Temperature set to 0.3 for consistency
- Error handling with user-friendly messages

## Usage Tips

**Full Page Translation:**
- **First Translation**: May take longer as it processes all text
- **Large Pages**: Will be translated in chunks; be patient
- **Dynamic Content**: Re-run translation after content loads
- **API Costs**: Monitor your API usage (Google AI Studio for Gemini, Perplexity dashboard for Perplexity)

**Text Selection Translation:**
- **Select Text**: Highlight any text on the page
- **Click Icon**: A floating 🌐 icon appears near your selection
- **View Translation**: Click the icon to see instant translation in a popup
- **Quick & Easy**: Perfect for translating specific paragraphs or sentences

## Permissions Explained

- **activeTab**: Access current webpage content
- **scripting**: Inject content script for translation
- **storage**: Save API key locally
- **host_permissions**: Call Gemini API endpoint

## Troubleshooting

**Translation doesn't start:**
- Verify API key is saved
- Check browser console for errors
- Ensure the page has loaded completely

**Partial translation:**
- Page may have dynamic content
- Try scrolling to load all content first
- Some elements may be intentionally skipped (scripts, styles)

**API errors:**
- Verify API key is valid for your selected AI service
- Check API quota (Google AI Studio for Gemini, Perplexity dashboard for Perplexity)
- Try switching to a different AI service if one is experiencing issues
- Ensure internet connection is stable

## Development

Built with:
- Manifest V3
- Vanilla JavaScript (no frameworks)
- Google Gemini AI API & Perplexity AI API
- Modern CSS with gradients and animations

## License

Free to use and modify

## Support

For issues or questions, check:
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Perplexity API Documentation](https://docs.perplexity.ai/)
