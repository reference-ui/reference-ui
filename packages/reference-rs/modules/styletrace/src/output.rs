//! Detailed styletrace result: the serializable binding inventory, its diagnostics, and owned props.
//! Takes the traced module-qualified bindings, the template diagnostics the trace raised, and the
//! declared prop names each traced host keeps for itself.
//! Emits one JSON payload the native boundary serializes and the JS wrapper parses.
//! Diagnostics ride the shared template shape; the names seam stays silent by shape.

use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;

use crate::analysis::TracedBinding;
use crate::diagnostics::StyletraceDiagnostic;

/// Bindings, per-file diagnostics, and owned props from one root-based trace.
/// Diagnostics here are warnings only; request-level failures throw coded.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StyletraceDetailedResult {
    /// Module-qualified bindings whose style props reach the surface.
    pub bindings: Vec<TracedBinding>,
    /// One `STT-W-SKIPPED-FILE` per skipped file, in trace order.
    pub diagnostics: Vec<StyletraceDiagnostic>,
    /// Each traced export name to the declared prop names it keeps for itself
    /// (§14): never forwarded, so a call site must not read them as styles.
    /// Sorted and unique by type; `{}` on the wire when no host owns anything.
    pub owned: BTreeMap<String, BTreeSet<String>>,
}
