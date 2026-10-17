//! Cross-library boundary tests for the workspace scan: scoped dev-dependency imports, same-library relative imports,
//! and the external-module imports a library may not reach across. Each case lays out a temporary workspace and scans it.

use super::super::scan_workspace;
use crate::tests::fixtures::TempDir;

#[test]
fn scan_workspace_skips_scoped_dev_dependency_plain_imports() {
    // Dev-only packages are never followed, even when scoped: `@types`
    // imports stay local exactly like unscoped plain imports.
    let root = TempDir::new("scanner-workspace-scoped-dev-import");
    root.write(
        "src/index.ts",
        "import type { Process } from '@types/node';\nexport interface Local {}\n",
    );
    root.write(
        "node_modules/@types/node/package.json",
        r#"{ "name": "@types/node", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@types/node/index.d.ts",
        "export interface Process { pid: number }\n",
    );

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert_eq!(workspace.files.len(), 1);
    assert!(!workspace
        .files
        .iter()
        .any(|file| file.file_id == "node_modules/@types/node/index.d.ts"));
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
    // Contract restoration: the scan boundary in
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
    // Contract restoration: same-package-only
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
