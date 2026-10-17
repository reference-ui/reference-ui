//! Hole folding for template literals: each `${…}` hole lowers to the static strings its expression
//! can take, or refuses with a named shape. Literals, const leaves, one-hop members, nested
//! templates, unary and binary operators, and ternaries fold; every other hole records a refusal
//! that names what it was, so the call warns instead of guessing. Takes one hole expression and its
//! fold context; emits the hole's leaf strings or nothing, and refusals on the context.

use oxc_ast::ast::{
    BinaryExpression, Expression, StaticMemberExpression, UnaryExpression, UnaryOperator,
};
use oxc_span::{GetSpan, Span};

use super::super::binary::fold_binary;
use super::super::unary::fold_unary;
use super::{fold_template, HoleFold};
use crate::atom::AtomValue;
use crate::extract::expressions::walk::{is_guard_expression, unwrap_wrapper_target};

/// Fold one `${…}` hole to its string leaves; refusals land on the fold.
pub(super) fn fold_hole(expr: &Expression<'_>, hole: &mut HoleFold<'_, '_>) -> Vec<String> {
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
    if hole.scoped.scalar_residue(name) {
        // `${partial}` — a dropped arm rides the leaves; the join must not
        // fold on the kept leaf, so the hole refuses like a dynamic name
        hole.refuse(span, format!("identifier '{name}'"));
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
        if super::super::member::member_path_residue(mem, hole.scoped) {
            // `${o.p}` over a dropped arm — the join must not fold on the
            // kept leaves, so the hole refuses like a dynamic member
            hole.refuse(mem.span, format!("member '{obj_name}.{prop_name}'"));
            return Vec::new();
        }
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
                format!("mutated binding '{obj_name}' ({})", write.write_phrase()),
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
        _ => shape_kind(expr).to_string(),
    }
}

/// The shape name of a hole that is not a bare identifier, calls and reads first.
fn shape_kind(expr: &Expression<'_>) -> &'static str {
    match expr {
        Expression::CallExpression(_) => "call expression",
        // Binary holes fold through the binary node; a surviving binary names its shape.
        Expression::BinaryExpression(_) => "binary expression",
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_)
        | Expression::ChainExpression(_) => "member expression",
        _ => operand_kind(expr),
    }
}

/// The shape name of a unary operator or a literal container.
fn operand_kind(expr: &Expression<'_>) -> &'static str {
    match expr {
        Expression::UnaryExpression(_) | Expression::UpdateExpression(_) => "unary expression",
        Expression::ArrayExpression(_) => "array expression",
        Expression::ObjectExpression(_) => "object expression",
        _ => async_or_function_kind(expr),
    }
}

/// The shape name of templates, awaits, yields, and function-like holes.
fn async_or_function_kind(expr: &Expression<'_>) -> &'static str {
    match expr {
        Expression::TaggedTemplateExpression(_) => "template expression",
        Expression::AwaitExpression(_) => "await expression",
        Expression::YieldExpression(_) => "yield expression",
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_)
        | Expression::ClassExpression(_) => "function expression",
        _ => "expression",
    }
}
