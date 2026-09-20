//! Lowering census, exact step lists, and wire snapshots.
//!
//! Pins the gate-mirrored key census (29 keys: 21 shapes plus macros,
//! rewrites, emits, and drops), the exact border/outline/container step
//! lists the interpreter runs, single-entry serializations, and a
//! serialize/deserialize round trip over every step.

use super::*;

/// Shape census over every lowering list.
struct ShapeCensus {
    trbl: usize,
    trio: usize,
    outline: usize,
    pair: usize,
}

impl ShapeCensus {
    fn collect() -> Self {
        let mut census = Self {
            trbl: 0,
            trio: 0,
            outline: 0,
            pair: 0,
        };
        for steps in build_lowerings().values() {
            for step in steps {
                census.count(step);
            }
        }
        census
    }

    fn count(&mut self, step: &LowerStep) {
        let LowerStep::Longhands {
            longhands,
            shape,
            style,
            ..
        } = step
        else {
            return;
        };
        match shape {
            Shape::Trbl => {
                assert_eq!(longhands.len(), 4);
                self.trbl += 1;
            }
            Shape::Trio => {
                assert_eq!(longhands.len(), 3);
                self.trio += 1;
                if *style == Some(TrioStyle::Outline) {
                    self.outline += 1;
                }
            }
            Shape::Pair => {
                assert_eq!(longhands.len(), 2);
                self.pair += 1;
            }
        }
    }
}

#[test]
fn lowering_key_census_matches_gates() {
    assert_eq!(build_lowerings().len(), 29);
    let census = ShapeCensus::collect();
    assert_eq!((census.trbl, census.trio, census.pair), (3, 12, 6));
    assert_eq!(census.outline, 1);
}

#[test]
fn border_steps_carry_macro_first_and_border_style() {
    let steps = trio_steps("border", &["borderWidth", "borderStyle", "borderColor"]);
    let value = serde_json::to_value(&steps).expect("serializes");
    assert_eq!(
        value,
        serde_json::json!([
            {"on": "bool:true", "emit": [["borderWidth", "1px"], ["borderStyle", "solid"]]},
            {"on": {"in": "zeroBorder"}, "emit": [["borderWidth", "0px"]]},
            {"on": "whole", "keep": true},
            {"longhands": ["borderWidth", "borderStyle", "borderColor"], "shape": "trio", "style": "border"},
        ])
    );
}

#[test]
fn outline_steps_carry_ring_and_outline_style() {
    let steps = trio_steps("outline", &["outlineWidth", "outlineStyle", "outlineColor"]);
    let value = serde_json::to_value(&steps).expect("serializes");
    assert_eq!(
        value,
        serde_json::json!([
            {"on": {"in": "zeroBorder"}, "emit": [["outlineWidth", "0px"]]},
            {"on": {"eq": "none"}, "emit": [["outline", "2px solid transparent"], ["outlineOffset", "2px"]]},
            {"on": "whole", "keep": true},
            {"longhands": ["outlineWidth", "outlineStyle", "outlineColor"], "shape": "trio", "style": "outline"},
        ])
    );
}

#[test]
fn container_steps_follow_guard_order_with_rendered_default() {
    let value = serde_json::to_value(&container_steps()).expect("serializes");
    assert_eq!(
        value,
        serde_json::json!([
            {"on": "bool:true", "emit": [["containerType", "inline-size"]]},
            {"on": "empty", "emit": [["containerType", "inline-size"]]},
            {"on": {"eq": "true"}, "emit": [["containerType", "inline-size"]]},
            {"emit": [["containerType", "inline-size"], ["containerName", "$"]]},
        ])
    );
}

#[test]
fn macro_and_single_entries_serialize() {
    let lowerings = build_lowerings();
    let get = |key: &str| serde_json::to_value(&lowerings[key]).expect("serializes");
    assert_eq!(
        get("flex"),
        serde_json::json!([{"rewrite": {"1": "1 1 0%", "auto": "1 1 auto", "initial": "0 1 auto", "none": "none"}}])
    );
    assert_eq!(
        get("size"),
        serde_json::json!([{"emit": [["width", "$"], ["height", "$"]]}])
    );
    assert_eq!(
        get("textGradient"),
        serde_json::json!([{"emit": [["backgroundImage", "$"], ["webkitBackgroundClip", "text"], ["color", "transparent"]]}])
    );
    assert_eq!(get("font"), serde_json::json!([{"macro": "font"}]));
    assert_eq!(get("weight"), serde_json::json!([{"macro": "weight"}]));
    assert_eq!(get("variant"), serde_json::json!([{"drop": true}]));
    assert_eq!(get("colorMode"), serde_json::json!([{"drop": true}]));
}

#[test]
fn steps_round_trip_through_json() {
    let lowerings = build_lowerings();
    let json = serde_json::to_string(&lowerings).expect("serializes");
    let back: std::collections::BTreeMap<String, Vec<LowerStep>> =
        serde_json::from_str(&json).expect("deserializes");
    assert_eq!(back, lowerings);
}
