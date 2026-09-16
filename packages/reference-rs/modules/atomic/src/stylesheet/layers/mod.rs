//! Cascade layer definitions and preamble declarations for Reference UI stylesheets.
//! Establishes the canonical `@layer` ordering among reset, global, base, tokens, recipes, and utilities.
//! Guarantees strict cascade precedence and prevents unintended specificity wars across generated CSS rules.
//! Every named system nests those six layers inside its own package layer, so composed
//! packages keep their internal order and no internal layer leaks to the top level.
//! An unnamed system keeps the bare six-layer preamble for unit-isolated compiles.

use super::name::escape::escape_css_selector;

/// The 6-layer contract emitted verbatim.
pub const LAYER_PREAMBLE: &str = "@layer reset, global, base, tokens, recipes, utilities;\n";

/// Nest emitted CSS inside the system's package layer.
///
/// A named system prints `@layer <name> { ... }` around the whole sheet, so the
/// host can concatenate upstream chunks and order packages without re-parsing.
/// The name is CSS-escaped like a class selector: valid package idents pass
/// through unchanged while scope characters print escaped (`\@reference-ui\/lib`).
/// An empty name returns the CSS unchanged; identity-free compiles stay flat.
pub fn wrap_package_layer(system: &str, inner: &str) -> String {
    if system.is_empty() {
        return inner.to_string();
    }
    let mut out = String::with_capacity(inner.len() + system.len() + 16);
    out.push_str("@layer ");
    out.push_str(&escape_css_selector(system));
    out.push_str(" {\n");
    out.push_str(inner);
    out.push_str("}\n");
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wrap_package_layer_scopes_named_system() {
        let css = wrap_package_layer("color-mode", LAYER_PREAMBLE);
        assert_eq!(
            css,
            "@layer color-mode {\n@layer reset, global, base, tokens, recipes, utilities;\n}\n"
        );
    }

    #[test]
    fn test_wrap_package_layer_escapes_scope_characters() {
        let css = wrap_package_layer("@reference-ui/lib", LAYER_PREAMBLE);
        assert!(css.starts_with("@layer \\@reference-ui\\/lib {\n"));
        assert!(css.contains(LAYER_PREAMBLE));
        assert!(css.ends_with("}\n"));
    }

    #[test]
    fn test_wrap_package_layer_leaves_unnamed_flat() {
        assert_eq!(wrap_package_layer("", LAYER_PREAMBLE), LAYER_PREAMBLE);
    }
}
