//! Symlink ladder: linked packages share one canonical key.
//!
//! Resolution follows links and canonicalizes every hit, so a symlinked
//! package and its real path are the same module. Dangling links miss —
//! the SITE-58 wipe-state shape — and loops fail closed instead of hanging.

mod common;

use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, SpecifierLadder};

/// Resolve from `/p/src/app.ts` under the Source policy.
fn resolve(fs: &MemoryFs, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source);
    ladder
        .resolve(&ModuleKey::new("/p/src/app.ts"), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

#[test]
fn linked_package_dirs_resolve_to_real_paths() {
    let mut fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        (
            "/real/linked-pkg/package.json",
            r#"{"types":"./index.d.ts"}"#,
        ),
        ("/real/linked-pkg/index.d.ts", "d"),
    ]);
    fs.symlink("/p/node_modules/linked-pkg", "/real/linked-pkg");
    assert_eq!(
        resolve(&fs, "linked-pkg"),
        Ok("/real/linked-pkg/index.d.ts".into())
    );
}

#[test]
fn symlinked_node_modules_paths_resolve() {
    let mut fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/store/@scope/pkg/index.ts", "p"),
    ]);
    fs.symlink("/p/node_modules/@scope", "/store/@scope");
    assert_eq!(
        resolve(&fs, "@scope/pkg"),
        Ok("/store/@scope/pkg/index.ts".into())
    );
}

#[test]
fn file_symlinks_resolve_to_targets() {
    let mut fs = common::fs(&[("/p/src/app.ts", "app"), ("/p/src/real.ts", "r")]);
    fs.symlink("/p/src/alias.ts", "/p/src/real.ts");
    assert_eq!(resolve(&fs, "./alias"), Ok("/p/src/real.ts".into()));
}

#[test]
fn dangling_links_miss_like_missing_files() {
    let mut fs = common::fs(&[("/p/src/app.ts", "app")]);
    fs.symlink("/p/node_modules/gone", "/nowhere/gone");
    assert_eq!(resolve(&fs, "gone"), Err("gone".into()));
    assert_eq!(resolve(&fs, "gone/sub"), Err("gone/sub".into()));
}
