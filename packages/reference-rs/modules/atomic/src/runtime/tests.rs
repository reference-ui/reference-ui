//! Unit tests for runtime style plan construction, slot derivation, and artifact contracts.
//! Verifies pre-expansion authored declaration capture and opaque cascade slot generation.
//! Asserts deduplication of identical lookup keys and presence of system class name prefixes.
//! Validates property name inventories excluding primitive metadata fields.

use super::*;
use base_system::BaseSystem;
use serde_json::json;

#[test]
fn test_derive_slot_unconditioned_and_conditioned() {
    assert_eq!(derive_slot("color", &[], None), "color");
    assert_eq!(derive_slot("paddingTop", &[], None), "paddingTop");
    assert_eq!(derive_slot("pt", &[], None), "paddingTop");

    let hover = vec!["_hover".to_string()];
    assert_eq!(derive_slot("color", &hover, None), "hover:color");

    let nested = vec!["_dark".to_string(), "_hover".to_string()];
    assert_eq!(derive_slot("color", &nested, None), "dark:hover:color");

    assert_eq!(derive_slot("padding", &[], Some("base")), "padding@base");
    assert_eq!(derive_slot("padding", &[], Some("lg")), "padding@lg");
}

#[test]
fn test_build_runtime_style_plans_macro() {
    let system = BaseSystem::lib_fixture();
    let decls = vec![
        AuthoredDeclaration {
            when: vec![],
            prop: "color".to_string(),
            value: json!("blue.500"),
            important: false,
        },
        AuthoredDeclaration {
            when: vec!["_hover".to_string()],
            prop: "color".to_string(),
            value: json!("red.500"),
            important: false,
        },
        AuthoredDeclaration {
            when: vec![],
            prop: "p".to_string(),
            value: json!("2"),
            important: false,
        },
    ];

    let mut atom_set = crate::atom::AtomSet::new();
    let mut diagnostics = Vec::new();

    let mut builder =
        PlanBuilder::new("lib-test-system", &system, &mut atom_set, &mut diagnostics);
    let plans = builder.build(&decls);

    assert_eq!(plans.len(), 3);

    let color_plan = &plans[0];
    assert_eq!(color_plan.system, "lib-test-system");
    assert_eq!(color_plan.prop, "color");
    assert_eq!(color_plan.value, json!("blue.500"));
    assert_eq!(color_plan.declarations.len(), 1);
    assert_eq!(color_plan.declarations[0].slot, "color");
    assert_eq!(
        color_plan.declarations[0].class_name,
        "lib-test-system__c_blue.500"
    );

    let hover_plan = &plans[1];
    assert_eq!(hover_plan.when, vec!["_hover"]);
    assert_eq!(hover_plan.declarations[0].slot, "hover:color");
    assert_eq!(
        hover_plan.declarations[0].class_name,
        "lib-test-system__hover:c_red.500"
    );

    let p_plan = &plans[2];
    assert_eq!(p_plan.prop, "p");
    assert_eq!(p_plan.value, json!("2"));
    assert_eq!(p_plan.declarations[0].slot, "padding");
}

#[test]
fn test_build_runtime_style_plans_dimensional_shorthand() {
    let system = BaseSystem::lib_fixture();
    let mut atom_set = crate::atom::AtomSet::new();
    let mut diagnostics = Vec::new();

    let dimensional_decls = vec![AuthoredDeclaration {
        when: vec![],
        prop: "padding".to_string(),
        value: json!("1r 2r"),
        important: false,
    }];
    let mut builder =
        PlanBuilder::new("lib-test-system", &system, &mut atom_set, &mut diagnostics);
    let dim_plans = builder.build(&dimensional_decls);
    let slots: Vec<&str> = dim_plans[0]
        .declarations
        .iter()
        .map(|d| d.slot.as_str())
        .collect();
    assert_eq!(
        slots,
        vec!["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]
    );
}

#[test]
fn test_build_runtime_style_plans_responsive_array() {
    let system = BaseSystem::lib_fixture();
    let decls = vec![AuthoredDeclaration {
        when: vec![],
        prop: "padding".to_string(),
        value: json!(["1", null, "4"]),
        important: false,
    }];

    let mut atom_set = crate::atom::AtomSet::new();
    let mut diagnostics = Vec::new();

    let mut builder =
        PlanBuilder::new("lib-test-system", &system, &mut atom_set, &mut diagnostics);
    let plans = builder.build(&decls);

    assert_eq!(plans.len(), 1);
    let plan = &plans[0];
    assert_eq!(plan.declarations.len(), 2);
    assert_eq!(plan.declarations[0].slot, "padding@base");
    assert_eq!(plan.declarations[0].class_name, "lib-test-system__p_1");
    assert_eq!(plan.declarations[1].slot, "padding@md");
}

#[test]
fn test_style_prop_names_excludes_metadata() {
    let names = get_style_prop_names();
    assert!(names.contains(&"color".to_string()));
    assert!(names.contains(&"padding".to_string()));
    assert!(names.contains(&"p".to_string()));
    assert!(!names.contains(&"variant".to_string()));
    assert!(!names.contains(&"colorMode".to_string()));
}
