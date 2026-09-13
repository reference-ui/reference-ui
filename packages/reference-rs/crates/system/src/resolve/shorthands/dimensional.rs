//! Directional dimensional shorthand expansion pass.
//! Unrolls composite box-model dimensional properties such as `padding`, `margin`, and `inset` into explicit directional longhands.
//! Resolves standard 1, 2, 3, and 4-value CSS shorthand patterns to ensure deterministic utility ordering.

use crate::atom::AtomValue;
use super::parser::{is_global_keyword, split_tokens};

#[derive(Clone, Copy)]
struct DimensionalProps {
    top: &'static str,
    right: &'static str,
    bottom: &'static str,
    left: &'static str,
}

const DIMENSIONAL_CONFIGS: &[(&str, DimensionalProps)] = &[
    (
        "padding",
        DimensionalProps {
            top: "paddingTop",
            right: "paddingRight",
            bottom: "paddingBottom",
            left: "paddingLeft",
        },
    ),
    (
        "margin",
        DimensionalProps {
            top: "marginTop",
            right: "marginRight",
            bottom: "marginBottom",
            left: "marginLeft",
        },
    ),
    (
        "inset",
        DimensionalProps {
            top: "top",
            right: "right",
            bottom: "bottom",
            left: "left",
        },
    ),
];

fn lookup_dimensional_props(prop: &str) -> Option<DimensionalProps> {
    for (name, cfg) in DIMENSIONAL_CONFIGS {
        if *name == prop {
            return Some(*cfg);
        }
    }
    None
}

/// Expand dimensional shorthand into 4 directional longhands.
pub fn expand_dimensional_shorthand(
    prop: &str,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    let cfg = lookup_dimensional_props(prop)?;
    let trimmed = raw_val.trim();

    if is_global_keyword(trimmed) {
        return Some(vec![(prop.into(), AtomValue::String(trimmed.into()))]);
    }

    let tokens = split_tokens(trimmed);
    expand_by_token_count(&cfg, &tokens)
}

fn expand_by_token_count(
    cfg: &DimensionalProps,
    tokens: &[String],
) -> Option<Vec<(Box<str>, AtomValue)>> {
    match tokens.len() {
        1 => Some(expand_single(cfg, &tokens[0])),
        2 => Some(expand_two(cfg, &tokens[0], &tokens[1])),
        3 => Some(expand_three(cfg, &tokens[0], &tokens[1], &tokens[2])),
        4 => Some(expand_four(cfg, tokens)),
        _ => None,
    }
}

fn expand_single(cfg: &DimensionalProps, val: &str) -> Vec<(Box<str>, AtomValue)> {
    vec![
        (cfg.top.into(), AtomValue::String(val.into())),
        (cfg.right.into(), AtomValue::String(val.into())),
        (cfg.bottom.into(), AtomValue::String(val.into())),
        (cfg.left.into(), AtomValue::String(val.into())),
    ]
}

fn expand_two(
    cfg: &DimensionalProps,
    v_tb: &str,
    v_lr: &str,
) -> Vec<(Box<str>, AtomValue)> {
    vec![
        (cfg.top.into(), AtomValue::String(v_tb.into())),
        (cfg.right.into(), AtomValue::String(v_lr.into())),
        (cfg.bottom.into(), AtomValue::String(v_tb.into())),
        (cfg.left.into(), AtomValue::String(v_lr.into())),
    ]
}

fn expand_three(
    cfg: &DimensionalProps,
    top: &str,
    lr: &str,
    bottom: &str,
) -> Vec<(Box<str>, AtomValue)> {
    vec![
        (cfg.top.into(), AtomValue::String(top.into())),
        (cfg.right.into(), AtomValue::String(lr.into())),
        (cfg.bottom.into(), AtomValue::String(bottom.into())),
        (cfg.left.into(), AtomValue::String(lr.into())),
    ]
}

fn expand_four(
    cfg: &DimensionalProps,
    tokens: &[String],
) -> Vec<(Box<str>, AtomValue)> {
    vec![
        (cfg.top.into(), AtomValue::String(tokens[0].clone().into())),
        (cfg.right.into(), AtomValue::String(tokens[1].clone().into())),
        (cfg.bottom.into(), AtomValue::String(tokens[2].clone().into())),
        (cfg.left.into(), AtomValue::String(tokens[3].clone().into())),
    ]
}
