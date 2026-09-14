//! Unit tests validating AST style extraction across complex TypeScript and JSX syntax trees.
//! Tests ternary branch flattening, logical expression analysis, responsive arrays, and call-site handling.
//! Guarantees that compile-time analysis captures all possible runtime styling branches without executing user code.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        root_dir: None,
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
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
    assert!(res.wants.iter().any(|w| &*w.prop == "borderBottom" && w.value.to_string() == "3px solid"));
    assert!(res.wants.iter().any(|w| &*w.prop == "borderBottom" && w.value.to_string() == "3px solid transparent"));
    assert!(res.diagnostics.is_empty());
}

#[test]
fn test_undefined_alternate_omitted() {
    let res = compile_code(r#"export const Comp = ({ active }) => <Div bg={active ? 'n300' : undefined} />"#);
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
    assert!(res.wants.iter().any(|w| &*w.prop == "border" && w.value.to_string() == "1px solid"));
    assert!(res.wants.iter().any(|w| &*w.prop == "color" && w.value.to_string() == "red"));
    assert!(res.wants.iter().any(|w| &*w.prop == "color" && w.value.to_string() == "blue"));
    assert!(res.wants.iter().any(|w| &*w.prop == "bg" && w.value.to_string() == "n200"));
}

#[test]
fn test_responsive_arrays() {
    let res = compile_code(r#"export const Comp = () => <Div mt={['1r', '2r', '4r']} />"#);
    assert_eq!(res.wants.len(), 3);
    assert!(res.wants.iter().any(|w| &*w.prop == "mt" && w.value.to_string() == "1r" && w.when.as_slice() == ["base".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt" && w.value.to_string() == "2r" && w.when.as_slice() == ["sm".into()]));
    assert!(res.wants.iter().any(|w| &*w.prop == "mt" && w.value.to_string() == "4r" && w.when.as_slice() == ["md".into()]));
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
        import { css, cva } from '@reference-ui/styled';
        const c1 = css({ mt: '2r' });
        const c2 = css.raw({ p: '1r' });
        const button = cva({
            base: { color: 'white' },
            variants: {
                size: {
                    sm: { fontSize: '12px' },
                },
            },
        });
        "#,
    );
    assert!(res.wants.iter().any(|w| &*w.prop == "mt" && w.value.to_string() == "2r"));
    assert!(res.wants.iter().any(|w| &*w.prop == "p" && w.value.to_string() == "1r"));
    assert!(res.wants.iter().any(|w| &*w.prop == "color" && w.value.to_string() == "white"));
    assert!(res.wants.iter().any(|w| &*w.prop == "fontSize" && w.value.to_string() == "12px"));
}
