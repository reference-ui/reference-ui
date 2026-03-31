use std::collections::BTreeSet;
use std::fs;

use super::{resolve_external_import, resolve_relative_import, FileLookup};
use crate::tasty::scanner::paths::split_package_specifier;
#[cfg(unix)]
use crate::tasty::scanner::workspace::scan_workspace;
use crate::tasty::tests::fixtures::TempDir;

#[test]
fn relative_import_prefers_declaration_candidates_for_runtime_entries() {
    let root = TempDir::new("scanner-packages-relative");
    let file_ids = BTreeSet::from(["src/button.d.ts".to_string(), "src/index.ts".to_string()]);

    let resolved =
        resolve_relative_import(
            root.path(),
            "src/index.ts",
            "./button.js",
            &file_ids,
            FileLookup::Denied,
        );

    assert_eq!(resolved.as_deref(), Some("src/button.d.ts"));
}

#[test]
fn external_import_uses_types_exports_for_root_and_subpath() {
    let root = TempDir::new("scanner-packages-exports");
    root.write(
        "node_modules/fancy-lib/package.json",
        r#"{
              "name": "fancy-lib",
              "exports": {
                ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
                "./tokens": { "types": "./dist/tokens.d.ts", "default": "./dist/tokens.js" }
              }
            }"#,
    );
    root.write(
        "node_modules/fancy-lib/dist/index.d.ts",
        "export interface Button {}\n",
    );
    root.write(
        "node_modules/fancy-lib/dist/tokens.d.ts",
        "export interface Tokens {}\n",
    );

    let root_entry =
        resolve_external_import(root.path(), "fancy-lib").expect("root entry should resolve");
    assert_eq!(
        root_entry.file_id,
        "node_modules/fancy-lib/./dist/index.d.ts"
    );
    assert_eq!(root_entry.module_specifier, "fancy-lib");
    assert_eq!(root_entry.library, "fancy-lib");

    let subpath = resolve_external_import(root.path(), "fancy-lib/tokens")
        .expect("subpath entry should resolve");
    assert_eq!(subpath.file_id, "node_modules/fancy-lib/./dist/tokens.d.ts");
    assert_eq!(subpath.module_specifier, "fancy-lib/tokens");
    assert_eq!(subpath.library, "fancy-lib");
}

#[test]
fn external_import_falls_back_to_installed_types_provider() {
    let root = TempDir::new("scanner-packages-types-provider");
    root.write(
        "node_modules/@types/json-schema/package.json",
        r#"{ "name": "@types/json-schema", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@types/json-schema/index.d.ts",
        "export interface JSONSchema4 {}\n",
    );

    let resolved =
        resolve_external_import(root.path(), "json-schema").expect("types provider should resolve");
    assert_eq!(
        resolved.file_id,
        "node_modules/@types/json-schema/index.d.ts"
    );
    assert_eq!(resolved.module_specifier, "json-schema");
    assert_eq!(resolved.library, "json-schema");
}

#[test]
fn external_import_walks_parent_node_modules_dirs() {
    let root = TempDir::new("scanner-packages-parent-node-modules");
    root.write(
        "node_modules/fancy-lib/package.json",
        r#"{ "name": "fancy-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/fancy-lib/index.d.ts",
        "export interface ButtonProps {}\n",
    );
    fs::create_dir_all(root.path().join(".reference-ui/virtual/src")).expect("mkdir virtual src");

    let nested_root = root.path().join(".reference-ui/virtual");
    let resolved = resolve_external_import(&nested_root, "fancy-lib")
        .expect("parent node_modules package should resolve");

    assert_eq!(resolved.file_id, "../../node_modules/fancy-lib/index.d.ts");
    assert_eq!(resolved.module_specifier, "fancy-lib");
    assert_eq!(resolved.library, "fancy-lib");
}

#[test]
fn external_import_walks_parent_node_modules_for_types_provider() {
    let root = TempDir::new("scanner-packages-parent-types-provider");
    root.write(
        "node_modules/@types/json-schema/package.json",
        r#"{ "name": "@types/json-schema", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@types/json-schema/index.d.ts",
        "export interface JSONSchema4 {}\n",
    );
    fs::create_dir_all(root.path().join(".reference-ui/virtual/src")).expect("mkdir virtual src");

    let nested_root = root.path().join(".reference-ui/virtual");
    let resolved = resolve_external_import(&nested_root, "json-schema")
        .expect("parent node_modules types provider should resolve");

    assert_eq!(resolved.file_id, "../../node_modules/@types/json-schema/index.d.ts");
    assert_eq!(resolved.module_specifier, "json-schema");
    assert_eq!(resolved.library, "json-schema");
}

#[test]
fn split_package_specifier_handles_scoped_package_and_subpath() {
    assert_eq!(
        split_package_specifier("@acme/widgets"),
        Some(("@acme/widgets".to_string(), None))
    );
    assert_eq!(
        split_package_specifier("@acme/widgets/button"),
        Some(("@acme/widgets".to_string(), Some("button".to_string())))
    );
    assert_eq!(
        split_package_specifier("@acme/widgets/nested/deep"),
        Some(("@acme/widgets".to_string(), Some("nested/deep".to_string())))
    );
}

#[test]
fn external_import_resolves_deep_exports_subpath() {
    let root = TempDir::new("scanner-packages-deep-exports");
    root.write(
        "node_modules/deep-lib/package.json",
        r#"{
              "name": "deep-lib",
              "exports": {
                "./a/b/c": { "types": "./types/deep.d.ts", "import": "./dist/deep.js" }
              }
            }"#,
    );
    root.write(
        "node_modules/deep-lib/types/deep.d.ts",
        "export interface DeepMarker {}\n",
    );

    let resolved = resolve_external_import(root.path(), "deep-lib/a/b/c").expect("deep subpath");
    assert_eq!(
        resolved.file_id,
        "node_modules/deep-lib/./types/deep.d.ts"
    );
    assert_eq!(resolved.module_specifier, "deep-lib/a/b/c");
    assert_eq!(resolved.library, "deep-lib");
}

#[test]
fn external_import_falls_back_to_main_when_no_types_or_exports() {
    let root = TempDir::new("scanner-packages-main-only");
    root.write(
        "node_modules/main-only-lib/package.json",
        r#"{
              "name": "main-only-lib",
              "main": "./lib/index.js"
            }"#,
    );
    root.write(
        "node_modules/main-only-lib/lib/index.js",
        "export const x = 1;\n",
    );
    root.write(
        "node_modules/main-only-lib/lib/index.d.ts",
        "export interface MainOnly {}\n",
    );

    let resolved =
        resolve_external_import(root.path(), "main-only-lib").expect("main fallback should resolve");
    assert_eq!(
        resolved.file_id,
        "node_modules/main-only-lib/./lib/index.d.ts"
    );
    assert_eq!(resolved.module_specifier, "main-only-lib");
}

#[test]
fn external_import_returns_none_when_package_has_no_resolvable_entry() {
    let root = TempDir::new("scanner-packages-missing-entry");
    root.write(
        "node_modules/missing-entry-pkg/package.json",
        r#"{
              "name": "missing-entry-pkg",
              "types": "./does-not-exist.d.ts",
              "main": "./also-missing.js"
            }"#,
    );

    assert!(
        resolve_external_import(root.path(), "missing-entry-pkg").is_none(),
        "expected None when no declaration entry exists on disk"
    );
}

/// `GlobWalkerBuilder::follow_links(true)` must see sources reached only via symlinks.
#[cfg(unix)]
#[test]
fn scan_workspace_discovers_symlinked_source_under_glob() {
    let root = TempDir::new("scanner-packages-globwalk-symlink");
    root.write("vendor/real.ts", "export const v = 1;\n");
    let target = root.path().join("vendor/real.ts");
    let link_path = root.path().join("src/linked.ts");
    fs::create_dir_all(link_path.parent().expect("src parent")).expect("mkdir src");
    std::os::unix::fs::symlink(&target, &link_path).expect("symlink");

    let workspace = scan_workspace(root.path(), &["src/**/*.ts".to_string()])
        .expect("workspace scan should succeed");

    assert!(
        workspace
            .files
            .iter()
            .any(|f| f.file_id == "src/linked.ts"),
        "expected glob walk to follow symlink into src/: {:?}",
        workspace.files.iter().map(|f| &f.file_id).collect::<Vec<_>>()
    );
}

/// Scoped installs are often symlinked; `package_dir.is_dir()` must follow the link.
#[cfg(unix)]
#[test]
fn external_import_resolves_scoped_package_via_symlinked_node_modules_path() {
    let root = TempDir::new("scanner-packages-symlink-scope");
    root.write(
        "vendor_scope/pkg/package.json",
        r#"{ "name": "@scope/pkg", "types": "index.d.ts" }"#,
    );
    root.write(
        "vendor_scope/pkg/index.d.ts",
        "export interface Symlinked {}\n",
    );
    fs::create_dir_all(root.path().join("node_modules/@scope")).expect("mkdir scope");
    let real = root.path().join("vendor_scope/pkg");
    let link = root.path().join("node_modules/@scope/pkg");
    std::os::unix::fs::symlink(&real, &link).expect("symlink scoped package");

    let resolved = resolve_external_import(root.path(), "@scope/pkg").expect("scoped via symlink");
    assert_eq!(
        resolved.file_id,
        "node_modules/@scope/pkg/index.d.ts"
    );
    assert_eq!(resolved.module_specifier, "@scope/pkg");
}
