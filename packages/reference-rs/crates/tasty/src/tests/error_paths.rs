//! Error-path coverage for scan → bundle: parse failures, unresolved imports, bad package.json, and cyclic re-exports.

use super::super::model::TypeRef;
use super::super::{scan_typescript_bundle, ScanRequest};

use super::fixtures::TempDir;

#[test]
fn parse_error_surfaces_in_diagnostics() {
    let root = TempDir::new("tasty-error-parse");
    root.write("src/broken.ts", "export interface { broken\n");

    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: root.path().to_path_buf(),
        include: vec!["src/**/*.ts".to_string()],
    })
    .expect("scan should complete");

    assert!(
        bundle
            .diagnostics
            .iter()
            .any(|d| d.message.contains("parse reported")),
        "expected parse diagnostic, got {:?}",
        bundle.diagnostics
    );
}

#[test]
fn missing_relative_import_leaves_target_unresolved() {
    let root = TempDir::new("tasty-error-missing-import");
    root.write(
        "src/root.ts",
        "import type { Missing } from './nonexistent';\nexport interface Root { x: Missing }\n",
    );

    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: root.path().to_path_buf(),
        include: vec!["src/**/*.ts".to_string()],
    })
    .expect("scan should complete");

    let root_symbol = bundle
        .symbols
        .values()
        .find(|s| s.name == "Root")
        .expect("Root symbol");
    let member = root_symbol
        .defined_members
        .iter()
        .find(|m| m.name == "x")
        .expect("member x");
    let type_ref = member.type_ref.as_ref().expect("member should have a type");

    match type_ref {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Missing");
            assert!(
                target_id.is_none(),
                "unresolved import should have no target_id"
            );
        }
        other => panic!("expected Reference to Missing, got {other:?}"),
    }
}

#[test]
fn malformed_package_json_does_not_panic_and_skips_unresolvable_package() {
    let root = TempDir::new("tasty-error-bad-package-json");
    root.write("src/index.ts", "export type { T } from 'bad-lib';\n");
    root.write("node_modules/bad-lib/package.json", "{bad");

    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: root.path().to_path_buf(),
        include: vec!["src/**/*.ts".to_string()],
    })
    .expect("scan should complete");

    assert!(
        !bundle
            .symbols
            .values()
            .any(|s| s.library == "bad-lib"),
        "bad-lib should not contribute symbols when package metadata is unusable and no index exists"
    );
}

#[test]
fn circular_type_reexports_terminate() {
    let root = TempDir::new("tasty-error-circular-reexport");
    root.write(
        "src/a.ts",
        "export type { B } from './b';\nexport type A = string;\n",
    );
    root.write(
        "src/b.ts",
        "export type { A } from './a';\nexport type B = string;\n",
    );

    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: root.path().to_path_buf(),
        include: vec!["src/**/*.ts".to_string()],
    })
    .expect("scan should complete");

    assert!(
        bundle.symbols.values().any(|s| s.name == "A")
            && bundle.symbols.values().any(|s| s.name == "B"),
        "expected both symbols from cyclic re-export graph, got {} symbols",
        bundle.symbols.len()
    );
}
