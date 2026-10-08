//! Deterministic serialization for runtime lookup keys and authored style values.
//! Ensures identical byte-level lookup string generation across Rust and TypeScript.
//! Recursively sorts object keys and formats scalar values into canonical JSON representations.
//! Evaluates five-tuple lookup keys consisting of system, when, prop, value, and important.

use serde_json::Value;
use std::collections::BTreeMap;

/// Recursively canonicalize a JSON value by sorting all object keys lexicographically.
pub fn canonical_json_value(value: &Value) -> Value {
    match value {
        Value::Object(map) => {
            let mut sorted = BTreeMap::new();
            for (k, v) in map {
                sorted.insert(k.clone(), canonical_json_value(v));
            }
            Value::Object(sorted.into_iter().collect())
        }
        Value::Array(arr) => {
            let mapped = arr.iter().map(canonical_json_value).collect();
            Value::Array(mapped)
        }
        _ => value.clone(),
    }
}

/// Serialize an authored style value into a compact, canonical JSON string.
pub fn serialize_value(value: &Value) -> String {
    let canonical = canonical_json_value(value);
    serde_json::to_string(&canonical).unwrap_or_else(|_| "null".to_string())
}

/// Five-tuple describing an authored style lookup target. The condition
/// stack stays generic so owned keys borrow their boxed steps directly
/// instead of cloning a `Vec<String>` per serialization.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LookupKey<'a, W: ?Sized = [String]> {
    pub system: &'a str,
    pub when: &'a W,
    pub prop: &'a str,
    pub value: &'a Value,
    pub important: bool,
}

impl<'a> LookupKey<'a> {
    pub fn new(system: &'a str, when: &'a [String], prop: &'a str, value: &'a Value) -> Self {
        Self {
            system,
            when,
            prop,
            value,
            important: false,
        }
    }

    pub fn with_important(mut self, important: bool) -> Self {
        self.important = important;
        self
    }
}

/// Step iteration over a condition stack, normalizing every live `W` to
/// `&str` rows for the scalar fast frame. The serde fallback keeps its
/// own bound; this trait only serves the hand writer.
pub trait WhenSteps {
    fn steps(&self) -> impl Iterator<Item = &str>;
}

impl WhenSteps for [String] {
    fn steps(&self) -> impl Iterator<Item = &str> {
        self.iter().map(String::as_str)
    }
}

impl WhenSteps for Vec<String> {
    fn steps(&self) -> impl Iterator<Item = &str> {
        self.iter().map(String::as_str)
    }
}

impl WhenSteps for [Box<str>] {
    fn steps(&self) -> impl Iterator<Item = &str> {
        self.iter().map(|step| &**step)
    }
}

/// Compute the stable lookup key string for an authored declaration.
/// Formats the tuple `(system, when, prop, canonical_value, important)` into compact JSON.
/// Scalar values take the hand-rolled frame (no canonical clone, no serde
/// tuple machinery); containers keep the diet path verbatim.
pub fn serialize_lookup_key<W: serde::Serialize + WhenSteps + ?Sized>(
    key: &LookupKey<'_, W>,
) -> String {
    if is_fast_scalar(key.value) {
        write_scalar_tuple(key)
    } else {
        let canonical_val = canonical_json_value(key.value);
        let tuple = (
            key.system,
            key.when,
            key.prop,
            &canonical_val,
            key.important,
        );
        serde_json::to_string(&tuple).unwrap_or_else(|_| String::new())
    }
}

/// Scalar values need no canonicalization (identity) and no serde tuple
/// machinery: the writer below emits their bytes directly.
fn is_fast_scalar(value: &Value) -> bool {
    matches!(
        value,
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_)
    )
}

/// Hand-rolled five-tuple writer for scalar values. Byte-identical to the
/// serde path: same `[` framing, same string escaping, same literals.
fn write_scalar_tuple<W: WhenSteps + ?Sized>(key: &LookupKey<'_, W>) -> String {
    let mut cap = key.system.len() + key.prop.len() + 20;
    for step in key.when.steps() {
        cap += step.len() + 3;
    }
    cap += scalar_len_hint(key.value);
    let mut out = String::with_capacity(cap);
    out.push('[');
    push_json_string(&mut out, key.system);
    out.push(',');
    out.push('[');
    for (index, step) in key.when.steps().enumerate() {
        if index > 0 {
            out.push(',');
        }
        push_json_string(&mut out, step);
    }
    out.push_str("],");
    push_json_string(&mut out, key.prop);
    out.push(',');
    push_scalar_json(&mut out, key.value);
    out.push(',');
    out.push_str(if key.important { "true" } else { "false" });
    out.push(']');
    out
}

/// Capacity hint for the scalar slot: exact for strings, roomy for the
/// rare literals (never reached on the bench corpus).
fn scalar_len_hint(value: &Value) -> usize {
    if let Value::String(text) = value {
        text.len() + 2
    } else {
        8
    }
}

/// Render one scalar slot exactly as serde_json would: quoted strings on
/// the hot path, bare literals and the serde number printer off it.
fn push_scalar_json(out: &mut String, value: &Value) {
    if let Value::String(text) = value {
        push_json_string(out, text);
    } else {
        push_scalar_literal(out, value);
    }
}

/// Render a non-string scalar slot. Containers never reach here
/// (`is_fast_scalar` guards the caller); the arm keeps the match exhaustive.
fn push_scalar_literal(out: &mut String, value: &Value) {
    match value {
        Value::Bool(true) => out.push_str("true"),
        Value::Bool(false) => out.push_str("false"),
        Value::Null => out.push_str("null"),
        Value::Number(_) => {
            let rendered = serde_json::to_string(value).unwrap_or_else(|_| "null".to_string());
            out.push_str(&rendered);
        }
        _ => out.push_str("null"),
    }
}

/// Escapability per byte value, built at compile time: C0 controls plus
/// `"` and `\`, exactly serde_json's escape set.
const fn escapable_table() -> [bool; 256] {
    let mut table = [false; 256];
    let mut byte = 0;
    while byte < 0x20 {
        table[byte] = true;
        byte += 1;
    }
    table[b'"' as usize] = true;
    table[b'\\' as usize] = true;
    table
}

static ESCAPABLE: [bool; 256] = escapable_table();

/// Append one JSON string literal with serde_json's exact escaping: `\"`,
/// `\\`, short forms for `\b \t \n \f \r`, `\u00xx` (lowercase hex) for
/// other C0 controls, everything else verbatim.
fn push_json_string(out: &mut String, text: &str) {
    out.push('"');
    let bytes = text.as_bytes();
    let mut run_start = 0;
    let mut cursor = 0;
    while cursor < bytes.len() {
        let byte = bytes[cursor];
        if ESCAPABLE[byte as usize] {
            out.push_str(&text[run_start..cursor]);
            push_escape(out, byte);
            run_start = cursor + 1;
        }
        cursor += 1;
    }
    out.push_str(&text[run_start..]);
    out.push('"');
}

/// Short escape letter per byte value, built at compile time: 0 means
/// no short form (generic `\u00xx`), otherwise the letter after `\`.
const fn short_escape_table() -> [u8; 256] {
    let mut table = [0; 256];
    table[b'"' as usize] = b'"';
    table[b'\\' as usize] = b'\\';
    table[0x08] = b'b';
    table[0x09] = b't';
    table[0x0A] = b'n';
    table[0x0C] = b'f';
    table[0x0D] = b'r';
    table
}

static SHORT_ESCAPE: [u8; 256] = short_escape_table();

/// Append one escape sequence for a byte the caller already classified as
/// escapable (`"`, `\`, or C0). Lowercase hex matches serde_json.
fn push_escape(out: &mut String, byte: u8) {
    const HEX: &[u8; 16] = b"0123456789abcdef";
    let short = SHORT_ESCAPE[byte as usize];
    if short != 0 {
        out.push('\\');
        out.push(short as char);
    } else {
        out.push_str("\\u00");
        out.push(HEX[(byte >> 4) as usize] as char);
        out.push(HEX[(byte & 0x0F) as usize] as char);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_canonical_json_value_sorts_keys() {
        let val = json!({ "b": 1, "a": { "z": 9, "y": 8 } });
        let serialized = serialize_value(&val);
        assert_eq!(serialized, r#"{"a":{"y":8,"z":9},"b":1}"#);
    }

    #[test]
    fn test_serialize_lookup_key_format() {
        let hover = ["_hover".to_string()];
        let val = json!("red.500");
        let key = serialize_lookup_key(&LookupKey::new("lib-test-system", &hover, "color", &val));
        assert_eq!(
            key,
            r#"["lib-test-system",["_hover"],"color","red.500",false]"#
        );
    }

    #[test]
    fn test_serialize_lookup_key_array_with_null() {
        let val = json!(["1", null, "4"]);
        let key = serialize_lookup_key(&LookupKey::new("lib-test-system", &[], "padding", &val));
        assert_eq!(
            key,
            r#"["lib-test-system",[],"padding",["1",null,"4"],false]"#
        );
    }

    #[test]
    fn test_serialize_lookup_key_nested_r_object() {
        let val = json!({ "$r": 2 });
        let key = serialize_lookup_key(
            &LookupKey::new("lib-test-system", &[], "marginTop", &val).with_important(true),
        );
        assert_eq!(key, r#"["lib-test-system",[],"marginTop",{"$r":2},true]"#);
    }

    /// Landed-diet body kept as the differential oracle: canonicalize
    /// containers, borrow scalars, always write through the serde tuple.
    fn serde_tuple_diet<W: serde::Serialize + ?Sized>(key: &LookupKey<'_, W>) -> String {
        let canonical_val;
        let value = match key.value {
            Value::Object(_) | Value::Array(_) => {
                canonical_val = canonical_json_value(key.value);
                &canonical_val
            }
            scalar => scalar,
        };
        let tuple = (key.system, key.when, key.prop, value, key.important);
        serde_json::to_string(&tuple).unwrap_or_else(|_| String::new())
    }

    /// One differential case, checked under every live `W`. The full
    /// per-`W` matrix (byte values, adversarial steps, fuzz) lives in
    /// `tests/serializer_parity.rs`; this test only smokes each `W` here.
    #[test]
    fn scalar_fast_frame_matches_diet_on_each_live_w() {
        let val = json!("red.500");
        let when = ["_hover".to_string()];
        let owned = when.to_vec();
        let boxed: Vec<Box<str>> = when.iter().map(|step| step.as_str().into()).collect();
        let slice = LookupKey::new("s", &when, "color", &val);
        let over_vec = LookupKey {
            system: "s",
            when: &owned,
            prop: "color",
            value: &val,
            important: false,
        };
        let over_boxed = LookupKey {
            system: "s",
            when: boxed.as_slice(),
            prop: "color",
            value: &val,
            important: false,
        };
        let want = serde_tuple_diet(&slice);
        assert_eq!(serialize_lookup_key(&slice), want);
        assert_eq!(serialize_lookup_key(&over_vec), want);
        assert_eq!(serialize_lookup_key(&over_boxed), want);
    }
}
