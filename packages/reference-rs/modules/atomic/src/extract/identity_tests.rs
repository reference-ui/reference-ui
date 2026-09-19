//! Unit probes for the re-export identity walk.
//!
//! Each test builds a tiny in-memory project and asks one identity question
//! through `IdentityGraph::trace_reference_export`. The seam behavior — which
//! calls become sites — is pinned by `ATM-SITE-55`; these probes pin the
//! walker's edges: hops, aliases, chains, stars, defaults, cycles, and the
//! relative-only probing fence.

use super::identity::IdentityGraph;

fn graph(sources: &[(&str, &str)]) -> IdentityGraph<'static> {
    let owned: Vec<(String, String)> = sources
        .iter()
        .map(|(path, content)| ((*path).to_string(), (*content).to_string()))
        .collect();
    // The graph borrows; leak the vec into a box so the borrow outlives the call.
    let boxed = Box::leak(Box::new(owned));
    IdentityGraph::new(boxed)
}

#[test]
fn direct_reference_import_traces_without_sources() {
    let graph = graph(&[]);
    assert_eq!(
        graph.trace_reference_export("app.tsx", "@reference-ui/react", "css"),
        Some("css".to_string())
    );
}

#[test]
fn wrapper_re_export_traces_to_reference() {
    let graph = graph(&[("src/ui.ts", "export { css } from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        Some("css".to_string())
    );
}

#[test]
fn aliased_re_export_answers_by_origin_name() {
    let graph = graph(&[(
        "src/ui.ts",
        "export { css as cx } from '@reference-ui/react'\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "cx"),
        Some("css".to_string())
    );
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        None
    );
}

#[test]
fn two_hop_chain_follows_barrels() {
    let graph = graph(&[
        ("src/ui.ts", "export { css } from '@reference-ui/react'\n"),
        ("src/chain.ts", "export { css } from './ui'\n"),
    ]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./chain", "css"),
        Some("css".to_string())
    );
}

#[test]
fn local_re_export_of_an_import_follows() {
    let graph = graph(&[(
        "src/ui.ts",
        "import { css } from '@reference-ui/react'\nexport { css }\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        Some("css".to_string())
    );
}

#[test]
fn consumer_declaration_ends_the_walk() {
    let graph = graph(&[("src/ui.ts", "export const css = (x: object) => x\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        None
    );
}

#[test]
fn foreign_package_origin_is_not_reference() {
    let graph = graph(&[("src/ui.ts", "export { css } from 'some-other-lib'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        None
    );
}

#[test]
fn re_export_cycle_terminates_empty() {
    let graph = graph(&[
        ("src/a.ts", "export { css } from './b'\n"),
        ("src/b.ts", "export { css } from './a'\n"),
    ]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./a", "css"),
        None
    );
}

#[test]
fn missing_export_and_missing_file_answer_none() {
    let graph = graph(&[("src/ui.ts", "export const other = 1\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        None
    );
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./absent", "css"),
        None
    );
}

#[test]
fn bare_specifiers_wait_for_the_resolver() {
    let graph = graph(&[("src/ui.ts", "export { css } from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "@/ui", "css"),
        None
    );
}

#[test]
fn star_from_reference_carries_any_name() {
    let graph = graph(&[("src/ui.ts", "export * from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "css"),
        Some("css".to_string())
    );
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "Box"),
        Some("Box".to_string())
    );
}

#[test]
fn star_never_carries_default() {
    let graph = graph(&[("src/ui.ts", "export * from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "default"),
        None
    );
}

#[test]
fn star_chain_through_a_file_follows() {
    let graph = graph(&[
        ("src/ui.ts", "export { css } from '@reference-ui/react'\n"),
        ("src/star.ts", "export * from './ui'\n"),
    ]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./star", "css"),
        Some("css".to_string())
    );
}

#[test]
fn default_re_export_traces() {
    let graph = graph(&[(
        "src/ui.ts",
        "export { css as default } from '@reference-ui/react'\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "default"),
        Some("css".to_string())
    );
}

#[test]
fn default_identifier_of_an_import_follows() {
    let graph = graph(&[(
        "src/ui.ts",
        "import { css } from '@reference-ui/react'\nexport default css\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "default"),
        Some("css".to_string())
    );
}

#[test]
fn default_declaration_is_opaque() {
    let graph = graph(&[(
        "src/ui.ts",
        "export default function css(_obj: object): string { return '' }\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "default"),
        None
    );
}

#[test]
fn re_exported_namespace_object_is_opaque() {
    let graph = graph(&[(
        "src/ui.ts",
        "import * as ns from '@reference-ui/react'\nexport { ns }\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./ui", "ns"),
        None
    );
}

#[test]
fn js_suffixed_specifier_finds_ts_source() {
    let graph = graph(&[("src/ui.ts", "export { css } from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_reference_export("src/app.ts", "./ui.js", "css"),
        Some("css".to_string())
    );
}

#[test]
fn directory_specifier_finds_index() {
    let graph = graph(&[(
        "src/wrap/index.ts",
        "export { css } from '@reference-ui/react'\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/app.tsx", "./wrap", "css"),
        Some("css".to_string())
    );
}

#[test]
fn parent_and_nested_relatives_resolve() {
    let graph = graph(&[(
        "src/shared/ui.ts",
        "export { css } from '@reference-ui/react'\n",
    )]);
    assert_eq!(
        graph.trace_reference_export("src/pages/app.tsx", "../shared/ui", "css"),
        Some("css".to_string())
    );
}
