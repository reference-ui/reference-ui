//! Literal extraction helpers for strings, numbers, and booleans.
//!
//! Parses primitive JavaScript literal AST nodes encountered during style property
//! traversal, strips inline `!important` markers, and records structured `Want` declarations
//! onto the active expression-walk context.

use oxc_ast::ast::{BooleanLiteral, NumericLiteral, StringLiteral, TemplateLiteral};
use smallvec::SmallVec;

use super::walk::ExpressionWalk;
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;

/// Extract string literal value, honoring inline important flags.
pub fn push_string_want(
    ctx: &mut ExpressionWalk<'_>,
    lit: &StringLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // '2r' / "blue.600" / '2r!' / '1r!important'
    let raw = lit.value.as_str();
    let (val, is_imp) = split_important_flag(raw);
    ctx.push_want(
        AtomValue::String(val.into()),
        when.clone(),
        is_imp,
        Some(lit.span),
    );
}

/// Extract numeric literal value as a string representation.
pub fn push_number_want(
    ctx: &mut ExpressionWalk<'_>,
    lit: &NumericLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // opacity={0.5}
    let val = lit.value.to_string();
    ctx.push_want(
        AtomValue::Number(val.into_boxed_str()),
        when.clone(),
        false,
        Some(lit.span),
    );
}

/// Extract boolean literal value.
pub fn push_bool_want(
    ctx: &mut ExpressionWalk<'_>,
    lit: &BooleanLiteral,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // truncate={false}
    ctx.push_want(
        AtomValue::Bool(lit.value),
        when.clone(),
        false,
        Some(lit.span),
    );
}

/// Strip `!important` or trailing `!` from a value string.
pub fn split_important_flag(val: &str) -> (&str, bool) {
    if let Some(stripped) = strip_important_suffix(val) {
        // '1r!important' / '0 !important' / 'red!IMPORTANT'
        (stripped.trim_end(), true)
    } else if val.len() > 1 && val.ends_with('!') {
        // '2r!'
        (&val[..val.len() - 1], true)
    } else {
        (val, false)
    }
}

/// Strip a case-insensitive `!important` suffix, if present.
fn strip_important_suffix(val: &str) -> Option<&str> {
    const MARKER: &str = "!important";
    let head_len = val.len().checked_sub(MARKER.len())?;
    let tail = val.get(head_len..)?;
    if tail.eq_ignore_ascii_case(MARKER) {
        val.get(..head_len)
    } else {
        None
    }
}

/// Extract static template literals or emit a diagnostic for dynamic expressions.
pub fn extract_template_literal(
    ctx: &mut ExpressionWalk<'_>,
    lit: &TemplateLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if lit.expressions.is_empty() {
        if let Some(quasi) = lit.quasis.first() {
            // `2r`
            let (val, is_imp) = split_important_flag(&quasi.value.raw);
            ctx.push_want(
                AtomValue::String(val.into()),
                when.clone(),
                is_imp,
                Some(quasi.span),
            );
            return;
        }
    }
    // `2${n}r`
    let prop = ctx.prop;
    ctx.warn(
        lit.span,
        DiagnosticCode::DynamicTemplate,
        format!("Dynamic non-literal template expression for prop '{prop}'"),
    );
}
