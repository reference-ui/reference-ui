//! Wire behavior for `DiagnosticCode`: string form, `Display`, `FromStr`, and serde.
//! Every direction reads `CODE_TABLE` from the parent module, so a code string cannot drift between
//! serialization and parsing. A forwarded StyleTrace code takes its string from styletrace's own table,
//! so the two sides cannot drift either.
//! Unknown strings refuse with a message instead of guessing a variant.

use std::fmt;
use std::str::FromStr;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use styletrace::StyletraceDiagnosticCode;

use super::{DiagnosticCode, CODE_TABLE};

impl DiagnosticCode {
    /// The stable wire string pinned in goldens and host filters.
    pub fn as_str(&self) -> &'static str {
        if let Self::Styletrace(code) = self {
            return code.as_str();
        }
        for (code, text) in CODE_TABLE {
            if code == *self {
                return text;
            }
        }
        unreachable!("code table lists every DiagnosticCode variant");
    }
}

impl fmt::Display for DiagnosticCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for DiagnosticCode {
    type Err = String;

    fn from_str(code: &str) -> Result<Self, Self::Err> {
        for (variant, text) in CODE_TABLE {
            if text == code {
                return Ok(variant);
            }
        }
        match code.parse::<StyletraceDiagnosticCode>() {
            Ok(forwarded) => Ok(Self::Styletrace(forwarded)),
            Err(_) => Err(format!("unknown diagnostic code `{code}`")),
        }
    }
}

impl Serialize for DiagnosticCode {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

struct CodeVisitor;

impl Visitor<'_> for CodeVisitor {
    type Value = DiagnosticCode;

    fn expecting(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(
            "a stable `ATM-W-…` / `ATM-E-…` or forwarded `STT-W-…` / `STT-E-…` diagnostic code",
        )
    }

    fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
        value.parse().map_err(E::custom)
    }
}

impl<'de> Deserialize<'de> for DiagnosticCode {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        deserializer.deserialize_str(CodeVisitor)
    }
}
