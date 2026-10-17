//! Valueless shadows for destructured parameter and declarator patterns. Every name a pattern binds
//! becomes a shadow entry, so an outer const of the same name cannot leak through; object rest and
//! array rest bind their names the same way. Takes a `BindingPattern` and appends one shadow entry
//! per bound name to the caller's buffer.

use oxc_ast::ast::BindingPattern;
use oxc_span::Span;

use super::super::binding::BindingInit;

/// Shadow bindings for one pattern shape.
pub(super) type ShadowOut = Vec<(String, Span, Option<BindingInit>)>;

/// Gather every name a pattern binds as valueless shadows.
pub(super) fn shadow_pattern(pattern: &BindingPattern<'_>, out: &mut ShadowOut) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.push((ident.name.to_string(), ident.span, None));
        }
        BindingPattern::ObjectPattern(obj) => shadow_object(obj, out),
        BindingPattern::ArrayPattern(arr) => shadow_array(arr, out),
        BindingPattern::AssignmentPattern(assign) => {
            shadow_pattern(&assign.left, out);
        }
    }
}

/// Gather the names an object pattern binds: property values plus rest.
fn shadow_object(obj: &oxc_ast::ast::ObjectPattern<'_>, out: &mut ShadowOut) {
    for prop in &obj.properties {
        shadow_pattern(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        shadow_pattern(&rest.argument, out);
    }
}

/// Gather the names an array pattern binds: elements plus rest.
fn shadow_array(arr: &oxc_ast::ast::ArrayPattern<'_>, out: &mut ShadowOut) {
    for element in arr.elements.iter().flatten() {
        shadow_pattern(element, out);
    }
    if let Some(rest) = &arr.rest {
        shadow_pattern(&rest.argument, out);
    }
}
