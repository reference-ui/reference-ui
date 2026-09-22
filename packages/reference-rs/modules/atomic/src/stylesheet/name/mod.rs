//! Canonical class name generation and condition prefixing for atomic CSS rules.
//! Constructs deterministic, human-readable class names from property keys, escaped values, and conditional prefixes.
//! Enforces a bijective one-to-one mapping between atomic declarations and stylesheet selectors.
//! Condition segments and wraps come from the lowered `When` on the atom; this file does not re-parse authored strings.

pub mod escape;

use crate::atom::{Atom, When, WhenKind};
use crate::resolve::conditions::nest_selector_condition;
use canon::class_prefix_for_prop;
use escape::{sanitize_class_value, EscapeCursor};

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
    let mut out = String::new();
    push_selector_with_system(&mut out, atom, system);
    out
}

/// Escaped `{system}__` prefix, formatted once and replayed per atom.
///
/// `system` is constant across every atom in a `write_utilities` call and the
/// cursor always starts at 0 there, so the escaped prefix bytes are identical
/// for every atom. Replaying them replaces per-atom char escapes with one
/// `push_str` plus a cursor advance. An empty system stays the empty prefix:
/// no `__`, no cursor movement, so the leading-char rule still keys off the
/// first subsequent char exactly as before.
#[derive(Default)]
pub struct SelectorPrefix {
    escaped: String,
    chars: usize,
}

impl SelectorPrefix {
    /// Escape `{system}__` once through a fresh cursor. Empty in, empty out.
    pub fn for_system(system: &str) -> Self {
        if system.is_empty() {
            return Self::default();
        }
        let mut escaped = String::with_capacity(system.len() + 2);
        let mut cursor = EscapeCursor::new();
        cursor.push(&mut escaped, system);
        cursor.push(&mut escaped, "__");
        Self { escaped, chars: cursor.position() }
    }

    /// Replay the pre-escaped bytes and advance the cursor past them.
    pub fn push(&self, cursor: &mut EscapeCursor, out: &mut String) {
        out.push_str(&self.escaped);
        cursor.advance(self.chars);
    }

    /// Escaped prefix bytes, for capacity hints downstream.
    pub fn escaped_len(&self) -> usize {
        self.escaped.len()
    }
}

/// Push the system-qualified selector directly into `out`.
///
/// Atoms without selector conditions escape straight into the buffer. Selector
/// conditions still nest through temporaries; only those atoms pay for them.
pub fn push_selector_with_system(out: &mut String, atom: &Atom, system: &str) {
    let prefix = SelectorPrefix::for_system(system);
    push_selector_with_prefix(out, atom, &prefix);
}

/// Push the system-qualified selector reusing a preformatted prefix.
///
/// Callers that emit many atoms for one system build the prefix once; output
/// is byte-identical to `push_selector_with_system`.
pub fn push_selector_with_prefix(out: &mut String, atom: &Atom, prefix: &SelectorPrefix) {
    if has_selector_condition(atom) {
        push_nested_selector(out, atom, prefix);
        return;
    }
    push_selector_base(out, atom, prefix);
}

/// Push `.` plus the escaped `{system}__{stem}` identifier. No temporary.
fn push_selector_base(out: &mut String, atom: &Atom, prefix: &SelectorPrefix) {
    out.push('.');
    let mut cursor = EscapeCursor::new();
    prefix.push(&mut cursor, out);
    push_cond_segments(&mut cursor, out, atom);
    cursor.push(out, class_prefix_for_prop(&atom.prop));
    cursor.push(out, "_");
    cursor.push_sanitized(out, atom.value.class_name_str());
    if atom.important {
        cursor.push(out, "!");
    }
}

/// Push `seg:seg:` condition prefixes, or nothing when unconditioned.
fn push_cond_segments(cursor: &mut EscapeCursor, out: &mut String, atom: &Atom) {
    for (index, cond) in atom.conditions.iter().enumerate() {
        if index > 0 {
            cursor.push(out, ":");
        }
        cursor.push(out, cond.class_segment());
    }
    if !atom.conditions.is_empty() {
        cursor.push(out, ":");
    }
}

fn has_selector_condition(atom: &Atom) -> bool {
    atom.conditions
        .iter()
        .any(|cond| matches!(cond.wrap(), WhenKind::Selector(_)))
}

/// Pre-size the nested base from its exact pieces plus escape slack.
fn nested_base_hint(atom: &Atom, prefix: &SelectorPrefix) -> usize {
    let mut hint = 1 + prefix.escaped_len() + 2;
    for cond in atom.conditions.iter() {
        hint += cond.class_segment().len() + 1;
    }
    hint + atom.prop.len() + 1 + atom.value.class_name_str().len() + 2
}

/// Selector-conditioned atoms: escape the base once, then nest as before.
fn push_nested_selector(out: &mut String, atom: &Atom, prefix: &SelectorPrefix) {
    let mut base = String::with_capacity(nested_base_hint(atom, prefix));
    push_selector_base(&mut base, atom, prefix);
    let mut current = base;
    for cond in &atom.conditions {
        if let WhenKind::Selector(template) = cond.wrap() {
            current = nest_selector_condition(&current, template);
        }
    }
    out.push_str(&current);
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
    fn test_selector_prefix_agrees_with_inline_pushes() {
        for system in ["", "bench-enterprise", "@reference-ui/lib", "2xl", "-lead", "sÿstem"] {
            let prefix = SelectorPrefix::for_system(system);
            let mut replayed = String::new();
            let mut replay_cursor = escape::EscapeCursor::new();
            prefix.push(&mut replay_cursor, &mut replayed);
            let mut inline = String::new();
            let mut inline_cursor = escape::EscapeCursor::new();
            if !system.is_empty() {
                inline_cursor.push(&mut inline, system);
                inline_cursor.push(&mut inline, "__");
            }
            assert_eq!(replayed, inline, "system {system:?}");
            assert_eq!(
                replay_cursor.position(),
                inline_cursor.position(),
                "system {system:?}"
            );
        }
    }

    #[test]
    fn test_selector_with_prefix_matches_system_path() {
        let plain = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![],
            false,
        );
        for system in ["", "bench-enterprise", "2xl"] {
            let mut via_prefix = String::new();
            let prefix = SelectorPrefix::for_system(system);
            push_selector_with_prefix(&mut via_prefix, &plain, &prefix);
            assert_eq!(via_prefix, selector_with_system(&plain, system));
        }
        assert_eq!(selector_with_system(&plain, "2xl"), ".\\32 xl__mt_2r");
        let hover = Atom::new(
            "marginTop".into(),
            CssValue::String("2r".into()),
            smallvec![when("_hover")],
            false,
        );
        let mut via_prefix = String::new();
        let prefix = SelectorPrefix::for_system("@reference-ui/lib");
        push_selector_with_prefix(&mut via_prefix, &hover, &prefix);
        assert_eq!(
            via_prefix,
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
