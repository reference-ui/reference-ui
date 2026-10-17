//! Unit tests for the recipe runtime table: canonical derivation, compound collapse, and the shipped wire shape.
//! Canonical assertions read the `canonical::build` oracle; serialization assertions pin which fields ship and which stay off the wire.

use super::canonical::build;
use super::*;

#[test]
fn single_axis_combination_without_pipe() {
    let stem = "lib-test-system__button";
    let mut solid_map = IndexMap::new();
    solid_map.insert("solid".into(), format!("{stem}_v_solid"));
    solid_map.insert("outline".into(), format!("{stem}_v_outline"));
    let mut variant_map = IndexMap::new();
    variant_map.insert("variant".into(), solid_map);

    let mut defaults = IndexMap::new();
    defaults.insert("variant".into(), "solid".into());
    let scale = BreakpointScale::from_names(Vec::<String>::new());

    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &defaults,
        compounds: &[],
        breakpoints: &scale,
    };
    let table = build(&input);
    assert_eq!(table.variant_keys, vec!["variant"]);
    assert_eq!(table.combinations.len(), 2);
    assert_eq!(
        table.combinations.get("solid"),
        Some(&format!("{stem}__base {stem}_v_solid"))
    );
}

#[test]
fn multi_value_compound_ships_unexpanded_with_derivable_class() {
    let stem = "lib-test-system__button";
    let mut variant_map = IndexMap::new();
    let mut size_map = IndexMap::new();
    size_map.insert("sm".into(), format!("{stem}_s_sm"));
    size_map.insert("md".into(), format!("{stem}_s_md"));
    variant_map.insert("size".into(), size_map);

    let mut predicates = IndexMap::new();
    predicates.insert("size".into(), vec!["sm".into(), "md".into()]);
    let compound = CompiledCompound {
        predicates,
        class_name: format!("{stem}_c_sm_md"),
    };
    let scale = BreakpointScale::from_names(Vec::<String>::new());

    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &IndexMap::new(),
        compounds: &[compound],
        breakpoints: &scale,
    };
    let table = build(&input);
    assert_eq!(table.compound_variants.len(), 1);
    let record = &table.compound_variants[0];
    assert_eq!(
        record.predicates.get("size"),
        Some(&vec!["sm".to_string(), "md".to_string()])
    );
    assert_eq!(record.class_name, format!("{stem}_c_sm_md"));
    let json = serde_json::to_value(&table).expect("table serializes");
    assert_eq!(
        json.get("compoundVariants"),
        Some(&serde_json::json!([{ "predicates": { "size": ["sm", "md"] } }]))
    );
}

#[test]
fn exact_duplicate_compounds_collapse_keeping_first() {
    let stem = "lib-test-system__button";
    let mut variant_map = IndexMap::new();
    let mut size_map = IndexMap::new();
    size_map.insert("sm".into(), format!("{stem}_s_sm"));
    variant_map.insert("size".into(), size_map);

    let mut predicates = IndexMap::new();
    predicates.insert("size".into(), vec!["sm".into()]);
    let compound = CompiledCompound {
        predicates,
        class_name: format!("{stem}_c_sm"),
    };
    let scale = BreakpointScale::from_names(Vec::<String>::new());

    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &IndexMap::new(),
        compounds: &[compound.clone(), compound],
        breakpoints: &scale,
    };
    let table = build(&input);
    assert_eq!(table.compound_variants.len(), 1);
    assert_eq!(table.compound_variants[0].class_name, format!("{stem}_c_sm"));
}

#[test]
fn responsive_map_covers_width_breakpoints_only() {
    let stem = "lib-test-system__button";
    let mut outline_map = IndexMap::new();
    outline_map.insert("solid".into(), format!("{stem}_v_solid"));
    outline_map.insert("outline".into(), format!("{stem}_v_outline"));
    let mut variant_map = IndexMap::new();
    variant_map.insert("variant".into(), outline_map);
    let scale = BreakpointScale::standard();

    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &IndexMap::new(),
        compounds: &[],
        breakpoints: &scale,
    };
    let table = build(&input);
    let axis = &table.responsive_variant_map["variant"];
    assert_eq!(axis.len(), 5);
    assert_eq!(
        axis["md"].get("outline").map(String::as_str),
        Some("md:lib-test-system__button_v_outline")
    );
    assert_eq!(
        axis["sm"].get("solid").map(String::as_str),
        Some("sm:lib-test-system__button_v_solid")
    );
    assert!(!axis.contains_key("base"));
}

#[test]
fn responsive_map_skips_widthless_breakpoints() {
    let stem = "lib-test-system__button";
    let mut outline_map = IndexMap::new();
    outline_map.insert("solid".into(), format!("{stem}_v_solid"));
    let mut variant_map = IndexMap::new();
    variant_map.insert("variant".into(), outline_map);
    let scale = BreakpointScale::from_names(["wide"]);

    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &IndexMap::new(),
        compounds: &[],
        breakpoints: &scale,
    };
    let table = build(&input);
    assert!(table.responsive_variant_map["variant"].is_empty());
}

#[test]
fn serialized_table_ships_breakpoint_names_not_derived_maps() {
    let stem = "lib-test-system__button";
    let mut outline_map = IndexMap::new();
    outline_map.insert("solid".into(), format!("{stem}_v_solid"));
    outline_map.insert("outline".into(), format!("{stem}_v_outline"));
    let mut variant_map = IndexMap::new();
    variant_map.insert("variant".into(), outline_map);
    let mut defaults = IndexMap::new();
    defaults.insert("variant".into(), "outline".into());
    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &defaults,
        compounds: &[],
        breakpoints: &BreakpointScale::standard(),
    };
    let table = build(&input);
    assert_eq!(table.responsive_breakpoints, vec!["sm", "md", "lg", "xl", "2xl"]);
    let json = serde_json::to_value(&table).expect("table serializes");
    assert!(json.get("combinations").is_none());
    assert!(json.get("responsiveVariantMap").is_none());
    assert!(json.get("responsiveBreakpoints").is_none());
    assert_eq!(
        json.get("variantMap"),
        Some(&serde_json::json!({"variant": ["solid", "outline"]}))
    );
    assert_eq!(json.get("defaultVariants"), Some(&serde_json::json!({"variant": 1})));
    assert_eq!(json.get("compoundVariants"), Some(&serde_json::json!([])));
    assert!(json.get("base").is_none());
    assert!(json.get("className").is_none());
    assert!(json.get("qualifiedName").is_none());
    assert!(json.get("variantKeys").is_none());
}

#[test]
fn unresolvable_default_ships_verbatim_not_index() {
    let stem = "lib-test-system__button";
    let mut outline_map = IndexMap::new();
    outline_map.insert("solid".into(), format!("{stem}_v_solid"));
    let mut variant_map = IndexMap::new();
    variant_map.insert("variant".into(), outline_map);
    let mut defaults = IndexMap::new();
    defaults.insert("variant".into(), "ghost".into());
    let input = RecipeTableInput {
        qualified_name: stem,
        class_name: "button",
        variant_map: &variant_map,
        default_variants: &defaults,
        compounds: &[],
        breakpoints: &BreakpointScale::standard(),
    };
    let table = build(&input);
    let json = serde_json::to_value(&table).expect("table serializes");
    assert_eq!(
        json.get("defaultVariants"),
        Some(&serde_json::json!({"variant": "ghost"}))
    );
}
