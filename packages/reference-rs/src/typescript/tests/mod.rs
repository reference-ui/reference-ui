//! Rust-side smoke tests for the TypeScript scanner. Bundle output is emitted by the
//! compiled napi-rs runtime in Vitest globalSetup; Vitest tests (tests/*.test.ts) then
//! load and assert on that output.

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;

use super::{scan_typescript_bundle, ScanRequest};

const SCAN_HERE: &str = "scan_here";

#[test]
fn scans_fixture_successfully() {
    ensure_fixture_dependencies_installed();
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_input_dir(),
        include: vec![format!("{SCAN_HERE}/**/*.{{ts,tsx}}")],
    })
    .expect("fixture scan should succeed");
    assert_eq!(bundle.version, 1);
}

fn tests_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests")
}

fn fixture_input_dir() -> PathBuf {
    tests_dir().join("input")
}

fn ensure_fixture_dependencies_installed() {
    static INSTALL_ONCE: OnceLock<()> = OnceLock::new();

    INSTALL_ONCE.get_or_init(|| {
        let status = Command::new("npm")
            .args(["install", "--no-audit", "--no-fund"])
            .current_dir(fixture_input_dir())
            .status()
            .expect("fixture npm install should launch");

        assert!(status.success(), "fixture npm install should succeed");
    });
}
