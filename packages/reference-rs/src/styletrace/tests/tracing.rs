//! Wrapper-analysis coverage for traced JSX exports.

use crate::styletrace::trace_style_jsx_names;

use super::fixtures::styletrace_case_input;

#[test]
fn traces_direct_wrapper_components() {
    let names = trace_style_jsx_names(&styletrace_case_input("direct_wrapper"))
        .expect("expected direct wrapper case to trace");

    assert_eq!(names, vec!["Card".to_string()]);
}

#[test]
fn traces_wrapper_chains() {
    let names = trace_style_jsx_names(&styletrace_case_input("wrapper_chain"))
        .expect("expected wrapper chain case to trace");

    assert_eq!(names, vec!["Card".to_string(), "Surface".to_string()]);
}

#[test]
fn traces_reexport_aliases_as_public_jsx_names() {
    let names = trace_style_jsx_names(&styletrace_case_input("reexport_alias"))
        .expect("expected reexport alias case to trace");

    assert_eq!(names, vec!["Panel".to_string()]);
}

#[test]
fn excludes_components_without_public_style_props() {
    let names = trace_style_jsx_names(&styletrace_case_input("negative"))
        .expect("expected negative case to trace");

    assert!(names.is_empty());
}
