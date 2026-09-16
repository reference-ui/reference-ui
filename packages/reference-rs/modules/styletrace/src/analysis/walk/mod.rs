//! Implements AST traversal helpers for collecting JSX forwarding edges.
//! Evaluates tree nodes to identify where props are spread or passed.
//! Connects properties from parents to children in the component graph.

pub mod expr;
pub mod jsx;

use crate::analysis::model::{ComponentEdge, PropBindings, TraceImport};
use oxc_ast::ast::{Declaration, Statement};
use std::collections::{BTreeSet, HashMap};

pub struct WalkContext<'a> {
    pub imports: &'a HashMap<String, TraceImport>,
    pub primitive_names: &'a BTreeSet<String>,
    pub bindings: &'a PropBindings,
    pub edges: &'a mut Vec<ComponentEdge>,
}

pub fn collect_edges_from_statement(statement: &Statement<'_>, ctx: &mut WalkContext<'_>) {
    match statement {
        Statement::ExpressionStatement(expression) => {
            expr::collect_edges_from_expression(&expression.expression, ctx)
        }
        Statement::ReturnStatement(return_statement) => {
            if let Some(argument) = &return_statement.argument {
                expr::collect_edges_from_expression(argument, ctx);
            }
        }
        Statement::VariableDeclaration(declaration) => walk_variable_declaration(declaration, ctx),
        Statement::BlockStatement(block) => walk_block_statement(block, ctx),
        Statement::IfStatement(if_statement) => walk_if_statement(if_statement, ctx),
        Statement::SwitchStatement(switch_statement) => {
            walk_switch_statement(switch_statement, ctx)
        }
        Statement::FunctionDeclaration(function) => walk_function_declaration(function, ctx),
        Statement::ExportNamedDeclaration(export_decl) => {
            walk_export_named_declaration(export_decl, ctx)
        }
        _ => {}
    }
}

fn walk_variable_declaration(
    declaration: &oxc_ast::ast::VariableDeclaration<'_>,
    ctx: &mut WalkContext<'_>,
) {
    for declarator in &declaration.declarations {
        if let Some(init) = &declarator.init {
            expr::collect_edges_from_expression(init, ctx);
        }
    }
}

fn walk_block_statement(block: &oxc_ast::ast::BlockStatement<'_>, ctx: &mut WalkContext<'_>) {
    for nested in &block.body {
        collect_edges_from_statement(nested, ctx);
    }
}

fn walk_if_statement(if_statement: &oxc_ast::ast::IfStatement<'_>, ctx: &mut WalkContext<'_>) {
    expr::collect_edges_from_expression(&if_statement.test, ctx);
    collect_edges_from_statement(&if_statement.consequent, ctx);
    if let Some(alternate) = &if_statement.alternate {
        collect_edges_from_statement(alternate, ctx);
    }
}

fn walk_switch_statement(
    switch_statement: &oxc_ast::ast::SwitchStatement<'_>,
    ctx: &mut WalkContext<'_>,
) {
    expr::collect_edges_from_expression(&switch_statement.discriminant, ctx);
    for case in &switch_statement.cases {
        if let Some(test) = &case.test {
            expr::collect_edges_from_expression(test, ctx);
        }
        for nested in &case.consequent {
            collect_edges_from_statement(nested, ctx);
        }
    }
}

fn walk_function_declaration(function: &oxc_ast::ast::Function<'_>, ctx: &mut WalkContext<'_>) {
    if let Some(body) = &function.body {
        for nested in &body.statements {
            collect_edges_from_statement(nested, ctx);
        }
    }
}

fn walk_export_named_declaration(
    export_decl: &oxc_ast::ast::ExportNamedDeclaration<'_>,
    ctx: &mut WalkContext<'_>,
) {
    if let Some(declaration) = &export_decl.declaration {
        match declaration {
            Declaration::FunctionDeclaration(function) => walk_function_declaration(function, ctx),
            Declaration::VariableDeclaration(declaration) => {
                walk_variable_declaration(declaration, ctx)
            }
            _ => {}
        }
    }
}
