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
    byte_span, line_col, DiagnosticLocation, LineIndex, SourceCatalog, SourceId, SourceSite,
    StyleSurfaceKind,
};

use diagnostics::{ByteSpan, Label};
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
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub span: Option<ByteSpan>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub labels: Option<Vec<Label>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub help: Option<Vec<String>>,
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
            span: None,
            labels: None,
            help: None,
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
            span: None,
            labels: None,
            help: None,
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
            span: None,
            labels: None,
            help: None,
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

    /// Attach a byte-offset span into `file`: the rendering channel, recorded with no line math.
    pub fn with_span(mut self, file: impl Into<String>, span: ByteSpan) -> Self {
        self.file = Some(file.into());
        self.span = Some(span);
        self
    }

    /// Attach labeled underlines for the rendered frame; an empty list stays off the wire.
    pub fn with_labels(mut self, labels: Vec<Label>) -> Self {
        self.labels = if labels.is_empty() { None } else { Some(labels) };
        self
    }

    /// Attach `= help:` lines for the rendered frame; blank lines refuse like the template.
    pub fn with_help(mut self, help: Vec<String>) -> Result<Self, String> {
        if help.iter().any(|line| line.trim().is_empty()) {
            return Err("diagnostic help lines must not be blank".to_string());
        }
        self.help = if help.is_empty() { None } else { Some(help) };
        Ok(self)
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

    #[test]
    fn wire_bytes_match_the_shared_template() {
        let local =
            Diagnostic::warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x`")
                .with_location("a.ts", Some(5), Some(15));
        let template =
            diagnostics::Diagnostic::warning("ATM-W-UNKNOWN-TOKEN-PATH", "unknown token path `x`")
                .unwrap()
                .with_location("a.ts", Some(5), Some(15));
        assert_eq!(
            serde_json::to_string(&local).unwrap(),
            serde_json::to_string(&template).unwrap()
        );
    }

    #[test]
    fn rendering_channel_matches_the_shared_template_byte_for_byte() {
        let span = diagnostics::ByteSpan::new(40, 52).unwrap();
        let label = diagnostics::Label::new(span, "no such token path").unwrap();
        let local = Diagnostic::warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x`")
            .with_location("a.ts", Some(5), Some(15))
            .with_span("a.ts", span)
            .with_labels(vec![label])
            .with_help(vec!["point the path at an existing token".to_string()])
            .unwrap();
        let template = diagnostics::Diagnostic::warning(
            "ATM-W-UNKNOWN-TOKEN-PATH",
            "unknown token path `x`",
        )
        .unwrap()
        .with_location("a.ts", Some(5), Some(15))
        .with_span("a.ts", span)
        .with_labels(vec![
            diagnostics::Label::new(span, "no such token path").unwrap()
        ])
        .with_help(vec!["point the path at an existing token".to_string()])
        .unwrap();
        let local_bytes = serde_json::to_string(&local).unwrap();
        assert_eq!(local_bytes, serde_json::to_string(&template).unwrap());
        assert!(local_bytes.contains("\"span\":{\"start\":40,\"end\":52}"));
        assert!(local.with_help(vec!["  ".to_string()]).is_err());
    }
}
