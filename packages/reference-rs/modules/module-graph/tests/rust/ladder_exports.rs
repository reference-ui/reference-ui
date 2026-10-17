//! Exports-map ladder: conditions, stars, and fallthrough.
//!
//! Atomic's `exports` arm, verbatim where cases pin it and extended where
//! nobody does: exact keys, `*` patterns substituted once, condition maps in
//! the policy's order (source-first: `source`, `import`, `default`, `require`,
//! then `types`; types-first: `types` leading), and fallthrough to the next
//! entry when the first names a file that is not on disk. A missed map still
//! falls back to the direct subpath.

mod common;

use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, RootEntryPolicy, SpecifierLadder};

/// Resolve from `/p/src/app.ts` under the Source policy.
fn resolve(fs: &MemoryFs, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source);
    ladder
        .resolve(&ModuleKey::new("/p/src/app.ts"), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

/// Resolve from `/p/src/app.ts` under the Source policy with types-first entries.
fn resolve_types_first(fs: &MemoryFs, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source)
        .with_root_entry(RootEntryPolicy::TypesFirst);
    ladder
        .resolve(&ModuleKey::new("/p/src/app.ts"), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

/// A world with one package `pkg` carrying `manifest` plus `files`.
fn pkg_world(manifest: &str, files: &[(&str, &str)]) -> MemoryFs {
    let mut all = vec![
        ("/p/src/app.ts", "app"),
        ("/p/node_modules/pkg/package.json", manifest),
    ];
    all.extend(files.iter().copied());
    common::fs(&all)
}

#[test]
fn exact_keys_map_subpaths() {
    let fs = pkg_world(
        r#"{"exports":{"./tokens":"./mapped.ts"}}"#,
        &[("/p/node_modules/pkg/mapped.ts", "m")],
    );
    assert_eq!(
        resolve(&fs, "pkg/tokens"),
        Ok("/p/node_modules/pkg/mapped.ts".into())
    );
}

#[test]
fn conditions_unwrap_import_over_default_over_types() {
    let fs = pkg_world(
        r#"{"exports":{".":{"types":"./t.d.ts","import":"./i.mjs","default":"./d.js"}}}"#,
        &[
            ("/p/node_modules/pkg/t.d.ts", "t"),
            ("/p/node_modules/pkg/i.mjs", "i"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/i.mjs".into()));
    let fs = pkg_world(
        r#"{"exports":{".":{"default":"./d.js","import":"./i.mjs"}}}"#,
        &[
            ("/p/node_modules/pkg/i.mjs", "i"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/i.mjs".into()));
    let fs = pkg_world(
        r#"{"exports":{".":{"types":"./t.d.ts","default":"./d.js"}}}"#,
        &[
            ("/p/node_modules/pkg/t.d.ts", "t"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/d.js".into()));
}

#[test]
fn types_first_keeps_declarations_leading_conditions() {
    let fs = pkg_world(
        r#"{"exports":{".":{"types":"./t.d.ts","import":"./i.mjs","default":"./d.js"}}}"#,
        &[
            ("/p/node_modules/pkg/t.d.ts", "t"),
            ("/p/node_modules/pkg/i.mjs", "i"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(
        resolve_types_first(&fs, "pkg"),
        Ok("/p/node_modules/pkg/t.d.ts".into())
    );
}

#[test]
fn source_condition_leads_the_map() {
    let fs = pkg_world(
        r#"{"exports":{".":{"types":"./t.d.ts","import":"./i.mjs","source":"./s.ts"}}}"#,
        &[
            ("/p/node_modules/pkg/t.d.ts", "t"),
            ("/p/node_modules/pkg/i.mjs", "i"),
            ("/p/node_modules/pkg/s.ts", "s"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/s.ts".into()));
}

#[test]
fn subpath_conditions_follow_the_policy() {
    let fs = pkg_world(
        r#"{"exports":{"./tokens":{"types":"./t.d.ts","import":"./i.mjs"}}}"#,
        &[
            ("/p/node_modules/pkg/t.d.ts", "t"),
            ("/p/node_modules/pkg/i.mjs", "i"),
        ],
    );
    assert_eq!(
        resolve(&fs, "pkg/tokens"),
        Ok("/p/node_modules/pkg/i.mjs".into())
    );
    assert_eq!(
        resolve_types_first(&fs, "pkg/tokens"),
        Ok("/p/node_modules/pkg/t.d.ts".into())
    );
}

#[test]
fn star_patterns_substitute_once() {
    let fs = pkg_world(
        r#"{"exports":{"./features/*":"./lib/*.js"}}"#,
        &[("/p/node_modules/pkg/lib/button.js", "b")],
    );
    assert_eq!(
        resolve(&fs, "pkg/features/button"),
        Ok("/p/node_modules/pkg/lib/button.js".into())
    );
}

#[test]
fn exact_keys_beat_star_patterns() {
    let fs = pkg_world(
        r#"{"exports":{"./*":"./lib/*.js","./special":"./special.ts"}}"#,
        &[
            ("/p/node_modules/pkg/lib/special.js", "l"),
            ("/p/node_modules/pkg/special.ts", "s"),
        ],
    );
    assert_eq!(
        resolve(&fs, "pkg/special"),
        Ok("/p/node_modules/pkg/special.ts".into())
    );
}

#[test]
fn require_condition_resolves_last() {
    let fs = pkg_world(
        r#"{"exports":{".":{"require":"./r.cjs","default":"./d.js"}}}"#,
        &[
            ("/p/node_modules/pkg/r.cjs", "r"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/d.js".into()));
    let fs = pkg_world(
        r#"{"exports":{".":{"require":"./r.cjs"}}}"#,
        &[("/p/node_modules/pkg/r.cjs", "r")],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/r.cjs".into()));
}

#[test]
fn missing_first_condition_falls_through() {
    let fs = pkg_world(
        r#"{"exports":{".":{"import":"./gone.mjs","types":"./live.d.ts"}}}"#,
        &[("/p/node_modules/pkg/live.d.ts", "l")],
    );
    assert_eq!(
        resolve(&fs, "pkg"),
        Ok("/p/node_modules/pkg/live.d.ts".into())
    );
    let fs = pkg_world(
        r#"{"exports":{".":{"types":"./gone.d.ts","import":"./live.mjs"}}}"#,
        &[("/p/node_modules/pkg/live.mjs", "l")],
    );
    assert_eq!(
        resolve_types_first(&fs, "pkg"),
        Ok("/p/node_modules/pkg/live.mjs".into())
    );
}

#[test]
fn bare_condition_maps_apply_to_the_root_only() {
    let fs = pkg_world(
        r#"{"exports":{"import":"./i.mjs","default":"./d.js"}}"#,
        &[
            ("/p/node_modules/pkg/i.mjs", "i"),
            ("/p/node_modules/pkg/d.js", "d"),
        ],
    );
    assert_eq!(resolve(&fs, "pkg"), Ok("/p/node_modules/pkg/i.mjs".into()));
    assert_eq!(resolve(&fs, "pkg/sub"), Err("pkg/sub".into()));
}

#[test]
fn unmapped_subpaths_fall_back_to_direct_files() {
    let fs = pkg_world(
        r#"{"exports":{"./mapped":"./mapped.ts"}}"#,
        &[("/p/node_modules/pkg/direct.ts", "d")],
    );
    assert_eq!(
        resolve(&fs, "pkg/direct"),
        Ok("/p/node_modules/pkg/direct.ts".into())
    );
    assert_eq!(resolve(&fs, "pkg/missing"), Err("pkg/missing".into()));
}

#[test]
fn invalid_manifests_still_probe_direct_subpaths() {
    let fs = pkg_world("nope", &[("/p/node_modules/pkg/direct.ts", "d")]);
    assert_eq!(
        resolve(&fs, "pkg/direct"),
        Ok("/p/node_modules/pkg/direct.ts".into())
    );
}
