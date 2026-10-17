//! Reassigned compound-member aliases resolve last-wins: a final untraced target stays silent, a final traced target collects, and owned props come from the final target.
//! Function-local bindings with the same names do not disturb module-level aliases.
//! Fixtures and assertions go through the shared helpers in `member_alias`.

use std::collections::BTreeSet;

use super::member_alias::{binding_names, trace_scratch};

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
