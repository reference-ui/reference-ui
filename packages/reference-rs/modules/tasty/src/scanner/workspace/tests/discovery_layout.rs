//! Discovery and layout tests for the workspace scan: external re-exports when `node_modules` sits above the root, barrel
//! hops above an output-directory layout, globbed `node_modules` files, and stylesheet imports. Each case lays out a temporary
//! workspace and scans it.

use std::fs;

use super::super::scan_workspace;
use crate::tests::fixtures::TempDir;

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
fn scan_workspace_follows_barrel_hops_above_outdir_layout_roots() {
    // Regression pin (Objective 1 RS fix): in outDir-layout scans the
    // followed barrel's file id starts with `..`, and relative hops from it
    // must resolve against that escape — not against a bogus in-root path.
    let root = TempDir::new("scanner-workspace-outdir-barrel");
    root.write(
        ".reference-ui/virtual/src/index.ts",
        "import type { Widget } from '@scope/pkg';\nexport interface Local { widget?: Widget }\n",
    );
    root.write(
        "node_modules/@scope/pkg/package.json",
        r#"{ "name": "@scope/pkg", "types": "./pkg.d.mts" }"#,
    );
    root.write(
        "node_modules/@scope/pkg/pkg.d.mts",
        "export * from './entry/thing';\n",
    );
    root.write(
        "node_modules/@scope/pkg/entry/thing.d.ts",
        "export interface Widget { label: string }\n",
    );

    let workspace = scan_workspace(
        root.path().join(".reference-ui").as_path(),
        &["virtual/src/**/*.ts".to_string()],
    )
    .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "../node_modules/@scope/pkg/pkg.d.mts"));
    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "../node_modules/@scope/pkg/entry/thing.d.ts"));
}

#[test]
fn scan_workspace_does_not_treat_globbed_node_modules_files_as_user_entry_points() {
    // Contract restoration: this test previously
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
