//! Harvest value classifier: rhythm first, then the canon alphabet.
//!
//! A harvested string is information only when it is a complete value: a
//! rhythm literal or a complete CSS value. Rhythm rides the Length channel,
//! since it lowers to `calc()` over `--spacing-root`.

use canon::ValueKind;

use crate::resolve::rhythm::resolve_single_rhythm;

/// The harvest kind of a complete source value, or None when the string is
/// not information: a token path, a bare word, braces, a fragment, or a
/// dimension that is not a length (angles, times, and flex belong to
/// specialist props, never to the Length channel's sinks).
pub fn classify_harvest_value(value: &str) -> Option<ValueKind> {
    let text = value.trim();
    if text.is_empty() {
        return None;
    }
    if is_rhythm_value(text) {
        return Some(ValueKind::Length);
    }
    match canon::classify_css_value(text) {
        Some(ValueKind::Length) if has_non_length_unit(text) => None,
        kind => kind,
    }
}

/// Angle, time, and flex units from canon's dimension table: valid alphabet
/// on specialist props (`rotate`, `transitionDuration`) but invalid CSS on
/// length props, so harvest does not deal them (`margin: 45deg` would fail
/// ATM-VALID-02). The site path is untouched.
const NON_LENGTH_UNITS: &[&str] = &["deg", "fr", "ms", "rad", "s", "turn"];

/// True when the value is a number in an angle, time, or flex unit.
fn has_non_length_unit(text: &str) -> bool {
    let lower = text.to_ascii_lowercase();
    NON_LENGTH_UNITS.iter().any(|unit| {
        lower
            .strip_suffix(unit)
            .is_some_and(|num| !num.is_empty() && num.parse::<f64>().is_ok_and(f64::is_finite))
    })
}

/// True for a rhythm literal: one `Nr` word, or a whitespace list whose
/// every word is rhythm or a plain CSS length (`4r 2r`, `1px 1/3r`) with at
/// least one rhythm word. Anything else is not a complete rhythm value, even
/// when the lowering would pass it through — harvest mints wholes, never
/// fragments.
fn is_rhythm_value(text: &str) -> bool {
    let mut saw_rhythm = false;
    for word in text.split_whitespace() {
        if resolve_single_rhythm(word).is_some() {
            saw_rhythm = true;
        } else if canon::css::values::is_length(word) && !has_non_length_unit(word) {
            continue;
        } else {
            return false;
        }
    }
    saw_rhythm
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rhythm_singles_and_lists_classify_length() {
        for val in ["1r", "2r", "0.5r", "1/3r", "-4r", "4r 2r", "1px 1/3r"] {
            assert_eq!(
                classify_harvest_value(val),
                Some(ValueKind::Length),
                "{val}"
            );
        }
    }

    #[test]
    fn canon_values_keep_their_kind() {
        assert_eq!(
            classify_harvest_value("red"),
            Some(ValueKind::Color),
            "named color"
        );
        assert_eq!(
            classify_harvest_value("#0af"),
            Some(ValueKind::Color),
            "hex"
        );
        assert_eq!(
            classify_harvest_value("translateX(1.25rem)"),
            Some(ValueKind::Transform),
            "transform"
        );
        assert_eq!(classify_harvest_value("auto"), Some(ValueKind::Keyword));
    }

    #[test]
    fn non_values_reject() {
        for val in [
            "",
            "   ",
            "hello",
            "sm",
            "ui.button.mutedBackground",
            "gray.800",
            "full",
            "1px solid 1/3r",
            "1px 2px",
            "hello 1r",
            "{colors.gray.800}",
            "red!",
            "45deg",
            "2s",
            "100ms",
            "1fr",
            "0.5turn",
            "45deg 1r",
        ] {
            assert_eq!(classify_harvest_value(val), None, "{val}");
        }
    }
}
