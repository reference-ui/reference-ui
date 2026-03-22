//! Unit tests for `ast::resolve` — `ParsedTypeScriptAst` → `ResolvedTypeScriptGraph`.
//!
//! Builds realistic `ParsedTypeScriptAst` via `extract_ast` on in-memory workspaces so
//! import bindings and symbol shells match what the parser emits.

use std::collections::BTreeSet;
use std::path::PathBuf;

use crate::tasty::ast::{extract_ast, resolve_ast};
use crate::tasty::model::TypeRef;
use crate::tasty::scanner::{symbol_id, ScannedFile, ScannedWorkspace};

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
            name,
            target_id,
            ..
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
            name,
            target_id,
            ..
        } => {
            assert_eq!(name, "LocalA");
            assert_eq!(target_id.as_ref(), Some(&expected));
        }
        other => panic!("expected Reference to LocalA, got {other:?}"),
    }
}
