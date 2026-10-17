//! The detailed result carries the trace's owned props. A host's own declared prop names
//! ride beside its binding, keyed by export name, so a caller that only has the compiled
//! shape of a published component can still tell a style from an attribute the component
//! keeps for itself. A host that forwards its whole props owns nothing and the map stays `{}`.
//! A component that reaches no primitive is not a host, but its declared props still ride the map.

use std::collections::{BTreeMap, BTreeSet};

use crate::trace_style_bindings_detailed;

use super::fixtures::{workspace_scratch_dir, workspace_sync_root};

const CARD_TSX: &str = concat!(
    "import { Div, type StyleProps } from '@reference-ui/react'\n",
    "export type CardProps = StyleProps & { title?: string }\n",
    "export function Card({ title, ...styleProps }: CardProps) {\n",
    "  return <Div {...styleProps}>{title}</Div>\n",
    "}\n",
);

const PLAIN_TSX: &str = concat!(
    "import { Div, type StyleProps } from '@reference-ui/react'\n",
    "export function Plain(props: StyleProps) {\n",
    "  return <Div {...props} />\n",
    "}\n",
);

fn detailed(name: &str, source: &str) -> crate::StyletraceDetailedResult {
    let scratch = workspace_scratch_dir(name);
    scratch.write("index.tsx", source);
    let sync_root = workspace_sync_root();
    trace_style_bindings_detailed(scratch.root(), Some(sync_root.as_path()))
        .expect("expected the detailed trace to succeed")
}

#[test]
fn detailed_result_keys_owned_props_by_export_name() {
    let result = detailed("detailed-owned-card", CARD_TSX);

    let names: Vec<&str> = result.bindings.iter().map(|b| b.name.as_str()).collect();
    assert_eq!(names, vec!["Card"]);
    assert_eq!(
        result.owned,
        BTreeMap::from([("Card".to_string(), BTreeSet::from(["title".to_string()]))])
    );
    // The wire shape the JS wrapper parses: an object of sorted arrays.
    let wire = serde_json::to_string(&result.owned).expect("owned serializes");
    assert_eq!(wire, r#"{"Card":["title"]}"#);
}

/// Overlay's shape: a declared `isolation` and a body that returns only a context provider.
const PROVIDER_TSX: &str = concat!(
    "import * as React from 'react'\n",
    "export interface OverlayProps {\n",
    "  children?: React.ReactNode\n",
    "  isolation?: boolean\n",
    "}\n",
    "const OverlayContext = React.createContext(true)\n",
    "export function Overlay({ children, isolation = true }: OverlayProps) {\n",
    "  return <OverlayContext.Provider value={isolation}>{children}</OverlayContext.Provider>\n",
    "}\n",
);

#[test]
fn provider_only_export_keeps_its_declared_props_without_hosting() {
    let result = detailed("detailed-owned-provider", PROVIDER_TSX);

    assert!(result.bindings.is_empty(), "bindings: {:?}", result.bindings);
    assert_eq!(
        result.owned,
        BTreeMap::from([(
            "Overlay".to_string(),
            BTreeSet::from(["children".to_string(), "isolation".to_string()]),
        )])
    );
    let wire = serde_json::to_string(&result.owned).expect("owned serializes");
    assert_eq!(wire, r#"{"Overlay":["children","isolation"]}"#);
}

#[test]
fn detailed_result_serializes_empty_owned_when_nothing_is_kept() {
    let result = detailed("detailed-owned-plain", PLAIN_TSX);

    let names: Vec<&str> = result.bindings.iter().map(|b| b.name.as_str()).collect();
    assert_eq!(names, vec!["Plain"]);
    assert!(result.owned.is_empty(), "owned: {:?}", result.owned);
    // Always present on the wire, never omitted.
    let wire = serde_json::to_value(&result).expect("result serializes");
    assert_eq!(wire["owned"], serde_json::json!({}));
}
