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

/// Five-tuple describing an authored style lookup target.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct LookupKey<'a> {
    pub system: &'a str,
    pub when: &'a [String],
    pub prop: &'a str,
    pub value: &'a Value,
    pub important: bool,
}

impl<'a> LookupKey<'a> {
    pub fn new(
        system: &'a str,
        when: &'a [String],
        prop: &'a str,
        value: &'a Value,
    ) -> Self {
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

/// Compute the stable lookup key string for an authored declaration.
/// Formats the tuple `(system, when, prop, canonical_value, important)` into compact JSON.
pub fn serialize_lookup_key(key: &LookupKey<'_>) -> String {
    let canonical_val = canonical_json_value(key.value);
    let tuple = (key.system, key.when, key.prop, &canonical_val, key.important);
    serde_json::to_string(&tuple).unwrap_or_else(|_| String::new())
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
        let key = serialize_lookup_key(&LookupKey::new(
            "lib-test-system",
            &hover,
            "color",
            &val,
        ));
        assert_eq!(key, r#"["lib-test-system",["_hover"],"color","red.500",false]"#);
    }

    #[test]
    fn test_serialize_lookup_key_array_with_null() {
        let val = json!(["1", null, "4"]);
        let key = serialize_lookup_key(&LookupKey::new(
            "lib-test-system",
            &[],
            "padding",
            &val,
        ));
        assert_eq!(key, r#"["lib-test-system",[],"padding",["1",null,"4"],false]"#);
    }

    #[test]
    fn test_serialize_lookup_key_nested_r_object() {
        let val = json!({ "$r": 2 });
        let key = serialize_lookup_key(
            &LookupKey::new("lib-test-system", &[], "marginTop", &val).with_important(true),
        );
        assert_eq!(key, r#"["lib-test-system",[],"marginTop",{"$r":2},true]"#);
    }
}
