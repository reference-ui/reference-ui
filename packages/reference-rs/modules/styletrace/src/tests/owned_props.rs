//! Owned-props tracing for the §14 host shadow: a host's own declared
//! prop names land on the outcome keyed by export name, surface
//! references prune, and unannotated hosts own nothing. Scratch sources
//! plus a hand-built surface keep the test hermetic: no fixture tree,
//! no declaration root.

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::path::PathBuf;

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;
use rustc_hash::FxHashMap;

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
    let staged = FxHashMap::default();
    let programs = std::collections::HashMap::new();
    let sources = crate::TraceSources {
        staged: &staged,
        programs: &programs,
    };
    trace_style_bindings_with_surface(&entries, scratch.root(), scratch.root(), surface, &sources)
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

const CHART_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface ChartProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
    "export function Chart(props: ChartProps) {\n",
    "  return <Div {...props}>chart</Div>\n",
    "}\n",
);

const PANEL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
    "export function Panel({ id, ...rest }: PanelProps) {\n",
    "  void id\n",
    "  return <Div {...rest} />\n",
    "}\n",
);

fn forward_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["p".to_string(), "color".to_string(), "size".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

#[test]
fn whole_props_forward_owns_nothing() {
    let surface = forward_surface();
    let outcome = trace_scratch(
        "owned-props-chart",
        &[("Chart.tsx", CHART_TSX)],
        "Chart.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["Chart".to_string()]);

    // Declared `p` rides the whole-props spread into the primitive, so the
    // §14 shadow keeps nothing and the call site mints (NEO-SITE-11).
    assert!(!outcome.owned_props.contains_key("Chart"));
}

#[test]
fn destructured_member_stays_owned_while_rest_forwards() {
    let surface = forward_surface();
    let outcome = trace_scratch(
        "owned-props-panel",
        &[("Panel.tsx", PANEL_TSX)],
        "Panel.tsx",
        &surface,
    );

    let names: Vec<String> = outcome.bindings.iter().map(|b| b.name.clone()).collect();
    assert_eq!(names, vec!["Panel".to_string()]);

    // Pulled-out `id` is the component's own API; `p` rides `rest` and
    // keeps extracting at call sites.
    assert_eq!(
        outcome
            .owned_props
            .get("Panel")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["id".to_string()])
    );
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

#[test]
fn staged_content_matches_disk_trace() {
    let surface = test_surface();
    let files = [("types.ts", TYPES_TS), ("Button.tsx", BUTTON_TSX)];
    let scratch = workspace_scratch_dir("owned-props-staged");
    for (rel, content) in files {
        scratch.write(rel, content);
    }
    let entries = vec![scratch.root().join("Button.tsx")];
    let empty = FxHashMap::default();
    let no_programs = HashMap::new();
    let from_disk = trace_style_bindings_with_surface(
        &entries,
        scratch.root(),
        scratch.root(),
        &surface,
        &crate::TraceSources {
            staged: &empty,
            programs: &no_programs,
        },
    );
    let staged: FxHashMap<PathBuf, &str> = files
        .iter()
        .map(|(rel, content)| (scratch.root().join(rel), *content))
        .collect();
    let from_staged = trace_style_bindings_with_surface(
        &entries,
        scratch.root(),
        scratch.root(),
        &surface,
        &crate::TraceSources {
            staged: &staged,
            programs: &no_programs,
        },
    );
    assert_eq!(from_disk, from_staged);
}

#[test]
fn reused_programs_match_fresh_parse_trace() {
    let surface = test_surface();
    let files = [("types.ts", TYPES_TS), ("Button.tsx", BUTTON_TSX)];
    let scratch = workspace_scratch_dir("owned-props-reuse");
    for (rel, content) in files {
        scratch.write(rel, content);
    }
    let button = scratch.root().join("Button.tsx");
    let entries = vec![button.clone()];
    let staged: FxHashMap<PathBuf, &str> = files
        .iter()
        .map(|(rel, content)| (scratch.root().join(rel), *content))
        .collect();
    let no_programs = HashMap::new();
    let fresh = trace_style_bindings_with_surface(
        &entries,
        scratch.root(),
        scratch.root(),
        &surface,
        &crate::TraceSources {
            staged: &staged,
            programs: &no_programs,
        },
    );
    // Main-phase options (atomic `parse_source`): TS on for every extension.
    let button_alloc = Allocator::default();
    let button_parsed = Parser::new(
        &button_alloc,
        BUTTON_TSX,
        SourceType::from_path(&button)
            .unwrap_or_default()
            .with_typescript(true),
    )
    .parse();
    let types_path = scratch.root().join("types.ts");
    let types_alloc = Allocator::default();
    let types_parsed = Parser::new(
        &types_alloc,
        TYPES_TS,
        SourceType::from_path(&types_path)
            .unwrap_or_default()
            .with_typescript(true),
    )
    .parse();
    assert!(button_parsed.errors.is_empty());
    assert!(types_parsed.errors.is_empty());
    let programs: HashMap<PathBuf, &oxc_ast::ast::Program> = [
        (button, &button_parsed.program),
        (types_path, &types_parsed.program),
    ]
    .into_iter()
    .collect();
    let reused = trace_style_bindings_with_surface(
        &entries,
        scratch.root(),
        scratch.root(),
        &surface,
        &crate::TraceSources {
            staged: &staged,
            programs: &programs,
        },
    );
    assert_eq!(fresh, reused);
}
