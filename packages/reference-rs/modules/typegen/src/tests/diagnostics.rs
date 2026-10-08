//! TGN collector rows: every printer skip surfaces one warning through the public twin.
//! Each case drives `emit_dts_with_diagnostics` on a minimal dump and asserts the
//! exact code plus the sibling-kept output. The detailed `dts` always matches the
//! plain `emit_dts_with` string; diagnostics only add rows, never reshape text.

use super::parse_dump;
use crate::{emit_dts_with, emit_dts_with_diagnostics, EmitOptions};

fn codes_of(json: &str, strict: &[&str]) -> (String, Vec<String>) {
    let system = parse_dump(json, "diagnostics");
    let options = EmitOptions {
        strict: strict.iter().map(|name| (*name).to_string()).collect(),
    };
    let detailed = emit_dts_with_diagnostics(&system, &options);
    assert_eq!(
        detailed.dts,
        emit_dts_with(&system, &options),
        "detailed dts must match the plain emit"
    );
    let codes = detailed
        .diagnostics
        .iter()
        .map(|note| note.code.as_str().to_string())
        .collect();
    (detailed.dts, codes)
}

#[test]
fn clean_systems_emit_no_diagnostics() {
    let (_, codes) = codes_of(super::fixtures::CATALOG_JSON, &[]);
    assert!(codes.is_empty(), "catalog must be quiet: {codes:?}");
    let (_, strict_codes) = codes_of(&super::style_dump_json(), &["colors"]);
    assert!(strict_codes.is_empty(), "strict colors must be quiet: {strict_codes:?}");
}

#[test]
fn unknown_token_categories_report_once_per_category() {
    let (dts, codes) = codes_of(
        r##"{"tokens":{"colors":{"n100":{"value":"#fff"}},"animations":{"spin":{"value":"spin 1s"}},"foo":{"bar":{"value":"1"}}}}"##,
        &[],
    );
    assert_eq!(
        codes,
        vec![
            "TGN-W-UNKNOWN-TOKEN-CATEGORY".to_string(),
            "TGN-W-UNKNOWN-TOKEN-CATEGORY".to_string(),
        ]
    );
    assert!(dts.contains("ColorToken"), "known sibling still prints:\n{dts}");
    assert!(!dts.contains("spin"), "unknown tokens stay out:\n{dts}");
}

#[test]
fn invalid_recipe_names_skip_the_recipe_and_keep_siblings() {
    let (dts, codes) = codes_of(
        r##"{"recipes":{"123":{"variants":{"size":{"sm":{"p":"1r"}}}},"button":{"variants":{"size":{"sm":{"p":"1r"},"lg":{"p":"3r"}}}}}}"##,
        &[],
    );
    assert_eq!(codes, vec!["TGN-W-INVALID-RECIPE-NAME".to_string()]);
    assert!(dts.contains("ButtonVariantProps"), "sibling still prints:\n{dts}");
}

#[test]
fn empty_recipes_and_axes_report_the_scope_they_skip() {
    let (whole_dts, whole_codes) = codes_of(
        r##"{"recipes":{"card":{"variants":{}}}}"##,
        &[],
    );
    assert_eq!(whole_codes, vec!["TGN-W-EMPTY-RECIPE".to_string()]);
    assert!(!whole_dts.contains("CardVariantProps"), "empty recipe omitted:\n{whole_dts}");

    let (axis_dts, axis_codes) = codes_of(
        r##"{"recipes":{"button":{"variants":{"size":{},"tone":{"quiet":{"bg":"n100"},"loud":{"bg":"n300"}}}}}}"##,
        &[],
    );
    assert_eq!(axis_codes, vec!["TGN-W-EMPTY-RECIPE".to_string()]);
    assert!(
        axis_dts.contains("ButtonVariantProps") && axis_dts.contains("tone?:"),
        "sibling axis still prints:\n{axis_dts}"
    );
}

#[test]
fn invalid_compound_rows_report_per_row_without_leaking_literals() {
    let (dts, codes) = codes_of(
        r##"{"recipes":{"button":{"variants":{"size":{"sm":{"p":"1r"},"lg":{"p":"3r"}},"tone":{"quiet":{"bg":"n100"},"loud":{"bg":"n300"}}},"compoundVariants":[{"tone":"loud","size":"lg","css":{"border":"2px"}},{"tone":"nope","css":{}},{"flavor":"loud","css":{}}]}}}"##,
        &[],
    );
    assert_eq!(
        codes,
        vec![
            "TGN-W-INVALID-COMPOUND-VARIANT".to_string(),
            "TGN-W-INVALID-COMPOUND-VARIANT".to_string(),
        ]
    );
    assert!(dts.contains("ButtonCompoundVariant"), "valid row still prints:\n{dts}");
    assert!(!dts.contains("'nope'"), "unknown values stay out:\n{dts}");
}

#[test]
fn unknown_strict_names_report_and_duplicates_dedupe() {
    let (_, codes) = codes_of(&super::style_dump_json(), &["colors", "nope", "fonts", "nope"]);
    assert_eq!(
        codes,
        vec![
            "TGN-W-UNKNOWN-STRICT-CATEGORY".to_string(),
            "TGN-W-UNKNOWN-STRICT-CATEGORY".to_string(),
        ]
    );
}

#[test]
fn absent_strict_categories_report_without_wrapping() {
    let json = r##"{"tokens":{"colors":{"brand":{"value":"#2563eb"}}},"breakpoints":{"sm":"640px"}}"##;
    let (dts, codes) = codes_of(json, &["spacing"]);
    assert_eq!(codes, vec!["TGN-W-ABSENT-STRICT-CATEGORY".to_string()]);
    assert!(!dts.contains("StrictSpacingProps"), "absent stays open:\n{dts}");
}

#[test]
fn empty_font_families_report_and_siblings_still_print() {
    let (dts, codes) = codes_of(
        r##"{"fonts":{"sans":{"value":"Inter","weights":{"normal":"400"}},"display":{"value":"Fancy","weights":{}}}}"##,
        &[],
    );
    assert_eq!(codes, vec!["TGN-W-EMPTY-FONT-FAMILY".to_string()]);
    assert!(dts.contains("'sans'"), "sibling family still prints:\n{dts}");
    assert!(!dts.contains("display"), "empty family omitted:\n{dts}");
}

#[test]
fn colliding_recipe_stems_report_the_loser_and_keep_one_alias() {
    let (dts, codes) = codes_of(
        r##"{"recipes":{"button":{"variants":{"size":{"sm":{"p":"1r"},"lg":{"p":"3r"}}}},"Button":{"variants":{"flavor":{"sweet":{"bg":"n100"}}}}}}"##,
        &[],
    );
    assert_eq!(codes, vec!["TGN-W-DUPLICATE-RECIPE-STEM".to_string()]);
    assert_eq!(
        dts.matches("export type ButtonVariantProps").count(),
        1,
        "one alias beside the row in:\n{dts}"
    );
    assert!(!dts.contains("flavor"), "loser axes must not print in:\n{dts}");
}

#[test]
fn empty_recipes_claim_no_stem_for_later_printable_twins() {
    let (dts, codes) = codes_of(
        r##"{"recipes":{"button":{"variants":{}},"Button":{"variants":{"flavor":{"sweet":{"bg":"n100"}}}}}}"##,
        &[],
    );
    assert_eq!(codes, vec!["TGN-W-EMPTY-RECIPE".to_string()]);
    assert!(
        dts.contains("export type ButtonVariantProps"),
        "printable twin still prints:\n{dts}"
    );
    assert!(dts.contains("flavor"), "winner axes print:\n{dts}");
}

#[test]
fn diagnostics_sort_by_code_and_message() {
    let (_, codes) = codes_of(
        r##"{"tokens":{"zzz":{"a":{"value":"1"}}},"recipes":{"123":{"variants":{"size":{"sm":{"p":"1r"}}}}},"fonts":{"ghost":{"value":"G","weights":{}}}}"##,
        &["nope"],
    );
    let mut sorted = codes.clone();
    sorted.sort();
    assert_eq!(codes, sorted, "collector rows must arrive sorted");
    assert_eq!(codes.len(), 4);
}
