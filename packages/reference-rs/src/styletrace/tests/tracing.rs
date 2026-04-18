//! Wrapper-analysis coverage for traced JSX exports.

use crate::styletrace::trace_style_jsx_names;

use super::fixtures::{styletrace_case_input, workspace_fixture_dir, workspace_scratch_dir};

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
    let fixture = create_node_modules_wrapper_fixture();
    let names = trace_style_jsx_names(fixture.root())
        .expect("expected node_modules wrapper case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_default_export_wrappers_from_packages() {
    let fixture = create_default_export_package_fixture();
    let names = trace_style_jsx_names(fixture.root())
        .expect("expected default-export package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_subpath_package_wrappers() {
    let fixture = create_subpath_package_fixture();
    let names = trace_style_jsx_names(fixture.root())
        .expect("expected subpath package case to trace");

    assert_eq!(
        names,
        vec!["AppCard".to_string(), "PackageCard".to_string()]
    );
}

#[test]
fn traces_export_star_package_barrels() {
    let fixture = create_export_star_package_fixture();
    let names = trace_style_jsx_names(fixture.root())
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
    let names = trace_style_jsx_names(&workspace_fixture_dir("fixtures/extend-library/src/components"))
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

fn create_node_modules_wrapper_fixture() -> super::fixtures::ScratchDir {
    let fixture = workspace_scratch_dir("node-modules-wrapper");
    fixture.write(
        "input/index.tsx",
        "import { PackageCard, type PackageCardProps } from 'fixture-style-lib'\n\nexport type AppCardProps = PackageCardProps\n\nexport function AppCard(props: AppCardProps) {\n  return <PackageCard {...props} />\n}\n\nexport { PackageCard } from 'fixture-style-lib'\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-lib/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport interface PackageCardProps extends StyleProps {\n  tone?: 'neutral' | 'brand'\n}\n\nexport function PackageCard({ tone = 'neutral', ...styleProps }: PackageCardProps) {\n  return <Div data-tone={tone} {...styleProps} />\n}\n",
    );
    fixture
}

fn create_default_export_package_fixture() -> super::fixtures::ScratchDir {
    let fixture = workspace_scratch_dir("default-export-package");
    fixture.write(
        "input/index.tsx",
        "import type { StyleProps } from '@reference-ui/react'\nimport DefaultCard from 'fixture-style-default'\n\nexport type AppCardProps = StyleProps & {\n  title?: string\n}\n\nexport function AppCard(props: AppCardProps) {\n  return <DefaultCard {...props} />\n}\n\nexport { default as PackageCard } from 'fixture-style-default'\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-default/package.json",
        "{\n  \"name\": \"fixture-style-default\",\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"exports\": {\n    \".\": \"./index.tsx\"\n  }\n}\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-default/index.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type DefaultCardProps = StyleProps & {\n  title?: string\n}\n\nexport default function DefaultCard({ title, ...styleProps }: DefaultCardProps) {\n  return <Div {...styleProps}>{title}</Div>\n}\n",
    );
    fixture
}

fn create_subpath_package_fixture() -> super::fixtures::ScratchDir {
    let fixture = workspace_scratch_dir("subpath-package");
    fixture.write(
        "input/index.tsx",
        "import { PackageCard, type PackageCardProps } from 'fixture-style-subpath/card'\n\nexport type AppCardProps = PackageCardProps\n\nexport function AppCard(props: AppCardProps) {\n  return <PackageCard {...props} />\n}\n\nexport { PackageCard } from 'fixture-style-subpath/card'\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-subpath/package.json",
        "{\n  \"name\": \"fixture-style-subpath\",\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"exports\": {\n    \"./card\": \"./card.tsx\"\n  }\n}\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-subpath/card.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type PackageCardProps = StyleProps & {\n  title?: string\n}\n\nexport function PackageCard({ title, ...styleProps }: PackageCardProps) {\n  return <Div {...styleProps}>{title}</Div>\n}\n",
    );
    fixture
}

fn create_export_star_package_fixture() -> super::fixtures::ScratchDir {
    let fixture = workspace_scratch_dir("export-star-package");
    fixture.write(
        "input/index.tsx",
        "import { PackageCard, type PackageCardProps } from 'fixture-style-barrel'\n\nexport type AppCardProps = PackageCardProps\n\nexport function AppCard(props: AppCardProps) {\n  return <PackageCard {...props} />\n}\n\nexport { PackageCard } from 'fixture-style-barrel'\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-barrel/package.json",
        "{\n  \"name\": \"fixture-style-barrel\",\n  \"version\": \"0.0.0\",\n  \"type\": \"module\",\n  \"exports\": {\n    \".\": \"./index.ts\"\n  }\n}\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-barrel/index.ts",
        "export * from './card'\n",
    );
    fixture.write(
        "input/node_modules/fixture-style-barrel/card.tsx",
        "import { Div, type StyleProps } from '@reference-ui/react'\n\nexport type PackageCardProps = StyleProps & {\n  title?: string\n}\n\nexport function PackageCard({ title, ...styleProps }: PackageCardProps) {\n  return <Div {...styleProps}>{title}</Div>\n}\n",
    );
    fixture
}
