//! Owned props of components a module declares but never exports. Such a component has no export
//! name to carry its owned props, so the outcome keys them by module path and local name instead:
//! its own file's call sites read them, and the export-keyed map never sees the local name.
//! Scratch sources and the shared hand-built surface keep each case hermetic.

use std::collections::{BTreeMap, BTreeSet};

use super::owned_props::{test_surface, trace_scratch};

const LOCAL_TSX: &str = concat!(
    "import { Div } from '@reference-ui/react'\n",
    "function LocalButton({ size }: { size: 'sm' | 'lg' }) {\n",
    "  return <Div data-size={size}>x</Div>\n",
    "}\n",
    "function Forwarding({ size }: { size?: string }) {\n",
    "  return <Div size={size} />\n",
    "}\n",
    "export const example = <LocalButton size=\"lg\" />\n",
    "export const control = <Forwarding size=\"2r\" />\n",
);

/// A local component that turns `size` into `data-size` owns it under its file and local name; a
/// sibling that passes `size` on under its own name owns nothing, and no export name appears.
#[test]
fn unexported_component_owns_its_consumed_props_by_file() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-local",
        &[("Local.tsx", LOCAL_TSX)],
        "Local.tsx",
        &surface,
    );
    assert!(outcome.diagnostics.is_empty(), "{:?}", outcome.diagnostics);
    assert!(outcome.owned_props.is_empty(), "{:?}", outcome.owned_props);
    let local: Vec<_> = outcome.local_owned.values().collect();
    let expected = BTreeMap::from([(
        "LocalButton".to_string(),
        BTreeSet::from(["size".to_string()]),
    )]);
    assert_eq!(local, vec![&expected]);
    let path = outcome.local_owned.keys().next().expect("one module");
    assert!(path.ends_with("Local.tsx"), "{path:?}");
}
