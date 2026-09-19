//! Constant folding for template literals, shared by both extraction walkers.
//!
//! `fold_template` joins quasis with every `${…}` hole folded through the
//! table: literals, const-resolved identifiers and members, transparent
//! wrappers, branching forms that fan out, nested templates, and unary and
//! binary parts via their nodes. Each hole contributes its string leaves and the node
//! joins one string per combination, capped so an over-wide fan-out refuses
//! whole instead of emitting a partial set. Holes that do not fold become
//! located refusals naming the part, where v2's staged harness drops the
//! whole call silently.

use oxc_ast::ast::{
    BinaryExpression, Expression, StaticMemberExpression, TemplateLiteral, UnaryExpression,
    UnaryOperator,
};
use oxc_span::{GetSpan, Span};

use super::binary::fold_binary;
use super::unary::fold_unary;
use crate::atom::AtomValue;
use crate::extract::expressions::walk::{is_guard_expression, unwrap_wrapper_target};
use crate::extract::scope::Scoped;

/// Fan-out ceiling: three binary ternaries still join; wider products refuse whole.
const MAX_TEMPLATE_COMBINATIONS: usize = 8;

/// Folded template strings plus one refusal per hole that did not fold.
#[derive(Default)]
pub struct TemplateFold {
    /// One joined string per hole-leaf combination; empty when a hole
    /// refused, a quasi is invalid, or the fan-out exceeded the cap.
    pub values: Vec<String>,
    /// One refusal per unfoldable hole, arm, or operand — diagnosed where
    /// they sit, never re-walked for a second opinion.
    pub refusals: Vec<TemplateRefusal>,
}

/// Why one hole — or the whole template — did not fold.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TemplateRefusal {
    span: Span,
    part: Option<usize>,
    detail: Box<str>,
}

impl TemplateRefusal {
    /// A refusal naming one `${…}` hole by its one-based index.
    fn hole(span: Span, part: usize, detail: impl Into<Box<str>>) -> Self {
        Self {
            span,
            part: Some(part),
            detail: detail.into(),
        }
    }

    /// A refusal against the whole template (bad quasi, over-cap fan-out).
    fn whole(span: Span, detail: impl Into<Box<str>>) -> Self {
        Self {
            span,
            part: None,
            detail: detail.into(),
        }
    }

    /// Re-index a nested refusal to the outer hole that carried it.
    fn repart(self, part: usize) -> Self {
        Self {
            span: self.span,
            part: Some(part),
            detail: self.detail,
        }
    }

    /// The offending node's span: the hole, or the template for whole refusals.
    pub fn span(&self) -> Span {
        self.span
    }

    /// The diagnostic text for a refusal at one style prop.
    pub fn message(&self, prop: &str) -> String {
        match self.part {
            Some(index) => format!(
                "Dynamic non-literal template part {index} ({}) encountered for prop '{prop}'",
                self.detail
            ),
            None => format!(
                "Dynamic non-literal template expression for prop '{prop}' ({})",
                self.detail
            ),
        }
    }
}

/// One hole's fold session: its number, its scope, the shared refusal sink.
struct HoleFold<'a, 'b> {
    part: usize,
    scoped: Scoped<'a>,
    fold: &'b mut TemplateFold,
}

impl HoleFold<'_, '_> {
    /// Record a refusal against this hole at the offending span.
    fn refuse(&mut self, span: Span, detail: impl Into<Box<str>>) {
        self.fold
            .refusals
            .push(TemplateRefusal::hole(span, self.part, detail));
    }
}

/// Fold one template literal over its holes' static leaves.
pub fn fold_template(lit: &TemplateLiteral<'_>, scoped: Scoped<'_>) -> TemplateFold {
    let mut fold = TemplateFold::default();
    let mut holes = Vec::with_capacity(lit.expressions.len());
    for (index, expr) in lit.expressions.iter().enumerate() {
        let mut hole = HoleFold {
            part: index + 1,
            scoped,
            fold: &mut fold,
        };
        holes.push(fold_hole(expr, &mut hole));
    }
    join(lit, &holes, &mut fold);
    fold
}

/// Join quasis with every hole combination, or refuse whole over the cap.
fn join(lit: &TemplateLiteral<'_>, holes: &[Vec<String>], fold: &mut TemplateFold) {
    let Some(cooked) = cooked_quasis(lit, fold) else {
        return;
    };
    if cooked.len() != holes.len() + 1 {
        // The parser builds quasis and holes together; a skew refuses whole.
        fold.refusals.push(TemplateRefusal::whole(
            lit.span,
            "template quasis do not match the interpolation holes",
        ));
        return;
    }
    if holes.iter().any(Vec::is_empty) {
        // A refused or guard-only hole leaves no string to join.
        return;
    }
    let total: usize = holes.iter().map(Vec::len).product();
    if total > MAX_TEMPLATE_COMBINATIONS {
        fold.refusals.push(TemplateRefusal::whole(
            lit.span,
            format!("{total} combinations exceed the {MAX_TEMPLATE_COMBINATIONS}-combination fan-out limit"),
        ));
        return;
    }
    // Panda trims template joins after collapsing (SPEC-V2-14): the
    // collapse lands downstream at resolve, so the fold trims here.
    fold.values = combinations(&cooked, holes)
        .into_iter()
        .map(|joined| joined.trim().to_string())
        .collect();
}

/// Cooked quasi text, or a whole-template refusal on an invalid escape.
fn cooked_quasis<'a>(lit: &TemplateLiteral<'a>, fold: &mut TemplateFold) -> Option<Vec<&'a str>> {
    let mut cooked = Vec::with_capacity(lit.quasis.len());
    for quasi in lit.quasis.iter() {
        let Some(text) = quasi.value.cooked.as_ref() else {
            fold.refusals.push(TemplateRefusal::whole(
                lit.span,
                "invalid escape sequence in template quasi",
            ));
            return None;
        };
        cooked.push(text.as_str());
    }
    Some(cooked)
}

/// One joined string per hole-leaf combination, quasis interleaved.
fn combinations(quasis: &[&str], holes: &[Vec<String>]) -> Vec<String> {
    let Some(first) = quasis.first() else {
        return Vec::new();
    };
    let mut acc = vec![(*first).to_string()];
    for (hole, quasi) in holes.iter().zip(quasis.iter().skip(1)) {
        let mut next = Vec::with_capacity(acc.len() * hole.len());
        for prefix in &acc {
            for leaf in hole {
                next.push(format!("{prefix}{leaf}{quasi}"));
            }
        }
        acc = next;
    }
    acc
}

/// Fold one `${…}` hole to its string leaves; refusals land on the fold.
fn fold_hole(expr: &Expression<'_>, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
    if let Some(leaves) = fold_hole_leaf(expr, hole) {
        return leaves;
    }
    if let Some(leaves) = fold_hole_nested(expr, hole) {
        return leaves;
    }
    if let Some(leaves) = fold_hole_branching(expr, hole) {
        return leaves;
    }
    // `${pick()}` — one located refusal, never a re-walk
    hole.refuse(expr.span(), part_kind(expr));
    Vec::new()
}

/// Leaf holes: literals plus scope-resolved names and members.
fn fold_hole_leaf(expr: &Expression<'_>, hole: &mut HoleFold<'_, '_>) -> Option<Vec<String>> {
    if let Some(leaves) = fold_hole_literal(expr) {
        return Some(leaves);
    }
    if let Expression::Identifier(ident) = expr {
        return Some(fold_hole_identifier(ident.name.as_str(), ident.span, hole));
    }
    if let Expression::StaticMemberExpression(mem) = expr {
        return Some(fold_hole_member(mem, hole));
    }
    None
}

/// Nested holes resolve through another node: wrappers, templates, unary, binary.
fn fold_hole_nested(expr: &Expression<'_>, hole: &mut HoleFold<'_, '_>) -> Option<Vec<String>> {
    if let Some(target) = unwrap_wrapper_target(expr) {
        // `${(n)}` / `${n as const}` — wrappers erase, as in value position
        return Some(fold_hole(target, hole));
    }
    if let Expression::TemplateLiteral(nested) = expr {
        // Nested templates join inside out; refusals re-index to this hole.
        let part = hole.part;
        let sub = fold_template(nested, hole.scoped);
        for refusal in sub.refusals {
            hole.fold.refusals.push(refusal.repart(part));
        }
        return Some(sub.values);
    }
    if let Expression::UnaryExpression(unary) = expr {
        return Some(fold_hole_unary(unary, hole));
    }
    if let Expression::BinaryExpression(bin) = expr {
        return Some(fold_hole_binary(bin, hole));
    }
    None
}

/// Literal holes stringify like v2's `coerce_to_string`.
fn fold_hole_literal(expr: &Expression<'_>) -> Option<Vec<String>> {
    match expr {
        Expression::StringLiteral(lit) => Some(vec![lit.value.to_string()]),
        Expression::NumericLiteral(lit) => Some(vec![lit.value.to_string()]),
        Expression::BooleanLiteral(lit) => Some(vec![bool_text(lit.value)]),
        Expression::NullLiteral(_) => Some(vec!["null".to_string()]),
        _ => None,
    }
}

/// Booleans stringify lowercase, as in JS template joins.
fn bool_text(value: bool) -> String {
    if value { "true" } else { "false" }.to_string()
}

/// A name hole resolves through scope; multi-leaf consts fan the join out.
fn fold_hole_identifier(name: &str, span: Span, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
    if name == "undefined" || name == "null" {
        // `${undefined}` — v2 folds free `undefined` to Null, then "null"
        return vec!["null".to_string()];
    }
    if let Some(write) = hole.scoped.mutation(name) {
        hole.refuse(
            span,
            format!("mutated binding '{name}' ({})", write.write_phrase()),
        );
        return Vec::new();
    }
    let leaves = hole.scoped.scalar_leaves(name);
    if leaves.is_empty() {
        hole.refuse(span, format!("identifier '{name}'"));
        return Vec::new();
    }
    let out: Vec<String> = leaves.iter().filter_map(coerce_leaf).collect();
    if out.is_empty() {
        // Token leaves never interpolate; fail closed (unreachable via scope).
        hole.refuse(span, format!("identifier '{name}'"));
    }
    out
}

/// A member hole resolves one hop, exactly like value position.
fn fold_hole_member(mem: &StaticMemberExpression<'_>, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
    if let Expression::Identifier(obj) = &mem.object {
        let obj_name = obj.name.as_str();
        let prop_name = mem.property.name.as_str();
        // `${o.p}` — branching props fan out, as in value position
        let out: Vec<String> = hole
            .scoped
            .object_prop_leaves(obj_name, prop_name)
            .iter()
            .filter_map(coerce_leaf)
            .collect();
        if !out.is_empty() {
            return out;
        }
        if let Some(write) = hole.scoped.mutation(obj_name) {
            hole.refuse(
                mem.span,
                format!(
                    "mutated binding '{obj_name}' ({})",
                    write.write_phrase()
                ),
            );
            return Vec::new();
        }
        hole.refuse(mem.span, format!("member '{obj_name}.{prop_name}'"));
        return Vec::new();
    }
    hole.refuse(mem.span, "member expression");
    Vec::new()
}

/// A unary hole folds through the unary node, then coerces each leaf.
fn fold_hole_unary(unary: &UnaryExpression<'_>, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
    if unary.operator == UnaryOperator::Void {
        // `${void 0}` — omitted in value position, unfoldable in a join
        hole.refuse(unary.span, "void expression");
        return Vec::new();
    }
    let sub = fold_unary(unary.operator, &unary.argument, hole.scoped);
    for refusal in sub.refusals {
        hole.refuse(unary.span, refusal.detail());
    }
    let part = hole.part;
    for nested in sub.template_refusals {
        hole.fold.refusals.push(nested.repart(part));
    }
    for operand in sub.dynamic {
        // `${-pick}` — name the operand v2 would silently drop
        hole.refuse(operand.span(), part_kind(operand));
    }
    // The unary node emits Number/Bool values only, which always coerce.
    sub.values.iter().filter_map(coerce_leaf).collect()
}

/// A binary hole folds through the binary node, then coerces each leaf.
fn fold_hole_binary(bin: &BinaryExpression<'_>, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
    let sub = fold_binary(bin.operator, &bin.left, &bin.right, hole.scoped);
    for refusal in sub.refusals {
        hole.refuse(bin.span, refusal.detail());
    }
    for refusal in sub.unary_refusals {
        hole.refuse(bin.span, refusal.detail());
    }
    let part = hole.part;
    for nested in sub.template_refusals {
        hole.fold.refusals.push(nested.repart(part));
    }
    for operand in sub.dynamic {
        // `${pick() + 'px'}` — name the operand v2 would silently drop
        hole.refuse(operand.span(), part_kind(operand));
    }
    // The binary node emits coercible scalars; tokens refuse upstream.
    sub.values.iter().filter_map(coerce_leaf).collect()
}

/// An inline ternary or logical hole distributes exactly like value position.
fn fold_hole_branching(expr: &Expression<'_>, hole: &mut HoleFold<'_, '_>) -> Option<Vec<String>> {
    if let Expression::ConditionalExpression(cond) = expr {
        // `${pick ? 'red' : 'blue'}` — every folded arm joins; bad arms refuse
        let mut leaves = fold_hole(&cond.consequent, hole);
        leaves.extend(fold_hole(&cond.alternate, hole));
        return Some(leaves);
    }
    if let Expression::LogicalExpression(log) = expr {
        let mut leaves = Vec::new();
        if !is_guard_expression(&log.left) {
            leaves.extend(fold_hole(&log.left, hole));
        }
        if !is_guard_expression(&log.right) {
            leaves.extend(fold_hole(&log.right, hole));
        }
        return Some(leaves);
    }
    None
}

/// A static leaf as template text; tokens never interpolate.
fn coerce_leaf(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(s) => Some(s.to_string()),
        AtomValue::Number(n) => Some(n.to_string()),
        AtomValue::Bool(b) => Some(bool_text(*b)),
        AtomValue::Null => Some("null".to_string()),
        AtomValue::Token { .. } => None,
    }
}

/// Short kind name for a refused hole: identifiers name their binding.
fn part_kind(expr: &Expression<'_>) -> String {
    match expr {
        Expression::Identifier(ident) => format!("identifier '{}'", ident.name.as_str()),
        Expression::CallExpression(_) => "call expression".to_string(),
        // Binary holes fold through the binary node; a surviving binary names its shape.
        Expression::BinaryExpression(_) => "binary expression".to_string(),
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_)
        | Expression::ChainExpression(_) => "member expression".to_string(),
        Expression::UnaryExpression(_) | Expression::UpdateExpression(_) => {
            "unary expression".to_string()
        }
        Expression::ArrayExpression(_) => "array expression".to_string(),
        Expression::ObjectExpression(_) => "object expression".to_string(),
        Expression::TaggedTemplateExpression(_) => "template expression".to_string(),
        Expression::AwaitExpression(_) => "await expression".to_string(),
        Expression::YieldExpression(_) => "yield expression".to_string(),
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_)
        | Expression::ClassExpression(_) => "function expression".to_string(),
        _ => "expression".to_string(),
    }
}
