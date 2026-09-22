//! Regression tests for the p0a barrier-hang fix: panics become errors.
//!
//! The old phase fenced every round with a `Barrier` while the coordinator ran
//! a lane inline, so one panicking lane hung the sync compile forever. These
//! tests inject a panic into each phase — record, refs, walk, and the
//! coordinator's publish — and require a prompt error instead of a hang. A
//! timeout guard fails loudly if the hang ever returns, and the lane-count
//! tests pin single-file and one-versus-N behavior.

use std::time::Duration;

use crate::lanes::force_lane_count;
use crate::{compile, CompileRequest, CompileResult, VirtualSource};

/// Marker comments that panic one thread in one phase (see `panic_marker`).
const RECORD: &str = "p0a-panic-record";
const REFS: &str = "p0a-panic-refs";
const WALK: &str = "p0a-panic-walk";
const PUBLISH: &str = "p0a-panic-publish";

/// How long a regression compile may run before it counts as the old hang.
const HANG_TIMEOUT: Duration = Duration::from_secs(60);

/// Shared token plus `styling` styling files; one file may carry a panic
/// marker comment. Sources sort by path, so the c-files come first and the
/// token file lands last. Nine sources over four lanes stride as
/// lane 0: [0,4,8], lane 1: [1,5], lane 2: [2,6], lane 3: [3,7], so styling
/// index 0 lands on lane 0, index 5 on lane 1, and index 7 on lane 3.
fn request(styling: usize, marker: Option<(usize, &str)>) -> CompileRequest {
    let mut files = vec![VirtualSource {
        path: "src/tokens.ts".into(),
        content: "export const gap = '4px';\n".into(),
    }];
    files.extend((0..styling).map(|index| {
        let mut content = format!(
            "import {{ css }} from '@reference-ui/react';\nimport {{ gap }} from './tokens';\nexport const c{index} = css({{ color: 'red', marginTop: gap }});\n"
        );
        if let Some((at, text)) = marker {
            if at == index {
                content.push_str("// ");
                content.push_str(text);
                content.push('\n');
            }
        }
        VirtualSource {
            path: format!("src/c{index}.ts"),
            content,
        }
    }));
    CompileRequest {
        files: Some(files),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..CompileRequest::default()
    }
}

/// Compile on a helper thread with a forced lane count, failing on timeout.
/// The hang this gates against would stall the suite forever; the timeout
/// turns a regression into a loud failure naming the hung scenario.
fn compile_guarded(
    request: CompileRequest,
    workers: Option<usize>,
    scenario: &'static str,
) -> Result<CompileResult, String> {
    let (tx, rx) = std::sync::mpsc::channel();
    std::thread::spawn(move || {
        force_lane_count(workers);
        let _ = tx.send(compile(&request));
    });
    rx.recv_timeout(HANG_TIMEOUT)
        .unwrap_or_else(|_| panic!("p0a hang: {scenario} never returned"))
}

/// A lane that panics before the first rendezvous must fail the compile.
#[test]
fn panic_before_first_rendezvous_surfaces_as_error() {
    let err = compile_guarded(request(8, Some((0, RECORD))), Some(4), "record panic")
        .expect_err("record panic must fail the compile");
    assert!(err.contains("lane 0"), "unexpected error: {err}");
    assert!(err.contains("record"), "unexpected error: {err}");
}

/// A lane that panics mid-phase, while collecting refs, must fail the compile.
#[test]
fn panic_mid_phase_refs_surfaces_as_error() {
    let err = compile_guarded(request(8, Some((5, REFS))), Some(4), "refs panic")
        .expect_err("refs panic must fail the compile");
    assert!(err.contains("lane 1"), "unexpected error: {err}");
    assert!(err.contains("refs"), "unexpected error: {err}");
}

/// A lane that panics mid-phase, while walking, must fail the compile.
#[test]
fn panic_mid_phase_walk_surfaces_as_error() {
    let err = compile_guarded(request(8, Some((7, WALK))), Some(4), "walk panic")
        .expect_err("walk panic must fail the compile");
    assert!(err.contains("lane 3"), "unexpected error: {err}");
    assert!(err.contains("walk"), "unexpected error: {err}");
}

/// A coordinator that panics while publishing must fail the compile, and the
/// waiting lanes must release instead of hanging the sync call.
#[test]
fn panic_on_coordinator_surfaces_as_error() {
    let err = compile_guarded(request(8, Some((0, PUBLISH))), Some(4), "coordinator panic")
        .expect_err("coordinator panic must fail the compile");
    assert!(err.contains("coordinator"), "unexpected error: {err}");
}

/// Every lane dying in the same round still fails fast, naming the first dead.
#[test]
fn all_lanes_dying_in_one_round_surfaces_as_error() {
    let mut req = request(8, Some((0, RECORD)));
    if let Some(files) = req.files.as_mut() {
        files[8].content.push_str("// ");
        files[8].content.push_str(RECORD);
        files[8].content.push('\n');
    }
    let err = compile_guarded(req, Some(4), "all-lanes panic")
        .expect_err("dead lanes must fail the compile");
    assert!(err.contains("lane 0"), "unexpected error: {err}");
    assert!(err.contains("record"), "unexpected error: {err}");
}

/// A single-file compile takes the serial path and succeeds.
#[test]
fn single_file_input_compiles() {
    let request = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "src/only.ts".into(),
            content: "import { css } from '@reference-ui/react';\nexport const only = css({ color: 'red' });\n"
                .into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..CompileRequest::default()
    };
    let ok = compile_guarded(request, None, "single file").expect("single file must compile");
    assert!(!ok.stylesheet.is_empty());
}

/// Every lane width strides the same 70-file fixture differently, yet each
/// commits byte-identical output: sheet, portable sheet, atoms, and
/// diagnostics all match the one-lane baseline at 1/2/3/8/16.
#[test]
fn strided_widths_match_serial_bytes() {
    let serial = compile_guarded(request(70, None), Some(1), "one lane")
        .expect("one lane must compile");
    for lanes in [2, 3, 8, 16] {
        let parallel = compile_guarded(request(70, None), Some(lanes), "n lanes")
            .expect("n lanes must compile");
        assert_eq!(serial.stylesheet, parallel.stylesheet, "sheet at {lanes}");
        assert_eq!(
            serial.portable_stylesheet, parallel.portable_stylesheet,
            "portable at {lanes}"
        );
        assert_eq!(serial.atom_count, parallel.atom_count, "atoms at {lanes}");
        assert_eq!(
            serial.diagnostics, parallel.diagnostics,
            "diagnostics at {lanes}"
        );
    }
}

/// One lane and N lanes produce the same sheet, diagnostics, and atom count.
#[test]
fn one_lane_matches_n_lanes() {
    let serial =
        compile_guarded(request(8, None), Some(1), "one lane").expect("one lane must compile");
    let parallel =
        compile_guarded(request(8, None), Some(4), "n lanes").expect("n lanes must compile");
    assert_eq!(serial.stylesheet, parallel.stylesheet);
    assert_eq!(serial.portable_stylesheet, parallel.portable_stylesheet);
    assert_eq!(serial.atom_count, parallel.atom_count);
    assert_eq!(serial.diagnostics, parallel.diagnostics);
}
