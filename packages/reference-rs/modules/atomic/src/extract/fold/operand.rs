//! Fold-table operand leaves: what one sub-expression resolves to.
//!
//! [`operand_leaves`] lowers literals, const-resolved identifiers, static
//! member paths, and transparent wrappers to their [`AtomValue`] leaves, so
//! every fold node reads operands identically. Anything else is [`Dynamic`],
//! and the caller either recurses (nested folds, open branches) or re-walks
//! it for its own diagnostic. Static member paths resolve through the
//! member node; computed reads belong to the element node.

use oxc_ast::ast::Expression;

use crate::atom::AtomValue;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// What one operand position resolved to: leaves, or not our shape.
pub enum Operand {
    /// Every static leaf (multi-leaf consts and branch members fan out).
    Leaves(Vec<AtomValue>),
    /// A nested fold, a branch, or a genuinely dynamic shape.
    Dynamic,
}

/// Lower one operand to its static leaves, or [`Operand::Dynamic`].
///
/// Literals lower directly; identifiers read their scope leaves; static
/// member paths walk multi-hop; wrappers peel. Free `undefined` lowers to
/// null the way v2 folds it, so `??` and equality treat it as nullish.
pub fn operand_leaves(expr: &Expression<'_>, scoped: Scoped<'_>) -> Operand {
    let expr = peel_wrappers(expr);
    if let Some(leaf) = literal_leaf(expr) {
        return Operand::Leaves(vec![leaf]);
    }
    if let Expression::Identifier(ident) = expr {
        return identifier_leaves(ident.name.as_str(), scoped);
    }
    if let Expression::StaticMemberExpression(mem) = expr {
        let leaves = super::member::member_path_leaves(mem, scoped);
        if leaves.is_empty() {
            return Operand::Dynamic;
        }
        return Operand::Leaves(leaves);
    }
    Operand::Dynamic
}

/// Peel every transparent wrapper (parens, `as`, `satisfies`, `!`, `<T>`).
pub(crate) fn peel_wrappers<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    let mut current = expr;
    while let Some(inner) = unwrap_wrapper_target(current) {
        current = inner;
    }
    current
}

/// A literal operand leaf, or None for non-literals.
fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(lit) => Some(AtomValue::String(lit.value.as_str().into())),
        Expression::NumericLiteral(lit) => {
            Some(AtomValue::Number(lit.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(lit) => Some(AtomValue::Bool(lit.value)),
        Expression::NullLiteral(_) => Some(AtomValue::Null),
        _ => None,
    }
}

/// Scope leaves for an identifier, with `undefined` lowering to null.
fn identifier_leaves(name: &str, scoped: Scoped<'_>) -> Operand {
    if name == "undefined" || name == "null" {
        return Operand::Leaves(vec![AtomValue::Null]);
    }
    let leaves = scoped.scalar_leaves(name);
    if leaves.is_empty() {
        Operand::Dynamic
    } else {
        Operand::Leaves(leaves.to_vec())
    }
}
