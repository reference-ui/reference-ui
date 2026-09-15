//! TYP-RECIPE-01/02: variant prop aliases and compound-variant types.
//! RECIPE-01 dump has axes only. RECIPE-02 dump adds `compoundVariants`.
//! Every axis stays optional; value unions are lexicographic. Compound `when`
//! keys reuse those unions, never `string`. Unknown axis/value rows are skipped.
//! Recipe names that are not TypeScript identifiers after PascalCase (`123`)
//! are skipped; a sibling `button` still prints.

use super::{assert_alias, compound_dts, parse_dump, recipe_dts};
use crate::emit_dts;

const VARIANT_PROPS: &str = "{ size?: 'lg' | 'sm'; tone?: 'loud' | 'quiet' }";
const COMPOUND_VARIANT: &str =
    "{ size?: 'lg' | 'sm'; tone?: 'loud' | 'quiet'; css: { [property: string]: string } }";

/// TYP-RECIPE-01 — ButtonVariantProps from recipe axes; every axis optional.
#[test]
fn typ_recipe_01_emits_optional_variant_prop_unions() {
    let dts = recipe_dts();
    assert_alias(&dts, "ButtonVariantProps", VARIANT_PROPS);
    assert!(
        dts.contains("size?:") && dts.contains("tone?:"),
        "TYP-RECIPE-01: axes must be optional in:\n{dts}"
    );
    assert!(
        !dts.contains("size: '") && !dts.contains("tone: '"),
        "TYP-RECIPE-01: axes must not be required in:\n{dts}"
    );
    assert!(
        !dts.contains("CompoundVariant"),
        "TYP-RECIPE-01 dump has no compoundVariants:\n{dts}"
    );
}

/// TYP-RECIPE-02 — compound `when` keys are subsets of declared axis unions.
#[test]
fn typ_recipe_02_emits_compound_variant_subset_unions() {
    let dts = compound_dts();
    assert_alias(&dts, "ButtonVariantProps", VARIANT_PROPS);
    assert_alias(&dts, "ButtonCompoundVariant", COMPOUND_VARIANT);
    assert!(
        dts.contains("'lg' | 'sm'") && dts.contains("'loud' | 'quiet'"),
        "TYP-RECIPE-02: compound type must contain variant unions in:\n{dts}"
    );
    assert!(
        !dts.contains("size?: string") && !dts.contains("tone?: string"),
        "TYP-RECIPE-02: axes must not be string in:\n{dts}"
    );
    assert!(
        dts.contains("size?:") && dts.contains("tone?:"),
        "TYP-RECIPE-02: compound axes must stay optional in:\n{dts}"
    );
    assert!(
        !dts.contains("recipes/"),
        "TYP-RECIPE-02: must not emit recipes/ modules in:\n{dts}"
    );
}

/// TYP-RECIPE-02 — unknown compound axis/value must not become a literal.
#[test]
fn typ_recipe_02_skips_unknown_compound_axis_or_value() {
    let skipped = emit_dts(&parse_dump(
        r##"{
          "recipes": {
            "button": {
              "variants": {
                "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
                "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
              },
              "compoundVariants": [
                { "tone": "nope", "css": { "border": "1px" } },
                { "flavor": "loud", "css": { "outline": "1px" } }
              ]
            }
          }
        }"##,
        "invalid-compound",
    ));
    assert_alias(&skipped, "ButtonVariantProps", VARIANT_PROPS);
    assert!(
        !skipped.contains("CompoundVariant"),
        "TYP-RECIPE-02: all-invalid rows skip CompoundVariant:\n{skipped}"
    );
    assert!(
        !skipped.contains("'nope'") && !skipped.contains("flavor"),
        "TYP-RECIPE-02: unknown when must not become a literal in:\n{skipped}"
    );

    let mixed = emit_dts(&parse_dump(
        r##"{
          "recipes": {
            "button": {
              "variants": {
                "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } },
                "tone": { "quiet": { "bg": "n100" }, "loud": { "bg": "n300" } }
              },
              "compoundVariants": [
                { "tone": "loud", "size": "lg", "css": { "border": "2px solid" } },
                { "tone": "nope", "css": {} }
              ]
            }
          }
        }"##,
        "mixed-compound",
    ));
    assert_alias(&mixed, "ButtonCompoundVariant", COMPOUND_VARIANT);
    assert!(
        !mixed.contains("'nope'") && !mixed.contains("size?: string"),
        "TYP-RECIPE-02: mixed rows must not leak unknown values in:\n{mixed}"
    );
}

/// Recipe names that cannot PascalCase to a TypeScript identifier are skipped.
#[test]
fn skips_recipe_names_that_are_not_typescript_identifiers() {
    let dts = emit_dts(&parse_dump(
        r##"{
          "recipes": {
            "123": {
              "variants": { "size": { "sm": { "p": "1r" } } }
            },
            "button": {
              "variants": {
                "size": { "sm": { "p": "1r" }, "lg": { "p": "3r" } }
              }
            }
          }
        }"##,
        "invalid-recipe-name",
    ));
    assert!(
        dts.contains("export type ButtonVariantProps"),
        "valid sibling recipe must still print:\n{dts}"
    );
    assert!(
        !dts.contains("123VariantProps") && !dts.contains("export type 123"),
        "digit-only recipe name must be skipped:\n{dts}"
    );
}
