//! Slot-state tests for the parallel parse phase.
//!
//! Each test pins one refusal contract: a blank slot never merges, a
//! mid-record panic at any fold leaves partial state behind, a poisoned
//! mutex reclaims exactly once with a diagnostic, and edge inputs refuse
//! loudly instead of merging half-filled.

use std::panic::{AssertUnwindSafe, catch_unwind};
use std::sync::Mutex;

use oxc_allocator::Allocator;

use crate::phase_lane::{self, OwnedFile, RecordIn, RecordStage, SlotState};

/// One styling source for record tests.
fn styling_source() -> (String, String) {
    (
        "src/a.ts".to_string(),
        "import { css } from '@reference-ui/react';\nexport const a = css({ color: 'red' });\n".to_string(),
    )
}

/// A blank slot is empty and never merges.
#[test]
fn blank_is_empty_and_refuses() {
    let mut file = OwnedFile::blank();
    assert_eq!(file.state, SlotState::Empty);
    assert!(!file.is_mergeable());
    file.ensure_mergeable();
    assert!(file.panicked);
    assert!(!file.is_mergeable());
    assert_eq!(file.errors.len(), 1);
}

/// A successful record commits complete with all owned products.
#[test]
fn record_success_completes() {
    let alloc = Allocator::default();
    let (path, content) = styling_source();
    let parsed = crate::parse_source(&path, &content, &alloc);
    assert!(!parsed.panicked);
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    let mut file = OwnedFile::blank();
    phase_lane::record(
        &mut file,
        &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
    );
    assert_eq!(file.state, SlotState::Complete);
    assert!(file.is_mergeable());
    assert!(file.record.is_some());
    assert!(file.export_map.is_some());
}

/// A parser-panicked parse fails fast with errors kept and nothing folded.
#[test]
fn record_panicked_fails_fast() {
    let alloc = Allocator::default();
    let (path, content) = styling_source();
    let mut parsed = crate::parse_source(&path, &content, &alloc);
    parsed.panicked = true;
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    let mut file = OwnedFile::blank();
    phase_lane::record(
        &mut file,
        &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
    );
    assert_eq!(file.state, SlotState::ParserPanicked);
    assert!(file.panicked);
    assert!(!file.is_mergeable());
    assert!(file.record.is_none());
    assert!(file.export_map.is_none());
}

/// A panic at any record fold leaves that stage partial with data untouched.
#[test]
fn panic_at_each_stage_leaves_partial() {
    let alloc = Allocator::default();
    let (path, content) = styling_source();
    let parsed = crate::parse_source(&path, &content, &alloc);
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    for stage in RecordStage::all() {
        let mut file = OwnedFile::blank();
        phase_lane::set_panic_at_stage(Some(stage));
        let outcome = catch_unwind(AssertUnwindSafe(|| {
            phase_lane::record(
                &mut file,
                &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
            );
        }));
        phase_lane::set_panic_at_stage(None);
        assert!(outcome.is_err(), "stage {stage:?} must panic");
        assert_eq!(file.state, SlotState::Partial { stage }, "stage {stage:?}");
        assert!(!file.is_mergeable());
        assert!(file.record.is_none(), "stage {stage:?} must not half-fill");
    }
}

/// A poisoned mutex reclaims once, marks failed, and never half-fills.
#[test]
fn poisoned_lock_reclaims_with_diagnostic() {
    let alloc = Allocator::default();
    let (path, content) = styling_source();
    let parsed = crate::parse_source(&path, &content, &alloc);
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    for stage in RecordStage::all() {
        let mutex = Mutex::new(OwnedFile::blank());
        phase_lane::set_panic_at_stage(Some(stage));
        let _ = catch_unwind(AssertUnwindSafe(|| {
            let mut guard = mutex.lock().unwrap();
            phase_lane::record(
                &mut guard,
                &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
            );
        }));
        phase_lane::set_panic_at_stage(None);
        let guard = phase_lane::lock(&mutex);
        assert!(guard.recovered(), "stage {stage:?}");
        assert!(guard.panicked);
        assert!(!guard.is_mergeable());
        assert!(matches!(guard.state, SlotState::Poisoned { .. }), "stage {stage:?}");
        assert_eq!(guard.errors.len(), 1, "stage {stage:?}");
        assert!(guard.record.is_none(), "stage {stage:?}");
    }
}

/// Reusing a poisoned lock stays failed with exactly one diagnostic.
#[test]
fn poison_reuse_stays_failed_once() {
    let mutex = Mutex::new(OwnedFile::blank());
    let _ = catch_unwind(AssertUnwindSafe(|| {
        let _guard = mutex.lock().unwrap();
        panic!("boom");
    }));
    let sibling = Mutex::new(OwnedFile::blank());
    {
        let guard = phase_lane::lock(&mutex);
        assert!(guard.recovered());
        assert_eq!(guard.errors.len(), 1);
    }
    {
        let guard = phase_lane::lock(&mutex);
        assert!(guard.recovered());
        assert_eq!(guard.errors.len(), 1);
    }
    {
        let guard = phase_lane::lock(&sibling);
        assert!(!guard.recovered());
        assert_eq!(guard.state, SlotState::Empty);
    }
}

/// Poison after complete still refuses instead of trusting the old data.
#[test]
fn poison_after_complete_refuses() {
    let alloc = Allocator::default();
    let (path, content) = styling_source();
    let parsed = crate::parse_source(&path, &content, &alloc);
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    let mutex = Mutex::new(OwnedFile::blank());
    {
        let mut guard = mutex.lock().unwrap();
        phase_lane::record(
            &mut guard,
            &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
        );
        assert!(guard.is_mergeable());
    }
    let _ = catch_unwind(AssertUnwindSafe(|| {
        let _guard = mutex.lock().unwrap();
        panic!("boom after complete");
    }));
    let guard = phase_lane::lock(&mutex);
    assert!(guard.recovered());
    assert!(!guard.is_mergeable());
    assert!(guard.panicked);
    assert_eq!(guard.errors.len(), 1);
}

/// Every panicked input refuses; none merges constants or records.
#[test]
fn all_panicked_inputs_refuse() {
    let surface = crate::hosts::engine_surface(crate::BaseSystem::lib_fixture());
    let mut files = Vec::new();
    for index in 0..3 {
        let alloc = Allocator::default();
        let path = format!("src/p{index}.ts");
        let content = "export const x = 1;\n".to_string();
        let mut parsed = crate::parse_source(&path, &content, &alloc);
        parsed.panicked = true;
        let mut file = OwnedFile::blank();
        phase_lane::record(
            &mut file,
            &RecordIn { path: &path, content: &content, parsed: &parsed, harvest: true, trace_root: None, surface: &surface },
        );
        files.push(file);
    }
    for file in &mut files {
        assert!(file.panicked);
        assert!(!file.is_mergeable());
        file.ensure_mergeable();
        assert!(file.record.is_none());
    }
}

/// An empty parallel run returns vacant hosts without touching a lane.
#[test]
fn empty_parallel_run_is_vacant() {
    let request = crate::CompileRequest {
        files: Some(Vec::new()),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..crate::CompileRequest::default()
    };
    let sources: Vec<(String, String)> = Vec::new();
    let mut wants = Vec::new();
    let mut recipes = Vec::new();
    let mut diagnostics = Vec::new();
    let mut authored = Vec::new();
    let mut sinks = Vec::new();
    let mut session = crate::diagnostics::DiagnosticsSession::new();
    let mut tentative = Vec::new();
    let mut bindings = Vec::new();
    let mut selections = Vec::new();
    let sinks = crate::CompileSinks {
        wants: &mut wants,
        recipes: &mut recipes,
        diagnostics: &mut diagnostics,
        authored: &mut authored,
        sinks: &mut sinks,
        session: &mut session,
        tentative: &mut tentative,
        recipe_bindings: &mut bindings,
        selections: &mut selections,
    };
    let plan = crate::lanes::Lanes::fixed(2).plan_with(crate::lanes::WorkKind::FrontFiles, 8, 16);
    let guard = plan.enter().expect("fixed plan spawns");
    let (unpanicked, hosts) =
        crate::phase_parallel::run(&request, &sources, sinks, &guard).expect("empty run is vacant");
    assert!(unpanicked.is_empty());
    assert!(hosts.traced.is_empty());
}

/// Refused slots surface as parse diagnostics, never silent omission.
#[test]
fn refused_errors_report_as_diagnostics() {
    let mut file = OwnedFile::blank();
    file.ensure_mergeable();
    let sources = vec![("src/a.ts".to_string(), "export const x = 1;\n".to_string())];
    let errors = vec![file.errors.clone()];
    let mut diagnostics = Vec::new();
    crate::stream::report_parse_errors(&sources, &errors, &mut diagnostics);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics[0].code, crate::DiagnosticCode::ParseError);
    assert!(diagnostics[0].message.contains("parallel slot"));
}
