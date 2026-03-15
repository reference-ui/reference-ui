//! Rust-side smoke tests for the TypeScript scanner. Output correctness is tested in Vitest
//! (tests/*.test.ts). These tests ensure the scanner runs and emits bundles to the top-level
//! tests/output/ directory.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;
use std::time::{Duration, Instant};

use super::generator::emit_esm_bundle;
use super::{scan_typescript_bundle, ScanRequest, TypeScriptBundle};

const SCAN_HERE: &str = "scan_here";

#[test]
fn scans_fixture_successfully() {
    let bundle = scan_fixture(SCAN_HERE);
    assert_eq!(bundle.version, 1);
}

#[test]
fn emits_bundle_for_each_scenario_folder() {
    ensure_fixture_dependencies_installed();
    let scenarios = scenario_folders();
    assert!(
        !scenarios.is_empty(),
        "at least one scenario folder (e.g. scan_here) must exist under input/"
    );

    for scenario in &scenarios {
        let _bundle = scan_fixture(scenario);
        let path = fixture_output_esm_path(scenario);
        assert!(
            path.exists(),
            "bundle should be written for scenario {scenario}: {}",
            path.display()
        );
    }
}

/// Top-level tests dir (input/output live here; same layout as Vitest).
fn tests_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("tests")
}

fn fixture_input_dir() -> PathBuf {
    tests_dir().join("input")
}

fn fixture_output_dir() -> PathBuf {
    tests_dir().join("output")
}

/// Direct subfolders of `input/` (excluding `node_modules`) are scenarios. Each gets `output/{name}/bundle.js`.
fn scenario_folders() -> Vec<String> {
    let input = fixture_input_dir();
    let mut names: Vec<String> = fs::read_dir(&input)
        .expect("fixture input dir should be readable")
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_dir())
        .filter_map(|e| e.file_name().into_string().ok())
        .filter(|name| name != "node_modules")
        .collect();
    names.sort();
    names
}

fn fixture_output_esm_path(scenario: &str) -> PathBuf {
    fixture_output_dir().join(scenario).join("bundle.js")
}

fn fixture_metrics_path(scenario: &str) -> PathBuf {
    fixture_output_dir().join(scenario).join("bundle-metrics.txt")
}

/// Scan one scenario, write `output/{scenario}/bundle.js` (and metrics), return the bundle.
fn scan_fixture(scenario: &str) -> TypeScriptBundle {
    ensure_fixture_dependencies_installed();
    let total_start = Instant::now();
    let scan_start = Instant::now();
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_input_dir(),
        include: vec![format!("{scenario}/**/*.{{ts,tsx}}")],
    })
    .expect("fixture scan should succeed");
    let scan_duration = scan_start.elapsed();

    fs::create_dir_all(
        fixture_output_esm_path(scenario)
            .parent()
            .expect("output path should have parent"),
    )
    .expect("fixture output directory should be creatable");

    let emit_start = Instant::now();
    let esm_bundle = emit_esm_bundle(&bundle).expect("fixture ESM emission should succeed");
    let emit_duration = emit_start.elapsed();
    let total_duration = total_start.elapsed();
    let esm_output_path = fixture_output_esm_path(scenario);
    fs::write(
        &esm_output_path,
        format!(
            "{}\n",
            esm_bundle
                .modules
                .get(&esm_bundle.entrypoint)
                .expect("fixture ESM entry module should exist")
        ),
    )
    .expect("fixture output ESM should be writable");
    fs::write(
        fixture_metrics_path(scenario),
        render_bundle_metrics(&bundle, scan_duration, emit_duration, total_duration),
    )
    .expect("fixture metrics output should be writable");

    bundle
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

fn render_bundle_metrics(
    bundle: &TypeScriptBundle,
    scan_duration: Duration,
    emit_duration: Duration,
    total_duration: Duration,
) -> String {
    format!(
        "// bundle build metrics\n// scan_ms: {:.3}\n// emit_ms: {:.3}\n// total_ms: {:.3}\n// files: {}\n// symbols: {}\n// note: excludes fixture npm install\n\n",
        duration_ms(scan_duration),
        duration_ms(emit_duration),
        duration_ms(total_duration),
        bundle.files.len(),
        bundle.symbols.len(),
    )
}

fn duration_ms(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1000.0
}
