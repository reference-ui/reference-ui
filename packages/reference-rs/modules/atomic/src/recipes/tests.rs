//! Unit tests for closed recipe compilation: base-atom ordering and responsive variant emission.
//! Both cases compile through `compile` with an open selection index and assert on the emitted rules and atoms.

use super::*;
use crate::atom::{AtomValue, WhenKind};
use crate::diagnostics::DiagnosticLocation;
use base_system::BaseSystem;

fn want(prop: &str, value: &str, when: &[&str]) -> Want {
    Want {
        prop: prop.into(),
        value: AtomValue::String(value.into()),
        when: when.iter().map(|key| (*key).into()).collect(),
        important: false,
        backing: crate::atom::Backing::Own,
        origin: None,
        file: None,
        line: None,
        column: None,
        span: None,
    }
}

#[test]
fn base_atoms_sort_before_conditionals_at_equal_specificity() {
    let system = BaseSystem::lib_fixture();
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let recipe = Recipe {
        class_name: "card".to_string(),
        base: vec![
            want("color", "blue.600", &["sm"]),
            want("color", "red.500", &[]),
        ],
        variants: IndexMap::new(),
        default_variants: IndexMap::new(),
        compounds: vec![],
        location: DiagnosticLocation::default(),
    };
    let open = SelectionIndex::open();
    let compiled = compile(
        std::slice::from_ref(&recipe),
        "test-system",
        &mut session,
        &open,
    );
    assert!(diagnostics.is_empty(), "unexpected: {diagnostics:?}");
    let atoms = &compiled[0].rules[0].atoms;
    assert_eq!(atoms.len(), 2);
    assert!(atoms[0].conditions.is_empty(), "base first: {atoms:?}");
    assert!(
        !atoms[1].conditions.is_empty(),
        "conditional last: {atoms:?}"
    );
}

#[test]
fn responsive_variants_emit_container_rules_after_plain_ones() {
    let system = BaseSystem::lib_fixture();
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let mut axis = IndexMap::new();
    axis.insert(
        "solid".to_string(),
        vec![want("backgroundColor", "blue.600", &[])],
    );
    axis.insert(
        "outline".to_string(),
        vec![want("borderWidth", "1px", &["_hover"])],
    );
    let mut variants = IndexMap::new();
    variants.insert("variant".to_string(), axis);
    let recipe = Recipe {
        class_name: "buttonStyle".to_string(),
        base: vec![],
        variants,
        default_variants: IndexMap::new(),
        compounds: vec![],
        location: DiagnosticLocation::default(),
    };
    let open = SelectionIndex::open();
    let compiled = compile(
        std::slice::from_ref(&recipe),
        "test-system",
        &mut session,
        &open,
    );
    assert!(diagnostics.is_empty(), "unexpected: {diagnostics:?}");
    let rules = &compiled[0].rules;
    let plain = rules
        .iter()
        .position(|rule| rule.class_name == "test-system__buttonStyle_v_outline")
        .expect("plain outline rule");
    let md = rules
        .iter()
        .position(|rule| rule.class_name == "md:test-system__buttonStyle_v_outline")
        .expect("md outline rule");
    assert!(plain < md, "responsive rules print last: {rules:?}");
    let atoms = &rules[md].atoms;
    assert!(!atoms.is_empty());
    for atom in atoms {
        assert!(
            atom.conditions
                .iter()
                .any(|cond| matches!(cond.wrap(), WhenKind::Container(_))),
            "container wrap missing: {atom:?}"
        );
        assert!(
            atom.conditions
                .iter()
                .any(|cond| matches!(cond.wrap(), WhenKind::Selector(_))),
            "hover descendant missing: {atom:?}"
        );
    }
    assert!(compiled[0].table.responsive_variant_map.is_empty());
}
