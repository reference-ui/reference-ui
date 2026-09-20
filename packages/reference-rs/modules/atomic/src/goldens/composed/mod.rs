//! System-backed golden suites: conditions, slots, shaping, composed probes.
//!
//! Conditions, shaping, and the composed `name` rows run against the case
//! harness system (lib spec plus authored non-bare widths). The runner
//! (ATM-SEAM-08) compiles with the identical `baseSystem.json`, so the
//! writer's tables and the runner's tables match by construction. Slots
//! need no system but travel with the composed file to keep every module
//! small; the probe lists live in `probes` for the same reason.

mod probes;

use serde_json::{json, Value};

use super::Suite;
use crate::atom::{AtomSet, WhenKind};
use crate::resolve::conditions::lower_when;
use crate::runtime::{derive_slot, AuthoredDeclaration, PlanBuilder};
use base_system::BaseSystem;
use probes::{
    container_probes, decl, dispatch_probes, integer_probes, prefix_probes, range_probes,
    scalar_probes, token_probes, twin_probes, v8_ordered_value,
};

pub(crate) fn condition_suite(system: &BaseSystem) -> Suite {
    let raws = [
        "base",
        "_hover",
        "_osDark",
        "_wat",
        // Twin catalog: authored `__x` answers `_x` (segment `x`) and
        // `__x` (segment `_x`); bare `x` stays unknown, `hover` mints
        // through the twin of authored `_hover`, and the empty key
        // refuses on both sides.
        "_x",
        "__x",
        "x",
        "hover",
        "",
        "md",
        "mdDown",
        "mdOnly",
        "smToLg",
        "smTolg",
        "SMTOLG",
        // Non-bare custom widths: every Down refuses its own width.
        "tabletDown",
        "paddedDown",
        "hexDown",
        "emptyDown",
        // Only parses the NEXT width: tablet/padded/pxname refuse, hexOnly
        // mints (next parses; self never does), last-bp emptyOnly mints.
        "tabletOnly",
        "paddedOnly",
        "hexOnly",
        "pxnameOnly",
        "emptyOnly",
        // Plain custom names never parse: known with the verbatim width.
        "tablet",
        // Between parses TO only: smTotablet refuses, tabletTopxname
        // mints (from never parses), and pxnameDown mints through
        // into_px ("640px" -> "640").
        "smTotablet",
        "tabletTopxname",
        "pxnameDown",
        // Range dispatch: suffixed keys run their one arm with no
        // fallthrough, so aToxDown refuses (its Down arm finds no `aTox`)
        // even though the between arm would mint; xDownDown mints
        // through the Down arm, xDownOnly refuses on the empty next
        // width, and aDown refuses on its unparseable own width.
        "aToxDown",
        "xDownDown",
        "xDownOnly",
        "aDown",
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
    let mut cases: Vec<(Value, Value)> = decls
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
        .collect();
    cases.extend(integer_shape_rows(system, name));
    Suite {
        file: "15-shape.json",
        function: "shape",
        cases,
    }
}

/// Integer-keyed per-prop rows: non-ascending, ascending, and mixed. The
/// file input carries authored-order pairs (`$pairs`); the expected output
/// runs the builder on the V8-observed order the substrate delivers to JS.
fn integer_shape_rows(system: &BaseSystem, name: &str) -> Vec<(Value, Value)> {
    let rows: &[(&str, &[(&str, &str)])] = &[
        ("color", &[("10", "red"), ("2", "blue")]),
        ("color", &[("2", "blue"), ("10", "red")]),
        (
            "color",
            &[("_hover", "red"), ("10", "green"), ("_osDark", "blue"), ("2", "yellow")],
        ),
    ];
    rows.iter()
        .map(|(prop, authored)| integer_case(system, name, prop, authored))
        .collect()
}

/// One integer-key golden case: authored pairs in, V8-observed order out.
/// The pairs tag survives JSON transport (plain objects would not); the
/// builder runs the observed order, pinning the algorithm with order given.
fn integer_case(
    system: &BaseSystem,
    name: &str,
    prop: &str,
    authored: &[(&str, &str)],
) -> (Value, Value) {
    let pairs: Vec<(String, Value)> = authored
        .iter()
        .map(|(key, value)| ((*key).to_string(), json!(value)))
        .collect();
    let input = json!({
        "when": [],
        "prop": prop,
        "value": { "$pairs": pairs.iter().map(|(key, value)| json!([key, value])).collect::<Vec<Value>>() },
        "important": false,
    });
    let decl = decl(&[], prop, v8_ordered_value(&pairs), false);
    (input, build_output(system, name, &decl))
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

/// Composed divergence probes: one declaration in, plan declarations out.
pub(crate) fn name_suite(system: &BaseSystem, name: &str) -> Suite {
    let mut decls = scalar_probes();
    decls.extend(container_probes());
    decls.extend([
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
    ]);
    decls.extend(range_probes());
    decls.extend(twin_probes());
    decls.extend(token_probes());
    decls.extend(dispatch_probes());
    decls.extend(prefix_probes());
    decls.extend(integer_probes());
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
