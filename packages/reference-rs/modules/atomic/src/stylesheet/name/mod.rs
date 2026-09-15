//! Canonical class name generation and condition prefixing for atomic CSS rules.
//! Constructs deterministic, human-readable class names from property keys, escaped values, and conditional prefixes.
//! Enforces a bijective one-to-one mapping between atomic declarations and stylesheet selectors.

pub mod escape;

use crate::atom::Atom;
use crate::config::BreakpointScale;
use crate::resolve::conditions::{
    apply_selector_condition, finalize_condition_name, lower_condition, LoweredCondition,
};
use canon::class_prefix_for_prop;
use escape::{escape_css_selector, sanitize_class_value};

/// Generate canonical atomic class name for an atom (runtime/HTML unescaped string).
pub fn class_name(atom: &Atom) -> String {
    let prefix = class_prefix_for_prop(&atom.prop);
    let val_str = atom.value.class_name_str();
    let sanitized_val = sanitize_class_value(val_str);

    let base = if atom.important {
        format!("{prefix}_{sanitized_val}!")
    } else {
        format!("{prefix}_{sanitized_val}")
    };

    let cond_parts: Vec<String> = atom
        .conditions
        .iter()
        .filter_map(|c| finalize_condition_name(c))
        .collect();

    if cond_parts.is_empty() {
        base
    } else {
        format!("{}:{base}", cond_parts.join(":"))
    }
}

/// Generate the CSS selector for an atom, including necessary selector escapes and pseudo transformations.
pub fn selector(atom: &Atom, scale: &BreakpointScale) -> String {
    let c_name = class_name(atom);
    let escaped = escape_css_selector(&c_name);
    let mut current_sel = format!(".{escaped}");

    for cond in &atom.conditions {
        if let LoweredCondition::Selector(template) = lower_condition(cond, scale) {
            current_sel = apply_selector_condition(&template, &current_sel);
        }
    }

    current_sel
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::AtomValue;
    use smallvec::smallvec;

    fn default_scale() -> BreakpointScale {
        BreakpointScale::default_scale()
    }

    #[test]
    fn test_class_name_unconditioned() {
        let atom = Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom), "mt_2r");
        assert_eq!(selector(&atom, &default_scale()), ".mt_2r");
    }

    #[test]
    fn test_class_name_important() {
        let atom = Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
            smallvec![],
            true,
        );
        assert_eq!(class_name(&atom), "mt_2r!");
        assert_eq!(selector(&atom, &default_scale()), ".mt_2r\\!");
    }

    #[test]
    fn test_class_name_hover() {
        let atom = Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
            smallvec!["_hover".into()],
            false,
        );
        assert_eq!(class_name(&atom), "hover:mt_2r");
        assert_eq!(
            selector(&atom, &default_scale()),
            ".hover\\:mt_2r:is(:hover, [data-hover])"
        );
    }

    #[test]
    fn test_class_name_fraction_and_token() {
        let atom_frac = Atom::new(
            "padding".into(),
            AtomValue::String("1/2r".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom_frac), "p_1/2r");
        assert_eq!(selector(&atom_frac, &default_scale()), ".p_1\\/2r");

        let atom_tok = Atom::new(
            "color".into(),
            AtomValue::String("blue.600".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom_tok), "c_blue.600");
        assert_eq!(selector(&atom_tok, &default_scale()), ".c_blue\\.600");
    }
}
