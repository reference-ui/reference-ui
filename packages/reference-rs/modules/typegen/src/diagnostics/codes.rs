//! Stable machine-readable codes for every typegen diagnostic.
//!
//! Each failure class owns one code (`TGN-W-…` warnings, `TGN-E-…` errors), so hosts
//! can filter a known warning, group diagnostics in a report, and document them without
//! parsing free-text messages. Codes are part of the serialized contract and must never
//! be renamed once a golden or repro pins them. New failure classes extend this enum;
//! they never reuse a code for a different class.

use std::fmt;
use std::str::FromStr;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Stable code identifying a typegen diagnostic's failure class.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TypegenDiagnosticCode {
    /// `emit/tokens`: a dump token category with no printed union; its tokens are omitted.
    UnknownTokenCategory,
    /// `emit/recipes`: a recipe name that cannot PascalCase to a TypeScript identifier; omitted.
    InvalidRecipeName,
    /// `emit/recipes`: a recipe with no printable variant axes, or one empty axis; skipped.
    EmptyRecipe,
    /// `emit/recipes`: a compound row naming an unknown axis or value; the row is skipped.
    InvalidCompoundVariant,
    /// `emit/strict`: a strict name outside `colors` / `radii` / `spacing`; skipped.
    UnknownStrictCategory,
    /// `emit/style`: a known strict category with no tokens in this system; no wrapper.
    AbsentStrictCategory,
    /// `emit/fonts`: a font family declaring no weights; omitted from the registry.
    EmptyFontFamily,
    /// `native`: the baseSystem spec failed contract validation; the request is refused.
    InvalidBaseSystem,
    /// `emit/recipes`: a recipe whose PascalCase stem collides with an earlier recipe; omitted.
    DuplicateRecipeStem,
}

/// The code table: one row per variant, in enum declaration order.
/// Both directions of the mapping read this table, so a code string can
/// never drift between serialization and parsing. New codes append rows.
const CODE_TABLE: [(TypegenDiagnosticCode, &str); 9] = [
    (
        TypegenDiagnosticCode::UnknownTokenCategory,
        "TGN-W-UNKNOWN-TOKEN-CATEGORY",
    ),
    (
        TypegenDiagnosticCode::InvalidRecipeName,
        "TGN-W-INVALID-RECIPE-NAME",
    ),
    (TypegenDiagnosticCode::EmptyRecipe, "TGN-W-EMPTY-RECIPE"),
    (
        TypegenDiagnosticCode::InvalidCompoundVariant,
        "TGN-W-INVALID-COMPOUND-VARIANT",
    ),
    (
        TypegenDiagnosticCode::UnknownStrictCategory,
        "TGN-W-UNKNOWN-STRICT-CATEGORY",
    ),
    (
        TypegenDiagnosticCode::AbsentStrictCategory,
        "TGN-W-ABSENT-STRICT-CATEGORY",
    ),
    (
        TypegenDiagnosticCode::EmptyFontFamily,
        "TGN-W-EMPTY-FONT-FAMILY",
    ),
    (
        TypegenDiagnosticCode::InvalidBaseSystem,
        "TGN-E-INVALID-BASE-SYSTEM",
    ),
    (
        TypegenDiagnosticCode::DuplicateRecipeStem,
        "TGN-W-DUPLICATE-RECIPE-STEM",
    ),
];

impl TypegenDiagnosticCode {
    /// The stable wire string pinned in goldens, the registry, and host filters.
    pub fn as_str(&self) -> &'static str {
        for (code, text) in CODE_TABLE {
            if code == *self {
                return text;
            }
        }
        unreachable!("code table lists every TypegenDiagnosticCode variant");
    }
}

impl fmt::Display for TypegenDiagnosticCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl FromStr for TypegenDiagnosticCode {
    type Err = String;

    fn from_str(code: &str) -> Result<Self, Self::Err> {
        for (variant, text) in CODE_TABLE {
            if text == code {
                return Ok(variant);
            }
        }
        Err(format!("unknown typegen diagnostic code `{code}`"))
    }
}

impl Serialize for TypegenDiagnosticCode {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

struct CodeVisitor;

impl Visitor<'_> for CodeVisitor {
    type Value = TypegenDiagnosticCode;

    fn expecting(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("a stable `TGN-W-…` / `TGN-E-…` diagnostic code")
    }

    fn visit_str<E: de::Error>(self, value: &str) -> Result<Self::Value, E> {
        value.parse().map_err(E::custom)
    }
}

impl<'de> Deserialize<'de> for TypegenDiagnosticCode {
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
            let back: TypegenDiagnosticCode = serde_json::from_str(&json).unwrap();
            assert_eq!(back, code);
        }
    }

    #[test]
    fn every_variant_appears_exactly_once() {
        use std::collections::HashSet;
        let variants: HashSet<TypegenDiagnosticCode> =
            CODE_TABLE.iter().map(|(code, _)| *code).collect();
        assert_eq!(variants.len(), CODE_TABLE.len());
        for code in [
            TypegenDiagnosticCode::UnknownTokenCategory,
            TypegenDiagnosticCode::InvalidRecipeName,
            TypegenDiagnosticCode::EmptyRecipe,
            TypegenDiagnosticCode::InvalidCompoundVariant,
            TypegenDiagnosticCode::UnknownStrictCategory,
            TypegenDiagnosticCode::AbsentStrictCategory,
            TypegenDiagnosticCode::EmptyFontFamily,
            TypegenDiagnosticCode::InvalidBaseSystem,
            TypegenDiagnosticCode::DuplicateRecipeStem,
        ] {
            assert!(variants.contains(&code), "missing table row: {code:?}");
        }
    }

    #[test]
    fn unknown_code_strings_refuse() {
        assert!("TGN-W-NOPE".parse::<TypegenDiagnosticCode>().is_err());
        assert!(serde_json::from_str::<TypegenDiagnosticCode>("\"ATL-E-SCAN-FAILED\"").is_err());
    }

    #[test]
    fn every_code_parses_in_the_shared_template() {
        for (_, text) in CODE_TABLE {
            let parsed = diagnostics::DiagnosticCode::parse(text).unwrap();
            assert!(parsed.is_registered_namespace());
            assert_eq!(parsed.namespace(), "TGN");
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
