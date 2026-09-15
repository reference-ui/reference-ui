//! JSX traversal for collecting forwarding edges.

use super::expr::collect_edges_from_expression;
use super::WalkContext;
use crate::analysis::model::{ComponentEdge, EdgeTarget, PropBindings, TraceImport};
use crate::analysis::util::{is_component_name, jsx_name_to_string};
use oxc_ast::ast::{
    Argument, Expression, JSXAttributeItem, JSXAttributeValue, JSXChild, JSXElementName,
    JSXExpression,
};
use std::collections::{BTreeSet, HashMap};

pub fn collect_edges_from_jsx_child(child: &JSXChild<'_>, ctx: &mut WalkContext<'_>) {
    match child {
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => collect_edges_from_jsx_element(element, ctx),
        JSXChild::Fragment(fragment) => {
            for nested in &fragment.children {
                collect_edges_from_jsx_child(nested, ctx);
            }
        }
        JSXChild::ExpressionContainer(container) => {
            collect_edges_from_jsx_expression(&container.expression, ctx)
        }
        JSXChild::Spread(spread) => collect_edges_from_expression(&spread.expression, ctx),
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
    match attribute {
        JSXAttributeItem::Attribute(attr) => {
            if let Some(value) = &attr.value {
                match value {
                    JSXAttributeValue::ExpressionContainer(container) => {
                        collect_edges_from_jsx_expression(&container.expression, ctx)
                    }
                    JSXAttributeValue::Element(el) => collect_edges_from_jsx_element(el, ctx),
                    JSXAttributeValue::Fragment(frag) => {
                        for child in &frag.children {
                            collect_edges_from_jsx_child(child, ctx);
                        }
                    }
                    JSXAttributeValue::StringLiteral(_) => {}
                }
            }
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            collect_edges_from_expression(&spread.argument, ctx)
        }
    }
}

pub fn jsx_target(
    name: &JSXElementName<'_>,
    imports: &HashMap<String, TraceImport>,
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

fn handle_namespace_target(
    namespace: &str,
    member: &str,
    imports: &HashMap<String, TraceImport>,
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
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    match argument {
        Argument::Identifier(identifier) => {
            identifier_target(identifier.name.as_str(), imports, primitive_names)
        }
        _ => None,
    }
}

fn identifier_target(
    name: &str,
    imports: &HashMap<String, TraceImport>,
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
        Argument::ObjectExpression(object) => {
            object.properties.iter().any(|property| match property {
                oxc_ast::ast::ObjectPropertyKind::ObjectProperty(prop) => {
                    bindings.expression_reads_style_prop(&prop.value)
                }
                oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                    bindings.expression_reads_style_prop(&spread.argument)
                }
            })
        }
        Argument::Identifier(identifier) => {
            bindings
                .direct_style_bindings
                .contains(identifier.name.as_str())
                || bindings
                    .props_object_bindings
                    .contains(identifier.name.as_str())
                || bindings.spread_bindings.contains(identifier.name.as_str())
        }
        Argument::SpreadElement(spread) => bindings.expression_reads_style_prop(&spread.argument),
        _ => bindings.expression_reads_style_prop(argument.to_expression()),
    }
}

pub fn jsx_attribute_passes_style_props(
    attribute: &JSXAttributeItem<'_>,
    bindings: &PropBindings,
) -> bool {
    match attribute {
        JSXAttributeItem::Attribute(attr) => {
            let attr_name = match &attr.name {
                oxc_ast::ast::JSXAttributeName::Identifier(identifier) => identifier.name.as_str(),
                oxc_ast::ast::JSXAttributeName::NamespacedName(_) => return false,
            };

            if let Some(value) = &attr.value {
                match value {
                    JSXAttributeValue::ExpressionContainer(container) => {
                        match &container.expression {
                            JSXExpression::EmptyExpression(_) => false,
                            _ => bindings
                                .expression_reads_style_prop(container.expression.to_expression()),
                        }
                    }
                    JSXAttributeValue::StringLiteral(_) => false,
                    JSXAttributeValue::Element(_) | JSXAttributeValue::Fragment(_) => false,
                }
            } else {
                bindings.direct_style_bindings.contains(attr_name)
            }
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            bindings.expression_reads_style_prop(&spread.argument)
        }
    }
}
