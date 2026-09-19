//! Element-index folding (`m[key]`): index expressions to key spellings.
//!
//! [`fold_index`] lowers one index to the keys it names, fanning out over
//! multi-leaf consts the way ternaries scoop both arms: literals, folded
//! identifiers, one-hop members, nested reads, unary and binary expressions,
//! and static plus interpolated templates all fold through the shared table
//! nodes. Anything else — calls, unbound names, partially folded forms —
//! refuses for the caller to diagnose at the index span.

use oxc_ast::ast::Expression;

use super::binary::fold_binary;
use super::element::{fold_element_access, ElementFold};
use super::key::canonical_numeric_key;
use super::template::fold_template;
use super::unary::fold_unary;
use crate::atom::AtomValue;
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// A folded index: one key per leaf, or a refusal to fold at all.
pub(crate) enum IndexFold {
    Keys(Vec<String>),
    Dynamic,
}

/// Fold an index expression to its key spellings, fanning out over leaves.
///
/// Literals, single- and multi-leaf const identifiers, one-hop members,
/// nested element reads, unary and binary expressions, and static plus
/// interpolated templates fold; calls and unbound names refuse for the
/// caller to diagnose.
pub(crate) fn fold_index(expr: &Expression<'_>, scoped: Scoped<'_>) -> IndexFold {
    if let Some(keys) = fold_index_literal(expr, scoped) {
        return keys;
    }
    if let Some(inner) = unwrap_wrapper_target(expr) {
        // colors[(k)]  /  sizes[i as const]
        return fold_index(inner, scoped);
    }
    IndexFold::Dynamic
}

/// Fold the literal and resolvable index forms, or None to try wrappers.
fn fold_index_literal(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<IndexFold> {
    if let Some(keys) = fold_index_primitive(expr) {
        return Some(keys);
    }
    if let Expression::TemplateLiteral(lit) = expr {
        return Some(fold_index_template(lit, scoped));
    }
    fold_index_resolve(expr, scoped)
}

/// Fold scope-resolved index forms, or None for calls and exotic shapes.
fn fold_index_resolve(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<IndexFold> {
    if let Some(keys) = fold_index_named(expr, scoped) {
        return Some(keys);
    }
    fold_index_computed(expr, scoped)
}

/// Fold table selections (names, members, reads, chains) as indices.
fn fold_index_named(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<IndexFold> {
    match expr {
        Expression::Identifier(ident) => Some(fold_index_identifier(ident.name.as_str(), scoped)),
        Expression::StaticMemberExpression(mem) => Some(fold_index_member(mem, scoped)),
        Expression::ComputedMemberExpression(mem) => {
            // m[a[0]]  — nested reads fold inside out
            Some(fold_index_element(&mem.object, &mem.expression, scoped))
        }
        Expression::ChainExpression(chain) => Some(fold_index_chain(chain, scoped)),
        _ => None,
    }
}

/// Fold node-computed indices (unary, binary) through the shared table.
fn fold_index_computed(expr: &Expression<'_>, scoped: Scoped<'_>) -> Option<IndexFold> {
    match expr {
        Expression::UnaryExpression(unary) => Some(fold_index_unary(unary, scoped)),
        Expression::BinaryExpression(bin) => Some(fold_index_binary(bin, scoped)),
        _ => None,
    }
}

/// Fold primitive-literal indices, or None for every other form.
fn fold_index_primitive(expr: &Expression<'_>) -> Option<IndexFold> {
    match expr {
        Expression::StringLiteral(lit) => {
            // colors['red']
            Some(IndexFold::Keys(vec![lit.value.to_string()]))
        }
        Expression::NumericLiteral(lit) => {
            // sizes[1]
            Some(IndexFold::Keys(vec![canonical_numeric_key(lit.value)]))
        }
        Expression::BooleanLiteral(lit) => Some(IndexFold::Keys(vec![lit.value.to_string()])),
        Expression::NullLiteral(_) => Some(IndexFold::Keys(vec!["null".to_string()])),
        _ => None,
    }
}

/// A template index: static quasis spell directly, interpolated holes join
/// through the template node; anything unfolded refuses.
fn fold_index_template(lit: &oxc_ast::ast::TemplateLiteral<'_>, scoped: Scoped<'_>) -> IndexFold {
    if lit.expressions.is_empty() {
        let Some(raw) = lit.quasis.first().map(|q| q.value.raw.to_string()) else {
            return IndexFold::Dynamic;
        };
        return IndexFold::Keys(vec![raw]);
    }
    // m[`a${'b'}`]  — interpolated templates join through SITE-51's node
    let fold = fold_template(lit, scoped);
    if fold.values.is_empty() || !fold.refusals.is_empty() {
        return IndexFold::Dynamic;
    }
    IndexFold::Keys(fold.values)
}

/// An identifier index: every const leaf becomes a key; unbound refuses.
fn fold_index_identifier(name: &str, scoped: Scoped<'_>) -> IndexFold {
    if name == "undefined" || name == "null" {
        return IndexFold::Keys(vec![name.to_string()]);
    }
    // colors[k]  after  const k = 'red'
    let keys: Vec<String> = scoped
        .scalar_leaves(name)
        .iter()
        .filter_map(leaf_key)
        .collect();
    if keys.is_empty() {
        IndexFold::Dynamic
    } else {
        IndexFold::Keys(keys)
    }
}

/// A one-hop member index (`m[o.p]`), or Dynamic when unresolvable.
fn fold_index_member(
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    scoped: Scoped<'_>,
) -> IndexFold {
    if let Expression::Identifier(obj) = &mem.object {
        // m[o.p]  — every const leaf becomes a key
        let keys: Vec<String> = scoped
            .object_prop_leaves(obj.name.as_str(), mem.property.name.as_str())
            .iter()
            .filter_map(leaf_key)
            .collect();
        if !keys.is_empty() {
            return IndexFold::Keys(keys);
        }
    }
    IndexFold::Dynamic
}

/// A nested element index: each folded leaf becomes a key.
fn fold_index_element(
    object: &Expression<'_>,
    index: &Expression<'_>,
    scoped: Scoped<'_>,
) -> IndexFold {
    match fold_element_access(object, index, scoped) {
        ElementFold { values, .. } if !values.is_empty() => {
            let keys: Vec<String> = values.iter().filter_map(leaf_key).collect();
            if keys.is_empty() {
                IndexFold::Dynamic
            } else {
                IndexFold::Keys(keys)
            }
        }
        ElementFold { omitted, .. } if omitted => {
            // m[hole]  — a hole reads undefined, keyed 'undefined'
            IndexFold::Keys(vec!["undefined".to_string()])
        }
        _ => IndexFold::Dynamic,
    }
}

/// A chained index: computed chains fold, member chains refuse (SITE-34).
fn fold_index_chain(chain: &oxc_ast::ast::ChainExpression<'_>, scoped: Scoped<'_>) -> IndexFold {
    if let oxc_ast::ast::ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        return fold_index_element(&mem.object, &mem.expression, scoped);
    }
    IndexFold::Dynamic
}

/// A unary index (`sizes[-n]`) with fully folded leaves, else Dynamic.
fn fold_index_unary(unary: &oxc_ast::ast::UnaryExpression<'_>, scoped: Scoped<'_>) -> IndexFold {
    let fold = fold_unary(unary.operator, &unary.argument, scoped);
    if fold.values.is_empty()
        || !fold.refusals.is_empty()
        || !fold.template_refusals.is_empty()
        || !fold.dynamic.is_empty()
    {
        return IndexFold::Dynamic;
    }
    let keys: Vec<String> = fold.values.iter().filter_map(leaf_key).collect();
    if keys.is_empty() {
        IndexFold::Dynamic
    } else {
        IndexFold::Keys(keys)
    }
}

/// A binary index (`m['a'+'b']`) with fully folded leaves, else Dynamic.
///
/// Open branches fan out over every pair; any refused pair, operand, or
/// part refuses the whole index, verbatim v2 (one literal or none).
fn fold_index_binary(bin: &oxc_ast::ast::BinaryExpression<'_>, scoped: Scoped<'_>) -> IndexFold {
    let fold = fold_binary(bin.operator, &bin.left, &bin.right, scoped);
    if !fold.refusals.is_empty()
        || !fold.unary_refusals.is_empty()
        || !fold.template_refusals.is_empty()
        || !fold.dynamic.is_empty()
    {
        return IndexFold::Dynamic;
    }
    match index_keys(&fold.values) {
        Some(keys) if !keys.is_empty() => IndexFold::Keys(keys),
        _ => IndexFold::Dynamic,
    }
}

/// Key spellings for folded leaves, or None when any leaf is not a key.
///
/// A partially keyable index is ambiguous, so it refuses whole instead of
/// guessing — the same single-spelling rule computed keys use.
fn index_keys(leaves: &[AtomValue]) -> Option<Vec<String>> {
    leaves.iter().map(leaf_key).collect()
}

/// The key spelling of one scalar leaf, or None for token references.
fn leaf_key(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(s) => Some(s.to_string()),
        AtomValue::Number(n) => Some(n.to_string()),
        AtomValue::Bool(b) => Some(b.to_string()),
        AtomValue::Null => Some("null".to_string()),
        AtomValue::Token { .. } => None,
    }
}
