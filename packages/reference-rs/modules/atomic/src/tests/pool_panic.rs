//! Regression tests for the pool panics: a panicking lane must come back from `compile` as an error.
//! The resolve and plan pools used to resume a lane's unwind into the caller, so one lane's panic took
//! the whole compile down. Each case forces four lanes, injects its panic through `panic_marker` (the
//! mechanism `parallel_panic` uses), and runs under that module's hang guard.

use super::parallel_panic::compile_guarded;
use crate::{CompileRequest, VirtualSource};

/// Marker on a source file name: the resolve lane owning a want from that file panics.
const RESOLVE_MARKER: &str = "p1-panic-resolve";
/// Marker in an authored value: the plan lane owning that declaration panics.
const PLAN_MARKER: &str = "p1-panic-plan";

/// One styling file with a colour and a margin, so it contributes two wants and two declarations.
fn styling(margin: &str) -> String {
    format!(
        "import {{ css }} from '@reference-ui/react';\nexport const c = css({{ color: 'red', marginTop: '{margin}' }});\n"
    )
}

/// Seven plain styling files plus `last`: enough sources to shard across four lanes.
fn request(last: VirtualSource) -> CompileRequest {
    let mut files: Vec<VirtualSource> = (0..7)
        .map(|index| VirtualSource {
            path: format!("src/c{index}.ts"),
            content: styling("4px"),
        })
        .collect();
    files.push(last);
    CompileRequest {
        files: Some(files),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..CompileRequest::default()
    }
}

/// The source file named by the marker holds wants, so its resolve lane panics.
fn resolve_request() -> CompileRequest {
    request(VirtualSource {
        path: format!("src/{RESOLVE_MARKER}.ts"),
        content: styling("8px"),
    })
}

/// The declaration whose authored value carries the marker makes its plan lane panic.
fn plan_request() -> CompileRequest {
    request(VirtualSource {
        path: "src/c7.ts".into(),
        content: styling(PLAN_MARKER),
    })
}

/// A panicking resolve lane must fail the compile with an error that names the phase.
#[test]
fn resolve_lane_panic_comes_back_as_compile_error() {
    let err = compile_guarded(resolve_request(), Some(4), "resolve lane panic")
        .expect_err("a panicking resolve lane must fail the compile");
    assert!(err.contains("resolve phase"), "unexpected error: {err}");
    assert!(err.contains(RESOLVE_MARKER), "unexpected error: {err}");
}

/// A panicking plan lane must fail the compile with an error that names the phase.
#[test]
fn plan_lane_panic_comes_back_as_compile_error() {
    let err = compile_guarded(plan_request(), Some(4), "plan lane panic")
        .expect_err("a panicking plan lane must fail the compile");
    assert!(err.contains("plan phase"), "unexpected error: {err}");
    assert!(err.contains(PLAN_MARKER), "unexpected error: {err}");
}
