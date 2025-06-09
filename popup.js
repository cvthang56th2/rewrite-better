// Check API key status on page load
document.addEventListener('DOMContentLoaded', async function() {
  await checkApiKeyStatus();
  
  // Focus on input and scroll to bottom
  const inputTextarea = document.getElementById("input");
  inputTextarea.focus();
  
  // Add keyboard shortcut listener for Alt+Enter or Option+Enter
  inputTextarea.addEventListener("keydown", function(event) {
    // Check for Control+Enter (Windows) or Command+Enter (macOS)
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault(); // Prevent default behavior (new line)
      
      // Trigger the process button click
      const processButton = document.getElementById("processBtn");
      processButton.click();
    }
  });
  
  // Handle mode switching
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const rewriteOptions = document.getElementById('rewriteOptions');
  const formatOptions = document.getElementById('formatOptions');
  const processBtn = document.getElementById('processBtn');
  
  modeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'rewrite') {
        rewriteOptions.style.display = 'block';
        formatOptions.style.display = 'none';
        processBtn.textContent = 'Rewrite with Groq AI';
      } else if (this.value === 'format') {
        rewriteOptions.style.display = 'none';
        formatOptions.style.display = 'block';
        processBtn.textContent = 'Format Document';
      }
    });
  });
  
  // Handle translation checkbox
  const enableTranslateCheckbox = document.getElementById('enableTranslate');
  const translateOptions = document.getElementById('translateOptions');
  
  if (enableTranslateCheckbox && translateOptions) {
    enableTranslateCheckbox.addEventListener('change', function() {
      if (this.checked) {
        translateOptions.style.display = 'block';
      } else {
        translateOptions.style.display = 'none';
      }
    });
  }
});

// Settings button handler
document.getElementById("settingsBtn").addEventListener("click", function() {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    alert('Chrome extension APIs are not available. Please reload the extension.');
    return;
  }
  chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
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
    // Check if chrome APIs are available
    if (typeof chrome === 'undefined') {
      reject(new Error('Chrome extension APIs are not available. Please make sure the extension is properly loaded.'));
      return;
    }
    
    if (!chrome.storage) {
      reject(new Error('Chrome storage API is not available. Please check extension permissions.'));
      return;
    }
    
    if (!chrome.storage.sync) {
      reject(new Error('Chrome storage.sync API is not available. Please check extension permissions.'));
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

document.getElementById("processBtn").addEventListener("click", async () => {
  const input = document.getElementById("input").value;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const resultDiv = document.getElementById("result");
  const copyBtn = document.getElementById("copyBtn");
  
  // Hide copy button initially
  copyBtn.style.display = "none";
  
  // Check if input is empty
  if (!input.trim()) {
    resultDiv.innerHTML = "❌ Vui lòng nhập văn bản cần xử lý.";
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
  
  let prompt;
  if (mode === 'rewrite') {
    const tone = document.getElementById("tone").value;
    const enableTranslate = document.getElementById("enableTranslate").checked;
    
    if (enableTranslate) {
      const fromLanguage = document.getElementById("fromLanguage").value;
      const toLanguage = document.getElementById("toLanguage").value;
      
      // Create language mapping for better prompts
      const languageNames = {
        'auto': 'automatically detected language',
        'en': 'English',
        'vi': 'Vietnamese',
        'zh': 'Chinese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'th': 'Thai'
      };
      
      const fromLangName = languageNames[fromLanguage] || fromLanguage;
      const toLangName = languageNames[toLanguage] || toLanguage;
      
      if (fromLanguage === 'auto') {
        prompt = `First, translate the following text to ${toLangName}, then rewrite it in a ${tone} tone. The output should be in ${toLangName} and maintain a ${tone} style. Return only the final rewritten text without any explanations:\n\n${input}`;
      } else {
        prompt = `First, translate the following text from ${fromLangName} to ${toLangName}, then rewrite it in a ${tone} tone. The output should be in ${toLangName} and maintain a ${tone} style. Return only the final rewritten text without any explanations:\n\n${input}`;
      }
    } else {
      prompt = `Rewrite the following text in a ${tone} tone. Return only the rewritten text without any additional comments or explanations:\n\n${input}`;
    }
  } else if (mode === 'format') {
    const formatType = document.getElementById("formatType").value;
    prompt = getFormatPrompt(formatType, input);
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
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
    const processedText = data.choices?.[0]?.message?.content || "❌ Không thể xử lý văn bản.";

    resultDiv.innerText = processedText;
    
    // Show copy button if content was successfully generated
    if (processedText && !processedText.startsWith("❌")) {
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

// Function to generate format prompts
function getFormatPrompt(formatType, input) {
  const formatPrompts = {
    'markdown': `Convert the following text to well-structured Markdown format with appropriate headers, lists, emphasis, and formatting. Return only the formatted Markdown:\n\n${input}`,
    
    'html': `Convert the following text to clean, semantic HTML with appropriate tags, headings, paragraphs, and lists. Return only the HTML code:\n\n${input}`,
    
    'bullet-points': `Convert the following text into clear, concise bullet points. Organize the information hierarchically with main points and sub-points where appropriate. Return only the bullet points:\n\n${input}`,
    
    'numbered-list': `Convert the following text into a well-organized numbered list. Use hierarchical numbering (1, 2, 3, then a, b, c, etc.) where appropriate. Return only the numbered list:\n\n${input}`,
    
    'table': `Convert the following text into a well-formatted table. Identify the key information and organize it into appropriate columns and rows. Use markdown table format. Return only the table:\n\n${input}`,
    
    'outline': `Convert the following text into a detailed outline format with main topics, subtopics, and supporting details. Use standard outline formatting (I, A, 1, a, etc.). Return only the outline:\n\n${input}`,
    
    'summary': `Convert the following text into a professional executive summary with key points, main findings, and actionable insights. Keep it concise but comprehensive. Return only the summary:\n\n${input}`,
    
    'faq': `Convert the following text into a FAQ (Frequently Asked Questions) format. Extract key information and present it as questions and answers. Return only the FAQ:\n\n${input}`
  };
  
  return formatPrompts[formatType] || formatPrompts['bullet-points'];
}

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
