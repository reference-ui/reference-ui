//! Compound-member alias tracing when the aliased part is a `forwardRef` component, the shape the
//! production `Tabs.Panel` uses. Each single-file fixture swaps only the Panel declaration of its
//! plain-function sibling in `member_alias.rs` for a `forwardRef` wrapper imported from `react`, then
//! asserts the same collected names, owned props and silence. The cross-module case follows production
//! more closely: the wrapper lives in `panel.tsx` and the root attaches it from `tabs.tsx`.

use std::collections::BTreeSet;

use super::member_alias::{binding_names, trace_scratch};

const FORWARD_REF_HEAD: &str = concat!(
    "import { forwardRef } from 'react'\n",
    "import { Div } from '@reference-ui/react'\n",
    "interface PanelProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
);

const FUNCTION_PANEL: &str = concat!(
    "export const Panel = forwardRef(function Panel(props: PanelProps, ref: unknown) {\n",
    "  void ref\n",
    "  return <Div {...props} />\n",
    "})\n",
);

const ARROW_PANEL: &str = concat!(
    "export const Panel = forwardRef((props: PanelProps, ref: unknown) => {\n",
    "  void ref\n",
    "  return <Div {...props} />\n",
    "})\n",
);

// `forwardRef(Inner)` names an identifier rather than an inline function, so the wrapper link
// (not call unwrapping) is what makes `Panel` a component.
const IDENTIFIER_PANEL: &str = concat!(
    "function PanelInner(props: PanelProps, ref: unknown) {\n",
    "  void ref\n",
    "  return <Div {...props} />\n",
    "}\n",
    "export const Panel = forwardRef(PanelInner)\n",
);

const OWNED_PANEL: &str = concat!(
    "export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel({ id, ...rest }, ref) {\n",
    "  void id\n",
    "  void ref\n",
    "  return <Div {...rest} />\n",
    "})\n",
);

const PLAIN_TAIL: &str = concat!(
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

const PANEL_TSX: &str = concat!(
    "import * as React from 'react'\n",
    "import { Div } from '@reference-ui/react'\n",
    "interface TabPanelProps {\n",
    "  p?: string\n",
    "  id?: string\n",
    "}\n",
    "export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel({ id, ...rest }, ref) {\n",
    "  void id\n",
    "  void ref\n",
    "  return <Div {...rest} />\n",
    "})\n",
);

const TABS_IMPORTING_PANEL_TSX: &str = concat!(
    "import { TabPanel } from './panel'\n",
    "export function Tabs({ children }: { children?: unknown }) {\n",
    "  return <>{children as never}</>\n",
    "}\n",
    "Tabs.Panel = TabPanel\n",
);

/// The Tabs root with one Panel declaration spliced in. Only the Panel varies between variants, so
/// each variant's assertions line up with the plain-function sibling's.
fn tabs_source(panel: &str) -> String {
    [FORWARD_REF_HEAD, panel, PLAIN_TAIL].concat()
}

fn trace_tabs(name: &str, panel: &str) -> crate::TraceOutcome {
    let source = tabs_source(panel);
    trace_scratch(name, &[("tabs.tsx", source.as_str())], "tabs.tsx")
}

#[test]
fn forward_ref_function_panel_emits_dotted_hosts() {
    let outcome = trace_tabs("member-alias-forward-ref-fn", FUNCTION_PANEL);

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
fn forward_ref_arrow_panel_emits_dotted_hosts() {
    let outcome = trace_tabs("member-alias-forward-ref-arrow", ARROW_PANEL);

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
fn forward_ref_identifier_panel_emits_dotted_hosts() {
    let outcome = trace_tabs("member-alias-forward-ref-ident", IDENTIFIER_PANEL);

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
fn forward_ref_panel_dotted_host_carries_owned_props() {
    let outcome = trace_tabs("member-alias-forward-ref-owned", OWNED_PANEL);

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
fn forward_ref_panel_imported_across_modules_emits_dotted_host() {
    let outcome = trace_scratch(
        "member-alias-forward-ref-imported",
        &[
            ("panel.tsx", PANEL_TSX),
            ("tabs.tsx", TABS_IMPORTING_PANEL_TSX),
        ],
        "tabs.tsx",
    );

    assert_eq!(binding_names(&outcome), vec!["Tabs.Panel".to_string()]);
}
