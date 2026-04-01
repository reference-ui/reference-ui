//! Unit tests for `ast::resolve` — `ParsedTypeScriptAst` → `ResolvedTypeScriptGraph`.
//!
//! Builds realistic `ParsedTypeScriptAst` via `extract_ast` on in-memory workspaces so
//! import bindings and symbol shells match what the parser emits.

use std::collections::BTreeSet;
use std::path::PathBuf;

use crate::tasty::ast::{extract_ast, resolve_ast};
use crate::tasty::model::TypeRef;
use crate::tasty::scanner::{scan_workspace, symbol_id, ScannedFile, ScannedWorkspace};

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
fn resolves_cross_library_external_import_reference() {
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

    let Some(TypeRef::Reference { name, target_id, .. }) = primitive_native_props.underlying.as_ref() else {
        panic!("expected underlying reference, got {:?}", primitive_native_props.underlying);
    };

    assert_eq!(name, "ComponentPropsWithoutRef");
    let expected = symbol_id("node_modules/react/index.d.ts", "ComponentPropsWithoutRef");
    assert_eq!(target_id.as_deref(), Some(expected.as_str()));
}
