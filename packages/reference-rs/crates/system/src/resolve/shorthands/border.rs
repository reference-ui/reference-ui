//! Composite border and outline shorthand decomposition pass.
//! Unrolls composite style props like `borderBottom` and `outline` into orthogonal width, style, and color longhands.
//! Strictly guards against the CSS reset-to-currentColor anomaly by never synthesizing default colors for omitted components.

use crate::atom::AtomValue;
use super::parser::{
    is_global_keyword, parse_shorthand_tokens, split_tokens, ParsedShorthand,
};

#[derive(Clone, Copy)]
struct BorderProps {
    main: &'static str,
    width: &'static str,
    style: &'static str,
    color: &'static str,
    is_outline: bool,
}

const BORDER_CONFIGS: &[(&str, BorderProps)] = &[
    (
        "border",
        BorderProps {
            main: "border",
            width: "borderWidth",
            style: "borderStyle",
            color: "borderColor",
            is_outline: false,
        },
    ),
    (
        "borderTop",
        BorderProps {
            main: "borderTop",
            width: "borderTopWidth",
            style: "borderTopStyle",
            color: "borderTopColor",
            is_outline: false,
        },
    ),
    (
        "borderRight",
        BorderProps {
            main: "borderRight",
            width: "borderRightWidth",
            style: "borderRightStyle",
            color: "borderRightColor",
            is_outline: false,
        },
    ),
    (
        "borderBottom",
        BorderProps {
            main: "borderBottom",
            width: "borderBottomWidth",
            style: "borderBottomStyle",
            color: "borderBottomColor",
            is_outline: false,
        },
    ),
    (
        "borderLeft",
        BorderProps {
            main: "borderLeft",
            width: "borderLeftWidth",
            style: "borderLeftStyle",
            color: "borderLeftColor",
            is_outline: false,
        },
    ),
    (
        "borderInline",
        BorderProps {
            main: "borderInline",
            width: "borderInlineWidth",
            style: "borderInlineStyle",
            color: "borderInlineColor",
            is_outline: false,
        },
    ),
    (
        "borderX",
        BorderProps {
            main: "borderInline",
            width: "borderInlineWidth",
            style: "borderInlineStyle",
            color: "borderInlineColor",
            is_outline: false,
        },
    ),
    (
        "borderBlock",
        BorderProps {
            main: "borderBlock",
            width: "borderBlockWidth",
            style: "borderBlockStyle",
            color: "borderBlockColor",
            is_outline: false,
        },
    ),
    (
        "borderY",
        BorderProps {
            main: "borderBlock",
            width: "borderBlockWidth",
            style: "borderBlockStyle",
            color: "borderBlockColor",
            is_outline: false,
        },
    ),
    (
        "outline",
        BorderProps {
            main: "outline",
            width: "outlineWidth",
            style: "outlineStyle",
            color: "outlineColor",
            is_outline: true,
        },
    ),
];

fn lookup_border_props(prop: &str) -> Option<BorderProps> {
    for (name, cfg) in BORDER_CONFIGS {
        if *name == prop {
            return Some(*cfg);
        }
    }
    None
}

fn is_zero_value(raw: &str) -> bool {
    let trimmed = raw.trim();
    trimmed == "0"
        || trimmed == "0px"
        || trimmed == "0rem"
        || trimmed == "0em"
        || trimmed == "0%"
}

fn is_whole_value(raw: &str) -> bool {
    let lower = raw.trim().to_ascii_lowercase();
    is_global_keyword(&lower)
        || (lower.starts_with("var(") && lower.ends_with(')'))
        || lower.starts_with("borders.")
        || lower.starts_with("outlines.")
}

/// Decompose composite border or outline declaration into atomic longhands.
pub fn expand_border_shorthand(
    prop: &str,
    raw_val: &str,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    let cfg = lookup_border_props(prop)?;
    let trimmed = raw_val.trim();

    if is_zero_value(trimmed) {
        return Some(vec![(
            cfg.width.into(),
            AtomValue::String("0px".into()),
        )]);
    }

    if trimmed == "none" || is_whole_value(trimmed) {
        return Some(vec![(
            cfg.main.into(),
            AtomValue::String(trimmed.into()),
        )]);
    }

    let tokens = split_tokens(trimmed);
    if tokens.is_empty() {
        return None;
    }

    let parsed = parse_shorthand_tokens(&tokens, cfg.is_outline);
    build_expanded_atoms(&cfg, &parsed)
}

fn build_expanded_atoms(
    cfg: &BorderProps,
    parsed: &ParsedShorthand,
) -> Option<Vec<(Box<str>, AtomValue)>> {
    if parsed.width.is_none() && parsed.style.is_none() && parsed.color.is_none() {
        return None;
    }

    let mut out = Vec::new();
    if let Some(w) = &parsed.width {
        out.push((cfg.width.into(), AtomValue::String(w.clone().into())));
    }
    if let Some(s) = &parsed.style {
        out.push((cfg.style.into(), AtomValue::String(s.clone().into())));
    }
    if let Some(c) = &parsed.color {
        out.push((cfg.color.into(), AtomValue::String(c.clone().into())));
    }

    Some(out)
}
