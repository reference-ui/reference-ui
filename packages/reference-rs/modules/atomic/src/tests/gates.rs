//! Walk-gate contracts for the dead-file fast path (A4).
//! Pins the two byte gates, their adversarial edges, and the SourceId
//! alignment the skips must preserve: entries keep their slots while only
//! the per-file walks skip, and panicked inputs filter before indexing.
//! Takes inline fixtures through `compile()` and the analysis entry; emits
//! assertion failures naming the gate that misclassified.

use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use crate::diagnostics::analysis::{AnalysisInput, CompileParse};
use crate::diagnostics::analysis::{css_walk_skip, jsx_walk_skip};
use crate::diagnostics::{DiagnosticCode, DiagnosticFact, SourceId};
use crate::hosts::ResolvedHosts;
use crate::{compile, string_skip, styling_skip, CompileRequest, VirtualSource};

/// The bench dead shape: `FACTOR_n` const plus a pure function, zero needles.
fn dead_file(index: u32) -> String {
    format!(
        "export const FACTOR_{index} = {}\n\nexport function combine{index}(\n  left: number,\n  right: number,\n): number {{\n  return (left + right) * FACTOR_{index}\n}}\n",
        (index * 31 + 7) % 1000
    )
}

fn live_css_file() -> String {
    "import { css } from '@reference-ui/react';\nexport const card = css({ color: 'red' });\n"
        .to_string()
}

fn request_for(files: Vec<VirtualSource>) -> CompileRequest {
    CompileRequest {
        files: Some(files),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    }
}

fn virtual_file(path: &str, content: String) -> VirtualSource {
    VirtualSource {
        path: path.to_string(),
        content,
    }
}

#[test]
fn dead_template_skips_both_gates() {
    let dead = dead_file(7);
    assert!(styling_skip(&dead));
    assert!(string_skip(&dead));
}

#[test]
fn each_styling_needle_runs_the_walks() {
    for content in [
        "import { x } from './ui';\nexport const y = x;\n",
        "export const c = css({});\n",
        "export const r = recipe({});\n",
        "export const t = a < b;\n",
        "const el = <Overlay.Content />;\n",
    ] {
        assert!(!styling_skip(content), "should run walks: {content:?}");
    }
}

#[test]
fn styling_gate_is_case_sensitive() {
    for content in [
        "export const CSS = 1;\n",
        "export const IMPORT = 2;\n",
        "export const Recipe = 3;\n",
    ] {
        assert!(styling_skip(content), "should skip: {content:?}");
    }
}

#[test]
fn aliased_and_reserved_bindings_run_the_walks() {
    // Aliased re-export: the import needle carries the site.
    assert!(!styling_skip(
        "import { c } from './ui';\nexport const x = c({});\n"
    ));
    // Reserved aliases carry `css` / `recipe` bytes without any import.
    assert!(!styling_skip("export const x = __reference_ui_css({});\n"));
    assert!(!styling_skip(
        "export const x = __reference_ui_recipe({});\n"
    ));
    // Namespace and member forms need their prop bytes.
    assert!(!styling_skip(
        "import * as ns from '@reference-ui/react';\nns.css({});\n"
    ));
    assert!(!styling_skip(
        "import { css as c } from '@reference-ui/react';\nc.object({});\n"
    ));
}

#[test]
fn quotes_in_comments_keep_the_string_walk() {
    let content = "// don't fold this\nexport const x = 1;\n";
    assert!(!string_skip(content));
    assert!(styling_skip(content));
}

#[test]
fn template_only_literals_keep_the_string_walk() {
    let content = "export const space = `4r`;\n";
    assert!(!string_skip(content));
    assert!(styling_skip(content));
}

#[test]
fn style_free_file_with_string_still_feeds_the_pool() {
    // The fence: a style-free file holding 'red' skips styling walks but
    // must still run the harvest walk, or pool x sinks loses the mint.
    let content = "export const tint = 'red';\n";
    assert!(styling_skip(content));
    assert!(!string_skip(content));
    let pool = pool_for_contents(&[content]);
    let reds = pool
        .values(canon::ValueKind::Color)
        .map(|set| set.iter().map(Box::as_ref).collect::<Vec<_>>())
        .unwrap_or_default();
    assert_eq!(reds, ["red"]);
}

#[test]
fn harvest_mask_covers_quoteless_files_only() {
    let quoteless = dead_file(3);
    let quoted = "export const tint = 'red';\n".to_string();
    let masked =
        pool_for_contents_with_mask(&[quoteless.as_str(), quoted.as_str()], &[true, false]);
    let unmasked = pool_for_contents(&[quoteless.as_str(), quoted.as_str()]);
    for pool in [&masked, &unmasked] {
        let reds = pool
            .values(canon::ValueKind::Color)
            .map(|set| set.iter().map(Box::as_ref).collect::<Vec<_>>())
            .unwrap_or_default();
        assert_eq!(reds, ["red"]);
    }
}

/// Parse inline contents exactly as `compile()` parses them, then collect.
fn pool_for_contents(contents: &[&str]) -> crate::extract::harvest::HarvestPool {
    let len = contents.len();
    pool_for_contents_with_mask(contents, &vec![false; len])
}

fn pool_for_contents_with_mask(
    contents: &[&str],
    skip: &[bool],
) -> crate::extract::harvest::HarvestPool {
    let allocators: Vec<Allocator> = contents.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<oxc_parser::ParserReturn<'_>> = contents
        .iter()
        .zip(allocators.iter())
        .map(|(content, allocator)| {
            let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
                .unwrap_or_default()
                .with_typescript(true);
            Parser::new(allocator, content, source_type).parse()
        })
        .collect();
    crate::extract::harvest::collect_pool(&parsed, skip)
}

#[test]
fn gated_dead_files_keep_live_output_identical() {
    let live = virtual_file("live.ts", live_css_file());
    let with_dead = request_for(vec![virtual_file("dead.ts", dead_file(11)), live.clone()]);
    let without_dead = request_for(vec![live]);
    let gated = compile(&with_dead).expect("compile with dead file");
    let bare = compile(&without_dead).expect("compile without dead file");
    assert_eq!(gated.wants, bare.wants);
    assert_eq!(gated.stylesheet, bare.stylesheet);
    assert!(gated.wants.iter().any(|want| &*want.prop == "color"));
}

#[test]
fn parse_errors_survive_the_gate() {
    // Needle-free and invalid: parse still runs, the error still lands.
    let bad = virtual_file("bad.ts", "export const = ;;\n".to_string());
    let result = compile(&request_for(vec![bad])).expect("compile reports errors");
    assert!(
        result
            .diagnostics
            .iter()
            .any(|diag| diag.code == DiagnosticCode::ParseError),
        "expected a ParseError, got: {:?}",
        result.diagnostics
    );
}

/// Analyze inline sources through `for_compile`, optionally panicking one.
fn analyze_with_panic(contents: &[&str], panicked: Option<usize>) -> Vec<DiagnosticFact> {
    let sources: Vec<(String, String)> = contents
        .iter()
        .enumerate()
        .map(|(index, content)| (format!("f{index}.ts"), content.to_string()))
        .collect();
    let allocators: Vec<Allocator> = sources.iter().map(|_| Allocator::default()).collect();
    let mut parsed: Vec<oxc_parser::ParserReturn<'_>> = sources
        .iter()
        .zip(allocators.iter())
        .map(|((path, content), allocator)| {
            let source_type = SourceType::from_path(std::path::Path::new(path))
                .unwrap_or_default()
                .with_typescript(true);
            Parser::new(allocator, content, source_type).parse()
        })
        .collect();
    if let Some(index) = panicked {
        parsed[index].panicked = true;
    }
    let constants = crate::extract::constants::LocalConstants::new();
    let hosts = ResolvedHosts {
        traced: Vec::new(),
        configured: Vec::new(),
        owned_props: BTreeMap::new(),
    };
    let parse = CompileParse {
        sources: &sources,
        parsed: &parsed,
    };
    let input = AnalysisInput::for_compile(&parse, &hosts, &constants, "test");
    crate::diagnostics::analysis::analyze(&input)
}

fn exact_sources(facts: &[DiagnosticFact]) -> Vec<SourceId> {
    facts
        .iter()
        .filter_map(|fact| match fact {
            DiagnosticFact::ExactLookupExpected { site, .. } => Some(site.source),
            _ => None,
        })
        .collect()
}

#[test]
fn gated_entries_keep_their_source_id_slots() {
    let dead = dead_file(5);
    let live = live_css_file();
    let facts = analyze_with_panic(&[&dead, &live], None);
    assert_eq!(exact_sources(&facts), vec![SourceId(1)]);
}

#[test]
fn panicked_files_filter_before_source_id_indexing() {
    let dead = dead_file(5);
    let live = live_css_file();
    let facts = analyze_with_panic(&[&dead, "export const = ;;\n", &live], Some(1));
    assert_eq!(exact_sources(&facts), vec![SourceId(1)]);
}

#[test]
fn css_walk_gate_needs_css_bytes() {
    for content in [
        "import { css } from '@reference-ui/react';\nexport const c = css({});\n",
        "export const x = __reference_ui_css({});\n",
        "import * as ns from '@reference-ui/react';\nns.css({});\n",
        "import { css as c } from '@reference-ui/react';\nc.object({});\n",
        // Spaced calls and member spellings keep the walk (conservative).
        "import { css } from '@reference-ui/react';\nexport const c = css ({});\n",
        "export const c = css\n  ({});\n",
    ] {
        assert!(!css_walk_skip(content), "should run css walk: {content:?}");
    }
    for content in [
        "import { Div } from '@reference-ui/react';\nconst el = 'x';\n",
        "import { recipe } from '@reference-ui/react';\nexport const r = recipe({});\n",
        "export const CSS = 1;\n",
        "const el = '<not jsx>';\n",
    ] {
        assert!(css_walk_skip(content), "should skip css walk: {content:?}");
    }
}

#[test]
fn jsx_walk_gate_needs_lt_bytes() {
    for content in [
        "import { Div } from '@reference-ui/react';\nconst el = <Div mt=\"2r\" />;\n",
        // Comparisons, generics, and assertions keep the walk (conservative).
        "export const t = a < b;\n",
        "export const xs: Array<string> = [];\n",
        "const el = '<not jsx>';\n",
    ] {
        assert!(!jsx_walk_skip(content), "should run jsx walk: {content:?}");
    }
    for content in [
        "import { css } from '@reference-ui/react';\nexport const c = css({});\n",
        "import { recipe } from '@reference-ui/react';\nexport const r = recipe({});\n",
        "export const CSS = 1;\n",
    ] {
        assert!(jsx_walk_skip(content), "should skip jsx walk: {content:?}");
    }
}

#[test]
fn lt_free_css_files_keep_their_exact_keys() {
    // The css walk runs (has `css`), the JSX walk skips (no `<`): the exact
    // still predicts, including through a canonical numeric key (owned Cow).
    let css = "import { css } from '@reference-ui/react';\n\
         export const a = css({ color: 'red' });\n\
         export const b = css({ 300: 'x' });\n";
    let facts = analyze_with_panic(&[css], None);
    let keys: Vec<String> = facts
        .iter()
        .filter_map(|fact| match fact {
            DiagnosticFact::ExactLookupExpected { key, .. } => Some(key.lookup_key()),
            _ => None,
        })
        .collect();
    assert_eq!(
        keys,
        vec![
            r#"["test",[],"color","red",false]"#.to_string(),
            r#"["test",[],"300","x",false]"#.to_string(),
        ]
    );
}

#[test]
fn recipe_only_files_predict_nothing_through_either_gate() {
    // Passes `styling_skip` via `recipe`, skips both surface walks: zero
    // facts, exactly as the unskipped walks found.
    let recipe = "import { recipe } from '@reference-ui/react';\n\
         export const r = recipe({ base: { color: 'red' } });\n";
    assert!(!crate::styling_skip(recipe));
    assert!(css_walk_skip(recipe));
    assert!(jsx_walk_skip(recipe));
    assert!(analyze_with_panic(&[recipe], None).is_empty());
}

#[test]
fn css_free_jsx_files_predict_through_the_gate() {
    // The css walk skips (no `css` bytes), the JSX walk runs: the attr exact
    // still predicts.
    let jsx = "import { Div } from '@reference-ui/react';\nconst el = <Div mt=\"2r\" />;\n";
    assert!(css_walk_skip(jsx));
    assert!(!jsx_walk_skip(jsx));
    let facts = crate::diagnostics::analysis::support::analyze_source(jsx);
    let keys: Vec<String> = facts
        .iter()
        .filter_map(|fact| match fact {
            DiagnosticFact::ExactLookupExpected { key, .. } => Some(key.lookup_key()),
            _ => None,
        })
        .collect();
    assert_eq!(keys, vec![r#"["test",[],"mt","2r",false]"#.to_string()]);
}
