//! Provides unit test coverage for the wrapper-analysis subsystem, focusing on traced JSX exports.
//! It takes simulated React component hierarchies and styled components written in TSX.
//! Runs the analyzer to verify that property forwarding and style overrides are correctly identified.
//! Package-wrapper stations load committed `tests/cases/<id>/input` rather than duplicating source strings.

use crate::trace_style_jsx_names_with_hint;

use super::fixtures::{
    materialize_station, workspace_fixture_dir, workspace_scratch_dir, workspace_sync_root,
    ScratchDir,
};

fn trace_with_sync_root(root_dir: &std::path::Path) -> Result<Vec<String>, crate::StyleTraceError> {
    let sync_root = workspace_sync_root();
    trace_style_jsx_names_with_hint(root_dir, Some(sync_root.as_path()))
}

#[test]
fn traces_local_exports_that_forward_into_node_modules_wrappers() {
    let fixture = materialize_station("node_modules_wrapper");
    let names =
        trace_with_sync_root(fixture.root()).expect("expected node_modules wrapper case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_default_export_wrappers_from_packages() {
    let fixture = materialize_station("default_export_package");
    let names = trace_with_sync_root(fixture.root())
        .expect("expected default-export package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_subpath_package_wrappers() {
    let fixture = materialize_station("subpath_package");
    let names =
        trace_with_sync_root(fixture.root()).expect("expected subpath package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_export_star_package_barrels() {
    let fixture = materialize_station("export_star_package");
    let names =
        trace_with_sync_root(fixture.root()).expect("expected export-star package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_body_destructured_direct_forwarding() {
    let fixture = workspace_scratch_dir("body-destructure-direct");
    fixture.write(
        "input/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type CardProps = StyleProps & {\n  title?: string\n}\n\nexport function ParamCard({ color }: CardProps) {\n  return <Div color={color} />\n}\n\nexport function BodyCard(props: CardProps) {\n  const { color } = props\n  return <Div color={color} />\n}\n",
    );
    let names =
        trace_with_sync_root(fixture.root()).expect("expected body-destructure direct case to trace");

    assert_eq!(names, vec!["BodyCard".to_string(), "ParamCard".to_string()]);
}

#[test]
fn traces_body_destructured_rest_forwarding() {
    let fixture = workspace_scratch_dir("body-destructure-rest");
    fixture.write(
        "input/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type CardProps = StyleProps & {\n  title?: string\n}\n\nexport function ParamCard({ color }: CardProps) {\n  return <Div color={color} />\n}\n\nexport function BodyRestCard(props: CardProps) {\n  const { title, ...rest } = props\n  return <Div {...rest}>{title}</Div>\n}\n",
    );
    let names =
        trace_with_sync_root(fixture.root()).expect("expected body-destructure rest case to trace");

    assert_eq!(
        names,
        vec!["BodyRestCard".to_string(), "ParamCard".to_string()]
    );
}

#[test]
fn traces_pipeline_object_and_array_literal_args() {
    let fixture = workspace_scratch_dir("pipeline-literal-args");
    fixture.write(
        "input/index.tsx",
        "import { css } from '@reference-ui/styled/css'\nimport type { StyleProps } from '@reference-ui/react'\n\nexport type CardProps = StyleProps & {\n  title?: string\n}\n\nexport function IdentCard({ color }: CardProps) {\n  return <div className={css(color)} />\n}\n\nexport function ObjCard({ color }: CardProps) {\n  return <div className={css({ color })} />\n}\n\nexport function MemberObjCard(props: CardProps) {\n  return <div className={css({ color: props.color })} />\n}\n\nexport function ArrCard({ color }: CardProps) {\n  return <div className={css([color])} />\n}\n\nexport function IndirectCard({ color }: CardProps) {\n  const obj = { color }\n  return <div className={css(obj)} />\n}\n",
    );
    let names = trace_with_sync_root(fixture.root())
        .expect("expected pipeline literal-arg case to trace");

    assert_eq!(
        names,
        vec![
            "ArrCard".to_string(),
            "IdentCard".to_string(),
            "MemberObjCard".to_string(),
            "ObjCard".to_string(),
        ]
    );
}

#[test]
fn traces_jsx_fallback_forwarding_but_not_test_only_reads() {
    let fixture = workspace_scratch_dir("jsx-fallback-forwarding");
    fixture.write(
        "input/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type CardProps = StyleProps & {\n  title?: string\n}\n\nexport function DirectCard({ color }: CardProps) {\n  return <Div color={color} />\n}\n\nexport function NullishCard({ color }: CardProps) {\n  return <Div color={color ?? \"red\"} />\n}\n\nexport function TernaryCard({ color, title }: CardProps) {\n  return <Div color={title ? color : \"red\"} />\n}\n\nexport function TestOnlyCard({ color }: CardProps) {\n  return <Div color={color ? \"blue\" : \"red\"} />\n}\n",
    );
    let names = trace_with_sync_root(fixture.root())
        .expect("expected jsx fallback-forwarding case to trace");

    assert_eq!(
        names,
        vec![
            "DirectCard".to_string(),
            "NullishCard".to_string(),
            "TernaryCard".to_string(),
        ]
    );
}

#[test]
fn traces_pipeline_fallback_args_but_not_rebound_fallbacks() {
    let fixture = workspace_scratch_dir("pipeline-fallback-args");
    fixture.write(
        "input/index.tsx",
        "import { css } from '@reference-ui/styled/css'\nimport type { StyleProps } from '@reference-ui/react'\n\nexport type CardProps = StyleProps & {\n  title?: string\n}\n\nexport function PipeObjCard({ color }: CardProps) {\n  return <div className={css({ color })} />\n}\n\nexport function PipeNullishCard({ color }: CardProps) {\n  return <div className={css({ color: color ?? \"red\" })} />\n}\n\nexport function PipeTernaryCard({ color, title }: CardProps) {\n  return <div className={css({ color: title ? color : \"red\" })} />\n}\n\nexport function PipeTestOnlyCard({ color }: CardProps) {\n  return <div className={css({ color: color ? \"blue\" : \"red\" })} />\n}\n\nexport function RebindCard({ color }: CardProps) {\n  const rebound = color ?? \"red\"\n  return <div className={css(rebound)} />\n}\n",
    );
    let names = trace_with_sync_root(fixture.root())
        .expect("expected pipeline fallback-arg case to trace");

    assert_eq!(
        names,
        vec![
            "PipeNullishCard".to_string(),
            "PipeObjCard".to_string(),
            "PipeTernaryCard".to_string(),
        ]
    );
}

#[test]
fn ignores_node_builtin_helper_imports_while_tracing_local_wrappers() {
    let fixture = create_node_builtin_helper_fixture();
    let names =
        trace_with_sync_root(fixture.root()).expect("expected node builtin helper case to trace");

    assert_eq!(names, vec!["AppCard".to_string()]);
}

#[test]
fn fixture_demo_ui_has_no_reference_style_bearing_exports() {
    let names = trace_with_sync_root(&workspace_fixture_dir("fixtures/demo-ui/src"))
        .expect("expected demo-ui fixture to trace");

    assert!(names.is_empty());
}

#[test]
fn fixture_extend_library_has_no_reference_style_bearing_exports() {
    let names = trace_with_sync_root(&workspace_fixture_dir(
        "fixtures/extend-library/src/components",
    ))
    .expect("expected extend-library fixture to trace");

    assert!(names.is_empty());
}

#[test]
fn fixture_styletrace_library_exports_wrapped_reference_components() {
    let names = trace_with_sync_root(&workspace_fixture_dir("fixtures/styletrace-library/src"))
        .expect("expected styletrace-library fixture to trace");

    assert_eq!(names, vec!["MyStyleComponent".to_string()]);
}

#[test]
fn fixture_styletrace_consumer_traces_imported_wrapped_reference_components() {
    let names = trace_with_sync_root(&workspace_fixture_dir("fixtures/styletrace-consumer/src"))
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
    let names = trace_with_sync_root(&workspace_fixture_dir(
        "fixtures/atlas-project/src/components",
    ))
    .expect("expected atlas-project fixture components to trace");

    assert!(names.is_empty());
}

#[test]
fn clean_consumer_sync_root_without_generated_metadata_fails_explicitly() {
    let fixture = ScratchDir::new("clean-consumer-sync-root");
    fixture.write(
        "consumer-app/ui.config.ts",
        "export default { include: ['src/**/*.{ts,tsx}'] }\n",
    );
    fixture.write(
        "consumer-app/src/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport interface AppCardProps extends StyleProps {\n  color?: string\n}\n\nexport function AppCard(props: AppCardProps) {\n  return <Div {...props} />\n}\n",
    );

    let sync_root = fixture.root().join("consumer-app");
    let result = trace_style_jsx_names_with_hint(&sync_root.join("src"), Some(&sync_root));
    assert!(
        result.is_err(),
        "expected missing generated metadata to return explicit StyleTraceError"
    );
}

fn create_node_builtin_helper_fixture() -> super::fixtures::ScratchDir {
    let fixture = workspace_scratch_dir("node-builtin-helper");
    fixture.write(
        "input/index.tsx",
        "import { resolveLabel } from './helpers'\nimport { Div, type StyleProps } from '@reference-ui/react'\n\nexport interface AppCardProps extends StyleProps {\n  label?: string\n}\n\nexport function AppCard({ label = 'Card', ...styleProps }: AppCardProps) {\n  return <Div data-label={resolveLabel(label)} {...styleProps} />\n}\n",
    );
    fixture.write(
        "input/helpers.ts",
        "import { join } from 'node:path'\n\nexport function resolveLabel(label: string) {\n  return join('ui', label)\n}\n",
    );
    fixture
}
