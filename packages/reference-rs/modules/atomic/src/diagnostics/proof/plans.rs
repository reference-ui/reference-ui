//! Expected-key vs final plan-key set join. The join is mechanical over
//! serialized keys: an exact key emitted because of another file, site, or
//! harvest still counts as present (incidental-coverage rule), because
//! runtime will paint. Only absent expected keys become userspace warnings.
//! Plans serialize through [`OwnedLookupKey`], the one owned key type, so
//! diagnostics grows no second canonicalizer.

use std::collections::BTreeSet;

use super::super::OwnedLookupKey;
use crate::runtime::RuntimeStylePlan;

impl From<&RuntimeStylePlan> for OwnedLookupKey {
    fn from(plan: &RuntimeStylePlan) -> Self {
        Self {
            system: plan.system.as_str().into(),
            when: plan.when.iter().map(|part| part.as_str().into()).collect(),
            prop: plan.prop.as_str().into(),
            value: plan.value.clone(),
            important: plan.important,
        }
    }
}

/// The final emitted lookup-key set, one serialized key per runtime plan.
pub fn emitted_keys(plans: &[RuntimeStylePlan]) -> BTreeSet<String> {
    plans
        .iter()
        .map(|plan| OwnedLookupKey::from(plan).lookup_key())
        .collect()
}

/// Expected keys missing from the final emitted set, in sorted order.
/// Present keys are successes and return nothing for them.
pub fn missing_keys(expected: &BTreeSet<String>, emitted: &BTreeSet<String>) -> Vec<String> {
    expected.difference(emitted).cloned().collect()
}

/// True for values runtime never queries: `false` and `null` are holes
/// (`isHole` skips them), so no lookup key carrying one can ever miss.
pub fn is_hole_value(value: &serde_json::Value) -> bool {
    value.is_null() || *value == serde_json::Value::Bool(false)
}

/// True when two keys name the same declaration position: same system,
/// property, condition stack, and importance, whatever the value spells.
pub fn same_position(left: &OwnedLookupKey, right: &OwnedLookupKey) -> bool {
    left.system == right.system
        && left.prop == right.prop
        && left.when == right.when
        && left.important == right.important
}

#[cfg(test)]
mod tests {
    use super::*;

    fn set(keys: &[&str]) -> BTreeSet<String> {
        keys.iter().map(|key| key.to_string()).collect()
    }

    #[test]
    fn present_keys_prove_nothing_absent() {
        let expected = set(&["a", "b"]);
        let emitted = set(&["a", "b", "c"]);
        assert!(missing_keys(&expected, &emitted).is_empty());
    }

    #[test]
    fn absent_keys_are_proven_missing_in_order() {
        let expected = set(&["b", "a", "c"]);
        let emitted = set(&["b"]);
        assert_eq!(missing_keys(&expected, &emitted), vec!["a", "c"]);
    }

    #[test]
    fn incidental_coverage_counts_as_present() {
        let expected = set(&["width:[\"200px\"]"]);
        let emitted = set(&["width:[\"200px\"]"]);
        assert!(missing_keys(&expected, &emitted).is_empty());
    }

    #[test]
    fn emitted_keys_serialize_plans_through_the_one_authority() {
        use crate::runtime::{RuntimeDeclaration, RuntimeStylePlan};
        let plans = vec![RuntimeStylePlan {
            system: "lib".to_string(),
            when: vec!["_hover".to_string()],
            prop: "color".to_string(),
            value: serde_json::json!("red"),
            important: false,
            declarations: vec![RuntimeDeclaration {
                slot: "hover:color".to_string(),
                class_name: "c_red".to_string(),
            }],
        }];
        let owned = OwnedLookupKey {
            system: "lib".into(),
            when: vec!["_hover".into()],
            prop: "color".into(),
            value: serde_json::json!("red"),
            important: false,
        };
        assert_eq!(emitted_keys(&plans), set(&[owned.lookup_key().as_str()]));
        assert_eq!(
            OwnedLookupKey::from(&plans[0]),
            owned,
            "plan conversion keeps the five-tuple"
        );
    }

    #[test]
    fn dedupe_key_equals_emitted_key() {
        use crate::runtime::AuthoredDeclaration;
        let decl = AuthoredDeclaration {
            when: vec!["_hover".to_string(), "_focus".to_string()],
            prop: "width".to_string(),
            value: serde_json::json!({"md": "60px", "base": "50px"}),
            important: true,
        };
        let plan = RuntimeStylePlan {
            system: "lib".to_string(),
            when: decl.when.clone(),
            prop: decl.prop.clone(),
            value: decl.value.clone(),
            important: decl.important,
            declarations: Vec::new(),
        };
        let literal = r#"["lib",["_hover","_focus"],"width",{"base":"50px","md":"60px"},true]"#;
        assert_eq!(decl.lookup_key("lib"), literal);
        assert_eq!(OwnedLookupKey::from(&plan).lookup_key(), literal);
        assert_eq!(emitted_keys(&[plan]), set(&[literal]));
    }

    fn keyed_fixture_decls() -> Vec<crate::runtime::AuthoredDeclaration> {
        use crate::runtime::AuthoredDeclaration;
        vec![
            AuthoredDeclaration {
                when: vec![],
                prop: "color".to_string(),
                value: serde_json::json!("red.500"),
                important: false,
            },
            // Exact duplicate: dedupes to no second plan and no second key.
            AuthoredDeclaration {
                when: vec![],
                prop: "color".to_string(),
                value: serde_json::json!("red.500"),
                important: false,
            },
            AuthoredDeclaration {
                when: vec!["_hover".to_string()],
                prop: "width".to_string(),
                value: serde_json::json!({"md": "60px", "base": "50px"}),
                important: true,
            },
            // Unknown prop resolves zero atoms: no plan and no key.
            AuthoredDeclaration {
                when: vec![],
                prop: "fooBar".to_string(),
                value: serde_json::json!("x"),
                important: false,
            },
        ]
    }

    #[test]
    fn build_with_keys_carries_the_emitted_set() {
        use crate::atom::AtomSet;
        use crate::runtime::PlanBuilder;
        let system = base_system::BaseSystem::lib_fixture();
        let decls = keyed_fixture_decls();
        let mut atom_set = AtomSet::new();
        let mut diagnostics = Vec::new();
        let mut builder = PlanBuilder::new("lib", system, &mut atom_set, &mut diagnostics);
        let (plans, keys) = builder.build_with_keys(&decls);
        assert_eq!(plans.len(), 2);
        assert_eq!(
            keys,
            vec![decls[0].lookup_key("lib"), decls[2].lookup_key("lib")]
        );
        let emitted = emitted_keys(&plans);
        assert_eq!(emitted, keys.into_iter().collect::<BTreeSet<String>>());
    }

    #[test]
    fn build_diet_matches_keys_placeholders_and_inserts() {
        use crate::atom::AtomSet;
        use crate::runtime::PlanBuilder;
        let system = base_system::BaseSystem::lib_fixture();
        let decls = keyed_fixture_decls();
        let mut diet_set = AtomSet::new();
        let mut diet_diagnostics = Vec::new();
        let mut diet_builder =
            PlanBuilder::new("lib", system, &mut diet_set, &mut diet_diagnostics);
        let (plans, keys) = diet_builder.build_diet(&decls);
        assert_eq!(plans.len(), 2);
        assert_eq!(
            keys,
            vec![decls[0].lookup_key("lib"), decls[2].lookup_key("lib")]
        );
        for plan in &plans {
            assert_eq!(plan.declarations.len(), 1);
            assert!(plan.declarations[0].slot.is_empty());
            assert!(plan.declarations[0].class_name.is_empty());
        }
        assert_eq!(plans[0].prop, "color");
        assert_eq!(plans[1].prop, "width");
        assert_eq!(plans[1].when, vec!["_hover".to_string()]);
        // Inserts restored (LEAF-11 hole): diet and full feed identical sets.
        let mut full_set = AtomSet::new();
        let mut full_diagnostics = Vec::new();
        let mut full_builder =
            PlanBuilder::new("lib", system, &mut full_set, &mut full_diagnostics);
        let (full_plans, _) = full_builder.build_with_keys(&decls);
        assert_eq!(diet_set.len(), full_set.len());
        for atom in diet_set.iter() {
            assert!(full_set.contains(atom));
        }
        assert_eq!(full_plans.len(), plans.len());
        assert_eq!(
            emitted_keys(&plans),
            keys.into_iter().collect::<BTreeSet<String>>()
        );
    }
}
