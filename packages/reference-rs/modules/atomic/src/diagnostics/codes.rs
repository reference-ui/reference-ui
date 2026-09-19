//! Stable machine-readable codes for every compiler diagnostic.
//!
//! Each failure class owns one code (`ATM-W-…` warnings, `ATM-E-…` errors;
//! `ATM-I-…` is reserved for future info diagnostics), so hosts can suppress
//! a known warning, group diagnostics in a report, and document them without
//! parsing free-text messages. Codes are part of the serialized contract and
//! must never be renamed once a station golden pins them. New language slices
//! extend this enum; they never reuse a code for a different failure class.

use std::fmt;
use std::str::FromStr;

use serde::de::{self, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Stable code identifying a diagnostic's failure class.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DiagnosticCode {
    /// `walk.rs` fallback: any other dynamic expression in value position.
    DynamicExpression,
    /// `walk.rs`: unresolvable member expression (`props.c`, `theme.missing`).
    DynamicMember,
    /// `walk.rs`: unresolvable free identifier in value position.
    DynamicIdentifier,
    /// `walk.rs` / `object.rs`: use of a binding after a tracked write.
    MutatedBinding,
    /// `literal.rs`: interpolated template over unfoldable parts.
    DynamicTemplate,
    /// `fold/unary`: an operator or operand the unary fold refused.
    DynamicUnary,
    /// `object.rs` / `responsive.rs`: computed key that does not fold.
    UnfoldableKey,
    /// `object.rs` / `resolve` / `static_css` / `global`: unknown style prop.
    UnknownProperty,
    /// `object.rs`: unknown breakpoint name inside an `r` prop object.
    UnknownBreakpoint,
    /// `object.rs`: condition key whose value is not an object.
    NonObjectCondition,
    /// `object.rs` / `responsive.rs`: unresolvable object spread.
    UnfoldableSpread,
    /// `resolve` / `global`: unknown condition or conditional key.
    UnknownCondition,
    /// `resolve/conditions`: `@container` atoms without a container root.
    MissingContainerRoot,
    /// `resolve/unit`: octal, hex, binary, `Infinity`, or `NaN` numerics.
    NonCanonicalNumeric,
    /// `resolve/unit` / `global`: boolean or null where CSS needs a value.
    InvalidCssValue,
    /// `resolve/tokens`: malformed `/opacity` modifier on a token path.
    MalformedOpacity,
    /// `resolve/tokens`: dotted path that names no token.
    UnknownTokenPath,
    /// Retired in Forge Slice 1 (§11): no unique-name lookup across
    /// categories, so this code is never emitted. Kept for wire stability —
    /// pinned codes are never renamed or removed.
    TokenCategoryMismatch,
    /// `resolve/tokens`: bare value on a color prop that is neither a color
    /// token nor a CSS color (the color grammar is closed, so this is exact).
    UnknownColor,
    /// `resolve/tokens/interpolate`: unterminated `{` inside a value.
    UnterminatedBrace,
    /// `static_css`: wildcard on a prop with no token category.
    StaticWildcard,
    /// `stylesheet/global`: at-rule key with an empty query.
    EmptyAtRule,
    /// `stylesheet/global`: list or nested value under a conditional key.
    UnsupportedGlobalValue,
    /// `hosts`: a StyleTrace file skipped with its siblings kept.
    TraceSkipped,
    /// `extract`: style-bearing JSX with no resolvable host graph.
    MissingHostGraph,
    /// `extract/recipes`: `recipe(...)` first arg is not an inline object.
    RecipeArgShape,
    /// `extract/recipes`: spread inside a `recipe(...)` object literal.
    RecipeSpread,
    /// `extract/recipes` / `recipes/spec`: missing or dynamic className.
    RecipeClassName,
    /// `lib.rs`: the source failed to parse; compile continues.
    ParseError,
    /// `lib.rs`: two recipes claim one className within a system.
    DuplicateRecipe,
    /// `resolve/tokens`: explicit `{path}` reference that names no token.
    UnknownTokenReference,
    /// `native.rs`: the baseSystem spec failed contract validation.
    InvalidBaseSystem,
    /// `extract/css`: a `css()` argument, merge-list element, or conditional
    /// arm is not a static style object (SPEC-V2-65 Ph1 no-silence sweep).
    NonObjectCssArg,
    /// `extract/jsx`: a `css` / `r` / condition prop value is not a static
    /// style object (SPEC-V2-65 Ph1 no-silence sweep).
    NonObjectJsxStyle,
    /// `extract/expressions/responsive`: a spread inside a value array
    /// refuses the whole array (SPEC-V2-28 Ph1; Ph3 flattens literals).
    ResponsiveArraySpread,
    /// `extract`: a tagged template on a live `css` binding (SPEC-V2-38).
    TaggedTemplateSite,
    /// `object.rs`: a recorded const-object prop with no static style value
    /// (SPEC-V2-55/65 Ph3; the use site diagnoses it, siblings kept).
    UnfoldableObjectProp,
    /// `object.rs` / `walk.rs` / `member.rs` / `element.rs` / `key.rs`: a
    /// recorded const-object prop that kept static leaves while dropping a
    /// dynamic arm at collect time (Ph4 residue channel; siblings kept).
    PartialObjectProp,
    /// `fold/binary`: an operator or pair the binary fold refused.
    DynamicBinary,
    /// `fold/conditional`: a ternary arm eliminated by a folded test.
    DeadBranch,
    /// `fold/call`: a `token()` shape the call surface refused (SPEC-V2-61).
    TokenCallRefused,
}

/// The code table: one row per variant, in enum declaration order.
/// Both directions of the mapping read this table, so a code string can
/// never drift between serialization and parsing. New codes append rows.
const CODE_TABLE: [(DiagnosticCode, &str); 41] = [
    (
        DiagnosticCode::DynamicExpression,
        "ATM-W-DYNAMIC-EXPRESSION",
    ),
    (DiagnosticCode::DynamicMember, "ATM-W-DYNAMIC-MEMBER"),
    (
        DiagnosticCode::DynamicIdentifier,
        "ATM-W-DYNAMIC-IDENTIFIER",
    ),
    (DiagnosticCode::MutatedBinding, "ATM-W-MUTATED-BINDING"),
    (DiagnosticCode::DynamicTemplate, "ATM-W-DYNAMIC-TEMPLATE"),
    (DiagnosticCode::DynamicUnary, "ATM-W-DYNAMIC-UNARY"),
    (DiagnosticCode::UnfoldableKey, "ATM-W-UNFOLDABLE-KEY"),
    (DiagnosticCode::UnknownProperty, "ATM-W-UNKNOWN-PROPERTY"),
    (
        DiagnosticCode::UnknownBreakpoint,
        "ATM-W-UNKNOWN-BREAKPOINT",
    ),
    (
        DiagnosticCode::NonObjectCondition,
        "ATM-W-NON-OBJECT-CONDITION",
    ),
    (DiagnosticCode::UnfoldableSpread, "ATM-W-UNFOLDABLE-SPREAD"),
    (DiagnosticCode::UnknownCondition, "ATM-W-UNKNOWN-CONDITION"),
    (
        DiagnosticCode::MissingContainerRoot,
        "ATM-W-MISSING-CONTAINER-ROOT",
    ),
    (
        DiagnosticCode::NonCanonicalNumeric,
        "ATM-W-NON-CANONICAL-NUMERIC",
    ),
    (DiagnosticCode::InvalidCssValue, "ATM-W-INVALID-CSS-VALUE"),
    (DiagnosticCode::MalformedOpacity, "ATM-W-MALFORMED-OPACITY"),
    (DiagnosticCode::UnknownTokenPath, "ATM-W-UNKNOWN-TOKEN-PATH"),
    (
        DiagnosticCode::TokenCategoryMismatch,
        "ATM-W-TOKEN-CATEGORY-MISMATCH",
    ),
    (
        DiagnosticCode::UnterminatedBrace,
        "ATM-W-UNTERMINATED-BRACE",
    ),
    (DiagnosticCode::StaticWildcard, "ATM-W-STATIC-WILDCARD"),
    (DiagnosticCode::EmptyAtRule, "ATM-W-EMPTY-AT-RULE"),
    (
        DiagnosticCode::UnsupportedGlobalValue,
        "ATM-W-UNSUPPORTED-GLOBAL-VALUE",
    ),
    (DiagnosticCode::TraceSkipped, "ATM-W-TRACE-SKIPPED"),
    (DiagnosticCode::MissingHostGraph, "ATM-E-MISSING-HOST-GRAPH"),
    (DiagnosticCode::RecipeArgShape, "ATM-E-RECIPE-ARG-SHAPE"),
    (DiagnosticCode::RecipeSpread, "ATM-E-RECIPE-SPREAD"),
    (DiagnosticCode::RecipeClassName, "ATM-E-RECIPE-CLASSNAME"),
    (DiagnosticCode::ParseError, "ATM-E-PARSE"),
    (DiagnosticCode::DuplicateRecipe, "ATM-E-DUPLICATE-RECIPE"),
    (DiagnosticCode::UnknownTokenReference, "ATM-E-UNKNOWN-TOKEN"),
    (
        DiagnosticCode::InvalidBaseSystem,
        "ATM-E-INVALID-BASE-SYSTEM",
    ),
    (DiagnosticCode::NonObjectCssArg, "ATM-W-NON-OBJECT-CSS-ARG"),
    (
        DiagnosticCode::NonObjectJsxStyle,
        "ATM-W-NON-OBJECT-JSX-STYLE",
    ),
    (
        DiagnosticCode::ResponsiveArraySpread,
        "ATM-W-RESPONSIVE-ARRAY-SPREAD",
    ),
    (
        DiagnosticCode::TaggedTemplateSite,
        "ATM-W-TAGGED-TEMPLATE-SITE",
    ),
    (
        DiagnosticCode::UnfoldableObjectProp,
        "ATM-W-UNFOLDABLE-OBJECT-PROP",
    ),
    (
        DiagnosticCode::PartialObjectProp,
        "ATM-W-PARTIAL-OBJECT-PROP",
    ),
    (DiagnosticCode::DynamicBinary, "ATM-W-DYNAMIC-BINARY"),
    (DiagnosticCode::DeadBranch, "ATM-I-DEAD-BRANCH"),
    (DiagnosticCode::TokenCallRefused, "ATM-W-TOKEN-CALL-REFUSED"),
    (DiagnosticCode::UnknownColor, "ATM-W-UNKNOWN-COLOR"),
];

impl DiagnosticCode {
    /// The stable wire string pinned in goldens and host filters.
    pub fn as_str(&self) -> &'static str {
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
        Err(format!("unknown diagnostic code `{code}`"))
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
        f.write_str("a stable `ATM-W-…` / `ATM-E-…` diagnostic code")
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
            let back: DiagnosticCode = serde_json::from_str(&json).unwrap();
            assert_eq!(back, code);
        }
    }

    #[test]
    fn every_variant_appears_exactly_once() {
        use std::collections::HashSet;
        let variants: HashSet<DiagnosticCode> = CODE_TABLE.iter().map(|(code, _)| *code).collect();
        assert_eq!(variants.len(), CODE_TABLE.len());
        for code in [
            DiagnosticCode::DynamicExpression,
            DiagnosticCode::DynamicMember,
            DiagnosticCode::DynamicIdentifier,
            DiagnosticCode::MutatedBinding,
            DiagnosticCode::DynamicTemplate,
            DiagnosticCode::DynamicUnary,
            DiagnosticCode::UnfoldableKey,
            DiagnosticCode::UnknownProperty,
            DiagnosticCode::UnknownBreakpoint,
            DiagnosticCode::NonObjectCondition,
            DiagnosticCode::UnfoldableSpread,
            DiagnosticCode::UnknownCondition,
            DiagnosticCode::MissingContainerRoot,
            DiagnosticCode::NonCanonicalNumeric,
            DiagnosticCode::InvalidCssValue,
            DiagnosticCode::MalformedOpacity,
            DiagnosticCode::UnknownTokenPath,
            DiagnosticCode::TokenCategoryMismatch,
            DiagnosticCode::UnterminatedBrace,
            DiagnosticCode::StaticWildcard,
            DiagnosticCode::EmptyAtRule,
            DiagnosticCode::UnsupportedGlobalValue,
            DiagnosticCode::TraceSkipped,
            DiagnosticCode::MissingHostGraph,
            DiagnosticCode::RecipeArgShape,
            DiagnosticCode::RecipeSpread,
            DiagnosticCode::RecipeClassName,
            DiagnosticCode::ParseError,
            DiagnosticCode::DuplicateRecipe,
            DiagnosticCode::UnknownTokenReference,
            DiagnosticCode::InvalidBaseSystem,
            DiagnosticCode::NonObjectCssArg,
            DiagnosticCode::NonObjectJsxStyle,
            DiagnosticCode::ResponsiveArraySpread,
            DiagnosticCode::TaggedTemplateSite,
            DiagnosticCode::UnfoldableObjectProp,
            DiagnosticCode::DynamicBinary,
            DiagnosticCode::DeadBranch,
            DiagnosticCode::PartialObjectProp,
            DiagnosticCode::TokenCallRefused,
            DiagnosticCode::UnknownColor,
        ] {
            assert!(variants.contains(&code), "missing table row: {code:?}");
        }
    }

    #[test]
    fn unknown_code_strings_refuse() {
        assert!("ATM-W-NOPE".parse::<DiagnosticCode>().is_err());
        assert!(serde_json::from_str::<DiagnosticCode>("\"ATM1001\"").is_err());
    }
}
