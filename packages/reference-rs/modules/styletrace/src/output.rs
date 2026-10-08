//! Detailed styletrace result: the serializable binding inventory plus its diagnostics.
//! Takes the traced module-qualified bindings and the template diagnostics the trace raised.
//! Emits one JSON payload the native boundary serializes and the JS wrapper parses.
//! Diagnostics ride the shared template shape; the names seam stays silent by shape.

use serde::Serialize;

use crate::analysis::TracedBinding;
use crate::diagnostics::StyletraceDiagnostic;

/// Bindings plus per-file diagnostics from one root-based trace.
/// Diagnostics here are warnings only; request-level failures throw coded.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyletraceDetailedResult {
    /// Module-qualified bindings whose style props reach the surface.
    pub bindings: Vec<TracedBinding>,
    /// One `STT-W-SKIPPED-FILE` per skipped file, in trace order.
    pub diagnostics: Vec<StyletraceDiagnostic>,
}
