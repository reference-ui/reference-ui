//! Leaf literal extraction helpers for strings, numbers, and booleans.
//!
//! Parses primitive JavaScript literal AST nodes encountered during style property
//! traversal, strips inline `!important` markers, and records structured `Want` declarations
//! onto the active leaf-walk context.

use oxc_ast::ast::{NumericLiteral, StringLiteral, TemplateLiteral};
use smallvec::SmallVec;

use super::walk::LeafWalk;
use crate::atom::AtomValue;

/// Extract string literal value, honoring inline important flags.
pub fn push_string_want(
    ctx: &mut LeafWalk<'_>,
    lit: &StringLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let raw = lit.value.as_str();
    let (val, is_imp) = split_important_flag(raw);
    ctx.push_want(AtomValue::String(val.into()), when.clone(), is_imp);
}

/// Extract numeric literal value as a string representation.
pub fn push_number_want(
    ctx: &mut LeafWalk<'_>,
    lit: &NumericLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let val = lit.value.to_string();
    ctx.push_want(AtomValue::Number(val.into_boxed_str()), when.clone(), false);
}

/// Extract boolean literal value.
pub fn push_bool_want(
    ctx: &mut LeafWalk<'_>,
    val: bool,
    when: &SmallVec<[Box<str>; 2]>,
) {
    ctx.push_want(AtomValue::Bool(val), when.clone(), false);
}

/// Strip `!important` or trailing `!` from a value string.
pub fn split_important_flag(val: &str) -> (&str, bool) {
    if let Some(stripped) = val.strip_suffix("!important") {
        (stripped.trim_end(), true)
    } else if val.len() > 1 && val.ends_with('!') {
        (&val[..val.len() - 1], true)
    } else {
        (val, false)
    }
}

/// Extract static template literals or emit a diagnostic for dynamic expressions.
pub fn extract_template_literal(
    ctx: &mut LeafWalk<'_>,
    lit: &TemplateLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if lit.expressions.is_empty() {
        if let Some(quasi) = lit.quasis.first() {
            let (val, is_imp) = split_important_flag(&quasi.value.raw);
            ctx.push_want(AtomValue::String(val.into()), when.clone(), is_imp);
            return;
        }
    }
    let prop = ctx.prop;
    ctx.warn(format!(
        "Dynamic non-literal template expression for prop '{prop}'"
    ));
}
