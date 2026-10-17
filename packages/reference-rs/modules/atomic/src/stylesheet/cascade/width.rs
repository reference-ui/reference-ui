//! Size-query parsing for cascade sort keys: `parse_width_key` ranks an at-rule query as none, min-width, or max-width.
//! `parse_milli_px` converts a length with a px, em, or rem unit into millipixels, the unit the sort compares.
//! The width rank is the only query-derived fact the sort key reads, so the query text never reaches `CascadeKey`.

/// Size-query rank. `kind` is none/min/max; `milli` is millipx, negated for max-width.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd)]
pub(super) struct WidthKey {
    kind: u8,
    milli: i32,
}

pub(super) fn parse_width_key(query: &str) -> WidthKey {
    if let Some(rest) = after_feature(query, "min-width:") {
        return WidthKey {
            kind: 1,
            milli: parse_milli_px(rest).unwrap_or(0),
        };
    }
    if let Some(rest) = after_feature(query, "max-width:") {
        return WidthKey {
            kind: 2,
            milli: -parse_milli_px(rest).unwrap_or(0),
        };
    }
    WidthKey { kind: 0, milli: 0 }
}

fn after_feature<'a>(query: &'a str, feature: &str) -> Option<&'a str> {
    let idx = query.find(feature)?;
    Some(&query[idx + feature.len()..])
}

pub(super) fn parse_milli_px(input: &str) -> Option<i32> {
    let s = input.trim_start();
    let (num, unit) = split_number_and_unit(s)?;
    let milli = digits_to_milli(num)?;
    scale_unit(milli, unit)
}

fn split_number_and_unit(s: &str) -> Option<(&str, &str)> {
    let digit_end = s.find(|c: char| !c.is_ascii_digit()).unwrap_or(s.len());
    if digit_end == 0 {
        return None;
    }
    let num = &s[..digit_end];
    let rest = s[digit_end..].trim_start();
    let unit_len = rest
        .find(|c: char| !c.is_ascii_alphabetic())
        .unwrap_or(rest.len());
    Some((num, &rest[..unit_len]))
}

fn digits_to_milli(num: &str) -> Option<i32> {
    num.parse::<i32>().ok()?.checked_mul(1000)
}

fn scale_unit(milli: i32, unit: &str) -> Option<i32> {
    match unit {
        "" | "px" => Some(milli),
        "em" | "rem" => milli.checked_mul(16),
        _ => Some(milli),
    }
}
