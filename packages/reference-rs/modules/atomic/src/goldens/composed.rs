//! System-backed golden suites: conditions, slots, shaping, composed probes.
//!
//! Conditions, shaping, and the composed `name` rows run against the case
//! harness system so the runner's tables match the writer's. Slots need no
//! system but travel with the composed file to keep every module small.

use serde_json::{json, Value};

use super::Suite;
use crate::atom::{AtomSet, WhenKind};
use crate::resolve::conditions::lower_when;
use crate::runtime::{derive_slot, AuthoredDeclaration, PlanBuilder};
use base_system::BaseSystem;

pub(crate) fn condition_suite(system: &BaseSystem) -> Suite {
    let raws = [
        "base",
        "_hover",
        "_osDark",
        "_wat",
        "md",
        "mdDown",
        "mdOnly",
        "smToLg",
        "smTolg",
        "SMTOLG",
        "@media (min-width: 1px)",
        "@supports",
        "@supports (display: grid)",
        "@mediafoo",
        "@container (min-width: 300px)",
        "&:hover",
        "&[data-x]",
        "@layer utilities",
    ];
    Suite {
        file: "13-lowerCondition.json",
        function: "lowerCondition",
        cases: raws
            .iter()
            .map(|raw| (json!(raw), condition_output(raw, system)))
            .collect(),
    }
}

/// Condition lowering: skip, unknown, or the known segment plus wrap kind.
fn condition_output(raw: &str, system: &BaseSystem) -> Value {
    use crate::resolve::conditions::LoweredWhen;
    match lower_when(raw, system) {
        LoweredWhen::Skip => json!({"status": "skip"}),
        LoweredWhen::Unknown => json!({"status": "unknown"}),
        LoweredWhen::Known(when) => known_output(&when),
    }
}

/// Known condition as its class segment plus wrap kind.
fn known_output(when: &crate::atom::When) -> Value {
    json!({
        "status": "known",
        "segment": when.class_segment(),
        "kind": wrap_kind(when),
    })
}

/// Wrap discriminant for one lowered condition.
fn wrap_kind(when: &crate::atom::When) -> &'static str {
    match when.wrap() {
        WhenKind::Media(_) => "media",
        WhenKind::Container(_) => "container",
        WhenKind::Supports(_) => "supports",
        WhenKind::Selector(_) => "selector",
    }
}

pub(crate) fn slot_suite() -> Suite {
    let probes: &[(&str, &[&str], Option<&str>)] = &[
        ("color", &[], None),
        ("pt", &[], None),
        ("color", &["_hover"], None),
        ("color", &["_dark", "_hover"], None),
        ("padding", &[], Some("base")),
        ("padding", &[], Some("lg")),
        ("p", &["@container (min-width: 300px)"], None),
        ("width", &["md"], Some("md")),
    ];
    Suite {
        file: "14-deriveSlot.json",
        function: "deriveSlot",
        cases: probes
            .iter()
            .map(|(prop, when, bp)| {
                let owned: Vec<String> = when.iter().map(|entry| (*entry).to_string()).collect();
                (
                    json!({"prop": prop, "when": when, "bp": bp}),
                    json!(derive_slot(prop, &owned, *bp)),
                )
            })
            .collect(),
    }
}

pub(crate) fn shape_suite(system: &BaseSystem, name: &str) -> Suite {
    let decls = [
        decl(&[], "width", json!(["1r", null, "3r"]), false),
        decl(&[], "width", json!({"md": "2r", "base": "1r"}), false),
        decl(&[], "width", json!({"_hover": "2r"}), false),
        decl(&[], "width", json!({"md": "2r"}), true),
        decl(
            &[],
            "color",
            json!({"$token": {"path": "n300", "value": "#abc"}}),
            false,
        ),
        decl(&[], "color", json!({"$token": {"path": "n300"}}), false),
        decl(&[], "marginTop", json!({"$r": 2}), false),
        decl(&[], "marginTop", json!({"$r": 2.5}), false),
        decl(&[], "marginTop", json!({"$r": 2.0000005}), false),
        decl(&[], "marginTop", json!({"$r": "2"}), false),
        decl(&[], "marginTop", json!({"$r": 1e21}), false),
        decl(&[], "marginTop", json!({"$r": 5e-7}), false),
        decl(
            &[],
            "width",
            json!(["1r", "2r", "3r", "4r", "5r", "6r", "7r"]),
            false,
        ),
        decl(&[], "width", json!([{"nested": true}]), false),
    ];
    Suite {
        file: "15-shape.json",
        function: "shape",
        cases: decls
            .iter()
            .map(|decl| {
                (
                    json!({
                        "when": decl.when,
                        "prop": decl.prop,
                        "value": decl.value,
                        "important": decl.important,
                    }),
                    build_output(system, name, decl),
                )
            })
            .collect(),
    }
}

/// Shaping and composed verdicts: the plan declarations a decl lowers to.
fn build_output(system: &BaseSystem, name: &str, decl: &AuthoredDeclaration) -> Value {
    let mut atom_set = AtomSet::new();
    let mut diagnostics = Vec::new();
    let mut builder = PlanBuilder::new(name, system, &mut atom_set, &mut diagnostics);
    let plans = builder.build(std::slice::from_ref(decl));
    let declarations: Vec<Value> = plans
        .iter()
        .flat_map(|plan| plan.declarations.iter())
        .map(|decl| json!({"slot": decl.slot, "className": decl.class_name}))
        .collect();
    json!(declarations)
}

/// One authored declaration from parts.
fn decl(when: &[&str], prop: &str, value: Value, important: bool) -> AuthoredDeclaration {
    AuthoredDeclaration {
        when: when.iter().map(|entry| (*entry).to_string()).collect(),
        prop: prop.to_string(),
        value,
        important,
    }
}

/// Composed divergence probes: one declaration in, plan declarations out.
pub(crate) fn name_suite(system: &BaseSystem, name: &str) -> Suite {
    let decls = [
        decl(&[], "padding", json!("1e21"), false),
        decl(&[], "padding", json!("1e-7"), false),
        decl(&[], "padding", json!("1e20"), false),
        decl(&[], "padding", json!("1e-6"), false),
        decl(&[], "padding", json!("0.5"), false),
        decl(&[], "padding", json!("-0"), false),
        decl(&[], "top", json!("0x10"), false),
        decl(&[], "margin", json!(""), false),
        decl(&[], "margin", json!("  "), false),
        decl(&[], "padding", json!("inf"), false),
        decl(&[], "padding", json!("Infinity"), false),
        decl(&[], "padding", json!("nan"), false),
        decl(&[], "padding", json!(" 0x10"), false),
        decl(&[], "padding", json!(0.0), false),
        decl(&[], "padding", json!(1e21), false),
        decl(&[], "marginTop", json!({"$r": 2}), false),
        decl(&[], "marginTop", json!({"$r": 1e21}), false),
        decl(&[], "marginTop", json!({"$r": 2.0000005}), false),
        decl(&[], "padding", json!("a\u{85}b"), false),
        decl(&[], "padding", json!("a\u{feff}b"), false),
        decl(&[], "content", json!("\"a\rb\""), false),
        decl(&[], "color", json!("İnk"), false),
        decl(&[], "borderTop", json!("SOLID 3px red"), false),
        decl(&[], "width", json!({"md": "2r", "base": "1r"}), false),
        decl(&[], "container", json!(true), false),
        decl(&[], "container", json!(""), false),
        decl(&[], "container", json!("sidebar"), false),
        decl(&[], "container", json!(false), false),
        decl(&[], "container", json!(null), false),
        decl(&[], "container", json!(0), false),
        decl(&[], "flex", json!(1), false),
        decl(&[], "flex", json!("auto"), false),
        decl(&[], "flex", json!("2"), false),
        decl(&[], "border", json!("3px 4px solid"), false),
        decl(&[], "border", json!("None"), false),
        decl(&[], "border", json!("none"), false),
        decl(&[], "outline", json!("none"), false),
        decl(&[], "padding", json!("1r 2r"), false),
        decl(&[], "margin", json!("1px 2px 3px"), false),
        decl(&[], "inset", json!("1px 2px 3px 4px"), false),
        decl(&[], "padding", json!("1r"), false),
        decl(&[], "borderWidth", json!("1px 2px"), false),
        decl(&[], "borderTopRadius", json!("2r"), false),
        decl(&[], "size", json!("2r"), false),
        decl(
            &[],
            "textGradient",
            json!("linear-gradient(red, blue)"),
            false,
        ),
        decl(&[], "border", json!(true), false),
        decl(&[], "font", json!("sans"), false),
        decl(&[], "weight", json!("bold"), false),
        decl(&[], "variant", json!("x"), false),
        decl(&[], "width", json!(["1r", null, "3r"]), false),
        decl(&[], "color", json!("red"), true),
        decl(&["_hover"], "color", json!("red"), false),
        decl(&["_wat"], "color", json!("red"), false),
    ];
    Suite {
        file: "16-name.json",
        function: "name",
        cases: decls
            .iter()
            .map(|decl| {
                (
                    json!({
                        "when": decl.when,
                        "prop": decl.prop,
                        "value": decl.value,
                        "important": decl.important,
                    }),
                    build_output(system, name, decl),
                )
            })
            .collect(),
    }
}
