//! Runtime remap ladder: `.js`/`.mjs`/`.cjs` specifiers find sources.
//!
//! Styletrace's remap win, adopted: a runtime extension probes the stem's
//! source siblings before the literal, so compiled specifiers land on the
//! sources the compilers read. The Source policy prefers sources, the
//! Declarations policy prefers declarations, and extensionless probes keep
//! each policy's own tables.

mod common;

use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, SpecifierLadder};

/// Resolve from `/p/src/app.ts` under `policy`.
fn resolve(fs: &MemoryFs, policy: ExtensionPolicy, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, policy);
    ladder
        .resolve(&ModuleKey::new("/p/src/app.ts"), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

#[test]
fn js_remaps_to_ts_then_tsx_then_dts() {
    let fs = common::fs(&[("/p/src/real.ts", "t")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./real.js"),
        Ok("/p/src/real.ts".into())
    );
    let fs = common::fs(&[("/p/src/real.tsx", "x")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./real.js"),
        Ok("/p/src/real.tsx".into())
    );
    let fs = common::fs(&[("/p/src/decl.d.ts", "d")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./decl.js"),
        Ok("/p/src/decl.d.ts".into())
    );
}

#[test]
fn literal_runtime_file_is_the_fallback_not_the_shadow() {
    let fs = common::fs(&[("/p/src/real.ts", "t"), ("/p/src/real.js", "j")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./real.js"),
        Ok("/p/src/real.ts".into())
    );
    let fs = common::fs(&[("/p/src/only.js", "j")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./only.js"),
        Ok("/p/src/only.js".into())
    );
}

#[test]
fn mjs_and_cjs_remap_like_js() {
    let fs = common::fs(&[("/p/src/a.ts", "a"), ("/p/src/b.tsx", "b")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./a.mjs"),
        Ok("/p/src/a.ts".into())
    );
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./b.cjs"),
        Ok("/p/src/b.tsx".into())
    );
}

#[test]
fn declarations_prefer_dts_for_runtime_entries() {
    let fs = common::fs(&[("/p/src/real.d.ts", "d"), ("/p/src/real.ts", "t")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Declarations, "./real.js"),
        Ok("/p/src/real.d.ts".into())
    );
    let fs = common::fs(&[("/p/src/real.ts", "t")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Declarations, "./real.js"),
        Ok("/p/src/real.ts".into())
    );
}

#[test]
fn extensionless_keeps_each_policy_table() {
    let fs = common::fs(&[("/p/src/a.js", "j")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./a"),
        Ok("/p/src/a.js".into())
    );
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Declarations, "./a"),
        Err("./a".into())
    );
    let fs = common::fs(&[("/p/src/a.d.ts", "d"), ("/p/src/a.ts", "t")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Declarations, "./a"),
        Ok("/p/src/a.d.ts".into())
    );
}

#[test]
fn declaration_index_prefers_dts() {
    let fs = common::fs(&[("/p/src/dir/index.d.ts", "d"), ("/p/src/dir/index.ts", "t")]);
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Declarations, "./dir"),
        Ok("/p/src/dir/index.d.ts".into())
    );
    assert_eq!(
        resolve(&fs, ExtensionPolicy::Source, "./dir"),
        Ok("/p/src/dir/index.ts".into())
    );
}
