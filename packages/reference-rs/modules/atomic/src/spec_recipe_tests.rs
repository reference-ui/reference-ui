//! Pipeline tests for evaluated-spec theme recipe lowering.
//! Proves `compile()` turns a populated `spec.recipes` map into qualified
//! runtime recipe tables, cartesian combinations, and `@layer recipes` rules.
//! Also proves a TSX `recipe()` that reuses a spec className is rejected as a
//! duplicate while the spec-owned table survives.

use crate::{compile, BaseSystem, CompileRequest, VirtualSource};

const SPEC_RECIPE_JSON: &str = r#"{
    "schemaVersion": 1,
    "profile": "reference-ui",
    "name": "spec-recipe-system",
    "tokens": {},
    "fonts": {},
    "globalCss": [],
    "keyframes": {},
    "recipes": {
        "button": {
            "className": "button",
            "base": {"display": "inline-flex"},
            "variants": {
                "variant": {
                    "solid": {"borderWidth": "1px"},
                    "outline": {"borderWidth": "2px"}
                }
            },
            "defaultVariants": {"variant": "solid"},
            "compoundVariants": [{"variant": "solid", "css": {"cursor": "not-allowed"}}]
        }
    },
    "staticCss": {},
    "provenance": []
}"#;

fn spec_recipe_system() -> BaseSystem {
    BaseSystem::from_json(SPEC_RECIPE_JSON).expect("spec with recipes")
}

#[test]
fn test_compile_lowers_spec_recipes_into_runtime_tables() {
    let req = CompileRequest {
        base_system: spec_recipe_system(),
        ..CompileRequest::default()
    };
    let res = compile(&req).expect("compile spec recipes");
    assert!(res.diagnostics.is_empty());
    let table = res
        .runtime
        .recipes
        .get("spec-recipe-system__button")
        .expect("qualified spec recipe table");
    assert_eq!(table.class_name, "button");
    assert_eq!(table.base, "spec-recipe-system__button__base");
    assert_eq!(table.variant_keys, vec!["variant"]);
    assert!(table.combinations.contains_key("solid"));
    assert!(table.combinations.contains_key("outline"));
    assert_eq!(table.compound_variants.len(), 1);
    assert_eq!(res.recipes.len(), 1);
    assert!(res.stylesheet.contains("@layer recipes {"));
    assert!(res.stylesheet.contains(".spec-recipe-system__button__base"));
}

#[test]
fn test_compile_rejects_tsx_recipe_duplicating_spec_class_name() {
    let tsx = "import { recipe } from '@reference-ui/react'\n\
        export const button = recipe({ className: 'button', base: { display: 'block' } })\n\
        void button\n";
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "src/button.ts".to_string(),
            content: tsx.to_string(),
        }]),
        base_system: spec_recipe_system(),
        ..CompileRequest::default()
    };
    let res = compile(&req).expect("compile duplicate recipe");
    assert!(
        res.diagnostics.iter().any(|d| d.message
            == "Duplicate recipe className 'button' within system 'spec-recipe-system'")
    );
    assert_eq!(res.runtime.recipes.len(), 1);
    assert!(res.stylesheet.contains("display: inline-flex;"));
    assert!(!res.stylesheet.contains("display: block;"));
}
