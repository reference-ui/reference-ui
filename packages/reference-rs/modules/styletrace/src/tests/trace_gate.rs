//! Pins the trace-gate soundness lemma: needle-free entries trace to nothing.
//! It takes scratch sources through the explicit-entries surface API with a
//! hand-built surface and asserts the traced name sets. The gate itself lives
//! in atomic (`hosts/entries.rs`); these tests pin the trace behavior the gate
//! relies on, so a future parser change that makes needle-free bytes traceable
//! fails loudly here instead of silently hollowing host discovery.

use std::collections::{BTreeSet, HashMap};

use super::fixtures::workspace_scratch_dir;
use crate::{StyleSurface, TraceOutcome, trace_style_bindings_with_surface};

fn gate_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["color".to_string(), "mt".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

fn trace_names(files: &[(&str, &str)]) -> Vec<String> {
    trace_outcome(files)
        .bindings
        .into_iter()
        .map(|binding| binding.name)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn trace_outcome(files: &[(&str, &str)]) -> TraceOutcome {
    let fixture = workspace_scratch_dir("trace-gate");
    let mut entries = Vec::new();
    for (name, content) in files {
        let path = format!("input/{name}");
        fixture.write(&path, content);
        entries.push(fixture.root().join(path));
    }
    let staged = HashMap::new();
    trace_style_bindings_with_surface(
        &entries,
        fixture.root(),
        fixture.root(),
        &gate_surface(),
        &staged,
    )
}

#[test]
fn needle_free_dead_shape_traces_to_nothing() {
    let names = trace_names(&[(
        "dead.ts",
        "export const FACTOR_7 = 224\n\nexport function combine7(left: number, right: number): number {\n  return (left + right) * FACTOR_7\n}\n",
    )]);
    assert!(names.is_empty(), "dead shape traced: {names:?}");
}

#[test]
fn require_only_file_traces_to_nothing() {
    let names = trace_names(&[(
        "legacy.cjs",
        "const helper = require('./helper')\nmodule.exports = { helper }\n",
    )]);
    assert!(names.is_empty(), "require-only traced: {names:?}");
}

#[test]
fn unannotated_create_element_forwarder_traces_to_nothing() {
    let names = trace_names(&[(
        "fwd.ts",
        "export function Fwd(props) {\n  return createElement(Other, props)\n}\n",
    )]);
    assert!(names.is_empty(), "forwarder traced: {names:?}");
}

#[test]
fn barrel_from_follows_into_import_free_pipeline_target() {
    let names = trace_names(&[
        ("index.ts", "export * from './bare'\n"),
        (
            "bare.ts",
            "export function BareCard({ color }) {\n  return css(color)\n}\n",
        ),
    ]);
    assert_eq!(names, vec!["BareCard".to_string()]);
}

#[test]
fn needle_free_unparsable_entry_yields_located_diagnostic() {
    // SITE-57 shape: no gate needle, yet unparsable. The keep-alive in
    // atomic keeps this entry so the warning below survives the gate.
    let outcome = trace_outcome(&[("broken.ts", "export function Broken( {\n")]);
    assert!(outcome.bindings.is_empty());
    assert_eq!(outcome.diagnostics.len(), 1, "{:?}", outcome.diagnostics);
    let diagnostic = &outcome.diagnostics[0];
    let file = diagnostic.file.as_ref().expect("located warning");
    assert!(file.ends_with("input/broken.ts"), "unlocated: {file:?}");
    assert!(diagnostic.message.contains("parse error"), "{}", diagnostic.message);
}

#[test]
fn js_with_ts_syntax_parses_clean_and_traces_to_nothing() {
    // Keep-alive soundness: the entry parse runs main-phase options, so
    // TS syntax in a `.js` file parses instead of warning. Needle-free,
    // so the gate skips it and silence must hold on both sides.
    let outcome = trace_outcome(&[(
        "typed.js",
        "export const count: number = 3\n\nexport function total(left: number, right: number): number {\n  return left + right\n}\n",
    )]);
    assert!(outcome.diagnostics.is_empty(), "{:?}", outcome.diagnostics);
    assert!(outcome.bindings.is_empty());
}
