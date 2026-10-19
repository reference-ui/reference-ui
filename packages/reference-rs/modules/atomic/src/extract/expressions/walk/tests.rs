//! Expression-walk tests: style leaves from literal, identifier, member, call, and branching
//! expressions, pinned against the wants and diagnostics each walk emits. Each case builds a tiny
//! expression, walks it through the expression walker, and asserts on the resulting wants and
//! refusal diagnostics, so the walker's shape families stay covered. Takes parsed expressions and
//! emits assertions only.

use super::*;
use crate::diagnostics::{DiagnosticFact, ExtractOutcome, LeafDetail};
use oxc_allocator::Allocator;
use oxc_parser::Parser;

/// Drive the sink hook directly: Q5a pins that a mutated base warns
/// without recording, and the fact records no sink.
#[test]
fn mutated_binding_warns_without_sink_and_records_no_sink() {
    let code = "const sizes = ['1r'];\n";
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
        let mut ctx = ExpressionWalk {
            prop: "mt",
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
            sinks: &mut sinks,
            session: &mut session,
        };
        ctx.warn_dynamic(DynamicRefusal {
            span: Span::new(0, 5),
            code: DiagnosticCode::MutatedBinding,
            detail: ExtractDetail::Leaf(LeafDetail::Generic),
            when: &SmallVec::new(),
        });
        ctx.warn_dynamic(DynamicRefusal {
            span: Span::new(0, 5),
            code: DiagnosticCode::DynamicIdentifier,
            detail: ExtractDetail::Leaf(LeafDetail::Identifier { name: "k".into() }),
            when: &SmallVec::new(),
        });
    }
    assert_eq!(diagnostics.len(), 2);
    assert_eq!(diagnostics[0].code, DiagnosticCode::MutatedBinding);
    assert_eq!(sinks.len(), 1);
    let facts = session.take_facts();
    assert_eq!(facts.len(), 2);
    let unrecorded = matches!(
        facts[0],
        DiagnosticFact::ExtractOutcome {
            outcome: ExtractOutcome::Refused {
                sink_recorded: false,
                ..
            },
            ..
        }
    );
    let recorded = matches!(
        facts[1],
        DiagnosticFact::ExtractOutcome {
            outcome: ExtractOutcome::Refused {
                sink_recorded: true,
                ..
            },
            ..
        }
    );
    assert!(unrecorded, "mutated fact records no sink");
    assert!(recorded, "identifier fact records its sink");
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
        let mut ctx = ExpressionWalk {
            prop: "mt",
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
            sinks: &mut sinks,
            session: &mut session,
        };
        ctx.warn_help(
            Span::new(0, 5),
            DiagnosticCode::ResponsiveArraySpread,
            "spread refuses the array",
            vec!["remove the spread from the 'mt' value array".to_string()],
        );
    }
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].help,
        Some(vec![
            "remove the spread from the 'mt' value array".to_string()
        ])
    );
    let facts = session.take_facts();
    assert_eq!(facts.len(), 1);
    let DiagnosticFact::ExtractNote { help, .. } = &facts[0] else {
        panic!("warn_help reports an extract note");
    };
    assert_eq!(
        help,
        &Some(vec![
            "remove the spread from the 'mt' value array".to_string()
        ])
    );
}
