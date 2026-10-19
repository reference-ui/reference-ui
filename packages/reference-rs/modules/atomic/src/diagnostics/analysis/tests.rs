//! Pins the analysis entry point: an empty input predicts nothing, source ids follow input order,
//! compile-time analysis drops panicked sources, an end-to-end fixture predicts both the style
//! and JSX surfaces, and package-bound tags predict what extraction compiles on both walks.
//! Helpers parse fixture sources in place so each test names the contract it checks.

use super::support::{analyze_source, parse_for_test};
use super::*;
use crate::diagnostics::DiagnosticCode;
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
        composed: &crate::extract::Composed::standalone(),
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
    let bindings = crate::extract::collect_bindings(&first);
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
                bindings: &bindings,
            },
            AnalyzedSource {
                path: "b.ts",
                content: second_src,
                program: &second,
                bindings: &bindings,
            },
        ],
        hosts: &hosts,
        constants: &constants,
        system: "test",
        composed: &crate::extract::Composed::standalone(),
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
    let bindings = vec![ExtractBindings::default()];
    let parse = CompileParse {
        sources: &sources,
        parsed: &parsed,
        bindings: &bindings,
    };
    let composed = crate::extract::Composed::standalone();
    let scope = AnalysisScope::new(&hosts, &constants, "test", &composed);
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

/// Compile `files` in a scratch app with installed packages, `Button` hosted
/// (as the primitive roster sends it) and `upstream` composed, on the serial
/// walk or on forced lanes, keeping the compiler and proof channels.
fn compile_hosted(
    app: &crate::tests::packages::PackageApp,
    files: &[(&str, &str)],
    upstream: &[&str],
    lanes: bool,
) -> crate::CompileResult {
    let request = app.request(files, upstream);
    if lanes {
        let before = crate::lanes::entered_spawns();
        crate::lanes::force_lane_count(Some(4));
        let result = crate::compile(&request);
        crate::lanes::force_lane_count(None);
        assert!(crate::lanes::entered_spawns() > before, "the lanes ran");
        return result.expect("lane compile succeeds");
    }
    let _hold = crate::lanes::hold_force_serial();
    crate::compile(&request).expect("serial compile succeeds")
}

/// Every diagnostic code a compile reported, default and compiler channels.
fn reported_codes(result: &crate::CompileResult) -> Vec<DiagnosticCode> {
    let compiler = result.compiler_diagnostics.iter().flatten();
    result
        .diagnostics
        .iter()
        .chain(compiler)
        .map(|diagnostic| diagnostic.code)
        .collect()
}

/// A primitive-named tag from a third-party package, and lib's `Button`
/// reached through a project barrel, both back under their package's system
/// (the package's runtime mints that class), never another composed one.
/// Analysis reads the same provenance and the same composed systems, so proof
/// predicts exactly those keys and raises no missing-plan warning, on the
/// serial walk and on the lanes alike, composed or not.
#[test]
fn package_tags_raise_no_false_missing_plan_on_either_walk() {
    let files = [
        (
            "src/acme.tsx",
            "import { Button } from 'acme-ui';\
             export const acme = <Button color=\"blue\" />;",
        ),
        (
            "src/ui/index.ts",
            "export { Button } from '@reference-ui/lib/primitives';",
        ),
        (
            "src/main.tsx",
            "import { Button } from './ui';\
             export const lib = <Button bg=\"red\" />;",
        ),
    ];
    let app = crate::tests::packages::PackageApp::new("analysis-package-tags");
    let legs: [(&[&str], &[&str]); 2] = [
        (
            &["reference-ui", "acme"],
            &["acme__c_blue", "reference-ui__bg_red"],
        ),
        (&["reference-ui"], &["reference-ui__bg_red"]),
    ];
    for (upstream, expected) in legs {
        for lanes in [false, true] {
            let result = compile_hosted(&app, &files, upstream, lanes);
            let mut classes: Vec<&str> = result
                .style_plans
                .iter()
                .flat_map(|plan| plan.declarations.iter())
                .map(|decl| decl.class_name.as_str())
                .collect();
            classes.sort_unstable();
            assert_eq!(classes, expected, "lanes={lanes} upstream={upstream:?}");
            let codes = reported_codes(&result);
            assert!(
                !codes.contains(&DiagnosticCode::MissingStylePlan),
                "lanes={lanes}: {:?} / {:?}",
                result.diagnostics,
                result.compiler_diagnostics
            );
        }
    }
}
