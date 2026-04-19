use super::literals::{
    export_default_expression, jsx_attribute_from_item, jsx_child_is_meaningful,
    jsx_name_to_string, slice_span,
};
use crate::atlas::internal::{JsxOccurrence, ModuleInfo};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Argument, Expression, JSXAttributeItem, JSXAttributeValue, JSXChild, JSXExpression, Statement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

pub(super) fn find_jsx_occurrences(module: &ModuleInfo) -> Vec<JsxOccurrence> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&module.path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &module.content, source_type).parse();
    let mut occurrences = Vec::new();

    for statement in parsed.program.body.iter() {
        collect_occurrences_from_statement(statement, &module.content, &mut occurrences);
    }

    occurrences
}

fn collect_occurrences_from_statement(
    statement: &Statement<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match statement {
        Statement::ExpressionStatement(expression) => {
            collect_occurrences_from_expression(&expression.expression, source, occurrences)
        }
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                collect_occurrences_from_expression(argument, source, occurrences);
            }
        }
        Statement::VariableDeclaration(declaration) => {
            for declarator in &declaration.declarations {
                if let Some(init) = &declarator.init {
                    collect_occurrences_from_expression(init, source, occurrences);
                }
            }
        }
        Statement::BlockStatement(block) => {
            for nested in &block.body {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
        }
        Statement::IfStatement(if_statement) => {
            collect_occurrences_from_expression(&if_statement.test, source, occurrences);
            collect_occurrences_from_statement(&if_statement.consequent, source, occurrences);
            if let Some(alternate) = &if_statement.alternate {
                collect_occurrences_from_statement(alternate, source, occurrences);
            }
        }
        Statement::SwitchStatement(switch_statement) => {
            collect_occurrences_from_expression(
                &switch_statement.discriminant,
                source,
                occurrences,
            );
            for case in &switch_statement.cases {
                if let Some(test) = &case.test {
                    collect_occurrences_from_expression(test, source, occurrences);
                }
                for nested in &case.consequent {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::ForStatement(for_statement) => {
            if let Some(init) = &for_statement.init {
                match init {
                    oxc_ast::ast::ForStatementInit::VariableDeclaration(declaration) => {
                        for declarator in &declaration.declarations {
                            if let Some(init) = &declarator.init {
                                collect_occurrences_from_expression(init, source, occurrences);
                            }
                        }
                    }
                    _ => {
                        if let Some(expression) = init.as_expression() {
                            collect_occurrences_from_expression(expression, source, occurrences)
                        }
                    }
                }
            }
            if let Some(test) = &for_statement.test {
                collect_occurrences_from_expression(test, source, occurrences);
            }
            if let Some(update) = &for_statement.update {
                collect_occurrences_from_expression(update, source, occurrences);
            }
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::ForInStatement(for_statement) => {
            collect_occurrences_from_expression(&for_statement.right, source, occurrences);
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::ForOfStatement(for_statement) => {
            collect_occurrences_from_expression(&for_statement.right, source, occurrences);
            collect_occurrences_from_statement(&for_statement.body, source, occurrences);
        }
        Statement::WhileStatement(while_statement) => {
            collect_occurrences_from_expression(&while_statement.test, source, occurrences);
            collect_occurrences_from_statement(&while_statement.body, source, occurrences);
        }
        Statement::DoWhileStatement(while_statement) => {
            collect_occurrences_from_statement(&while_statement.body, source, occurrences);
            collect_occurrences_from_expression(&while_statement.test, source, occurrences);
        }
        Statement::TryStatement(try_statement) => {
            for nested in &try_statement.block.body {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
            if let Some(handler) = &try_statement.handler {
                for nested in &handler.body.body {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
            if let Some(finalizer) = &try_statement.finalizer {
                for nested in &finalizer.body {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::FunctionDeclaration(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            if let Some(declaration) = &export_decl.declaration {
                match declaration {
                    oxc_ast::ast::Declaration::FunctionDeclaration(function) => {
                        if let Some(body) = &function.body {
                            for nested in &body.statements {
                                collect_occurrences_from_statement(nested, source, occurrences);
                            }
                        }
                    }
                    oxc_ast::ast::Declaration::VariableDeclaration(declaration) => {
                        for declarator in &declaration.declarations {
                            if let Some(init) = &declarator.init {
                                collect_occurrences_from_expression(init, source, occurrences);
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Statement::ExportDefaultDeclaration(export_default) => match &export_default.declaration {
            oxc_ast::ast::ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
                if let Some(body) = &function.body {
                    for nested in &body.statements {
                        collect_occurrences_from_statement(nested, source, occurrences);
                    }
                }
            }
            oxc_ast::ast::ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
                for nested in &arrow.body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
            oxc_ast::ast::ExportDefaultDeclarationKind::FunctionExpression(function) => {
                if let Some(body) = &function.body {
                    for nested in &body.statements {
                        collect_occurrences_from_statement(nested, source, occurrences);
                    }
                }
            }
            expression => {
                if let Some(expression) = export_default_expression(expression) {
                    collect_occurrences_from_expression(expression, source, occurrences);
                }
            }
        },
        _ => {}
    }
}

fn collect_occurrences_from_expression(
    expression: &Expression<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match expression {
        Expression::JSXElement(element) => {
            collect_occurrences_from_jsx_element(element, source, occurrences)
        }
        Expression::JSXFragment(fragment) => {
            collect_occurrences_from_jsx_fragment(fragment, source, occurrences)
        }
        Expression::ParenthesizedExpression(parenthesized) => {
            collect_occurrences_from_expression(&parenthesized.expression, source, occurrences)
        }
        Expression::CallExpression(call) => {
            collect_occurrences_from_expression(&call.callee, source, occurrences);
            for argument in &call.arguments {
                collect_occurrences_from_argument(argument, source, occurrences);
            }
        }
        Expression::ConditionalExpression(conditional) => {
            collect_occurrences_from_expression(&conditional.test, source, occurrences);
            collect_occurrences_from_expression(&conditional.consequent, source, occurrences);
            collect_occurrences_from_expression(&conditional.alternate, source, occurrences);
        }
        Expression::LogicalExpression(logical) => {
            collect_occurrences_from_expression(&logical.left, source, occurrences);
            collect_occurrences_from_expression(&logical.right, source, occurrences);
        }
        Expression::BinaryExpression(binary) => {
            collect_occurrences_from_expression(&binary.left, source, occurrences);
            collect_occurrences_from_expression(&binary.right, source, occurrences);
        }
        Expression::AssignmentExpression(assignment) => {
            collect_occurrences_from_expression(&assignment.right, source, occurrences)
        }
        Expression::ArrayExpression(array) => {
            for element in &array.elements {
                match element {
                    oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                        collect_occurrences_from_expression(&spread.argument, source, occurrences)
                    }
                    oxc_ast::ast::ArrayExpressionElement::Elision(_) => {}
                    _ => collect_occurrences_from_expression(
                        element.to_expression(),
                        source,
                        occurrences,
                    ),
                }
            }
        }
        Expression::ObjectExpression(object) => {
            for property in &object.properties {
                match property {
                    oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                        collect_occurrences_from_expression(&property.value, source, occurrences)
                    }
                    oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                        collect_occurrences_from_expression(&spread.argument, source, occurrences)
                    }
                }
            }
        }
        Expression::SequenceExpression(sequence) => {
            for expression in &sequence.expressions {
                collect_occurrences_from_expression(expression, source, occurrences);
            }
        }
        Expression::UnaryExpression(unary) => {
            collect_occurrences_from_expression(&unary.argument, source, occurrences)
        }
        Expression::AwaitExpression(await_expression) => {
            collect_occurrences_from_expression(&await_expression.argument, source, occurrences)
        }
        Expression::ArrowFunctionExpression(arrow) => {
            for nested in &arrow.body.statements {
                collect_occurrences_from_statement(nested, source, occurrences);
            }
        }
        Expression::FunctionExpression(function) => {
            if let Some(body) = &function.body {
                for nested in &body.statements {
                    collect_occurrences_from_statement(nested, source, occurrences);
                }
            }
        }
        Expression::TSAsExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSTypeAssertion(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSNonNullExpression(asserted) => {
            collect_occurrences_from_expression(&asserted.expression, source, occurrences)
        }
        Expression::TSInstantiationExpression(instantiated) => {
            collect_occurrences_from_expression(&instantiated.expression, source, occurrences)
        }
        Expression::ComputedMemberExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences);
            collect_occurrences_from_expression(&member.expression, source, occurrences);
        }
        Expression::StaticMemberExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences)
        }
        Expression::PrivateFieldExpression(member) => {
            collect_occurrences_from_expression(&member.object, source, occurrences)
        }
        _ => {}
    }
}

fn collect_occurrences_from_argument(
    argument: &Argument<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match argument {
        Argument::SpreadElement(spread) => {
            collect_occurrences_from_expression(&spread.argument, source, occurrences)
        }
        _ => collect_occurrences_from_expression(argument.to_expression(), source, occurrences),
    }
}

fn collect_occurrences_from_jsx_attribute_item(
    attribute: &JSXAttributeItem<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match attribute {
        JSXAttributeItem::Attribute(attribute) => {
            if let Some(value) = &attribute.value {
                match value {
                    JSXAttributeValue::ExpressionContainer(container) => {
                        collect_occurrences_from_jsx_expression(
                            &container.expression,
                            source,
                            occurrences,
                        )
                    }
                    JSXAttributeValue::Element(element) => {
                        collect_occurrences_from_jsx_element(element, source, occurrences)
                    }
                    JSXAttributeValue::Fragment(fragment) => {
                        collect_occurrences_from_jsx_fragment(fragment, source, occurrences)
                    }
                    JSXAttributeValue::StringLiteral(_) => {}
                }
            }
        }
        JSXAttributeItem::SpreadAttribute(spread) => {
            collect_occurrences_from_expression(&spread.argument, source, occurrences)
        }
    }
}

fn collect_occurrences_from_jsx_child(
    child: &JSXChild<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match child {
        JSXChild::Text(_) => {}
        JSXChild::Element(element) => {
            collect_occurrences_from_jsx_element(element, source, occurrences)
        }
        JSXChild::Fragment(fragment) => {
            collect_occurrences_from_jsx_fragment(fragment, source, occurrences)
        }
        JSXChild::ExpressionContainer(container) => {
            collect_occurrences_from_jsx_expression(&container.expression, source, occurrences)
        }
        JSXChild::Spread(spread) => {
            collect_occurrences_from_expression(&spread.expression, source, occurrences)
        }
    }
}

fn collect_occurrences_from_jsx_expression(
    expression: &JSXExpression<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    match expression {
        JSXExpression::EmptyExpression(_) => {}
        _ => collect_occurrences_from_expression(expression.to_expression(), source, occurrences),
    }
}

fn collect_occurrences_from_jsx_element(
    element: &oxc_ast::ast::JSXElement<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    occurrences.push(JsxOccurrence {
        tag_name: jsx_name_to_string(&element.opening_element.name),
        snippet: slice_span(source, element.opening_element.span())
            .trim()
            .to_string(),
        attributes: element
            .opening_element
            .attributes
            .iter()
            .filter_map(|attribute| jsx_attribute_from_item(attribute, source))
            .collect(),
        has_children: element.children.iter().any(jsx_child_is_meaningful),
    });

    for attribute in &element.opening_element.attributes {
        collect_occurrences_from_jsx_attribute_item(attribute, source, occurrences);
    }
    for child in &element.children {
        collect_occurrences_from_jsx_child(child, source, occurrences);
    }
}

fn collect_occurrences_from_jsx_fragment(
    fragment: &oxc_ast::ast::JSXFragment<'_>,
    source: &str,
    occurrences: &mut Vec<JsxOccurrence>,
) {
    for child in &fragment.children {
        collect_occurrences_from_jsx_child(child, source, occurrences);
    }
}
