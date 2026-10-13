//! Manifest-field ladder: entry points, ancestors, and scoped names.
//!
//! Root entries resolve package roots that carry no `exports` map: `types`,
//! `typings`, `module`, and `main`, ordered by [`RootEntryPolicy`]. The default
//! is source-first, so `exports` and the source fields lead a `types` file
//! beside them, and [`RootEntryPolicy::TypesFirst`] restores tasty's order for
//! consumers that want declarations. Ancestor `node_modules` walk nearest-first,
//! and scoped names split at the second slash.

mod common;

use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, RootEntryPolicy, SpecifierLadder};

/// Resolve from `from` under the Source policy, source-first roots.
fn resolve(fs: &MemoryFs, from: &str, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source);
    ladder
        .resolve(&ModuleKey::new(from), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

/// Resolve from `from` under the Source policy with types-first roots.
fn resolve_types_first(fs: &MemoryFs, from: &str, specifier: &str) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source)
        .with_root_entry(RootEntryPolicy::TypesFirst);
    ladder
        .resolve(&ModuleKey::new(from), specifier)
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
fn types_and_typings_fields_resolve_roots() {
    let fs = pkg_world(
        r#"{"types":"./index.d.ts"}"#,
        &[("/p/node_modules/pkg/index.d.ts", "d")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/index.d.ts".into())
    );
    let fs = pkg_world(
        r#"{"typings":"./types/main.d.ts"}"#,
        &[("/p/node_modules/pkg/types/main.d.ts", "d")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/types/main.d.ts".into())
    );
}

#[test]
fn module_and_main_fields_resolve_roots() {
    let fs = pkg_world(
        r#"{"module":"./dist/esm.js"}"#,
        &[("/p/node_modules/pkg/dist/esm.js", "e")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/dist/esm.js".into())
    );
    let fs = pkg_world(
        r#"{"main":"./cjs/index.js"}"#,
        &[("/p/node_modules/pkg/cjs/index.js", "c")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/cjs/index.js".into())
    );
}

#[test]
fn exports_beat_types_and_module_by_default() {
    let fs = pkg_world(
        r#"{"types":"./a.d.ts","exports":{".":"./b.js"},"module":"./c.js"}"#,
        &[
            ("/p/node_modules/pkg/a.d.ts", "a"),
            ("/p/node_modules/pkg/b.js", "b"),
            ("/p/node_modules/pkg/c.js", "c"),
        ],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/b.js".into())
    );
    let fs = pkg_world(
        r#"{"exports":{".":"./b.js"},"module":"./c.js"}"#,
        &[
            ("/p/node_modules/pkg/b.js", "b"),
            ("/p/node_modules/pkg/c.js", "c"),
        ],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/b.js".into())
    );
}

#[test]
fn source_entry_beats_a_types_declaration_beside_it() {
    // The shape styletrace STT-PKG-04 traces: a body-less declaration at
    // `types`, the wrapper's source at `exports`.
    let fs = pkg_world(
        r#"{"types":"./index.d.ts","exports":{".":"./index.tsx"}}"#,
        &[
            ("/p/node_modules/pkg/index.d.ts", "d"),
            ("/p/node_modules/pkg/index.tsx", "x"),
        ],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/index.tsx".into())
    );
}

#[test]
fn types_first_policy_puts_declarations_before_exports_and_module() {
    let fs = pkg_world(
        r#"{"types":"./a.d.ts","exports":{".":"./b.js"},"module":"./c.js"}"#,
        &[
            ("/p/node_modules/pkg/a.d.ts", "a"),
            ("/p/node_modules/pkg/b.js", "b"),
            ("/p/node_modules/pkg/c.js", "c"),
        ],
    );
    assert_eq!(
        resolve_types_first(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/a.d.ts".into())
    );
    let fs = pkg_world(
        r#"{"exports":{".":"./b.js"},"module":"./c.js"}"#,
        &[
            ("/p/node_modules/pkg/b.js", "b"),
            ("/p/node_modules/pkg/c.js", "c"),
        ],
    );
    assert_eq!(
        resolve_types_first(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/b.js".into())
    );
}

#[test]
fn field_targets_probe_extensions() {
    let fs = pkg_world(
        r#"{"main":"./dist/entry"}"#,
        &[("/p/node_modules/pkg/dist/entry.ts", "e")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/dist/entry.ts".into())
    );
}

#[test]
fn fieldless_packages_fall_back_to_index() {
    let fs = pkg_world(
        r#"{"name":"pkg"}"#,
        &[("/p/node_modules/pkg/index.ts", "i")],
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/index.ts".into())
    );
}

#[test]
fn node_modules_walk_nearest_first() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/src/node_modules/pkg/index.ts", "near"),
        ("/p/node_modules/pkg/index.ts", "far"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "pkg"),
        Ok("/p/src/node_modules/pkg/index.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/other/app.ts", "pkg"),
        Ok("/p/node_modules/pkg/index.ts".into())
    );
}

#[test]
fn scoped_packages_split_at_the_second_slash() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        (
            "/p/node_modules/@scope/pkg/package.json",
            r#"{"main":"./main.ts"}"#,
        ),
        ("/p/node_modules/@scope/pkg/main.ts", "m"),
        ("/p/node_modules/@scope/pkg/sub/deep.ts", "d"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@scope/pkg"),
        Ok("/p/node_modules/@scope/pkg/main.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@scope/pkg/sub/deep"),
        Ok("/p/node_modules/@scope/pkg/sub/deep.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@scope"),
        Err("@scope".into())
    );
}

#[test]
fn manifestless_dirs_still_probe_direct_subpaths() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "app"),
        ("/p/node_modules/bare/leaf.ts", "l"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "bare/leaf"),
        Ok("/p/node_modules/bare/leaf.ts".into())
    );
}
