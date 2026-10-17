//! Pins JSX attribute bag lowering against const objects: hole entries emit no fact while a literal
//! `true` stays an exact expectation. The helper parses a source snippet so the walker sees the same
//! shape the compile sees.

use super::super::support::{dynamic_count, exact_keys, parse_for_test};
use super::*;
use crate::diagnostics::{DiagnosticFact, SourceId, StyleSurfaceKind};
use rustc_hash::FxHashSet;
use std::collections::{BTreeMap, BTreeSet};

// Walker-level: visitors shadow top-level declarators end to end.
fn walk_bag_const(source: &str) -> Vec<DiagnosticFact> {
    let allocator = oxc_allocator::Allocator::default();
    let program = parse_for_test(&allocator, source);
    let constants =
        crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
    let bag = constants.get_object("bag").expect("const bag");
    let style_props: FxHashSet<String> = ["mt"].into_iter().map(str::to_string).collect();
    let shadows: Vec<FxHashSet<String>> = Vec::new();
    let owned: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    let gate = AttrGate {
        tag: "Div",
        owned: &owned,
    };
    let mut facts = Vec::new();
    let mut walk = WalkCtx {
        facts: &mut facts,
        source: SourceId(0),
        surface: StyleSurfaceKind::JsxStyle,
        system: "test",
        external: false,
        qualifiers: &[],
        style_props: &style_props,
        constants: &constants,
        shadows: &shadows,
    };
    walk_const_attrs(&mut walk, &gate, bag, Site::bare(Span::new(0, 0), &[]));
    facts
}

#[test]
fn const_bag_hole_entries_emit_no_fact_and_true_stays_exact() {
    let facts = walk_bag_const("const bag = { mt: false };");
    assert!(facts.is_empty());
    let facts = walk_bag_const("const bag = { mt: true };");
    assert_eq!(exact_keys(&facts).len(), 1);
    assert_eq!(dynamic_count(&facts), 0);
}
