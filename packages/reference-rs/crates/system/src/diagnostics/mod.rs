//! Compiler diagnostic definitions and severity reporting for Reference UI.
//! Formats errors, warnings, and informational notices with source locations during extraction and resolution.
//! Enforces fail-closed compilation semantics to surface invalid styling patterns early.

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
    pub message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
}

impl Diagnostic {
    pub fn error(message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Error,
            message: message.into(),
            file: None,
            line: None,
            column: None,
        }
    }

    pub fn warning(message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Warning,
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
