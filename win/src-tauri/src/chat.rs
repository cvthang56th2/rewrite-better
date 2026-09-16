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

#[derive(Debug, Serialize)]
pub struct ChatError {
    pub status: Option<u16>,
    pub message: String,
    pub code: Option<String>,
}

fn completions_url(base_url: &str) -> String {
    if base_url.ends_with('/') {
        format!("{base_url}chat/completions")
    } else {
        format!("{base_url}/chat/completions")
    }
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

    let client = reqwest::Client::new();
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
        let message = json
            .pointer("/error/message")
            .and_then(|v| v.as_str())
            .or_else(|| json.pointer("/error/status").and_then(|v| v.as_str()))
            .unwrap_or("Unknown error")
            .to_string();
        return Err(ChatError {
            status: Some(status.as_u16()),
            message,
            code: None,
        });
    }

    let content = json
        .pointer("/choices/0/message/content")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| {
            json.pointer("/choices/0/message/reasoning_content")
                .and_then(|v| v.as_str())
                .map(str::trim)
                .filter(|s| !s.is_empty())
        })
        .or_else(|| {
            json.pointer("/choices/0/message/reasoning")
                .and_then(|v| v.as_str())
                .map(str::trim)
                .filter(|s| !s.is_empty())
        });

    content.map(|s| s.to_string()).ok_or(ChatError {
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
    use super::completions_url;

    #[test]
    fn joins_trailing_slash() {
        assert_eq!(
            completions_url("https://api.groq.com/openai/v1/"),
            "https://api.groq.com/openai/v1/chat/completions"
        );
    }

    #[test]
    fn joins_without_slash() {
        assert_eq!(
            completions_url("https://api.groq.com/openai/v1"),
            "https://api.groq.com/openai/v1/chat/completions"
        );
    }
}
