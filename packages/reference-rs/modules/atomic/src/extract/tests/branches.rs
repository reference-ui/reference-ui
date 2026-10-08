//! Branch-shape extraction: ternaries, logicals, nesting, and refused dynamics.
//!
//! Proves both arms of every conditional lower as wants, `undefined`
//! alternates vanish, logical operators fold or guard, nested conditions
//! stack their `when` sets, and a refused dynamic value keeps its static
//! siblings while diagnosing on the compiler channel.

use super::{channel_for, compile_code, compile_code_logs};

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
