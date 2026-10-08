//! Memo-key falsifiers for [`ImportResolver`](crate::scanner::ImportResolver).
//!
//! These tests pin the *shape* of the per-scan external-resolution memo, not
//! merely that a memo exists. The key must be the full specifier text rather
//! than the package name; the fallback declaration-provider path must share the
//! same cache for both hits and misses; and relative imports must stay uncached
//! because they depend on the importing file and the known file set. Every test
//! mutates the fixture after the first resolve and pairs the cached answer with
//! a fresh-resolver control, so a non-caching resolver fails the primary
//! assertion while a fixture that failed to mutate fails the control.

use std::collections::BTreeSet;
use std::fs;

use crate::scanner::ImportResolver;
use crate::tests::fixtures::TempDir;

/// The memo key is the full specifier text: `pkg` and `pkg/sub` resolve to
/// different entries on one resolver, and both survive removal of the package.
#[test]
fn external_resolution_keys_on_full_specifier_text() {
    let root = TempDir::new("scanner-packages-memo-key-subpath");
    root.write(
        "node_modules/key-lib/package.json",
        r#"{
              "name": "key-lib",
              "exports": {
                ".": { "types": "./dist/index.d.ts" },
                "./sub": { "types": "./dist/sub.d.ts" }
              }
            }"#,
    );
    root.write(
        "node_modules/key-lib/dist/index.d.ts",
        "export interface Root {}\n",
    );
    root.write(
        "node_modules/key-lib/dist/sub.d.ts",
        "export interface Sub {}\n",
    );

    let resolver = ImportResolver::new(root.path());
    let root_entry = resolver.resolve_external("key-lib").expect("root entry");
    let sub_entry = resolver
        .resolve_external("key-lib/sub")
        .expect("sub entry");

    assert_eq!(root_entry.file_id, "node_modules/key-lib/./dist/index.d.ts");
    assert_eq!(sub_entry.file_id, "node_modules/key-lib/./dist/sub.d.ts");
    assert_ne!(
        root_entry.file_id, sub_entry.file_id,
        "a memo keyed by package name would collapse pkg and pkg/sub onto one entry"
    );

    fs::remove_dir_all(root.path().join("node_modules/key-lib")).expect("remove package");
    assert_eq!(
        resolver.resolve_external("key-lib").map(|r| r.file_id),
        Some("node_modules/key-lib/./dist/index.d.ts".to_string()),
        "cached root entry survives removal"
    );
    assert_eq!(
        resolver.resolve_external("key-lib/sub").map(|r| r.file_id),
        Some("node_modules/key-lib/./dist/sub.d.ts".to_string()),
        "cached subpath entry survives removal"
    );

    let fresh = ImportResolver::new(root.path());
    assert!(
        fresh.resolve_external("key-lib").is_none(),
        "fresh resolver sees the removed package"
    );
    assert!(
        fresh.resolve_external("key-lib/sub").is_none(),
        "fresh resolver sees the removed subpath"
    );
}

/// A fallback `@types` provider hit is cached: after the provider is removed,
/// the resolver still answers from the memo while a fresh resolver misses.
#[test]
fn external_resolution_memoizes_types_provider_fallback_hit() {
    let root = TempDir::new("scanner-packages-memo-fallback-hit");
    root.write(
        "node_modules/@types/json-schema/package.json",
        r#"{ "name": "@types/json-schema", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@types/json-schema/index.d.ts",
        "export interface JSONSchema4 {}\n",
    );

    let resolver = ImportResolver::new(root.path());
    let first = resolver
        .resolve_external("json-schema")
        .expect("fallback provider hit");
    assert_eq!(
        first.file_id,
        "node_modules/@types/json-schema/index.d.ts"
    );

    fs::remove_dir_all(root.path().join("node_modules/@types/json-schema"))
        .expect("remove provider");
    let second = resolver
        .resolve_external("json-schema")
        .expect("fallback hit stays cached");
    assert_eq!(first.file_id, second.file_id);

    let fresh = ImportResolver::new(root.path());
    assert!(
        fresh.resolve_external("json-schema").is_none(),
        "fresh resolver re-walks the removed provider"
    );
}

/// A fallback miss is cached negative: installing a matching provider after the
/// first miss does not revive it on the same resolver, but a fresh one finds it.
#[test]
fn external_resolution_memoizes_types_provider_fallback_miss() {
    let root = TempDir::new("scanner-packages-memo-fallback-miss");
    let resolver = ImportResolver::new(root.path());
    assert!(
        resolver.resolve_external("ghost-types").is_none(),
        "no provider is installed yet"
    );

    root.write(
        "node_modules/@types/ghost-types/package.json",
        r#"{ "name": "@types/ghost-types", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/@types/ghost-types/index.d.ts",
        "export interface Ghost {}\n",
    );
    assert!(
        resolver.resolve_external("ghost-types").is_none(),
        "the fallback miss stays cached after the provider appears"
    );

    let fresh = ImportResolver::new(root.path());
    assert!(
        fresh.resolve_external("ghost-types").is_some(),
        "a fresh resolver discovers the newly installed provider"
    );
}

/// Relative imports are importer- and disk-sensitive, so they must never share
/// a memo slot: the same specifier from two files resolves to each file's own
/// target, and a removed target is seen as gone on the next resolve.
#[test]
fn relative_resolution_stays_uncached_per_importing_file() {
    let root = TempDir::new("scanner-packages-memo-relative-key");
    root.write("node_modules/pkg-a/child.d.ts", "export interface PA {}\n");
    root.write("node_modules/pkg-b/child.d.ts", "export interface PB {}\n");

    let resolver = ImportResolver::new(root.path());
    let file_ids = BTreeSet::new();
    let from_a = resolver.resolve_import("node_modules/pkg-a/index.d.ts", "./child", &file_ids);
    let from_b = resolver.resolve_import("node_modules/pkg-b/index.d.ts", "./child", &file_ids);

    assert_eq!(from_a.as_deref(), Some("node_modules/pkg-a/child.d.ts"));
    assert_eq!(from_b.as_deref(), Some("node_modules/pkg-b/child.d.ts"));
    assert_ne!(
        from_a, from_b,
        "one specifier must not share one memo slot across importing files"
    );

    fs::remove_file(root.path().join("node_modules/pkg-b/child.d.ts")).expect("remove child b");
    assert_eq!(
        resolver.resolve_import("node_modules/pkg-b/index.d.ts", "./child", &file_ids),
        None,
        "an uncached relative resolve re-walks the disk and sees the removed file"
    );
    assert_eq!(
        resolver.resolve_import("node_modules/pkg-a/index.d.ts", "./child", &file_ids),
        Some("node_modules/pkg-a/child.d.ts".to_string()),
        "the untouched sibling still resolves"
    );

    let fresh = ImportResolver::new(root.path());
    assert_eq!(
        fresh.resolve_import("node_modules/pkg-b/index.d.ts", "./child", &file_ids),
        None,
        "a fresh resolver agrees the removed file is gone"
    );
}
