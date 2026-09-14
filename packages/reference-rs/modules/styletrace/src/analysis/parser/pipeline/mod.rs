//! Pipeline tracing for style usage.

pub mod expr;
pub mod jsx;
pub mod util;

use std::collections::{BTreeSet, HashMap};
use oxc_ast::ast::Statement;
use crate::analysis::model::{PropBindings, TraceImport};
use crate::analysis::util::slice_span;
use oxc_span::GetSpan;

#[derive(Default)]
pub struct PipelineState {
    pub style_signals: BTreeSet<String>,
    pub class_name_bindings: BTreeSet<String>,
    pub uses_style_pipeline: bool,
}

pub struct PipelineContext<'a, 'b> {
    pub source: &'a str,
    pub imports: &'a HashMap<String, TraceImport>,
    pub bindings: &'a PropBindings,
    pub state: &'b mut PipelineState,
}

pub fn component_uses_style_pipeline(
    body_statements: &oxc_allocator::Vec<'_, Statement<'_>>,
    source: &str,
    imports: &HashMap<String, TraceImport>,
    bindings: &PropBindings,
) -> bool {
    let mut state = PipelineState {
        style_signals: bindings.direct_style_bindings.iter()
            .chain(bindings.props_object_bindings.iter())
            .chain(bindings.spread_bindings.iter())
            .cloned()
            .collect(),
        ..Default::default()
    };
    let mut ctx = PipelineContext { source, imports, bindings, state: &mut state };
    for statement in body_statements {
        walk_pipeline_statement(statement, &mut ctx);
        if ctx.state.uses_style_pipeline { return true; }
    }
    ctx.state.uses_style_pipeline
}

pub fn walk_pipeline_statement(statement: &Statement<'_>, ctx: &mut PipelineContext) {
    match statement {
        Statement::ExpressionStatement(expr) => expr::walk_pipeline_expression(&expr.expression, ctx),
        Statement::ReturnStatement(ret) => walk_return(ret, ctx),
        Statement::VariableDeclaration(decl) => walk_var_decl(decl, ctx),
        Statement::BlockStatement(block) => walk_block(block, ctx),
        Statement::IfStatement(if_stmt) => walk_if(if_stmt, ctx),
        Statement::SwitchStatement(switch_stmt) => walk_switch(switch_stmt, ctx),
        _ => {}
    }
}

fn walk_return(ret: &oxc_ast::ast::ReturnStatement<'_>, ctx: &mut PipelineContext) {
    if let Some(argument) = &ret.argument {
        expr::walk_pipeline_expression(argument, ctx);
    }
}

fn walk_var_decl(decl: &oxc_ast::ast::VariableDeclaration<'_>, ctx: &mut PipelineContext) {
    for declarator in &decl.declarations {
        if let Some(init) = &declarator.init {
            expr::walk_pipeline_expression(init, ctx);
            util::record_pipeline_binding(slice_span(ctx.source, declarator.id.span()).trim(), init, ctx);
        }
    }
}

fn walk_block(block: &oxc_ast::ast::BlockStatement<'_>, ctx: &mut PipelineContext) {
    for nested in &block.body {
        walk_pipeline_statement(nested, ctx);
    }
}

fn walk_if(if_stmt: &oxc_ast::ast::IfStatement<'_>, ctx: &mut PipelineContext) {
    expr::walk_pipeline_expression(&if_stmt.test, ctx);
    walk_pipeline_statement(&if_stmt.consequent, ctx);
    if let Some(alternate) = &if_stmt.alternate {
        walk_pipeline_statement(alternate, ctx);
    }
}

fn walk_switch(switch_stmt: &oxc_ast::ast::SwitchStatement<'_>, ctx: &mut PipelineContext) {
    expr::walk_pipeline_expression(&switch_stmt.discriminant, ctx);
    for case in &switch_stmt.cases {
        if let Some(test) = &case.test {
            expr::walk_pipeline_expression(test, ctx);
        }
        for nested in &case.consequent {
            walk_pipeline_statement(nested, ctx);
        }
    }
}
