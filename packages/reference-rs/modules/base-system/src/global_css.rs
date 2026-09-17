//! Structured global CSS definition and validation for evaluated design systems.
//! Deserializes ordered `{ source, rules }` fragments into a typed declaration-value IR,
//! preserving selector maps, responsive arrays, null holes, and custom properties.
//! Booleans are restricted to documented dialect macros (currently only `container`),
//! rejecting booleans on standard CSS properties with a path-bearing error.
//! Provides borrow-based iteration over fragments and selectors without cloning.

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use crate::spec::FromJsonError;

/// Documented dialect macros permitted to receive boolean declaration values.
const BOOLEAN_MACROS: &[&str] = &["container"];

/// Declaration values in global CSS: string, finite number, boolean, null, list, or nested node.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum GlobalDeclarationValue {
    String(String),
    Number(serde_json::Number),
    Boolean(bool),
    Null,
    List(Vec<GlobalDeclarationValue>),
    Nested(IndexMap<String, GlobalDeclarationValue>),
}

/// Recursive style node mapping selector/property/condition keys to declaration values.
pub type GlobalStyleNode = IndexMap<String, GlobalDeclarationValue>;

/// One authored global CSS fragment with origin source and selector-keyed rule blocks.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct GlobalCssFragment {
    pub source: String,
    pub rules: IndexMap<String, GlobalStyleNode>,
}

/// Validate all rules in a global CSS fragment against dialect constraints.
pub(crate) fn validate_fragment(fragment: &GlobalCssFragment) -> Result<(), FromJsonError> {
    for (selector, node) in &fragment.rules {
        validate_node(selector, node, &fragment.source)?;
    }
    Ok(())
}

fn validate_node(
    current_path: &str,
    node: &GlobalStyleNode,
    source: &str,
) -> Result<(), FromJsonError> {
    for (key, value) in node {
        let child_path = format!("{current_path}.{key}");
        validate_value(&child_path, key, value, source)?;
    }
    Ok(())
}

fn validate_value(
    path: &str,
    property: &str,
    value: &GlobalDeclarationValue,
    source: &str,
) -> Result<(), FromJsonError> {
    match value {
        GlobalDeclarationValue::Boolean(_) => check_boolean_property(path, property, source),
        GlobalDeclarationValue::List(items) => validate_list(path, property, items, source),
        GlobalDeclarationValue::Nested(children) => validate_node(path, children, source),
        GlobalDeclarationValue::String(_)
        | GlobalDeclarationValue::Number(_)
        | GlobalDeclarationValue::Null => Ok(()),
    }
}

fn check_boolean_property(path: &str, property: &str, source: &str) -> Result<(), FromJsonError> {
    if BOOLEAN_MACROS.contains(&property) {
        return Ok(());
    }
    Err(FromJsonError::InvalidGlobalCss {
        path: path.to_string(),
        source: Some(source.to_string()),
        message: format!(
            "boolean is not allowed on '{property}'; only documented macros accept boolean"
        ),
    })
}

fn validate_list(
    path: &str,
    property: &str,
    items: &[GlobalDeclarationValue],
    source: &str,
) -> Result<(), FromJsonError> {
    for (idx, item) in items.iter().enumerate() {
        let item_path = format!("{path}[{idx}]");
        validate_value(&item_path, property, item, source)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn container_true_is_accepted() {
        let mut rules = IndexMap::new();
        let mut node = IndexMap::new();
        node.insert("container".into(), GlobalDeclarationValue::Boolean(true));
        rules.insert(".container".into(), node);
        let fragment = GlobalCssFragment {
            source: "src/theme/global.ts".into(),
            rules,
        };
        assert!(validate_fragment(&fragment).is_ok());
    }

    #[test]
    fn display_true_is_rejected_with_path() {
        let mut rules = IndexMap::new();
        let mut node = IndexMap::new();
        node.insert("display".into(), GlobalDeclarationValue::Boolean(true));
        rules.insert("body".into(), node);
        let fragment = GlobalCssFragment {
            source: "src/theme/global.ts".into(),
            rules,
        };
        let err = validate_fragment(&fragment).unwrap_err();
        assert!(matches!(
            err,
            FromJsonError::InvalidGlobalCss { ref path, ref source, .. }
                if path == "body.display" && source.as_deref() == Some("src/theme/global.ts")
        ));
    }

    #[test]
    fn nested_selector_boolean_rejected_with_deep_path() {
        let mut rules = IndexMap::new();
        let mut button_node = IndexMap::new();
        let mut focus_node = IndexMap::new();
        focus_node.insert("display".into(), GlobalDeclarationValue::Boolean(false));
        button_node.insert("&:focus".into(), GlobalDeclarationValue::Nested(focus_node));
        rules.insert("button".into(), button_node);
        let fragment = GlobalCssFragment {
            source: "src/theme/button.ts".into(),
            rules,
        };
        let err = validate_fragment(&fragment).unwrap_err();
        assert!(matches!(
            err,
            FromJsonError::InvalidGlobalCss { ref path, .. }
                if path == "button.&:focus.display"
        ));
    }

    #[test]
    fn responsive_array_with_null_holes_accepted() {
        let mut rules = IndexMap::new();
        let mut node = IndexMap::new();
        node.insert(
            "padding".into(),
            GlobalDeclarationValue::List(vec![
                GlobalDeclarationValue::String("1".into()),
                GlobalDeclarationValue::Null,
                GlobalDeclarationValue::String("4".into()),
            ]),
        );
        rules.insert(".responsive-box".into(), node);
        let fragment = GlobalCssFragment {
            source: "src/theme/box.ts".into(),
            rules,
        };
        assert!(validate_fragment(&fragment).is_ok());
    }
}
