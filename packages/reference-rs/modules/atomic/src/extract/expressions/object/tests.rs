//! Object-walk tests: style objects, spreads, and responsive blocks lowered through the compiler,
//! pinned against their diagnostics and emitted declarations. Each case compiles a snippet with a
//! style object and asserts on the located warnings, help lines, and wants the object walk
//! produced. Takes source snippets through the public compile entry and emits assertions only.

use super::*;
use crate::{compile, CompileRequest, VirtualSource};
use oxc_allocator::Allocator;
use oxc_parser::Parser;

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: code.into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// `warn_help` carries the instance help on the pushed line and the
/// session fact alike, so the compiler re-render re-attaches it.
#[test]
fn warn_help_carries_help_on_the_line_and_the_fact() {
    let code = "export const cls = {};\n";
    let allocator = Allocator::default();
    let source_type =
        oxc_span::SourceType::from_path(std::path::Path::new("t.ts")).unwrap_or_default();
    let parsed = Parser::new(&allocator, code, source_type).parse();
    assert!(!parsed.panicked);
    let bag = crate::extract::constants::collect_local_constants(&parsed.program, "t.ts", None);
    let table = crate::extract::scope::collect(&parsed.program, &bag);
    let stub = crate::extract::scope::ImportLookup::ProjectBag(&bag);
    let chain = crate::extract::scope::ScopeChain::new(&table, stub);
    let breakpoints = BreakpointScale::default();
    let mut wants = Vec::new();
    let mut diagnostics = Vec::new();
    let mut sinks = Vec::new();
    let mut session = DiagnosticsSession::new();
    {
        let mut ctx = ObjectWalk {
            origin: None,
            important: false,
            backing: &crate::atom::backing::OWN,
            file: "t.ts",
            source: Some(code),
            line_index: None,
            scopes: chain.at(crate::extract::scope::ROOT_SCOPE),
            breakpoints: &breakpoints,
            wants: &mut wants,
            diagnostics: &mut diagnostics,
            authored: None,
            bag: BagSemantics::StyleObject,
            sinks: &mut sinks,
            session: &mut session,
        };
        ctx.warn_help(
            Span::new(0, 5),
            DiagnosticCode::UnfoldableSpread,
            "spread keeps siblings",
            vec!["define 'mix' as a static style object or inline it".to_string()],
        );
    }
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].help,
        Some(vec![
            "define 'mix' as a static style object or inline it".to_string()
        ])
    );
    let facts = session.take_facts();
    assert_eq!(facts.len(), 1);
    let crate::diagnostics::DiagnosticFact::ExtractNote { help, .. } = &facts[0] else {
        panic!("warn_help reports an extract note");
    };
    assert_eq!(
        help,
        &Some(vec![
            "define 'mix' as a static style object or inline it".to_string()
        ])
    );
}

/// An unknown inline prop suggests the closest canon name, then the fix.
/// Unknown-prop notes stay userspace, so the help asserts on default.
#[test]
fn unknown_property_help_suggests_closest_canon_name() {
    let res = compile_code(
        "import { css } from '@reference-ui/react';\
         export const cls = css({ colr: 'red' });",
    );
    let hits: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|d| d.code == DiagnosticCode::UnknownProperty)
        .collect();
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec![
            "did you mean `color`?".to_string(),
            "remove 'colr' or check its spelling".to_string(),
        ])
    );
}

/// A far-off prop name carries the fix line alone, never a wild guess.
#[test]
fn unknown_property_without_candidate_keeps_fix_only() {
    let res = compile_code(
        "import { css } from '@reference-ui/react';\
         export const cls = css({ zzzqqq: 'red' });",
    );
    let hits: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|d| d.code == DiagnosticCode::UnknownProperty)
        .collect();
    assert_eq!(hits.len(), 1);
    assert_eq!(
        hits[0].help,
        Some(vec!["remove 'zzzqqq' or check its spelling".to_string()])
    );
}
