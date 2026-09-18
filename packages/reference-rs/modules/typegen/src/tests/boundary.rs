//! Shared EvaluatedSystemSpec boundary and contract proof tests for packet N5.
//! Verifies that typegen accepts root F0 contract fixtures lowered through base-system.
//! Proves that valid v1 specs emit stable ingredient declarations with deterministic byte equality.
//! Tests that invalid schema versions and unexpected top-level fields fail closed with diagnostics.

use super::assert_alias;
use crate::emit_dts;
use base_system::BaseSystem;

/// N5: EvaluatedSystemSpec positive fixture lowers and emits deterministic declarations.
#[test]
fn typ_native_01_accepts_root_evaluated_system_spec() {
    let system = BaseSystem::from_json(shared::testing::contracts::EVALUATED_SYSTEM_SPEC_JSON)
        .expect("valid evaluated system spec");
    let dts = emit_dts(&system);
    assert_alias(
        &dts,
        "ColorToken",
        "'_private.secret' | 'bg.canvas' | 'blue.500' | 'red.500'",
    );
    assert_alias(&dts, "SpacingToken", "'1' | '2' | '4'");
    assert_alias(&dts, "RadiusToken", "'md' | 'sm'");
    assert!(dts.contains("export interface FontRegistry {"));
    assert!(dts.contains("'sans': { 'bold': true; 'normal': true }"));
    assert!(dts.contains("export type ButtonVariantProps"));
    assert!(dts.contains("export type ButtonCompoundVariant"));
    assert!(dts.contains("export type StyleConditionKey = "));
    assert!(dts.contains("@sm"));
    assert!(dts.contains("_hover"));
    assert!(dts.contains("export type StyleProps = FontProps & {"));
    assert!(dts.contains("export type SystemStyleObject = StyleProps & {"));
    assert_eq!(dts, emit_dts(&system));
}

/// N5: token-light fixture emits stable empty aliases (never, {}) and omits recipes.
#[test]
fn typ_native_01_accepts_token_light_spec() {
    let system =
        BaseSystem::from_json(shared::testing::contracts::EVALUATED_SYSTEM_SPEC_TOKEN_LIGHT_JSON)
            .expect("valid token-light spec");
    let dts = emit_dts(&system);
    assert_alias(&dts, "ColorToken", "never");
    assert_alias(&dts, "SpacingToken", "never");
    assert_alias(&dts, "RadiusToken", "'sm'");
    assert!(dts.contains("export interface FontRegistry {}"));
    assert!(dts.contains("export type StyleConditionKey = "));
    assert!(dts.contains("export type StyleProps = FontProps & {"));
    assert!(dts.contains("export type SystemStyleObject = StyleProps & {"));
    assert!(!dts.contains("VariantProps"));
    assert!(!dts.contains("CompoundVariant"));
}

/// N5: empty system with reference-ui profile emits Core aliases and style surface.
#[test]
fn typ_native_01_empty_system_emits_core_aliases_and_styles() {
    let empty_json = r#"{"schemaVersion":1,"profile":"reference-ui","name":"empty","tokens":{},"fonts":{},"globalCss":[],"keyframes":{},"recipes":{},"staticCss":{},"provenance":[]}"#;
    let system = BaseSystem::from_json(empty_json).expect("valid empty spec");
    let dts = emit_dts(&system);
    assert_alias(&dts, "ColorToken", "never");
    assert_alias(&dts, "SpacingToken", "never");
    assert_alias(&dts, "RadiusToken", "never");
    assert!(dts.contains("export interface FontRegistry {}"));
    assert!(dts.contains("export type StyleConditionKey = "));
    assert!(dts.contains("export type StyleProps = FontProps & {"));
    assert!(dts.contains("export type SystemStyleObject = StyleProps & {"));
    assert!(!dts.contains("VariantProps"));
}

/// N5: invalid schema version fails closed with descriptive error.
#[test]
fn typ_native_01_rejects_invalid_schema_version() {
    let err = BaseSystem::from_json(
        shared::testing::contracts::EVALUATED_SYSTEM_SPEC_INVALID_VERSION_JSON,
    )
    .unwrap_err();
    assert!(err.to_string().contains("unsupported schema version"));
}

/// N5: unknown top-level field fails closed with parse error.
#[test]
fn typ_native_01_rejects_unknown_top_level_field() {
    let err =
        BaseSystem::from_json(shared::testing::contracts::EVALUATED_SYSTEM_SPEC_UNKNOWN_FIELD_JSON)
            .unwrap_err();
    assert!(err.to_string().contains("unknown field"));
}
