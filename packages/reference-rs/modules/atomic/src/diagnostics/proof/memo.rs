//! Exact-key serialization memo: each distinct lookup key serializes once.
//!
//! A session carries tens of thousands of expected lookups over far fewer
//! distinct keys, and serialization is the proof join's dominant cost. This
//! memo keys borrowed expectations by canonical five-tuple equality, so all
//! duplicates share one serialized string. Equality here is the soundness
//! load-bearing relation: equal memo keys MUST serialize to identical bytes
//! (object key order and number spellings canonicalized exactly as the
//! serializer does), while hash consistency is performance-only — a missed
//! hit merely re-serializes the same bytes.

use std::hash::{Hash, Hasher};

use serde_json::Value;

use super::super::OwnedLookupKey;

/// A borrowed expectation keyed by canonical equality: two memo keys compare
/// equal exactly when their canonical five-tuples match, which implies
/// byte-identical `lookup_key()` output. Object comparison is key-order
/// insensitive (the serializer sorts object keys); number comparison follows
/// the stored representation (integers by value, floats by bits, which the
/// shortest-roundtrip float printer maps one-to-one onto spellings).
#[derive(Debug, Clone, Copy)]
pub struct MemoKey<'a>(pub &'a OwnedLookupKey);

impl PartialEq for MemoKey<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.0.system == other.0.system
            && self.0.when == other.0.when
            && self.0.prop == other.0.prop
            && self.0.important == other.0.important
            && values_equal(&self.0.value, &other.0.value)
    }
}

impl Eq for MemoKey<'_> {}

/// True when two values serialize to identical canonical JSON: objects match
/// order-insensitively (the serializer sorts keys), arrays match in order,
/// and numbers match by stored representation.
fn values_equal(left: &Value, right: &Value) -> bool {
    scalars_equal(left, right) || compounds_equal(left, right)
}

/// True when two scalar values print identically: nulls, bools, numbers by
/// stored representation, strings by content. Compounds never match here.
fn scalars_equal(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::Null, Value::Null) => true,
        (Value::Bool(left), Value::Bool(right)) => left == right,
        (Value::Number(left), Value::Number(right)) => numbers_equal(left, right),
        (Value::String(left), Value::String(right)) => left == right,
        _ => false,
    }
}

/// True when two compound values print identically: arrays in order,
/// objects order-insensitively. Scalars never match here.
fn compounds_equal(left: &Value, right: &Value) -> bool {
    match (left, right) {
        (Value::Array(left), Value::Array(right)) => arrays_equal(left, right),
        (Value::Object(left), Value::Object(right)) => objects_equal(left, right),
        _ => false,
    }
}

/// True when two arrays print identically: same length, pairwise equal.
fn arrays_equal(left: &[Value], right: &[Value]) -> bool {
    left.len() == right.len() && left.iter().zip(right.iter()).all(|(l, r)| values_equal(l, r))
}

/// True when two objects print identically: same keys, order-insensitively,
/// with pairwise equal values.
fn objects_equal(left: &serde_json::Map<String, Value>, right: &serde_json::Map<String, Value>) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .all(|(key, value)| right.get(key).is_some_and(|other| values_equal(value, other)))
}

/// True when two JSON numbers print identically. Integers print as their
/// decimal value, so integer-stored numbers compare by value; floats print
/// via the shortest-roundtrip printer, which maps bit patterns one-to-one
/// onto spellings (round-trip exactness), so float-stored numbers compare by
/// bits. The integer/float split comes first because the `as_*` accessors
/// convert across the split (`1.0` reads as `1`) while the spellings differ.
/// An int spelling (digits) can never equal a float spelling (always carrying
/// `.`/`e`), so mixed pairs are always unequal.
fn numbers_equal(left: &serde_json::Number, right: &serde_json::Number) -> bool {
    match (left.is_f64(), right.is_f64()) {
        (true, true) => left.as_f64().is_some_and(|left| {
            right.as_f64().is_some_and(|right| left.to_bits() == right.to_bits())
        }),
        (false, false) => ints_equal(left, right),
        _ => false,
    }
}

/// True when two integer-stored numbers share a value: the `i64` arm covers
/// every pair that fits, the `u64` arm covers the pairs above `i64::MAX`.
/// (A negative against a huge positive fits neither arm and is unequal.)
fn ints_equal(left: &serde_json::Number, right: &serde_json::Number) -> bool {
    if let (Some(left), Some(right)) = (left.as_i64(), right.as_i64()) {
        return left == right;
    }
    if let (Some(left), Some(right)) = (left.as_u64(), right.as_u64()) {
        return left == right;
    }
    false
}

impl Hash for MemoKey<'_> {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.0.system.hash(state);
        self.0.when.hash(state);
        self.0.prop.hash(state);
        self.0.important.hash(state);
        hash_value(&self.0.value, state);
    }
}

/// Hash a value canonically where cheap: objects combine entries
/// order-insensitively (insertion order varies under `preserve_order`),
/// arrays hash in order, numbers hash by stored representation. Any residual
/// mismatch with equality only costs a re-serialization, never a wrong byte.
fn hash_value<H: Hasher>(value: &Value, state: &mut H) {
    match value {
        Value::Array(items) => hash_array(items, state),
        Value::Object(map) => hash_object(map, state),
        scalar => hash_scalar(scalar, state),
    }
}

/// Hash one scalar value: nulls, bools, numbers by stored representation,
/// strings by content. Compounds never reach here (see [`hash_value`]).
fn hash_scalar<H: Hasher>(value: &Value, state: &mut H) {
    match value {
        Value::Null => 0u8.hash(state),
        Value::Bool(flag) => flag.hash(state),
        Value::Number(number) => hash_number(number, state),
        Value::String(text) => text.hash(state),
        _ => {}
    }
}

/// Hash an array in order: length, then each element.
fn hash_array<H: Hasher>(items: &[Value], state: &mut H) {
    items.len().hash(state);
    for item in items {
        hash_value(item, state);
    }
}

/// Hash an object order-insensitively: each entry hashes alone, then the
/// entry hashes combine commutatively (insertion order varies).
fn hash_object<H: Hasher>(map: &serde_json::Map<String, Value>, state: &mut H) {
    map.len().hash(state);
    let mut combined: u64 = 0;
    for (key, value) in map {
        let mut entry = rustc_hash::FxHasher::default();
        key.hash(&mut entry);
        hash_value(value, &mut entry);
        combined = combined.wrapping_add(entry.finish());
    }
    combined.hash(state);
}

/// Hash a number by stored representation, mirroring [`numbers_equal`]:
/// floats by bits, integers normalized by value (the arm taken depends only
/// on the value, so value-equal integers always hash alike).
fn hash_number<H: Hasher>(number: &serde_json::Number, state: &mut H) {
    if number.is_f64() {
        2u8.hash(state);
        if let Some(float) = number.as_f64() {
            float.to_bits().hash(state);
        }
    } else if let Some(int) = number.as_i64() {
        0u8.hash(state);
        int.hash(state);
    } else if let Some(int) = number.as_u64() {
        1u8.hash(state);
        int.hash(state);
    }
}

/// Index memo from borrowed expectation to its distinct serialization slot.
/// The map borrows session facts; the caller owns the serialized strings and
/// interprets slots as indexes into its own store. A hit means the caller's
/// stored string at that slot is byte-identical to this key's serialization,
/// so the caller clones the short stored string instead of re-serializing.
pub struct SerialMemo<'a> {
    indexes: rustc_hash::FxHashMap<MemoKey<'a>, u32>,
}

impl<'a> SerialMemo<'a> {
    /// An empty memo; capacity grows with the session's distinct keys.
    pub fn new() -> Self {
        Self {
            indexes: rustc_hash::FxHashMap::default(),
        }
    }

    /// The earlier slot holding this key's serialization, if any.
    pub fn find(&self, key: &'a OwnedLookupKey) -> Option<u32> {
        self.indexes.get(&MemoKey(key)).copied()
    }

    /// Record the slot where the caller just stored this key's serialization.
    pub fn insert(&mut self, key: &'a OwnedLookupKey, slot: u32) {
        self.indexes.insert(MemoKey(key), slot);
    }
}

impl Default for SerialMemo<'_> {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
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
}
