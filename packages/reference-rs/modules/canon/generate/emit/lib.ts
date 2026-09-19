/**
 * Library root code emitter for Reference UI Rust canon crate.
 * Generates module switchboards, re-exports, and public lookup facades.
 * Emits zero-allocation binary search helpers into modules/canon/src/lib.rs.
 */

export function emitLibRs(): string {
  return `//! The official set of platform elements, CSS properties, aliases, and conditions.
//!
//! Serves as the central dictionary consulted by all compiler stages (extract, resolve, stylesheet).
//! Joins living W3C/WHATWG specifications with Reference UI design system dialects.
//! Provides zero-allocation lookup functions and standard conversion routines for style engine passes.
// @generated

pub mod conditions;
pub mod css;
pub mod dialect;
pub mod html;
#[cfg(test)]
mod tests;

pub use conditions::{is_condition, CONDITIONS, NAMED_CONDITIONS};
pub use css::{
    classify_css_value, find_property, is_color_prop, is_unitless_prop, native_longhands_for_prop,
    prop_accepts, property_cascade_rank, Property, ValueKind, CANONICAL_PROPERTIES,
    COLOR_PROPERTIES, UNITLESS_PROPERTIES,
};
pub use dialect::{is_reference_prop, resolve_alias, Alias, ALIASES, REFERENCE_PROPS};
pub use html::{is_html_tag, is_primitive_jsx_name, is_reference_primitive, Element, ELEMENTS, PRIMITIVE_JSX};

/// Returns true if the given property name is a recognized Reference UI style prop.
pub fn is_known_style_prop(name: &str) -> bool {
    if name.starts_with("--") {
        return true;
    }
    is_reference_prop(name) || resolve_alias(name).is_some() || find_property(name).is_some()
}

/// Returns true if the given key represents a condition, pseudo selector, or breakpoint.
pub fn is_condition_prop(name: &str) -> bool {
    is_condition(name)
}

/// Resolves a shorthand or alias to its canonical camelCase property name.
pub fn resolve_canonical_prop(prop: &str) -> &str {
    resolve_alias(prop).unwrap_or(prop)
}

/// Returns the atomic class name prefix for a property.
pub fn class_prefix_for_prop(prop: &str) -> &str {
    let canonical = resolve_canonical_prop(prop);
    if let Some(p) = find_property(canonical) {
        p.class_prefix
    } else {
        canonical
    }
}

/// Converts a property name or alias to its CSS declaration property name.
pub fn to_css_declaration_property(prop: &str) -> &str {
    let canonical = resolve_canonical_prop(prop);
    if canonical.starts_with("--") {
        return canonical;
    }
    if let Some(p) = find_property(canonical) {
        return p.css;
    }
    canonical
}
`;
}
