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
pub(crate) mod util;

pub(crate) use branch::is_guard_expression;
pub(crate) use util::{block_value_kind, is_silent_block_value, unwrap_wrapper_target};

use oxc_ast::ast::Expression;
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode};
use crate::extract::harvest::{is_sink_code, Sink, SinkSite};
use crate::extract::scope::Scoped;
use base_system::BreakpointScale;

/// Context for traversing an expression tree to extract style leaf values.
pub struct ExpressionWalk<'a> {
    pub prop: &'a str,
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub scopes: Scoped<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub sinks: &'a mut Vec<Sink>,
}

/// One refused dynamic value position: the diagnostic to emit plus the
/// harvest sink it records. Bundled so the hook stays under the arg cap.
pub struct DynamicRefusal<'w> {
    pub span: Span,
    pub code: DiagnosticCode,
    pub message: String,
    pub when: &'w SmallVec<[Box<str>; 2]>,
}

impl<'a> ExpressionWalk<'a> {
    /// Return the breakpoint condition name for a responsive array index.
    pub fn breakpoint_for_index(&self, index: usize) -> Option<&str> {
        // mt={['1r', '2r', '4r']}  →  0=base, 1=sm, 2=md
        self.breakpoints.breakpoint_for_index(index)
    }

    /// Push an extracted Want to the collection.
    pub fn push_want(
        &mut self,
        value: AtomValue,
        when: SmallVec<[Box<str>; 2]>,
        important: bool,
        span: Option<Span>,
    ) {
        let mut want = Want::new(self.prop, value)
            .with_when(when)
            .with_important(self.important || important)
            .with_origin(self.origin);
        want.file = Some(self.file.into());
        if let Some(position) = self.span_position(span) {
            want.line = Some(position.0);
            want.column = Some(position.1);
        }
        self.wants.push(want);
    }

    /// 1-based line/column for a literal span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        line_col(source, span?.start)
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::warning(code, message.into()).with_location(self.file, line, column));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::info(code, message.into()).with_location(self.file, line, column));
    }

    /// Warn a dynamic refusal in value position, recording its harvest sink.
    /// This is the one sink hook: every Dynamic* call site funnels through
    /// here, so sinks stay exactly the refused value positions. Non-dynamic
    /// codes (a mutated element base) warn without recording.
    pub fn warn_dynamic(&mut self, refusal: DynamicRefusal<'_>) {
        let DynamicRefusal {
            span,
            code,
            message,
            when,
        } = refusal;
        if is_sink_code(code) {
            let (line, column) = self.span_position(Some(span)).unzip();
            if let Some(sink) = Sink::for_site(SinkSite {
                prop: self.prop,
                when,
                file: self.file,
                line,
                column,
            }) {
                self.sinks.push(sink);
            }
        }
        self.warn(span, code, message);
    }
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
            // truncate={false}
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
