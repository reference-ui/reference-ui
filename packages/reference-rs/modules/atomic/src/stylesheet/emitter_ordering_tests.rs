//! Recipe group ordering tests for the stylesheet emitter.
//! Builds closed recipe rules with scrambled base, selector-conditioned, and
//! at-rule-wrapped atoms, then asserts document order: base rules first, then
//! selector groups, then at-rule groups with size queries ascending by parsed
//! width. Equal-specificity conditionals lose unless they print after the base.

use super::emit_recipe_rule;
use crate::atom::{Atom, CssValue};
use crate::resolve::conditions::{lower_when, LoweredWhen};
use base_system::BaseSystem;
use smallvec::smallvec;

fn when(raw: &str) -> crate::atom::When {
    match lower_when(raw, &BaseSystem::default()) {
        LoweredWhen::Known(w) => w,
        other => panic!("expected known condition for {raw}, got {other:?}"),
    }
}

fn recipe_rule(class_name: &str, atoms: Vec<Atom>) -> crate::recipes::RecipeRule {
    crate::recipes::RecipeRule {
        class_name: class_name.to_string(),
        atoms,
    }
}

fn plain_atom(prop: &str, value: &str) -> Atom {
    Atom::new(
        prop.into(),
        CssValue::String(value.into()),
        smallvec![],
        false,
    )
}

fn conditioned_atom(prop: &str, value: &str, raw: &str) -> Atom {
    Atom::new(
        prop.into(),
        CssValue::String(value.into()),
        smallvec![when(raw)],
        false,
    )
}

fn emit_rule(rule: &crate::recipes::RecipeRule) -> String {
    let mut out = String::new();
    emit_recipe_rule(&mut out, rule);
    out
}

#[test]
fn base_rule_emits_before_conditional_at_equal_specificity() {
    let rule = recipe_rule(
        "card__base",
        vec![
            conditioned_atom("color", "blue", "@container (min-width: 640px)"),
            plain_atom("color", "red"),
        ],
    );
    let css = emit_rule(&rule);
    let base = css.find("color: red;").expect("base declaration");
    let wrapped = css
        .find("@container (min-width: 640px)")
        .expect("conditional wrap");
    assert!(base < wrapped, "base must win document order:\n{css}");
}

#[test]
fn selector_group_emits_between_base_and_at_rule() {
    let rule = recipe_rule(
        "card__base",
        vec![
            conditioned_atom("color", "blue", "@media (min-width: 1024px)"),
            conditioned_atom("color", "green", "&:hover"),
            plain_atom("color", "red"),
        ],
    );
    let css = emit_rule(&rule);
    let base = css.find("color: red;").expect("base declaration");
    let hover = css.find(".card__base:hover").expect("hover selector");
    let media = css.find("@media (min-width: 1024px)").expect("media wrap");
    assert!(
        base < hover && hover < media,
        "base, selector, at-rule order:\n{css}"
    );
}

#[test]
fn media_group_sorts_before_container_regardless_of_width() {
    let rule = recipe_rule(
        "card__base",
        vec![
            conditioned_atom("color", "green", "@container (min-width: 640px)"),
            conditioned_atom("color", "blue", "@media (min-width: 900px)"),
        ],
    );
    let css = emit_rule(&rule);
    let media = css.find("@media (min-width: 900px)").expect("media wrap");
    let container = css
        .find("@container (min-width: 640px)")
        .expect("container wrap");
    assert!(media < container, "kind before width:\n{css}");
}

#[test]
fn groups_sharing_wraps_merge_into_one_block() {
    let rule = recipe_rule(
        "sm:button_v_outline",
        vec![
            conditioned_atom("color", "blue", "@container (min-width: 640px)"),
            Atom::new(
                "color".into(),
                CssValue::String("white".into()),
                smallvec![
                    when("@container (min-width: 640px)"),
                    when("&:is(:hover, [data-hover])"),
                ],
                false,
            ),
        ],
    );
    let css = emit_rule(&rule);
    assert_eq!(css.matches("@container (min-width: 640px)").count(), 1);
    assert!(css.contains(":is(:hover, [data-hover])"));
}

#[test]
fn container_groups_order_by_width_not_lexicographic() {
    let rule = recipe_rule(
        "card__base",
        vec![
            plain_atom("display", "grid"),
            conditioned_atom("color", "blue", "@container (min-width: 1024px)"),
            conditioned_atom("color", "green", "@container (min-width: 640px)"),
        ],
    );
    let css = emit_rule(&rule);
    let narrow = css
        .find("@container (min-width: 640px)")
        .expect("narrow wrap");
    let wide = css
        .find("@container (min-width: 1024px)")
        .expect("wide wrap");
    assert!(narrow < wide, "ascending min-width:\n{css}");
}
