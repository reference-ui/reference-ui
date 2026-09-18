//! Engine-owned StyleTrace surface for host discovery.
//! Unions runtime StyleProps names with typegen's condition keys over canon
//! primitives so tracing admits exactly the components that can carry style.
//! Built from the request system alone; reads no files.

use std::collections::BTreeSet;

use styletrace::StyleSurface;

use crate::BaseSystem;

/// Engine-owned surface: runtime prop names plus typegen's condition keys
/// plus canon primitives. No file read.
pub fn engine_surface(system: &BaseSystem) -> StyleSurface {
    let mut style_props = crate::get_style_prop_names()
        .into_iter()
        .collect::<BTreeSet<_>>();
    style_props.extend(condition_keys(system));
    let primitives = canon::PRIMITIVE_JSX
        .iter()
        .map(ToString::to_string)
        .collect();
    StyleSurface::new(style_props, primitives).trust_surface_type_names()
}

/// Condition keys exactly as typegen prints `StyleConditionKey`: canon
/// named conditions plus `@`-prefixed breakpoints minus `base`. Authored
/// `BaseSystem.conditions` stay out, mirroring the printer's gap.
fn condition_keys(system: &BaseSystem) -> BTreeSet<String> {
    let mut keys = BTreeSet::new();
    for name in canon::NAMED_CONDITIONS {
        keys.insert((*name).to_string());
    }
    for name in system.breakpoints().names() {
        if name == "base" {
            continue;
        }
        keys.insert(format!("@{name}"));
    }
    keys
}
