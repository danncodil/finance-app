use serde::{Deserialize, Serialize};

/// Payload recebido do frontend
#[derive(Debug, Deserialize)]
pub struct ParseRequest {
    pub text: String,
}

/// A resposta esperada que o Gemini deve nos devolver em JSON estruturado
#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedTransaction {
    pub amount: f64,
    pub description: String,
    pub transaction_type: String, // "income" ou "expense"
    pub profile_type: String,     // "personal" ou "business"
}

// ── Estruturas para a API do Gemini ───────────────────────────────

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeminiRequest {
    pub contents: Vec<GeminiContent>,
    pub system_instruction: Option<GeminiContent>,
    pub generation_config: Option<GeminiGenerationConfig>,
}

#[derive(Debug, Serialize)]
pub struct GeminiContent {
    pub parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize)]
pub struct GeminiPart {
    pub text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeminiGenerationConfig {
    pub response_mime_type: String,
}

// Resposta do Gemini
#[derive(Debug, Deserialize)]
pub struct GeminiResponse {
    pub candidates: Option<Vec<GeminiCandidate>>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiCandidate {
    pub content: GeminiCandidateContent,
}

#[derive(Debug, Deserialize)]
pub struct GeminiCandidateContent {
    pub parts: Vec<GeminiCandidatePart>,
}

#[derive(Debug, Deserialize)]
pub struct GeminiCandidatePart {
    pub text: String,
}
