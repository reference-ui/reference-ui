//! Canonical class name generation and condition prefixing for atomic CSS rules.
//! Constructs deterministic, human-readable class names from property keys, escaped values, and conditional prefixes.
//! Enforces a bijective one-to-one mapping between atomic declarations and stylesheet selectors.
//! Condition segments and wraps come from the lowered `When` on the atom; this file does not re-parse authored strings.

pub mod escape;

use crate::atom::{Atom, When, WhenKind};
use crate::resolve::conditions::apply_selector_condition;
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

    let cond_parts: Vec<&str> = atom.conditions.iter().map(When::class_segment).collect();

    if cond_parts.is_empty() {
        base
    } else {
        format!("{}:{base}", cond_parts.join(":"))
    }
}

/// Generate canonical atomic class name with optional system segment.
pub fn class_name_with_system(atom: &Atom, system: &str) -> String {
    let stem = class_name(atom);
    if system.is_empty() {
        stem
    } else {
        format!("{system}__{stem}")
    }
}

/// Generate the CSS selector for an atom, including necessary selector escapes and pseudo transformations.
pub fn selector(atom: &Atom) -> String {
    selector_with_system(atom, "")
}

/// Generate the system-qualified CSS selector matching the runtime plan class name.
///
/// The full `{system}__{stem}` runtime string is escaped as one identifier, so the
/// decoded class selector equals the plan `class_name` byte for byte. An empty
/// system keeps the bare stem for unit-isolated naming tests.
pub fn selector_with_system(atom: &Atom, system: &str) -> String {
    let c_name = class_name_with_system(atom, system);
    let escaped = escape_css_selector(&c_name);
    let mut current_sel = format!(".{escaped}");

    for cond in &atom.conditions {
        if let WhenKind::Selector(template) = cond.wrap() {
            current_sel = apply_selector_condition(template, &current_sel);
        }
    }

    current_sel
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atom::CssValue;
    use crate::resolve::conditions::{lower_when, LoweredWhen};
    use base_system::BaseSystem;
    use smallvec::smallvec;

    fn when(raw: &str) -> crate::atom::When {
        match lower_when(raw, &BaseSystem::default()) {
            LoweredWhen::Known(w) => w,
            other => panic!("expected known condition for {raw}, got {other:?}"),
        }
    }

    #[test]
    fn test_class_name_unconditioned() {
        let atom = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom), "mt_2r");
        assert_eq!(selector(&atom), ".mt_2r");
    }

    #[test]
    fn test_class_name_important() {
        let atom = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![],
            true,
        );
        assert_eq!(class_name(&atom), "mt_2r!");
        assert_eq!(selector(&atom), ".mt_2r\\!");
    }

    #[test]
    fn test_class_name_hover() {
        let atom = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![when("_hover")],
            false,
        );
        assert_eq!(class_name(&atom), "hover:mt_2r");
        assert_eq!(selector(&atom), ".hover\\:mt_2r:is(:hover, [data-hover])");
    }

    #[test]
    fn test_selector_with_system_matches_plan_class_name() {
        let atom = Atom::new(
            "color".into(),
            CssValue::String("blue.600".into()),
            smallvec![],
            false,
        );
        assert_eq!(
            class_name_with_system(&atom, "lib-test-system"),
            "lib-test-system__c_blue.600"
        );
        assert_eq!(
            selector_with_system(&atom, "lib-test-system"),
            ".lib-test-system__c_blue\\.600"
        );
    }

    #[test]
    fn test_selector_with_system_escapes_scope_chars() {
        let atom = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![when("_hover")],
            false,
        );
        assert_eq!(
            selector_with_system(&atom, "@reference-ui/lib"),
            ".\\@reference-ui\\/lib__hover\\:mt_2r:is(:hover, [data-hover])"
        );
    }

    #[test]
    fn test_class_name_fraction_and_token() {
        let atom_frac = Atom::new(
            "padding".into(),
            CssValue::String("1/2r".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom_frac), "p_1/2r");
        assert_eq!(selector(&atom_frac), ".p_1\\/2r");

        let atom_tok = Atom::new(
            "color".into(),
            CssValue::String("blue.600".into()),
            smallvec![],
            false,
        );
        assert_eq!(class_name(&atom_tok), "c_blue.600");
        assert_eq!(selector(&atom_tok), ".c_blue\\.600");
    }
}
