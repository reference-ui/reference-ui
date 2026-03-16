//! Oxc-based TypeScript AST extraction layer.
//!
//! This module owns parser-facing logic and the normalized AST-adjacent model
//! that the rest of the TypeScript pipeline operates on.

mod extract;
pub(crate) mod model;
mod resolve;

use super::model::ScannerDiagnostic;
use super::scanner::ScannedWorkspace;
use model::ParsedTypeScriptAst;
pub(crate) use resolve::{resolve_ast, ResolvedTypeScriptGraph};

pub(crate) fn extract_ast(scanned_workspace: &ScannedWorkspace) -> ParsedTypeScriptAst {
    let mut diagnostics = Vec::<ScannerDiagnostic>::new();
    let files = extract::extract_files(scanned_workspace, &mut diagnostics);

    ParsedTypeScriptAst { files, diagnostics }
}
