use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use super::{resolve_external_import, resolve_relative_import};

struct TempDir {
    path: PathBuf,
}

impl TempDir {
    fn new(prefix: &str) -> Self {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time should move forward")
            .as_nanos();
        let path = std::env::temp_dir().join(format!("reference-ui-{prefix}-{unique}"));
        fs::create_dir_all(&path).expect("temp dir should be created");
        Self { path }
    }

    fn path(&self) -> &Path {
        &self.path
    }

    fn write(&self, relative_path: &str, contents: &str) {
        let path = self.path.join(relative_path);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).expect("parent dir should be created");
        }
        fs::write(path, contents).expect("fixture file should be written");
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}

#[test]
fn relative_import_prefers_declaration_candidates_for_runtime_entries() {
    let root = TempDir::new("scanner-packages-relative");
    let file_ids = BTreeSet::from(["src/button.d.ts".to_string(), "src/index.ts".to_string()]);

    let resolved = resolve_relative_import(
        root.path(),
        "src/index.ts",
        "./button.js",
        &file_ids,
        false,
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
    root.write("node_modules/fancy-lib/dist/index.d.ts", "export interface Button {}\n");
    root.write("node_modules/fancy-lib/dist/tokens.d.ts", "export interface Tokens {}\n");

    let root_entry =
        resolve_external_import(root.path(), "fancy-lib").expect("root entry should resolve");
    assert_eq!(root_entry.file_id, "node_modules/fancy-lib/./dist/index.d.ts");
    assert_eq!(root_entry.module_specifier, "fancy-lib");
    assert_eq!(root_entry.library, "fancy-lib");

    let subpath =
        resolve_external_import(root.path(), "fancy-lib/tokens").expect("subpath entry should resolve");
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
    root.write("node_modules/@types/json-schema/index.d.ts", "export interface JSONSchema4 {}\n");

    let resolved =
        resolve_external_import(root.path(), "json-schema").expect("types provider should resolve");
    assert_eq!(resolved.file_id, "node_modules/@types/json-schema/index.d.ts");
    assert_eq!(resolved.module_specifier, "json-schema");
    assert_eq!(resolved.library, "json-schema");
}
