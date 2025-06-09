// Check API key status on page load
document.addEventListener('DOMContentLoaded', async function() {
  await checkApiKeyStatus();
  await loadDefaultModel();
});

// Load default model selection
async function loadDefaultModel() {
  try {
    const savedModel = await getSelectedModel();
    const modelSelect = document.getElementById("model");
    if (modelSelect && savedModel) {
      modelSelect.value = savedModel;
    }
  } catch (error) {
    console.error('Error loading default model:', error);
  }
}

// Settings button handler
document.getElementById("settingsBtn").addEventListener("click", function() {
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
});

// Model selector change handler
document.getElementById("model").addEventListener("change", function() {
  const selectedModel = this.value;
  chrome.storage.sync.set({ selectedModel: selectedModel });
});

// Copy button handler
document.getElementById("copyBtn").addEventListener("click", async function() {
  const resultDiv = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");
  
  if (!resultDiv.innerText.trim()) {
    return;
  }
  
  try {
    await navigator.clipboard.writeText(resultDiv.innerText);
    
    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "✅ Đã sao chép!";
    copyBtn.classList.add("copied");
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove("copied");
    }, 2000);
    
  } catch (error) {
    console.error('Failed to copy text:', error);
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = resultDiv.innerText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "✅ Đã sao chép!";
    copyBtn.classList.add("copied");
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove("copied");
    }, 2000);
  }
});

// Check and display API key status
async function checkApiKeyStatus() {
  const apiStatus = document.getElementById('apiStatus');
  
  try {
    const apiKey = await getApiKey();
    
    if (apiKey && apiKey.startsWith('gsk_')) {
      // Test API key validity
      const isValid = await testApiKey();
      
      if (isValid) {
        apiStatus.textContent = '';
        apiStatus.innerHTML = '<span>✅ Groq API Key hoạt động bình thường</span>';
        apiStatus.className = 'api-status success';
      } else {
        apiStatus.textContent = '';
        apiStatus.innerHTML = '<span>⚠️ API Key có vấn đề. </span><a href="#" id="configureLink">Kiểm tra lại</a>';
        apiStatus.className = 'api-status warning';
        setTimeout(() => {
          const configureLink = document.getElementById('configureLink');
          if (configureLink) {
            configureLink.addEventListener('click', function(e) {
              e.preventDefault();
              chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
            });
          }
        }, 100);
      }
    } else {
      apiStatus.textContent = '';
      apiStatus.innerHTML = '<span>⚠️ Chưa cấu hình Groq API Key. </span><a href="#" id="configureLink">Cấu hình ngay</a>';
      apiStatus.className = 'api-status warning';
      
      // Add click handler for configure link
      setTimeout(() => {
        const configureLink = document.getElementById('configureLink');
        if (configureLink) {
          configureLink.addEventListener('click', function(e) {
            e.preventDefault();
            chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
          });
        }
      }, 100);
    }
  } catch (error) {
    apiStatus.textContent = '';
    apiStatus.innerHTML = '<span>❌ Lỗi kiểm tra API Key</span>';
    apiStatus.className = 'api-status error';
  }
}

// Get API key from storage
function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['groqApiKey'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.groqApiKey || null);
      }
    });
  });
}

// Get selected model from storage or use default
function getSelectedModel() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['selectedModel'], function(result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.selectedModel || 'llama-3.1-70b-versatile');
      }
    });
  });
}

document.getElementById("rewrite").addEventListener("click", async () => {
  const input = document.getElementById("input").value;
  const tone = document.getElementById("tone").value;
  const model = document.getElementById("model").value;
  const resultDiv = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");
  
  // Hide copy button initially
  copyBtn.style.display = "none";
  
  // Check if input is empty
  if (!input.trim()) {
    resultDiv.innerHTML = "❌ Vui lòng nhập văn bản cần viết lại.";
    return;
  }
  
  // Get API key
  let apiKey;
  try {
    apiKey = await getApiKey();
  } catch (error) {
    resultDiv.innerHTML = "❌ Lỗi truy cập cài đặt.";
    copyBtn.style.display = "none";
    return;
  }
  
  if (!apiKey) {
    resultDiv.innerHTML = "❌ Chưa cấu hình Groq API Key. Vui lòng vào Cài đặt để nhập API Key.";
    copyBtn.style.display = "none";
    return;
  }
  
  resultDiv.innerHTML = "⏳ Đang xử lý...";
  
  const prompt = `Rewrite the following text in a ${tone} tone. Return only the rewritten text without any additional comments or explanations:\n\n${input}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);
      
      let errorMessage = "❌ Lỗi Groq API: ";
      switch (response.status) {
        case 401:
          errorMessage += "API Key không hợp lệ hoặc đã hết hạn.";
          break;
        case 403:
          errorMessage += "Không có quyền truy cập API.";
          break;
        case 429:
          errorMessage += "Đã vượt quá giới hạn requests. Vui lòng thử lại sau.";
          break;
        case 500:
        case 502:
        case 503:
          errorMessage += "Lỗi server Groq. Vui lòng thử lại sau.";
          break;
        default:
          errorMessage += `HTTP ${response.status} - ${errorData?.error?.message || 'Lỗi không xác định'}`;
      }
      
      resultDiv.innerHTML = errorMessage;
      copyBtn.style.display = "none";
      return;
    }

    const data = await response.json();
    const rewritten = data.choices?.[0]?.message?.content || "❌ Không thể tạo văn bản viết lại.";

    resultDiv.innerText = rewritten;
    
    // Show copy button if content was successfully generated
    if (rewritten && !rewritten.startsWith("❌")) {
      copyBtn.style.display = "block";
    }
  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = "❌ ";
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage += "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.";
    } else if (error.message.includes('JSON')) {
      errorMessage += "Lỗi phân tích phản hồi từ API.";
    } else {
      errorMessage += `Lỗi: ${error.message}`;
    }
    
    resultDiv.innerHTML = errorMessage;
    copyBtn.style.display = "none";
  }
});

// Debug function to test API key
async function testApiKey() {
  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.log('❌ No API key found');
      return false;
    }
    
    console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
    
    // Test with a simple request
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Groq API Key is valid');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Groq API Key test failed:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing API key:', error);
    return false;
  }
}
