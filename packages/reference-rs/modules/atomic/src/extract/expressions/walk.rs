//! Recursive collector for style expressions.
//!
//! Traverses AST expressions to extract literal style values into `Want` declarations.
//! Unconditionally scoops both branches of ternaries and logical operators, preserving
//! responsive array ordering and condition scopes without evaluating runtime JavaScript.

use oxc_ast::ast::{
    ConditionalExpression, Expression, LogicalExpression, UnaryExpression, UnaryOperator,
};
use oxc_span::Span;
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::{line_col, Diagnostic};
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

    /// Report a diagnostic warning at the current file.
    pub fn warn(&mut self, message: impl Into<String>) {
        self.diagnostics
            .push(Diagnostic::warning(message.into()).with_location(self.file, None, None));
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
    if walk_branching(ctx, expr, when) {
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
    let Some(target) = unwrap_wrapper_target(expr) else {
        return false;
    };
    walk_expression(ctx, target, when);
    true
}

fn unwrap_wrapper_target<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::ParenthesizedExpression(p) => {
            // ('2r')
            Some(&p.expression)
        }
        Expression::TSAsExpression(as_expr) => {
            // '2r' as const
            Some(&as_expr.expression)
        }
        Expression::TSSatisfiesExpression(sat) => {
            // '2r' satisfies string
            Some(&sat.expression)
        }
        Expression::TSNonNullExpression(non_null) => {
            // '2r'!
            Some(&non_null.expression)
        }
        _ => None,
    }
}

fn walk_branching(
    ctx: &mut ExpressionWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // bg={on ? 'n300' : 'n100'}
            walk_conditional(ctx, cond, when);
            true
        }
        Expression::LogicalExpression(log) => {
            // bg={isSelected && 'n200'}  /  color={'red' || 'blue'}
            walk_logical(ctx, log, when);
            true
        }
        Expression::ArrayExpression(arr) => {
            // mt={['1r', '2r', '4r']}
            super::responsive::walk_array(ctx, arr, when);
            true
        }
        Expression::ObjectExpression(obj) => {
            // width={{ base: '50px', md: '60px' }}
            super::responsive::walk_object(ctx, obj, when);
            true
        }
        _ => false,
    }
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
            handle_identifier_fallback(ctx, ident.name.as_str(), when, ident.span);
        }
        Expression::StaticMemberExpression(mem) => {
            // color={theme.primary}  where  const theme = { primary: 'n300' }
            handle_static_member(ctx, mem, when);
        }
        Expression::UnaryExpression(unary) => {
            // left={-2}  /  void 0
            handle_unary(ctx, unary, when);
        }
        _ => {
            // width={props.w}  — dynamic, warn, keep siblings
            let prop = ctx.prop;
            ctx.warn(format!(
                "Dynamic non-literal expression encountered for prop '{prop}'"
            ));
        }
    }
}

fn handle_identifier_fallback(
    ctx: &mut ExpressionWalk<'_>,
    name: &str,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    // mt={space}  after  const space = '2r'
    // borderBottomColor={subtleBorder}  after  const subtleBorder = isDark ? 'gray.800' : 'gray.200'
    // Resolves through the scope chain: the innermost binding wins, and a
    // param or inner declarator shadows outer and cross-file consts.
    let leaves = ctx.scopes.scalar_leaves(name);
    if leaves.is_empty() {
        handle_identifier(ctx, name);
        return;
    }
    for val in leaves {
        ctx.push_want(val.clone(), when.clone(), false, Some(span));
    }
}

fn handle_static_member(
    ctx: &mut ExpressionWalk<'_>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Expression::Identifier(obj_id) = &mem.object {
        let obj_name = obj_id.name.as_str();
        let prop_name = mem.property.name.as_str();
        if let Some(val) = ctx.scopes.object_prop(obj_name, prop_name) {
            // color={theme.primary}
            ctx.push_want(val.clone(), when.clone(), false, Some(mem.span));
            return;
        }
        if mutated_warn(ctx, obj_name, &format!("'{obj_name}.{prop_name}' is stale")) {
            // color={theme.primary}  after  theme.primary = 'blue'
            return;
        }
    }
    // width={props.w}
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic non-literal expression encountered for prop '{prop}'"
    ));
}

fn walk_conditional(
    ctx: &mut ExpressionWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // bg={on ? 'n300' : 'n100'}  — both leaves, ignore `on`
    walk_expression(ctx, &cond.consequent, when);
    walk_expression(ctx, &cond.alternate, when);
}

fn walk_logical(
    ctx: &mut ExpressionWalk<'_>,
    log: &LogicalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // border={false && '1px solid'}  /  color={'red' || 'blue'}
    if !is_guard_expression(&log.left) {
        walk_expression(ctx, &log.left, when);
    }
    if !is_guard_expression(&log.right) {
        walk_expression(ctx, &log.right, when);
    }
}

pub(crate) fn is_guard_expression(expr: &Expression<'_>) -> bool {
    // false && '1px solid'  /  null && '2px solid'  /  (a === b) && 'n200'
    matches!(
        expr,
        Expression::BooleanLiteral(_)
            | Expression::BinaryExpression(_)
            | Expression::NullLiteral(_)
    ) || is_undefined_or_null_ident(expr)
}

fn is_undefined_or_null_ident(expr: &Expression<'_>) -> bool {
    // undefined && 'n200'
    if let Expression::Identifier(ident) = expr {
        ident.name == "undefined" || ident.name == "null"
    } else {
        false
    }
}

fn handle_identifier(ctx: &mut ExpressionWalk<'_>, name: &str) {
    if name == "undefined" || name == "null" {
        // bg={on ? 'n300' : undefined}  — omit
        return;
    }
    if mutated_warn(ctx, name, "declared value is stale") {
        // css({ color })  after  color = 'blue'  — the init is stale
        return;
    }
    // mt={space}  when `space` is not a file-top const
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic non-literal identifier '{name}' encountered for prop '{prop}'"
    ));
}

/// Warn naming the write when a base name is a mutated binding.
fn mutated_warn(ctx: &mut ExpressionWalk<'_>, name: &str, detail: &str) -> bool {
    let Some(write) = ctx.scopes.mutation(name) else {
        return false;
    };
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic mutated binding '{name}' encountered for prop '{prop}' (reassigned at {}; {detail})",
        write.site()
    ));
    true
}

fn handle_unary(
    ctx: &mut ExpressionWalk<'_>,
    unary: &UnaryExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if unary.operator == UnaryOperator::Void {
        // void 0
        return;
    }
    if let (UnaryOperator::UnaryNegation, Expression::NumericLiteral(lit)) =
        (unary.operator, &unary.argument)
    {
        // left={-2}
        let val = format!("-{}", lit.value);
        ctx.push_want(
            AtomValue::Number(val.into_boxed_str()),
            when.clone(),
            false,
            Some(lit.span),
        );
        return;
    }
    walk_expression(ctx, &unary.argument, when);
}
