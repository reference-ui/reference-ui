//! Responsive extraction: arrays, breakpoint scales, and `r` objects.
//!
//! Proves positional values fan out over the active breakpoint scale,
//! custom scales (names or widths) retarget the fan-out, and the `r`
//! object lowers numeric and named keys to container queries with
//! matching `@container` rules in the sheet.

use crate::{compile, CompileRequest, VirtualSource};

use super::compile_code;

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
