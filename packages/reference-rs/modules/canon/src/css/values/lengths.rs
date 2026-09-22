//! CSS length recognizer: a number with a unit, or unitless zero.
//!
//! Seeded from atomic's `is_length_width` unit list, extended to the mission's
//! table (viewport, container, font-relative, angle, time, and `fr` units).
//! Rhythm (`r`, fractions) is deliberately absent: `Nr` is atomic's grammar,
//! not CSS, and bare nonzero numbers are unit-stage business, not lengths.

/// CSS units accepted after a number, sorted for binary search.
const LENGTH_UNITS: &[&str] = &[
    "%", "cap", "ch", "cqb", "cqh", "cqi", "cqmax", "cqmin", "cqw", "deg", "dvh", "em", "ex", "fr",
    "ic", "lh", "lvh", "ms", "pc", "pt", "px", "rad", "rem", "rlh", "s", "svh", "turn", "vh",
    "vmax", "vmin", "vw",
];

/// True when `value` is a CSS length: unitless zero or a finite number plus unit.
pub fn is_length(value: &str) -> bool {
    // No lowercase: the f64 grammar is ASCII case-insensitive (E/inf/nan),
    // so parsing the raw slice decides identically; units fold per suffix.
    let text = value.trim();
    if text.is_empty() {
        return false;
    }
    if is_zero_number(text) {
        return true;
    }
    LENGTH_UNITS
        .iter()
        .any(|unit| strip_unit_suffix(text, unit).is_some_and(is_plain_number))
}

/// Strips an ASCII unit suffix case-insensitively, without allocating.
/// `get` refuses non-boundary splits, so non-ASCII tails miss, never panic.
fn strip_unit_suffix<'a>(text: &'a str, unit: &str) -> Option<&'a str> {
    let prefix_len = text.len().checked_sub(unit.len())?;
    if text
        .get(prefix_len..)
        .is_some_and(|tail| tail.eq_ignore_ascii_case(unit))
    {
        text.get(..prefix_len)
    } else {
        None
    }
}

/// True when the whole string is a finite number equal to zero.
fn is_zero_number(text: &str) -> bool {
    text.parse::<f64>().is_ok_and(|num| num == 0.0)
}

/// True when the whole string is a finite plain number (signs, decimals,
/// exponents); rejects `inf`, `NaN`, and anything with leftover text.
fn is_plain_number(text: &str) -> bool {
    !text.is_empty() && text.parse::<f64>().is_ok_and(f64::is_finite)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn table_is_sorted_for_binary_search() {
        let mut sorted = LENGTH_UNITS.to_vec();
        sorted.sort_unstable();
        assert_eq!(sorted, LENGTH_UNITS);
    }

    #[test]
    fn seed_absolute_units_survive() {
        // `pt` and `pc` come from the `is_length_width` seed; the mission
        // table omits them, but they are real lengths, so the fence honors them.
        assert!(is_length("12pt"));
        assert!(is_length("1pc"));
    }

    #[test]
    fn mission_examples_classify() {
        for val in [
            "13px", "1.25rem", "50%", "2vw", "0", "-4px", "+.5em", "45deg", "2s", "1fr",
        ] {
            assert!(is_length(val), "{val} is a length");
        }
        assert!(is_length("0.0"));
    }

    #[test]
    fn rhythm_and_bare_numbers_refuse() {
        for val in [
            "13r", "1/3r", "4", "-2", "1.5", "", "px", "red", "auto", "inf", "NaN", "1.5.2px",
        ] {
            assert!(!is_length(val), "{val} is not a length");
        }
    }
}
