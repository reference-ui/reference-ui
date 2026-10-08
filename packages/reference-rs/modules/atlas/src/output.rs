//! Atlas analysis result: the serializable component inventory plus its diagnostics.
//! Takes the finalized component list and the template diagnostics the analysis raised.
//! Emits one JSON payload the native boundary serializes and the JS wrapper parses.
//! Diagnostics ride the shared template shape via an explicit ts-rs import, never a sibling.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::diagnostics::AtlasDiagnostic;
use crate::model::Component;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "modules/atlas/js/generated/",
    rename_all = "camelCase"
)]
pub struct AtlasAnalysisResult {
    pub components: Vec<Component>,
    #[ts(type = "Array<import(\"../../../diagnostics/js/generated/Diagnostic\").Diagnostic>")]
    pub diagnostics: Vec<AtlasDiagnostic>,
}
