//! Owned-props tracing for the §14 host shadow: a host's own declared
//! prop names land on the outcome keyed by export name, surface
//! references prune, and unannotated hosts own nothing. Scratch sources
//! plus a hand-built surface keep the test hermetic: no fixture tree,
//! no declaration root.

use std::collections::{BTreeMap, BTreeSet};

use crate::analysis::{trace_style_bindings_with_surface, StyleSurface};

use super::fixtures::workspace_scratch_dir;

const TYPES_TS: &str = "export type StyleProps = {\n  color?: string\n  size?: string\n}\n";

const BUTTON_TSX: &str = concat!(
    "import type { StyleProps } from './types'\n",
    "import { Div } from '@reference-ui/react'\n",
    "export type ButtonProps = StyleProps & { size?: 'sm' | 'md'; variant?: 'primary' | 'secondary' }\n",
    "export function Button({ size, variant, ...rest }: ButtonProps) {\n",
    "  return <Div {...rest} />\n",
    "}\n",
);

const CARD_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "export function Card({ size }) {\n",
    "  return <Div size={size} />\n",
    "}\n",
);

fn test_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["color".to_string(), "size".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

fn trace_scratch(
    name: &str,
    files: &[(&str, &str)],
    entry: &str,
    surface: &StyleSurface,
) -> crate::TraceOutcome {
    let scratch = workspace_scratch_dir(name);
    for (rel, content) in files {
        scratch.write(rel, content);
    }
    let entries = vec![scratch.root().join(entry)];
    trace_style_bindings_with_surface(&entries, scratch.root(), scratch.root(), surface)
}

#[test]
fn traced_host_owns_its_declaration_minus_the_surface() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-props-button",
        &[("types.ts", TYPES_TS), ("Button.tsx", BUTTON_TSX)],
        "Button.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["Button".to_string()]);
    assert!(
        outcome.diagnostics.is_empty(),
        "expected no diagnostics, got {:?}",
        outcome.diagnostics
    );

    // `size` collides with a style prop but the host declares it, so it
    // shadows; `color` arrives only through `StyleProps`, so it stays a
    // style and keeps extracting.
    let owned = outcome
        .owned_props
        .get("Button")
        .cloned()
        .unwrap_or_default();
    assert_eq!(
        owned,
        BTreeSet::from(["size".to_string(), "variant".to_string()])
    );
}

#[test]
fn unannotated_hosts_own_nothing() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-props-card",
        &[("Card.tsx", CARD_TSX)],
        "Card.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["Card".to_string()]);

    // No declaration, no shadow: `size` still folds the macro downstream.
    assert!(!outcome.owned_props.contains_key("Card"));
}

#[test]
fn input_seeds_union_with_traced_owned() {
    let seeds = BTreeMap::from([("Seed".to_string(), BTreeSet::from(["weight".to_string()]))]);
    let surface = test_surface().with_owned_props(seeds);
    let outcome = trace_scratch(
        "owned-props-seeds",
        &[("types.ts", TYPES_TS), ("Button.tsx", BUTTON_TSX)],
        "Button.tsx",
        &surface,
    );

    assert_eq!(
        outcome.owned_props.get("Seed").cloned().unwrap_or_default(),
        BTreeSet::from(["weight".to_string()])
    );
    assert_eq!(
        outcome
            .owned_props
            .get("Button")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["size".to_string(), "variant".to_string()])
    );
}
