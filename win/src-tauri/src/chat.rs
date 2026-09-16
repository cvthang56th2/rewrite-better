use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatRequest {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub prompt: String,
    pub max_tokens: u32,
    pub temperature: Option<f32>,
    pub extras: serde_json::Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProbeRequest {
    pub base_url: String,
    pub api_key: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatError {
    pub status: Option<u16>,
    pub message: String,
    pub code: Option<String>,
}

fn join_url(base_url: &str, path: &str) -> String {
    if base_url.ends_with('/') {
        format!("{base_url}{path}")
    } else {
        format!("{base_url}/{path}")
    }
}

fn completions_url(base_url: &str) -> String {
    join_url(base_url, "chat/completions")
}

fn models_url(base_url: &str) -> String {
    join_url(base_url, "models")
}

fn http_client() -> Result<reqwest::Client, ChatError> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(45))
        .build()
        .map_err(|e| ChatError {
            status: None,
            message: e.to_string(),
            code: Some("network".into()),
        })
}

fn api_error_message(json: &serde_json::Value) -> String {
    json.pointer("/error/message")
        .and_then(|v| v.as_str())
        .or_else(|| json.pointer("/error/status").and_then(|v| v.as_str()))
        .or_else(|| json.pointer("/message").and_then(|v| v.as_str()))
        .unwrap_or("Unknown error")
        .to_string()
}

fn extract_text_value(value: &serde_json::Value) -> Option<String> {
    if let Some(text) = value.as_str() {
        let trimmed = text.trim();
        return (!trimmed.is_empty()).then(|| trimmed.to_string());
    }
    if let Some(parts) = value.as_array() {
        let mut out = String::new();
        for part in parts {
            if let Some(text) = part.as_str() {
                out.push_str(text);
            } else if let Some(text) = part.get("text").and_then(|v| v.as_str()) {
                out.push_str(text);
            } else if let Some(text) = part.pointer("/text").and_then(|v| v.as_str()) {
                out.push_str(text);
            }
        }
        let trimmed = out.trim();
        return (!trimmed.is_empty()).then(|| trimmed.to_string());
    }
    None
}

fn extract_message_content(json: &serde_json::Value) -> Option<String> {
    let message = json.pointer("/choices/0/message")?;
    ["content", "reasoning_content", "reasoning"]
        .iter()
        .find_map(|key| message.get(*key).and_then(extract_text_value))
}

/// Lightweight auth check used by Settings → Test keys.
/// Hits OpenAI-compatible `GET /models` so we don't depend on model/token quirks.
pub async fn probe_api_key(request: ProbeRequest) -> Result<(), ChatError> {
    let client = http_client()?;
    let response = client
        .get(models_url(&request.base_url))
        .header("Content-Type", "application/json")
        .bearer_auth(&request.api_key)
        .send()
        .await
        .map_err(|e| ChatError {
            status: None,
            message: e.to_string(),
            code: Some("network".into()),
        })?;

    let status = response.status();
    let json: serde_json::Value = response.json().await.unwrap_or(serde_json::Value::Null);

    if status.is_success() {
        return Ok(());
    }

    Err(ChatError {
        status: Some(status.as_u16()),
        message: api_error_message(&json),
        code: None,
    })
}

pub async fn chat_completion(request: ChatRequest) -> Result<String, ChatError> {
    let url = completions_url(&request.base_url);
    let mut body = serde_json::json!({
        "model": request.model,
        "messages": [{ "role": "user", "content": request.prompt }],
        "temperature": request.temperature.unwrap_or(0.7),
        "max_tokens": request.max_tokens
    });
    if let Some(obj) = body.as_object_mut() {
        if let Some(extras) = request.extras.as_object() {
            for (key, value) in extras {
                obj.insert(key.clone(), value.clone());
            }
        }
    }

    let client = http_client()?;
    let response = client
        .post(url)
        .header("Content-Type", "application/json")
        .bearer_auth(&request.api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| ChatError {
            status: None,
            message: e.to_string(),
            code: Some("network".into()),
        })?;

    let status = response.status();
    let json: serde_json::Value = response.json().await.map_err(|e| ChatError {
        status: Some(status.as_u16()),
        message: e.to_string(),
        code: Some("network".into()),
    })?;

    if !status.is_success() {
        return Err(ChatError {
            status: Some(status.as_u16()),
            message: api_error_message(&json),
            code: None,
        });
    }

    extract_message_content(&json).ok_or(ChatError {
        status: None,
        message: "empty response".into(),
        code: Some("emptyResponse".into()),
    })
}

impl std::fmt::Display for ChatError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for ChatError {}

#[cfg(test)]
mod tests {
    use super::{completions_url, extract_message_content, models_url};
    use serde_json::json;

    #[test]
    fn joins_trailing_slash() {
        assert_eq!(
            completions_url("https://api.groq.com/openai/v1/"),
            "https://api.groq.com/openai/v1/chat/completions"
        );
        assert_eq!(
            models_url("https://generativelanguage.googleapis.com/v1beta/openai/"),
            "https://generativelanguage.googleapis.com/v1beta/openai/models"
        );
    }

    #[test]
    fn joins_without_slash() {
        assert_eq!(
            completions_url("https://api.groq.com/openai/v1"),
            "https://api.groq.com/openai/v1/chat/completions"
        );
    }

    #[test]
    fn extracts_string_and_array_content() {
        let string_body = json!({
            "choices": [{ "message": { "content": "  OK  " } }]
        });
        assert_eq!(extract_message_content(&string_body).as_deref(), Some("OK"));

        let array_body = json!({
            "choices": [{
                "message": {
                    "content": [
                        { "type": "text", "text": "Hel" },
                        { "type": "text", "text": "lo" }
                    ]
                }
            }]
        });
        assert_eq!(extract_message_content(&array_body).as_deref(), Some("Hello"));
    }
}
