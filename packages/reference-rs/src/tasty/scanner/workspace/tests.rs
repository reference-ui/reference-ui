use super::scan_workspace;
use crate::tasty::tests::fixtures::TempDir;
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
fn scan_workspace_skips_user_external_imports_that_are_not_reexported() {
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

    assert_eq!(workspace.files.len(), 1);
    assert_eq!(workspace.files[0].file_id, "src/index.ts");
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

    let workspace = scan_workspace(root.path().join(".reference-ui/virtual").as_path(), &[
        "src/**/*.ts".to_string(),
    ])
    .expect("workspace scan should succeed");

    assert!(workspace
        .files
        .iter()
        .any(|file| file.file_id == "../../node_modules/external-lib/index.d.ts"));
}
