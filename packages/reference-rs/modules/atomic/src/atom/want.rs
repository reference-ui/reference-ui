//! Authored declaration representing a raw styling intention extracted from source ASTs.
//! Captures property names, expression values (including Bool/Null), conditional scopes, importance flags, and origin metadata before resolution.
//! Acts as the raw input passed into the resolution engine; Bool/Null never become `Atom` values.

use serde::{Deserialize, Serialize};
use smallvec::SmallVec;

use super::AtomValue;
use crate::diagnostics::DiagnosticLocation;

/// Raw declaration authored in StyleProps or css() calls.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Want {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub when: SmallVec<[Box<str>; 2]>,
    pub important: bool,
    pub origin: Option<Box<str>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub file: Option<Box<str>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub line: Option<u32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
}

impl Want {
    pub fn new(prop: impl Into<Box<str>>, value: AtomValue) -> Self {
        Self {
            prop: prop.into(),
            value,
            when: SmallVec::new(),
            important: false,
            origin: None,
            file: None,
            line: None,
            column: None,
        }
    }

    /// Resolve-side location for located diagnostics. Empty for synthesized wants.
    pub fn location(&self) -> DiagnosticLocation {
        DiagnosticLocation {
            file: self.file.as_deref().map(str::to_string),
            line: self.line,
            column: self.column,
        }
    }

    pub fn with_when(mut self, when: SmallVec<[Box<str>; 2]>) -> Self {
        self.when = when;
        self
    }

    pub fn with_important(mut self, important: bool) -> Self {
        self.important = important;
        self
    }

    pub fn with_origin(mut self, origin: Option<impl Into<Box<str>>>) -> Self {
        self.origin = origin.map(Into::into);
        self
    }
}
