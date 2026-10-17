//! Provider-only components keep the props they declare without becoming hosts. A component whose
//! body reaches no primitive, such as Overlay (a declared `isolation` under a context provider),
//! owns its declared props, and that owned set reaches the outcome directly, through a named
//! barrel, and through `export *`. Scratch sources and the hand-built surface keep it hermetic.

use std::collections::BTreeSet;

use super::owned_props::{test_surface, trace_scratch};

/// Overlay's shape: a declared `isolation` and a body that returns only a context provider, so no
/// primitive is reached and the component must not become a host.
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

fn provider_owned() -> BTreeSet<String> {
    BTreeSet::from(["children".to_string(), "isolation".to_string()])
}

#[test]
fn provider_only_component_owns_its_declared_props_and_hosts_nothing() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-props-provider",
        &[("Overlay.tsx", PROVIDER_TSX)],
        "Overlay.tsx",
        &surface,
    );

    assert!(
        outcome.bindings.is_empty(),
        "a provider-only component is not a host, got {:?}",
        outcome.bindings
    );
    assert_eq!(
        outcome.owned_props.get("Overlay").cloned().unwrap_or_default(),
        provider_owned()
    );
}

#[test]
fn provider_only_component_keeps_owned_props_through_a_named_barrel() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-props-provider-barrel",
        &[
            ("Overlay.tsx", PROVIDER_TSX),
            ("index.ts", "export { Overlay } from './Overlay'\n"),
        ],
        "index.ts",
        &surface,
    );

    assert!(outcome.bindings.is_empty(), "got {:?}", outcome.bindings);
    assert_eq!(
        outcome.owned_props.get("Overlay").cloned().unwrap_or_default(),
        provider_owned()
    );
}

#[test]
fn provider_only_component_keeps_owned_props_through_export_star() {
    let surface = test_surface();
    let outcome = trace_scratch(
        "owned-props-provider-star",
        &[
            ("Overlay.tsx", PROVIDER_TSX),
            ("index.ts", "export * from './Overlay'\n"),
        ],
        "index.ts",
        &surface,
    );

    assert!(outcome.bindings.is_empty(), "got {:?}", outcome.bindings);
    assert_eq!(
        outcome.owned_props.get("Overlay").cloned().unwrap_or_default(),
        provider_owned()
    );
}
