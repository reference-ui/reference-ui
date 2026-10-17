//! Compound-member alias tracing: `Ns.Prop = Target` assignments mint dotted hosts for traced wrappers.
//! This root holds the shared scratch helpers, the tabs fixture, and the local, imported and chained alias cases.
//! Reassignment, silent shapes, barrel re-exports and export collisions live in the sibling `member_alias_*.rs` files.

use std::collections::BTreeSet;

use rustc_hash::FxHashMap;

use crate::analysis::{trace_style_bindings_with_surface, StyleSurface, SurfaceTrace};

use super::fixtures::workspace_scratch_dir;

pub(super) const TABS_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
    "export function Panel({ id, ...rest }: PanelProps) {\n",
    "  void id\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "export function Item(props: PanelProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export function Plain({ label }: { label: string }) {\n",
    "  return <div>{label}</div>\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = Panel\n",
    "Tabs.Item = Item\n",
    "Tabs.Plain = Plain\n",
);

const SECTION_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface SectionProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Section(props: SectionProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
);

const ACCORDION_TSX: &str = concat!(
    "import { Section } from './section'\n",
    "export function Accordion({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Accordion.Section = Section\n",
);

const CHAIN_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Panel(props: PanelProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "const Alias = Panel\n",
    "Tabs.Linked = Alias\n",
);

const CYCLE_TSX: &str = concat!(
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "const LoopA = LoopB\n",
    "const LoopB = LoopA\n",
    "Tabs.Loop = LoopA\n",
);

fn member_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["p".to_string(), "color".to_string(), "size".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

pub(super) fn trace_scratch(
    name: &str,
    files: &[(&str, &str)],
    entry: &str,
) -> crate::TraceOutcome {
    trace_scratch_entries(name, files, &[entry])
}

pub(super) fn trace_scratch_entries(
    name: &str,
    files: &[(&str, &str)],
    entries: &[&str],
) -> crate::TraceOutcome {
    let surface = member_surface();
    let scratch = workspace_scratch_dir(name);
    for (rel, content) in files {
        scratch.write(rel, content);
    }
    let entries = entries
        .iter()
        .map(|entry| scratch.root().join(entry))
        .collect::<Vec<_>>();
    let staged = FxHashMap::default();
    let programs = FxHashMap::default();
    let sources = crate::TraceSources {
        staged: &staged,
        programs: &programs,
    };
    trace_style_bindings_with_surface(SurfaceTrace {
        entries: &entries,
        source_root: scratch.root(),
        package_root: scratch.root(),
        surface: &surface,
        sources: &sources,
    })
}

pub(super) fn binding_names(outcome: &crate::TraceOutcome) -> Vec<String> {
    outcome
        .bindings
        .iter()
        .map(|binding| binding.name.clone())
        .collect()
}

#[test]
fn local_member_aliases_emit_dotted_hosts() {
    let outcome = trace_scratch("member-alias-local", &[("tabs.tsx", TABS_TSX)], "tabs.tsx");

    assert_eq!(
        binding_names(&outcome),
        vec![
            "Item".to_string(),
            "Panel".to_string(),
            "Tabs.Item".to_string(),
            "Tabs.Panel".to_string(),
        ]
    );
    assert!(
        outcome.diagnostics.is_empty(),
        "expected no diagnostics, got {:?}",
        outcome.diagnostics
    );
}

#[test]
fn member_alias_onto_untraced_target_stays_silent() {
    let outcome = trace_scratch(
        "member-alias-untraced",
        &[("tabs.tsx", TABS_TSX)],
        "tabs.tsx",
    );

    assert!(
        !binding_names(&outcome).contains(&"Tabs.Plain".to_string()),
        "alias onto the style-less Plain must not mint a host"
    );
}

#[test]
fn imported_member_target_traces_across_modules() {
    let outcome = trace_scratch(
        "member-alias-imported",
        &[("section.tsx", SECTION_TSX), ("accordion.tsx", ACCORDION_TSX)],
        "accordion.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Accordion.Section".to_string()]);
}

#[test]
fn identifier_chain_target_traces() {
    let outcome = trace_scratch("member-alias-chain", &[("tabs.tsx", CHAIN_TSX)], "tabs.tsx");

    assert_eq!(
        binding_names(&outcome),
        vec!["Panel".to_string(), "Tabs.Linked".to_string()]
    );
}

#[test]
fn alias_cycles_resolve_to_untraced() {
    let outcome = trace_scratch("member-alias-cycle", &[("tabs.tsx", CYCLE_TSX)], "tabs.tsx");

    assert!(binding_names(&outcome).is_empty());
}

#[test]
fn dotted_host_carries_target_owned_props() {
    let outcome = trace_scratch("member-alias-owned", &[("tabs.tsx", TABS_TSX)], "tabs.tsx");

    assert_eq!(
        outcome
            .owned_props
            .get("Tabs.Panel")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["id".to_string()])
    );
}
