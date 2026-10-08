//! Stable machine-readable codes for every atlas diagnostic.
//!
//! Each failure class owns one code (`ATL-W-…` warnings, `ATL-E-…` errors), so hosts
//! can filter a known warning, group diagnostics in a report, and document them without
//! parsing free-text messages. Codes are part of the serialized contract and must never
//! be renamed once a golden or repro pins them. New failure classes extend this enum;
//! they never reuse a code for a different class.

use std::fmt;
use std::str::FromStr;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Stable code identifying an atlas diagnostic's failure class.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum AtlasDiagnosticCode {
    /// `resolver`: the component's named props type resolves nowhere; a partial component is kept.
    UnresolvedPropsType,
    /// `resolver`: the component uses an inline props object annotation; the component is omitted.
    UnsupportedPropsAnnotation,
    /// `analyzer`: an included package resolves nowhere; the package is skipped.
    UnresolvedIncludePackage,
    /// `analyzer`: file discovery or read failed; the analysis is refused with empty components.
    ScanFailed,
    /// `analyzer`: a package's discovery or read failed; the package is skipped, siblings kept.
    PackageScanFailed,
}

/// The code table: one row per variant, in enum declaration order.
/// Both directions of the mapping read this table, so a code string can
/// never drift between serialization and parsing. New codes append rows.
const CODE_TABLE: [(AtlasDiagnosticCode, &str); 5] = [
    (
        AtlasDiagnosticCode::UnresolvedPropsType,
        "ATL-W-UNRESOLVED-PROPS-TYPE",
    ),
    (
        AtlasDiagnosticCode::UnsupportedPropsAnnotation,
        "ATL-W-UNSUPPORTED-PROPS-ANNOTATION",
    ),
    (
        AtlasDiagnosticCode::UnresolvedIncludePackage,
        "ATL-W-UNRESOLVED-INCLUDE-PACKAGE",
    ),
    (AtlasDiagnosticCode::ScanFailed, "ATL-E-SCAN-FAILED"),
    (
        AtlasDiagnosticCode::PackageScanFailed,
        "ATL-W-PACKAGE-SCAN-FAILED",
    ),
];

impl AtlasDiagnosticCode {
    /// The stable wire string pinned in goldens, the registry, and host filters.
    pub fn as_str(&self) -> &'static str {
        for (code, text) in CODE_TABLE {
            if code == *self {
                return text;
            }
        }
        unreachable!("code table lists every AtlasDiagnosticCode variant");
    }
}

impl fmt::Display for AtlasDiagnosticCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for AtlasDiagnosticCode {
    type Err = String;

    fn from_str(code: &str) -> Result<Self, Self::Err> {
        for (variant, text) in CODE_TABLE {
            if text == code {
                return Ok(variant);
            }
        }
        Err(format!("unknown atlas diagnostic code `{code}`"))
    }
}

impl Serialize for AtlasDiagnosticCode {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

struct CodeVisitor;

impl Visitor<'_> for CodeVisitor {
    type Value = AtlasDiagnosticCode;

    fn expecting(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("a stable `ATL-W-…` / `ATL-E-…` diagnostic code")
    }

    fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
        value.parse().map_err(E::custom)
    }
}

impl<'de> Deserialize<'de> for AtlasDiagnosticCode {
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
            let back: AtlasDiagnosticCode = serde_json::from_str(&json).unwrap();
            assert_eq!(back, code);
        }
    }

    #[test]
    fn every_variant_appears_exactly_once() {
        use std::collections::HashSet;
        let variants: HashSet<AtlasDiagnosticCode> =
            CODE_TABLE.iter().map(|(code, _)| *code).collect();
        assert_eq!(variants.len(), CODE_TABLE.len());
        for code in [
            AtlasDiagnosticCode::UnresolvedPropsType,
            AtlasDiagnosticCode::UnsupportedPropsAnnotation,
            AtlasDiagnosticCode::UnresolvedIncludePackage,
            AtlasDiagnosticCode::ScanFailed,
            AtlasDiagnosticCode::PackageScanFailed,
        ] {
            assert!(variants.contains(&code), "missing table row: {code:?}");
        }
    }

    #[test]
    fn unknown_code_strings_refuse() {
        assert!("ATL-W-NOPE".parse::<AtlasDiagnosticCode>().is_err());
        assert!(serde_json::from_str::<AtlasDiagnosticCode>("\"TST-W-PARSE-ERROR\"").is_err());
    }

    #[test]
    fn every_code_parses_in_the_shared_template() {
        for (_, text) in CODE_TABLE {
            let parsed = diagnostics::DiagnosticCode::parse(text).unwrap();
            assert!(parsed.is_registered_namespace());
            assert_eq!(parsed.namespace(), "ATL");
        }
    }

    #[test]
    fn template_tags_match_table_severity() {
        for (_, text) in CODE_TABLE {
            let code = diagnostics::DiagnosticCode::parse(text).unwrap();
            if text.contains("-W-") {
                assert!(code.is_warning_code(), "tag drift: {text}");
            } else {
                assert!(code.is_error_code(), "tag drift: {text}");
            }
        }
    }
}
