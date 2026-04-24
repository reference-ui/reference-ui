//! Resolver-focused unit coverage for styletrace type expansion.

use crate::styletrace::{collect_reference_style_prop_names, collect_style_prop_names};

use super::fixtures::{workspace_sync_root, ScratchDir};

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
    )
    .expect("expected style props to resolve");

    assert!(names.contains(&"accentColor".to_string()));
    assert!(names.contains(&"fontSize".to_string()));
    assert!(names.contains(&"font".to_string()));
    assert!(names.contains(&"weight".to_string()));
    assert!(names.contains(&"color".to_string()));
}

#[test]
fn loads_real_reference_core_style_props() {
    let workspace_root = workspace_sync_root();

    let names = collect_reference_style_prop_names(workspace_root.as_path())
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
