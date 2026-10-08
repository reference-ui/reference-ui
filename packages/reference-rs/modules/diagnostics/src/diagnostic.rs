//! The one diagnostic representation every native module emits and every consumer parses.
//! Severity plus validated code plus message form the hard contract; file, byte-offset span, labels, and help lines
//! are the minimal envelope locating the failure for authors and tooling. Line and column stay as the resolved
//! compat channel while the span is the rendering channel: producers record cheap byte offsets, never line math.
//! Construction and deserialization both validate, so a `Diagnostic` value is always shippable and an invalid wire
//! payload always fails closed at the boundary.

use std::fmt;

use serde::{Deserialize, Deserializer, Serialize};
use ts_rs::TS;

use crate::code::{CodeError, DiagnosticCode};
use crate::span::{ByteSpan, Label};

/// Warning continues with a fallback; error refuses the request or artifact. No info level crosses the template.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "lowercase")]
#[ts(
    export,
    export_to = "modules/diagnostics/js/generated/",
    rename_all = "lowercase"
)]
pub enum Severity {
    /// Compile continues; output exists but something was skipped, guessed, or degraded.
    Warning,
    /// The request or artifact is refused, in whole or in the affected part.
    Error,
}

impl Severity {
    /// The registry tag this severity mints under: `W` or `E`.
    pub fn tag(self) -> char {
        match self {
            Self::Warning => 'W',
            Self::Error => 'E',
        }
    }
}

/// One structured diagnostic: severity, validated code, rich-text message, plus optional location.
/// Serializes camelCase to match the atomic wire shape; absent spans, labels, and help stay off the wire.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "modules/diagnostics/js/generated/",
    rename_all = "camelCase"
)]
pub struct Diagnostic {
    /// Warning or error; the code tag must agree.
    pub severity: Severity,
    /// Validated `NS-SEV-NAME` identity, always present and documented in `REGISTRY.md`.
    #[ts(type = "string")]
    pub code: DiagnosticCode,
    /// Rich-text canvas: non-empty, producer-styled, first line a complete subject.
    pub message: String,
    /// Source path when the failure has one; absent for request-level diagnostics.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub file: Option<String>,
    /// One-based line within `file`, when known.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub line: Option<u32>,
    /// One-based column within `line`, when known.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub column: Option<u32>,
    /// Byte-offset span into `file`: the rendering channel, recorded cheaply with no line math.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub span: Option<ByteSpan>,
    /// Labeled underlines for the rendered frame; absent when the message alone suffices.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub labels: Option<Vec<Label>>,
    /// `= help:` lines for the rendered frame; absent when no guidance applies.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[ts(optional)]
    pub help: Option<Vec<String>>,
}

impl Diagnostic {
    /// Build a warning; the code must parse, carry `-W-`, and the message must be non-blank.
    pub fn warning(code: &str, message: impl Into<String>) -> Result<Self, DiagnosticError> {
        Self::build(Severity::Warning, code, message.into())
    }

    /// Build an error; the code must parse, carry `-E-`, and the message must be non-blank.
    pub fn error(code: &str, message: impl Into<String>) -> Result<Self, DiagnosticError> {
        Self::build(Severity::Error, code, message.into())
    }

    /// Build from an already-parsed code; still checks the tag match and the message body.
    pub fn new(
        severity: Severity,
        code: DiagnosticCode,
        message: impl Into<String>,
    ) -> Result<Self, DiagnosticError> {
        Self::assemble(severity, code, message.into())
    }

    /// Attach a source location; line and column stay optional for file-level failures.
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

    /// Attach a byte-offset span into `file`: the rendering channel, no line math involved.
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

    /// Attach one labeled underline for the rendered frame.
    pub fn push_label(mut self, label: Label) -> Self {
        self.labels.get_or_insert_with(Vec::new).push(label);
        self
    }

    /// Attach `= help:` lines; every line must be non-blank like the message itself.
    pub fn with_help(mut self, help: Vec<String>) -> Result<Self, DiagnosticError> {
        if help.iter().any(|line| line.trim().is_empty()) {
            return Err(DiagnosticError::new("diagnostic help lines must not be blank"));
        }
        self.help = if help.is_empty() { None } else { Some(help) };
        Ok(self)
    }

    fn build(severity: Severity, code: &str, message: String) -> Result<Self, DiagnosticError> {
        let code = DiagnosticCode::parse(code)?;
        Self::assemble(severity, code, message)
    }

    fn assemble(
        severity: Severity,
        code: DiagnosticCode,
        message: String,
    ) -> Result<Self, DiagnosticError> {
        if message.trim().is_empty() {
            return Err(DiagnosticError::new("diagnostic message must not be blank"));
        }
        if code.severity_tag() != severity.tag() {
            return Err(DiagnosticError::new(format!(
                "code `{}` carries `-{}-` but severity is `{}`",
                code.as_str(),
                code.severity_tag(),
                severity.tag()
            )));
        }
        Ok(Self {
            severity,
            code,
            message,
            file: None,
            line: None,
            column: None,
            span: None,
            labels: None,
            help: None,
        })
    }
}

/// Serde shadow: derive the fields, then validate through the same checks as construction.
/// Spans and labels validate in their own deserializers; help lines check here.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawDiagnostic {
    severity: Severity,
    code: DiagnosticCode,
    message: String,
    #[serde(default)]
    file: Option<String>,
    #[serde(default)]
    line: Option<u32>,
    #[serde(default)]
    column: Option<u32>,
    #[serde(default)]
    span: Option<ByteSpan>,
    #[serde(default)]
    labels: Option<Vec<Label>>,
    #[serde(default)]
    help: Option<Vec<String>>,
}

impl<'de> Deserialize<'de> for Diagnostic {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let raw = RawDiagnostic::deserialize(deserializer)?;
        let mut diagnostic = Self::assemble(raw.severity, raw.code, raw.message)
            .map_err(serde::de::Error::custom)?;
        if raw
            .help
            .as_deref()
            .unwrap_or_default()
            .iter()
            .any(|line| line.trim().is_empty())
        {
            return Err(serde::de::Error::custom(
                "invalid diagnostic: diagnostic help lines must not be blank",
            ));
        }
        diagnostic.file = raw.file;
        diagnostic.line = raw.line;
        diagnostic.column = raw.column;
        diagnostic.span = raw.span;
        diagnostic.labels = raw.labels.filter(|labels| !labels.is_empty());
        diagnostic.help = raw.help.filter(|help| !help.is_empty());
        Ok(diagnostic)
    }
}

/// A diagnostic that failed construction or boundary validation, carrying the reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DiagnosticError(String);

impl DiagnosticError {
    fn new(reason: impl Into<String>) -> Self {
        Self(reason.into())
    }
}

impl From<CodeError> for DiagnosticError {
    fn from(error: CodeError) -> Self {
        Self::new(error.to_string())
    }
}

impl fmt::Display for DiagnosticError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid diagnostic: {}", self.0)
    }
}

impl std::error::Error for DiagnosticError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constructors_validate_code_tag_and_message() {
        let warning = Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "subject line").unwrap();
        assert_eq!(warning.severity, Severity::Warning);
        assert!(Diagnostic::warning("RS-E-EXAMPLE-TOKEN", "x").is_err());
        assert!(Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "   ").is_err());
        assert!(Diagnostic::warning("not-a-code", "x").is_err());
        let error = Diagnostic::error("RS-E-EXAMPLE-BOOM", "refused").unwrap();
        assert_eq!(error.severity, Severity::Error);
        assert!(Diagnostic::error("RS-W-EXAMPLE-TOKEN", "x").is_err());
    }

    #[test]
    fn wire_shape_matches_atomic_camel_case() {
        let located = Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "unknown token")
            .unwrap()
            .with_location("app/Button.tsx", Some(12), Some(7));
        assert_eq!(
            serde_json::to_string(&located).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\
             \"message\":\"unknown token\",\"file\":\"app/Button.tsx\",\"line\":12,\"column\":7}"
        );
        let bare = Diagnostic::error("RS-E-EXAMPLE-BOOM", "refused").unwrap();
        assert_eq!(
            serde_json::to_string(&bare).unwrap(),
            "{\"severity\":\"error\",\"code\":\"RS-E-EXAMPLE-BOOM\",\"message\":\"refused\"}"
        );
    }

    #[test]
    fn span_label_and_help_ride_the_wire_after_location() {
        let located = Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "unknown token")
            .unwrap()
            .with_location("app/Button.tsx", Some(12), Some(7))
            .with_span("app/Button.tsx", ByteSpan::new(240, 252).unwrap())
            .push_label(
                Label::new(ByteSpan::new(240, 252).unwrap(), "no such token path").unwrap(),
            )
            .with_help(vec!["point the path at an existing token".to_string()])
            .unwrap();
        assert_eq!(
            serde_json::to_string(&located).unwrap(),
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\
             \"message\":\"unknown token\",\"file\":\"app/Button.tsx\",\"line\":12,\"column\":7,\
             \"span\":{\"start\":240,\"end\":252},\
             \"labels\":[{\"span\":{\"start\":240,\"end\":252},\"message\":\"no such token path\"}],\
             \"help\":[\"point the path at an existing token\"]}"
        );
        let bare = Diagnostic::error("RS-E-EXAMPLE-BOOM", "refused").unwrap();
        assert_eq!(
            serde_json::to_string(&bare).unwrap(),
            "{\"severity\":\"error\",\"code\":\"RS-E-EXAMPLE-BOOM\",\"message\":\"refused\"}"
        );
    }

    #[test]
    fn pre_span_payloads_decode_with_empty_rendering_channels() {
        let legacy: Diagnostic = serde_json::from_str(
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"m\",\
             \"file\":\"a.tsx\",\"line\":1,\"column\":2}",
        )
        .unwrap();
        assert_eq!(legacy.span, None);
        assert_eq!(legacy.labels, None);
        assert_eq!(legacy.help, None);
        assert!(legacy.with_help(vec!["  ".to_string()]).is_err());
    }

    #[test]
    fn deserialization_fails_closed_like_construction() {
        let round: Diagnostic = serde_json::from_str(
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"m\"}",
        )
        .unwrap();
        assert_eq!(round.code.as_str(), "RS-W-EXAMPLE-TOKEN");
        for bad in [
            "{\"severity\":\"warning\",\"code\":\"RS-E-EXAMPLE-TOKEN\",\"message\":\"m\"}",
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"  \"}",
            "{\"severity\":\"warning\",\"code\":\"bogus\",\"message\":\"m\"}",
            "{\"severity\":\"warning\",\"message\":\"m\"}",
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\"}",
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"m\",\
             \"span\":{\"start\":9,\"end\":4}}",
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"m\",\
             \"labels\":[{\"span\":{\"start\":1,\"end\":2},\"message\":\"  \"}]}",
            "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\"message\":\"m\",\
             \"help\":[\"\"]}",
        ] {
            assert!(
                serde_json::from_str::<Diagnostic>(bad).is_err(),
                "accepted {bad}"
            );
        }
    }
}
