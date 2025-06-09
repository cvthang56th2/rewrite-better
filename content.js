let currentPopup = null;
let mousePosition = { x: 0, y: 0 };
let clickOutsideListener = null;

// Function to clean up popup
function closePopup() {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }
  if (clickOutsideListener) {
    document.removeEventListener('click', clickOutsideListener);
    clickOutsideListener = null;
  }
}

// Lắng nghe vị trí chuột để lưu tọa độ
document.addEventListener('contextmenu', (e) => {
  mousePosition.x = e.pageX;
  mousePosition.y = e.pageY;
});

// Lắng nghe message từ background script
window.addEventListener('message', (event) => {
  if (event.data.type === 'REWRITE_BETTER_SHOW_POPUP') {
    showInlinePopup(event.data.selectedText);
  }
});

// Additional keyboard shortcut listener for direct key combination
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
    e.preventDefault();
    
    // Get selected text
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Set mouse position to center of viewport if not set from context menu
    if (mousePosition.x === 0 && mousePosition.y === 0) {
      mousePosition.x = window.innerWidth / 2;
      mousePosition.y = window.innerHeight / 2;
    }
    
    showInlinePopup(selectedText);
  }
  
  // ESC key to close popup
  if (e.key === 'Escape' && currentPopup) {
    e.preventDefault();
    closePopup();
  }
});

function showInlinePopup(selectedText) {
  // Xóa popup cũ nếu có
  closePopup();

  // Tạo popup container
  const popup = document.createElement('div');
  popup.id = 'rewrite-better-popup';
  popup.style.cssText = `
    position: fixed;
    top: ${mousePosition.y + 10}px;
    left: ${mousePosition.x}px;
    width: 350px;
    max-height: 500px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
  `;

  // HTML content cho popup
  popup.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid #eee; background: #f8f9fa; flex-shrink: 0;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; color: #333; font-size: 16px;">Rewrite Better</h3>
        <button id="closePopup" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">&times;</button>
      </div>
    </div>
    
    <div style="padding: 16px; flex: 1; overflow-y: auto;">
      <textarea id="popupInput" style="width: 100%; height: 80px; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 14px; resize: vertical; box-sizing: border-box;" placeholder="Your text will appear here... (Alt+Enter hoặc Option+Enter để submit)">${selectedText}</textarea>
      
      <div style="margin: 12px 0;">
        <select id="popupTone" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
          <option value="friendly">Friendly</option>
          <option value="professional">Professional</option>
          <option value="concise">Concise</option>
          <option value="persuasive">Persuasive</option>
          <option value="casual">Casual</option>
        </select>
      </div>
      
      <button id="popupRewrite" style="width: 100%; padding: 10px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-bottom: 8px; box-sizing: border-box;">
        Rewrite with Groq AI
      </button>
      
      <div id="popupResult" style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 4px; display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong>Rewritten Text:</strong>
          <button id="popupCopy" style="background: #28a745; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Copy</button>
        </div>
        <div id="popupResultText" style="line-height: 1.5; max-height: 200px; overflow-y: auto; word-wrap: break-word;"></div>
      </div>
      
      <div id="popupLoading" style="text-align: center; padding: 20px; display: none;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #007acc; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="margin-top: 8px;">Processing...</div>
      </div>
    </div>
  `;

  // Thêm CSS animation cho loading spinner
  if (!document.getElementById('rewrite-better-styles')) {
    const style = document.createElement('style');
    style.id = 'rewrite-better-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(popup);
  currentPopup = popup;

  // Đảm bảo popup không bị cắt khỏi màn hình
  const rect = popup.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    popup.style.left = (mousePosition.x - rect.width) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    popup.style.top = (mousePosition.y - rect.height - 10) + 'px';
  }

  // Event listeners
  document.getElementById('closePopup').addEventListener('click', closePopup);

  // Add keyboard shortcut listener for Control+Enter or Command+Enter in popup textarea
  document.getElementById('popupInput').addEventListener('keydown', function(event) {
    // Check for Control+Enter (Windows) or Option+Enter (macOS)
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault(); // Prevent default behavior (new line)
      
      // Trigger the rewrite button click
      const rewriteButton = document.getElementById('popupRewrite');
      if (!rewriteButton.disabled) {
        rewriteButton.click();
      }
    }
  });

  document.getElementById('popupRewrite').addEventListener('click', async () => {
    const input = document.getElementById('popupInput').value;
    const model = 'llama-3.1-8b-instant'; // Hardcoded model
    const tone = document.getElementById('popupTone').value;
    
    if (!input.trim()) {
      alert('Please enter some text to rewrite.');
      return;
    }

    // Hiển thị loading
    document.getElementById('popupLoading').style.display = 'block';
    document.getElementById('popupResult').style.display = 'none';
    document.getElementById('popupRewrite').disabled = true;

    try {
      const result = await rewriteText(input, model, tone);
      document.getElementById('popupResultText').textContent = result;
      document.getElementById('popupResult').style.display = 'block';
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      document.getElementById('popupLoading').style.display = 'none';
      document.getElementById('popupRewrite').disabled = false;
    }
  });

  document.getElementById('popupCopy').addEventListener('click', () => {
    const resultText = document.getElementById('popupResultText').textContent;
    navigator.clipboard.writeText(resultText).then(() => {
      const copyBtn = document.getElementById('popupCopy');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = '#28a745';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#28a745';
      }, 2000);
    });
  });

  // Đóng popup khi click bên ngoài (delay để tránh trigger ngay lập tức)
  setTimeout(() => {
    const closeOnClickOutside = (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
        currentPopup = null;
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 100);
}

async function rewriteText(text, model, tone) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['groqApiKey'], async (result) => {
      if (!result.groqApiKey) {
        reject(new Error('Please set your Groq API key in the extension options.'));
        return;
      }

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are a helpful writing assistant. Rewrite the given text in a ${tone} tone. Keep the meaning intact but improve clarity, grammar, and style. Only return the rewritten text without any explanations or additional comments.`
              },
              {
                role: 'user',
                content: text
              }
            ],
            model: model,
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        resolve(data.choices[0].message.content.trim());
      } catch (error) {
        reject(error);
      }
    });
  });
}
