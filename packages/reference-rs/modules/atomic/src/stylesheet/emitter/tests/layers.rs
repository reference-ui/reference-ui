//! Layer shells, package wrapping, and selector segments of the emitted stylesheet.
//! Covers the empty and fixture sheets, named-system nesting, atom rules with at-rule wraps, and the plan-to-selector agreement check.

use super::*;
use crate::atom::CssValue;
use crate::stylesheet::root_default::ROOT_DEFAULT_BLOCK;
use smallvec::smallvec;

#[test]
fn test_empty_stylesheet() {
    let set = AtomSet::new();
    assert_eq!(
        build_stylesheet(&set, &empty_system(), &mut Vec::new()),
        format!("{ROOT_DEFAULT_BLOCK}{LAYER_PREAMBLE}")
    );
}

#[test]
fn test_lib_fixture_empty_atoms_still_print_tokens() {
    let css = build_stylesheet(&AtomSet::new(), BaseSystem::lib_fixture(), &mut Vec::new());
    assert!(css.starts_with(ROOT_DEFAULT_BLOCK));
    assert!(css.contains("@layer \\@reference-ui\\/lib {\n"));
    assert!(css.contains(LAYER_PREAMBLE));
    assert!(css.contains("@layer global {"));
    assert!(css.contains("@keyframes fadeIn"));
    assert!(css.contains("@keyframes spin"));
    assert!(css.contains("@layer tokens {"));
    assert!(!css.contains("@layer utilities"));
    assert!(css.ends_with("}\n"));
}

#[test]
fn test_named_system_nests_internal_layers_in_package() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    ));
    let css = build_stylesheet(&set, BaseSystem::lib_fixture(), &mut Vec::new());
    let root = css.find("@layer root {").expect("root default block");
    let package = css
        .find("@layer \\@reference-ui\\/lib {")
        .expect("package open");
    let global = css.find("@layer global {").expect("global block");
    let utilities = css.find("@layer utilities {").expect("utilities block");
    assert_eq!(root, 0);
    assert!(package < global && global < utilities);
    assert!(css.ends_with("}\n"));
    let portable = build_portable_stylesheet_with(
        &SheetInput {
        own: &set,
        external: &AtomSet::new(),
        qualifiers: &own_qualifiers(BaseSystem::lib_fixture()),
        system: BaseSystem::lib_fixture(),
        recipes: &[],
    },
        &mut Vec::new(),
    );
    assert!(portable.starts_with(ROOT_DEFAULT_BLOCK));
    assert!(portable.ends_with("}\n"));
}

#[test]
fn test_unconditioned_atom_rule() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "marginTop".into(),
        CssValue::String("2r".into()),
        smallvec![],
        false,
    ));
    let css = build_stylesheet(&set, &empty_system(), &mut Vec::new());
    assert!(css.contains(".mt_2r { margin-top: 2r; }"));
}

#[test]
fn test_container_query_atom_rule() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "marginTop".into(),
        CssValue::String("2r".into()),
        smallvec![when("@container (min-width: 640px)")],
        false,
    ));
    let css = build_stylesheet(&set, &empty_system(), &mut Vec::new());
    assert!(css.contains("@container (min-width: 640px)"));
    assert!(css.contains("margin-top: 2r;"));
}

#[test]
fn test_utility_selectors_carry_system_segment() {
    let mut set = AtomSet::new();
    set.insert(Atom::new(
        "color".into(),
        CssValue::String("blue.600".into()),
        smallvec![],
        false,
    ));
    let system = BaseSystem::lib_fixture();
    let css = build_stylesheet(&set, system, &mut Vec::new());
    assert!(css.contains(".\\@reference-ui\\/lib__c_blue\\.600"));
    let portable = build_portable_stylesheet_with(
        &SheetInput {
        own: &set,
        external: &AtomSet::new(),
        qualifiers: &own_qualifiers(system),
        system,
        recipes: &[],
    },
        &mut Vec::new(),
    );
    assert!(portable.contains(".\\@reference-ui\\/lib__c_blue\\.600"));
}

#[test]
fn test_every_plan_class_name_matches_a_stylesheet_selector() {
    use crate::runtime::{AuthoredDeclaration, PlanBuilder, PlanSinks};
    use serde_json::json;

    let system = BaseSystem::lib_fixture();
    let decls = vec![
        AuthoredDeclaration {
            when: vec![],
            prop: "color".to_string(),
            value: json!("blue.600"),
            important: false,
            external: false,
        },
        AuthoredDeclaration {
            when: vec!["_hover".to_string()],
            prop: "color".to_string(),
            value: json!("red.500"),
            important: false,
            external: false,
        },
    ];
    let mut atom_set = AtomSet::new();
    let mut diagnostics = Vec::new();
    let mut external_atom_set = AtomSet::new();
    let mut builder = PlanBuilder::new(
        &system.name,
        system,
        &[],
        PlanSinks {
            atom_set: &mut atom_set,
            external_atom_set: &mut external_atom_set,
            diagnostics: &mut diagnostics,
        },
    );
    let plans = builder.build(&decls);
    assert_eq!(plans.len(), 2);

    let css = build_stylesheet(&atom_set, system, &mut Vec::new());
    for plan in &plans {
        for decl in &plan.declarations {
            let escaped = name::escape::escape_css_selector(&decl.class_name);
            assert!(
                css.contains(&format!(".{escaped}")),
                "plan class {} missing from sheet:\n{css}",
                decl.class_name
            );
        }
    }
}

