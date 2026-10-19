//! Assembly tests for the token scope under composition: which upstream stamps the own token layer claims.
//! `extended_for` keeps the foreign qualifiers the request names as extended, in qualifier order, and drops
//! the own name and anything unqualified. The compile cases read both sheets of one lib-fixture compile:
//! an extended upstream's `[data-layer]` joins the own token selectors, and a layered one never does.

use super::extended_for;
use crate::{compile, BaseSystem, CompileRequest, VirtualSource};

fn names(list: &[&str]) -> Vec<String> {
    list.iter().map(|name| (*name).to_string()).collect()
}

#[test]
fn extended_follows_qualifier_order_and_drops_own_and_unqualified_names() {
    let qualifiers = names(&["own", "base", "layered", "mid"]);
    let extended = names(&["mid", "own", "ghost", "base"]);
    assert_eq!(extended_for(&qualifiers, &extended), names(&["base", "mid"]));
}

#[test]
fn a_standalone_compile_claims_no_extended_stamp() {
    assert!(extended_for(&names(&["own"]), &names(&["base"])).is_empty());
}

fn compile_composed(upstream: &[&str], extended: &[&str]) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".into(),
            content: "import { Div } from '@reference-ui/react';\
                      export const a = <Div color=\"blue.600\" />;"
                .into(),
        }]),
        base_system: BaseSystem::lib_fixture().clone(),
        upstream_systems: names(upstream),
        extended_systems: names(extended),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// The first selector line of the sheet's `@layer tokens` block.
fn token_selector_line(sheet: &str) -> &str {
    let (_, tokens) = sheet
        .split_once("@layer tokens {\n")
        .expect("the sheet prints a token layer");
    tokens.lines().next().expect("the token layer opens a rule")
}

#[test]
fn an_extended_upstream_stamp_joins_both_own_token_scopes_and_a_layered_one_never_does() {
    let res = compile_composed(&["acme", "icons"], &["acme"]);
    let served = token_selector_line(&res.stylesheet);
    assert!(served.starts_with("  :root, "), "{served}");
    assert!(
        served.ends_with(
            "[data-layer=\"@reference-ui/lib\"][data-color-mode=light], [data-layer=\"acme\"], [data-layer=\"acme\"][data-color-mode=light] {"
        ),
        "{served}"
    );
    let portable = token_selector_line(&res.streams.tokens_portable);
    assert!(
        portable.ends_with("[data-layer=\"acme\"], [data-layer=\"acme\"][data-color-mode=light] {"),
        "{portable}"
    );
    for line in [served, portable] {
        assert!(!line.contains("icons"), "a layered upstream keeps its values: {line}");
    }
}

#[test]
fn layers_only_keeps_the_isolated_scope_byte_identical() {
    let layered = compile_composed(&["icons"], &[]);
    let ghost = compile_composed(&["icons"], &["ghost"]);
    assert_eq!(layered.stylesheet, ghost.stylesheet);
    assert!(
        token_selector_line(&layered.stylesheet).ends_with(
            "[data-layer=\"@reference-ui/lib\"], [data-layer=\"@reference-ui/lib\"][data-color-mode=light] {"
        ),
        "{}",
        layered.stylesheet
    );
}
