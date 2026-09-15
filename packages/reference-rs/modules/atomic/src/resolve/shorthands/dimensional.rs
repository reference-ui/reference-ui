//! Directional dimensional shorthand expansion pass.
//! Unrolls composite box-model dimensional properties such as `padding`, `margin`, and `inset` into explicit directional longhands.
//! Resolves standard 1, 2, 3, and 4-value CSS shorthand patterns to ensure deterministic utility ordering.

use super::parser::{is_global_keyword, split_tokens};
use crate::atom::AtomValue;

/// Expand dimensional shorthand into 4 directional longhands.
pub fn expand_dimensional_shorthand(
    prop: &str,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    // padding: '1r 2r'  /  margin: '1px 2px 3px 4px'
    let canon_name = canon::resolve_canonical_prop(prop);
    let longhands = canon::native_longhands_for_prop(canon_name)?;
    if longhands.len() != 4 {
        return None;
    }
    let top = longhands[0];
    let right = longhands[1];
    let bottom = longhands[2];
    let left = longhands[3];

    let trimmed = raw_val.trim();

    if is_global_keyword(trimmed) {
        // padding: 'inherit'
        return Some(vec![(canon_name.into(), AtomValue::String(trimmed.into()))]);
    }

    let tokens = split_tokens(trimmed);
    expand_by_token_count(&[top, right, bottom, left], &tokens)
}

fn expand_by_token_count(lh: &[&str; 4], tokens: &[String]) -> Option<Vec<(Box<str>, AtomValue)>> {
    match tokens.len() {
        1 => {
            // padding: '1r'
            Some(expand_single(lh, &tokens[0]))
        }
        2 => {
            // padding: '1r 2r'
            Some(expand_two(lh, &tokens[0], &tokens[1]))
        }
        3 => {
            // padding: '1r 2r 3r'
            Some(expand_three(lh, &tokens[0], &tokens[1], &tokens[2]))
        }
        4 => {
            // padding: '1px 2px 3px 4px'
            Some(expand_four(lh, tokens))
        }
        _ => None,
    }
}

fn expand_single(lh: &[&str; 4], val: &str) -> Vec<(Box<str>, AtomValue)> {
    // padding: '1r' → all four sides
    vec![
        (lh[0].into(), AtomValue::String(val.into())),
        (lh[1].into(), AtomValue::String(val.into())),
        (lh[2].into(), AtomValue::String(val.into())),
        (lh[3].into(), AtomValue::String(val.into())),
    ]
}

fn expand_two(lh: &[&str; 4], v_tb: &str, v_lr: &str) -> Vec<(Box<str>, AtomValue)> {
    // padding: '1r 2r' → top/bottom, left/right
    vec![
        (lh[0].into(), AtomValue::String(v_tb.into())),
        (lh[1].into(), AtomValue::String(v_lr.into())),
        (lh[2].into(), AtomValue::String(v_tb.into())),
        (lh[3].into(), AtomValue::String(v_lr.into())),
    ]
}

fn expand_three(lh: &[&str; 4], top: &str, lr: &str, bottom: &str) -> Vec<(Box<str>, AtomValue)> {
    // padding: '1r 2r 3r'
    vec![
        (lh[0].into(), AtomValue::String(top.into())),
        (lh[1].into(), AtomValue::String(lr.into())),
        (lh[2].into(), AtomValue::String(bottom.into())),
        (lh[3].into(), AtomValue::String(lr.into())),
    ]
}

fn expand_four(lh: &[&str; 4], tokens: &[String]) -> Vec<(Box<str>, AtomValue)> {
    // padding: '1px 2px 3px 4px'
    vec![
        (lh[0].into(), AtomValue::String(tokens[0].clone().into())),
        (lh[1].into(), AtomValue::String(tokens[1].clone().into())),
        (lh[2].into(), AtomValue::String(tokens[2].clone().into())),
        (lh[3].into(), AtomValue::String(tokens[3].clone().into())),
    ]
}
