//! Merge and collision tests for `ast::resolve`: same-file interface declarations that merge, and the diagnostics
//! that name the member or declaration that collides. Each case builds an in-memory workspace and resolves it.

use crate::ast::{extract_ast, resolve_ast};
use crate::model::{TsSymbolKind, TypeRef};
use crate::scanner::symbol_id;

use super::workspace;

#[test]
fn merges_same_file_interface_declarations() {
    // M1: legal TS declaration merging folds
    // into one symbol with unioned members in declaration order, silently.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export interface Widget {\n  alpha: string\n}\n\nexport interface Widget {\n  beta: number\n}\n",
    )]);
    let parsed = extract_ast(&scanned).expect("extract should succeed");
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed).expect("resolve should succeed");
    assert!(graph.diagnostics.is_empty(), "{:?}", graph.diagnostics);

    let matching = graph
        .symbols
        .values()
        .filter(|s| s.name == "Widget")
        .collect::<Vec<_>>();
    assert_eq!(matching.len(), 1);
    assert_eq!(matching[0].id, symbol_id("src/widgets.ts", "Widget"));
    let member_names = matching[0]
        .defined_members
        .iter()
        .map(|m| m.name.as_str())
        .collect::<Vec<_>>();
    assert_eq!(member_names, vec!["alpha", "beta"]);
}

#[test]
fn merged_interface_member_collision_keeps_first_with_diagnostic() {
    // M2: the same member in two merged blocks
    // keeps the first declaration and emits a diagnostic naming the member.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export interface Widget {\n  alpha: string\n}\n\nexport interface Widget {\n  alpha: number\n  beta: boolean\n}\n",
    )]);
    let graph = resolve_ast(extract_ast(&scanned).expect("extract should succeed")).expect("resolve should succeed");

    let matching = graph
        .symbols
        .values()
        .filter(|s| s.name == "Widget")
        .collect::<Vec<_>>();
    assert_eq!(matching.len(), 1);
    let member_names = matching[0]
        .defined_members
        .iter()
        .map(|m| m.name.as_str())
        .collect::<Vec<_>>();
    assert_eq!(member_names, vec!["alpha", "beta"]);
    let alpha = matching[0]
        .defined_members
        .iter()
        .find(|m| m.name == "alpha")
        .expect("member alpha");
    match alpha.type_ref.as_ref().expect("alpha has a type") {
        TypeRef::Intrinsic { name } => assert_eq!(name, "string"),
        other => panic!("expected first-wins Intrinsic string, got {other:?}"),
    }

    assert_eq!(graph.diagnostics.len(), 1, "{:?}", graph.diagnostics);
    assert_eq!(
        graph.diagnostics[0].file.as_deref(),
        Some("src/widgets.ts")
    );
    assert_eq!(
        graph.diagnostics[0].code.as_str(),
        "TST-W-DUPLICATE-MEMBER"
    );
    assert!(
        graph.diagnostics[0].message.contains("`Widget`")
            && graph.diagnostics[0].message.contains("`alpha`"),
        "unexpected diagnostic: {:?}",
        graph.diagnostics[0]
    );
}

#[test]
fn non_mergeable_same_file_collision_keeps_last_with_diagnostic() {
    // M3: alias+alias and mixed-kind same-file
    // collisions are tsc-error shapes — keep the deterministic last
    // survivor and emit a diagnostic naming the symbol and the kinds.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export type Dup = string;\nexport type Dup = number;\n\nexport interface Mix {\n  a: string\n}\nexport type Mix = number;\n",
    )]);
    let graph = resolve_ast(extract_ast(&scanned).expect("extract should succeed")).expect("resolve should succeed");

    let dup = graph
        .symbols
        .values()
        .filter(|s| s.name == "Dup")
        .collect::<Vec<_>>();
    assert_eq!(dup.len(), 1);
    match dup[0].underlying.as_ref().expect("Dup has underlying") {
        TypeRef::Intrinsic { name } => assert_eq!(name, "number"),
        other => panic!("expected last-survivor Intrinsic number, got {other:?}"),
    }

    let mix = graph
        .symbols
        .values()
        .filter(|s| s.name == "Mix")
        .collect::<Vec<_>>();
    assert_eq!(mix.len(), 1);
    assert_eq!(mix[0].kind, TsSymbolKind::TypeAlias);

    assert_eq!(graph.diagnostics.len(), 2, "{:?}", graph.diagnostics);
    for diagnostic in &graph.diagnostics {
        assert_eq!(diagnostic.file.as_deref(), Some("src/widgets.ts"));
        assert_eq!(
            diagnostic.code.as_str(),
            "TST-W-DUPLICATE-DECLARATION"
        );
    }
    let messages = graph
        .diagnostics
        .iter()
        .map(|d| d.message.as_str())
        .collect::<Vec<_>>()
        .join("\n");
    assert!(
        messages.contains("`Dup`")
            && messages.contains("TypeAlias + TypeAlias")
            && messages.contains("`Mix`")
            && messages.contains("Interface + TypeAlias"),
        "unexpected diagnostics: {messages}"
    );
}
