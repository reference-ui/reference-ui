//! Compound-member alias tracing: `Ns.Prop = Target` assignments mint dotted
//! hosts for traced wrappers. Scratch sources plus a hand-built surface keep
//! the tests hermetic: local, imported, chained, and barrel re-exported
//! targets trace (renames remap the host) while aliases onto untraced
//! targets, cycles, namespace targets, computed keys, and `Object.assign`
//! shapes stay silent. Reassignments resolve last-wins, same-host
//! collisions union owned props, and owned props ride the dotted host.

use std::collections::BTreeSet;

use rustc_hash::FxHashMap;

use crate::analysis::{trace_style_bindings_with_surface, StyleSurface};

use super::fixtures::workspace_scratch_dir;

const TABS_TSX: &str = concat!(
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

const REASSIGN_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Panel(props: PanelProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export function Plain({ label }: { label: string }) {\n",
    "  return <div>{label}</div>\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = Panel\n",
    "Tabs.Panel = Plain\n",
);

const REASSIGN_BACK_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Panel(props: PanelProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export function Plain({ label }: { label: string }) {\n",
    "  return <div>{label}</div>\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = Plain\n",
    "Tabs.Panel = Panel\n",
);

const REOWN_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface AProps {\n",
    "  p?: string\n",
    "  aaa?: string\n",
    "}\n",
    "export function PanelA({ aaa, ...rest }: AProps) {\n",
    "  void aaa\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "interface BProps {\n",
    "  p?: string\n",
    "  bbb?: string\n",
    "}\n",
    "export function PanelB({ bbb, ...rest }: BProps) {\n",
    "  void bbb\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = PanelA\n",
    "Tabs.Panel = PanelB\n",
);

const SHADOW_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "}\n",
    "export function Panel(props: PanelProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export function Plain({ label }: { label: string }) {\n",
    "  return <div>{label}</div>\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = Panel\n",
    "export function Wrapper() {\n",
    "  const Panel = Plain\n",
    "  Tabs.Sneaky = Panel\n",
    "  return null\n",
    "}\n",
);

const NS_TARGET_TSX: &str = concat!(
    "import * as NS from './missing'\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "const X = NS\n",
    "Tabs.P = X\n",
);

const COMPUTED_TSX: &str = concat!(
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
    "Tabs['Panel'] = Panel\n",
);

const OBJECT_ASSIGN_TSX: &str = concat!(
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
    "Object.assign(Tabs, { Panel })\n",
);

const BARREL_STAR_TSX: &str = "export * from './tabs'\n";

const BARREL_NAMED_TSX: &str = "export { Tabs } from './tabs'\n";

const BARREL_RENAMED_TSX: &str = "export { Tabs as Accordion } from './tabs'\n";

const BARREL_IMPORT_EXPORT_TSX: &str =
    concat!("import { Tabs } from './tabs'\n", "export { Tabs }\n",);

const BARREL_STAR_AS_TSX: &str = "export * as Accordion from './tabs'\n";

const STRING_EXPORT_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
    "function Panel({ id, ...rest }: PanelProps) {\n",
    "  void id\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "export { Panel as \"Tabs.Panel\" }\n",
    "Tabs.Panel = Panel\n",
);

const CLASH_A_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface AProps {\n",
    "  p?: string\n",
    "  aaa?: string\n",
    "}\n",
    "export function PanelA({ aaa, ...rest }: AProps) {\n",
    "  void aaa\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = PanelA\n",
);

const CLASH_B_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "interface BProps {\n",
    "  p?: string\n",
    "  bbb?: string\n",
    "}\n",
    "export function PanelB({ bbb, ...rest }: BProps) {\n",
    "  void bbb\n",
    "  return <Div {...rest} />\n",
    "}\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = PanelB\n",
);

fn member_surface() -> StyleSurface {
    StyleSurface::new(
        BTreeSet::from(["p".to_string(), "color".to_string(), "size".to_string()]),
        BTreeSet::from(["Div".to_string()]),
    )
}

fn trace_scratch(name: &str, files: &[(&str, &str)], entry: &str) -> crate::TraceOutcome {
    trace_scratch_entries(name, files, &[entry])
}

fn trace_scratch_entries(
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
    trace_style_bindings_with_surface(&entries, scratch.root(), scratch.root(), &surface, &sources)
}

fn binding_names(outcome: &crate::TraceOutcome) -> Vec<String> {
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

#[test]
fn reassigned_alias_to_untraced_stays_silent() {
    let outcome = trace_scratch(
        "member-alias-reassign",
        &[("tabs.tsx", REASSIGN_TSX)],
        "tabs.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Panel".to_string()]);
}

#[test]
fn reassigned_alias_to_traced_collects() {
    let outcome = trace_scratch(
        "member-alias-reassign-back",
        &[("tabs.tsx", REASSIGN_BACK_TSX)],
        "tabs.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Panel".to_string(), "Tabs.Panel".to_string()]
    );
}

#[test]
fn reassigned_alias_owned_props_come_from_final_target() {
    let outcome = trace_scratch("member-alias-reown", &[("tabs.tsx", REOWN_TSX)], "tabs.tsx");

    assert_eq!(
        binding_names(&outcome),
        vec![
            "PanelA".to_string(),
            "PanelB".to_string(),
            "Tabs.Panel".to_string(),
        ]
    );
    assert_eq!(
        outcome
            .owned_props
            .get("Tabs.Panel")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["bbb".to_string()])
    );
}

#[test]
fn function_local_bindings_do_not_disturb_aliases() {
    let outcome = trace_scratch(
        "member-alias-shadow",
        &[("tabs.tsx", SHADOW_TSX)],
        "tabs.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Panel".to_string(), "Tabs.Panel".to_string()]
    );
}

#[test]
fn namespace_import_target_stays_silent() {
    let outcome = trace_scratch(
        "member-alias-ns-target",
        &[("tabs.tsx", NS_TARGET_TSX)],
        "tabs.tsx",
    );

    assert!(binding_names(&outcome).is_empty());
}

#[test]
fn computed_member_assignment_stays_silent() {
    let outcome = trace_scratch(
        "member-alias-computed",
        &[("tabs.tsx", COMPUTED_TSX)],
        "tabs.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Panel".to_string()]);
}

#[test]
fn object_assign_shape_stays_silent() {
    let outcome = trace_scratch(
        "member-alias-object-assign",
        &[("tabs.tsx", OBJECT_ASSIGN_TSX)],
        "tabs.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Panel".to_string()]);
}

#[test]
fn export_star_barrel_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-star",
        &[("barrel.tsx", BARREL_STAR_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec![
            "Item".to_string(),
            "Panel".to_string(),
            "Tabs.Item".to_string(),
            "Tabs.Panel".to_string(),
        ]
    );
}

#[test]
fn named_namespace_reexport_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-named",
        &[("barrel.tsx", BARREL_NAMED_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Tabs.Item".to_string(), "Tabs.Panel".to_string(),]
    );
}

#[test]
fn renamed_namespace_reexport_remaps_member_hosts() {
    let outcome = trace_scratch(
        "member-alias-barrel-renamed",
        &[("barrel.tsx", BARREL_RENAMED_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Accordion.Item".to_string(), "Accordion.Panel".to_string(),]
    );
}

#[test]
fn import_then_export_namespace_reemits_member_aliases() {
    let outcome = trace_scratch(
        "member-alias-barrel-import-export",
        &[
            ("barrel.tsx", BARREL_IMPORT_EXPORT_TSX),
            ("tabs.tsx", TABS_TSX),
        ],
        "barrel.tsx",
    );

    assert_eq!(
        binding_names(&outcome),
        vec!["Tabs.Item".to_string(), "Tabs.Panel".to_string(),]
    );
}

#[test]
fn export_star_as_does_not_mint_namespaced_hosts() {
    // Deferred boundary: `export * as Accordion` invents a namespace whose
    // members (`<Accordion.Panel>`) name the origin's plain exports, which
    // needs per-export dotted hosts the walk does not mint. Silent, never
    // misattributed; only the origin's own spellings emit.
    let outcome = trace_scratch(
        "member-alias-barrel-star-as",
        &[("barrel.tsx", BARREL_STAR_AS_TSX), ("tabs.tsx", TABS_TSX)],
        "barrel.tsx",
    );

    assert!(!binding_names(&outcome)
        .iter()
        .any(|name| name.starts_with("Accordion.")));
}

#[test]
fn string_export_colliding_with_alias_unions() {
    let outcome = trace_scratch(
        "member-alias-string-export",
        &[("tabs.tsx", STRING_EXPORT_TSX)],
        "tabs.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Tabs.Panel".to_string()]);
    assert_eq!(
        outcome
            .owned_props
            .get("Tabs.Panel")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["id".to_string()])
    );
}

#[test]
fn same_host_across_modules_unions_owned_props() {
    let outcome = trace_scratch_entries(
        "member-alias-clash",
        &[("a.tsx", CLASH_A_TSX), ("b.tsx", CLASH_B_TSX)],
        &["a.tsx", "b.tsx"],
    );

    assert_eq!(
        binding_names(&outcome),
        vec![
            "PanelA".to_string(),
            "Tabs.Panel".to_string(),
            "PanelB".to_string(),
            "Tabs.Panel".to_string(),
        ]
    );
    assert_eq!(
        outcome
            .owned_props
            .get("Tabs.Panel")
            .cloned()
            .unwrap_or_default(),
        BTreeSet::from(["aaa".to_string(), "bbb".to_string()])
    );
}
