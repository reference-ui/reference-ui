//! Unit probes for the binding terminal and the reuse contract of the identity walk.
//! `trace_binding_terminal` answers where a local binding ends: a direct export, an alias, a barrel
//! chain, a default expression, a cycle, or an unknown name. The reuse probe pins that a graph
//! built over shared parses answers exactly like one built over fresh parses. Takes in-memory
//! projects through the shared `graph` helper and emits assertions on the terminal answer only.

use std::path::Path;

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use rustc_hash::FxHashMap;

use super::identity::graph;
use crate::extract::identity::IdentityGraph;

#[test]
fn binding_terminal_direct_export_names_local() {
    let graph = graph(&[("src/r.ts", "export const button = recipe({})\n")]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./r", "button"),
        Some(("src/r.ts".to_string(), "button".to_string()))
    );
}

#[test]
fn binding_terminal_local_alias_unwraps() {
    let graph = graph(&[("src/r.ts", "const d = recipe({})\nexport { d as dlg }\n")]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./r", "dlg"),
        Some(("src/r.ts".to_string(), "d".to_string()))
    );
}

#[test]
fn binding_terminal_barrel_chain_follows() {
    let graph = graph(&[
        ("src/r.ts", "export const button = recipe({})\n"),
        ("src/barrel.ts", "export { button } from './r'\n"),
    ]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./barrel", "button"),
        Some(("src/r.ts".to_string(), "button".to_string()))
    );
}

#[test]
fn binding_terminal_default_expr_answers_default() {
    let graph = graph(&[("src/r.ts", "export default recipe({})\n")]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./r", "default"),
        Some(("src/r.ts".to_string(), "default".to_string()))
    );
}

#[test]
fn binding_terminal_reference_answers_none() {
    let graph = graph(&[("src/ui.ts", "export * from '@reference-ui/react'\n")]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "@reference-ui/react", "css"),
        None
    );
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./ui", "css"),
        None
    );
}

#[test]
fn binding_terminal_star_follows() {
    let graph = graph(&[
        ("src/r.ts", "export const button = recipe({})\n"),
        ("src/barrel.ts", "export * from './r'\n"),
    ]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./barrel", "button"),
        Some(("src/r.ts".to_string(), "button".to_string()))
    );
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./barrel", "default"),
        None
    );
}

#[test]
fn binding_terminal_cycle_answers_none() {
    let graph = graph(&[
        ("src/a.ts", "export { x } from './b'\n"),
        ("src/b.ts", "export { x } from './a'\n"),
    ]);
    assert_eq!(graph.trace_binding_terminal("src/app.ts", "./a", "x"), None);
}

#[test]
fn binding_terminal_cycle_cut_still_reaches_a_later_star() {
    let graph = graph(&[
        ("src/a.ts", "export * from './b'\n"),
        ("src/b.ts", "export * from './a'\nexport * from './c'\n"),
        ("src/c.ts", "export const button = recipe({})\n"),
    ]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./a", "button"),
        Some(("src/c.ts".to_string(), "button".to_string()))
    );
}

#[test]
fn binding_terminal_unknown_answers_none() {
    let graph = graph(&[("src/r.ts", "export const button = recipe({})\n")]);
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "./r", "missing"),
        None
    );
    assert_eq!(
        graph.trace_binding_terminal("src/app.ts", "@/r", "button"),
        None
    );
}

#[test]
fn reused_programs_answer_like_fresh_parses() {
    let owned: Vec<(String, String)> = [
        ("src/ui.ts", "export { css } from '@reference-ui/react'\n"),
        ("src/chain.ts", "export { css } from './ui'\n"),
        ("src/r.ts", "export const button = recipe({})\n"),
        ("src/broken.ts", "export function Broken( {\n"),
    ]
    .iter()
    .map(|(path, content)| ((*path).to_string(), (*content).to_string()))
    .collect();
    let owned = crate::screen_sources(owned);
    // Main-phase options (crate `parse_source`): TS on for every extension.
    let allocators: Vec<Allocator> = owned.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<_> = owned
        .iter()
        .zip(allocators.iter())
        .map(|((path, source), allocator)| {
            let source_type = SourceType::from_path(Path::new(path))
                .unwrap_or_default()
                .with_typescript(true);
            Parser::new(allocator, source.as_str(), source_type).parse()
        })
        .collect();
    // Every unpanicked position reuses its program; the broken file stays
    // unmapped so the fallback re-parse answers (identically) from bytes.
    let mut programs = FxHashMap::default();
    for (position, ret) in parsed.iter().enumerate() {
        if !ret.panicked {
            programs.insert(position, &ret.program);
        }
    }
    let fresh = IdentityGraph::new(&owned);
    let reused = IdentityGraph::with_programs(&owned, &programs);
    let reference_queries = [
        ("src/app.tsx", "./ui", "css"),
        ("src/app.tsx", "./chain", "css"),
        ("src/app.tsx", "./r", "button"),
        ("src/app.tsx", "./broken", "css"),
        ("src/app.tsx", "./absent", "css"),
    ];
    for (from, specifier, name) in reference_queries {
        assert_eq!(
            reused.trace_reference_export(from, specifier, name),
            fresh.trace_reference_export(from, specifier, name),
            "reference query {specifier}#{name}",
        );
    }
    let terminal_queries = [
        ("src/app.ts", "./r", "button"),
        ("src/app.ts", "./chain", "css"),
        ("src/app.ts", "./broken", "css"),
    ];
    for (from, specifier, name) in terminal_queries {
        assert_eq!(
            reused.trace_binding_terminal(from, specifier, name),
            fresh.trace_binding_terminal(from, specifier, name),
            "terminal query {specifier}#{name}",
        );
    }
}
