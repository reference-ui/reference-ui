//! Recursive collector for style expressions.
//!
//! Traverses AST expressions to extract literal style values into `Want` declarations.
//! Open ternaries scoop both branches and open logicals scoop both operands,
//! preserving responsive array ordering and condition scopes; folded tests
//! and all-literal short-circuits compile only the live value with an info
//! naming the dead arm. Nothing here evaluates runtime JavaScript.

use oxc_ast::ast::{
    ConditionalExpression, Expression, LogicalExpression, UnaryExpression, UnaryOperator,
};
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::literal::{
    extract_template_literal, push_bool_want, push_number_want, push_string_want,
};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode};
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

/// The inner expression when `expr` is a transparent TS wrapper, else None.
/// Type wrappers erase at compile time, so every site unwraps through them
/// (`css()` args, JSX style blocks, and value positions alike).
pub(crate) fn unwrap_wrapper_target<'a, 'b>(
    expr: &'b Expression<'a>,
) -> Option<&'b Expression<'a>> {
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
        Expression::TSTypeAssertion(assertion) => {
            // <string>'2r'  (.ts only)
            Some(&assertion.expression)
        }
        Expression::TSInstantiationExpression(instantiation) => {
            // w<string>  — type arguments erase, like `as`
            Some(&instantiation.expression)
        }
        _ => None,
    }
}

/// True for block-position shapes that skip silently: falsy holes plus
/// literal fillers (`css('panda', {...})`, SPEC-V2-36). Everything else in
/// a style-block position either extracts or diagnoses (SPEC-V2-65).
pub(crate) fn is_silent_block_value(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::StringLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_) => true,
        Expression::Identifier(ident) => ident.name == "undefined" || ident.name == "null",
        Expression::UnaryExpression(unary) => unary.operator == UnaryOperator::Void,
        _ => false,
    }
}

/// Short kind name for a refused style-block value (`css()` args, JSX style
/// props). Identifiers name their binding; the span pinpoints the rest.
pub(crate) fn block_value_kind(expr: &Expression<'_>) -> String {
    match expr {
        Expression::Identifier(ident) => format!("identifier '{}'", ident.name.as_str()),
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_)
        | Expression::ChainExpression(_) => "member expression".to_string(),
        Expression::CallExpression(_) => "call expression".to_string(),
        Expression::LogicalExpression(_) => "logical expression".to_string(),
        Expression::TemplateLiteral(_) | Expression::TaggedTemplateExpression(_) => {
            "template expression".to_string()
        }
        Expression::UnaryExpression(_) | Expression::UpdateExpression(_) => {
            "unary expression".to_string()
        }
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_)
        | Expression::ClassExpression(_) => "function expression".to_string(),
        _ => "expression".to_string(),
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
        Expression::ComputedMemberExpression(mem) => {
            // color={colors['red']}  /  margin={sizes[1]}
            handle_computed_member(ctx, mem, when);
        }
        Expression::ChainExpression(chain) => {
            // margin={sizes?.[k]}  — computed chains fold; member chains stay dynamic (SITE-34)
            handle_chain(ctx, chain, when);
        }
        Expression::UnaryExpression(unary) => {
            // left={-2}  /  void 0
            handle_unary(ctx, unary, when);
        }
        Expression::BinaryExpression(binary) => {
            // width={1 + 'px'}  /  order={2 * 3}  /  zIndex={n > 1}
            handle_binary(ctx, binary, when);
        }
        Expression::CallExpression(call) => {
            // color={token('colors.red.500')}  — the token surface folds it
            handle_token_call(ctx, call, when);
        }
        _ => {
            // width={props.w}  — dynamic, warn, keep siblings
            warn_dynamic_expression(ctx, expr.span());
        }
    }
}

/// Fold one call: a `token()` value pushes its want, a refused shape warns
/// against the surface, and any other call tries the pure-helper fence.
fn handle_token_call(
    ctx: &mut ExpressionWalk<'_>,
    call: &oxc_ast::ast::CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(fold) = crate::extract::fold::fold_token_call(call, ctx.scopes) else {
        handle_pure_call(ctx, call, when);
        return;
    };
    if let Some(value) = fold.value {
        ctx.push_want(value, when.clone(), false, Some(call.span));
    }
    if let Some(refusal) = fold.refusal {
        let prop = ctx.prop;
        ctx.warn(
            refusal.span(call.span),
            refusal.code(),
            refusal.message(prop),
        );
    }
}

/// Fold one non-token call through the pure-helper fence: a folded value
/// lowers, refused fragments warn, and a refused call warns exactly like
/// before — naming the write when the callee binding was reassigned.
fn handle_pure_call(
    ctx: &mut ExpressionWalk<'_>,
    call: &oxc_ast::ast::CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_pure_call(call, ctx.scopes);
    if let Some(value) = fold.value {
        for refusal in &fold.refusals {
            let prop = ctx.prop;
            ctx.warn(
                refusal.span(),
                DiagnosticCode::DynamicExpression,
                refusal.message_for_value(prop),
            );
        }
        if let Some(subject) = fold.residue.as_ref() {
            ctx.warn(
                call.span,
                DiagnosticCode::PartialObjectProp,
                format!("{subject} drops a dynamic arm with no static style value"),
            );
        }
        crate::extract::fold::lower_call_value(ctx, &value, when, call.span);
        return;
    }
    let mut callee = &call.callee;
    while let Some(inner) = unwrap_wrapper_target(callee) {
        callee = inner;
    }
    if let Expression::Identifier(ident) = callee {
        if mutated_warn(ctx, ident.name.as_str(), call.span, "callee was reassigned") {
            return;
        }
    }
    // width={pick()}  — dynamic, warn, keep siblings
    warn_dynamic_expression(ctx, call.span);
}

/// The generic dynamic-expression warning for an unhandled value shape.
fn warn_dynamic_expression(ctx: &mut ExpressionWalk<'_>, span: Span) {
    let prop = ctx.prop;
    ctx.warn(
        span,
        DiagnosticCode::DynamicExpression,
        format!("Dynamic non-literal expression encountered for prop '{prop}'"),
    );
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
        handle_identifier(ctx, name, span);
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
    let leaves = crate::extract::fold::member_path_leaves(mem, ctx.scopes);
    if !leaves.is_empty() {
        // color={theme.primary}  /  color={tokens.colors.red}  /  tokens!.color
        for val in leaves {
            ctx.push_want(val.clone(), when.clone(), false, Some(mem.span));
        }
        if crate::extract::fold::member_path_residue(mem, ctx.scopes) {
            let path = crate::extract::fold::member_path_text(mem);
            ctx.warn(
                mem.span,
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        return;
    }
    if let Some(root) = crate::extract::fold::member_root_name(mem) {
        let path = crate::extract::fold::member_path_text(mem);
        if mutated_warn(ctx, root, mem.span, &format!("'{path}' is stale")) {
            // color={theme.primary}  after  theme.primary = 'blue'
            return;
        }
    }
    // width={props.w}
    let prop = ctx.prop;
    ctx.warn(
        mem.span,
        DiagnosticCode::DynamicMember,
        format!("Dynamic non-literal expression encountered for prop '{prop}'"),
    );
}

/// Fold one computed read: each resolving key pushes its leaves, each
/// refusal warns once with the key or side named. Holes omit silently.
fn handle_computed_member(
    ctx: &mut ExpressionWalk<'_>,
    mem: &oxc_ast::ast::ComputedMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    use crate::extract::fold::{describe_base, describe_snippet, fold_element_access};
    let fold = fold_element_access(&mem.object, &mem.expression, ctx.scopes);
    for val in &fold.values {
        ctx.push_want(val.clone(), when.clone(), false, Some(mem.span));
    }
    if fold.residue {
        let prop = ctx.prop;
        let base = describe_base(&mem.object);
        let index = describe_snippet(&mem.expression, ctx.source);
        ctx.warn(
            mem.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "Element access '{base}[{index}]' drops a dynamic arm with no static style value for prop '{prop}'"
            ),
        );
    }
    if fold.refusals.is_empty() {
        return;
    }
    let prop = ctx.prop;
    let base = describe_base(&mem.object);
    let index = describe_snippet(&mem.expression, ctx.source);
    for refusal in &fold.refusals {
        ctx.warn(
            refusal.span(mem.span),
            refusal.code(),
            refusal.message(prop, &base, &index),
        );
    }
}

/// Fold an optional chain: computed links fold at SITE-48, static member
/// links unwrap over known bases (SITE-34), and every other chain shape
/// warns exactly like any other dynamic leaf.
fn handle_chain(
    ctx: &mut ExpressionWalk<'_>,
    chain: &oxc_ast::ast::ChainExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let oxc_ast::ast::ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        // sizes?.[k]  — optionality never changes the static fold
        handle_computed_member(ctx, mem, when);
        return;
    }
    // tokens?.color  /  t?.colors?.red  — transparent over known bases
    let values = crate::extract::fold::fold_chain(chain, ctx.scopes);
    if !values.is_empty() {
        for val in &values {
            ctx.push_want(val.clone(), when.clone(), false, Some(chain.span));
        }
        if let Some(path) = crate::extract::fold::chain_residue_path(chain, ctx.scopes) {
            ctx.warn(
                chain.span,
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        return;
    }
    // maybe?.foo  /  getColor?.()  — dynamic, warn, keep siblings
    let prop = ctx.prop;
    ctx.warn(
        chain.span,
        DiagnosticCode::DynamicExpression,
        format!("Dynamic non-literal expression encountered for prop '{prop}'"),
    );
}

fn walk_conditional(
    ctx: &mut ExpressionWalk<'_>,
    cond: &ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        // bg={on ? 'n300' : 'n100'}  — both leaves, ignore `on`
        walk_expression(ctx, &cond.consequent, when);
        walk_expression(ctx, &cond.alternate, when);
        return;
    };
    // color={true ? 'white' : 'black'}  — the live arm only, plus an info
    // naming the dead arm; the runtime picks the same arm every time
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_dead_arms(ctx, std::slice::from_ref(&arm));
    walk_expression(ctx, live, when);
}

fn walk_logical(
    ctx: &mut ExpressionWalk<'_>,
    log: &LogicalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_logical(log.operator, &log.left, &log.right, ctx.scopes);
    if let Some(value) = fold.value {
        // color={'red' || 'blue'}  — the picked operand only, no dead atom
        emit_dead_arms(ctx, &fold.dead_arms);
        push_folded_want(ctx, &value, when, log.span);
        return;
    }
    // border={false && '1px solid'}  — guards skip, the rest walks both
    if !is_guard_expression(&log.left) {
        walk_expression(ctx, &log.left, when);
    }
    if !is_guard_expression(&log.right) {
        walk_expression(ctx, &log.right, when);
    }
}

/// Report one info diagnostic per eliminated dead arm at this prop.
fn emit_dead_arms(ctx: &mut ExpressionWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        let prop = ctx.prop;
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message(&format!("for prop '{prop}'")),
        );
    }
}

/// Push one folded value, honoring the `!important` suffix on strings.
fn push_folded_want(
    ctx: &mut ExpressionWalk<'_>,
    value: &AtomValue,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    if let AtomValue::String(text) = value {
        let (clean, important) = super::literal::split_important_flag(text);
        ctx.push_want(
            AtomValue::String(clean.into()),
            when.clone(),
            important,
            Some(span),
        );
        return;
    }
    ctx.push_want(value.clone(), when.clone(), false, Some(span));
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

fn handle_identifier(ctx: &mut ExpressionWalk<'_>, name: &str, span: Span) {
    if name == "undefined" || name == "null" {
        // bg={on ? 'n300' : undefined}  — omit
        return;
    }
    if mutated_warn(ctx, name, span, "declared value is stale") {
        // css({ color })  after  color = 'blue'  — the init is stale
        return;
    }
    // mt={space}  when `space` is not a file-top const
    let prop = ctx.prop;
    ctx.warn(
        span,
        DiagnosticCode::DynamicIdentifier,
        format!("Dynamic non-literal identifier '{name}' encountered for prop '{prop}'"),
    );
}

/// Warn naming the write when a base name is a mutated binding.
fn mutated_warn(ctx: &mut ExpressionWalk<'_>, name: &str, span: Span, detail: &str) -> bool {
    let Some(write) = ctx.scopes.mutation(name) else {
        return false;
    };
    let prop = ctx.prop;
    ctx.warn(
        span,
        DiagnosticCode::MutatedBinding,
        format!(
            "Dynamic mutated binding '{name}' encountered for prop '{prop}' (reassigned at {}; {detail})",
            write.site()
        ),
    );
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
    // -space  /  !true  /  ~5  — the shared fold node; refusals diagnose,
    // dynamic operands re-walk for their own diagnostics, never for wants
    let fold = crate::extract::fold::fold_unary(unary.operator, &unary.argument, ctx.scopes);
    for val in &fold.values {
        ctx.push_want(val.clone(), when.clone(), false, Some(unary.span));
    }
    for refusal in &fold.refusals {
        let prop = ctx.prop;
        ctx.warn(
            unary.span,
            DiagnosticCode::DynamicUnary,
            refusal.message(prop),
        );
    }
    for refusal in &fold.template_refusals {
        let prop = ctx.prop;
        ctx.warn(
            refusal.span(),
            DiagnosticCode::DynamicTemplate,
            refusal.message(prop),
        );
    }
    emit_dead_arms(ctx, &fold.dead_arms);
    for operand in fold.dynamic {
        walk_expression(ctx, operand, when);
    }
}

fn handle_binary(
    ctx: &mut ExpressionWalk<'_>,
    binary: &oxc_ast::ast::BinaryExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // width={1 + 'px'}  — the shared fold node; refusals diagnose,
    // dead arms info, dynamic operands re-walk for their own diagnostics
    let fold =
        crate::extract::fold::fold_binary(binary.operator, &binary.left, &binary.right, ctx.scopes);
    for val in &fold.values {
        push_folded_want(ctx, val, when, binary.span);
    }
    for refusal in &fold.refusals {
        let prop = ctx.prop;
        ctx.warn(
            binary.span,
            DiagnosticCode::DynamicBinary,
            refusal.message(prop),
        );
    }
    for refusal in &fold.unary_refusals {
        let prop = ctx.prop;
        ctx.warn(
            binary.span,
            DiagnosticCode::DynamicUnary,
            refusal.message(prop),
        );
    }
    for refusal in &fold.template_refusals {
        let prop = ctx.prop;
        ctx.warn(
            refusal.span(),
            DiagnosticCode::DynamicTemplate,
            refusal.message(prop),
        );
    }
    emit_dead_arms(ctx, &fold.dead_arms);
    for operand in fold.dynamic {
        walk_expression(ctx, operand, when);
    }
}
