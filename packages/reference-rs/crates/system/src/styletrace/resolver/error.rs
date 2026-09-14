//! Shared error type for styletrace resolver and analysis code.

use std::fmt::{Display, Formatter};

#[derive(Debug, Clone)]
pub struct StyleTraceError {
    message: String,
}

impl StyleTraceError {
    pub(crate) fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

impl Display for StyleTraceError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

impl std::error::Error for StyleTraceError {}