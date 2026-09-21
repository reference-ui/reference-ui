//! Unit tests validating AST style extraction across complex TypeScript and JSX syntax trees.
//! Tests ternary branch flattening, logical expression analysis, responsive arrays, `r` objects, and call-site handling.
//! Guarantees that compile-time analysis captures all possible runtime styling branches without executing user code.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    compile_code_inner(code, Some(vec!["proof".to_string()]))
}

fn compile_code_logs(code: &str) -> crate::CompileResult {
    compile_code_inner(code, Some(vec!["compiler".to_string(), "proof".to_string()]))
}

fn compile_code_inner(code: &str, logs: Option<Vec<String>>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs,
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// Channel lines carrying this code. The backchannel also carries analysis
/// telemetry, so moved-line assertions filter by code.
fn channel_for(res: &crate::CompileResult, code: crate::DiagnosticCode) -> Vec<crate::Diagnostic> {
    res.compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|diag| diag.code == code)
        .cloned()
        .collect()
}

/// True when the want was minted by harvest (the §2 floor), not the site walk.
fn is_harvest(want: &crate::atom::Want) -> bool {
    want.origin.as_deref() == Some(crate::extract::harvest::HARVEST_ORIGIN)
}

#[test]
fn test_flat_and_nested_ternaries() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export const Comp = ({ isLine, horizontal, isSelected }) => (
            <Div
                borderBottom={
                    isLine && horizontal
                        ? isSelected
                            ? '3px solid'
                            : '3px solid transparent'
                        : undefined
                }
            />
        );
        "#,
    );
    assert_eq!(res.wants.len(), 2);
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "borderBottom" && w.value.to_string() == "3px solid"));
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "borderBottom" && w.value.to_string() == "3px solid transparent"));
    assert!(res.diagnostics.is_empty());
}

/// Assert exactly `count` unknown-color diagnostics and nothing else: bare
/// non-token values on color props warn since Forge Slice 1 (§11).
fn assert_unknown_colors(res: &crate::CompileResult, count: usize) {
    assert_eq!(res.diagnostics.len(), count);
    assert!(res
        .diagnostics
        .iter()
        .all(|d| d.message.contains("neither a color token")));
}

#[test]
fn test_undefined_alternate_omitted() {
    let res = compile_code(
        r#"import { Div } from '@reference-ui/react'; export const Comp = ({ active }) => <Div bg={active ? 'n300' : undefined} />"#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(&*res.wants[0].prop, "bg");
    assert_eq!(res.wants[0].value.to_string(), "n300");
    assert_unknown_colors(&res, 1);
}

#[test]
fn test_logical_expressions_fold_and_guard() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export const Comp = ({ isSelected }) => (
            <Div
                border={false && '1px solid'}
                color={'red' || 'blue'}
                bg={isSelected && 'n200'}
            />
        );
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "border" && w.value.to_string() == "1px solid"));
    // 'red' || 'blue' folds to the picked operand; the dead atom is gone.
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "red"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "blue"));
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "bg" && w.value.to_string() == "n200"));
}

#[test]
fn test_responsive_arrays() {
    let res = compile_code(
        r#"import { Div } from '@reference-ui/react'; export const Comp = () => <Div mt={['1r', '2r', '4r']} />"#,
    );
    assert_eq!(res.wants.len(), 3);
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "1r"
        && w.when.as_slice() == ["base".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "2r"
        && w.when.as_slice() == ["sm".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "4r"
        && w.when.as_slice() == ["md".into()]));
}

#[test]
fn test_nested_conditions() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/styled';
        const styles = css({
            _hover: {
                _dark: {
                    bg: 'n500',
                },
            },
        });
        "#,
    );
    assert_eq!(res.wants.len(), 1);
    let want = &res.wants[0];
    assert_eq!(&*want.prop, "bg");
    assert_eq!(want.value.to_string(), "n500");
    assert_eq!(want.when.as_slice(), &["_hover".into(), "_dark".into()]);
}

#[test]
fn test_dynamic_properties_keep_siblings() {
    let res = compile_code_logs(
        r#"
        import { css } from '@reference-ui/styled';
        const styles = css({
            color: 'red',
            width: props.w,
        });
        "#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(&*res.wants[0].prop, "color");
    assert_eq!(res.wants[0].value.to_string(), "red");
    // The refused width is a sink, but the pool holds only `red`, which the
    // kind gate refuses onto a length prop: one warning, one zero-count info.
    // Both ride the compiler channel now; userspace stays silent.
    assert!(res.diagnostics.is_empty());
    let members = channel_for(&res, crate::DiagnosticCode::DynamicMember);
    assert_eq!(members.len(), 1);
    let harvests = channel_for(&res, crate::DiagnosticCode::HarvestSink);
    assert_eq!(harvests.len(), 1);
    assert!(
        harvests[0].message.contains("width under []: 0 harvested values minted"),
        "{}",
        harvests[0].message
    );
}

#[test]
fn test_css_and_recipe_call_sites() {
    let res = compile_code(
        r#"
        import { css, recipe } from '@reference-ui/react';
        const c1 = css({ mt: '2r' });
        const c2 = css.object({ p: '1r' });
        const button = recipe({
            className: 'button',
            base: { color: 'white' },
            variants: {
                size: {
                    sm: { fontSize: '12px' },
                },
            },
        });
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "mt" && w.value.to_string() == "2r"));
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "p" && w.value.to_string() == "1r"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "white"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "fontSize" && w.value.to_string() == "12px"));
    assert_eq!(res.recipes.len(), 1);
    assert_eq!(res.recipes[0].class_name, "button");
    assert!(res.stylesheet.contains("@layer recipes {"));
    assert!(res.stylesheet.contains("button__base"));
    assert!(res.stylesheet.contains("color: white"));
    assert!(res.stylesheet.contains("button_s_sm"));
    assert!(res.stylesheet.contains("font-size: 12px"));
    assert!(res.stylesheet.contains("@layer utilities {"));
    assert!(res.stylesheet.contains(".\\@reference-ui\\/lib__mt_2r"));
    let recipes_at = res
        .stylesheet
        .find("@layer recipes {")
        .expect("recipes layer");
    let utilities_at = res
        .stylesheet
        .find("@layer utilities {")
        .expect("utilities layer");
    assert!(recipes_at < utilities_at);
    let utilities = &res.stylesheet[utilities_at..];
    assert!(!utilities.contains(".button"));
}

#[test]
fn test_css_raw_is_not_an_extract_site() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const leftover = css.raw({ p: '1r' });
        "#,
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_unknown_helpers_are_not_extract_sites() {
    let res = compile_code(
        r#"
        const alert = sva({
            slots: ['root', 'icon'],
            base: {
                root: { padding: '4r', borderRadius: 'md' },
                icon: { color: 'green' },
            },
        });
        "#,
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_custom_breakpoint_scale() {
    let mut system = crate::BaseSystem::default();
    system.breakpoints = crate::BreakpointScale::from_names(["tablet", "desktop"]);

    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: r#"import { Div } from '@reference-ui/react'; export const Comp = () => <Div mt={['1r', '2r', '4r']} />"#
                .to_string(),
        }]),
        base_system: system,
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    let res = compile(&req).expect("compile succeeds");
    assert_eq!(res.wants.len(), 3);
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "1r"
        && w.when.as_slice() == ["base".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "2r"
        && w.when.as_slice() == ["tablet".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "4r"
        && w.when.as_slice() == ["desktop".into()]));
}

#[test]
fn test_tokens_breakpoints_scale() {
    let mut system = crate::BaseSystem::default();
    system.breakpoints =
        crate::BreakpointScale::from_named_widths([("wide", "1000"), ("ultra", "1600")]);

    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: r#"import { Div } from '@reference-ui/react'; export const Comp = () => <Div p={['10px', '20px', '30px']} />"#
                .to_string(),
        }]),
        base_system: system,
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    let res = compile(&req).expect("compile succeeds");
    assert_eq!(res.wants.len(), 3);
    assert!(res.wants.iter().any(|w| &*w.prop == "p"
        && w.value.to_string() == "10px"
        && w.when.as_slice() == ["base".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "p"
        && w.value.to_string() == "20px"
        && w.when.as_slice() == ["wide".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "p"
        && w.value.to_string() == "30px"
        && w.when.as_slice() == ["ultra".into()]));
}

#[test]
fn test_locked_aliases_follow_canon() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export const Comp = () => (
            <Div
                mt="10px"
                px="20px"
                w="100px"
                flexDir="column"
                rounded="md"
                c="red"
                pos="absolute"
                ps="15px"
                borderX="1px solid"
            />
        );
        "#,
    );
    // Locked aliases must extract as style props
    assert!(
        res.wants.iter().any(|w| &*w.prop == "mt"),
        "mt must extract"
    );
    assert!(
        res.wants.iter().any(|w| &*w.prop == "px"),
        "px must extract"
    );
    assert!(res.wants.iter().any(|w| &*w.prop == "w"), "w must extract");
    assert!(
        res.wants.iter().any(|w| &*w.prop == "flexDir"),
        "flexDir must extract"
    );

    // Refused aliases must NOT extract as style props
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "rounded"),
        "rounded must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "c"),
        "c must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "pos"),
        "pos must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "ps"),
        "ps must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "borderX"),
        "borderX must NOT extract"
    );
}

#[test]
fn test_responsive_r_object() {
    let res = compile_code(
        r#"import { Div } from '@reference-ui/react'; export const Comp = () => <Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />"#,
    );
    assert!(res.wants.iter().any(|w| &*w.prop == "p"
        && w.value.to_string() == "1r"
        && w.when.as_slice() == ["@container (min-width: 300px)".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt"
        && w.value.to_string() == "2r"
        && w.when.as_slice() == ["@container (min-width: 768px)".into()]));
    assert!(res.stylesheet.contains("@container (min-width: 300px)"));
    assert!(res.stylesheet.contains("@container (min-width: 768px)"));
}

#[test]
fn test_baked_object_entry_never_resolves_stale() {
    // Soundness net for the scope dep-strip (SPEC-V2-34 object half): the
    // entry baked from `red` strips when `red` is written, so the stale
    // init never resolves at the site and the use diagnoses instead of
    // ghosting. Harvest still mints the program's literals onto the refused
    // sink (Forge §2/§3: both colors harvest; which is live is a write
    // question) — those wants carry the harvest origin, never the site's.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        let red = 'red';
        const theme = { primary: red };
        red = 'blue';
        export const a = css({ color: theme.primary });"#,
    );
    assert!(res
        .wants
        .iter()
        .filter(|w| !is_harvest(w))
        .all(|w| w.value.to_string() != "red"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "red"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "blue"));
    assert!(res.diagnostics.is_empty());
    let members = channel_for(&res, crate::DiagnosticCode::DynamicMember);
    assert_eq!(members.len(), 1);
    let harvests = channel_for(&res, crate::DiagnosticCode::HarvestSink);
    assert_eq!(harvests.len(), 1);
}

#[test]
fn test_destructured_name_never_resolves_stale() {
    // Soundness net for destructure provenance (SPEC-V2-32): names copied
    // from a written object strip with it — the stale leaf never resolves
    // at the site. Harvest still mints the program's literals onto the
    // refused sink (Forge §2/§3) under the harvest origin, never the site's.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        let theme = { primary: 'red' };
        const { primary } = theme;
        theme.primary = 'blue';
        export const a = css({ color: primary });"#,
    );
    assert!(res
        .wants
        .iter()
        .filter(|w| !is_harvest(w))
        .all(|w| w.value.to_string() != "red"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "red"));
    assert!(res
        .wants
        .iter()
        .any(|w| is_harvest(w) && w.value.to_string() == "blue"));
    assert!(res.diagnostics.is_empty());
    let idents = channel_for(&res, crate::DiagnosticCode::DynamicIdentifier);
    assert_eq!(idents.len(), 1);
    assert!(idents[0].message.contains("'primary'"), "{}", idents[0].message);
}

#[test]
fn test_delete_poison_never_resolves_stale() {
    // Soundness net for `delete` as a write (SPEC-V2-81): the deleted init
    // drops exactly like an assignment, with a diagnostic naming the delete.
    let res = compile_code_logs(
        r#"import { css } from '@reference-ui/react';
        const o = { color: 'red' };
        delete o.color;
        export const a = css({ color: o.color });"#,
    );
    assert!(res.wants.is_empty());
    assert!(res.diagnostics.is_empty());
    let poisoned = channel_for(&res, crate::DiagnosticCode::MutatedBinding);
    assert_eq!(poisoned.len(), 1);
    assert!(poisoned[0].message.contains("deleted at"));
}

#[test]
fn test_bare_extract_collects_file_mutations() {
    // The single-file `extract()` backs its import stub with the file's own
    // constants, so a write in the file poisons instead of resolving stale.
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    let code = r#"import { css } from '@reference-ui/react';
        const o = { color: 'red' };
        delete o.color;
        export const a = css({ color: o.color });"#;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
        .unwrap_or_default()
        .with_typescript(true);
    let parsed = Parser::new(&allocator, code, source_type).parse();
    assert!(!parsed.panicked);

    let system = crate::BaseSystem::lib_fixture().clone();
    let mut wants = Vec::new();
    let mut recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let sinks = crate::extract::ExtractSinks {
        wants: &mut wants,
        recipes: &mut recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut Vec::new(),
        session: &mut crate::diagnostics::DiagnosticsSession::new(),
    };
    crate::extract::extract(&parsed.program, "t.ts", system.breakpoints(), sinks);

    assert!(wants.is_empty());
    assert_eq!(diagnostics.len(), 1);
    assert!(diagnostics[0].message.contains("deleted at"));
}

#[test]
fn test_spread_call_refusal_warns_without_sink() {
    // Slice 3 Q5b exclusion pin: a folded-object spread warns its refused
    // call fragments without recording a harvest sink — the fragment is
    // interior to the call's arguments with no prop in scope, so it is not
    // a mintable value position. The folded entries still lower.
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    let code = r#"import { css } from '@reference-ui/react';
        const pick = (o) => o;
        export const a = css({ ...pick({ color: 'red', bg: dyn }) });"#;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
        .unwrap_or_default()
        .with_typescript(true);
    let parsed = Parser::new(&allocator, code, source_type).parse();
    assert!(!parsed.panicked);

    let system = crate::BaseSystem::lib_fixture().clone();
    let mut wants = Vec::new();
    let mut recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let mut sinks = Vec::new();
    let sinks_to = crate::extract::ExtractSinks {
        wants: &mut wants,
        recipes: &mut recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut sinks,
        session: &mut crate::diagnostics::DiagnosticsSession::new(),
    };
    crate::extract::extract(&parsed.program, "t.ts", system.breakpoints(), sinks_to);

    assert!(wants.iter().any(|w| &*w.prop == "color"));
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(
        diagnostics[0].code,
        crate::diagnostics::DiagnosticCode::DynamicExpression
    );
    assert!(diagnostics[0].message.contains("keeping sibling properties"));
    assert!(sinks.is_empty(), "spread refusals record no sink");
}
