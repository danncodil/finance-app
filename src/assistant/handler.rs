use axum::{extract::State, Json};
use reqwest::Client;

use crate::{
    auth::middleware::AuthUser,
    errors::ApiError,
    AppState,
};

use super::model::{
    GeminiContent, GeminiGenerationConfig, GeminiPart, GeminiRequest, GeminiResponse,
    ParseRequest, ParsedTransaction,
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
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={}",
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

    let client = Client::new();
    let res = client
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
            ApiError::Internal(anyhow::anyhow!("Resposta da Gemini veio vazia ou inválida."))
        })?;

// Deserializa o retorno direto para o struct do model
    let text_limpo = text_result.replace("```json", "").replace("```", "");
    let parsed_tx: ParsedTransaction = serde_json::from_str(text_limpo.trim())
        .map_err(|_| ApiError::Internal(anyhow::anyhow!("JSON inválido retornado pela IA")))?;

    Ok(Json(parsed_tx))
}