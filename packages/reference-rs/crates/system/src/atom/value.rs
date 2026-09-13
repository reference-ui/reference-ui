//! Strongly typed representation of CSS property values within the atomic compiler.
//! Distinguishes literal strings, design tokens, numbers, and boolean states while preserving authored semantics.
//! Formats values for CSS stylesheet emission and runtime class mapping.

use std::fmt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AtomValue {
    String(Box<str>),
    Token { path: Box<str>, value: Box<str> },
    Number(Box<str>),
    Bool(bool),
    Null,
}

impl AtomValue {
    pub fn class_name_str(&self) -> &str {
        match self {
            Self::String(s) => s.as_ref(),
            Self::Token { path, .. } => path.as_ref(),
            Self::Number(n) => n.as_ref(),
            Self::Bool(b) => bool_str(*b),
            Self::Null => "null",
        }
    }

    pub fn css_value_str(&self) -> &str {
        match self {
            Self::String(s) => s.as_ref(),
            Self::Token { value, .. } => value.as_ref(),
            Self::Number(n) => n.as_ref(),
            Self::Bool(b) => bool_str(*b),
            Self::Null => "null",
        }
    }
}

const fn bool_str(b: bool) -> &'static str {
    if b { "true" } else { "false" }
}

impl fmt::Display for AtomValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::String(s) => write!(f, "{s}"),
            Self::Token { value, .. } => write!(f, "{value}"),
            Self::Number(n) => write!(f, "{n}"),
            Self::Bool(b) => write!(f, "{b}"),
            Self::Null => write!(f, "null"),
        }
    }
}

