//! The official set of platform elements, CSS properties, aliases, and conditions.
//!
//! Serves as the central dictionary consulted by all compiler stages (extract, resolve, stylesheet).
//! Joins living W3C/WHATWG specifications with Reference UI design system dialects.

pub mod conditions;
pub mod css;
pub mod dialect;
pub mod html;
#[cfg(test)]
mod tests;

pub use conditions::{default_breakpoint_for_index, is_condition, CONDITIONS, DEFAULT_BREAKPOINTS};
pub use css::{find_property, native_longhands_for_prop, Property, CANONICAL_PROPERTIES};
pub use dialect::{is_reference_prop, resolve_alias, Alias, ALIASES, REFERENCE_PROPS};
pub use html::{is_html_tag, is_primitive_jsx_name, is_reference_primitive, Element, ELEMENTS};

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

/// Converts a camelCase property name to a CSS kebab-case property name.
pub fn to_css_declaration_property(prop: &str) -> String {
    let canonical = resolve_canonical_prop(prop);
    if canonical.starts_with("--") {
        return canonical.to_string();
    }
    if let Some(p) = find_property(canonical) {
        return p.css.to_string();
    }
    let mut out = String::with_capacity(canonical.len() + 4);
    for ch in canonical.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}
