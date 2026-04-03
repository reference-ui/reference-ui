use oxc_ast::ast::{Argument, Expression, Statement};

pub(super) fn statements_contain_jsx(statements: &oxc_allocator::Vec<'_, Statement<'_>>) -> bool {
    statements.iter().any(statement_contains_jsx)
}

fn statement_contains_jsx(statement: &Statement<'_>) -> bool {
    match statement {
        Statement::ExpressionStatement(expression) => expression_contains_jsx(&expression.expression),
        Statement::ReturnStatement(return_statement) => return_statement
            .argument
            .as_ref()
            .map(expression_contains_jsx)
            .unwrap_or(false),
        Statement::VariableDeclaration(declaration) => declaration.declarations.iter().any(|declarator| {
            declarator
                .init
                .as_ref()
                .map(expression_contains_jsx)
                .unwrap_or(false)
        }),
        Statement::BlockStatement(block) => block.body.iter().any(statement_contains_jsx),
        Statement::IfStatement(if_statement) => {
            expression_contains_jsx(&if_statement.test)
                || statement_contains_jsx(&if_statement.consequent)
                || if_statement
                    .alternate
                    .as_ref()
                    .map(statement_contains_jsx)
                    .unwrap_or(false)
        }
        Statement::SwitchStatement(switch_statement) => {
            expression_contains_jsx(&switch_statement.discriminant)
                || switch_statement.cases.iter().any(|case| {
                    case.test.as_ref().map(expression_contains_jsx).unwrap_or(false)
                        || case.consequent.iter().any(statement_contains_jsx)
                })
        }
        Statement::ForStatement(for_statement) => {
            for_statement
                .init
                .as_ref()
                .map(for_statement_init_contains_jsx)
                .unwrap_or(false)
                || for_statement
                    .test
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
                || for_statement
                    .update
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
                || statement_contains_jsx(&for_statement.body)
        }
        Statement::ForInStatement(for_statement) => {
            expression_contains_jsx(&for_statement.right) || statement_contains_jsx(&for_statement.body)
        }
        Statement::ForOfStatement(for_statement) => {
            expression_contains_jsx(&for_statement.right) || statement_contains_jsx(&for_statement.body)
        }
        Statement::WhileStatement(while_statement) => {
            expression_contains_jsx(&while_statement.test) || statement_contains_jsx(&while_statement.body)
        }
        Statement::DoWhileStatement(while_statement) => {
            statement_contains_jsx(&while_statement.body) || expression_contains_jsx(&while_statement.test)
        }
        Statement::TryStatement(try_statement) => {
            try_statement.block.body.iter().any(statement_contains_jsx)
                || try_statement
                    .handler
                    .as_ref()
                    .map(|handler| handler.body.body.iter().any(statement_contains_jsx))
                    .unwrap_or(false)
                || try_statement
                    .finalizer
                    .as_ref()
                    .map(|finalizer| finalizer.body.iter().any(statement_contains_jsx))
                    .unwrap_or(false)
        }
        Statement::FunctionDeclaration(function) => function
            .body
            .as_ref()
            .map(|body| statements_contain_jsx(&body.statements))
            .unwrap_or(false),
        _ => false,
    }
}

fn for_statement_init_contains_jsx(init: &oxc_ast::ast::ForStatementInit<'_>) -> bool {
    match init {
        oxc_ast::ast::ForStatementInit::VariableDeclaration(declaration) => {
            declaration.declarations.iter().any(|declarator| {
                declarator
                    .init
                    .as_ref()
                    .map(expression_contains_jsx)
                    .unwrap_or(false)
            })
        }
        _ => init
            .as_expression()
            .map(expression_contains_jsx)
            .unwrap_or(false),
    }
}

fn expression_contains_jsx(expression: &Expression<'_>) -> bool {
    match expression {
        Expression::JSXElement(_) | Expression::JSXFragment(_) => true,
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_contains_jsx(&parenthesized.expression)
        }
        Expression::CallExpression(call) => {
            expression_contains_jsx(&call.callee) || call.arguments.iter().any(argument_contains_jsx)
        }
        Expression::ConditionalExpression(conditional) => {
            expression_contains_jsx(&conditional.test)
                || expression_contains_jsx(&conditional.consequent)
                || expression_contains_jsx(&conditional.alternate)
        }
        Expression::LogicalExpression(logical) => {
            expression_contains_jsx(&logical.left) || expression_contains_jsx(&logical.right)
        }
        Expression::BinaryExpression(binary) => {
            expression_contains_jsx(&binary.left) || expression_contains_jsx(&binary.right)
        }
        Expression::AssignmentExpression(assignment) => expression_contains_jsx(&assignment.right),
        Expression::ArrayExpression(array) => array.elements.iter().any(|element| match element {
            oxc_ast::ast::ArrayExpressionElement::SpreadElement(spread) => {
                expression_contains_jsx(&spread.argument)
            }
            oxc_ast::ast::ArrayExpressionElement::Elision(_) => false,
            _ => expression_contains_jsx(element.to_expression()),
        }),
        Expression::ObjectExpression(object) => object.properties.iter().any(|property| match property {
            oxc_ast::ast::ObjectPropertyKind::ObjectProperty(property) => {
                expression_contains_jsx(&property.value)
            }
            oxc_ast::ast::ObjectPropertyKind::SpreadProperty(spread) => {
                expression_contains_jsx(&spread.argument)
            }
        }),
        Expression::SequenceExpression(sequence) => {
            sequence.expressions.iter().any(expression_contains_jsx)
        }
        Expression::UnaryExpression(unary) => expression_contains_jsx(&unary.argument),
        Expression::AwaitExpression(await_expression) => expression_contains_jsx(&await_expression.argument),
        Expression::ArrowFunctionExpression(arrow) => statements_contain_jsx(&arrow.body.statements),
        Expression::FunctionExpression(function) => function
            .body
            .as_ref()
            .map(|body| statements_contain_jsx(&body.statements))
            .unwrap_or(false),
        Expression::TSAsExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSSatisfiesExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSTypeAssertion(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSNonNullExpression(asserted) => expression_contains_jsx(&asserted.expression),
        Expression::TSInstantiationExpression(instantiated) => {
            expression_contains_jsx(&instantiated.expression)
        }
        Expression::ComputedMemberExpression(member) => {
            expression_contains_jsx(&member.object) || expression_contains_jsx(&member.expression)
        }
        Expression::StaticMemberExpression(member) => expression_contains_jsx(&member.object),
        Expression::PrivateFieldExpression(member) => expression_contains_jsx(&member.object),
        _ => false,
    }
}

fn argument_contains_jsx(argument: &Argument<'_>) -> bool {
    match argument {
        Argument::SpreadElement(spread) => expression_contains_jsx(&spread.argument),
        _ => expression_contains_jsx(argument.to_expression()),
    }
}