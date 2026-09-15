//! Unit tests validating AST style extraction across complex TypeScript and JSX syntax trees.
//! Tests ternary branch flattening, logical expression analysis, responsive arrays, `r` objects, and call-site handling.
//! Guarantees that compile-time analysis captures all possible runtime styling branches without executing user code.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

#[test]
fn test_flat_and_nested_ternaries() {
    let res = compile_code(
        r#"
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

#[test]
fn test_undefined_alternate_omitted() {
    let res = compile_code(
        r#"export const Comp = ({ active }) => <Div bg={active ? 'n300' : undefined} />"#,
    );
    assert_eq!(res.wants.len(), 1);
    assert_eq!(&*res.wants[0].prop, "bg");
    assert_eq!(res.wants[0].value.to_string(), "n300");
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_logical_expressions_symmetric() {
    let res = compile_code(
        r#"
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
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "red"));
    assert!(res
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
    let res = compile_code(r#"export const Comp = () => <Div mt={['1r', '2r', '4r']} />"#);
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
    let res = compile_code(
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
    assert_eq!(res.diagnostics.len(), 1);
}

#[test]
fn test_css_and_recipe_call_sites() {
    let res = compile_code(
        r#"
        import { css, recipe } from '@reference-ui/react';
        const c1 = css({ mt: '2r' });
        const c2 = css.object({ p: '1r' });
        const button = recipe({
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
    assert!(res.stylesheet.contains(".button {"));
    assert!(res.stylesheet.contains("color: white"));
    assert!(res.stylesheet.contains(".button--size_sm"));
    assert!(res.stylesheet.contains("font-size: 12px"));
    assert!(res.stylesheet.contains("@layer utilities {"));
    assert!(res.stylesheet.contains(".mt_2r"));
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
    assert!(!utilities.contains(".button {"));
    assert!(!utilities.contains(".button--"));
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
            content: r#"export const Comp = () => <Div mt={['1r', '2r', '4r']} />"#.to_string(),
        }]),
        base_system: Some(system),
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
            content: r#"export const Comp = () => <Div p={['10px', '20px', '30px']} />"#
                .to_string(),
        }]),
        base_system: Some(system),
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
        r#"export const Comp = () => <Div r={{ 300: { p: '1r' }, md: { mt: '2r' } }} />"#,
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
