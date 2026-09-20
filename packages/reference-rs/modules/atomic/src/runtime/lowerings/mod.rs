//! Lowering steps: the table-shaped half of the naming rules.
//!
//! Each canonical prop with non-identity lowering maps to an ordered step list
//! the runtime interpreter runs before naming. Steps mirror the expansion
//! gates (`trbl` allowlist, border-family trios, radius pairs, flex rewrites,
//! macro emits, runtime-owned drops) and read every literal from the same
//! constants the expansion passes consult, so the table cannot drift from
//! the code. Guards evaluate on the rendered value; first match runs.
//! Steps behind the `extract_raw_val` gate carry `scalar`, so token, bool,
//! and null values fall through exactly like the oracle's `?`.

use serde::{Deserialize, Serialize};

use crate::resolve::shorthands::{border, flex, pair};
use crate::resolve::{container, gradient, size, BORDER_TRUE_MACRO, RUNTIME_OWNED_PROPS};

/// Marker substituting the rendered authored string in an emit pair.
const RENDERED_VALUE: &str = "$";

/// `{eq}` trims unless the step says otherwise; absent means trimmed.
fn trimmed_by_default() -> bool {
    true
}

/// Skip the trim flag on the wire when it holds the default.
fn is_trimmed(trimmed: &bool) -> bool {
    *trimmed
}

/// Skip the scalar flag on the wire when the step is kind-open.
fn is_kind_open(scalar: &bool) -> bool {
    !scalar
}

/// Longhand shape a step fans out to.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Shape {
    /// Four directionals (`padding`, `margin`, `inset`).
    #[serde(rename = "trbl")]
    Trbl,
    /// Width/style/color trio (border family, outline, column/row rules).
    #[serde(rename = "trio")]
    Trio,
    /// Two corners (the six side-radius shorthands).
    #[serde(rename = "pair")]
    Pair,
}

/// Style keyword set a trio step classifies with.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TrioStyle {
    /// Border styles; every trio except `outline`.
    #[serde(rename = "border")]
    Border,
    /// Outline styles: the border set plus `auto`.
    #[serde(rename = "outline")]
    Outline,
}

/// System-data macro a step expands through the fonts table.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MacroName {
    /// `font`: family plus default weight plus ordered extras.
    #[serde(rename = "font")]
    Font,
    /// `weight`: scoped scale, else keyword, else raw.
    #[serde(rename = "weight")]
    Weight,
}

/// One lowering step: shape fan-out, value rewrite, declaration emit, macro,
/// identity-terminate, or drop. Steps run in array order; first match runs.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum LowerStep {
    /// Fan out to longhands: `trbl` on 2–4 tokens, `trio` when reached,
    /// `pair` by unconditional clone.
    Longhands {
        /// Guard evaluated on the rendered value, if any.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        on: Option<Guard>,
        /// Target longhands in emit order.
        longhands: Vec<String>,
        /// Fan-out shape.
        shape: Shape,
        /// Trio style set; present only on trios.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        style: Option<TrioStyle>,
    },
    /// Rewrite one trimmed value to another (`flex` keywords).
    Rewrite {
        /// Guard evaluated on the rendered value, if any.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        on: Option<Guard>,
        /// Exact trimmed value to emitted value.
        rewrite: std::collections::BTreeMap<String, String>,
    },
    /// Emit declarations: literals, or `$` for the rendered value.
    Emit {
        /// Guard evaluated on the rendered value, if any.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        on: Option<Guard>,
        /// String/number values only; absent means every kind runs.
        #[serde(default, skip_serializing_if = "is_kind_open")]
        scalar: bool,
        /// Prop plus literal-or-`$` pairs in emit order.
        emit: Vec<(String, String)>,
    },
    /// Expand through the fonts table (`font`, `weight`).
    Macro {
        /// Guard evaluated on the rendered value, if any.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        on: Option<Guard>,
        /// Which macro the interpreter runs.
        #[serde(rename = "macro")]
        name: MacroName,
    },
    /// Identity-terminate: keep the value whole, try no later step.
    Keep {
        /// Guard evaluated on the rendered value, if any.
        #[serde(default, skip_serializing_if = "Option::is_none")]
        on: Option<Guard>,
        /// String/number values only; absent means every kind runs.
        #[serde(default, skip_serializing_if = "is_kind_open")]
        scalar: bool,
        /// Always true on the wire.
        keep: bool,
    },
    /// Lower to zero declarations (runtime-owned props).
    Drop {
        /// Always true on the wire.
        drop: bool,
    },
}

/// Guard evaluated on the `class_name_str` rendering before a step runs.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Guard {
    /// Rendered equals the string, case-sensitive; trimmed unless the step
    /// opts out. Only `container` opts out: its oracle compares untrimmed.
    Eq {
        /// Expected rendering.
        eq: String,
        /// Compare against the trimmed rendering; absent means trimmed.
        #[serde(default = "trimmed_by_default", skip_serializing_if = "is_trimmed")]
        trimmed: bool,
    },
    /// Trimmed rendered is a member of the keyword set, case-sensitive.
    In {
        /// Keyword set name.
        #[serde(rename = "in")]
        set: String,
    },
    /// Named value-kind predicate.
    Named(NamedGuard),
}

/// Named value-kind predicate.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NamedGuard {
    /// Value is boolean true.
    #[serde(rename = "bool:true")]
    BoolTrue,
    /// Rendered value is the empty string.
    #[serde(rename = "empty")]
    Empty,
    /// Border-family whole predicate: exact `none`, CSS-wide, `var()`,
    /// or `borders.`/`outlines.` prefixes on the trimmed value.
    #[serde(rename = "whole")]
    Whole,
}

/// Build every lowering list keyed by canonical prop: shapes from the
/// expansion gates, then macros, rewrites, emits, and drops.
pub(crate) fn build_lowerings() -> std::collections::BTreeMap<String, Vec<LowerStep>> {
    let mut lowerings = std::collections::BTreeMap::new();
    for prop in canon::CANONICAL_PROPERTIES {
        if let Some(steps) = shape_steps(prop.name) {
            lowerings.insert(prop.name.to_string(), steps);
        }
    }
    insert_macro_steps(&mut lowerings);
    lowerings
}

/// Shape steps for one canonical, mirroring the expansion gates: the `trbl`
/// allowlist, the border-family trio gate, the six radius pairs.
fn shape_steps(canon: &str) -> Option<Vec<LowerStep>> {
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
fn trio_steps(canon: &str, longhands: &[&str]) -> Vec<LowerStep> {
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

/// Macro, rewrite, emit, and drop entries: none of these keys carries a
/// shape, so plain insertion cannot collide with the gate pass above.
fn insert_macro_steps(lowerings: &mut std::collections::BTreeMap<String, Vec<LowerStep>>) {
    lowerings.insert(
        "flex".to_string(),
        vec![LowerStep::Rewrite {
            on: None,
            rewrite: flex::FLEX_KEYWORD_TRIPLES
                .iter()
                .map(|(from, to)| ((*from).to_string(), (*to).to_string()))
                .collect(),
        }],
    );
    lowerings.insert(
        "size".to_string(),
        vec![LowerStep::Emit {
            on: None,
            scalar: false,
            emit: size::EMIT_PROPS
                .iter()
                .map(|prop| ((*prop).to_string(), RENDERED_VALUE.to_string()))
                .collect(),
        }],
    );
    lowerings.insert("container".to_string(), container_steps());
    lowerings.insert(
        "textGradient".to_string(),
        vec![LowerStep::Emit {
            on: None,
            scalar: false,
            emit: vec![
                (gradient::IMAGE_PROP.to_string(), RENDERED_VALUE.to_string()),
                (
                    gradient::CLIP_PROP.to_string(),
                    gradient::CLIP_VALUE.to_string(),
                ),
                (
                    gradient::INK_PROP.to_string(),
                    gradient::INK_VALUE.to_string(),
                ),
            ],
        }],
    );
    lowerings.insert("font".to_string(), vec![macro_step(MacroName::Font)]);
    lowerings.insert("weight".to_string(), vec![macro_step(MacroName::Weight)]);
    for prop in RUNTIME_OWNED_PROPS {
        lowerings.insert((*prop).to_string(), vec![LowerStep::Drop { drop: true }]);
    }
}

/// One unguarded macro step.
fn macro_step(name: MacroName) -> LowerStep {
    LowerStep::Macro { on: None, name }
}

/// `container` guard order: `true`, empty, rendered `"true"`, then default.
/// Bool `false`, null, and numbers fall to default with rendered `$`.
fn container_steps() -> Vec<LowerStep> {
    let bare = vec![(
        container::TYPE_PROP.to_string(),
        container::INLINE_SIZE.to_string(),
    )];
    let mut named = bare.clone();
    named.push((container::NAME_PROP.to_string(), RENDERED_VALUE.to_string()));
    vec![
        LowerStep::Emit {
            on: Some(Guard::Named(NamedGuard::BoolTrue)),
            // Kind-open: `container::lower` reads every value kind.
            scalar: false,
            emit: bare.clone(),
        },
        LowerStep::Emit {
            on: Some(Guard::Named(NamedGuard::Empty)),
            // Kind-open: the empty test runs on every rendering.
            scalar: false,
            emit: bare.clone(),
        },
        LowerStep::Emit {
            on: Some(Guard::Eq {
                eq: container::BARE_VALUE.to_string(),
                // Untrimmed: `container::lower` compares the raw rendering.
                trimmed: false,
            }),
            // Kind-open: `false`, `null`, and tokens test `true` too.
            scalar: false,
            emit: bare,
        },
        LowerStep::Emit {
            on: None,
            scalar: false,
            emit: named,
        },
    ]
}

#[cfg(test)]
mod tests;
