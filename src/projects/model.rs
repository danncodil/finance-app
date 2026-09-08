use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

// ── Enums ────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, Copy, PartialEq, Eq)]
#[sqlx(type_name = "project_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    Active,
    Completed,
    Paused,
    Cancelled,
}

// ── DTOs ─────────────────────────────────────────────────────

/// Representa um projeto retornado pela API.
#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProjectDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub budget: Option<Decimal>,
    pub status: ProjectStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Payload para criação de um projeto.
#[derive(Debug, Deserialize, Validate)]
pub struct CreateProjectDto {
    #[validate(length(
        min = 1,
        max = 255,
        message = "O nome deve ter entre 1 e 255 caracteres"
    ))]
    pub name: String,

    pub description: Option<String>,

    pub budget: Option<Decimal>,

    pub status: Option<ProjectStatus>,
}

/// Payload para atualização parcial de um projeto.
#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProjectDto {
    #[validate(length(
        min = 1,
        max = 255,
        message = "O nome deve ter entre 1 e 255 caracteres"
    ))]
    pub name: Option<String>,

    #[serde(default, deserialize_with = "crate::patch::nullable")]
    pub description: Option<Option<String>>,

    #[serde(default, deserialize_with = "crate::patch::nullable")]
    pub budget: Option<Option<Decimal>>,

    pub status: Option<ProjectStatus>,
}

/// Query params para listagem de projetos.
#[derive(Debug, Deserialize)]
pub struct ListProjectsParams {
    pub status: Option<ProjectStatus>,
}
