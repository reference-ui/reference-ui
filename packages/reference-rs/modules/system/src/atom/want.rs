//! Authored declaration representing a raw styling intention extracted from source ASTs.
//! Captures property names, expression values, conditional scopes, importance flags, and origin metadata before resolution.
//! Acts as the raw input passed into the resolution engine to produce canonical atoms.

use serde::{Deserialize, Serialize};
use smallvec::SmallVec;

use super::AtomValue;

/// Raw declaration authored in StyleProps or css() calls.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Want {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub when: SmallVec<[Box<str>; 2]>,
    pub important: bool,
    pub origin: Option<Box<str>>,
}

impl Want {
    pub fn new(prop: impl Into<Box<str>>, value: AtomValue) -> Self {
        Self {
            prop: prop.into(),
            value,
            when: SmallVec::new(),
            important: false,
            origin: None,
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
