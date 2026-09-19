//! Declared names of a binding pattern for export collection.
//! Walks `const` declarator patterns — identifiers, nested object and array
//! patterns, defaults, and rests — pushing every bound name. Export
//! collection maps each name to a local shape; holes bind nothing.

use oxc_ast::ast::BindingPattern;

/// Every name a binding pattern declares, including nested patterns.
pub fn pattern_names(pattern: &BindingPattern<'_>) -> Vec<String> {
    let mut out = Vec::new();
    collect_pattern_names(pattern, &mut out);
    out
}

/// Walk one binding pattern, pushing each declared identifier.
fn collect_pattern_names(pattern: &BindingPattern<'_>, out: &mut Vec<String>) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => {
            out.push(id.name.to_string());
        }
        BindingPattern::ObjectPattern(obj) => collect_object_pattern(obj, out),
        BindingPattern::ArrayPattern(arr) => collect_array_pattern(arr, out),
        BindingPattern::AssignmentPattern(assign) => {
            collect_pattern_names(&assign.left, out);
        }
    }
}

/// Push every name an object pattern declares, rest included.
fn collect_object_pattern(obj: &oxc_ast::ast::ObjectPattern<'_>, out: &mut Vec<String>) {
    for prop in &obj.properties {
        collect_pattern_names(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        collect_pattern_names(&rest.argument, out);
    }
}

/// Push every name an array pattern declares, holes bound to nothing.
fn collect_array_pattern(arr: &oxc_ast::ast::ArrayPattern<'_>, out: &mut Vec<String>) {
    for element in arr.elements.iter().flatten() {
        collect_pattern_names(element, out);
    }
    if let Some(rest) = &arr.rest {
        collect_pattern_names(&rest.argument, out);
    }
}
