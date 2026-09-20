//! JSX host attribute gate for independent diagnostics analysis.
//!
//! Decides which attribute names carry styles on a host: `css`, `r`,
//! condition props, and known style props. The host's own declared props,
//! native `style`, runtime-owned `variant`/`colorMode`, and unknown DOM
//! attributes stay silent. Both the JSX visitor and the spread-bag walker
//! gate through here so attribute filtering agrees everywhere.

use std::collections::{BTreeMap, BTreeSet};

use canon::{is_condition_prop, is_known_style_prop};

/// The host gate one JSX attribute consults: the tag plus the host-owned
/// prop map. Owned names are the host's own props, never styles.
pub struct AttrGate<'a> {
    pub tag: &'a str,
    pub owned: &'a BTreeMap<String, BTreeSet<String>>,
}

/// True for attribute names that carry styles on this host.
pub fn is_style_attr(gate: &AttrGate<'_>, name: &str) -> bool {
    if host_owns(gate, name) || name == "style" || name == "variant" || name == "colorMode" {
        return false;
    }
    name == "css" || name == "r" || is_condition_prop(name) || is_known_style_prop(name)
}

/// True when the host's own declaration owns this prop name. Member tags
/// match concatenated hosts, mirroring the tag gate.
fn host_owns(gate: &AttrGate<'_>, name: &str) -> bool {
    if let Some(owned) = gate.owned.get(gate.tag) {
        if owned.contains(name) {
            return true;
        }
    }
    gate.tag.contains('.')
        && gate
            .owned
            .get(&gate.tag.replace('.', ""))
            .is_some_and(|owned| owned.contains(name))
}
