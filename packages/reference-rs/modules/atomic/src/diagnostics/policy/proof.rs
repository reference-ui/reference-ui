//! Final-plan proof wording: one sentence per proven miss.
//!
//! A proof warning names only what the join proved: the exact absent
//! declaration. When a resolver fact proves the cause, its legacy sentence
//! rides along as the actionable reason; proof never guesses from syntax.
//! Reason-carrying warnings keep the resolver's code, so wire values stay
//! stable; causeless misses take `MissingStylePlan`, the one new code.

use super::super::{Diagnostic, DiagnosticCode, DiagnosticLocation, OwnedLookupKey};
use crate::runtime::serializer::serialize_value;

/// Render one proven miss with its resolver cause: the exact declaration
/// plus the legacy sentence that proves why the plan is missing.
pub fn render_proof(
    key: &OwnedLookupKey,
    location: &DiagnosticLocation,
    code: DiagnosticCode,
    reason: &str,
) -> Diagnostic {
    location.warning(code, proof_sentence(key, reason))
}

/// Render one proven miss with no resolver cause. Unlocated: no source
/// catalog maps analysis sites back to positions yet, so proof stays
/// honest about what it cannot place.
pub fn render_causeless(key: &OwnedLookupKey) -> Diagnostic {
    Diagnostic::warning(
        DiagnosticCode::MissingStylePlan,
        causeless_sentence(key),
    )
}

/// The sentence for one absent declaration plus its proven reason.
fn proof_sentence(key: &OwnedLookupKey, reason: &str) -> String {
    format!(
        "`{}: {}` has no compiled style plan; this lookup will emit no class. {reason}",
        key.prop,
        value_spelling(&key.value),
    )
}

/// The sentence for one absent declaration with no proven cause.
fn causeless_sentence(key: &OwnedLookupKey) -> String {
    format!(
        "`{}: {}` has no compiled style plan; this lookup will emit no class",
        key.prop,
        value_spelling(&key.value),
    )
}

/// The declaration value as the author wrote it: bare strings, canonical
/// JSON for everything else (numbers, booleans, responsive shapes).
fn value_spelling(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(text) => text.to_string(),
        other => serialize_value(other),
    }
}

#[cfg(test)]
mod tests {
    use super::super::Policy;
    use super::*;

    fn key(prop: &str, value: serde_json::Value) -> OwnedLookupKey {
        OwnedLookupKey {
            system: "lib".into(),
            when: vec!["_hovr".into()],
            prop: prop.into(),
            value,
            important: false,
        }
    }

    fn located() -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("absent.ts".to_string()),
            line: Some(4),
            column: Some(19),
        }
    }

    #[test]
    fn proof_names_the_declaration_and_keeps_code_and_site() {
        let rendered = Policy::render_proof(
            &key("color", serde_json::json!("red.500")),
            &located(),
            DiagnosticCode::UnknownCondition,
            "Unknown condition \"_hovr\"",
        );
        assert!(rendered.message.contains("color"));
        assert!(rendered.message.contains("red.500"));
        assert!(rendered.message.contains("Unknown condition \"_hovr\""));
        assert_eq!(rendered.code, DiagnosticCode::UnknownCondition);
        assert_eq!(rendered.file.as_deref(), Some("absent.ts"));
        assert_eq!(rendered.line, Some(4));
        assert_eq!(rendered.column, Some(19));
    }

    #[test]
    fn proof_spells_compound_values_canonically() {
        let rendered = Policy::render_proof(
            &key("width", serde_json::json!({"md": "60px", "base": "50px"})),
            &located(),
            DiagnosticCode::UnknownProperty,
            "Unknown style property \"width\"",
        );
        assert!(
            rendered.message.contains("{\"base\":\"50px\",\"md\":\"60px\"}"),
            "unexpected: {}",
            rendered.message
        );
    }

    #[test]
    fn causeless_names_the_declaration_without_a_reason() {
        let rendered = Policy::render_causeless(&key("color", serde_json::json!("red")));
        assert_eq!(rendered.code, DiagnosticCode::MissingStylePlan);
        assert!(rendered.message.contains("color"));
        assert!(rendered.message.contains("red"));
        assert!(rendered.file.is_none());
    }
}
