//! Wrapper-analysis coverage for traced JSX exports.

use crate::styletrace::trace_style_jsx_names;

use super::fixtures::{styletrace_case_input, workspace_fixture_dir};

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
fn traces_export_star_barrels() {
    let names = trace_style_jsx_names(&styletrace_case_input("export_star_barrel"))
        .expect("expected export-star barrel case to trace");

    assert_eq!(names, vec!["Card".to_string()]);
}

#[test]
fn excludes_components_without_public_style_props() {
    let names = trace_style_jsx_names(&styletrace_case_input("negative"))
        .expect("expected negative case to trace");

    assert!(names.is_empty());
}

#[test]
fn traces_wrappers_that_forward_rest_style_props() {
    let names = trace_style_jsx_names(&styletrace_case_input("rest_spread_wrapper"))
        .expect("expected rest-spread case to trace");

    assert_eq!(names, vec!["Card".to_string()]);
}

#[test]
fn traces_forward_ref_wrappers_with_style_prop_generics() {
    let names = trace_style_jsx_names(&styletrace_case_input("forward_ref_wrapper"))
        .expect("expected forwardRef case to trace");

    assert_eq!(names, vec!["Card".to_string()]);
}

#[test]
fn traces_namespace_import_wrappers() {
    let names = trace_style_jsx_names(&styletrace_case_input("namespace_import"))
        .expect("expected namespace import case to trace");

    assert_eq!(names, vec!["Card".to_string()]);
}

#[test]
fn traces_components_that_use_the_reference_style_pipeline_without_primitives() {
    let names = trace_style_jsx_names(&styletrace_case_input("direct_style_pipeline"))
        .expect("expected direct style pipeline case to trace");

    assert_eq!(names, vec!["Panel".to_string()]);
}

#[test]
fn traces_factory_generated_icons_and_wrappers() {
    let names = trace_style_jsx_names(&styletrace_case_input("icon_factory"))
        .expect("expected icon factory case to trace");

    assert_eq!(
        names,
        vec!["StarIcon".to_string(), "ToolbarIcon".to_string()]
    );
}

#[test]
fn traces_local_exports_that_forward_into_node_modules_wrappers() {
    let names = trace_style_jsx_names(&styletrace_case_input("node_modules_wrapper"))
        .expect("expected node_modules wrapper case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_default_export_wrappers_from_packages() {
    let names = trace_style_jsx_names(&styletrace_case_input("default_export_package"))
        .expect("expected default-export package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_subpath_package_wrappers() {
    let names = trace_style_jsx_names(&styletrace_case_input("subpath_package"))
        .expect("expected subpath package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_export_star_package_barrels() {
    let names = trace_style_jsx_names(&styletrace_case_input("export_star_package"))
        .expect("expected export-star package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn fixture_demo_ui_has_no_reference_style_bearing_exports() {
    let names = trace_style_jsx_names(&workspace_fixture_dir("fixtures/demo-ui/src"))
        .expect("expected demo-ui fixture to trace");

    assert!(names.is_empty());
}

#[test]
fn fixture_extend_library_has_no_reference_style_bearing_exports() {
    let names = trace_style_jsx_names(&workspace_fixture_dir("fixtures/extend-library/src"))
        .expect("expected extend-library fixture to trace");

    assert!(names.is_empty());
}

#[test]
fn fixture_styletrace_library_exports_wrapped_reference_components() {
    let names = trace_style_jsx_names(&workspace_fixture_dir("fixtures/styletrace-library/src"))
        .expect("expected styletrace-library fixture to trace");

    assert_eq!(names, vec!["MyStyleComponent".to_string()]);
}

#[test]
fn fixture_styletrace_consumer_traces_imported_wrapped_reference_components() {
    let names = trace_style_jsx_names(&workspace_fixture_dir("fixtures/styletrace-consumer/src"))
        .expect("expected styletrace-consumer fixture to trace");

    assert_eq!(
        names,
        vec![
            "ConsumerStyleComponent".to_string(),
            "MyStyleComponent".to_string(),
        ]
    );
}

#[test]
fn fixture_atlas_project_components_have_no_reference_style_bearing_exports() {
    let names = trace_style_jsx_names(&workspace_fixture_dir(
        "fixtures/atlas-project/src/components",
    ))
    .expect("expected atlas-project fixture components to trace");

    assert!(names.is_empty());
}
