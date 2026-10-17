//! Export-name collisions between a compound-member alias and another binding that mints the same host.
//! A string-literal export and two modules that both mint one host must union their owned props rather than drop either side.

use std::collections::BTreeSet;

use super::member_alias::{binding_names, trace_scratch, trace_scratch_entries};

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
