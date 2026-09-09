use serde::{Deserialize, Deserializer};

/// Distinguishes an omitted field from an explicit JSON null in partial updates.
pub fn nullable<'de, D, T>(deserializer: D) -> Result<Option<Option<T>>, D::Error>
where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
{
    Option::<T>::deserialize(deserializer).map(Some)
}

#[cfg(test)]
mod tests {
    use crate::{
        categories::model::{CategoryProfileParams, CreateCategoryDto, TransactionType},
        goals::model::UpdateGoalDto,
        goals::model::{CreateGoalDto, GoalProfileParams},
        projects::model::UpdateProjectDto,
        reports::model::SummaryQueryParams,
        transactions::model::{ListTransactionsParams, ProfileType, UpdateTransactionDto},
    };
    use serde_json::json;

    #[test]
    fn nullable_updates_preserve_omitted_fields_and_clear_nulls() {
        let omitted: UpdateProjectDto = serde_json::from_value(json!({})).unwrap();
        let cleared: UpdateProjectDto =
            serde_json::from_value(json!({"description": null, "budget": null})).unwrap();
        assert_eq!(omitted.description, None);
        assert_eq!(omitted.budget, None);
        assert_eq!(cleared.description, Some(None));
        assert_eq!(cleared.budget, Some(None));
        let goal: UpdateGoalDto = serde_json::from_value(json!({"deadline": null})).unwrap();
        assert_eq!(goal.deadline, Some(None));
        let tx: UpdateTransactionDto = serde_json::from_value(json!({"project_id": null})).unwrap();
        assert_eq!(tx.project_id, Some(None));
    }

    #[test]
    fn both_profile_parameter_names_are_supported() {
        for key in ["profile", "profile_type"] {
            let params: ListTransactionsParams =
                serde_json::from_value(json!({key: "business"})).unwrap();
            assert_eq!(params.profile, Some(ProfileType::Business));
        }
    }

    #[test]
    fn profile_scoped_payloads_and_queries_deserialize() {
        let category: CreateCategoryDto = serde_json::from_value(json!({
            "name": "Clientes", "type": "income", "color": "#123456", "profile_type": "business"
        }))
        .unwrap();
        assert_eq!(category.profile_type, Some(ProfileType::Business));
        assert_eq!(category.r#type, TransactionType::Income);

        let goal: CreateGoalDto = serde_json::from_value(json!({
            "title": "Capital de giro", "target_amount": "100", "profile_type": "business"
        }))
        .unwrap();
        assert_eq!(goal.profile_type, Some(ProfileType::Business));

        let category_params: CategoryProfileParams =
            serde_json::from_value(json!({"profile_type": "business"})).unwrap();
        let goal_params: GoalProfileParams =
            serde_json::from_value(json!({"profile_type": "business"})).unwrap();
        let report_params: SummaryQueryParams =
            serde_json::from_value(json!({"profile": "business"})).unwrap();
        assert_eq!(category_params.profile_type, Some(ProfileType::Business));
        assert_eq!(goal_params.profile_type, Some(ProfileType::Business));
        assert_eq!(report_params.profile_type, Some(ProfileType::Business));
    }
}
