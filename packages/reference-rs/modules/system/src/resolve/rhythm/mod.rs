//! Rhythm calculation engine for resolving Reference UI `r` unit dimensions into absolute or relative CSS values.
//! Translates base grid units and fractional rhythm steps into standard `var(--spacing-root)` and `calc()` expressions.
//! Guarantees vertical rhythm consistency and spatial rhythm alignment across design systems.

use std::borrow::Cow;

fn format_denom_rhythm(num: f64, denom: f64) -> String {
    if (num - 1.0).abs() < f64::EPSILON {
        format!("calc(var(--spacing-root) / {denom})")
    } else if (num + 1.0).abs() < f64::EPSILON {
        format!("calc(-1 * var(--spacing-root) / {denom})")
    } else {
        format!("calc({num} * var(--spacing-root) / {denom})")
    }
}

fn format_single_rhythm(num: f64) -> String {
    if (num - 1.0).abs() < f64::EPSILON {
        "var(--spacing-root)".to_string()
    } else if (num + 1.0).abs() < f64::EPSILON {
        "calc(-1 * var(--spacing-root))".to_string()
    } else {
        format!("calc({num} * var(--spacing-root))")
    }
}

/// Resolves a rhythm unit count to a CSS calc or variable expression.
pub fn get_rhythm(num: f64, denom: Option<f64>) -> String {
    match denom {
        Some(d) => format_denom_rhythm(num, d),
        None => format_single_rhythm(num),
    }
}

/// Resolves a single rhythm token string (e.g. `1r`, `1/3r`, `-2/3r`) to its CSS equivalent.
pub fn resolve_single_rhythm(val: &str) -> Option<String> {
    let raw = val.strip_suffix('r')?;
    if raw.is_empty() || raw == "+" {
        return Some(get_rhythm(1.0, None));
    }
    if raw == "-" {
        return Some(get_rhythm(-1.0, None));
    }

    if let Some((num_str, denom_str)) = parse_fraction_parts(raw) {
        let num: f64 = num_str.parse().ok()?;
        let denom: f64 = denom_str.parse().ok()?;
        if denom == 0.0 {
            return None;
        }
        return Some(get_rhythm(num, Some(denom)));
    }

    let n: f64 = raw.parse().ok()?;
    Some(get_rhythm(n, None))
}

fn parse_fraction_parts(raw: &str) -> Option<(&str, &str)> {
    let slash_idx = raw.find('/')?;
    if slash_idx == 0 || slash_idx != raw.rfind('/')? {
        return None;
    }
    let num_str = &raw[..slash_idx];
    let denom_str = &raw[slash_idx + 1..];
    Some((num_str, denom_str))
}

/// Resolves all rhythm units in an arbitrary CSS value string, passing through non-rhythm tokens.
pub fn resolve_rhythm(val: &str) -> Cow<'_, str> {
    if !val.contains('r') {
        return Cow::Borrowed(val);
    }

    let mut out = String::with_capacity(val.len() * 2);
    let mut words = val.split_whitespace().peekable();
    let mut changed = false;

    while let Some(word) = words.next() {
        if let Some(resolved) = resolve_single_rhythm(word) {
            out.push_str(&resolved);
            changed = true;
        } else {
            out.push_str(word);
        }
        if words.peek().is_some() {
            out.push(' ');
        }
    }

    if changed {
        Cow::Owned(out)
    } else {
        Cow::Borrowed(val)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_rhythm() {
        assert_eq!(resolve_rhythm("r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("+r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("1r"), "var(--spacing-root)");
        assert_eq!(resolve_rhythm("-r"), "calc(-1 * var(--spacing-root))");
    }

    #[test]
    fn test_multipliers_and_decimals() {
        assert_eq!(resolve_rhythm("2r"), "calc(2 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("0.5r"), "calc(0.5 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("1.5r"), "calc(1.5 * var(--spacing-root))");
        assert_eq!(resolve_rhythm("-2r"), "calc(-2 * var(--spacing-root))");
    }

    #[test]
    fn test_fractions() {
        assert_eq!(resolve_rhythm("1/3r"), "calc(var(--spacing-root) / 3)");
        assert_eq!(resolve_rhythm("2/3r"), "calc(2 * var(--spacing-root) / 3)");
        assert_eq!(resolve_rhythm("-1/3r"), "calc(-1 * var(--spacing-root) / 3)");
        assert_eq!(resolve_rhythm("-2/3r"), "calc(-2 * var(--spacing-root) / 3)");
    }

    #[test]
    fn test_multi_value_pass_through() {
        assert_eq!(
            resolve_rhythm("1r 2r"),
            "var(--spacing-root) calc(2 * var(--spacing-root))"
        );
        assert_eq!(
            resolve_rhythm("1px solid 1/3r"),
            "1px solid calc(var(--spacing-root) / 3)"
        );
        assert_eq!(resolve_rhythm("10px auto"), "10px auto");
    }
}
