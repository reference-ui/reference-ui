//! Value-graph compiles over virtual sources: the §1 three-file fold and
//! its cycle arm, star barrels and ambiguous twins, §3 origin precision,
//! and refused default/namespace edges. Each case compiles whole files, so
//! the single parse, the demand-driven bake, and the use-site floor run
//! exactly as they do for stations.

use crate::{compile, CompileRequest, VirtualSource};

/// Compile virtual sources, asserting the request succeeds.
fn compile_files(files: &[(&str, &str)]) -> crate::CompileResult {
    compile_files_inner(files, Some(vec!["proof".to_string()]))
}

/// Compile virtual sources with the compiler backchannel requested.
fn compile_files_logs(files: &[(&str, &str)]) -> crate::CompileResult {
    compile_files_inner(files, Some(vec!["compiler".to_string(), "proof".to_string()]))
}

fn compile_files_inner(files: &[(&str, &str)], logs: Option<Vec<String>>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .iter()
                .map(|(path, content)| VirtualSource {
                    path: path.to_string(),
                    content: content.to_string(),
                })
                .collect(),
        ),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs,
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// True when a want carries this prop and authored string value.
fn has_want(result: &crate::CompileResult, prop: &str, value: &str) -> bool {
    result.wants.iter().any(|want| {
        want.prop.as_ref() == prop
            && matches!(&want.value, crate::atom::AtomValue::String(text) if text.as_ref() == value)
    })
}

/// True when a site (non-harvest) want carries this prop and value: the
/// refusal half of a §2-floor assertion, where harvest still mints.
fn has_site_want(result: &crate::CompileResult, prop: &str, value: &str) -> bool {
    result.wants.iter().any(|want| {
        want.prop.as_ref() == prop
            && want.origin.as_deref() != Some(crate::extract::harvest::HARVEST_ORIGIN)
            && matches!(&want.value, crate::atom::AtomValue::String(text) if text.as_ref() == value)
    })
}

/// Messages of diagnostics carrying this code.
fn messages_for(result: &crate::CompileResult, code: crate::DiagnosticCode) -> Vec<String> {
    result
        .diagnostics
        .iter()
        .filter(|diag| diag.code == code)
        .map(|diag| diag.message.clone())
        .collect()
}

/// Messages of compiler-channel diagnostics carrying this code.
fn channel_messages_for(result: &crate::CompileResult, code: crate::DiagnosticCode) -> Vec<String> {
    result
        .compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|diag| diag.code == code)
        .map(|diag| diag.message.clone())
        .collect()
}

#[test]
fn nested_import_spread_folds_across_three_files() {
    let res = compile_files(&[
        ("/v/src/base.ts", "export const base = { color: 'red' }"),
        (
            "/v/src/tokens.ts",
            "import { base } from './base'\nexport const button = { ...base, padding: '4px' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { button } from './tokens'\nexport const x = css(button)",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(has_want(&res, "padding", "4px"));
    assert!(messages_for(&res, crate::DiagnosticCode::UnfoldableSpread).is_empty());
}

#[test]
fn cyclic_value_chase_diagnoses_with_a_cycle_reason() {
    let res = compile_files_logs(&[
        (
            "/v/src/a.ts",
            "import { b } from './b'\nexport const a = { ...b, padding: '4px' }",
        ),
        (
            "/v/src/b.ts",
            "import { a } from './a'\nexport const b = { ...a, margin: '2px' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { a } from './a'\nexport const x = css(a)",
        ),
    ]);
    assert!(has_want(&res, "padding", "4px"));
    assert!(messages_for(&res, crate::DiagnosticCode::UnfoldableSpread).is_empty());
    let spreads = channel_messages_for(&res, crate::DiagnosticCode::UnfoldableSpread);
    assert_eq!(spreads.len(), 1);
    assert!(
        spreads[0].contains("could not be read (cycle "),
        "{spreads:?}"
    );
}

#[test]
fn inner_origin_refused_mid_cycle_folds_on_later_direct_use() {
    // The D2 arm: `cycle-b` reads `zest` while `cycle-a` is mid-refinement,
    // so the chase refuses it with the cycle — but the refusal never
    // memoizes, and the app's later direct use folds the refined scalar.
    let res = compile_files_logs(&[
        (
            "/v/src/cycle-a.ts",
            "import { bee } from './cycle-b'\nexport const aye = { ...bee, padding: '6px' }\nexport const zest = 'chartreuse'",
        ),
        (
            "/v/src/cycle-b.ts",
            "import { aye, zest } from './cycle-a'\nexport const bee = { ...aye, margin: '8px' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { aye } from './cycle-a'\nimport { zest } from './cycle-a'\nexport const cycled = css(aye)\nexport const inner = css({ color: zest })",
        ),
    ]);
    assert!(has_want(&res, "padding", "6px"));
    assert!(has_want(&res, "color", "chartreuse"));
    assert!(messages_for(&res, crate::DiagnosticCode::DynamicIdentifier).is_empty());
    assert!(messages_for(&res, crate::DiagnosticCode::UnfoldableObjectProp).is_empty());
    assert!(messages_for(&res, crate::DiagnosticCode::UnfoldableSpread).is_empty());
    let spreads = channel_messages_for(&res, crate::DiagnosticCode::UnfoldableSpread);
    assert_eq!(spreads.len(), 1);
}

#[test]
fn star_barrel_resolves_named_imports() {
    let res = compile_files(&[
        ("/v/src/tokens.ts", "export const brand = 'red'"),
        ("/v/src/barrel.ts", "export * from './tokens'"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { brand } from './barrel'\nexport const x = css({ color: brand })",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
}

#[test]
fn ambiguous_star_twin_refuses_the_import() {
    let res = compile_files_logs(&[
        ("/v/src/a.ts", "export const tone = 'red'"),
        ("/v/src/b.ts", "export const tone = 'blue'"),
        (
            "/v/src/barrel.ts",
            "export * from './a'\nexport * from './b'",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { tone } from './barrel'\nexport const x = css({ color: tone })",
        ),
    ]);
    // The twin refuses at the site, but both literals harvest onto the
    // refused sink (Forge §1: harvest can hide the miss; the fold stands).
    assert!(!has_site_want(&res, "color", "red"));
    assert!(!has_site_want(&res, "color", "blue"));
    assert!(has_want(&res, "color", "red"));
    assert!(has_want(&res, "color", "blue"));
    assert!(
        !channel_messages_for(&res, crate::DiagnosticCode::DynamicIdentifier).is_empty(),
        "the refused import still diagnoses"
    );
}

#[test]
fn cross_file_poison_is_precise_to_the_origin() {
    let res = compile_files(&[
        ("/v/src/tokens.ts", "export let glow = '#f59e0b'"),
        ("/v/src/unrelated.ts", "let glow = '#111'\nglow = '#222'"),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { glow } from './tokens'\nexport const x = css({ color: glow })",
        ),
    ]);
    assert!(has_want(&res, "color", "#f59e0b"));
    assert!(messages_for(&res, crate::DiagnosticCode::MutatedBinding).is_empty());
}

#[test]
fn mutated_origin_names_its_own_write() {
    let res = compile_files_logs(&[
        (
            "/v/src/tokens.ts",
            "export let glow = '#f59e0b'\nglow = '#222'",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { glow } from './tokens'\nexport const x = css({ color: glow })",
        ),
    ]);
    assert!(!has_want(&res, "color", "#f59e0b"));
    assert!(messages_for(&res, crate::DiagnosticCode::MutatedBinding).is_empty());
    let poisoned = channel_messages_for(&res, crate::DiagnosticCode::MutatedBinding);
    assert_eq!(poisoned.len(), 1);
    assert!(poisoned[0].contains("'glow'"), "{poisoned:?}");
}

#[test]
fn unimported_dead_file_leaves_folds_identical() {
    // The skip path end to end: the dead exporter unstages (no edges, no
    // importers) while the live chain folds through staged files.
    let res = compile_files(&[
        (
            "/v/src/dead.ts",
            "export const FACTOR_1 = 8\nexport function combine1(left: number, right: number): number {\n  return (left + right) * FACTOR_1\n}",
        ),
        ("/v/src/base.ts", "export const base = { color: 'red' }"),
        (
            "/v/src/tokens.ts",
            "import { base } from './base'\nexport const button = { ...base, padding: '4px' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport { button } from './tokens'\nexport const x = css(button)",
        ),
    ]);
    assert!(has_want(&res, "color", "red"));
    assert!(has_want(&res, "padding", "4px"));
    assert!(messages_for(&res, crate::DiagnosticCode::UnfoldableSpread).is_empty());
}

#[test]
fn default_and_namespace_edges_refuse_values() {
    let res = compile_files_logs(&[
        (
            "/v/src/tokens.ts",
            "export const brand = 'red'\nexport default { color: 'red' }",
        ),
        (
            "/v/src/app.ts",
            "import { css } from '@reference-ui/react'\nimport * as t from './tokens'\nimport tokens from './tokens'\nexport const a = css({ color: t.brand })\nexport const b = css(tokens)",
        ),
    ]);
    // Namespace and default edges refuse at the site (§6), but the literal
    // harvests onto the refused member sink (Forge §2 floor).
    assert!(!has_site_want(&res, "color", "red"));
    assert!(has_want(&res, "color", "red"));
    assert!(
        !channel_messages_for(&res, crate::DiagnosticCode::DynamicMember).is_empty(),
        "the refused member still diagnoses"
    );
}
