//! CascadeKey unit proofs for magnitude sort, wrapper grouping, and shorthand rank.
//! These sit beside `cascade/mod.rs` so that file stays under the line budget.
//! They construct atoms directly and assert substring order in the printed utilities.

use super::*;
use crate::atom::CssValue;
use crate::resolve::conditions::{lower_when, LoweredWhen};
use base_system::BaseSystem;
use smallvec::SmallVec;

fn empty_system() -> BaseSystem {
    BaseSystem::default()
}

fn when(raw: &str) -> When {
    match lower_when(raw, &empty_system()) {
        LoweredWhen::Known(w) => w,
        other => panic!("expected known condition for {raw}, got {other:?}"),
    }
}

fn atom(prop: &str, value: &str, conds: &[&str]) -> Atom {
    let conditions: SmallVec<[When; 2]> = conds.iter().copied().map(when).collect();
    Atom::new(
        prop.into(),
        CssValue::String(value.into()),
        conditions,
        false,
    )
}

fn sheet(atoms: &[Atom]) -> String {
    let mut set = AtomSet::new();
    for atom in atoms {
        set.insert(atom.clone());
    }
    let mut out = String::new();
    write_utilities(&mut out, &set, "");
    out
}

#[test]
fn min_width_sorts_by_magnitude_not_lex() {
    let css = sheet(&[
        atom("padding", "4r", &["@container (min-width: 1024px)"]),
        atom("padding", "2r", &["@container (min-width: 640px)"]),
        atom("padding", "6r", &["@container (min-width: 1536px)"]),
    ]);
    let a = css.find("640px").expect("640");
    let b = css.find("1024px").expect("1024");
    let c = css.find("1536px").expect("1536");
    assert!(a < b && b < c, "{css}");
}

#[test]
fn max_width_sorts_descending() {
    let css = sheet(&[
        atom("margin", "1r", &["@media (max-width: 640px)"]),
        atom("margin", "2r", &["@media (max-width: 1536px)"]),
    ]);
    let large = css.find("1536px").expect("1536");
    let small = css.find("640px").expect("640");
    assert!(large < small, "{css}");
}

#[test]
fn shared_at_rule_emits_one_wrapper() {
    let css = sheet(&[
        atom("padding", "1r", &["@container (min-width: 640px)"]),
        atom("marginTop", "2r", &["@container (min-width: 640px)"]),
        atom("color", "n100", &["@container (min-width: 640px)"]),
    ]);
    assert_eq!(css.matches("@container (min-width: 640px)").count(), 1);
    assert!(css.contains("padding: 1r;"));
    assert!(css.contains("margin-top: 2r;"));
    assert!(css.contains("color: n100;"));
}

#[test]
fn padding_shorthand_precedes_padding_top() {
    let css = sheet(&[
        atom("paddingTop", "4r", &[]),
        atom("padding", "2r", &[]),
    ]);
    let sh = css.find("padding: 2r;").expect("shorthand");
    let lh = css.find("padding-top: 4r;").expect("longhand");
    assert!(sh < lh, "{css}");
}

#[test]
fn hover_precedes_disabled() {
    let css = sheet(&[
        atom("color", "red", &["_disabled"]),
        atom("color", "red", &["_hover"]),
    ]);
    let hover = css.find("hover").expect("hover");
    let disabled = css.find("disabled").expect("disabled");
    assert!(hover < disabled, "{css}");
}

#[test]
fn forty_em_equals_640px() {
    assert_eq!(parse_milli_px("640px"), parse_milli_px("40em"));
    assert_eq!(parse_milli_px("640px"), Some(640_000));
}

fn lib_when(raw: &str) -> When {
    match lower_when(raw, BaseSystem::lib_fixture()) {
        LoweredWhen::Known(w) => w,
        other => panic!("expected known condition for {raw}, got {other:?}"),
    }
}

fn lib_atom(prop: &str, value: &str, conds: &[&str]) -> Atom {
    let conditions: SmallVec<[When; 2]> = conds.iter().copied().map(lib_when).collect();
    Atom::new(
        prop.into(),
        CssValue::String(value.into()),
        conditions,
        false,
    )
}

#[test]
fn dual_at_rules_nest_in_author_order() {
    let css = sheet(&[lib_atom("color", "red", &["_osDark", "sm"])]);
    let media = "@media (prefers-color-scheme: dark)";
    let container = "@container (min-width: 640px)";
    let media_at = css.find(media).expect("media");
    let container_at = css.find(container).expect("container");
    let class_at = css.find("osDark").expect("class");
    assert!(
        media_at < container_at && container_at < class_at,
        "{css}"
    );
    let between = &css[media_at..class_at];
    assert!(between.contains(container), "{css}");
    assert!(
        !css.contains(&format!("{media} {{\n    .osDark")),
        "inner container dropped: {css}"
    );
}
