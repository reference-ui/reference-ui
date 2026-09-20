//! Unit tests for `ast::resolve` — `ParsedTypeScriptAst` → `ResolvedTypeScriptGraph`.
//!
//! Builds realistic `ParsedTypeScriptAst` via `extract_ast` on in-memory workspaces so
//! import bindings and symbol shells match what the parser emits.

use std::collections::BTreeSet;
use std::path::PathBuf;

use crate::ast::{extract_ast, resolve_ast};
use crate::model::{TsSymbolKind, TypeRef};
use crate::scanner::{scan_workspace, symbol_id, ScannedFile, ScannedWorkspace};

use super::fixtures::TempDir;

fn workspace(files: &[(&str, &str)]) -> ScannedWorkspace {
    let root_dir = PathBuf::from(".");
    let mut file_ids = BTreeSet::new();
    let mut out = Vec::new();
    for (file_id, source) in files {
        file_ids.insert((*file_id).to_string());
        out.push(ScannedFile {
            file_id: (*file_id).to_string(),
            module_specifier: (*file_id).to_string(),
            library: "user".to_string(),
            source: (*source).to_string(),
        });
    }
    ScannedWorkspace {
        root_dir,
        files: out,
        file_ids,
    }
}

#[test]
fn resolves_cross_file_import_reference() {
    let scanned = workspace(&[
        ("src/a.ts", "export interface Foo { x: number }\n"),
        (
            "src/b.ts",
            "import type { Foo } from './a'\nexport interface Bar { f: Foo }\n",
        ),
    ]);
    let parsed = extract_ast(&scanned);
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed);

    let bar = graph
        .symbols
        .values()
        .find(|s| s.name == "Bar")
        .expect("Bar symbol");
    let f = bar
        .defined_members
        .iter()
        .find(|m| m.name == "f")
        .expect("member f");
    let type_ref = f.type_ref.as_ref().expect("f has a type");

    let expected_foo = symbol_id("src/a.ts", "Foo");
    match type_ref {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Foo");
            assert_eq!(target_id.as_ref(), Some(&expected_foo));
        }
        other => panic!("expected Reference to Foo, got {other:?}"),
    }
}

#[test]
fn resolves_same_file_interface_reference() {
    let scanned = workspace(&[(
        "src/one.ts",
        "export interface LocalA { n: number }\nexport interface LocalB { a: LocalA }\n",
    )]);
    let graph = resolve_ast(extract_ast(&scanned));

    let local_b = graph
        .symbols
        .values()
        .find(|s| s.name == "LocalB")
        .expect("LocalB");
    let a = local_b
        .defined_members
        .iter()
        .find(|m| m.name == "a")
        .expect("member a");
    let type_ref = a.type_ref.as_ref().expect("a has a type");

    let expected = symbol_id("src/one.ts", "LocalA");
    match type_ref {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "LocalA");
            assert_eq!(target_id.as_ref(), Some(&expected));
        }
        other => panic!("expected Reference to LocalA, got {other:?}"),
    }
}

#[test]
fn local_export_type_reexport_keeps_only_canonical_symbol() {
    let scanned = workspace(&[
        ("src/other.ts", "export type T = string;\n"),
        ("src/index.ts", "export type { T } from './other';\n"),
    ]);
    let parsed = extract_ast(&scanned);
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed);

    let matching = graph
        .symbols
        .values()
        .filter(|s| s.name == "T")
        .collect::<Vec<_>>();

    assert_eq!(matching.len(), 1);
    assert_eq!(matching[0].file_id, "src/other.ts");
    assert_eq!(matching[0].id, symbol_id("src/other.ts", "T"));
}

#[test]
fn leaves_cross_library_external_import_reference_without_target() {
    // Contract restoration (Objective 3 wave 1 find c): the scan boundary in
    // the scanner README is same-package-only from library files, so the
    // `react` package is never scanned and the cross-library reference keeps
    // its name but resolves to no target. Formerly
    // `resolves_cross_library_external_import_reference`, which pinned the
    // depth-2 cross-package allowance at the resolve layer.
    let root = TempDir::new("tasty-resolve-cross-library-external-import");
    root.write(
        "src/index.ts",
        "export type { PrimitiveNativeProps } from '@reference-ui/react';\n",
    );
    root.write(
        "node_modules/@reference-ui/react/package.json",
        r#"{ "name": "@reference-ui/react", "types": "react.d.mts" }"#,
    );
    root.write(
        "node_modules/@reference-ui/react/react.d.mts",
        "import type { ComponentPropsWithoutRef } from 'react';\nexport type PrimitiveNativeProps<T> = ComponentPropsWithoutRef<T>;\n",
    );
    root.write(
        "node_modules/react/package.json",
        r#"{ "name": "react", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/react/index.d.ts",
        "export type ComponentPropsWithoutRef<T> = { disabled?: boolean };\n",
    );

    let scanned = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");
    let parsed = extract_ast(&scanned);
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed);

    let primitive_native_props = graph
        .symbols
        .values()
        .find(|s| s.name == "PrimitiveNativeProps")
        .expect("PrimitiveNativeProps symbol");

    let Some(TypeRef::Reference {
        name, target_id, ..
    }) = primitive_native_props.underlying.as_ref()
    else {
        panic!(
            "expected underlying reference, got {:?}",
            primitive_native_props.underlying
        );
    };

    assert_eq!(name, "ComponentPropsWithoutRef");
    assert_eq!(target_id.as_deref(), None);
    assert!(
        graph
            .symbols
            .values()
            .all(|s| s.file_id != "node_modules/react/index.d.ts"),
        "cross-library package must not enter the graph"
    );
}

#[test]
fn merges_same_file_interface_declarations() {
    // M1 (Objective 3 wave 4 find j): legal TS declaration merging folds
    // into one symbol with unioned members in declaration order, silently.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export interface Widget {\n  alpha: string\n}\n\nexport interface Widget {\n  beta: number\n}\n",
    )]);
    let parsed = extract_ast(&scanned);
    assert!(parsed.diagnostics.is_empty(), "{:?}", parsed.diagnostics);
    let graph = resolve_ast(parsed);
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
    // M2 (Objective 3 wave 4 find j): the same member in two merged blocks
    // keeps the first declaration and emits a diagnostic naming the member.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export interface Widget {\n  alpha: string\n}\n\nexport interface Widget {\n  alpha: number\n  beta: boolean\n}\n",
    )]);
    let graph = resolve_ast(extract_ast(&scanned));

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
    assert_eq!(graph.diagnostics[0].file_id, "src/widgets.ts");
    assert!(
        graph.diagnostics[0].message.contains("\"Widget\"")
            && graph.diagnostics[0].message.contains("\"alpha\""),
        "unexpected diagnostic: {:?}",
        graph.diagnostics[0]
    );
}

#[test]
fn non_mergeable_same_file_collision_keeps_last_with_diagnostic() {
    // M3 (Objective 3 wave 4 find j): alias+alias and mixed-kind same-file
    // collisions are tsc-error shapes — keep the deterministic last
    // survivor and emit a diagnostic naming the symbol and the kinds.
    let scanned = workspace(&[(
        "src/widgets.ts",
        "export type Dup = string;\nexport type Dup = number;\n\nexport interface Mix {\n  a: string\n}\nexport type Mix = number;\n",
    )]);
    let graph = resolve_ast(extract_ast(&scanned));

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
        assert_eq!(diagnostic.file_id, "src/widgets.ts");
    }
    let messages = graph
        .diagnostics
        .iter()
        .map(|d| d.message.as_str())
        .collect::<Vec<_>>()
        .join("\n");
    assert!(
        messages.contains("\"Dup\"")
            && messages.contains("TypeAlias + TypeAlias")
            && messages.contains("\"Mix\"")
            && messages.contains("Interface + TypeAlias"),
        "unexpected diagnostics: {messages}"
    );
}

#[test]
fn star_ambiguous_name_excluded_from_barrel_with_diagnostic() {
    // Objective 3 wave 6 find q: a name provided by two `export *` targets
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
    let graph = resolve_ast(extract_ast(&scanned));

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
    assert_eq!(graph.diagnostics[0].file_id, "src/barrel.ts");
    let message = graph.diagnostics[0].message.as_str();
    assert!(
        message.contains("\"Widget\"")
            && message.contains("src/a.ts")
            && message.contains("src/b.ts"),
        "unexpected diagnostic: {message}"
    );
}

#[test]
fn star_diamond_same_binding_still_resolves() {
    // Negative pin (wave 6 find q, edge rule a): the same symbol id through
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
    let graph = resolve_ast(extract_ast(&scanned));
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
    // Negative pin (wave 6 find q, edge rule b): explicit local bindings
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
    let graph = resolve_ast(extract_ast(&scanned));
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
