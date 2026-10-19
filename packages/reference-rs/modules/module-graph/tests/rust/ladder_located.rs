//! Located ladder: a `node_modules` hit names the package directory it came through.
//!
//! [`SpecifierLadder::resolve_located`] probes exactly as `resolve` does and
//! returns the same key; a hit through `node_modules` also carries the package
//! directory, canonicalized, so a linked workspace package names its real home
//! and a scoped store link names the store. Relative and `tsconfig` hits carry
//! none. `package_export_targets` reads one `exports` subpath without disk.

mod common;

use module_graph::{
    package_export_targets, ExtensionPolicy, MemoryFs, ModuleKey, SpecifierLadder,
    TsconfigPolicy,
};

/// Resolve from `/p/src/app.ts`, following `tsconfig`: the key and the package dir.
fn located(fs: &MemoryFs, specifier: &str) -> Option<(String, Option<String>)> {
    let ladder =
        SpecifierLadder::new(fs, ExtensionPolicy::Source).with_tsconfig(TsconfigPolicy::Follow);
    let from = ModuleKey::new("/p/src/app.ts");
    let hit = ladder.resolve_located(&from, specifier).ok()?;
    let plain = ladder.resolve(&from, specifier).ok()?;
    assert_eq!(hit.key, plain, "{specifier}: both resolvers agree on the key");
    Some((hit.key.as_str().to_string(), hit.package_dir))
}

#[test]
fn linked_workspace_packages_name_their_real_dir() {
    let mut fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        (
            "/p/packages/ui/package.json",
            r#"{"name":"@acme/ui","main":"./src/index.ts"}"#,
        ),
        ("/p/packages/ui/src/index.ts", "ui"),
    ]);
    fs.symlink("/p/node_modules/@acme/ui", "/p/packages/ui");
    assert_eq!(
        located(&fs, "@acme/ui"),
        Some((
            "/p/packages/ui/src/index.ts".into(),
            Some("/p/packages/ui".into())
        ))
    );
}

#[test]
fn scoped_store_links_name_the_store_dir() {
    let mut fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/store/@scope/pkg/index.ts", "p"),
    ]);
    fs.symlink("/p/node_modules/@scope", "/store/@scope");
    assert_eq!(
        located(&fs, "@scope/pkg/index"),
        Some((
            "/store/@scope/pkg/index.ts".into(),
            Some("/store/@scope/pkg".into())
        ))
    );
}

#[test]
fn types_fallback_names_the_types_dir() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        (
            "/p/node_modules/@types/only-types/package.json",
            r#"{"types":"./index.d.ts"}"#,
        ),
        ("/p/node_modules/@types/only-types/index.d.ts", "d"),
    ]);
    assert_eq!(
        located(&fs, "only-types"),
        Some((
            "/p/node_modules/@types/only-types/index.d.ts".into(),
            Some("/p/node_modules/@types/only-types".into())
        ))
    );
}

#[test]
fn relative_and_tsconfig_hits_carry_no_dir() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/src/ui.ts", "ui"),
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"paths":{"@/*":["./src/*"]}}}"#,
        ),
    ]);
    assert_eq!(
        located(&fs, "./ui"),
        Some(("/p/src/ui.ts".into(), None))
    );
    assert_eq!(located(&fs, "@/ui"), Some(("/p/src/ui.ts".into(), None)));
    assert_eq!(located(&fs, "missing-pkg"), None);
}

#[test]
fn export_targets_read_one_subpath() {
    let manifest = r#"{"exports":{
        ".":{"types":"./dist/index.d.ts","import":"./dist/index.mjs"},
        "./baseSystem":{"types":"./.reference-ui/system/baseSystem.d.mts","import":"./.reference-ui/system/baseSystem.mjs"},
        "./flat":"./flat.mjs"
    }}"#;
    assert_eq!(
        package_export_targets(manifest, "./baseSystem"),
        vec![
            "./.reference-ui/system/baseSystem.mjs".to_string(),
            "./.reference-ui/system/baseSystem.d.mts".to_string()
        ]
    );
    assert_eq!(
        package_export_targets(manifest, "./flat"),
        vec!["./flat.mjs".to_string()]
    );
    assert!(package_export_targets(manifest, "./missing").is_empty());
    assert!(package_export_targets("not json", "./baseSystem").is_empty());
}
