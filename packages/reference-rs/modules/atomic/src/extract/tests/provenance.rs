//! Unit probes for the origin walk behind tag provenance.
//!
//! Each test builds a tiny in-memory project and asks where one import ends
//! through `IdentityGraph::trace_origin`: a Reference export, a project
//! declaration (`Local`), or a package. These trees live in memory only, so
//! every package spelling stays unresolved (foreign, no directory); the disk
//! arm, where a bare specifier lands in a package directory, is pinned in
//! `package_origin.rs`. The probes pin relative barrels, star order,
//! re-exported namespaces, the `tsconfig` alias arm (an aliased project file
//! is never a package), and the graphless spelling rule.

use super::identity::graph;
use crate::extract::identity::Origin;
use crate::extract::PackageTag;

/// A package the walk could not resolve on disk: its spelling, foreign.
fn package(specifier: &str) -> Origin {
    Origin::Package(PackageTag::unresolved(specifier))
}

#[test]
fn direct_imports_classify_by_specifier() {
    let graph = graph(&[]);
    let origin = |specifier| graph.trace_origin("src/app.tsx", specifier, "Button");
    assert_eq!(origin("@reference-ui/react"), Origin::Reference);
    assert_eq!(origin("acme-ui"), package("acme-ui"));
    assert_eq!(
        origin("@reference-ui/lib/primitives"),
        package("@reference-ui/lib/primitives")
    );
    // A relative miss and an unmapped alias spelling are project-local.
    assert_eq!(origin("./missing"), Origin::Local);
    assert_eq!(origin("~/ui"), Origin::Local);
}

#[test]
fn relative_barrels_carry_their_terminal() {
    let graph = graph(&[
        (
            "src/ui/index.ts",
            "export { Button } from '@reference-ui/lib/primitives'\n",
        ),
        (
            "src/own.ts",
            "export { Button as Btn } from '@reference-ui/react'\n",
        ),
        ("src/card.tsx", "export function Card() { return null }\n"),
        (
            "src/chain.ts",
            "export { Button } from './ui'\nexport { Card } from './card'\n",
        ),
    ]);
    let origin = |specifier, imported| graph.trace_origin("src/app.tsx", specifier, imported);
    assert_eq!(
        origin("./ui", "Button"),
        package("@reference-ui/lib/primitives")
    );
    assert_eq!(
        origin("./chain", "Button"),
        package("@reference-ui/lib/primitives")
    );
    assert_eq!(origin("./own", "Btn"), Origin::Reference);
    assert_eq!(origin("./chain", "Card"), Origin::Local);
    assert_eq!(origin("./card", "Card"), Origin::Local);
}

#[test]
fn visible_stars_answer_before_opaque_ones() {
    let graph = graph(&[
        ("src/local.tsx", "export const Card = () => null\n"),
        (
            "src/index.ts",
            "export * from 'acme-ui'\nexport * from './local'\n",
        ),
    ]);
    let origin = |imported| graph.trace_origin("src/app.tsx", "./index", imported);
    assert_eq!(origin("Card"), Origin::Local);
    assert_eq!(origin("Button"), package("acme-ui"));
    assert_eq!(origin("default"), Origin::Local);
}

#[test]
fn star_cycle_cut_still_reaches_a_later_star_origin() {
    let graph = graph(&[
        ("src/a.ts", "export * from './b'\n"),
        ("src/b.ts", "export * from './a'\nexport * from './c'\n"),
        ("src/c.ts", "export { css } from '@reference-ui/react'\n"),
    ]);
    assert_eq!(
        graph.trace_origin("src/app.tsx", "./a", "css"),
        Origin::Reference
    );
}

#[test]
fn reexported_namespaces_take_their_module_origin() {
    let graph = graph(&[(
        "src/index.ts",
        "import * as Acme from 'acme-ui'\nexport { Acme }\n",
    )]);
    assert_eq!(
        graph.trace_origin("src/app.tsx", "./index", "Acme"),
        package("acme-ui")
    );
    assert_eq!(
        graph.namespace_origin("src/app.tsx", "acme-ui"),
        package("acme-ui")
    );
    assert_eq!(
        graph.namespace_origin("src/app.tsx", "./index"),
        Origin::Local
    );
}

#[test]
fn tsconfig_aliases_resolve_into_the_project() {
    let graph = graph(&[
        (
            "/v/tsconfig.json",
            "{ \"compilerOptions\": { \"paths\": { \"@/*\": [\"./src/*\"], \"@app/ui\": [\"./src/ui/index.ts\"] } } }",
        ),
        ("/v/src/ui/card.tsx", "export function Card() { return null }\n"),
        ("/v/src/ui/index.ts", "export { Button } from '@reference-ui/lib/primitives'\n"),
        ("/v/src/main.tsx", "export {}\n"),
    ]);
    let origin = |specifier, imported| graph.trace_origin("/v/src/main.tsx", specifier, imported);
    assert_eq!(origin("@/ui/card", "Card"), Origin::Local);
    assert_eq!(
        origin("@/ui", "Button"),
        package("@reference-ui/lib/primitives")
    );
    // An npm-shaped alias is the project's, not a package.
    assert_eq!(
        origin("@app/ui", "Button"),
        package("@reference-ui/lib/primitives")
    );
    assert_eq!(origin("@/missing", "Card"), Origin::Local);
    assert_eq!(origin("acme-ui", "Button"), package("acme-ui"));
}

#[test]
fn graphless_spelling_classifies_without_probing() {
    assert_eq!(
        Origin::of_specifier("@reference-ui/styled"),
        Origin::Reference
    );
    assert_eq!(
        Origin::of_specifier("acme-ui/button"),
        package("acme-ui/button")
    );
    assert_eq!(Origin::of_specifier("./ui"), Origin::Local);
    assert_eq!(Origin::of_specifier("@/ui"), Origin::Local);
    assert_eq!(Origin::of_specifier("/abs/ui"), Origin::Local);
}
