//! Scanner smoke test (fixture bundle).

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;

use super::super::{scan_typescript_bundle, ScanRequest};

const SCENARIO_EXTERNAL_LIBS: &str = "external_libs";
const SCENARIO_KITCHEN_SINK: &str = "kitchen_sink";

#[test]
fn scans_fixture_successfully() {
    ensure_fixture_dependencies_installed();
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_tasty_dir(),
        include: vec![format!(
            "cases/{SCENARIO_EXTERNAL_LIBS}/input/**/*.{{ts,tsx}}"
        )],
    })
    .expect("fixture scan should succeed");
    assert_eq!(bundle.version, 1);
}

#[test]
fn scans_kitchen_sink_fixture() {
    ensure_fixture_dependencies_installed();
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_tasty_dir(),
        include: vec![format!(
            "cases/{SCENARIO_KITCHEN_SINK}/input/**/*.{{ts,tsx}}"
        )],
    })
    .expect("kitchen sink fixture scan should succeed");
    assert_eq!(bundle.version, 1);
    assert!(
        bundle
            .symbols
            .values()
            .any(|symbol| symbol.name == "DocsReferenceButtonProps"),
        "expected DocsReferenceButtonProps symbol in bundle"
    );
}

fn tests_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("tasty")
}

fn fixture_tasty_dir() -> PathBuf {
    tests_dir()
}

fn ensure_fixture_dependencies_installed() {
    static INSTALL_ONCE: OnceLock<()> = OnceLock::new();

    INSTALL_ONCE.get_or_init(|| {
        let status = Command::new("npm")
            .args(["install", "--no-audit", "--no-fund"])
            .current_dir(fixture_tasty_dir())
            .status()
            .expect("fixture npm install should launch");

        assert!(status.success(), "fixture npm install should succeed");
    });
}
