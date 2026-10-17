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

mod macros;
mod steps;

use serde::{Deserialize, Serialize};

use self::macros::insert_macro_steps;
use self::steps::shape_steps;

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

#[cfg(test)]
mod tests;
