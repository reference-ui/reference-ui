//! Barrel tests for `ast::resolve`: `export *` ambiguity and diamonds, and explicit barrel bindings that shadow
//! star names. Each case builds an in-memory workspace and resolves it.

use crate::ast::{extract_ast, resolve_ast};
use crate::model::TypeRef;
use crate::scanner::symbol_id;

use super::workspace;

#[test]
fn star_ambiguous_name_excluded_from_barrel_with_diagnostic() {
    // A name provided by two `export *` targets
    // with different symbol ids is ambiguous (tsc TS2308) — the barrel
    // exports nothing, so the consumer import stays unresolved and exactly
    // one diagnostic names the barrel, the name, and both sources.
    let scanned = workspace(&[
        ("src/a.ts", "export interface Widget {\n  a: string\n}\n"),
        ("src/b.ts", "export interface Widget {\n  b: number\n}\n"),
        ("src/barrel.ts", "export * from './a'\nexport * from './b'\n"),
        (
            "src/consumer.ts",
            "import { Widget } from './barrel'\nexport interface Use {\n  w: Widget\n}\n",
        ),
    ]);
    let graph = resolve_ast(extract_ast(&scanned).expect("extract should succeed")).expect("resolve should succeed");

    let barrel_has_widget = graph
        .exports
        .get("src/barrel.ts")
        .map(|exports| exports.contains_key("Widget"))
        .unwrap_or(false);
    assert!(!barrel_has_widget, "{:?}", graph.exports);

    let use_symbol = graph
        .symbols
        .values()
        .find(|s| s.name == "Use")
        .expect("Use symbol");
    let w = use_symbol
        .defined_members
        .iter()
        .find(|m| m.name == "w")
        .expect("member w");
    match w.type_ref.as_ref().expect("w has a type") {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Widget");
            assert_eq!(target_id, &None);
        }
        other => panic!("expected unresolved Reference to Widget, got {other:?}"),
    }

    assert_eq!(graph.diagnostics.len(), 1, "{:?}", graph.diagnostics);
    assert_eq!(graph.diagnostics[0].file.as_deref(), Some("src/barrel.ts"));
    assert_eq!(
        graph.diagnostics[0].code.as_str(),
        "TST-W-STAR-AMBIGUITY"
    );
    let message = graph.diagnostics[0].message.as_str();
    assert!(
        message.contains("`Widget`")
            && message.contains("src/a.ts")
            && message.contains("src/b.ts"),
        "unexpected diagnostic: {message}"
    );
}

#[test]
fn star_diamond_same_binding_still_resolves() {
    // Negative pin (edge rule a): the same symbol id through
    // multiple stars is one binding (ESM same-binding rule), not a conflict.
    let scanned = workspace(&[
        ("src/shared.ts", "export interface Widget {\n  a: string\n}\n"),
        ("src/left.ts", "export * from './shared'\n"),
        ("src/right.ts", "export * from './shared'\n"),
        ("src/barrel.ts", "export * from './left'\nexport * from './right'\n"),
        (
            "src/consumer.ts",
            "import { Widget } from './barrel'\nexport interface Use {\n  w: Widget\n}\n",
        ),
    ]);
    let graph = resolve_ast(extract_ast(&scanned).expect("extract should succeed")).expect("resolve should succeed");
    assert!(graph.diagnostics.is_empty(), "{:?}", graph.diagnostics);

    let expected = symbol_id("src/shared.ts", "Widget");
    let barrel = graph.exports.get("src/barrel.ts").expect("barrel exports");
    assert_eq!(barrel.get("Widget"), Some(&expected));

    let use_symbol = graph
        .symbols
        .values()
        .find(|s| s.name == "Use")
        .expect("Use symbol");
    let w = use_symbol
        .defined_members
        .iter()
        .find(|m| m.name == "w")
        .expect("member w");
    match w.type_ref.as_ref().expect("w has a type") {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Widget");
            assert_eq!(target_id.as_ref(), Some(&expected));
        }
        other => panic!("expected resolved Reference to Widget, got {other:?}"),
    }
}

#[test]
fn explicit_barrel_binding_shadows_star_names() {
    // Negative pin (edge rule b): explicit local bindings
    // seeded before the star fold keep shadowing star-provided names.
    let scanned = workspace(&[
        ("src/other.ts", "export interface Widget {\n  b: number\n}\n"),
        (
            "src/barrel.ts",
            "export interface Widget {\n  local: string\n}\nexport * from './other'\n",
        ),
        (
            "src/consumer.ts",
            "import { Widget } from './barrel'\nexport interface Use {\n  w: Widget\n}\n",
        ),
    ]);
    let graph = resolve_ast(extract_ast(&scanned).expect("extract should succeed")).expect("resolve should succeed");
    assert!(graph.diagnostics.is_empty(), "{:?}", graph.diagnostics);

    let expected = symbol_id("src/barrel.ts", "Widget");
    let barrel = graph.exports.get("src/barrel.ts").expect("barrel exports");
    assert_eq!(barrel.get("Widget"), Some(&expected));

    let use_symbol = graph
        .symbols
        .values()
        .find(|s| s.name == "Use")
        .expect("Use symbol");
    let w = use_symbol
        .defined_members
        .iter()
        .find(|m| m.name == "w")
        .expect("member w");
    match w.type_ref.as_ref().expect("w has a type") {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Widget");
            assert_eq!(target_id.as_ref(), Some(&expected));
        }
        other => panic!("expected resolved Reference to Widget, got {other:?}"),
    }
}
