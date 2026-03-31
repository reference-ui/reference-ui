use std::fs;
use std::path::Path;

use serde_json::{Map, Value};

pub(super) fn read_package_json(path: &Path) -> Option<Value> {
    let source = fs::read_to_string(path).ok()?;
    serde_json::from_str(&source).ok()
}

pub(super) fn package_export_target(exports: &Value, key: &str) -> Option<String> {
    match exports {
        Value::String(value) => (key == ".").then(|| value.to_string()),
        Value::Array(values) => values
            .iter()
            .find_map(|value| package_export_target(value, key)),
        Value::Object(map) => package_export_target_from_object(map, key),
        _ => None,
    }
}

fn package_export_target_from_object(map: &Map<String, Value>, key: &str) -> Option<String> {
    map.get(key)
        .and_then(|entry| package_export_target(entry, "."))
        .or_else(|| package_export_target_from_conditions(map, key))
}

fn package_export_target_from_conditions(map: &Map<String, Value>, key: &str) -> Option<String> {
    if key != "." {
        return None;
    }

    ["types", "import", "default", "require"]
        .into_iter()
        .filter_map(|condition| map.get(condition))
        .find_map(|entry| package_export_target(entry, "."))
}
