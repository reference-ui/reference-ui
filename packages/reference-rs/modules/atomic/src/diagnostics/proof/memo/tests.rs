//! Pins the serial memo's key equality and hashing: identical keys share one serialization, object
//! key order never splits a serialization, scalar and float spellings stay distinct, arrays compare
//! in order, and hashing agrees with equality on adversarial inputs.

use super::*;

fn key(value: Value) -> OwnedLookupKey {
    OwnedLookupKey {
        system: "lib".into(),
        when: Vec::new(),
        prop: "color".into(),
        value,
        important: false,
    }
}

fn assert_byte_consistent(left: &OwnedLookupKey, right: &OwnedLookupKey, equal: bool) {
    assert_eq!(MemoKey(left) == MemoKey(right), equal);
    assert_eq!(left.lookup_key() == right.lookup_key(), equal);
}

#[test]
fn identical_keys_share_one_serialization() {
    let left = key(serde_json::json!("red"));
    let right = key(serde_json::json!("red"));
    assert_byte_consistent(&left, &right, true);
    let mut memo = SerialMemo::new();
    let mut serials = Vec::new();
    assert_eq!(memo.find(&left), None);
    serials.push(left.lookup_key());
    memo.insert(&left, 0);
    assert_eq!(memo.find(&right), Some(0));
    assert_eq!(serials.len(), 1);
}

#[test]
fn object_key_order_never_splits_a_serialization() {
    let mut first_map = serde_json::Map::new();
    first_map.insert("a".to_string(), serde_json::json!(1));
    first_map.insert("b".to_string(), serde_json::json!([true, null]));
    let mut second_map = serde_json::Map::new();
    second_map.insert("b".to_string(), serde_json::json!([true, null]));
    second_map.insert("a".to_string(), serde_json::json!(1));
    let left = key(Value::Object(first_map));
    let right = key(Value::Object(second_map));
    assert_byte_consistent(&left, &right, true);
}

#[test]
fn nested_objects_compare_order_insensitively() {
    let left = key(serde_json::json!({"o": {"x": 1, "y": 2}, "a": [{"k": "v"}]}));
    let right = key(serde_json::json!({"a": [{"k": "v"}], "o": {"y": 2, "x": 1}}));
    assert_byte_consistent(&left, &right, true);
    let changed = key(serde_json::json!({"o": {"x": 1, "y": 3}, "a": [{"k": "v"}]}));
    assert_byte_consistent(&left, &changed, false);
}

#[test]
fn scalar_spellings_stay_distinct() {
    let one = key(serde_json::json!(1));
    let float_one = key(serde_json::json!(1.0));
    let text_one = key(serde_json::json!("1"));
    let yes = key(serde_json::json!(true));
    let nil = key(Value::Null);
    assert_byte_consistent(&one, &one, true);
    assert_byte_consistent(&one, &float_one, false);
    assert_byte_consistent(&one, &text_one, false);
    assert_byte_consistent(&one, &yes, false);
    assert_byte_consistent(&one, &nil, false);
    assert_byte_consistent(&float_one, &float_one, true);
    assert_byte_consistent(&yes, &nil, false);
}

#[test]
fn float_bits_track_spellings() {
    let zero = key(serde_json::json!(0.0));
    let neg_zero = key(serde_json::Value::Number(
        serde_json::Number::from_f64(-0.0).unwrap(),
    ));
    assert_byte_consistent(&zero, &neg_zero, false);
    let big = key(serde_json::json!(1e100));
    let big_again = key(serde_json::Value::Number(
        serde_json::Number::from_f64(1e100).unwrap(),
    ));
    assert_byte_consistent(&big, &big_again, true);
    let huge_int = key(serde_json::json!(18_446_744_073_709_551_615u64));
    assert_byte_consistent(&big, &huge_int, false);
    assert_byte_consistent(&huge_int, &huge_int, true);
}

#[test]
fn arrays_compare_in_order() {
    let left = key(serde_json::json!(["1", null, "4"]));
    let right = key(serde_json::json!(["1", null, "4"]));
    let swapped = key(serde_json::json!([null, "1", "4"]));
    assert_byte_consistent(&left, &right, true);
    assert_byte_consistent(&left, &swapped, false);
}

#[test]
fn tuple_positions_stay_distinct() {
    let base = key(serde_json::json!("red"));
    let mut other = base.clone();
    other.prop = "width".into();
    assert_byte_consistent(&base, &other, false);
    let mut other = base.clone();
    other.when = vec!["_hover".into()];
    assert_byte_consistent(&base, &other, false);
    let mut other = base.clone();
    other.important = true;
    assert_byte_consistent(&base, &other, false);
    let mut other = base.clone();
    other.system = "other".into();
    assert_byte_consistent(&base, &other, false);
}

#[test]
fn hash_agrees_with_equality_on_adversaries() {
    let adversaries = vec![
        serde_json::json!({"b": 2, "a": 1}),
        serde_json::json!({"a": 1, "b": 2}),
        serde_json::json!({"a": 1, "b": 3}),
        serde_json::json!([1, "x", null, true]),
        serde_json::json!("red.500"),
        serde_json::json!(1),
        serde_json::json!(1.0),
        serde_json::json!(-0.0),
        serde_json::json!(0.0),
        serde_json::json!(true),
        serde_json::json!(false),
        serde_json::json!(null),
        serde_json::json!({}),
        serde_json::json!([]),
    ];
    for (i, left) in adversaries.iter().enumerate() {
        for right in &adversaries[i..] {
            let l = key(left.clone());
            let r = key(right.clone());
            let equal = MemoKey(&l) == MemoKey(&r);
            assert_eq!(equal, l.lookup_key() == r.lookup_key());
            if equal {
                let mut left_state = rustc_hash::FxHasher::default();
                let mut right_state = rustc_hash::FxHasher::default();
                MemoKey(&l).hash(&mut left_state);
                MemoKey(&r).hash(&mut right_state);
                assert_eq!(left_state.finish(), right_state.finish());
            }
        }
    }
}
