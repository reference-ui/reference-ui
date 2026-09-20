//! Compiler diagnostics subsystem: proof, not suspicion.
//!
//! Phases report typed facts through [`DiagnosticSink`] into a
//! [`DiagnosticsSession`]; policy decides wording and audience, and proof
//! joins independent expectations against final plans. [`Diagnostic`] keeps
//! its stable wire shape (`codes.rs` table plus `{file}:{line}:{col}`
//! rendering in `render.rs`) so hosts and goldens never drift with refactors.

pub mod adapters;
pub mod analysis;
mod channels;
mod codes;
mod facts;
mod policy;
pub mod proof;
mod render;
mod session;
mod site;

pub use channels::DiagnosticChannels;
pub use codes::DiagnosticCode;
pub use facts::{
    DeclarationDetail, DiagnosticFact, DiagnosticSink, DynamicShape, ExtractDetail, ExtractOutcome,
    FoldDetail, LeafDetail, NameDetail, OwnedLookupKey, ResolveDetail, ResolveOutcome, TokenDetail,
    ValueDetail,
};
pub use policy::{Audience, Policy};
pub use render::render;
pub use session::DiagnosticsSession;
pub use site::{
    line_col, DiagnosticLocation, SourceCatalog, SourceId, SourceSite, StyleSurfaceKind,
};

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub code: DiagnosticCode,
    pub message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
}

impl Diagnostic {
    pub fn error(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Error,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn warning(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Warning,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn info(code: DiagnosticCode, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Info,
            code,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn with_location(
        mut self,
        file: impl Into<String>,
        line: Option<u32>,
        column: Option<u32>,
    ) -> Self {
        self.file = Some(file.into());
        self.line = line;
        self.column = column;
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn diagnostic_json_shape_is_stable() {
        let located =
            Diagnostic::warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x`")
                .with_location("a.ts", Some(5), Some(15));
        assert_eq!(
            serde_json::to_string(&located).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"ATM-W-UNKNOWN-TOKEN-PATH\",\
             \"message\":\"unknown token path `x`\",\"file\":\"a.ts\",\"line\":5,\"column\":15}"
        );
        let bare = Diagnostic::warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x`");
        assert_eq!(
            serde_json::to_string(&bare).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"ATM-W-UNKNOWN-TOKEN-PATH\",\
             \"message\":\"unknown token path `x`\"}"
        );
        let back: Diagnostic =
            serde_json::from_str(&serde_json::to_string(&located).unwrap()).unwrap();
        assert_eq!(back, located);
    }
}
