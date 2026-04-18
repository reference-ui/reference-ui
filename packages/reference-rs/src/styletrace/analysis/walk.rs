//! AST traversal helpers for collecting JSX forwarding edges.

use std::collections::{BTreeSet, HashMap};

use oxc_ast::ast::{
    Argument, Declaration, Expression, JSXAttributeItem, JSXAttributeValue, JSXChild,
    JSXElementName, JSXExpression, Statement,
};

use super::model::{ComponentEdge, EdgeTarget, PropBindings, TraceImport};
use super::util::{is_component_name, jsx_name_to_string};

pub(super) fn collect_edges_from_statement(
    statement: &Statement<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    match statement {
        Statement::ExpressionStatement(expression) => collect_edges_from_expression(
            &expression.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                collect_edges_from_expression(
                    argument,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Statement::VariableDeclaration(declaration) => {
            for declarator in &declaration.declarations {
                if let Some(init) = &declarator.init {
                    collect_edges_from_expression(
                        init,
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    );
                }
            }
        }
        Statement::BlockStatement(block) => {
            for nested in &block.body {
                collect_edges_from_statement(
                    nested,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Statement::IfStatement(if_statement) => {
            collect_edges_from_expression(
                &if_statement.test,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            collect_edges_from_statement(
                &if_statement.consequent,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            if let Some(alternate) = &if_statement.alternate {
                collect_edges_from_statement(
                    alternate,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Statement::SwitchStatement(switch_statement) => {
            collect_edges_from_expression(
                &switch_statement.discriminant,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            for case in &switch_statement.cases {
                if let Some(test) = &case.test {
                    collect_edges_from_expression(
                        test,
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    );
                }
                for nested in &case.consequent {
                    collect_edges_from_statement(
                        nested,
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    );
                }
            }
        }
        Statement::FunctionDeclaration(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_edges_from_statement(
                        nested,
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    );
                }
            }
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            if let Some(declaration) = &export_decl.declaration {
                match declaration {
                    Declaration::FunctionDeclaration(function) => {
                        if let Some(body) = &function.body {
                            for nested in &body.statements {
                                collect_edges_from_statement(
                                    nested,
                                    source,
                                    imports,
                                    primitive_names,
                                    bindings,
                                    edges,
                                );
                            }
                        }
                    }
                    Declaration::VariableDeclaration(declaration) => {
                        for declarator in &declaration.declarations {
                            if let Some(init) = &declarator.init {
                                collect_edges_from_expression(
                                    init,
                                    source,
                                    imports,
                                    primitive_names,
                                    bindings,
                                    edges,
                                );
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        _ => {}
    }
}

fn collect_edges_from_expression(
    expression: &Expression<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    match expression {
        Expression::JSXElement(element) => collect_edges_from_jsx_element(
            element,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::JSXFragment(fragment) => {
            for child in &fragment.children {
                collect_edges_from_jsx_child(
                    child,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Expression::ParenthesizedExpression(parenthesized) => collect_edges_from_expression(
            &parenthesized.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::CallExpression(call) => {
            collect_edges_from_expression(
                &call.callee,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            for argument in &call.arguments {
                collect_edges_from_argument(
                    argument,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Expression::ConditionalExpression(conditional) => {
            collect_edges_from_expression(
                &conditional.test,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            collect_edges_from_expression(
                &conditional.consequent,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            collect_edges_from_expression(
                &conditional.alternate,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
        }
        Expression::LogicalExpression(logical) => {
            collect_edges_from_expression(
                &logical.left,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            collect_edges_from_expression(
                &logical.right,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
        }
        Expression::ArrayExpression(array) => {
            for element in &array.elements {
                match element {
                    oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                        collect_edges_from_expression(
                            &spread.argument,
                            source,
                            imports,
                            primitive_names,
                            bindings,
                            edges,
                        )
                    }
                    oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
                    _ => collect_edges_from_expression(
                        element.to_expression(),
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    ),
                }
            }
        }
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                match property {
                    oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                        collect_edges_from_expression(
                            &property.value,
                            source,
                            imports,
                            primitive_names,
                            bindings,
                            edges,
                        )
                    }
                    oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                        collect_edges_from_expression(
                            &spread.argument,
                            source,
                            imports,
                            primitive_names,
                            bindings,
                            edges,
                        )
                    }
                }
            }
        }
        Expression::ArrowFunctionExpression(arrow) => {
            for nested in &arrow.body.statements {
                collect_edges_from_statement(
                    nested,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        Expression::FunctionExpression(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_edges_from_statement(
                        nested,
                        source,
                        imports,
                        primitive_names,
                        bindings,
                        edges,
                    );
                }
            }
        }
        Expression::TSAsExpression(asserted) => collect_edges_from_expression(
            &asserted.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::TSSatisfiesExpression(asserted) => collect_edges_from_expression(
            &asserted.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::TSTypeAssertion(asserted) => collect_edges_from_expression(
            &asserted.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::TSNonNullExpression(asserted) => collect_edges_from_expression(
            &asserted.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::TSInstantiationExpression(instantiated) => collect_edges_from_expression(
            &instantiated.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        Expression::ComputedMemberExpression(member) => {
            collect_edges_from_expression(
                &member.object,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
            collect_edges_from_expression(
                &member.expression,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            );
        }
        Expression::StaticMemberExpression(member) => collect_edges_from_expression(
            &member.object,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        _ => {}
    }
}

fn collect_edges_from_argument(
    argument: &Argument<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    match argument {
        Argument::SpreadElement(spread) => collect_edges_from_expression(
            &spread.argument,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        _ => collect_edges_from_expression(
            argument.to_expression(),
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
    }
}

fn collect_edges_from_jsx_child(
    child: &JSXChild<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    match child {
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => collect_edges_from_jsx_element(
            element,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        JSXChild::Fragment(fragment) => {
            for nested in &fragment.children {
                collect_edges_from_jsx_child(
                    nested,
                    source,
                    imports,
                    primitive_names,
                    bindings,
                    edges,
                );
            }
        }
        JSXChild::ExpressionContainer(container) => collect_edges_from_jsx_expression(
            &container.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
        JSXChild::Spread(spread) => collect_edges_from_expression(
            &spread.expression,
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
    }
}

fn collect_edges_from_jsx_expression(
    expression: &JSXExpression<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    match expression {
        JSXExpression::EmptyExpression(_) => {}
        _ => collect_edges_from_expression(
            expression.to_expression(),
            source,
            imports,
            primitive_names,
            bindings,
            edges,
        ),
    }
}

fn collect_edges_from_jsx_element(
    element: &oxc_ast::ast::JSXElement<'_>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
    bindings: &PropBindings,
    edges: &mut Vec<ComponentEdge>,
) {
    if let Some(target) = jsx_target(&element.opening_element.name, imports, primitive_names) {
        let passes_style_props = element
            .opening_element
            .attributes
            .iter()
            .any(|attribute| jsx_attribute_passes_style_props(attribute, bindings));

        if passes_style_props {
            edges.push(ComponentEdge { target });
        }
    }

    for attribute in &element.opening_element.attributes {
        match attribute {
            JSXAttributeItem::Attribute(attribute) => {
                if let Some(value) = &attribute.value {
                    match value {
                        JSXAttributeValue::ExpressionContainer(container) => {
                            collect_edges_from_jsx_expression(
                                &container.expression,
                                source,
                                imports,
                                primitive_names,
                                bindings,
                                edges,
                            )
                        }
                        JSXAttributeValue::Element(element) => collect_edges_from_jsx_element(
                            element,
                            source,
                            imports,
                            primitive_names,
                            bindings,
                            edges,
                        ),
                        JSXAttributeValue::Fragment(fragment) => {
                            for child in &fragment.children {
                                collect_edges_from_jsx_child(
                                    child,
                                    source,
                                    imports,
                                    primitive_names,
                                    bindings,
                                    edges,
                                );
                            }
                        }
                        JSXAttributeValue::StringLiteral(_) => {}
                    }
                }
            }
            JSXAttributeItem::SpreadAttribute(spread) => collect_edges_from_expression(
                &spread.argument,
                source,
                imports,
                primitive_names,
                bindings,
                edges,
            ),
        }
    }

    for child in &element.children {
        collect_edges_from_jsx_child(child, source, imports, primitive_names, bindings, edges);
    }
}

fn jsx_target(
    name: &JSXElementName<'_>,
    imports: &HashMap<String, TraceImport>,
    primitive_names: &BTreeSet<String>,
) -> Option<EdgeTarget> {
    let name = jsx_name_to_string(name);
    if !is_component_name(&name) {
        return None;
    }

    if let Some((namespace, member)) = name.split_once('.') {
        if let Some(import_binding) = imports.get(namespace) {
            if import_binding.is_namespace {
                if import_binding.source == "@reference-ui/react"
                    && primitive_names.contains(member)
                {
                    return Some(EdgeTarget::Primitive(member.to_string()));
                }

                return Some(EdgeTarget::Imported {
                    source: import_binding.source.clone(),
                    imported_name: member.to_string(),
                });
            }
        }
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

fn jsx_attribute_passes_style_props(
    attribute: &JSXAttributeItem<'_>,
    bindings: &PropBindings,
) -> bool {
    match attribute {
        JSXAttributeItem::Attribute(attribute) => {
            let attr_name = match &attribute.name {
                oxc_ast::ast::JSXAttributeName::Identifier(identifier) => identifier.name.as_str(),
                oxc_ast::ast::JSXAttributeName::NamespacedName(_) => return false,
            };

            if let Some(value) = &attribute.value {
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
