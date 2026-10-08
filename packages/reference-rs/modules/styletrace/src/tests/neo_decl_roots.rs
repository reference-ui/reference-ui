//! Covers styletrace resolution against Neo-shaped declaration roots.
//! Neo publishes no `react/types/` or `react/system/`; its full wired surface lives in
//! `react.d.mts`, with the narrow typegen surface and the `SystemProperties` alias behind
//! `styled/types/`. These tests pin each entrypoint and the end-to-end wrapper trace.

use crate::analysis::primitive_metadata::collect_reference_primitive_jsx_names;
use crate::analysis::trace_style_bindings;
use crate::resolver::collect_reference_style_prop_names;

use super::fixtures::ScratchDir;

const NEO_REACT_D_MTS: &str = concat!(
    "import type { StyleConditionKey, StyleProps as NarrowStyleProps } from '@reference-ui/styled'\n",
    "export type StylePropName = \"color\" | \"fontSize\" | \"margin\"\n",
    "export type StyleProps = Omit<NarrowStyleProps, 'font' | 'weight'> & {\n",
    "  [K in Exclude<StylePropName, keyof NarrowStyleProps> | 'font' | 'weight']?: unknown\n",
    "} & {\n",
    "  [K in StyleConditionKey]?: StyleProps\n",
    "}\n",
    "export declare const Div: (props: unknown) => unknown\n",
    "export declare const Span: (props: unknown) => unknown\n",
);

const NEO_STYLED_INDEX_D_TS: &str = concat!(
    "export type StyleConditionKey = '_hover' | '_focus'\n",
    "export type StyleProps = {\n",
    "  color?: string\n",
    "  container?: string\n",
    "  font?: string\n",
    "  weight?: string\n",
    "}\n",
);

const NEO_WIDGET_TSX: &str = concat!(
    "import { Div, type StyleProps } from '@reference-ui/react';\n",
    "export interface WidgetProps extends StyleProps { label?: string; }\n",
    "export function Widget(props: WidgetProps) { return <Div {...props} />; }\n",
);

fn write_neo_decl_root(scratch: &ScratchDir, root: &str) {
    scratch.write(
        &format!("{root}/.reference-ui/react/react.d.mts"),
        NEO_REACT_D_MTS,
    );
    scratch.write(
        &format!("{root}/.reference-ui/styled/types/index.d.ts"),
        NEO_STYLED_INDEX_D_TS,
    );
}

#[test]
fn resolves_style_props_from_neo_react_entry() {
    let scratch = ScratchDir::new("neo-react-entry");
    write_neo_decl_root(&scratch, "declarations");

    let names = collect_reference_style_prop_names(&scratch.root().join("declarations"))
        .expect("expected Neo style props to resolve");

    assert_eq!(
        names,
        vec![
            "_focus",
            "_hover",
            "color",
            "container",
            "font",
            "fontSize",
            "margin",
            "weight",
        ]
        .into_iter()
        .map(str::to_string)
        .collect::<Vec<_>>()
    );
}

#[test]
fn falls_back_to_neo_styled_index_without_react_entry() {
    let scratch = ScratchDir::new("neo-styled-fallback");
    scratch.write(
        "declarations/.reference-ui/styled/types/index.d.ts",
        NEO_STYLED_INDEX_D_TS,
    );

    let names = collect_reference_style_prop_names(&scratch.root().join("declarations"))
        .expect("expected narrow styled style props to resolve");

    assert_eq!(
        names,
        vec!["color", "container", "font", "weight"]
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>()
    );
}

#[test]
fn falls_back_to_system_properties_alias_entry() {
    let scratch = ScratchDir::new("neo-alias-fallback");
    scratch.write(
        "declarations/.reference-ui/styled/types/style-props.d.ts",
        concat!(
            "import type { StyleProps } from './narrow.js'\n",
            "export type SystemProperties = StyleProps\n",
        ),
    );
    scratch.write(
        "declarations/.reference-ui/styled/types/narrow.d.ts",
        "export type StyleProps = { color?: string; container?: string }\n",
    );

    let names = collect_reference_style_prop_names(&scratch.root().join("declarations"))
        .expect("expected SystemProperties alias entry to resolve");

    assert_eq!(
        names,
        vec!["color", "container"]
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>()
    );
}

#[test]
fn resolves_primitives_from_neo_react_entry() {
    let scratch = ScratchDir::new("neo-primitives");
    scratch.write(
        "declarations/.reference-ui/react/react.d.mts",
        concat!(
            "export type DivProps = { color?: string }\n",
            "export declare const Div: (props: DivProps) => unknown\n",
            "export declare const Span: (props: unknown) => unknown\n",
        ),
    );

    let primitives = collect_reference_primitive_jsx_names(&scratch.root().join("declarations"))
        .expect("expected Neo primitives to resolve");

    assert_eq!(
        primitives.into_iter().collect::<Vec<_>>(),
        vec!["Div".to_string(), "Span".to_string()]
    );
}

#[test]
fn traces_wrapper_against_neo_decl_root() {
    let scratch = ScratchDir::new("neo-trace");
    write_neo_decl_root(&scratch, "declarations");
    scratch.write("application/Widget.tsx", NEO_WIDGET_TSX);

    let bindings = trace_style_bindings(
        &scratch.root().join("application"),
        &scratch.root().join("declarations"),
    )
    .expect("expected Neo-shaped trace to succeed");

    assert_eq!(bindings.len(), 1);
    assert_eq!(bindings[0].name, "Widget");
    assert_eq!(bindings[0].module, "Widget.tsx");
}
