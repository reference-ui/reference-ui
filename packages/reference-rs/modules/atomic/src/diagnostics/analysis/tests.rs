//! Pins the analysis entry point: an empty input predicts nothing, source ids follow input order,
//! compile-time analysis drops panicked sources, and an end-to-end fixture predicts both the style
//! and JSX surfaces. Helpers parse fixture sources in place so each test names the contract it
//! checks.

use super::support::{analyze_source, parse_for_test};
use super::*;
use crate::extract::constants::LocalConstants;

#[test]
fn analysis_predicts_nothing_for_no_sources() {
    let hosts = ResolvedHosts {
        traced: Vec::new(),
        configured: Vec::new(),
        owned_props: BTreeMap::new(),
        local_owned: BTreeMap::new(),
    };
    let constants = LocalConstants::new();
    let input = AnalysisInput {
        sources: Vec::new(),
        hosts: &hosts,
        constants: &constants,
        system: "test",
        qualifiers: &[],
    };
    assert!(analyze(&input).is_empty());
}

#[test]
fn sources_keep_input_order_as_source_ids() {
    let allocator = oxc_allocator::Allocator::default();
    let first_src = "import { css } from '@reference-ui/react'; css({ color: 'red' })";
    let second_src = "import { css } from '@reference-ui/react'; css({ color: 'blue' })";
    let first = parse_for_test(&allocator, first_src);
    let second = parse_for_test(&allocator, second_src);
    let constants =
        crate::extract::constants::collect_local_constants(&first, "a.ts", Some(first_src));
    let hosts = ResolvedHosts {
        traced: Vec::new(),
        configured: Vec::new(),
        owned_props: BTreeMap::new(),
        local_owned: BTreeMap::new(),
    };
    let input = AnalysisInput {
        sources: vec![
            AnalyzedSource {
                path: "a.ts",
                content: first_src,
                program: &first,
            },
            AnalyzedSource {
                path: "b.ts",
                content: second_src,
                program: &second,
            },
        ],
        hosts: &hosts,
        constants: &constants,
        system: "test",
        qualifiers: &[],
    };
    let ids: Vec<SourceId> = analyze(&input)
        .iter()
        .filter_map(|fact| match fact {
            DiagnosticFact::ExactLookupExpected { site, .. } => Some(site.source),
            _ => None,
        })
        .collect();
    assert_eq!(ids, vec![SourceId(0), SourceId(1)]);
}

#[test]
fn for_compile_filters_panicked_sources() {
    let allocator = oxc_allocator::Allocator::default();
    let sources = vec![("a.ts".to_string(), "css({ color: 'red' })".to_string())];
    let parsed = vec![parse_raw(&allocator, &sources[0].1)];
    let hosts = ResolvedHosts {
        traced: Vec::new(),
        configured: Vec::new(),
        owned_props: BTreeMap::new(),
        local_owned: BTreeMap::new(),
    };
    let constants = LocalConstants::new();
    let parse = CompileParse {
        sources: &sources,
        parsed: &parsed,
    };
    let scope = AnalysisScope::new(&hosts, &constants, "test", &[]);
    let input = AnalysisInput::for_compile(&parse, scope);
    assert_eq!(input.sources.len(), 1);
    assert_eq!(input.sources[0].path, "a.ts");
}

#[cfg(test)]
fn parse_raw<'a>(
    allocator: &'a oxc_allocator::Allocator,
    source: &'a str,
) -> oxc_parser::ParserReturn<'a> {
    use oxc_parser::Parser;
    use oxc_span::SourceType;
    Parser::new(allocator, source, SourceType::tsx()).parse()
}

#[test]
fn end_to_end_fixture_predicts_both_surfaces() {
    let facts = analyze_source("import { css, Div } from '@reference-ui/react'; css({ color: 'red' }); const el = <Div mt=\"2r\" />;");
    assert_eq!(facts.len(), 2);
}
