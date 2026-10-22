//! Range-key grammar over a breakpoint scale: `<name>Down`, `<name>Only` and
//! `<from>To<To>`. Typegen prints a range key only where this shape reads it back,
//! and atomic's extract reads a condition key with the same test, so the two sides
//! cannot disagree on what a range is. `range_shape` is the syntax: `Down` and `Only`
//! strip a suffix first, otherwise the first `To` divides. `is_breakpoint_range_key`
//! checks the parts against the scale; order, `base` and widths stay with resolve.

use crate::BreakpointScale;

/// A range key split into its parts. `Down` and `Only` carry one scale name;
/// `Between` carries the `from` and `to` spellings exactly as the key writes them.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RangeShape<'a> {
    Down(&'a str),
    Only(&'a str),
    Between(&'a str, &'a str),
}

/// Syntactic split of a range key; suffix arms never retry as a `To` split.
pub fn range_shape(raw: &str) -> Option<RangeShape<'_>> {
    if let Some(bp) = raw.strip_suffix("Down") {
        return Some(RangeShape::Down(bp));
    }
    if let Some(bp) = raw.strip_suffix("Only") {
        return Some(RangeShape::Only(bp));
    }
    raw.split_once("To")
        .map(|(from, to)| RangeShape::Between(from, to))
}

/// True when `raw` has range shape over scale names: `Down`/`Only` stems match
/// exactly, `To` sides fold ASCII case (mirrors `modules/atomic/js/namer/when.ts`).
/// Order, `base` and width checks stay in atomic's `breakpoint_range`.
pub fn is_breakpoint_range_key(raw: &str, scale: &BreakpointScale) -> bool {
    let names = scale.names();
    match range_shape(raw) {
        Some(RangeShape::Down(bp) | RangeShape::Only(bp)) => names.iter().any(|n| n == bp),
        Some(RangeShape::Between(from, to)) => {
            names.iter().any(|n| n.eq_ignore_ascii_case(from))
                && names.iter().any(|n| n.eq_ignore_ascii_case(to))
        }
        None => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scale(names: &[&str]) -> BreakpointScale {
        BreakpointScale::from_names(names.iter().copied())
    }

    #[test]
    fn suffixes_split_before_to() {
        assert_eq!(range_shape("mdDown"), Some(RangeShape::Down("md")));
        assert_eq!(range_shape("mdOnly"), Some(RangeShape::Only("md")));
        assert_eq!(range_shape("smToLg"), Some(RangeShape::Between("sm", "Lg")));
        assert_eq!(
            range_shape("smToWideDown"),
            Some(RangeShape::Down("smToWide"))
        );
        assert_eq!(range_shape("xToToY"), Some(RangeShape::Between("x", "ToY")));
        assert_eq!(range_shape("sm"), None);
    }

    #[test]
    fn range_needs_scale_names_on_both_sides() {
        let names = scale(&["xTo", "y", "wideDown"]);
        assert!(is_breakpoint_range_key("xToDown", &names));
        assert!(is_breakpoint_range_key("xToOnly", &names));
        assert!(is_breakpoint_range_key("wideDownToy", &names));
        assert!(
            !is_breakpoint_range_key("xToToY", &names),
            "first To splits off x"
        );
        assert!(
            !is_breakpoint_range_key("smToWideDown", &names),
            "Down suffix wins"
        );
        assert!(!is_breakpoint_range_key("srOnly", &names));
    }
}
