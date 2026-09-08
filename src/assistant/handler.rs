use axum::{extract::State, Json};

use crate::{auth::middleware::AuthUser, errors::ApiError, AppState};

use super::model::{
    GeminiContent, GeminiGenerationConfig, GeminiPart, GeminiRequest, GeminiResponse, ParseRequest,
    ParsedTransaction,
};

/// Manipulador para POST /api/v1/assistant/parse
pub async fn parse_text(
    State(state): State<AppState>,
    _user: AuthUser, // Exige autenticação
    Json(payload): Json<ParseRequest>,
) -> Result<Json<ParsedTransaction>, ApiError> {
    let api_key = &state.config.gemini.api_key;
    if api_key == "MISSING_API_KEY" || api_key.is_empty() {
        return Err(ApiError::Internal(anyhow::anyhow!(
            "GEMINI_API_KEY não configurada no servidor."
        )));
    }

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
        api_key.trim()
    );

    let system_prompt = r#"
Você é um extrator de dados financeiros especializado.
Sua tarefa é ler a frase do usuário e extrair os dados de transação retornando estritamente um JSON.
O JSON deve conter:
- "amount": um número float representando o valor (positivo).
- "description": um resumo curto do que foi comprado ou recebido.
- "transaction_type": "income" (se for ganho, receita, venda) ou "expense" (se for gasto, compra, pagamento).
- "profile_type": "business" (se mencionar obra, empresa, mercadoria, cliente, materiais de construção) ou "personal" (se for gasto diário comum, pessoal).

REGRAS RÍGIDAS:
1. Responda APENAS com o JSON.
2. NÃO use markdown (não coloque ```json ou ```). Retorne o texto puro em JSON.
3. Se o valor não for especificado, retorne 0.0.
"#;

    let request_body = GeminiRequest {
        system_instruction: Some(GeminiContent {
            parts: vec![GeminiPart {
                text: system_prompt.to_string(),
            }],
        }),
        contents: vec![GeminiContent {
            parts: vec![GeminiPart { text: payload.text }],
        }],
        generation_config: Some(GeminiGenerationConfig {
            response_mime_type: "application/json".to_string(),
        }),
    };

    // Reutiliza o cliente HTTP compartilhado (connection pooling)
    let res = state
        .http_client
        .post(&url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| ApiError::Internal(anyhow::anyhow!("Erro ao chamar Gemini: {}", e)))?;

    if !res.status().is_success() {
        let err_text = res
            .text()
            .await
            .unwrap_or_else(|_| "Erro desconhecido".to_string());
        tracing::error!("Gemini API erro: {}", err_text);
        return Err(ApiError::Internal(anyhow::anyhow!(
            "A API do Gemini retornou um erro."
        )));
    }

    let gemini_response: GeminiResponse = res
        .json()
        .await
        .map_err(|e| ApiError::Internal(anyhow::anyhow!("Erro ao ler JSON da Gemini: {}", e)))?;

    let text_result = gemini_response
        .candidates
        .and_then(|mut c| c.pop())
        .and_then(|mut content| content.content.parts.pop())
        .map(|p| p.text)
        .ok_or_else(|| {
            ApiError::Internal(anyhow::anyhow!(
                "Resposta da Gemini veio vazia ou inválida."
            ))
        })?;

    // Extrai o JSON de forma robusta: remove markdown fences e localiza o objeto { ... }
    let text_limpo = text_result.replace("```json", "").replace("```", "");
    let json_str =
        extract_json_object(&text_limpo).unwrap_or_else(|| text_limpo.trim().to_string());

    let parsed_tx: ParsedTransaction = serde_json::from_str(&json_str).map_err(|e| {
        tracing::error!(
            "JSON inválido retornado pela IA: {:?} — texto: {}",
            e,
            json_str
        );
        ApiError::Internal(anyhow::anyhow!("JSON inválido retornado pela IA"))
    })?;

    Ok(Json(parsed_tx))
}

/// Extrai o primeiro objeto JSON `{ ... }` encontrado na string,
/// lidando com casos onde o modelo coloca texto extra em volta.
fn extract_json_object(input: &str) -> Option<String> {
    let start = input.find('{')?;
    let mut depth = 0;
    let mut end = start;

    for (i, ch) in input[start..].char_indices() {
        match ch {
            '{' => depth += 1,
            '}' => {
                depth -= 1;
                if depth == 0 {
                    end = start + i;
                    break;
                }
            }
            _ => {}
        }
    }

    if depth == 0 {
        Some(input[start..=end].to_string())
    } else {
        None
    }
}
