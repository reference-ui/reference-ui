use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use super::{scan_typescript_bundle, ScanRequest};

#[test]
fn scans_basic_local_types_fixture_into_a_portable_bundle() {
    let fixture_dir = fixture_dir("basic-local-types");
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_dir.join("input"),
        include: vec!["**/*.{ts,tsx}".to_string()],
    })
    .expect("fixture scan should succeed");

    let actual = serde_json::to_value(&bundle).expect("bundle should serialize");
    let actual_pretty =
        serde_json::to_string_pretty(&actual).expect("bundle should serialize to pretty JSON");
    let expected_path = fixture_dir.join("expected.bundle.json");

    if std::env::var("REF_UPDATE_FIXTURES").as_deref() == Ok("1") {
        fs::write(&expected_path, format!("{actual_pretty}\n"))
            .expect("expected fixture bundle should be writable");
    }

    let expected: Value = serde_json::from_str(
        &fs::read_to_string(&expected_path).expect("expected fixture bundle should exist"),
    )
    .expect("expected bundle should parse");

    assert_eq!(actual, expected);
}

fn fixture_dir(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("typescript")
        .join("tests")
        .join("fixtures")
        .join(name)
}
