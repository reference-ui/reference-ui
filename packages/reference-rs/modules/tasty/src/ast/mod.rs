//! Oxc-based TypeScript AST extraction layer.
//!
//! This module owns parser-facing logic and the normalized AST-adjacent model
//! that the rest of the TypeScript pipeline operates on. Extraction resolves
//! import specifiers through the resolver carried on the scanned workspace, so
//! discovery and extraction share one memo per scan.

mod extract;
pub(crate) mod model;
mod resolve;

use super::diagnostics::{DiagnosticError, TastyDiagnostic};
use super::scanner::ScannedWorkspace;
use model::ParsedTypeScriptAst;
pub(crate) use resolve::{resolve_ast, ResolvedTypeScriptGraph};

pub(crate) fn extract_ast(
    scanned_workspace: &ScannedWorkspace,
) -> Result<ParsedTypeScriptAst, DiagnosticError> {
    let mut diagnostics = Vec::<TastyDiagnostic>::new();
    let files = extract::extract_files(
        scanned_workspace,
        &scanned_workspace.resolver,
        &mut diagnostics,
    )?;

    Ok(ParsedTypeScriptAst {
        files,
        diagnostics,
        bridged_libraries: scanned_workspace.bridged_libraries.clone(),
    })
}
