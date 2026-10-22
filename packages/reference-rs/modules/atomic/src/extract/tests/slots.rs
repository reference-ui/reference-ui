//! Slotted `recipe()` extraction: one plain recipe per slot, per-slot cells, and slot refusals.
//! Each case compiles a tiny virtual program and asserts on the per-slot runtime tables, the
//! sheet, and the `ATM-E-RECIPE-SLOT` diagnostics a malformed definition raises.

use super::compile_code;
use crate::DiagnosticCode;

const CARD: &str = r#"
    import { recipe } from '@reference-ui/react';
    const card = recipe({
        className: 'card',
        slots: ['root', 'title', 'body'],
        base: { root: { display: 'flex' }, title: { fontWeight: '600' } },
        variants: {
            size: {
                sm: { root: { padding: '12px' }, title: { fontSize: '14px' } },
                lg: { root: { padding: '24px' }, title: { fontSize: '20px' } },
            },
            tone: { loud: { title: { color: 'white' } } },
        },
        defaultVariants: { size: 'sm' },
        compoundVariants: [{ size: 'lg', tone: 'loud', css: { title: { letterSpacing: '1px' } } }],
    });
    card({ size: 'lg' });
"#;

fn table<'a>(res: &'a crate::CompileResult, suffix: &str) -> &'a crate::RecipeRuntimeTable {
    let found = res
        .runtime
        .recipes
        .iter()
        .find(|(key, _)| key.ends_with(suffix));
    match found {
        Some((_, table)) => table,
        None => panic!(
            "no table ending {suffix}: {:?}",
            res.runtime.recipes.keys().collect::<Vec<_>>()
        ),
    }
}

fn slot_errors(res: &crate::CompileResult) -> Vec<String> {
    res.diagnostics
        .iter()
        .filter(|diag| diag.code == DiagnosticCode::RecipeSlot)
        .map(|diag| diag.message.clone())
        .collect()
}

fn axes(table: &crate::RecipeRuntimeTable) -> Vec<&str> {
    table.variant_map.keys().map(String::as_str).collect()
}

#[test]
fn slotted_recipe_lowers_one_table_per_slot() {
    let res = compile_code(CARD);
    assert!(
        res.diagnostics.is_empty(),
        "unexpected: {:?}",
        res.diagnostics
    );
    assert_eq!(
        res.runtime.recipes.len(),
        3,
        "{:?}",
        res.runtime.recipes.keys().collect::<Vec<_>>()
    );
    for suffix in ["__card__root", "__card__title", "__card__body"] {
        table(&res, suffix);
    }
    assert!(!res
        .runtime
        .recipes
        .keys()
        .any(|key| key.ends_with("__card")));
    assert!(res.stylesheet.contains("card__root__base"));
    assert!(res.stylesheet.contains("card__title_s_lg"));
    assert!(res.stylesheet.contains("font-size: 20px"));
}

#[test]
fn slot_tables_keep_only_the_cells_that_style_them() {
    let res = compile_code(CARD);
    assert_eq!(axes(table(&res, "__card__root")), vec!["size"]);
    assert_eq!(axes(table(&res, "__card__title")), vec!["size", "tone"]);
    let body = table(&res, "__card__body");
    assert!(body.variant_map.is_empty());
    assert_eq!(
        body.default_variants.get("size").map(String::as_str),
        Some("sm")
    );
}

#[test]
fn compounds_lower_onto_the_slots_their_css_names() {
    let res = compile_code(CARD);
    assert_eq!(table(&res, "__card__title").compound_variants.len(), 1);
    assert!(table(&res, "__card__root").compound_variants.is_empty());
    assert!(res.stylesheet.contains("card__title_c_lg_loud"));
}

#[test]
fn an_unknown_slot_key_refuses_the_whole_definition() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const panel = recipe({ className: 'panel', slots: ['root'], base: { root: { display: 'flex' }, header: { color: 'red' } } });
        panel();
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec!["recipe 'panel' styles unknown slot 'header'; its slots are: root".to_string()]
    );
    assert!(!res
        .runtime
        .recipes
        .keys()
        .any(|key| key.contains("__panel")));
    assert!(!res.stylesheet.contains("panel__root"));
}

#[test]
fn plain_style_keys_in_a_slotted_recipe_are_unknown_slots() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        recipe({ className: 'flat', slots: ['root'], base: { display: 'flex' } });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec!["recipe 'flat' styles unknown slot 'display'; its slots are: root".to_string()]
    );
}

#[test]
fn malformed_slot_lists_refuse() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const names = ['root'];
        recipe({ className: 'listless', slots: 'root' });
        recipe({ className: 'bound', slots: names });
        recipe({ className: 'empty', slots: [] });
        recipe({ className: 'twice', slots: ['root', 'root'] });
        recipe({ className: 'spaced', slots: ['has space'] });
        recipe({ className: 'blank', slots: [''] });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec![
            "recipe 'listless': 'slots' must be an inline array of string literals",
            "recipe 'bound': 'slots' must be an inline array of string literals",
            "recipe 'empty': 'slots' must name at least one slot",
            "recipe 'twice' lists slot 'root' twice",
            "recipe 'spaced': each slot must be a non-empty string literal with no whitespace",
            "recipe 'blank': each slot must be a non-empty string literal with no whitespace",
        ]
    );
    assert!(res.runtime.recipes.is_empty());
}

#[test]
fn slot_maps_take_plain_keys_only() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const key = 'root';
        const shared = { root: { display: 'flex' } };
        recipe({ className: 'spread', slots: ['root'], base: { ...shared } });
        recipe({ className: 'computed', slots: ['root'], base: { [key]: { display: 'flex' } } });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec![
            "recipe 'spread': a slot map takes slot names as plain keys, not spreads or computed keys",
            "recipe 'computed': a slot map takes slot names as plain keys, not spreads or computed keys",
        ]
    );
}

#[test]
fn every_slot_shares_its_call_gate() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const called = recipe({ className: 'called', slots: ['root', 'icon'], base: { root: { display: 'flex' }, icon: { width: '16px' } } });
        const idle = recipe({ className: 'idle', slots: ['root'], base: { root: { display: 'grid' } } });
        called();
        "#,
    );
    assert!(res.stylesheet.contains("called__root__base"));
    assert!(res.stylesheet.contains("called__icon__base"));
    assert!(!res.stylesheet.contains("idle__root"));
    table(&res, "__idle__root");
}

#[test]
fn binding_inferred_names_reach_the_slots() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const chipRecipe = recipe({ slots: ['root'], base: { root: { display: 'flex' } } });
        chipRecipe();
        "#,
    );
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    table(&res, "__chip__root");
    assert!(res.stylesheet.contains("chip__root__base"));
}

#[test]
fn plain_recipes_keep_every_authored_cell() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const button = recipe({ className: 'button', variants: { size: { sm: {}, lg: { fontSize: '20px' } } } });
        button();
        "#,
    );
    let button = table(&res, "__button");
    let values: Vec<&str> = button.variant_map["size"]
        .keys()
        .map(String::as_str)
        .collect();
    assert_eq!(values, vec!["sm", "lg"]);
}

#[test]
fn a_slot_map_that_is_not_an_inline_object_refuses_the_definition() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const styles = { root: { display: 'flex' } };
        recipe({ className: 'shared', slots: ['root'], base: styles });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec!["recipe 'shared': a slot map must be an inline object keyed by slot name".to_string()]
    );
    assert!(res.runtime.recipes.is_empty());
}

#[test]
fn an_undefined_variant_cell_refuses_the_definition() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        recipe({ className: 'cell', slots: ['root'], variants: { size: { sm: undefined, lg: { root: { fontSize: '20px' } } } } });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec!["recipe 'cell': a slot map must be an inline object keyed by slot name".to_string()]
    );
    assert!(res.runtime.recipes.is_empty());
}

#[test]
fn a_compound_css_that_is_not_an_inline_object_refuses_the_definition() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const x = { root: { color: 'red' } };
        recipe({ className: 'rule', slots: ['root'], base: { root: { display: 'flex' } }, variants: { size: { lg: { root: { padding: '24px' } } } }, compoundVariants: [{ size: 'lg', css: x }] });
        "#,
    );
    assert_eq!(
        slot_errors(&res),
        vec!["recipe 'rule': a slot map must be an inline object keyed by slot name".to_string()]
    );
    assert!(res.runtime.recipes.is_empty());
}

#[test]
fn a_compound_without_css_is_accepted_and_dropped() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        recipe({ className: 'bare', slots: ['root'], base: { root: { display: 'flex' } }, variants: { size: { lg: { root: { padding: '24px' } } } }, compoundVariants: [{ size: 'lg' }] });
        "#,
    );
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(table(&res, "__bare__root").compound_variants.is_empty());
}

#[test]
fn wrapped_and_empty_slot_maps_are_accepted() {
    let res = compile_code(
        r#"
        import { recipe } from '@reference-ui/react';
        const wrapped = recipe({ className: 'wrapped', slots: ['root'], base: { root: { display: 'flex' } } as const, variants: { size: { sm: {} as const, lg: { root: { fontSize: '20px' } } } } });
        wrapped({ size: 'lg' });
        "#,
    );
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    table(&res, "__wrapped__root");
    assert!(res.stylesheet.contains("wrapped__root__base"));
}
