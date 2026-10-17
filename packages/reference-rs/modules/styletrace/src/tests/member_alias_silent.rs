//! Compound-member shapes that must stay silent: namespace-import targets, computed member keys, and `Object.assign` assignments.
//! Each fixture is traced through the shared helpers, and the assertion is that no dotted host is emitted.

use super::member_alias::{binding_names, trace_scratch};

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
