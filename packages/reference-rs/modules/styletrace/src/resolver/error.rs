//! Error types and reporting for the styletrace resolver subsystem.
//!
//! This module defines the core error structures used during type graph traversal and parsing.
//! It takes raw context about the failure (like missing files or unsupported syntaxes).
//! Emits formatted diagnostic messages suitable for display in terminal output or logs.

use std::error::Error;
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StyleTraceError {
    message: String,
}

impl StyleTraceError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl fmt::Display for StyleTraceError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "StyleTrace: {}", self.message)
    }
}

impl Error for StyleTraceError {}
