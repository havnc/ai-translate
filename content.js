// Content script for webpage translation
// This script runs in the context of web pages

// Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const PERPLEXITY_API_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const MAX_CHUNK_SIZE = 2000; // Characters per API call
const BATCH_SIZE = 5; // Number of concurrent API calls

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslation(request.apiKey, request.targetLanguage, request.showBelowMode, request.aiService)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Translation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate async response
    return true;
  }
  
  if (request.action === 'translateSelection') {
    handleSelectionTranslation(request.text, request.apiKey, request.targetLanguage, request.aiService)
      .then((translatedText) => {
        sendResponse({ success: true, translatedText });
      })
      .catch((error) => {
        console.error('Selection translation error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.action === 'restore') {
    handleRestore()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Restore error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});

// Storage for original text nodes
let originalTextNodes = [];
let translatedElements = []; // Store added translation elements for removal

// Main translation handler
async function handleTranslation(apiKey, targetLanguage, showBelowMode = false, aiService = 'gemini') {
  // Get all text nodes using TreeWalker
  const textNodes = getTextNodes();
  
  if (textNodes.length === 0) {
    throw new Error('No text found on page');
  }
  
  // Clean up previously added translations if in show below mode
  if (showBelowMode && translatedElements.length > 0) {
    translatedElements.forEach(el => el.remove());
    translatedElements = [];
  }
  
  // Save original text nodes for restore
  originalTextNodes = textNodes.map(node => ({
    node: node,
    originalText: node.nodeValue
  }));
  console.log(`Saved ${originalTextNodes.length} original text nodes for restore`);
  
  // Group text nodes into chunks
  const chunks = createChunks(textNodes);
  
  console.log(`Found ${textNodes.length} text nodes, grouped into ${chunks.length} chunks. ShowBelowMode: ${showBelowMode}, AI Service: ${aiService}`);
  
  // Translate chunks in batches
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(chunk => 
      translateChunk(chunk, apiKey, targetLanguage, showBelowMode, aiService)
    );
    
    await Promise.all(promises);
  }
  
  console.log('Translation completed');
}

// Restore original text
async function handleRestore() {
  if (originalTextNodes.length === 0) {
    throw new Error('No original text to restore. Please translate the page first.');
  }
  
  console.log(`Restoring ${originalTextNodes.length} text nodes to original`);
  
  originalTextNodes.forEach(({node, originalText}) => {
    if (node && node.nodeValue !== null) {
      node.nodeValue = originalText;
    }
  });
  
  console.log('Restore completed');
}

// Get all visible text nodes using TreeWalker
function getTextNodes() {
  const textNodes = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip empty text nodes
        if (!node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip script, style, and other non-visible elements
        const parent = node.parentElement;
        if (!parent) {
          return NodeFilter.FILTER_REJECT;
        }
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'iframe', 'object'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip hidden elements
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  return textNodes;
}

// Group text nodes into chunks for API calls
function createChunks(textNodes) {
  const chunks = [];
  let currentChunk = {
    nodes: [],
    text: '',
    length: 0
  };
  
  for (const node of textNodes) {
    const text = node.nodeValue.trim();
    const length = text.length;
    
    // If adding this text would exceed chunk size, start a new chunk
    if (currentChunk.length + length > MAX_CHUNK_SIZE && currentChunk.nodes.length > 0) {
      chunks.push(currentChunk);
      currentChunk = {
        nodes: [],
        text: '',
        length: 0
      };
    }
    
    currentChunk.nodes.push({ node, originalText: text });
    currentChunk.text += text + '\n';
    currentChunk.length += length + 1;
  }
  
  // Add the last chunk
  if (currentChunk.nodes.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Translate a single chunk - routes to appropriate API
async function translateChunk(chunk, apiKey, targetLanguage, showBelowMode = false, aiService = 'gemini') {
  let translatedText;
  
  if (aiService === 'perplexity') {
    translatedText = await translateWithPerplexity(chunk.text, apiKey, targetLanguage);
  } else {
    translatedText = await translateWithGemini(chunk.text, apiKey, targetLanguage);
  }
  
  // Split translated text into lines
  const translatedLines = translatedText.split('\n').map(line => line.trim()).filter(line => line);
  
  if (showBelowMode) {
    // SHOW BELOW MODE: Add translation below original text
    chunk.nodes.forEach((item, index) => {
      if (index < translatedLines.length && item.node.parentElement) {
        // Create translation element
        const translationSpan = document.createElement('span');
        translationSpan.className = 'ai-translation-below';
        translationSpan.textContent = translatedLines[index];
        translationSpan.style.cssText = `
          display: block;
          font-size: 0.85em;
          color: #667eea;
          font-style: italic;
          margin-top: 4px;
          line-height: 1.4;
        `;
        
        // Insert after the parent element
        const parent = item.node.parentElement;
        if (parent.nextSibling) {
          parent.parentNode.insertBefore(translationSpan, parent.nextSibling);
        } else {
          parent.parentNode.appendChild(translationSpan);
        }
        
        // Store for cleanup
        translatedElements.push(translationSpan);
      }
    });
  } else {
    // REPLACE MODE: Replace original text with translation
    chunk.nodes.forEach((item, index) => {
      if (index < translatedLines.length) {
        item.node.nodeValue = translatedLines[index];
      }
    });
  }
}

// Translate using Gemini API
async function translateWithGemini(text, apiKey, targetLanguage) {
  const systemPrompt = `You are a professional translator. Translate the following text into ${targetLanguage}. Only return the translated text, no explanations. Preserve line breaks and maintain the same number of lines as the input.`;
  
  const requestBody = {
    contents: [{
      parts: [{
        text: systemPrompt + '\n\nText to translate:\n' + text
      }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    }
  };
  
  try {
    const response = await fetch(GEMINI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid API response format');
    }
    
    return data.candidates[0].content.parts[0].text.trim();
    
  } catch (error) {
    console.error('Gemini translation error:', error);
    throw error;
  }
}

// Translate using Perplexity API
async function translateWithPerplexity(text, apiKey, targetLanguage) {
  const systemPrompt = `You are a professional translator. Translate the following text into ${targetLanguage}. Only return the translated text, no explanations. Preserve line breaks and maintain the same number of lines as the input.`;
  
  const requestBody = {
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: 'Text to translate:\n' + text
      }
    ],
    temperature: 0.3,
    max_tokens: 2048
  };
  
  try {
    const response = await fetch(PERPLEXITY_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || errorData.detail || `API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid Perplexity API response format');
    }
    
    return data.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Perplexity translation error:', error);
    throw error;
  }
}

// ===== TEXT SELECTION TRANSLATION FEATURE =====

// Translate selected text only
async function handleSelectionTranslation(text, apiKey, targetLanguage, aiService = 'gemini') {
  if (aiService === 'perplexity') {
    return await translateWithPerplexity(text, apiKey, targetLanguage);
  } else {
    return await translateWithGemini(text, apiKey, targetLanguage);
  }
}

// Create and manage floating translate icon
let translateIcon = null;
let translationPopup = null;

// Initialize selection feature
function initSelectionFeature() {
  // Create translate icon
  translateIcon = document.createElement('div');
  translateIcon.id = 'ai-translate-icon';
  translateIcon.innerHTML = '🌐';
  translateIcon.style.cssText = `
    position: absolute;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    z-index: 999999;
    transition: transform 0.2s;
  `;
  
  translateIcon.addEventListener('mouseenter', () => {
    translateIcon.style.transform = 'scale(1.1)';
  });
  
  translateIcon.addEventListener('mouseleave', () => {
    translateIcon.style.transform = 'scale(1)';
  });
  
  // Prevent mousedown from clearing selection
  translateIcon.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
  translateIcon.addEventListener('click', handleIconClick);
  document.body.appendChild(translateIcon);
  
  // Create translation popup
  translationPopup = document.createElement('div');
  translationPopup.id = 'ai-translation-popup';
  translationPopup.style.cssText = `
    position: absolute;
    max-width: 400px;
    background: white;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    display: none;
    z-index: 1000000;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  `;
  document.body.appendChild(translationPopup);
  
  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('selectionchange', handleSelectionChange);
}

let selectedText = '';
let selectionRange = null;

function handleTextSelection(e) {
  const selection = window.getSelection();
  const text = selection.toString().trim();
  
  // Hide icon and popup if no selection
  if (!text || text.length === 0) {
    translateIcon.style.display = 'none';
    translationPopup.style.display = 'none';
    selectedText = '';
    selectionRange = null;
    return;
  }
  
  // Store selected text and range
  selectedText = text;
  if (selection.rangeCount > 0) {
    selectionRange = selection.getRangeAt(0);
  }
  
  // Position icon near selection
  const rect = selectionRange.getBoundingClientRect();
  const iconX = rect.left + rect.width / 2 - 16 + window.scrollX;
  const iconY = rect.bottom + 5 + window.scrollY;
  
  translateIcon.style.left = iconX + 'px';
  translateIcon.style.top = iconY + 'px';
  translateIcon.style.display = 'flex';
}

function handleSelectionChange() {
  // This helps keep the icon visible during selection
  const selection = window.getSelection();
  if (!selection.toString().trim()) {
    setTimeout(() => {
      if (!window.getSelection().toString().trim()) {
        translateIcon.style.display = 'none';
        translationPopup.style.display = 'none';
      }
    }, 100);
  }
}

async function handleIconClick(e) {
  e.preventDefault();
  e.stopPropagation();
  
  console.log('Icon clicked! Selected text:', selectedText);
  
  if (!selectedText) {
    console.warn('No selected text found');
    return;
  }
  
  // Store text in case selection gets cleared
  const textToTranslate = selectedText;
  const rangeToUse = selectionRange;
  
  // Get API key, target language, and AI service from storage
  chrome.storage.local.get(['aiService', 'geminiApiKey', 'perplexityApiKey', 'targetLanguage'], async (result) => {
    const aiService = result.aiService || 'gemini';
    const targetLanguage = result.targetLanguage || 'Vietnamese';
    
    // Get appropriate API key
    let apiKey;
    if (aiService === 'gemini') {
      apiKey = result.geminiApiKey;
    } else if (aiService === 'perplexity') {
      apiKey = result.perplexityApiKey;
    }
    
    console.log('AI Service:', aiService, 'API Key present:', !!apiKey, 'Target lang:', targetLanguage);
    
    if (!apiKey) {
      showTranslationPopup('⚠️ Please set your API key in the extension popup first.', true);
      return;
    }
    
    // Show loading state
    showTranslationPopup('🔄 Translating...', false);
    
    try {
      console.log('Starting translation for:', textToTranslate);
      const translatedText = await handleSelectionTranslation(textToTranslate, apiKey, targetLanguage, aiService);
      console.log('Translation result:', translatedText);
      
      // Show translation
      const content = `
        <div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
          <strong style="color: #667eea;">Original:</strong><br>
          <span style="color: #555;">${textToTranslate}</span>
        </div>
        <div>
          <strong style="color: #764ba2;">Translation (${targetLanguage}):</strong><br>
          <span style="color: #000;">${translatedText}</span>
        </div>
        <div style="margin-top: 12px; text-align: right;">
          <button id="ai-close-popup" style="
            padding: 4px 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          ">Close</button>
        </div>
      `;
      
      showTranslationPopup(content, false);
      
      // Add close button handler
      setTimeout(() => {
        const closeBtn = document.getElementById('ai-close-popup');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            translationPopup.style.display = 'none';
            translateIcon.style.display = 'none';
          });
        }
      }, 100);
      
    } catch (error) {
      console.error('Translation error:', error);
      showTranslationPopup(`❌ Error: ${error.message}`, true);
    }
  });
}

function showTranslationPopup(content, isError) {
  if (!selectionRange) return;
  
  translationPopup.innerHTML = content;
  
  if (isError) {
    translationPopup.style.background = '#fee';
    translationPopup.style.color = '#c00';
  } else {
    translationPopup.style.background = 'white';
    translationPopup.style.color = '#000';
  }
  
  // Position popup
  const rect = selectionRange.getBoundingClientRect();
  const popupX = rect.left + window.scrollX;
  let popupY = rect.bottom + 40 + window.scrollY;
  
  translationPopup.style.left = popupX + 'px';
  translationPopup.style.top = popupY + 'px';
  translationPopup.style.display = 'block';
  
  // Adjust if popup goes off-screen
  setTimeout(() => {
    const popupRect = translationPopup.getBoundingClientRect();
    if (popupRect.right > window.innerWidth) {
      translationPopup.style.left = (window.innerWidth - popupRect.width - 10 + window.scrollX) + 'px';
    }
    if (popupRect.bottom > window.innerHeight + window.scrollY) {
      translationPopup.style.top = (rect.top - popupRect.height - 10 + window.scrollY) + 'px';
    }
  }, 10);
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSelectionFeature);
} else {
  initSelectionFeature();
}
