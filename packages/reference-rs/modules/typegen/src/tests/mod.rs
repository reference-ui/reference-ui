//! Shared spec fixtures and golden helpers for typegen Cargo proof.
//! Nested JSON is lowered through `from_json`. Goldens compare the full
//! `emit_dts` string and refresh only when `TYPEGEN_UPDATE_GOLDENS=1` is set.
//! Empty token categories and recipes are omitted, not `never`. Strict
//! wrappers are printer options on `emit_dts_with`, not spec fields.

use crate::{emit_dts, emit_dts_with, EmitOptions};
use base_system::BaseSystem;
use std::fs;
use std::path::PathBuf;

mod boundary;
mod fixtures;
mod fonts;
mod forbid;
mod goldens;
mod recipes;
mod strict;
mod style;
mod tokens;

use fixtures::{CATALOG_JSON, COMPOUND_JSON, FONT_JSON, RECIPE_JSON, TWO_RECIPE_JSON};

fn catalog_system() -> BaseSystem {
    parse_dump(CATALOG_JSON, "catalog")
}

fn recipe_system() -> BaseSystem {
    parse_dump(RECIPE_JSON, "recipe")
}

fn compound_system() -> BaseSystem {
    parse_dump(COMPOUND_JSON, "compound")
}

fn font_system() -> BaseSystem {
    parse_dump(FONT_JSON, "font")
}

fn two_recipe_system() -> BaseSystem {
    parse_dump(TWO_RECIPE_JSON, "two-recipe")
}

fn parse_dump(json: &str, name: &str) -> BaseSystem {
    let mut val: serde_json::Value = serde_json::from_str(json).expect("valid JSON");
    let has_explicit_breakpoints = val.get("breakpoints").is_some();
    ensure_spec_envelope(&mut val, name);
    let full_json = serde_json::to_string(&val).unwrap();
    let mut system = match BaseSystem::from_json(&full_json) {
        Ok(system) => system,
        Err(err) => panic!("{name} dump must parse: {err}"),
    };
    if !has_explicit_breakpoints {
        system.breakpoints = base_system::BreakpointScale::default();
    }
    system
}

fn ensure_spec_envelope(val: &mut serde_json::Value, name: &str) {
    ensure_meta_fields(val, name);
    ensure_object_fields(val);
    ensure_array_fields(val);
}

fn ensure_meta_fields(val: &mut serde_json::Value, name: &str) {
    if val.get("name").is_none() {
        val["name"] = serde_json::json!(name);
    }
    if val.get("schemaVersion").is_none() {
        val["schemaVersion"] = serde_json::json!(1);
    }
    if val.get("profile").is_none() {
        val["profile"] = serde_json::json!("reference-ui");
    }
}

fn ensure_object_fields(val: &mut serde_json::Value) {
    for field in ["tokens", "fonts", "keyframes", "recipes", "staticCss"] {
        if val.get(field).is_none() {
            val[field] = serde_json::json!({});
        }
    }
}

fn ensure_array_fields(val: &mut serde_json::Value) {
    for field in ["globalCss", "provenance"] {
        if val.get(field).is_none() {
            val[field] = serde_json::json!([]);
        }
    }
}

fn catalog_dts() -> String {
    emit_dts(&catalog_system())
}

fn recipe_dts() -> String {
    emit_dts(&recipe_system())
}

fn compound_dts() -> String {
    emit_dts(&compound_system())
}

fn font_dts() -> String {
    emit_dts(&font_system())
}

fn two_recipe_dts() -> String {
    emit_dts(&two_recipe_system())
}

fn style_dump_json() -> String {
    let catalog = CATALOG_JSON.trim();
    let inner = catalog
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("catalog dump is an object")
        .trim();
    format!(
        "{{\n{inner},\n  \"breakpoints\": {{ \"sm\": \"640px\", \"md\": \"768px\", \"lg\": \"1024px\" }}\n}}"
    )
}

fn style_system() -> BaseSystem {
    parse_dump(&style_dump_json(), "style")
}

fn style_dts() -> String {
    emit_dts(&style_system())
}

fn style_dts_with(strict: &[&str]) -> String {
    emit_dts_with(
        &style_system(),
        &EmitOptions {
            strict: strict.iter().map(|name| (*name).to_string()).collect(),
        },
    )
}

fn style_strict_dts() -> String {
    style_dts_with(&["colors", "radii", "spacing"])
}

fn font_style_dump_json() -> String {
    let fonts = FONT_JSON
        .trim()
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("font dump is an object")
        .trim();
    let style = style_dump_json();
    let style_inner = style
        .trim()
        .strip_suffix('}')
        .expect("style dump is an object")
        .trim();
    format!("{style_inner},\n{fonts}\n}}")
}

fn font_style_system() -> BaseSystem {
    parse_dump(&font_style_dump_json(), "font-style")
}

fn font_style_dts() -> String {
    emit_dts(&font_style_system())
}

fn assert_alias(dts: &str, name: &str, union: &str) {
    let line = format!("export type {name} = {union};");
    assert!(dts.contains(&line), "missing `{line}` in:\n{dts}");
}

fn jsx_farm_needles() -> &'static [&'static str] {
    &[
        "styled.div",
        "styled.span",
        "HTMLStyledProps",
        "StyledComponent",
        "JsxFactory",
        "box(",
        "flex(",
        "recipes/",
    ]
}

fn atomic_class_needles() -> &'static [&'static str] {
    &[".mt_2r", ".bg_n300", "atomic/"]
}

fn goldens_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/goldens")
}

fn should_update_goldens() -> bool {
    match std::env::var("TYPEGEN_UPDATE_GOLDENS") {
        Ok(value) => value == "1" || value.eq_ignore_ascii_case("true"),
        Err(_) => std::env::args().any(|arg| arg == "--update-goldens"),
    }
}

fn assert_matches_golden(name: &str, actual: &str) {
    let path = goldens_dir().join(name);
    if should_update_goldens() {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("goldens dir");
        }
        fs::write(&path, actual).expect("write golden");
        return;
    }
    let expected = fs::read_to_string(&path).unwrap_or_else(|_| {
        panic!(
            "missing golden {}; refresh with TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen",
            path.display()
        )
    });
    assert_eq!(
        actual, expected,
        "golden drift at {}; refresh with TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen",
        path.display()
    );
}

/// TYP-FORBID-01 — populated emit contains no atomic class names.
#[test]
fn typ_forbid_01_emits_no_atomic_class_names() {
    for dts in [
        catalog_dts(),
        recipe_dts(),
        compound_dts(),
        font_dts(),
        style_dts(),
        font_style_dts(),
    ] {
        for needle in atomic_class_needles() {
            assert!(
                !dts.contains(needle),
                "TYP-FORBID-01: emitted text contains `{needle}`:\n{dts}"
            );
        }
    }
}

/// TYP-FORBID-02 — empty and populated emit contain no JSX / pattern farm.
#[test]
fn typ_forbid_02_emits_no_jsx_farm() {
    let empty = emit_dts(&BaseSystem::default());
    for dts in [
        empty,
        catalog_dts(),
        recipe_dts(),
        compound_dts(),
        font_dts(),
        style_dts(),
        font_style_dts(),
    ] {
        for needle in jsx_farm_needles() {
            assert!(
                !dts.contains(needle),
                "TYP-FORBID-02: emitted text contains `{needle}`:\n{dts}"
            );
        }
    }
}

/// Empty Core imported categories (SpacingToken, RadiusToken) emit `never`, while
/// non-core categories (FontSizeToken, etc.) are omitted.
#[test]
fn emits_never_for_empty_core_token_categories() {
    let system = parse_dump(
        r##"{"tokens":{"colors":{"n100":{"value":"#fff"}}}}"##,
        "colors-only",
    );
    let dts = emit_dts(&system);
    assert_alias(&dts, "ColorToken", "'n100'");
    assert_alias(&dts, "SpacingToken", "never");
    assert_alias(&dts, "RadiusToken", "never");
    assert!(!dts.contains("FontSizeToken"), "{dts}");
    assert!(!dts.contains("VariantProps"), "{dts}");
}
