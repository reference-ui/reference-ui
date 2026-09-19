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

/// Extract template literals through the shared fold node: every joined
/// string becomes its own want, and each unfoldable part warns at its span.
pub fn extract_template_literal(
    ctx: &mut ExpressionWalk<'_>,
    lit: &TemplateLiteral<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_template(lit, ctx.scopes);
    for value in &fold.values {
        // `2r`  /  `${n}px`  /  `linear-gradient(${a}, ${b})`
        let (val, is_imp) = split_important_flag(value);
        ctx.push_want(
            AtomValue::String(val.into()),
            when.clone(),
            is_imp,
            Some(lit.span),
        );
    }
    for refusal in &fold.refusals {
        // `2${n}r` over a dynamic `n` — the part, not the template, is named
        ctx.warn(
            refusal.span(),
            DiagnosticCode::DynamicTemplate,
            refusal.message(ctx.prop),
        );
    }
}
