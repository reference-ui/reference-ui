//! Function and catch parameter bindings: folding annotations carry, the rest shadow.
//! A parameter with a folding `TSTypeLiteral` annotation carries its object
//! (or the destructured members it selects); every other parameter binds its
//! names with no value. Patterns of any shape declare their names the same
//! way, so shadowing is structural and resolution can never see past a param.

use oxc_ast::ast::BindingPattern;

use super::super::binding::{Binding, BindingInit, BindingKind};
use super::ScopeCollector;

/// Record one function parameter: a folding `TSTypeLiteral` annotation
/// carries its object (or the destructured members); anything else binds
/// every name to shadow with no value (SPEC-V2-46).
pub(crate) fn record_param(
    collector: &mut ScopeCollector<'_>,
    param: &oxc_ast::ast::FormalParameter<'_>,
) {
    // function paint(props: { color: 'red' })
    let Some(entries) = super::super::types::param_type_object(param) else {
        declare_pattern(collector, &param.pattern, BindingKind::Param);
        return;
    };
    if let BindingPattern::BindingIdentifier(ident) = &param.pattern {
        collector.declare_current(
            ident.name.as_str(),
            Binding {
                kind: BindingKind::Param,
                init: Some(BindingInit::Object(entries)),
                span: ident.span,
            },
        );
        return;
    }
    // function paint({ color }: { color: 'red' })
    let scope = collector.current();
    let bound =
        super::super::types::bind_param_pattern(&param.pattern, &entries, &collector.table, scope);
    let Some(bound) = bound else {
        declare_pattern(collector, &param.pattern, BindingKind::Param);
        return;
    };
    for (name, span, init) in bound {
        collector.declare_current(
            &name,
            Binding {
                kind: BindingKind::Param,
                init,
                span,
            },
        );
    }
}

/// Record every name a pattern binds, with no value.
pub(crate) fn declare_pattern(
    collector: &mut ScopeCollector<'_>,
    pattern: &BindingPattern<'_>,
    kind: BindingKind,
) {
    let mut names = Vec::new();
    pattern_names(pattern, &mut names);
    for (name, span) in names {
        collector.declare_current(
            &name,
            Binding {
                kind: kind.clone(),
                init: None,
                span,
            },
        );
    }
}

/// Gather every name a binding pattern declares, however nested.
fn pattern_names(pattern: &BindingPattern<'_>, out: &mut Vec<(String, oxc_span::Span)>) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            // color  in  { color }  /  [color]  /  (color)
            out.push((ident.name.to_string(), ident.span));
        }
        BindingPattern::ObjectPattern(obj) => object_pattern_names(obj, out),
        BindingPattern::ArrayPattern(arr) => array_pattern_names(arr, out),
        BindingPattern::AssignmentPattern(assign) => {
            // { color = 'red' }  — the default does not change the binding
            pattern_names(&assign.left, out);
        }
    }
}

/// Gather the names an object pattern binds: property values plus rest.
fn object_pattern_names(
    obj: &oxc_ast::ast::ObjectPattern<'_>,
    out: &mut Vec<(String, oxc_span::Span)>,
) {
    // { primary: color, ...space }  — values bind, keys do not
    for prop in &obj.properties {
        pattern_names(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        pattern_names(&rest.argument, out);
    }
}

/// Gather the names an array pattern binds: elements plus rest.
fn array_pattern_names(
    arr: &oxc_ast::ast::ArrayPattern<'_>,
    out: &mut Vec<(String, oxc_span::Span)>,
) {
    // [a, , ...rest]  — holes bind nothing
    for element in arr.elements.iter().flatten() {
        pattern_names(element, out);
    }
    if let Some(rest) = &arr.rest {
        pattern_names(&rest.argument, out);
    }
}
