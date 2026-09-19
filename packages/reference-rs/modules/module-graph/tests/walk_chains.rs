//! Origin walk over chains: hops, aliases, and import-then-export.
//!
//! The carried-over arms from atomic's binding walk: direct exports, barrel
//! chains, aliased re-exports, and `export { x }` of an imported `x` — plus
//! the default-hop edges the shared record adds and the memo proving repeat
//! lookups never reload.

mod common;

use module_graph::{
    BindingOrigin, BindingWalk, ExtensionPolicy, ModuleGraph, ModuleKey, SpecifierLadder,
};

/// Walk one binding in a world of `files`, returning its origin or refusal.
fn walk(files: &[(&str, &str)], from: &str, local: &str) -> Result<BindingOrigin, String> {
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    walk.resolve_binding(&ModuleKey::new(from), local)
        .map_err(|refused| format!("{refused:?}"))
}

/// The origin as a `(file, name)` pair.
fn at(origin: &BindingOrigin) -> (&str, &str) {
    (origin.file.as_str(), origin.name.as_str())
}

#[test]
fn direct_export_resolves_to_its_file() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "brand"));
}

#[test]
fn three_hop_barrel_chain_resolves_to_origin() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './third';"),
            ("/p/src/third.ts", "export { brand } from './index';"),
            ("/p/src/index.ts", "export { brand } from './barrel';"),
            ("/p/src/barrel.ts", "export { brand } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "brand"));
}

#[test]
fn aliased_reexport_resolves_by_binding() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { space } from './index';"),
            (
                "/p/src/index.ts",
                "export { gap as space } from './barrel';",
            ),
            ("/p/src/barrel.ts", "export { gap } from './tokens';"),
            ("/p/src/tokens.ts", "export const gap = '4px';"),
        ],
        "/p/src/app.ts",
        "space",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "gap"));
}

#[test]
fn import_then_export_follows_the_import_edge() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            (
                "/p/src/a.ts",
                "import { brand } from './b';\nexport { brand };",
            ),
            ("/p/src/b.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/b.ts", "brand"));
}

#[test]
fn declared_locals_resolve_at_home() {
    let hit = walk(
        &[("/p/src/app.ts", "const brand = 'red';\nexport { brand };")],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/app.ts", "brand"));
}

#[test]
fn default_hops_walk_to_the_default_origin() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { theme } from './mid';"),
            (
                "/p/src/mid.ts",
                "export { default as theme } from './tokens';",
            ),
            ("/p/src/tokens.ts", "const t = 1;\nexport default t;"),
        ],
        "/p/src/app.ts",
        "theme",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "t"));

    let anon = walk(
        &[
            ("/p/src/app.ts", "import { theme } from './mid';"),
            (
                "/p/src/mid.ts",
                "export { default as theme } from './tokens';",
            ),
            ("/p/src/tokens.ts", "export default () => 1;"),
        ],
        "/p/src/app.ts",
        "theme",
    )
    .expect("resolves");
    assert_eq!(at(&anon), ("/p/src/tokens.ts", "default"));
}

#[test]
fn repeated_lookups_replay_the_cache() {
    let files: &[(&str, &str)] = &[
        ("/p/src/app.ts", "import { brand } from './barrel';"),
        ("/p/src/barrel.ts", "export { brand } from './tokens';"),
        ("/p/src/tokens.ts", "export const brand = 'red';"),
    ];
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let from = ModuleKey::new("/p/src/app.ts");
    let (first, second) = {
        let mut walk = BindingWalk::new(&mut graph, &ladder);
        let first = walk.resolve_binding(&from, "brand").expect("resolves");
        let second = walk.resolve_binding(&from, "brand").expect("resolves");
        (first, second)
    };
    assert_eq!(first, second);
    assert_eq!(graph.loader().loads, 3);
}
