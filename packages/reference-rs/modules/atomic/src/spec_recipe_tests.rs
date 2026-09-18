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
    assert!(res
        .diagnostics
        .iter()
        .any(|d| d.message
            == "Duplicate recipe className 'button' within system 'spec-recipe-system'"));
    assert_eq!(res.runtime.recipes.len(), 1);
    assert!(res.stylesheet.contains("display: inline-flex;"));
    assert!(!res.stylesheet.contains("display: block;"));
}

fn compile_tsx(path: &str, content: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: path.to_string(),
            content: content.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..CompileRequest::default()
    };
    compile(&req).expect("compile tsx")
}

fn single_error(res: &crate::CompileResult) -> &crate::Diagnostic {
    assert_eq!(res.diagnostics.len(), 1, "{:?}", res.diagnostics);
    &res.diagnostics[0]
}

#[test]
fn test_recipe_without_args_errors_at_call() {
    let res = compile_tsx(
        "src/no-arg.ts",
        "import { recipe } from '@reference-ui/react'\nconst r = recipe()\nvoid r\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("inline object literal"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/no-arg.ts"));
    assert_eq!(diag.line, Some(2));
    assert_eq!(diag.column, Some(11));
}

#[test]
fn test_recipe_dynamic_arg_errors_at_arg() {
    let res = compile_tsx(
        "src/dyn.ts",
        "import { recipe } from '@reference-ui/react'\nconst dyn = { className: 'dyn' }\nconst r = recipe(dyn)\nvoid r\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("inline object literal"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/dyn.ts"));
    assert_eq!(diag.line, Some(3));
    assert_eq!(diag.column, Some(18));
}

#[test]
fn test_recipe_spread_errors_at_spread() {
    let res = compile_tsx(
        "src/spread.ts",
        "import { recipe } from '@reference-ui/react'\nconst base = {}\nconst r = recipe({ className: 'x', ...base })\nvoid r\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("must not contain spread"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/spread.ts"));
    assert_eq!(diag.line, Some(3));
    assert_eq!(diag.column, Some(36));
}

#[test]
fn test_recipe_missing_class_name_errors_at_object() {
    let res = compile_tsx(
        "src/no-name.ts",
        "import { recipe } from '@reference-ui/react'\nconst r = recipe({ base: {} })\nvoid r\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("explicit string-literal"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/no-name.ts"));
    assert_eq!(diag.line, Some(2));
    assert_eq!(diag.column, Some(18));
}

#[test]
fn test_recipe_dynamic_class_name_errors_at_value() {
    let res = compile_tsx(
        "src/dyn-name.ts",
        "import { recipe } from '@reference-ui/react'\nconst name = 'x'\nconst r = recipe({ className: name })\nvoid r\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("non-empty string literal"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/dyn-name.ts"));
    assert_eq!(diag.line, Some(3));
    assert_eq!(diag.column, Some(31));
}

#[test]
fn test_recipe_duplicate_errors_at_second_call() {
    let res = compile_tsx(
        "src/dup.ts",
        "import { recipe } from '@reference-ui/react'\nconst a = recipe({ className: 'dup' })\nconst b = recipe({ className: 'dup' })\nvoid a\nvoid b\n",
    );
    let diag = single_error(&res);
    assert!(diag.message.contains("Duplicate recipe className 'dup'"), "{}", diag.message);
    assert_eq!(diag.file.as_deref(), Some("src/dup.ts"));
    assert_eq!(diag.line, Some(3));
    assert_eq!(diag.column, Some(11));
}
