//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

use super::scan_workspace;
use crate::tests::fixtures::TempDir;
use std::fs;

#[test]
fn scan_workspace_follows_user_reexports_of_external_modules() {
    let root = TempDir::new("scanner-workspace-reexports");
    root.write(
        "src/index.ts",
        "export type { ButtonProps } from 'external-lib';\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "src/index.ts"));
    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/external-lib/index.d.ts"));
}

#[test]
fn scan_workspace_skips_user_external_imports_without_reexport_bridge() {
    // Contract restoration (Objective 3 wave 1 find c): the scan boundary in
    // the scanner README states a user file that only `import`s from a library
    // does not cause that library to be scanned. Formerly
    // `scan_workspace_includes_user_external_imports_for_reference_docs`, which
    // pinned the loosened behavior; the bridge test above
    // (`scan_workspace_follows_user_reexports_of_external_modules`) pins the
    // positive half of the same boundary.
    let root = TempDir::new("scanner-workspace-import-only");
    root.write(
        "src/index.ts",
        "import type { ButtonProps } from 'external-lib';\nexport interface Local {}\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    // No re-export bridge: the external library stays out of the scan graph.
    assert_eq!(workspace.files.len(), 1);
    let file_ids: Vec<&str> = workspace.files.iter().map(|f| f.file_id.as_str()).collect();
    assert!(file_ids.contains(&"src/index.ts"));
    assert!(!file_ids.contains(&"node_modules/external-lib/index.d.ts"));
}

#[test]
fn scan_workspace_follows_same_library_relative_imports_for_external_modules() {
    let root = TempDir::new("scanner-workspace-external-relative");
    root.write(
        "src/index.ts",
        "export type { ButtonProps } from 'external-lib';\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export type { SharedProps as ButtonProps } from './shared';\n",
    );
    root.write(
        "node_modules/external-lib/shared.d.ts",
        "export interface SharedProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/external-lib/index.d.ts"));
    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/external-lib/shared.d.ts"));
}

#[test]
fn scan_workspace_rejects_cross_library_external_imports_from_external_modules() {
    // Contract restoration (Objective 3 wave 1 find c): the scan boundary in
    // the scanner README states that from a library file we only follow
    // imports staying within the same package. Formerly
    // `scan_workspace_follows_cross_library_external_imports_from_external_modules`,
    // which pinned the depth-2 cross-package allowance.
    let root = TempDir::new("scanner-workspace-external-cross-library");
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

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/@reference-ui/react/react.d.mts"));
    assert!(!workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/react/index.d.ts"));
}

#[test]
fn scan_workspace_rejects_transitive_cross_library_external_imports() {
    // Contract restoration (Objective 3 wave 1 find c): same-package-only
    // from library files, so the very first cross-library hop already ends
    // the walk — even when the hop is itself a re-export. Formerly
    // `scan_workspace_limits_transitive_cross_library_external_imports`, which
    // pinned the depth-2 cross-package allowance.
    let root = TempDir::new("scanner-workspace-external-cross-library-depth-limit");
    root.write("src/index.ts", "export type { A } from 'alpha-lib';\n");
    root.write(
        "node_modules/alpha-lib/package.json",
        r#"{ "name": "alpha-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/alpha-lib/index.d.ts",
        "export type { B as A } from 'beta-lib';\n",
    );
    root.write(
        "node_modules/beta-lib/package.json",
        r#"{ "name": "beta-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/beta-lib/index.d.ts",
        "export type { C as B } from 'gamma-lib';\n",
    );
    root.write(
        "node_modules/gamma-lib/package.json",
        r#"{ "name": "gamma-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/gamma-lib/index.d.ts",
        "export interface C { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/alpha-lib/index.d.ts"));
    assert!(!workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/beta-lib/index.d.ts"));
    assert!(!workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/gamma-lib/index.d.ts"));
}

#[test]
fn scan_workspace_follows_external_reexports_when_node_modules_is_above_root() {
    let root = TempDir::new("scanner-workspace-parent-node-modules");
    root.write(
        ".reference-ui/virtual/src/index.ts",
        "export type { ButtonProps } from 'external-lib';\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );
    fs::create_dir_all(root.path().join(".reference-ui/virtual/src")).expect("mkdir virtual src");

    let workspace = scan_workspace(
        root.path().join(".reference-ui/virtual").as_path(),
        &["src/**/*.ts".to_string()],
    )
    .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "../../node_modules/external-lib/index.d.ts"));
}

#[test]
fn scan_workspace_does_not_treat_globbed_node_modules_files_as_user_entry_points() {
    // Contract restoration (Objective 3 wave 1 find c): this test previously
    // relied on the loosened policy (plain user imports followed) to bring
    // the external file into the graph. Under the README boundary the
    // external file enters via the re-export bridge instead; the pin — that a
    // `**/*.ts` glob never promotes a node_modules file to a user entry
    // point — is unchanged.
    let root = TempDir::new("scanner-workspace-skip-globbed-node-modules");
    root.write(
        "src/index.ts",
        "export type { ButtonProps } from 'external-lib';\nexport interface Local {}\n",
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert_eq!(workspace.files.len(), 2);
    let external = workspace
        .files
        .iter()
        .find(|file| file.file_id == "node_modules/external-lib/index.d.ts")
        .expect("expected external-lib declaration file");
    assert_eq!(external.library, "external-lib");
}

#[test]
fn scan_workspace_ignores_stylesheet_imports_during_discovery() {
    let root = TempDir::new("scanner-workspace-ignore-stylesheets");
    root.write(
        "src/index.ts",
        "import './styles.css';\nexport type { ButtonProps } from 'external-lib';\n",
    );
    root.write("src/styles.css", ".button { color: red; }\n");
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export interface ButtonProps { label: string }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "src/index.ts"));
    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/external-lib/index.d.ts"));
    assert!(!workspace
        .files
        .iter()
        .any(|file| file.file_id == "src/styles.css"));
}
