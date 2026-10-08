//! Round-trip tests proving the engine-owned StyleSurface reproduces the
//! disk declaration surface. The engine surface is canon-global (873 props +
//! 84 conditions for any spec), so the small neo fixture asserts containment
//! while full-size generated and real-tree fixtures assert exact equality.
//! Takes BaseSystem fixtures and scratch declaration roots; emits coverage
//! that a future typegen/canon drift surfaces as a red test, never silent
//! host loss.

use std::collections::BTreeSet;
use std::fs;
use std::path::PathBuf;

use shared::testing::ScratchWorkspace;

use crate::hosts::engine_surface;
use crate::BaseSystem;

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

const NEO_FIXTURE_NAMES: &[&str] = &[
    "_focus",
    "_hover",
    "color",
    "container",
    "font",
    "fontSize",
    "margin",
    "weight",
];

fn write_neo_decl_root(scratch: &ScratchWorkspace, root: &str) {
    scratch.write(
        &format!("{root}/.reference-ui/react/react.d.mts"),
        NEO_REACT_D_MTS,
    );
    scratch.write(
        &format!("{root}/.reference-ui/styled/types/index.d.ts"),
        NEO_STYLED_INDEX_D_TS,
    );
}

fn workspace_root() -> PathBuf {
    let mut dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    while !dir.join("pnpm-workspace.yaml").exists() {
        if !dir.pop() {
            panic!("expected workspace root containing pnpm-workspace.yaml");
        }
    }
    dir
}

/// React surface template: the production wiring shape (`Omit` narrow plus
/// the full `StylePropName` union plus conditions) with caller-supplied parts.
fn react_surface_template(prop_union: &str) -> String {
    format!(
        concat!(
            "import type {{ StyleConditionKey, StyleProps as NarrowStyleProps }} from '@reference-ui/styled'\n",
            "export type StylePropName = {prop_union}\n",
            "export type StyleProps = Omit<NarrowStyleProps, 'font' | 'weight'> & {{\n",
            "  [K in Exclude<StylePropName, keyof NarrowStyleProps> | 'font' | 'weight']?: unknown\n",
            "}} & {{\n",
            "  [K in StyleConditionKey]?: StyleProps\n",
            "}}\n",
            "export declare const Div: (props: unknown) => unknown\n",
            "export declare const Span: (props: unknown) => unknown\n",
        ),
        prop_union = prop_union,
    )
}

#[test]
fn fixture_names_are_contained_in_engine_surface() {
    let scratch = ScratchWorkspace::new("surface-neo-containment");
    write_neo_decl_root(&scratch, "declarations");

    let disk =
        styletrace::StyleSurface::from_declaration_root(&scratch.root().join("declarations"))
            .expect("expected neo fixture surface to resolve");
    let engine = engine_surface(BaseSystem::lib_fixture());

    let expected: BTreeSet<String> = NEO_FIXTURE_NAMES.iter().map(ToString::to_string).collect();
    assert_eq!(disk.style_props, expected);
    for name in &expected {
        assert!(
            engine.style_props.contains(name),
            "engine surface is missing fixture name {name}"
        );
    }

    assert_eq!(
        disk.primitives,
        BTreeSet::from(["Div".to_string(), "Span".to_string()])
    );
    for name in &disk.primitives {
        assert!(
            engine.primitives.contains(name),
            "engine primitives are missing fixture name {name}"
        );
    }
}

#[test]
fn typegen_surface_round_trips_through_declarations() {
    let system = BaseSystem::lib_fixture().clone();
    let engine = engine_surface(&system);
    let styled_index = typegen::emit_dts(&system);
    assert!(
        styled_index.contains("export type StyleConditionKey = "),
        "typegen must print the condition union"
    );

    let prop_union = engine
        .style_props
        .iter()
        .map(|name| format!("\"{name}\""))
        .collect::<Vec<_>>()
        .join(" | ");
    let scratch = ScratchWorkspace::new("surface-typegen-roundtrip");
    scratch.write(".reference-ui/styled/types/index.d.ts", &styled_index);
    scratch.write(
        ".reference-ui/react/react.d.mts",
        &react_surface_template(&prop_union),
    );

    let disk = styletrace::StyleSurface::from_declaration_root(scratch.root())
        .expect("expected generated surface to resolve");
    assert_eq!(
        disk.style_props, engine.style_props,
        "disk surface must reproduce the engine surface exactly"
    );
    assert!(
        disk.primitives
            .iter()
            .all(|name| engine.primitives.contains(name)),
        "engine primitives must cover the declared primitives"
    );
}

#[test]
fn real_tree_surface_matches_engine_surface() {
    let lib_root = workspace_root().join("packages").join("reference-lib");
    if !lib_root.join(".reference-ui").exists() {
        return;
    }
    let spec_path = lib_root
        .join(".reference-ui")
        .join("system")
        .join("evaluated-system.json");
    let spec_json = fs::read_to_string(&spec_path).expect("expected evaluated-system.json to read");
    let system = BaseSystem::from_json(&spec_json).expect("expected lib spec to lower");

    let engine = engine_surface(&system);
    let disk = styletrace::StyleSurface::from_declaration_root(&lib_root)
        .expect("expected lib surface to resolve");
    assert_eq!(
        disk.style_props, engine.style_props,
        "disk surface must reproduce the engine surface exactly"
    );
    // The disk primitive parser over-approximates: any Uppercase `declare
    // const` counts, including three React contexts that are not
    // primitives. The engine surface covers every true primitive; the gap
    // is pinned exactly so a new non-canon primitive still goes red.
    let gap: BTreeSet<_> = disk
        .primitives
        .difference(&engine.primitives)
        .cloned()
        .collect();
    assert_eq!(
        gap,
        BTreeSet::from([
            "ColorModeContext".to_string(),
            "DocumentContext".to_string(),
            "LayerScopeContext".to_string(),
        ]),
        "only the three context declarations may escape canon primitives"
    );
}
