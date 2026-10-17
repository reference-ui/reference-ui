//! JSX traversal for collecting forwarding edges.
//! It takes JSX elements, children, attributes and expression containers, and visits each one in source order.
//! It emits a `ComponentEdge` for each JSX or createElement target whose props pass a style prop, and records forwarded prop names.

use super::expr::collect_edges_from_expression;
use super::forwarded::note_forwarded_props;
use super::WalkContext;
use crate::analysis::model::{ComponentEdge, EdgeTarget, PropBindings, TraceImport};
use crate::analysis::util::{is_component_name, jsx_name_to_string};
use oxc_ast::ast::{
    Argument, Expression, JSXAttribute, JSXAttributeItem, JSXAttributeValue, JSXChild,
    JSXElementName, JSXExpression,
};
use rustc_hash::FxHashMap;
use std::collections::BTreeSet;

pub fn collect_edges_from_jsx_child(child: &JSXChild<'_>, ctx: &mut WalkContext<'_>) {
    match child {
        // Text carries no expression, so it can never hold an edge.
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => collect_edges_from_jsx_element(element, ctx),
        JSXChild::Fragment(fragment) => collect_edges_from_jsx_children(&fragment.children, ctx),
        JSXChild::ExpressionContainer(container) => {
            collect_edges_from_jsx_expression(&container.expression, ctx)
        }
        JSXChild::Spread(spread) => collect_edges_from_expression(&spread.expression, ctx),
    }
}

pub fn collect_edges_from_jsx_children(children: &[JSXChild<'_>], ctx: &mut WalkContext<'_>) {
    for child in children {
        collect_edges_from_jsx_child(child, ctx);
    }
}

pub fn collect_edges_from_jsx_expression(
    expression: &JSXExpression<'_>,
    ctx: &mut WalkContext<'_>,
) {
    match expression {
        JSXExpression::EmptyExpression(_) => {}
        _ => collect_edges_from_expression(expression.to_expression(), ctx),
    }
}

pub fn collect_edges_from_jsx_element(
    element: &oxc_ast::ast::JSXElement<'_>,
    ctx: &mut WalkContext<'_>,
) {
    if let Some(target) = jsx_target(
        &element.opening_element.name,
        ctx.imports,
        ctx.primitive_names,
    ) {
        let passes_style_props = element
            .opening_element
            .attributes
            .iter()
            .any(|attribute| jsx_attribute_passes_style_props(attribute, ctx.bindings));

        if passes_style_props {
            ctx.edges.push(ComponentEdge { target });
        }
    }

    for attribute in &element.opening_element.attributes {
        walk_jsx_attribute(attribute, ctx);
    }

    for child in &element.children {
        collect_edges_from_jsx_child(child, ctx);
    }
}

fn walk_jsx_attribute(attribute: &JSXAttributeItem<'_>, ctx: &mut WalkContext<'_>) {
    note_forwarded_props(attribute, ctx);
    match attribute {
        JSXAttributeItem::Attribute(attr) => walk_jsx_attribute_value(attr.value.as_ref(), ctx),
        JSXAttributeItem::SpreadAttribute(spread) => {
            collect_edges_from_expression(&spread.argument, ctx)
        }
    }
}

/// A bare attribute (`<Box flag />`) has no value and nothing to walk.
fn walk_jsx_attribute_value(value: Option<&JSXAttributeValue<'_>>, ctx: &mut WalkContext<'_>) {
    let Some(value) = value else {
        return;
    };
    match value {
        JSXAttributeValue::ExpressionContainer(container) => {
            collect_edges_from_jsx_expression(&container.expression, ctx)
        }
        JSXAttributeValue::Element(el) => collect_edges_from_jsx_element(el, ctx),
        JSXAttributeValue::Fragment(frag) => collect_edges_from_jsx_children(&frag.children, ctx),
        JSXAttributeValue::StringLiteral(_) => {}
    }
}

pub fn jsx_target(
    name: &JSXElementName<'_>,
    imports: &FxHashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    let name = jsx_name_to_string(name);
    if !is_component_name(&name) {
        return None;
    }

    if let Some((namespace, member)) = name.split_once('.') {
        return handle_namespace_target(namespace, member, imports, primitive_names);
    }

    if let Some(import_binding) = imports.get(&name) {
        if import_binding.source == "@reference-ui/react"
            && primitive_names.contains(&import_binding.imported_name)
        {
            return Some(EdgeTarget::Primitive(import_binding.imported_name.clone()));
        }

        return Some(EdgeTarget::Imported {
            source: import_binding.source.clone(),
            imported_name: import_binding.imported_name.clone(),
        });
    }

    Some(EdgeTarget::Local(name))
}

pub fn handle_namespace_target(
    namespace: &str,
    member: &str,
    imports: &FxHashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    if let Some(import_binding) = imports.get(namespace) {
        if import_binding.is_namespace {
            if import_binding.source == "@reference-ui/react" && primitive_names.contains(member) {
                return Some(EdgeTarget::Primitive(member.to_string()));
            }

            return Some(EdgeTarget::Imported {
                source: import_binding.source.clone(),
                imported_name: member.to_string(),
            });
        }
    }
    None
}

pub fn create_element_target(
    argument: &Argument<'_>,
    imports: &FxHashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    match argument {
        Argument::Identifier(identifier) => {
            identifier_target(identifier.name.as_str(), imports, primitive_names)
        }
        _ => None,
    }
}

pub fn identifier_target(
    name: &str,
    imports: &FxHashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    if !is_component_name(name) {
        return None;
    }

    if let Some(import_binding) = imports.get(name) {
        if import_binding.source == "@reference-ui/react"
            && primitive_names.contains(&import_binding.imported_name)
        {
            return Some(EdgeTarget::Primitive(import_binding.imported_name.clone()));
        }

        return Some(EdgeTarget::Imported {
            source: import_binding.source.clone(),
            imported_name: import_binding.imported_name.clone(),
        });
    }

    Some(EdgeTarget::Local(name.to_string()))
}

pub fn is_react_create_element_call(
    call: &oxc_allocator::Box<'_, oxc_ast::ast::CallExpression<'_>>,
) -> bool {
    match &call.callee {
        Expression::Identifier(identifier) => identifier.name == "createElement",
        Expression::StaticMemberExpression(member) => {
            matches!(&member.object, Expression::Identifier(identifier) if identifier.name == "React")
                && member.property.name == "createElement"
        }
        _ => false,
    }
}

pub fn create_element_props_pass_style_props(
    argument: &Argument<'_>,
    bindings: &PropBindings,
) -> bool {
    match argument {
        Argument::NullLiteral(_) => false,
        Argument::ObjectExpression(object) => object_literal_passes_style_props(object, bindings),
        Argument::Identifier(identifier) => {
            identifier_passes_style_props(identifier.name.as_str(), bindings)
        }
        Argument::SpreadElement(spread) => bindings.expression_reads_style_prop(&spread.argument),
        _ => bindings.expression_reads_style_prop(argument.to_expression()),
    }
}

/// A props object literal forwards style props when any value or spread reads one.
fn object_literal_passes_style_props(
    object: &oxc_ast::ast::ObjectExpression<'_>,
    bindings: &PropBindings,
) -> bool {
    object.properties.iter().any(|property| match property {
        oxc_ast::ast::ObjectPropertyKind::ObjectProperty(prop) => {
            bindings.expression_reads_style_prop(&prop.value)
        }
        oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
            bindings.expression_reads_style_prop(&spread.argument)
        }
    })
}

/// A bare identifier argument forwards style props when it names a style, props-object or spread binding.
fn identifier_passes_style_props(name: &str, bindings: &PropBindings) -> bool {
    bindings.direct_style_bindings.contains(name)
        || bindings.props_object_bindings.contains(name)
        || bindings.spread_bindings.contains(name)
}

pub fn jsx_attribute_passes_style_props(
    attribute: &JSXAttributeItem<'_>,
    bindings: &PropBindings,
) -> bool {
    match attribute {
        JSXAttributeItem::Attribute(attr) => named_attribute_passes_style_props(attr, bindings),
        JSXAttributeItem::SpreadAttribute(spread) => {
            bindings.expression_reads_style_prop(&spread.argument)
        }
    }
}

/// A named attribute forwards style props through its value. A bare attribute (`<Box color />`)
/// forwards one only when its name is a direct style binding.
fn named_attribute_passes_style_props(attr: &JSXAttribute<'_>, bindings: &PropBindings) -> bool {
    let attr_name = match &attr.name {
        oxc_ast::ast::JSXAttributeName::Identifier(identifier) => identifier.name.as_str(),
        oxc_ast::ast::JSXAttributeName::NamespacedName(_) => return false,
    };
    match &attr.value {
        Some(value) => attribute_value_passes_style_props(value, bindings),
        None => bindings.direct_style_bindings.contains(attr_name),
    }
}

fn attribute_value_passes_style_props(value: &JSXAttributeValue<'_>, bindings: &PropBindings) -> bool {
    match value {
        JSXAttributeValue::ExpressionContainer(container) => match &container.expression {
            JSXExpression::EmptyExpression(_) => false,
            _ => bindings.expression_reads_style_prop(container.expression.to_expression()),
        },
        JSXAttributeValue::StringLiteral(_)
        | JSXAttributeValue::Element(_)
        | JSXAttributeValue::Fragment(_) => false,
    }
}
