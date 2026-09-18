//! Provides resolver-focused unit test coverage specifically for styletrace type expansion.
//! It takes various complex TypeScript type definitions, including intersections, omissions, and mapped types.
//! Exercises the parser and tracer pipelines to ensure correct property collection.
//! Emits assertions that validate the resolved set of style properties against expected outcomes.

use crate::{collect_reference_style_prop_names, collect_style_prop_names};

use super::fixtures::{reference_lib_sync_root, ScratchDir};

#[test]
fn resolves_omit_and_intersection_prop_names_from_local_modules() {
    let scratch = ScratchDir::new("omit-intersection");
    scratch.write(
        "src/base.ts",
        "export interface BaseProps { color?: string; skip?: string; fontSize?: string }\n",
    );
    scratch.write(
        "src/extras.ts",
        "export interface Extras { container?: string }\n",
    );
    scratch.write(
        "src/style-props.ts",
        concat!(
            "import type { BaseProps } from './base'\n",
            "import type { Extras } from './extras'\n",
            "export type StyleProps = Omit<BaseProps, 'skip'> & Extras\n",
        ),
    );

    let names = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/style-props.ts"),
        "StyleProps",
        None,
    )
    .expect("expected style props to resolve");

    assert!(names.contains(&"color".to_string()));
    assert!(names.contains(&"fontSize".to_string()));
    assert!(names.contains(&"container".to_string()));
    assert!(!names.contains(&"skip".to_string()));
}

#[test]
fn resolves_mapped_and_indexed_type_helpers() {
    let scratch = ScratchDir::new("mapped-indexed");
    scratch.write(
        "src/style-props.ts",
        concat!(
            "type Strict<P> = Omit<P, 'color'> & { [K in 'color' | 'accentColor']?: string }\n",
            "type Scoped = { [T in 'body' | 'display']: { font?: string; weight?: string } }['body' | 'display']\n",
            "export type StyleProps = Strict<{ color?: string; fontSize?: string }> & Scoped\n",
        ),
    );

    let names = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/style-props.ts"),
        "StyleProps",
        None,
    )
    .expect("expected style props to resolve");

    assert!(names.contains(&"accentColor".to_string()));
    assert!(names.contains(&"fontSize".to_string()));
    assert!(names.contains(&"font".to_string()));
    assert!(names.contains(&"weight".to_string()));
    assert!(names.contains(&"color".to_string()));
}

#[test]
fn resolves_union_members_that_mix_references_and_literals() {
    let scratch = ScratchDir::new("union-members");
    scratch.write(
        "src/style-props.ts",
        concat!(
            "export type Names = \"accent\" | \"tone\"\n",
            "export type StyleProps = {\n",
            "  [K in Exclude<Names, 'tone'> | 'shade']?: string\n",
            "} & ({ depth?: string } | { breadth?: string })\n",
        ),
    );

    let names = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/style-props.ts"),
        "StyleProps",
        None,
    )
    .expect("expected style props to resolve");

    assert_eq!(
        names,
        vec!["accent", "breadth", "depth", "shade"]
            .into_iter()
            .map(str::to_string)
            .collect::<Vec<_>>()
    );
}

#[test]
fn unresolvable_module_specifiers_contribute_no_names() {
    let scratch = ScratchDir::new("phantom-specifier");
    scratch.write(
        "src/style-props.ts",
        concat!(
            "import type { GhostProps } from '@phantom/missing'\n",
            "export type StyleProps = GhostProps & { color?: string }\n",
        ),
    );

    let names = collect_style_prop_names(
        scratch.root(),
        &scratch.root().join("src/style-props.ts"),
        "StyleProps",
        None,
    )
    .expect("expected phantom imports to resolve tolerantly");

    assert_eq!(names, vec!["color".to_string()]);
}

#[test]
fn loads_real_reference_core_style_props() {
    let sync_root = reference_lib_sync_root();
    if !sync_root.join(".reference-ui").exists() {
        return;
    }

    let names = collect_reference_style_prop_names(sync_root.as_path())
        .expect("expected reference-core style props to resolve");

    assert!(
        names.len() > 200,
        "expected a real style prop surface, got {}",
        names.len()
    );
    assert!(names.contains(&"color".to_string()));
    assert!(names.contains(&"backgroundColor".to_string()));
    assert!(names.contains(&"fontSize".to_string()));
    assert!(names.contains(&"container".to_string()));
    assert!(names.contains(&"font".to_string()));
    assert!(names.contains(&"weight".to_string()));
    assert!(names.contains(&"r".to_string()));
    assert!(!names.contains(&"base".to_string()));
}
