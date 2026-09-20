//! Analysis telemetry wording: expected lookups and dynamic slots.
//!
//! These sentences exist only on the opt-in compiler channel: an expected
//! exact lookup names the declaration plus its serialized five-tuple, and a
//! dynamic slot names the prop plus the unknown shape. Neither line was ever
//! pushed, so partition renders them fresh without removing anything. Value
//! spellings mirror proof's (bare strings, canonical JSON otherwise).

use super::super::{Diagnostic, DiagnosticCode, DiagnosticLocation, DynamicShape, OwnedLookupKey};
use crate::runtime::serializer::serialize_value;

/// Render one expected exact lookup as compiler-channel telemetry.
pub(crate) fn render_expected(
    key: &OwnedLookupKey,
    location: &DiagnosticLocation,
) -> Diagnostic {
    location.info(
        DiagnosticCode::ExpectedLookup,
        format!(
            "expected runtime lookup `{}:{}` {}",
            key.prop,
            value_spelling(&key.value),
            key.lookup_key(),
        ),
    )
}

/// Render one dynamic slot as compiler-channel telemetry.
pub(crate) fn render_dynamic(
    prop: &str,
    shape: DynamicShape,
    location: &DiagnosticLocation,
) -> Diagnostic {
    location.info(
        DiagnosticCode::DynamicSlot,
        format!(
            "dynamic style slot for prop `{prop}` ({})",
            shape_phrase(shape),
        ),
    )
}

/// The phrase for one unknown key shape.
fn shape_phrase(shape: DynamicShape) -> &'static str {
    match shape {
        DynamicShape::UnknownValue => "unknown value",
        DynamicShape::UnknownProp => "unknown prop",
        DynamicShape::UnknownWhen => "unknown when",
        DynamicShape::Spread => "spread",
    }
}

/// The declaration value as the author wrote it: bare strings, canonical
/// JSON for everything else (mirrors proof's spelling; duplicated so this
/// module never reaches into proof's privates).
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
            when: Vec::new(),
            prop: prop.into(),
            value,
            important: false,
        }
    }

    fn located() -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("a.ts".to_string()),
            line: Some(2),
            column: Some(9),
        }
    }

    #[test]
    fn expected_names_the_declaration_and_its_five_tuple() {
        let rendered = Policy::render_expected(&key("color", serde_json::json!("red")), &located());
        assert_eq!(rendered.code, DiagnosticCode::ExpectedLookup);
        assert_eq!(
            rendered.message,
            "expected runtime lookup `color:red` [\"lib\",[],\"color\",\"red\",false]"
        );
        assert!(rendered.message.contains("color:red"));
        assert_eq!(rendered.file.as_deref(), Some("a.ts"));
        assert_eq!(rendered.line, Some(2));
        assert_eq!(rendered.column, Some(9));
    }

    #[test]
    fn expected_spells_compound_values_canonically() {
        let rendered = Policy::render_expected(
            &key("width", serde_json::json!({"md": "60px", "base": "50px"})),
            &located(),
        );
        assert!(rendered.message.contains("{\"base\":\"50px\",\"md\":\"60px\"}"));
    }

    #[test]
    fn same_key_twice_renders_identical_lines() {
        let first = Policy::render_expected(&key("color", serde_json::json!("red")), &located());
        let second = Policy::render_expected(&key("color", serde_json::json!("red")), &located());
        assert_eq!(first.severity, second.severity);
        assert_eq!(first.code, second.code);
        assert_eq!(first.message, second.message);
    }

    #[test]
    fn dynamic_names_the_prop_and_the_unknown_shape() {
        let cases = [
            (DynamicShape::UnknownValue, "unknown value"),
            (DynamicShape::UnknownProp, "unknown prop"),
            (DynamicShape::UnknownWhen, "unknown when"),
            (DynamicShape::Spread, "spread"),
        ];
        for (shape, phrase) in cases {
            let rendered = Policy::render_dynamic("color", shape, &located());
            assert_eq!(rendered.code, DiagnosticCode::DynamicSlot);
            assert_eq!(
                rendered.message,
                format!("dynamic style slot for prop `color` ({phrase})")
            );
            assert_eq!(rendered.file.as_deref(), Some("a.ts"));
        }
    }
}
