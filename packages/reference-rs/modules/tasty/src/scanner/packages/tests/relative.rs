//! Relative-specifier resolution tests for the packages resolver.
//! Each test drives [`ImportResolver`] over either an in-memory known-file set or a temp tree, and
//! pins one rung of the candidate order: the declaration-first runtime mapping, the exact file, the
//! TypeScript extensions appended to a dotted basename, and the on-disk check that decides whether
//! an import warns.

use std::collections::BTreeSet;
use std::path::Path;

use crate::scanner::packages::relative::declaration_candidates;
use crate::scanner::packages::FileLookup;
use crate::scanner::paths::path_to_unix;
use crate::scanner::ImportResolver;
use crate::tests::fixtures::TempDir;

#[test]
fn relative_import_prefers_declaration_candidates_for_runtime_entries() {
    let root = TempDir::new("scanner-packages-relative");
    let file_ids = BTreeSet::from(["src/button.d.ts".to_string(), "src/index.ts".to_string()]);

    let resolved = ImportResolver::new(root.path()).resolve_relative_import(
        "src/index.ts",
        "./button.js",
        &file_ids,
        FileLookup::Denied,
    );

    assert_eq!(resolved.as_deref(), Some("src/button.d.ts"));
}

#[test]
fn dotted_basename_appends_typescript_extensions_to_the_full_name() {
    let root = TempDir::new("scanner-packages-dotted");
    let file_ids = BTreeSet::from([
        "src/theme.fragments.ts".to_string(),
        "src/a.styles.tsx".to_string(),
    ]);
    let resolver = ImportResolver::new(root.path());

    let tokens = resolver.resolve_relative_import(
        "src/index.ts",
        "./theme.fragments",
        &file_ids,
        FileLookup::Denied,
    );
    let styles = resolver.resolve_relative_import(
        "src/index.ts",
        "./a.styles",
        &file_ids,
        FileLookup::Denied,
    );
    let missing = resolver.resolve_relative_import(
        "src/index.ts",
        "./missing.styles",
        &file_ids,
        FileLookup::Denied,
    );

    assert_eq!(tokens.as_deref(), Some("src/theme.fragments.ts"));
    assert_eq!(styles.as_deref(), Some("src/a.styles.tsx"));
    assert_eq!(missing, None);
}

#[test]
fn dotted_basename_keeps_the_exact_file_ahead_of_appended_candidates() {
    let root = TempDir::new("scanner-packages-dotted-exact");
    let file_ids = BTreeSet::from([
        "src/theme.fragments".to_string(),
        "src/theme.fragments.ts".to_string(),
    ]);

    let resolved = ImportResolver::new(root.path()).resolve_relative_import(
        "src/index.ts",
        "./theme.fragments",
        &file_ids,
        FileLookup::Denied,
    );

    assert_eq!(resolved.as_deref(), Some("src/theme.fragments"));
}

#[test]
fn dotted_basename_ranks_candidates_like_a_plain_name() {
    let root = TempDir::new("scanner-packages-dotted-rank");
    let plain = BTreeSet::from(["src/theme.d.ts".to_string(), "src/theme.ts".to_string()]);
    let dotted = BTreeSet::from([
        "src/theme.fragments.d.ts".to_string(),
        "src/theme.fragments.ts".to_string(),
    ]);
    let resolver = ImportResolver::new(root.path());

    let plain_hit =
        resolver.resolve_relative_import("src/index.ts", "./theme", &plain, FileLookup::Denied);
    let dotted_hit = resolver.resolve_relative_import(
        "src/index.ts",
        "./theme.fragments",
        &dotted,
        FileLookup::Denied,
    );

    assert_eq!(plain_hit.as_deref(), Some("src/theme.d.ts"));
    assert_eq!(dotted_hit.as_deref(), Some("src/theme.fragments.d.ts"));
}

#[test]
fn dotted_basename_on_disk_is_not_dangling() {
    let root = TempDir::new("scanner-packages-dotted-disk");
    root.write("src/a.styles.tsx", "export interface StyleShape {}\n");
    let resolver = ImportResolver::new(root.path());

    assert!(resolver.names_file_on_disk("src/index.ts", "./a.styles"));
    assert!(!resolver.names_file_on_disk("src/index.ts", "./a.missing"));
}

#[test]
fn query_and_hash_suffixes_name_the_file_on_disk() {
    let root = TempDir::new("scanner-packages-suffix-disk");
    root.write("src/notes.md", "# Notes\n");
    let resolver = ImportResolver::new(root.path());

    assert!(resolver.names_file_on_disk("src/index.ts", "./notes.md?raw"));
    assert!(resolver.names_file_on_disk("src/index.ts", "./notes.md#usage"));
    assert!(!resolver.names_file_on_disk("src/index.ts", "./missing.md?raw"));
}

#[test]
fn query_or_hash_suffix_keeps_a_relative_import_opaque() {
    let root = TempDir::new("scanner-packages-suffix-opaque");
    root.write(
        "src/helper.ts",
        "export default interface HelperDefault {}\n",
    );
    let resolver = ImportResolver::new(root.path());
    let scanned = BTreeSet::from(["src/helper.ts".to_string()]);

    assert_eq!(
        resolver
            .resolve_relative_import("src/index.ts", "./helper", &scanned, FileLookup::Denied)
            .as_deref(),
        Some("src/helper.ts")
    );
    for specifier in ["./helper.ts?raw", "./helper.ts#types"] {
        assert!(
            resolver
                .resolve_relative_import("src/index.ts", specifier, &scanned, FileLookup::Allowed)
                .is_none(),
            "{specifier} names no module, so it stays opaque"
        );
    }
    assert!(resolver.names_file_on_disk("src/index.ts", "./helper.ts?raw"));
}

#[test]
fn js_specifier_maps_to_typescript_sources() {
    let root = TempDir::new("scanner-packages-js-sources");
    let resolver = ImportResolver::new(root.path());
    let tsx = BTreeSet::from(["src/button.tsx".to_string()]);
    let ts = BTreeSet::from(["src/icon.ts".to_string()]);

    let button =
        resolver.resolve_relative_import("src/index.ts", "./button.js", &tsx, FileLookup::Denied);
    let icon =
        resolver.resolve_relative_import("src/index.ts", "./icon.js", &ts, FileLookup::Denied);

    assert_eq!(button.as_deref(), Some("src/button.tsx"));
    assert_eq!(icon.as_deref(), Some("src/icon.ts"));
}

#[test]
fn mjs_and_cjs_specifiers_map_to_mts_and_cts_only() {
    let root = TempDir::new("scanner-packages-mjs-cjs");
    let resolver = ImportResolver::new(root.path());
    let file_ids = BTreeSet::from([
        "src/chunk.mts".to_string(),
        "src/legacy.cts".to_string(),
        "src/plain.ts".to_string(),
    ]);

    let chunk = resolver.resolve_relative_import(
        "src/index.ts",
        "./chunk.mjs",
        &file_ids,
        FileLookup::Denied,
    );
    let legacy = resolver.resolve_relative_import(
        "src/index.ts",
        "./legacy.cjs",
        &file_ids,
        FileLookup::Denied,
    );
    // TypeScript never maps .mjs or .cjs onto a .ts source.
    let plain_mjs = resolver.resolve_relative_import(
        "src/index.ts",
        "./plain.mjs",
        &file_ids,
        FileLookup::Denied,
    );
    let plain_cjs = resolver.resolve_relative_import(
        "src/index.ts",
        "./plain.cjs",
        &file_ids,
        FileLookup::Denied,
    );

    assert_eq!(chunk.as_deref(), Some("src/chunk.mts"));
    assert_eq!(legacy.as_deref(), Some("src/legacy.cts"));
    assert_eq!(plain_mjs, None);
    assert_eq!(plain_cjs, None);
}

#[test]
fn runtime_specifiers_keep_declaration_siblings_first() {
    let root = TempDir::new("scanner-packages-runtime-declarations");
    root.write("dist/button.d.ts", "export interface Button {}\n");
    root.write("dist/button.js", "export {};\n");
    root.write("dist/button.tsx", "export interface Button {}\n");
    let resolver = ImportResolver::new(root.path());

    let button = resolver.resolve_relative_import(
        "dist/index.d.ts",
        "./button.js",
        &BTreeSet::new(),
        FileLookup::Allowed,
    );

    assert_eq!(button.as_deref(), Some("dist/button.d.ts"));
}

#[test]
fn mjs_and_cjs_sources_never_shadow_a_declaration() {
    let root = TempDir::new("scanner-packages-mjs-cjs-declarations");
    root.write("dist/chunk.d.ts", "export interface Chunk {}\n");
    root.write("dist/chunk.mts", "export interface Chunk {}\n");
    root.write("dist/chunk.mjs", "export {};\n");
    root.write("dist/legacy.d.ts", "export interface Legacy {}\n");
    root.write("dist/legacy.cts", "export interface Legacy {}\n");
    root.write("dist/legacy.cjs", "export {};\n");
    let resolver = ImportResolver::new(root.path());

    let chunk = resolver.resolve_relative_import(
        "dist/index.d.ts",
        "./chunk.mjs",
        &BTreeSet::new(),
        FileLookup::Allowed,
    );
    let legacy = resolver.resolve_relative_import(
        "dist/index.d.ts",
        "./legacy.cjs",
        &BTreeSet::new(),
        FileLookup::Allowed,
    );

    assert_eq!(chunk.as_deref(), Some("dist/chunk.d.ts"));
    assert_eq!(legacy.as_deref(), Some("dist/legacy.d.ts"));
}

#[test]
fn package_entry_candidates_keep_declarations_first() {
    let candidates = declaration_candidates(Path::new("dist/index.mjs"), false);
    let leading: Vec<String> = candidates
        .iter()
        .take(3)
        .map(|candidate| path_to_unix(candidate))
        .collect();

    assert_eq!(
        leading,
        ["dist/index.d.ts", "dist/index.d.mts", "dist/index.mts"]
    );
}

#[test]
fn mjs_and_cjs_specifiers_map_to_their_declarations() {
    let root = TempDir::new("scanner-packages-mjs-cjs-d-mts");
    root.write("dist/chunk.d.mts", "export interface Chunk {}\n");
    root.write("dist/legacy.d.cts", "export interface Legacy {}\n");
    let resolver = ImportResolver::new(root.path());

    let chunk = resolver.resolve_relative_import(
        "dist/index.d.ts",
        "./chunk.mjs",
        &BTreeSet::new(),
        FileLookup::Allowed,
    );
    let legacy = resolver.resolve_relative_import(
        "dist/index.d.ts",
        "./legacy.cjs",
        &BTreeSet::new(),
        FileLookup::Allowed,
    );

    assert_eq!(chunk.as_deref(), Some("dist/chunk.d.mts"));
    assert_eq!(legacy.as_deref(), Some("dist/legacy.d.cts"));
}
