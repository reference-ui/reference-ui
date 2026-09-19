//! Tsconfig ladder: `paths` stars, exact entries, and nearest-wins.
//!
//! Atomic's alias arm, verbatim: star patterns substitute once, exact
//! entries match whole specifiers, a missing `baseUrl` means the config
//! dir, the nearest config wins, and `extends` stays unread. Ends with the
//! SITE-54 combo — alias, index, tsx, and exact-exports in one world.

mod common;

use module_graph::{ExtensionPolicy, MemoryFs, ModuleKey, SpecifierLadder, TsconfigPolicy};

/// Resolve from `from` under the Source policy, following `tsconfig`.
fn resolve(fs: &MemoryFs, from: &str, specifier: &str) -> Result<String, String> {
    resolve_with(fs, TsconfigPolicy::Follow, from, specifier)
}

/// Resolve from `from` under the Source policy with this tsconfig knob.
fn resolve_with(
    fs: &MemoryFs,
    tsconfig: TsconfigPolicy,
    from: &str,
    specifier: &str,
) -> Result<String, String> {
    let ladder = SpecifierLadder::new(fs, ExtensionPolicy::Source).with_tsconfig(tsconfig);
    ladder
        .resolve(&ModuleKey::new(from), specifier)
        .map(|key| key.as_str().to_string())
        .map_err(|miss| miss.specifier)
}

#[test]
fn star_entry_maps_prefix_to_targets() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}"#,
        ),
        ("/p/src/tokens.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/tokens"),
        Ok("/p/src/tokens.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/missing"),
        Err("@/missing".into())
    );
}

#[test]
fn exact_entry_matches_whole_specifier() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"paths":{"theme":["./src/theme.ts"]}}}"#,
        ),
        ("/p/src/theme.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "theme"),
        Ok("/p/src/theme.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "theme/sub"),
        Err("theme/sub".into())
    );
}

#[test]
fn missing_base_url_means_the_config_dir() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"paths":{"@/*":["src/*"]}}}"#,
        ),
        ("/p/src/tokens.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/tokens"),
        Ok("/p/src/tokens.ts".into())
    );
}

#[test]
fn nearest_config_wins_and_extends_stays_unread() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"paths":{"@/*":["wrong/*"]}}}"#,
        ),
        (
            "/p/src/tsconfig.json",
            r#"{"extends":"../other.json","compilerOptions":{"paths":{"@/*":["./*"]}}}"#,
        ),
        (
            "/p/other.json",
            r#"{"compilerOptions":{"paths":{"@/*":["nope/*"]}}}"#,
        ),
        ("/p/src/tokens.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/tokens"),
        Ok("/p/src/tokens.ts".into())
    );
}

#[test]
fn commented_configs_parse() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            "// lead\n{\"compilerOptions\": { /* mid */ \"baseUrl\": \".\", \"paths\": {\"@/*\": [\"src/*\"]}}}",
        ),
        ("/p/src/tokens.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/tokens"),
        Ok("/p/src/tokens.ts".into())
    );
}

#[test]
fn tsconfig_bases_probe_extensions_and_index() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}"#,
        ),
        ("/p/src/nested/index.ts", "n"),
        ("/p/src/ui.tsx", "u"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/nested"),
        Ok("/p/src/nested/index.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/ui"),
        Ok("/p/src/ui.tsx".into())
    );
}

#[test]
fn skip_policy_ignores_tsconfig_for_node_modules() {
    // The SYNC-15 shape: an ancestor authoring alias maps the bare import
    // elsewhere, while the world's own node_modules holds the package.
    // Skipping resolves the world-local file; following takes the alias.
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"baseUrl":".","paths":{"theme-pkg":["authoring/theme.ts"]}}}"#,
        ),
        ("/p/authoring/theme.ts", "a"),
        (
            "/p/world/node_modules/theme-pkg/package.json",
            r#"{"name":"theme-pkg","main":"./theme.ts"}"#,
        ),
        ("/p/world/node_modules/theme-pkg/theme.ts", "w"),
    ]);
    assert_eq!(
        resolve_with(
            &fs,
            TsconfigPolicy::Skip,
            "/p/world/src/app.ts",
            "theme-pkg"
        ),
        Ok("/p/world/node_modules/theme-pkg/theme.ts".into())
    );
    assert_eq!(
        resolve_with(
            &fs,
            TsconfigPolicy::Follow,
            "/p/world/src/app.ts",
            "theme-pkg"
        ),
        Ok("/p/authoring/theme.ts".into())
    );
}

#[test]
fn fresh_ladders_skip_tsconfig_by_default() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}"#,
        ),
        ("/p/src/tokens.ts", "t"),
    ]);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    assert_eq!(ladder.tsconfig_policy(), TsconfigPolicy::Skip);
    assert_eq!(
        ladder
            .resolve(&ModuleKey::new("/p/src/app.ts"), "@/tokens")
            .map_err(|miss| miss.specifier),
        Err("@/tokens".into())
    );
}

#[test]
fn site_54_combo_alias_index_tsx_and_exact_exports() {
    let fs = common::fs(&[
        (
            "/p/tsconfig.json",
            r#"{"compilerOptions":{"baseUrl":".","paths":{"@/*":["src/*"]}}}"#,
        ),
        ("/p/src/tokens.ts", "t"),
        ("/p/src/nested/index.ts", "n"),
        ("/p/src/ui.tsx", "u"),
        (
            "/p/node_modules/theme-pkg/package.json",
            r#"{"name":"theme-pkg","exports":{"./tokens":"./tokens.ts"}}"#,
        ),
        ("/p/node_modules/theme-pkg/tokens.ts", "t"),
    ]);
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "@/tokens"),
        Ok("/p/src/tokens.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "./nested"),
        Ok("/p/src/nested/index.ts".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "./ui"),
        Ok("/p/src/ui.tsx".into())
    );
    assert_eq!(
        resolve(&fs, "/p/src/app.ts", "theme-pkg/tokens"),
        Ok("/p/node_modules/theme-pkg/tokens.ts".into())
    );
}
