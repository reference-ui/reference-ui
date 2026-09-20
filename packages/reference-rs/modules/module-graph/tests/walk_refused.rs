//! Origin walk refusals: every `Refused` variant as data.
//!
//! Each refusal carries what the consumer needs to word a diagnostic — the
//! cycle trail, the unresolved specifier, the missing name, the ambiguous
//! candidates, or the refused edge — and never a panic, `None`, or stale
//! answer. Winners beat pending star errors; silence is not an outcome.

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

#[test]
fn distinct_star_declarers_refuse_as_ambiguous() {
    let refused = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export * from './b';\nexport * from './c';"),
            ("/p/src/b.ts", "export const brand = 'b';"),
            ("/p/src/c.ts", "export const brand = 'c';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect_err("ambiguous");
    match refused {
        Refused::Ambiguous { name, candidates } => {
            assert_eq!(name, "brand");
            assert_eq!(candidates.len(), 2);
        }
        other => panic!("expected Ambiguous, got {other:?}"),
    }
}

#[test]
fn hop_cycles_refuse_with_the_trail() {
    let refused = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export { brand } from './b';"),
            ("/p/src/b.ts", "export { brand } from './a';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect_err("cycles");
    match refused {
        Refused::Cycle { trail } => {
            assert!(trail.len() >= 3, "{trail:?}");
            assert_eq!(trail.first().map(|o| o.file.as_str()), Some("/p/src/a.ts"));
        }
        other => panic!("expected Cycle, got {other:?}"),
    }

    let selfish = walk(
        &[
            ("/p/src/app.ts", "import { x } from './a';"),
            ("/p/src/a.ts", "export { x } from './a';"),
        ],
        "/p/src/app.ts",
        "x",
    )
    .expect_err("self-cycles");
    assert!(matches!(selfish, Refused::Cycle { .. }), "{selfish:?}");
}

#[test]
fn star_cycles_refuse_as_cycles() {
    let refused = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export * from './b';"),
            ("/p/src/b.ts", "export * from './a';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect_err("star cycles");
    assert!(matches!(refused, Refused::Cycle { .. }), "{refused:?}");
}

#[test]
fn default_and_namespace_edges_refuse_by_dialect() {
    let default = walk(
        &[
            ("/p/src/app.ts", "import theme from './tokens';"),
            ("/p/src/tokens.ts", "const t = 1;\nexport default t;"),
        ],
        "/p/src/app.ts",
        "theme",
    )
    .expect_err("default refuses");
    assert!(matches!(default, Refused::Default { .. }), "{default:?}");

    let namespace = walk(
        &[
            ("/p/src/app.ts", "import * as t from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "t",
    )
    .expect_err("namespace refuses");
    assert!(
        matches!(namespace, Refused::Namespace { .. }),
        "{namespace:?}"
    );

    let reexported_default = walk(
        &[
            ("/p/src/app.ts", "import { d } from './mid';"),
            ("/p/src/mid.ts", "import d from './tokens';\nexport { d };"),
            ("/p/src/tokens.ts", "const t = 1;\nexport default t;"),
        ],
        "/p/src/app.ts",
        "d",
    )
    .expect_err("re-exported default refuses");
    assert!(
        matches!(reexported_default, Refused::Default { .. }),
        "{reexported_default:?}"
    );
}

#[test]
fn missing_exports_and_unknown_locals_refuse_as_missing() {
    let missing = walk(
        &[
            ("/p/src/app.ts", "import { nope } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "nope",
    )
    .expect_err("missing export");
    match missing {
        Refused::MissingExport { file, name } => {
            assert_eq!(file.as_str(), "/p/src/tokens.ts");
            assert_eq!(name, "nope");
        }
        other => panic!("expected MissingExport, got {other:?}"),
    }

    let unknown = walk(
        &[("/p/src/app.ts", "const x = 1;")],
        "/p/src/app.ts",
        "ghost",
    )
    .expect_err("unknown local");
    assert!(
        matches!(unknown, Refused::MissingExport { .. }),
        "{unknown:?}"
    );
}

#[test]
fn unresolvable_specifiers_refuse_as_unresolved() {
    let refused = walk(
        &[("/p/src/app.ts", "import { x } from './gone';")],
        "/p/src/app.ts",
        "x",
    )
    .expect_err("unresolved");
    match refused {
        Refused::Unresolved { from, specifier } => {
            assert_eq!(from.as_str(), "/p/src/app.ts");
            assert_eq!(specifier, "./gone");
        }
        other => panic!("expected Unresolved, got {other:?}"),
    }
}

#[test]
fn resolved_files_without_records_refuse_as_unresolved() {
    let fs = common::fs(&[
        ("/p/src/app.ts", "import { x } from './data';"),
        ("/p/src/data.ts", "export const x = 1;"),
    ]);
    let ladder = SpecifierLadder::new(&fs, ExtensionPolicy::Source);
    let mut graph = ModuleGraph::new(common::TestLoader::new(&[(
        "/p/src/app.ts",
        "import { x } from './data';",
    )]));
    let mut walk = BindingWalk::new(&mut graph, &ladder);
    let refused = walk
        .resolve_binding(&ModuleKey::new("/p/src/app.ts"), "x")
        .expect_err("no record");
    assert!(matches!(refused, Refused::Unresolved { .. }), "{refused:?}");
}

#[test]
fn star_lookup_surfaces_the_nested_unresolvable_hop() {
    let refused = walk(
        &[
            ("/p/src/app.ts", "import { x } from './barrel';"),
            ("/p/src/barrel.ts", "export * from './lib';"),
            ("/p/src/lib.ts", "export { x } from './typo';"),
        ],
        "/p/src/app.ts",
        "x",
    )
    .expect_err("barreled lookup refuses");
    match refused {
        Refused::Unresolved { from, specifier } => {
            assert_eq!(from.as_str(), "/p/src/lib.ts");
            assert_eq!(specifier, "./typo");
        }
        other => panic!("expected Unresolved(lib, ./typo), got {other:?}"),
    }
}

#[test]
fn one_winner_beats_a_pending_star_unresolved() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { x } from './barrel';"),
            (
                "/p/src/barrel.ts",
                "export * from './lib';\nexport * from './twin';",
            ),
            ("/p/src/lib.ts", "export { x } from './typo';"),
            ("/p/src/twin.ts", "export const x = 1;"),
        ],
        "/p/src/app.ts",
        "x",
    )
    .expect("winner wins");
    assert_eq!(hit.file.as_str(), "/p/src/twin.ts");
}

#[test]
fn one_winner_beats_a_pending_star_error() {
    let hit = walk(
        &[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export * from './b';\nexport * from './c';"),
            ("/p/src/b.ts", "export * from './b';"),
            ("/p/src/c.ts", "export const brand = 'red';"),
        ],
        "/p/src/app.ts",
        "brand",
    )
    .expect("winner wins");
    assert_eq!(hit.file.as_str(), "/p/src/c.ts");
}
