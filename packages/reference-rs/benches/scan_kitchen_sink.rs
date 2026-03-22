//! Criterion benchmark: full tasty pipeline on the `kitchen_sink` fixture
//! (`scan_workspace` → `extract_ast` → `resolve_ast` → `build_typescript_bundle`).
//!
//! Run from `packages/reference-rs`:
//! `cargo bench --bench scan_kitchen_sink --no-default-features`
//!
//! (`napi` is optional so the bench binary links without Node N-API symbols; the
//! default feature set is still `napi` for `napi build` and normal `cargo test`.)
//!
//! The first run may execute `npm install` once under `tests/tasty/` (see scanner tests).

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use reference_virtual_native::{scan_typescript_bundle, ScanRequest};

const SCENARIO_KITCHEN_SINK: &str = "kitchen_sink";

fn fixture_tasty_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("tasty")
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

fn bench_scan_kitchen_sink(c: &mut Criterion) {
    ensure_fixture_dependencies_installed();

    let request = ScanRequest {
        root_dir: fixture_tasty_dir(),
        include: vec![format!(
            "cases/{SCENARIO_KITCHEN_SINK}/input/**/*.{{ts,tsx}}"
        )],
    };

    c.bench_function("scan_kitchen_sink", |b| {
        b.iter(|| {
            black_box(
                scan_typescript_bundle(black_box(&request))
                    .expect("kitchen sink fixture scan should succeed"),
            )
        })
    });
}

criterion_group!(benches, bench_scan_kitchen_sink);
criterion_main!(benches);
