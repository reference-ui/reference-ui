//! CascadeKey unit proofs for magnitude sort, wrapper grouping, and shorthand rank.
//! These sit beside `cascade/mod.rs` so that file stays under the line budget.
//! They construct atoms directly and assert substring order in the printed utilities.

use super::*;
use super::width::parse_milli_px;
use crate::atom::{Backing, CssValue};
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
    let css = sheet(&[atom("paddingTop", "4r", &[]), atom("padding", "2r", &[])]);
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
fn supports_nests_outside_container_in_author_order() {
    let css = sheet(&[lib_atom(
        "color",
        "red",
        &["@supports (display: grid)", "sm", "&:hover"],
    )]);
    let supports = "@supports (display: grid)";
    let container = "@container (min-width: 640px)";
    let supports_at = css.find(supports).expect("supports");
    let container_at = css.find(container).expect("container");
    let rule_at = css.find(":hover").expect("hover rule");
    assert!(
        supports_at < container_at && container_at < rule_at,
        "{css}"
    );
    assert!(!css.contains(":@supports"), "{css}");
}

#[test]
fn supports_sorts_before_container_across_atoms() {
    let css = sheet(&[
        lib_atom("color", "red", &["sm"]),
        lib_atom("color", "blue", &["@supports (display: grid)"]),
    ]);
    let supports = css.find("@supports").expect("supports");
    let container = css.find("@container").expect("container");
    assert!(supports < container, "{css}");
}

#[test]
fn control_chars_in_values_hex_escape() {
    let css = sheet(&[atom("content", "\"a\rb\"", &[])]);
    assert!(css.contains("content: \"a\\d b\";"), "{css}");
}

#[test]
fn dual_at_rules_nest_in_author_order() {
    let css = sheet(&[lib_atom("color", "red", &["_osDark", "sm"])]);
    let media = "@media (prefers-color-scheme: dark)";
    let container = "@container (min-width: 640px)";
    let media_at = css.find(media).expect("media");
    let container_at = css.find(container).expect("container");
    let class_at = css.find("osDark").expect("class");
    assert!(media_at < container_at && container_at < class_at, "{css}");
    let between = &css[media_at..class_at];
    assert!(between.contains(container), "{css}");
    assert!(
        !css.contains(&format!("{media} {{\n    .osDark")),
        "inner container dropped: {css}"
    );
}

fn grouped_sheet(own: &AtomSet, foreign: &ForeignAtoms, qualifiers: &[String]) -> String {
    let mut out = String::new();
    write_utilities_grouped(&mut out, own, foreign, qualifiers);
    out
}

/// Foreign atoms, each filed under the systems its backing names.
fn foreign(entries: &[(&Atom, &[&str])]) -> ForeignAtoms {
    let mut foreign = ForeignAtoms::new();
    for (atom, systems) in entries {
        foreign.insert((*atom).clone(), &Backing::systems(systems.iter().copied()));
    }
    foreign
}

/// Oracle (G0 §K/T04): no foreign group reprints the flat `write_utilities`
/// bytes exactly, so the default path cannot drift; neither does a foreign
/// atom nothing backs.
#[test]
fn grouped_empty_external_is_byte_identical_to_flat_write_utilities() {
    let mut set = AtomSet::new();
    for atom in [
        atom("color", "red", &[]),
        atom("padding", "2r", &["@container (min-width: 640px)"]),
        atom("marginTop", "4r", &["_hover"]),
        atom("display", "flex", &[]),
    ] {
        set.insert(atom);
    }
    let system = "@reference-ui/lib";
    let mut flat = String::new();
    write_utilities(&mut flat, &set, system);
    let qualifiers = [system.to_string(), "alpha".to_string()];
    let grouped = grouped_sheet(&set, &ForeignAtoms::new(), &qualifiers);
    assert_eq!(
        grouped, flat,
        "no foreign group must reprint the flat bytes"
    );
    let unbacked = foreign(&[(&atom("padding", "9r", &[]), &[])]);
    let grouped = grouped_sheet(&set, &unbacked, &qualifiers);
    assert_eq!(grouped, flat, "an unbacked atom prints nowhere");
}

/// Grouped emission: own first, then one appended group per system the foreign
/// atoms name, in qualifier order, each carrying exactly the atoms backed under
/// it; a composed system no atom names prints no group.
#[test]
fn grouped_emits_own_then_one_group_per_backing_system() {
    let own_color = atom("color", "red", &[]);
    let own_display = atom("display", "flex", &[]);
    let ext_pad = atom("padding", "2r", &[]);
    let ext_mt = atom("marginTop", "1r", &["_hover"]);

    let mut own = AtomSet::new();
    own.insert(own_color.clone());
    own.insert(own_display);
    let foreign = foreign(&[(&ext_pad, &["beta", "alpha"]), (&ext_mt, &["alpha"])]);

    let qualifiers: Vec<String> = ["lib", "alpha", "gamma", "beta"]
        .iter()
        .map(ToString::to_string)
        .collect();
    let css = grouped_sheet(&own, &foreign, &qualifiers);

    let own_sel = name::selector_with_system(&own_color, "lib");
    let alpha_sel = name::selector_with_system(&ext_pad, "alpha");
    let beta_sel = name::selector_with_system(&ext_pad, "beta");
    let own_at = css.find(&own_sel).expect("own rule");
    let alpha_at = css.find(&alpha_sel).expect("alpha rule");
    let beta_at = css.find(&beta_sel).expect("beta rule");
    assert!(own_at < alpha_at, "own group precedes foreign:\n{css}");
    assert!(
        alpha_at < beta_at,
        "qualifier order, not backing order:\n{css}"
    );

    let mt = |system: &str| {
        css.matches(&name::selector_with_system(&ext_mt, system))
            .count()
    };
    assert_eq!(
        (mt("alpha"), mt("beta")),
        (1, 0),
        "mt backs under alpha only:\n{css}"
    );
    assert_eq!(css.matches(&alpha_sel).count(), 1);
    assert_eq!(css.matches(&beta_sel).count(), 1);
    assert!(
        !css.contains("/* foreign gamma */"),
        "no atom names gamma:\n{css}"
    );
    assert_eq!(css.matches(&own_sel).count(), 1, "own rule prints once");
    assert_eq!(
        css.matches(&name::selector_with_system(&ext_pad, "lib"))
            .count(),
        0,
        "external never rides the own prefix"
    );
}

/// A system the atoms name but no qualifier lists still prints, after the
/// composed groups: the atoms decide the groups, the qualifiers their order.
#[test]
fn grouped_prints_an_uncomposed_backing_system_last() {
    let ext_pad = atom("padding", "2r", &[]);
    let foreign = foreign(&[(&ext_pad, &["zeta", "alpha"])]);
    let qualifiers = vec!["lib".to_string(), "alpha".to_string()];
    let css = grouped_sheet(&AtomSet::new(), &foreign, &qualifiers);
    let alpha_at = css.find("/* foreign alpha */").expect("alpha group");
    let zeta_at = css.find("/* foreign zeta */").expect("zeta group");
    assert!(alpha_at < zeta_at, "{css}");
}

/// Foreign groups carry open/close sentinels so a downstream compose can strip
/// them wholesale; the empty-external path emits no marker bytes (byte-identity).
#[test]
fn grouped_foreign_groups_are_sentinel_delimited() {
    let own_color = atom("color", "red", &[]);
    let ext_pad = atom("padding", "2r", &[]);
    let mut own = AtomSet::new();
    own.insert(own_color);
    let external = foreign(&[(&ext_pad, &["alpha"])]);

    let qualifiers = vec!["lib".to_string(), "alpha".to_string()];
    let css = grouped_sheet(&own, &external, &qualifiers);
    assert!(css.contains("  /* foreign alpha */\n"), "{css}");
    assert!(css.contains("  /* end foreign alpha */\n"), "{css}");

    let open = css.find("/* foreign alpha */").expect("open marker");
    let close = css.find("/* end foreign alpha */").expect("close marker");
    let pad = name::selector_with_system(&ext_pad, "alpha");
    let pad_at = css.find(&pad).expect("alpha rule");
    assert!(open < pad_at && pad_at < close, "rule inside markers:\n{css}");

    let flat = grouped_sheet(&own, &ForeignAtoms::new(), &["lib".to_string()]);
    assert!(
        !flat.contains("/* foreign"),
        "no markers without external:\n{flat}"
    );
}
