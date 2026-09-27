//! Cross-module extract tests and their shared compile helpers.
//!
//! Each submodule pins one behavior family across the extract passes —
//! branches, calls, gating, identity, responsive shapes, selections, site
//! plans, staleness — compiling tiny virtual programs end to end. The
//! helpers below build those programs and filter the compiler channel,
//! so submodules assert on wants, sinks, and diagnostics alike.

mod branches;
mod calls;
mod gating;
mod identity;
mod responsive;
mod selection;
mod site_plan;
mod staleness;

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    compile_code_inner(code, Some(vec!["proof".to_string()]))
}

fn compile_code_logs(code: &str) -> crate::CompileResult {
    compile_code_inner(code, Some(vec!["compiler".to_string(), "proof".to_string()]))
}

fn compile_code_inner(code: &str, logs: Option<Vec<String>>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs,
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// Channel lines carrying this code. The backchannel also carries analysis
/// telemetry, so moved-line assertions filter by code.
fn channel_for(res: &crate::CompileResult, code: crate::DiagnosticCode) -> Vec<crate::Diagnostic> {
    res.compiler_diagnostics
        .as_deref()
        .expect("compiler channel requested")
        .iter()
        .filter(|diag| diag.code == code)
        .cloned()
        .collect()
}

/// True when the want was minted by harvest (the §2 floor), not the site walk.
fn is_harvest(want: &crate::atom::Want) -> bool {
    want.origin.as_deref() == Some(crate::extract::harvest::HARVEST_ORIGIN)
}
