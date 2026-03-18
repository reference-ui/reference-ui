use std::fs;
use std::path::Path;

use serde_json::Value;

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
        Value::Object(map) => {
            if let Some(entry) = map.get(key) {
                return package_export_target(entry, ".");
            }

            if key == "." {
                for condition in ["types", "import", "default", "require"] {
                    if let Some(entry) = map.get(condition) {
                        if let Some(target) = package_export_target(entry, ".") {
                            return Some(target);
                        }
                    }
                }
            }

            None
        }
        _ => None,
    }
}
