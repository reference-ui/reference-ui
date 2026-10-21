//! Recursive collector for style expressions.
//!
//! Traverses AST expressions to extract literal style values into `Want` declarations.
//! Open ternaries scoop both branches and open logicals scoop both operands,
//! preserving responsive array ordering and condition scopes; folded tests
//! and all-literal short-circuits compile only the live value with an info
//! naming the dead arm. Nothing here evaluates runtime JavaScript.

pub(crate) mod branch;
pub(crate) mod call;
pub(crate) mod leaf;
pub(crate) mod member;
mod session;
pub(crate) mod util;

pub(crate) use branch::is_guard_expression;
pub(crate) use util::{block_value_kind, is_silent_block_value, unwrap_wrapper_target};

use oxc_ast::ast::Expression;
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{Backing, Want};
use crate::diagnostics::{
    Diagnostic, DiagnosticCode, DiagnosticsSession, ExtractDetail, LineIndex,
};
use crate::extract::harvest::Sink;
use crate::extract::scope::Scoped;
use base_system::BreakpointScale;

/// Context for traversing an expression tree to extract style leaf values.
pub struct ExpressionWalk<'a> {
    pub prop: &'a str,
    pub origin: Option<&'a str>,
    pub important: bool,
    /// The systems the leaf wants lower under.
    pub backing: &'a Backing,
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub line_index: Option<&'a LineIndex>,
    pub scopes: Scoped<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub sinks: &'a mut Vec<Sink>,
    pub session: &'a mut DiagnosticsSession,
}

/// One refused dynamic value position: structured detail policy renders
/// plus the harvest sink it records. Bundled so the hook stays under the
/// arg cap. Callers pass data, never sentences.
pub struct DynamicRefusal<'w> {
    pub span: Span,
    pub code: DiagnosticCode,
    pub detail: ExtractDetail,
    pub when: &'w SmallVec<[Box<str>; 2]>,
}


/// Recursively collect style leaves from an expression into Wants.
pub fn walk_expression(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // bg={on ? 'n300' : 'n100'}  /  mt="2r"  /  mt={['1r', '2r']}
    if walk_literal(ctx, expr, when) {
        return;
    }
    if walk_wrapper(ctx, expr, when) {
        return;
    }
    if branch::walk_branching(ctx, expr, when) {
        return;
    }
    walk_fallback(ctx, expr, when);
}

fn walk_literal(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::StringLiteral(lit) => {
            // '2r' / "blue.600"
            push_string_want(ctx, lit, when);
            true
        }
        Expression::NumericLiteral(lit) => {
            // opacity={0.5}
            push_number_want(ctx, lit, when);
            true
        }
        Expression::BooleanLiteral(lit) => {
            // border={false}
            push_bool_want(ctx, lit, when);
            true
        }
        Expression::NullLiteral(_) => {
            // bg={on ? 'n300' : null}  — omit
            true
        }
        _ => false,
    }
}

fn walk_wrapper(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    let Some(target) = util::unwrap_wrapper_target(expr) else {
        return false;
    };
    walk_expression(ctx, target, when);
    true
}

fn walk_fallback(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::TemplateLiteral(lit) => {
            // `2r`  /  `2${n}r`
            extract_template_literal(ctx, lit, when);
        }
        Expression::Identifier(ident) => {
            // mt={space}  where  const space = '2r'
            leaf::handle_identifier_fallback(ctx, ident.name.as_str(), when, ident.span);
        }
        _ => walk_access_fallback(ctx, expr, when),
    }
}

/// Member, element, and chain reads: each resolves through its binding or stays dynamic.
fn walk_access_fallback(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::StaticMemberExpression(mem) => {
            // color={theme.primary}  where  const theme = { primary: 'n300' }
            member::handle_static_member(ctx, mem, when);
        }
        Expression::ComputedMemberExpression(mem) => {
            // color={colors['red']}  /  margin={sizes[1]}
            member::handle_computed_member(ctx, mem, when);
        }
        Expression::ChainExpression(chain) => {
            // margin={sizes?.[k]}  — computed chains fold; member chains stay dynamic (SITE-34)
            member::handle_chain(ctx, chain, when);
        }
        _ => walk_compound_fallback(ctx, expr, when),
    }
}

/// Operator and call shapes; anything else warns as dynamic and keeps its siblings.
fn walk_compound_fallback(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match expr {
        Expression::UnaryExpression(unary) => {
            // left={-2}  /  void 0
            leaf::handle_unary(ctx, unary, when);
        }
        Expression::BinaryExpression(binary) => {
            // width={1 + 'px'}  /  order={2 * 3}  /  zIndex={n > 1}
            leaf::handle_binary(ctx, binary, when);
        }
        Expression::CallExpression(call) => {
            // color={token('colors.red.500')}  — the token surface folds it
            call::handle_token_call(ctx, call, when);
        }
        _ => {
            // width={props.w}  — dynamic, warn, keep siblings
            call::warn_dynamic_expression(ctx, expr.span(), when);
        }
    }
}

#[cfg(test)]
mod tests;
