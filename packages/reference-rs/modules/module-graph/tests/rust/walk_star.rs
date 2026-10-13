//! Origin walk through stars: fan-out, precedence, and the default fence.
//!
//! `export *` barrels resolve to the one declaring target, explicit exports
//! beat stars, chained stars fan transitively, and stars never carry
//! `default` — the SITE-55 fence. Diamonds landing on one origin still win;
//! only distinct origins refuse as ambiguous. Enumeration fans the same way.

mod common;

use module_graph::{
    BindingOrigin, BindingWalk, ExtensionPolicy, ModuleGraph, ModuleKey, Refused, SpecifierLadder,
};

/// Walk one binding in a world of `files`.
fn walk(files: &[(&str, &str)], from: &str, local: &str) -> Result<BindingOrigin, Refused> {
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    walk.resolve_binding(&ModuleKey::new(from), local)
}

/// The origin as a `(file, name)` pair.
fn at(origin: &BindingOrigin) -> (&str, &str) {
    (origin.file.as_str(), origin.name.as_str())
}

#[test]
fn star_fan_out_finds_the_declaring_target() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './barrel';"),
            ("/p/src/barrel.ts", "export * from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "brand"));
}

#[test]
fn explicit_exports_beat_stars() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './barrel';"),
            (
                "/p/src/barrel.ts",
                "export * from './tokens';\nexport const brand = 'local';",
            ),
            ("/p/src/tokens.ts", "export const brand = 'star';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/barrel.ts", "brand"));
}

#[test]
fn chained_stars_fan_transitively() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { deep } from './a';"),
            ("/p/src/a.ts", "export * from './b';"),
            ("/p/src/b.ts", "export * from './c';"),
            ("/p/src/c.ts", "export const deep = 1;"),
        ],
        "/p/src/app.ts",
        "deep",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/c.ts", "deep"));
}

#[test]
fn diamonds_on_one_origin_still_win() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export * from './b';\nexport * from './c';"),
            ("/p/src/b.ts", "export * from './d';"),
            ("/p/src/c.ts", "export * from './d';"),
            ("/p/src/d.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/d.ts", "brand"));
}

#[test]
fn stars_never_carry_default() {
    let refused = walk(
        &[
            ("/p/src/app.ts", "import { theme } from './star';"),
            ("/p/src/star.ts", "export * from './tokens';"),
            ("/p/src/tokens.ts", "const t = 1;\nexport default t;"),
        ],
        "/p/src/app.ts",
        "theme",
    )
    .expect_err("stars do not carry default");
    assert!(
        matches!(refused, Refused::MissingExport { .. }),
        "{refused:?}"
    );
}

#[test]
fn import_then_export_through_a_star_follows_through() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './mid';"),
            (
                "/p/src/mid.ts",
                "import { brand } from './barrel';\nexport { brand };",
            ),
            ("/p/src/barrel.ts", "export * from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("resolves");
    assert_eq!(at(&hit), ("/p/src/tokens.ts", "brand"));
}

#[test]
fn enumeration_fans_stars_without_default() {
    let files: &[(&str, &str)] = &[
        (
            "/p/src/entry.ts",
            "export * from './a';\nexport * from './b';\nexport const own = 1;\nconst d = 1;\nexport default d;",
        ),
        ("/p/src/a.ts", "export const alpha = 1;"),
        (
            "/p/src/b.ts",
            "export * from './c';\nexport const beta = 1;",
        ),
        ("/p/src/c.ts", "export const gamma = 1;\nconst d = 2;\nexport default d;"),
    ];
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    let (names, refused) = walk
        .exported_names(&ModuleKey::new("/p/src/entry.ts"))
        .expect("enumerates");
    assert_eq!(
        names.into_iter().collect::<Vec<_>>(),
        vec!["alpha", "beta", "default", "gamma", "own"]
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>()
    );
    assert!(refused.is_empty(), "{refused:?}");
}

#[test]
fn enumeration_reports_unresolvable_stars_as_data() {
    let files: &[(&str, &str)] = &[(
        "/p/src/entry.ts",
        "export * from './gone';\nexport const own = 1;",
    )];
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    let (names, refused) = walk
        .exported_names(&ModuleKey::new("/p/src/entry.ts"))
        .expect("enumerates");
    assert_eq!(
        names.into_iter().collect::<Vec<_>>(),
        vec!["own".to_string()]
    );
    assert_eq!(refused.len(), 1);
    assert!(
        matches!(refused[0], Refused::Unresolved { .. }),
        "{:?}",
        refused[0]
    );
}

#[test]
fn enumeration_of_a_missing_entry_is_none() {
    let files: &[(&str, &str)] = &[("/p/src/other.ts", "export const x = 1;")];
    let fs = common::fs(files);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(files));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    assert!(walk
        .exported_names(&ModuleKey::new("/p/src/gone.ts"))
        .is_none());
}
