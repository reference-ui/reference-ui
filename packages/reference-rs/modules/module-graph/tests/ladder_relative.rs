//! Relative-specifier ladder: joins, extension order, and index order.
//!
//! Every relative rung over a MemoryFs tree: explicit extensions hit
//! directly, extensionless probes prefer `.ts` over `.tsx` over `.js`, and
//! directory imports land on ordered index spellings. Bare and absolute
//! specifiers miss here — the node rung owns those.

mod common;

use module_graph::{ExtensionPolicy, ModuleKey, SpecifierLadder};

/// Resolve from `/p/src/app.ts` under the Source policy.
fn resolve(fs: &module_graph::MemoryFs, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source);
    let from = ModuleKey::new("/p/src/app.ts");
    ladder
        .resolve(&from, specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

#[test]
fn explicit_extensions_hit_directly() {
    let fs = common::fs(&[("/p/src/tokens.ts", "t")]);
    assert_eq!(resolve(&fs, "./tokens.ts"), Ok("/p/src/tokens.ts".into()));
    assert_eq!(resolve(&fs, "./missing.ts"), Err("./missing.ts".into()));
}

#[test]
fn extensionless_prefers_ts_over_tsx_over_js() {
    let fs = common::fs(&[
        ("/p/src/a.ts", "a"),
        ("/p/src/a.tsx", "ax"),
        ("/p/src/a.js", "aj"),
        ("/p/src/b.tsx", "b"),
        ("/p/src/b.js", "bj"),
        ("/p/src/c.js", "c"),
    ]);
    assert_eq!(resolve(&fs, "./a"), Ok("/p/src/a.ts".into()));
    assert_eq!(resolve(&fs, "./b"), Ok("/p/src/b.tsx".into()));
    assert_eq!(resolve(&fs, "./c"), Ok("/p/src/c.js".into()));
}

#[test]
fn jsx_and_mts_spellings_probe() {
    let fs = common::fs(&[("/p/src/a.jsx", "a"), ("/p/src/b.mts", "b")]);
    assert_eq!(resolve(&fs, "./a"), Ok("/p/src/a.jsx".into()));
    assert_eq!(resolve(&fs, "./b"), Ok("/p/src/b.mts".into()));
}

#[test]
fn directory_imports_land_on_ordered_index_files() {
    let fs = common::fs(&[
        ("/p/src/dir/index.tsx", "x"),
        ("/p/src/dir/index.js", "j"),
        ("/p/src/other/index.js", "j"),
    ]);
    assert_eq!(resolve(&fs, "./dir"), Ok("/p/src/dir/index.tsx".into()));
    assert_eq!(resolve(&fs, "./other"), Ok("/p/src/other/index.js".into()));
    assert_eq!(resolve(&fs, "./nodir"), Err("./nodir".into()));
}

#[test]
fn index_jsx_probes_past_the_legacy_gap() {
    let fs = common::fs(&[("/p/src/dir/index.jsx", "x")]);
    assert_eq!(resolve(&fs, "./dir"), Ok("/p/src/dir/index.jsx".into()));
}

#[test]
fn parent_segments_climb() {
    let fs = common::fs(&[("/p/shared/tokens.ts", "t")]);
    assert_eq!(
        resolve(&fs, "../shared/tokens"),
        Ok("/p/shared/tokens.ts".into())
    );
}

#[test]
fn explicit_extension_never_double_probes() {
    let fs = common::fs(&[("/p/src/tokens.ts", "t")]);
    assert_eq!(
        resolve(&fs, "../src/tokens.ts"),
        Ok("/p/src/tokens.ts".into())
    );
}

#[test]
fn bare_and_absolute_specifiers_miss_the_relative_rung() {
    let fs = common::fs(&[("/p/src/tokens.ts", "t")]);
    assert!(resolve(&fs, "@/tokens").is_err());
    assert!(resolve(&fs, "pkg/sub").is_err());
    assert!(resolve(&fs, "/p/src/tokens").is_err());
}
