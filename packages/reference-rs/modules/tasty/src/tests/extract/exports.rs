//! Export-binding tests for `ast::extract`: named re-exports, type-only exports from packages and local modules, library export lists that materialize a local closure, and default-exported interfaces. Each case extracts an in-memory workspace and checks the export bindings and shells it produces.

use crate::ast::extract_ast;

use super::{workspace, single_file, single_library_file, parsed_file};

#[test]
fn named_reexport_populates_export_bindings() {
    let scanned = workspace(&[
        ("src/other.ts", "export interface X { x: number }\n"),
        ("src/index.ts", "export { X } from './other'\n"),
    ]);
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let index = parsed_file(&ast, "src/index.ts");
    assert_eq!(index.export_bindings.get("X"), Some(&"X".to_string()));
}

#[test]
fn export_type_from_package_does_not_add_local_type_alias_shell() {
    let scanned = single_file("src/index.ts", "export type { T } from 'pkg';\n");
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let index = parsed_file(&ast, "src/index.ts");
    assert!(index.exports.iter().all(|s| s.name != "T"));
    assert!(index.import_bindings.get("T").is_none());
}

#[test]
fn export_type_from_local_module_skips_synthetic_type_alias_shell() {
    let scanned = workspace(&[
        ("src/other.ts", "export type T = string;\n"),
        ("src/index.ts", "export type { T } from './other';\n"),
    ]);
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let index = parsed_file(&ast, "src/index.ts");
    assert!(
        index.exports.iter().all(|s| s.name != "T"),
        "local same-project type re-exports should not synthesize duplicate alias shells"
    );
    assert!(index.import_bindings.get("T").is_none());
}

#[test]
fn library_export_list_materializes_local_type_closure() {
    let scanned = single_library_file(
        "node_modules/fancy-lib/index.d.mts",
        "fancy-lib",
        "fancy-lib",
        "type Shared = { label: string }\n\
         type ButtonProps = Shared & { size?: number }\n\
         export { type ButtonProps }\n",
    );
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "node_modules/fancy-lib/index.d.mts");

    let shared = file
        .exports
        .iter()
        .find(|shell| shell.name == "Shared")
        .expect("local helper shell should be materialized");
    let button_props = file
        .exports
        .iter()
        .find(|shell| shell.name == "ButtonProps")
        .expect("exported local type should be materialized");

    assert!(!shared.exported);
    assert!(button_props.exported);
}

#[test]
fn default_export_interface_registers_binding_and_export() {
    let scanned = single_file(
        "test.ts",
        "export default interface DefaultExport { n: number }\n",
    );
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    assert_eq!(
        file.export_bindings.get("default"),
        Some(&"DefaultExport".to_string())
    );
    let shell = file
        .exports
        .iter()
        .find(|s| s.name == "DefaultExport")
        .expect("default export interface");
    assert!(shell.exported);
}
