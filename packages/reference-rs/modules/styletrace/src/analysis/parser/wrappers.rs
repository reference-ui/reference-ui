//! Recognizes the wrapper and compound-member shapes whose export is another local binding.
//! A `memo` or `forwardRef` call imported from `react` (as `React.memo`, a named import, or nested like `memo(forwardRef(Base))`) names the identifier it wraps, and `Object.assign(Root, { Item })` names one compound member per identifier-valued property.
//! Takes parsed expressions and the module's import bindings, and emits the wrapped identifier or the member aliases for the parser to fold into its maps.
//! A callee only counts as React when its binding imports from `react`, so a local helper that happens to be called `memo` never links.

use oxc_ast::ast::{Argument, Expression, ObjectPropertyKind, PropertyKey};
use rustc_hash::FxHashMap;

use super::types::unwrap_transparent_expression;
use crate::analysis::model::{MemberAlias, TraceImport};

const REACT_WRAPPERS: [&str; 2] = ["memo", "forwardRef"];

/// The identifier a React wrapper call wraps: `memo(Base)`, `React.forwardRef(Base)`, or a nested
/// wrapper such as `memo(forwardRef(Base))`. `None` for any other initializer.
pub(super) fn react_wrapper_identifier<'a>(
    expression: &'a Expression<'a>,
    imports: &FxHashMap<String, TraceImport>,
) -> Option<&'a str> {
    let Expression::CallExpression(call) = unwrap_transparent_expression(expression) else {
        return None;
    };
    if !is_react_wrapper_callee(&call.callee, imports) {
        return None;
    }
    let first = argument_expression(call.arguments.first()?)?;
    match unwrap_transparent_expression(first) {
        Expression::Identifier(identifier) => Some(identifier.name.as_str()),
        nested @ Expression::CallExpression(_) => react_wrapper_identifier(nested, imports),
        _ => None,
    }
}

/// `memo(...)` or `forwardRef(...)` bound by a named import from `react`, or `Ns.memo(...)` where
/// `Ns` is any binding imported from `react`.
fn is_react_wrapper_callee(callee: &Expression<'_>, imports: &FxHashMap<String, TraceImport>) -> bool {
    match callee {
        Expression::Identifier(identifier) => imports
            .get(identifier.name.as_str())
            .is_some_and(|import| {
                is_react_import(import) && is_react_wrapper_name(&import.imported_name)
            }),
        Expression::StaticMemberExpression(member) => {
            is_react_wrapper_name(member.property.name.as_str())
                && is_react_namespace(&member.object, imports)
        }
        _ => false,
    }
}

fn is_react_namespace(object: &Expression<'_>, imports: &FxHashMap<String, TraceImport>) -> bool {
    matches!(
        object,
        Expression::Identifier(namespace)
            if imports.get(namespace.name.as_str()).is_some_and(is_react_import)
    )
}

fn is_react_wrapper_name(name: &str) -> bool {
    REACT_WRAPPERS.contains(&name)
}

fn is_react_import(import: &TraceImport) -> bool {
    import.source == "react"
}

/// Mint one `namespace.prop` member alias per identifier-valued property of each object argument
/// after the target in an `Object.assign(Target, { ... })` initializer. Computed keys, methods,
/// spreads and non-identifier values name no traced member, so they mint nothing.
pub(super) fn collect_object_assign_members(
    namespace: &str,
    init: &Expression<'_>,
    aliases: &mut Vec<MemberAlias>,
) {
    let Expression::CallExpression(call) = unwrap_transparent_expression(init) else {
        return;
    };
    if !is_object_assign_callee(&call.callee) {
        return;
    }
    for argument in call.arguments.iter().skip(1) {
        let Some(Expression::ObjectExpression(object)) = argument_expression(argument) else {
            continue;
        };
        for property in &object.properties {
            if let Some(alias) = member_from_property(namespace, property) {
                aliases.push(alias);
            }
        }
    }
}

fn is_object_assign_callee(callee: &Expression<'_>) -> bool {
    let Expression::StaticMemberExpression(member) = callee else {
        return false;
    };
    member.property.name.as_str() == "assign"
        && matches!(&member.object, Expression::Identifier(object) if object.name.as_str() == "Object")
}

fn member_from_property(namespace: &str, property: &ObjectPropertyKind<'_>) -> Option<MemberAlias> {
    let ObjectPropertyKind::ObjectProperty(property) = property else {
        return None;
    };
    if property.computed || property.method {
        return None;
    }
    let prop = static_key_name(&property.key)?;
    let Expression::Identifier(target) = unwrap_transparent_expression(&property.value) else {
        return None;
    };
    Some(MemberAlias {
        namespace: namespace.to_string(),
        prop,
        target: target.name.to_string(),
    })
}

fn static_key_name(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(literal) => Some(literal.value.to_string()),
        _ => None,
    }
}

fn argument_expression<'a>(argument: &'a Argument<'a>) -> Option<&'a Expression<'a>> {
    match argument {
        Argument::SpreadElement(_) => None,
        other => Some(other.to_expression()),
    }
}
