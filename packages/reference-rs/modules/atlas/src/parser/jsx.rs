//! Decides whether a function body returns JSX, the test that makes a function a component candidate.
//! The walk covers statements, expressions and nested function bodies, and stops at the first JSX node
//! it reaches. It takes oxc statement and expression nodes and answers with one bool; node kinds the
//! walk does not model answer false, so JSX hidden behind one of them is not seen.

use crate::internal::wrapped_expression;
use oxc_ast::ast::{
    Argument, ArrayExpressionElement, CallExpression, Expression, ForStatement, ForStatementInit,
    Function, IfStatement, ObjectPropertyKind, Statement, SwitchCase, SwitchStatement,
    TryStatement, VariableDeclarator,
};

pub(super) fn statements_contain_jsx(statements: &oxc_allocator::Vec<'_, Statement<'_>>) -> bool {
    statements.iter().any(statement_contains_jsx)
}

fn statement_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::ExpressionStatement(expression) => expression_contains_jsx(&expression.expression),
        Statement::ReturnStatement(return_statement) => {
            return_statement.argument.as_ref().is_some_and(expression_contains_jsx)
        }
        Statement::VariableDeclaration(declaration) => declarators_contain_jsx(&declaration.declarations),
        Statement::FunctionDeclaration(function) => function_body_contains_jsx(function),
        _ => branch_statement_contains_jsx(statement),
    }
}

fn branch_statement_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::BlockStatement(block) => statements_contain_jsx(&block.body),
        Statement::IfStatement(if_statement) => if_statement_contains_jsx(if_statement),
        Statement::SwitchStatement(switch_statement) => switch_contains_jsx(switch_statement),
        Statement::TryStatement(try_statement) => try_statement_contains_jsx(try_statement),
        _ => loop_statement_contains_jsx(statement),
    }
}

fn if_statement_contains_jsx(if_statement: &IfStatement<'_>) -> bool {
    expression_contains_jsx(&if_statement.test)
        || statement_contains_jsx(&if_statement.consequent)
        || if_statement.alternate.as_ref().is_some_and(statement_contains_jsx)
}

fn switch_contains_jsx(switch_statement: &SwitchStatement<'_>) -> bool {
    expression_contains_jsx(&switch_statement.discriminant)
        || switch_statement.cases.iter().any(switch_case_contains_jsx)
}

fn switch_case_contains_jsx(case: &SwitchCase<'_>) -> bool {
    case.test.as_ref().is_some_and(expression_contains_jsx)
        || case.consequent.iter().any(statement_contains_jsx)
}

fn try_statement_contains_jsx(try_statement: &TryStatement<'_>) -> bool {
    statements_contain_jsx(&try_statement.block.body)
        || try_statement
            .handler
            .as_ref()
            .is_some_and(|handler| statements_contain_jsx(&handler.body.body))
        || try_statement
            .finalizer
            .as_ref()
            .is_some_and(|finalizer| statements_contain_jsx(&finalizer.body))
}

fn loop_statement_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::ForStatement(for_statement) => for_loop_contains_jsx(for_statement),
        Statement::ForInStatement(for_in) => expression_or_body_contains_jsx(&for_in.right, &for_in.body),
        _ => while_or_iteration_contains_jsx(statement),
    }
}

fn while_or_iteration_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::ForOfStatement(for_of) => expression_or_body_contains_jsx(&for_of.right, &for_of.body),
        Statement::WhileStatement(while_statement) => {
            expression_or_body_contains_jsx(&while_statement.test, &while_statement.body)
        }
        Statement::DoWhileStatement(do_while) => expression_or_body_contains_jsx(&do_while.test, &do_while.body),
        _ => false,
    }
}

fn expression_or_body_contains_jsx(expression: &Expression<'_>, body: &Statement<'_>) -> bool {
    expression_contains_jsx(expression) || statement_contains_jsx(body)
}

fn for_loop_contains_jsx(for_statement: &ForStatement<'_>) -> bool {
    for_statement.init.as_ref().is_some_and(for_statement_init_contains_jsx)
        || for_statement.test.as_ref().is_some_and(expression_contains_jsx)
        || for_statement.update.as_ref().is_some_and(expression_contains_jsx)
        || statement_contains_jsx(&for_statement.body)
}

fn for_statement_init_contains_jsx(init: &ForStatementInit<'_>) -> bool {
    match init {
        ForStatementInit::VariableDeclaration(declaration) => {
            declarators_contain_jsx(&declaration.declarations)
        }
        _ => init.as_expression().is_some_and(expression_contains_jsx),
    }
}

fn declarators_contain_jsx(declarators: &[VariableDeclarator<'_>]) -> bool {
    declarators
        .iter()
        .any(|declarator| declarator.init.as_ref().is_some_and(expression_contains_jsx))
}

fn function_body_contains_jsx(function: &Function<'_>) -> bool {
    function
        .body
        .as_ref()
        .is_some_and(|body| statements_contain_jsx(&body.statements))
}

fn expression_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
        Expression::CallExpression(call) => call_contains_jsx(call),
        Expression::ArrowFunctionExpression(_) | Expression::FunctionExpression(_) => {
            function_expression_contains_jsx(expression)
        }
        _ => nested_expression_contains_jsx(expression),
    }
}

fn function_expression_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::ArrowFunctionExpression(arrow) => statements_contain_jsx(&arrow.body.statements),
        Expression::FunctionExpression(function) => function_body_contains_jsx(function),
        _ => false,
    }
}

/// Wrappers pass through to the expression they carry; anything else is an operator or a container.
fn nested_expression_contains_jsx(expression: &Expression<'_>) -> bool {
    if let Expression::TSInstantiationExpression(instantiated) = expression {
        return expression_contains_jsx(&instantiated.expression);
    }
    match wrapped_expression(expression) {
        Some(inner) => expression_contains_jsx(inner),
        None => operator_contains_jsx(expression),
    }
}

fn operator_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::ConditionalExpression(conditional) => [
            &conditional.test,
            &conditional.consequent,
            &conditional.alternate,
        ]
        .into_iter()
        .any(expression_contains_jsx),
        Expression::LogicalExpression(logical) => [&logical.left, &logical.right]
            .into_iter()
            .any(expression_contains_jsx),
        Expression::BinaryExpression(binary) => [&binary.left, &binary.right]
            .into_iter()
            .any(expression_contains_jsx),
        _ => unary_contains_jsx(expression),
    }
}

fn unary_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::AssignmentExpression(assignment) => expression_contains_jsx(&assignment.right),
        Expression::UnaryExpression(unary) => expression_contains_jsx(&unary.argument),
        Expression::AwaitExpression(await_expression) => {
            expression_contains_jsx(&await_expression.argument)
        }
        _ => container_contains_jsx(expression),
    }
}

fn container_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::ArrayExpression(array) => array.elements.iter().any(array_element_contains_jsx),
        Expression::ObjectExpression(object) => object.properties.iter().any(object_property_contains_jsx),
        Expression::SequenceExpression(sequence) => sequence.expressions.iter().any(expression_contains_jsx),
        Expression::ComputedMemberExpression(_)
        | Expression::StaticMemberExpression(_)
        | Expression::PrivateFieldExpression(_) => member_contains_jsx(expression),
        _ => false,
    }
}

fn member_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::ComputedMemberExpression(member) => {
            expression_contains_jsx(&member.object) || expression_contains_jsx(&member.expression)
        }
        Expression::StaticMemberExpression(member) => expression_contains_jsx(&member.object),
        Expression::PrivateFieldExpression(member) => expression_contains_jsx(&member.object),
        _ => false,
    }
}

fn call_contains_jsx(call: &CallExpression<'_>) -> bool {
    expression_contains_jsx(&call.callee) || call.arguments.iter().any(argument_contains_jsx)
}

fn array_element_contains_jsx(element: &ArrayExpressionElement<'_>) -> bool {
    match element {
        ArrayExpressionElement::SpreadElement(spread) => expression_contains_jsx(&spread.argument),
        ArrayExpressionElement::Elision(_) => false,
        _ => expression_contains_jsx(element.to_expression()),
    }
}

fn object_property_contains_jsx(property: &ObjectPropertyKind<'_>) -> bool {
    match property {
        ObjectPropertyKind::ObjectProperty(property) => expression_contains_jsx(&property.value),
        ObjectPropertyKind::SpreadProperty(spread) => expression_contains_jsx(&spread.argument),
    }
}

fn argument_contains_jsx(argument: &Argument<'_>) -> bool {
    match argument {
        Argument::SpreadElement(spread) => expression_contains_jsx(&spread.argument),
        _ => expression_contains_jsx(argument.to_expression()),
    }
}
