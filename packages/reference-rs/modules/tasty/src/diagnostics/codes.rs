//! Stable machine-readable codes for every tasty diagnostic.
//!
//! Each failure class owns one code (`TST-W-…` warnings, `TST-E-…` errors), so hosts
//! can filter a known warning, group diagnostics in a report, and document them without
//! parsing free-text messages. Codes are part of the serialized contract and must never
//! be renamed once a golden or repro pins them. New failure classes extend this enum;
//! they never reuse a code for a different class.

use std::fmt;
use std::str::FromStr;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Stable code identifying a tasty diagnostic's failure class.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TastyDiagnosticCode {
    /// `ast/extract/pipeline`: the source failed to parse; compile continues with recoverable shells.
    ParseError,
    /// `ast/resolve/merge` (M3): same-file same-name alias/mixed group keeps the last shell.
    DuplicateDeclaration,
    /// `ast/resolve/merge` (M2): merged interfaces keep the first nominal member on collision.
    DuplicateMember,
    /// `ast/resolve/index`: `export *` name from two targets is excluded from the barrel.
    StarAmbiguity,
    /// `generator/bundle/modules/manifest`: one name indexes several symbols across files.
    DuplicateSymbolName,
    /// `scanner/workspace`: the scan root, glob, path, or file read failed; the request is refused.
    ScanFailed,
}

/// The code table: one row per variant, in enum declaration order.
/// Both directions of the mapping read this table, so a code string can
/// never drift between serialization and parsing. New codes append rows.
const CODE_TABLE: [(TastyDiagnosticCode, &str); 6] = [
    (TastyDiagnosticCode::ParseError, "TST-W-PARSE-ERROR"),
    (
        TastyDiagnosticCode::DuplicateDeclaration,
        "TST-W-DUPLICATE-DECLARATION",
    ),
    (
        TastyDiagnosticCode::DuplicateMember,
        "TST-W-DUPLICATE-MEMBER",
    ),
    (TastyDiagnosticCode::StarAmbiguity, "TST-W-STAR-AMBIGUITY"),
    (
        TastyDiagnosticCode::DuplicateSymbolName,
        "TST-W-DUPLICATE-SYMBOL-NAME",
    ),
    (TastyDiagnosticCode::ScanFailed, "TST-E-SCAN-FAILED"),
];

impl TastyDiagnosticCode {
    /// The stable wire string pinned in goldens, the registry, and host filters.
    pub fn as_str(&self) -> &'static str {
        for (code, text) in CODE_TABLE {
            if code == *self {
                return text;
            }
        }
        unreachable!("code table lists every TastyDiagnosticCode variant");
    }
}

impl fmt::Display for TastyDiagnosticCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for TastyDiagnosticCode {
    type Err = String;

    fn from_str(code: &str) -> Result<Self, Self::Err> {
        for (variant, text) in CODE_TABLE {
            if text == code {
                return Ok(variant);
            }
        }
        Err(format!("unknown tasty diagnostic code `{code}`"))
    }
}

impl Serialize for TastyDiagnosticCode {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

struct CodeVisitor;

impl Visitor<'_> for CodeVisitor {
    type Value = TastyDiagnosticCode;

    fn expecting(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("a stable `TST-W-…` / `TST-E-…` diagnostic code")
    }

    fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
        value.parse().map_err(E::custom)
    }
}

impl<'de> Deserialize<'de> for TastyDiagnosticCode {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        deserializer.deserialize_str(CodeVisitor)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn table_rows_round_trip_through_serde_and_parse() {
        for (code, text) in CODE_TABLE {
            assert_eq!(code.as_str(), text);
            assert_eq!(text.parse(), Ok(code));
            let json = serde_json::to_string(&code).unwrap();
            assert_eq!(json, format!("\"{text}\""));
            let back: TastyDiagnosticCode = serde_json::from_str(&json).unwrap();
            assert_eq!(back, code);
        }
    }

    #[test]
    fn every_variant_appears_exactly_once() {
        use std::collections::HashSet;
        let variants: HashSet<TastyDiagnosticCode> =
            CODE_TABLE.iter().map(|(code, _)| *code).collect();
        assert_eq!(variants.len(), CODE_TABLE.len());
        for code in [
            TastyDiagnosticCode::ParseError,
            TastyDiagnosticCode::DuplicateDeclaration,
            TastyDiagnosticCode::DuplicateMember,
            TastyDiagnosticCode::StarAmbiguity,
            TastyDiagnosticCode::DuplicateSymbolName,
            TastyDiagnosticCode::ScanFailed,
        ] {
            assert!(variants.contains(&code), "missing table row: {code:?}");
        }
    }

    #[test]
    fn unknown_code_strings_refuse() {
        assert!("TST-W-NOPE".parse::<TastyDiagnosticCode>().is_err());
        assert!(serde_json::from_str::<TastyDiagnosticCode>("\"ATM-W-UNKNOWN-PROPERTY\"").is_err());
    }

    #[test]
    fn every_code_parses_in_the_shared_template() {
        for (_, text) in CODE_TABLE {
            let parsed = diagnostics::DiagnosticCode::parse(text).unwrap();
            assert!(parsed.is_registered_namespace());
            assert_eq!(parsed.namespace(), "TST");
        }
    }
}
