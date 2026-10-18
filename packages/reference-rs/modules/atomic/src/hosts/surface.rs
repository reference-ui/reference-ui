//! Engine-owned StyleTrace surface for host discovery.
//! Unions runtime StyleProps names with typegen's condition keys over canon
//! primitives so tracing admits exactly the components that can carry style.
//! Breakpoint keys stay out: they nest inside style objects, never as props.
//! Built from canon alone; reads no files.

use std::collections::BTreeSet;

use styletrace::StyleSurface;

/// Engine-owned surface: runtime prop names plus typegen's condition keys
/// plus canon primitives. No file read.
pub fn engine_surface() -> StyleSurface {
    let mut style_props = crate::get_style_prop_names()
        .into_iter()
        .collect::<BTreeSet<_>>();
    style_props.extend(condition_keys());
    let primitives = canon::PRIMITIVE_JSX
        .iter()
        .map(ToString::to_string)
        .collect();
    StyleSurface::new(style_props, primitives).trust_surface_type_names()
}

/// Condition keys exactly as typegen prints `StyleConditionKey`: canon
/// named conditions only. Authored `BaseSystem.conditions` stay out,
/// mirroring the printer's gap.
fn condition_keys() -> BTreeSet<String> {
    canon::NAMED_CONDITIONS
        .iter()
        .map(|name| (*name).to_string())
        .collect()
}
