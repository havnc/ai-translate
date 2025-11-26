// DOM Elements
const aiServiceSelect = document.getElementById('aiService');
const geminiSection = document.getElementById('geminiSection');
const perplexitySection = document.getElementById('perplexitySection');
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const perplexityApiKeyInput = document.getElementById('perplexityApiKey');
const savePerplexityApiKeyBtn = document.getElementById('savePerplexityApiKey');
const targetLangSelect = document.getElementById('targetLang');
const showBelowModeCheckbox = document.getElementById('showBelowMode');
const translateBtn = document.getElementById('translateBtn');
const statusDiv = document.getElementById('status');
const loadingOverlay = document.getElementById('loadingOverlay');


// Load saved settings on popup open
chrome.storage.local.get(['aiService', 'geminiApiKey', 'perplexityApiKey', 'targetLanguage', 'showBelowMode'], (result) => {
  // Load AI service selection (default to gemini)
  const aiService = result.aiService || 'gemini';
  aiServiceSelect.value = aiService;
  toggleApiKeySections(aiService);
  
  // Load API keys
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
  if (result.perplexityApiKey) {
    perplexityApiKeyInput.value = result.perplexityApiKey;
  }
  
  // Load other settings
  if (result.targetLanguage) {
    targetLangSelect.value = result.targetLanguage;
  }
  if (result.showBelowMode !== undefined) {
    showBelowModeCheckbox.checked = result.showBelowMode;
  }
});

// Toggle API key sections based on selected service
function toggleApiKeySections(service) {
  if (service === 'gemini') {
    geminiSection.style.display = 'block';
    perplexitySection.style.display = 'none';
  } else if (service === 'perplexity') {
    geminiSection.style.display = 'none';
    perplexitySection.style.display = 'block';
  }
}

// AI Service selection handler
aiServiceSelect.addEventListener('change', () => {
  const selectedService = aiServiceSelect.value;
  toggleApiKeySections(selectedService);
  chrome.storage.local.set({ aiService: selectedService });
});

// Save API Key
saveApiKeyBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
    showStatus('API key saved successfully!', 'success');
  });
});

// Save Perplexity API Key
savePerplexityApiKeyBtn.addEventListener('click', () => {
  const apiKey = perplexityApiKeyInput.value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  chrome.storage.local.set({ perplexityApiKey: apiKey }, () => {
    showStatus('Perplexity API key saved successfully!', 'success');
  });
});

// Save language preference on change
targetLangSelect.addEventListener('change', () => {
  chrome.storage.local.set({ targetLanguage: targetLangSelect.value });
});

// Save show below mode preference on change
showBelowModeCheckbox.addEventListener('change', () => {
  chrome.storage.local.set({ showBelowMode: showBelowModeCheckbox.checked });
});

// Translate Button Click
translateBtn.addEventListener('click', async () => {
  // Get selected AI service
  const aiService = aiServiceSelect.value;
  const targetLang = targetLangSelect.value;
  
  // Get appropriate API key based on service
  let apiKey;
  if (aiService === 'gemini') {
    apiKey = apiKeyInput.value.trim();
  } else if (aiService === 'perplexity') {
    apiKey = perplexityApiKeyInput.value.trim();
  }
  
  if (!apiKey) {
    showStatus('Please enter and save your API key first', 'error');
    return;
  }
  
  // Show loading
  showLoading(true);
  hideStatus();
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    // Inject content script and execute translation
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Send message to content script
    chrome.tabs.sendMessage(
      tab.id,
      { 
        action: 'translate',
        aiService: aiService,
        apiKey: apiKey,
        targetLanguage: targetLang,
        showBelowMode: showBelowModeCheckbox.checked
      },
      (response) => {
        showLoading(false);
        
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        
        if (response && response.success) {
          showStatus('Translation completed successfully!', 'success');
        } else {
          showStatus('Translation failed: ' + (response?.error || 'Unknown error'), 'error');
        }
      }
    );
    
  } catch (error) {
    showLoading(false);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Restore Original Button Click
const restoreBtn = document.getElementById('restoreBtn');
restoreBtn.addEventListener('click', async () => {
  // Show loading
  showLoading(true);
  hideStatus();
  
  try {
    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      throw new Error('No active tab found');
    }
    
    // Send message to content script to restore
    chrome.tabs.sendMessage(
      tab.id,
      { action: 'restore' },
      (response) => {
        showLoading(false);
        
        if (chrome.runtime.lastError) {
          showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
          return;
        }
        
        if (response && response.success) {
          showStatus('Original text restored!', 'success');
        } else {
          showStatus('Restore failed: ' + (response?.error || 'Unknown error'), 'error');
        }
      }
    );
    
  } catch (error) {
    showLoading(false);
    showStatus('Error: ' + error.message, 'error');
  }
});

// Helper Functions
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
  
  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      hideStatus();
    }, 3000);
  }
}

function hideStatus() {
  statusDiv.classList.add('hidden');
}

function showLoading(show) {
  if (show) {
    loadingOverlay.classList.remove('hidden');
    translateBtn.disabled = true;
  } else {
    loadingOverlay.classList.add('hidden');
    translateBtn.disabled = false;
  }
}
