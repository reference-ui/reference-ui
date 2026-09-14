//! Stylesheet rule builder and CSS layer emitter.
//! Generates valid, deterministic CSS declarations wrapped in cascade layers, selectors, and at-rules.
//! Preserves cascade precedence by organizing atomic utilities from base longhands to responsive media queries.

use crate::atom::{Atom, AtomSet};
use crate::resolve::conditions::{lower_condition, LoweredCondition};
use canon::to_css_declaration_property;
use super::layers::LAYER_PREAMBLE;
use super::name;

struct FormattedRule {
    selector: String,
    declaration: String,
    at_rule: Option<String>,
}

fn format_atom_declaration(atom: &Atom) -> String {
    let css_prop = to_css_declaration_property(&atom.prop);
    let css_val = atom.value.css_value_str();
    if atom.important {
        format!("{css_prop}: {css_val} !important;")
    } else {
        format!("{css_prop}: {css_val};")
    }
}

fn extract_at_rule(atom: &Atom) -> Option<String> {
    for cond in &atom.conditions {
        match lower_condition(cond) {
            LoweredCondition::Media(m) => return Some(m),
            LoweredCondition::Container(c) => return Some(c),
            LoweredCondition::Selector(_) => {}
        }
    }
    None
}

fn atom_to_rule(atom: &Atom) -> FormattedRule {
    FormattedRule {
        selector: name::selector(atom),
        declaration: format_atom_declaration(atom),
        at_rule: extract_at_rule(atom),
    }
}

/// Builds complete atomic stylesheet containing layer preambles and generated utility rules.
pub fn build_stylesheet(atom_set: &AtomSet) -> String {
    let mut out = LAYER_PREAMBLE.to_string();
    if atom_set.is_empty() {
        return out;
    }

    out.push_str("@layer utilities {\n");

    let mut direct_rules = Vec::new();
    let mut at_rules = Vec::new();

    for atom in atom_set {
        let rule = atom_to_rule(atom);
        if rule.at_rule.is_some() {
            at_rules.push(rule);
        } else {
            direct_rules.push(rule);
        }
    }

    direct_rules.sort_by(|a, b| a.selector.cmp(&b.selector));
    for rule in direct_rules {
        out.push_str(&format!("  {} {{ {} }}\n", rule.selector, rule.declaration));
    }

    at_rules.sort_by(|a, b| {
        let at_a = a.at_rule.as_deref().unwrap_or("");
        let at_b = b.at_rule.as_deref().unwrap_or("");
        at_a.cmp(at_b).then_with(|| a.selector.cmp(&b.selector))
    });

    for rule in at_rules {
        let at_rule_head = rule.at_rule.as_deref().unwrap_or("");
        out.push_str(&format!(
            "  {at_rule_head} {{\n    {} {{ {} }}\n  }}\n",
            rule.selector, rule.declaration
        ));
    }

    out.push_str("}\n");
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use smallvec::smallvec;
    use crate::atom::AtomValue;

    #[test]
    fn test_empty_stylesheet() {
        let set = AtomSet::new();
        assert_eq!(build_stylesheet(&set), LAYER_PREAMBLE);
    }

    #[test]
    fn test_unconditioned_atom_rule() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
            smallvec![],
            false,
        ));
        let css = build_stylesheet(&set);
        assert!(css.contains(".mt_2r { margin-top: 2r; }"));
    }

    #[test]
    fn test_media_query_atom_rule() {
        let mut set = AtomSet::new();
        set.insert(Atom::new(
            "marginTop".into(),
            AtomValue::String("2r".into()),
            smallvec!["sm".into()],
            false,
        ));
        let css = build_stylesheet(&set);
        assert!(css.contains("@media screen and (min-width: 40rem)"));
        assert!(css.contains(".sm\\:mt_2r { margin-top: 2r; }"));
    }
}
