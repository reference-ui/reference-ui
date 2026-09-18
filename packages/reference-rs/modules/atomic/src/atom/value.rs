//! Authored values (`AtomValue`) and emittable CSS values (`CssValue`).
//! `Want` may hold a boolean or null because those are real extract forms (`<Div border />`).
//! `Atom` may not: every `CssValue` inhabitant is printable CSS. Resolve is the boundary.
//! `css_value_str` lives only on `CssValue` so Bool/Null cannot be printed into a declaration.

use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AtomValue {
    String(Box<str>),
    Token { path: Box<str>, value: Box<str> },
    Number(Box<str>),
    Bool(bool),
    Null,
}

/// One CSS declaration value. No Bool or Null: those are not CSS.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CssValue {
    String(Box<str>),
    Token {
        path: Box<str>,
        value: Box<str>,
    },
    Number(Box<str>),
    Dimension {
        class_stem: Box<str>,
        css_val: Box<str>,
    },
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

    /// Convert an authored value into an emittable one. Bool and Null refuse.
    pub fn into_css_value(self) -> Option<CssValue> {
        match self {
            Self::String(s) => Some(CssValue::String(s)),
            Self::Token { path, value } => Some(CssValue::Token { path, value }),
            Self::Number(n) => Some(CssValue::Number(n)),
            Self::Bool(_) | Self::Null => None,
        }
    }
}

impl CssValue {
    pub fn class_name_str(&self) -> &str {
        match self {
            Self::String(s) => s.as_ref(),
            Self::Token { path, .. } => path.as_ref(),
            Self::Number(n) => n.as_ref(),
            Self::Dimension { class_stem, .. } => class_stem.as_ref(),
        }
    }

    pub fn css_value_str(&self) -> &str {
        match self {
            Self::String(s) => s.as_ref(),
            Self::Token { value, .. } => value.as_ref(),
            Self::Number(n) => n.as_ref(),
            Self::Dimension { css_val, .. } => css_val.as_ref(),
        }
    }
}

const fn bool_str(b: bool) -> &'static str {
    if b {
        "true"
    } else {
        "false"
    }
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

impl fmt::Display for CssValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.css_value_str())
    }
}
