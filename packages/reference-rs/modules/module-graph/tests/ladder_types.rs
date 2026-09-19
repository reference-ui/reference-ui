//! `@types` ladder: declaration fallback for untyped packages.
//!
//! Tasty's fallback win, adopted: when no package dir answers, the ladder
//! tries the DefinitelyTyped shadow — `@types/<pkg>`, or `@types/<scope>__`
//! `<name>` for scoped packages — resolving its root entry the same way. The
//! fallback is root-only: subpaths never consult it.

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
fn untyped_packages_fall_back_to_types() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        (
            "/p/node_modules/@types/only-types/package.json",
            r#"{"types":"./index.d.ts"}"#,
        ),
        ("/p/node_modules/@types/only-types/index.d.ts", "d"),
    ]);
    assert_eq!(
        resolve(&fs, "only-types"),
        Ok("/p/node_modules/@types/only-types/index.d.ts".into())
    );
}

#[test]
fn scoped_packages_map_to_double_underscore() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/node_modules/@types/scope__pkg/index.d.ts", "d"),
    ]);
    assert_eq!(
        resolve(&fs, "@scope/pkg"),
        Ok("/p/node_modules/@types/scope__pkg/index.d.ts".into())
    );
}

#[test]
fn real_packages_beat_their_types_shadow() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/node_modules/pkg/index.ts", "real"),
        ("/p/node_modules/@types/pkg/index.d.ts", "shadow"),
    ]);
    assert_eq!(
        resolve(&fs, "pkg"),
        Ok("/p/node_modules/pkg/index.ts".into())
    );
}

#[test]
fn types_fallback_is_root_only() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/node_modules/@types/pkg/index.d.ts", "d"),
    ]);
    assert_eq!(resolve(&fs, "pkg/sub"), Err("pkg/sub".into()));
}
