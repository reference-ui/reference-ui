//! Pins object-literal walking: flat objects emit exact keys, nested conditions keep their raw
//! whens, unlowerable conditions stay exact, holes emit nothing, spreads and computed keys stay
//! dynamic, and `r` objects and custom props take their own shapes. Each case parses one source
//! snippet so an assertion names one walk rule.

use super::super::support::{dynamic_count, exact_keys, walk_first_object};
use super::*;
use crate::diagnostics::StyleSurfaceKind;

fn walk_source(source: &str) -> Vec<DiagnosticFact> {
    walk_first_object(
        source,
        StyleSurfaceKind::Css,
        &["color", "mt", "width", "padding"],
    )
}

#[test]
fn flat_objects_emit_exact_keys() {
    let facts = walk_source("css({ color: 'red', mt: '2r' })");
    assert_eq!(
        exact_keys(&facts),
        vec![
            r#"["test",[],"color","red",false]"#.to_string(),
            r#"["test",[],"mt","2r",false]"#.to_string(),
        ]
    );
    assert_eq!(dynamic_count(&facts), 0);
}

#[test]
fn nested_conditions_push_raw_whens() {
    let facts = walk_source("css({ _hover: { _focus: { color: 'red' } } })");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",["_hover","_focus"],"color","red",false]"#.to_string()]
    );
}

#[test]
fn unlowerable_conditions_stay_exact() {
    let facts = walk_source("css({ _hovr: { color: 'red.500' } })");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",["_hovr"],"color","red.500",false]"#.to_string()]
    );
}

#[test]
fn holes_emit_no_fact() {
    let facts = walk_source("css({ a: null, b: undefined, c: void 0, d: false, e: 0 })");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"e",0,false]"#.to_string()]
    );
    assert_eq!(dynamic_count(&facts), 0);
}

#[test]
fn spreads_and_computed_keys_stay_dynamic() {
    let facts = walk_source("css({ ...base, [k]: 'red', color: 'red' })");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"color","red",false]"#.to_string()]
    );
    assert_eq!(dynamic_count(&facts), 2);
}

#[test]
fn r_objects_stay_dynamic() {
    let facts = walk_source("css({ r: { 300: { p: '1r' } } })");
    assert!(exact_keys(&facts).is_empty());
    assert_eq!(dynamic_count(&facts), 1);
}

#[test]
fn custom_prop_objects_predict_one_whole_object_exact() {
    // `--x` is absent from the style set on purpose: the `--` prefix
    // rule alone must route the object to one whole-object exact.
    let facts = walk_source("css({ '--x': { base: '1', md: '2' } })");
    assert_eq!(
        exact_keys(&facts),
        vec![r#"["test",[],"--x",{"base":"1","md":"2"},false]"#.to_string()]
    );
    assert_eq!(dynamic_count(&facts), 0);
}
