//! package.json metadata helpers.
//! Reads package manifests and resolves export-map targets conservatively for declaration discovery.
//! Only a regular file is read as a manifest, so a FIFO named package.json is skipped instead of blocking the scan.

use std::fs;
use std::path::Path;

use serde_json::{Map, Value};

pub(super) fn read_package_json(path: &Path) -> Option<Value> {
    // Opening a FIFO blocks until a writer appears, so only regular files are read.
    if !fs::metadata(path).is_ok_and(|meta| meta.is_file()) {
        return None;
    }
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

#[cfg(all(test, unix))]
mod tests {
    use std::sync::mpsc;
    use std::time::Duration;

    use super::read_package_json;

    /// A FIFO named package.json reads as missing without being opened, inside a 5 s bound.
    #[test]
    fn read_package_json_skips_a_fifo() {
        let root = std::env::temp_dir().join(format!("tasty-fifo-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        let pipe = root.join("package.json");
        let status = std::process::Command::new("mkfifo").arg(&pipe).status().unwrap();
        assert!(status.success(), "mkfifo failed for {}", pipe.display());
        let (send, recv) = mpsc::channel();
        std::thread::spawn(move || {
            let _ = send.send(read_package_json(&pipe));
        });
        let read = recv.recv_timeout(Duration::from_secs(5)).expect("the read blocked on a FIFO");
        assert_eq!(read, None);
        let _ = std::fs::remove_dir_all(&root);
    }
}
