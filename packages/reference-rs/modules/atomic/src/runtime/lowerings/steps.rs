//! Step-list constructors behind the shaped lowerings: `shape_steps` dispatches a canonical prop to its trbl, border-family trio, or radius-pair list.
//! The smaller builders emit the individual keep, emit, and named-guard steps that the trio and radius tables reuse, reading every literal from the expansion-gate modules so the lists cannot drift.

use super::{Guard, LowerStep, NamedGuard, Shape, TrioStyle};
use crate::resolve::shorthands::{border, pair};
use crate::resolve::BORDER_TRUE_MACRO;

/// Shape steps for one canonical, mirroring the expansion gates: the `trbl`
/// allowlist, the border-family trio gate, the six radius pairs.
pub(super) fn shape_steps(canon: &str) -> Option<Vec<LowerStep>> {
    if crate::resolve::shorthands::is_dimensional_trbl(canon) {
        return trbl_steps(canon);
    }
    let longhands = canon::native_longhands_for_prop(canon)?;
    if border::is_border_family(longhands) {
        return Some(trio_steps(canon, longhands));
    }
    if pair::is_radius_pair(canon) && longhands.len() == 2 {
        return Some(vec![pair_step(longhands)]);
    }
    None
}

/// `trbl` fan-out over the canon directionals in emit order.
fn trbl_steps(canon: &str) -> Option<Vec<LowerStep>> {
    let longhands = canon::native_longhands_for_prop(canon)?;
    let [top, right, bottom, left] = longhands else {
        return None;
    };
    Some(vec![LowerStep::Longhands {
        on: None,
        longhands: vec![
            (*top).to_string(),
            (*right).to_string(),
            (*bottom).to_string(),
            (*left).to_string(),
        ],
        shape: Shape::Trbl,
        style: None,
    }])
}

/// Trio step list: `border:true` macro first, then the zero gate, the
/// outline ring, the whole-keep, and the classifying trio fan-out.
pub(super) fn trio_steps(canon: &str, longhands: &[&str]) -> Vec<LowerStep> {
    let [width, style, color] = longhands else {
        return Vec::new();
    };
    let mut steps = Vec::new();
    if canon == "border" {
        steps.push(bool_true_macro_step());
    }
    steps.push(zero_emit_step(width));
    if border::is_outline_prop(canon) {
        steps.push(outline_none_step(canon));
    }
    steps.push(whole_keep_step());
    steps.push(LowerStep::Longhands {
        on: None,
        longhands: vec![
            (*width).to_string(),
            (*style).to_string(),
            (*color).to_string(),
        ],
        shape: Shape::Trio,
        style: Some(if border::is_outline_prop(canon) {
            TrioStyle::Outline
        } else {
            TrioStyle::Border
        }),
    });
    steps
}

/// The `border: true` macro as the first trio step.
fn bool_true_macro_step() -> LowerStep {
    LowerStep::Emit {
        on: Some(Guard::Named(NamedGuard::BoolTrue)),
        scalar: false,
        emit: BORDER_TRUE_MACRO
            .iter()
            .map(|(prop, value)| ((*prop).to_string(), (*value).to_string()))
            .collect(),
    }
}

/// The zero gate: closed spellings emit a `0px` width.
fn zero_emit_step(width_prop: &str) -> LowerStep {
    LowerStep::Emit {
        on: Some(Guard::In {
            set: "zeroBorder".to_string(),
        }),
        // Behind `extract_raw_val`: token, bool, and null never emit here.
        scalar: true,
        emit: vec![(
            width_prop.to_string(),
            border::ZERO_BORDER_WIDTH.to_string(),
        )],
    }
}

/// The `outline: 'none'` ring plus offset.
fn outline_none_step(canon: &str) -> LowerStep {
    LowerStep::Emit {
        on: Some(Guard::Eq {
            eq: "none".to_string(),
            trimmed: true,
        }),
        // Behind `extract_raw_val`: a token rendering `none` passes through.
        scalar: true,
        emit: vec![
            (canon.to_string(), border::OUTLINE_NONE_VALUE.to_string()),
            (
                border::OUTLINE_OFFSET_PROP.to_string(),
                border::OUTLINE_NONE_OFFSET.to_string(),
            ),
        ],
    }
}

/// Whole values stop here instead of reaching the trio fan-out.
fn whole_keep_step() -> LowerStep {
    LowerStep::Keep {
        on: Some(Guard::Named(NamedGuard::Whole)),
        // Behind `extract_raw_val` with the guarded emits above.
        scalar: true,
        keep: true,
    }
}

/// Radius pair fan-out over the canon corners in emit order.
fn pair_step(longhands: &[&str]) -> LowerStep {
    LowerStep::Longhands {
        on: None,
        longhands: longhands.iter().map(|name| (*name).to_string()).collect(),
        shape: Shape::Pair,
        style: None,
    }
}

