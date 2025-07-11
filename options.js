// Options page script
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('optionsForm');
    const apiKeyInput = document.getElementById('apiKey');
    const successMessage = document.getElementById('successMessage');
    
    // Load saved API key
    loadSavedSettings();
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveSettings();
    });
    
    // Auto-hide success message after showing
    function showSuccessMessage() {
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
    
    // Load saved settings from storage
    function loadSavedSettings() {
        // Check if chrome APIs are available
        if (typeof chrome === 'undefined') {
            console.error('Chrome extension APIs are not available');
            alert('Error: Chrome extension APIs are not available. Please reload the extension.');
            return;
        }
        
        if (!chrome.storage || !chrome.storage.sync) {
            console.error('Chrome storage API is not available');
            alert('Error: Chrome storage API is not available. Please check extension permissions.');
            return;
        }
        
        chrome.storage.sync.get(['groqApiKey'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading settings:', chrome.runtime.lastError);
            } else if (result.groqApiKey) {
                apiKeyInput.value = result.groqApiKey;
            }
        });
    }
    
    // Save settings to storage
    function saveSettings() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            alert('Vui lòng nhập Groq API Key');
            return;
        }
        
        if (!apiKey.startsWith('gsk_')) {
            alert('API Key không hợp lệ. Groq API Key phải bắt đầu bằng "gsk_"');
            return;
        }
        
        // Check if chrome APIs are available
        if (typeof chrome === 'undefined') {
            alert('Error: Chrome extension APIs are not available. Please reload the extension.');
            return;
        }
        
        if (!chrome.storage || !chrome.storage.sync) {
            alert('Error: Chrome storage API is not available. Please check extension permissions.');
            return;
        }
        
        chrome.storage.sync.set({
            groqApiKey: apiKey
        }, function() {
            if (chrome.runtime.lastError) {
                alert('Lỗi khi lưu cài đặt: ' + chrome.runtime.lastError.message);
            } else {
                showSuccessMessage();
                console.log('API Key đã được lưu thành công');
            }
        });
    }
    
    // Add input validation
    apiKeyInput.addEventListener('input', function() {
        const value = this.value.trim();
        if (value && !value.startsWith('gsk_')) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '#e0e6ed';
        }
    });
});

// Helper function to get API key (can be used by other scripts)
function getApiKey() {
    return new Promise((resolve, reject) => {
        // Check if chrome APIs are available
        if (typeof chrome === 'undefined') {
            reject(new Error('Chrome extension APIs are not available'));
            return;
        }
        
        if (!chrome.storage || !chrome.storage.sync) {
            reject(new Error('Chrome storage API is not available'));
            return;
        }
        
        chrome.storage.sync.get(['groqApiKey'], function(result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result.groqApiKey || null);
            }
        });
    });
}
