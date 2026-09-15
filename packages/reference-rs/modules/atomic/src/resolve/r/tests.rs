//! Unit tests for `r` key lowering: numeric keys, named tokens, mixed tables, and named containers.
//! Unknown names return None. Defaults are CSS-generic (`sm` → 640px), not a baked lib theme.

use super::*;
use crate::config::{BreakpointConfig, BreakpointScale};
use indexmap::IndexMap;

#[test]
fn test_numeric_keys() {
    let scale = BreakpointScale::default_scale();
    assert_eq!(
        lower_r_key("300", &scale).as_deref(),
        Some("@container (min-width: 300px)")
    );
    assert_eq!(
        lower_r_key("768", &scale).as_deref(),
        Some("@container (min-width: 768px)")
    );
}

#[test]
fn test_named_keys_from_default_scale() {
    let scale = BreakpointScale::default_scale();
    assert_eq!(
        lower_r_key("sm", &scale).as_deref(),
        Some("@container (min-width: 640px)")
    );
    assert_eq!(
        lower_r_key("md", &scale).as_deref(),
        Some("@container (min-width: 768px)")
    );
}

#[test]
fn test_named_and_numeric_mix() {
    let mut map = IndexMap::new();
    map.insert("md".to_string(), serde_json::json!("768px"));
    let scale = BreakpointScale::from_config(&BreakpointConfig::Map(map));
    assert_eq!(
        lower_r_key("md", &scale).as_deref(),
        Some("@container (min-width: 768px)")
    );
    assert_eq!(
        lower_r_key("1280", &scale).as_deref(),
        Some("@container (min-width: 1280px)")
    );
}

#[test]
fn test_unknown_named_key_is_none() {
    let scale = BreakpointScale::default_scale();
    assert_eq!(lower_r_key("wat", &scale), None);
}

#[test]
fn test_named_container() {
    let scale = BreakpointScale::default_scale();
    assert_eq!(
        lower_r_key_named("md", &scale, "card").as_deref(),
        Some("@container card (min-width: 768px)")
    );
}

#[test]
fn test_custom_token_widths() {
    let mut map = IndexMap::new();
    map.insert("wide".to_string(), serde_json::json!("1200px"));
    let scale = BreakpointScale::from_config(&BreakpointConfig::Map(map));
    assert_eq!(
        lower_r_key("wide", &scale).as_deref(),
        Some("@container (min-width: 1200px)")
    );
}
