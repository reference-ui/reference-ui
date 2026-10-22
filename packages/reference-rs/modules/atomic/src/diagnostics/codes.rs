//! Stable machine-readable codes for every compiler diagnostic.
//!
//! Each failure class owns one code (`ATM-W-…` warnings, `ATM-E-…` errors;
//! `ATM-I-…` is reserved for future info diagnostics), so hosts can suppress
//! a known warning, group diagnostics in a report, and document them without
//! parsing free-text messages. Codes are part of the serialized contract and
//! must never be renamed once a case golden pins them. New language slices
//! extend this enum; they never reuse a code for a different failure class.
//! StyleTrace mints its own `STT-…` codes, which atomic forwards unchanged
//! through [`DiagnosticCode::Styletrace`] instead of re-minting them.

use styletrace::StyletraceDiagnosticCode;

mod wire;

#[cfg(test)]
mod tests;

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
    /// Retired in no unique-name lookup across
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
    /// Retired: every StyleTrace skip reports under its own `STT-…` code (forwarded through
    /// `Styletrace` below), so this code is never emitted. Kept for wire stability — pinned
    /// codes are never renamed or removed.
    TraceSkipped,
    /// `extract`: style-bearing JSX with no resolvable host graph.
    MissingHostGraph,
    /// `hosts`: a StyleTrace outcome warning, forwarded under the code styletrace minted it with.
    Styletrace(StyletraceDiagnosticCode),
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
    /// arm is not a static style object (no-silence sweep).
    NonObjectCssArg,
    /// `extract/jsx`: a `css` / `r` / condition prop value is not a static
    /// style object (no-silence sweep).
    NonObjectJsxStyle,
    /// `extract/expressions/responsive`: a spread inside a value array
    /// refuses the whole array (flattens literals).
    ResponsiveArraySpread,
    /// `extract`: a tagged template on a live `css` binding.
    TaggedTemplateSite,
    /// `object.rs`: a recorded const-object prop with no static style value
    /// (the use site diagnoses it, siblings kept).
    UnfoldableObjectProp,
    /// `object.rs` / `walk.rs` / `member.rs` / `element.rs` / `key.rs`: a
    /// recorded const-object prop that kept static leaves while dropping a
    /// dynamic arm at collect time (residue channel; siblings kept).
    PartialObjectProp,
    /// `fold/binary`: an operator or pair the binary fold refused.
    DynamicBinary,
    /// `fold/conditional`: a ternary arm eliminated by a folded test.
    DeadBranch,
    /// `fold/call`: a `token()` shape the call surface refused.
    TokenCallRefused,
    /// `harvest/mint`: one info per harvest sink, naming the prop, its
    /// `when`, and the minted count (`ATM-HARVEST-01..04`).
    HarvestSink,
    /// `diagnostics/proof`: an exact runtime lookup the final plan omits
    /// with no resolver fact proving the cause.
    MissingStylePlan,
    /// `diagnostics/policy/analysis`: an exact runtime lookup expectation,
    /// compiler-channel telemetry.
    ExpectedLookup,
    /// `diagnostics/policy/analysis`: a dynamic slot observation,
    /// compiler-channel telemetry.
    DynamicSlot,
    /// `extract/expressions/responsive`: a `!` marker on a responsive-object
    /// leaf, refused at the extraction boundary (ATM-LEAF-11). Plans carry
    /// one important flag per object, so the marker can never be served;
    /// the diagnostic names prop + leaf and rides default so the author
    /// sees silent-wrong-paint refusal without opting into the compiler
    /// channel. The refused leaf pushes no want; the plan still serves
    /// the stripped value as a diagnosed non-important fallback.
    ResponsiveLeafImportant,
    /// Retired: canon ships no dialect extension without a lowering
    /// (ATM-EXT-01), so this code is never emitted. Kept for wire
    /// stability — pinned codes are never renamed or removed.
    UnrealizableExtension,
    /// `sources`: a compile request carrying both `files` and a
    /// `retentionToken` (the scan/compile contract is exactly-one-of).
    ConflictingScanInputs,
    /// `sources`: a `retentionToken` that names no live retention (never
    /// minted or already released); never a silent disk fallback.
    UnknownRetentionToken,
    /// `sources`: a `retentionToken` drained by an earlier compile;
    /// retention moves once, so reuse is a lifecycle bug, fail loud.
    DrainedRetentionToken,
    /// `stylesheet/system_layers`: a token owning `--spacing-root` carries a
    /// rhythm value, which would mint a self-referential `var()`. Refused
    /// with the declaration omitted.
    RhythmRootCycle,
    /// `resolve/tokens`: a named tone (`blue.500/medium`) that is not declared
    /// in category `tones`, or whose value cannot serve as an amount. Warned
    /// and painted raw on a bare value; the brace form reuses the
    /// unknown-reference error instead.
    UnknownTone,
    /// `resolve/tokens`: a bare identifier on a spacing, radius, size or
    /// font-size prop that names no token in that category and is no CSS
    /// keyword the prop accepts. Warned and painted raw, like a bare colour.
    UnknownToken,
    /// `stylesheet/system_layers`: a token whose whole value names another
    /// token without braces. Printed verbatim; the warning offers the braced
    /// reference the author meant.
    UnbracedTokenRef,
    /// `extract/jsx`: style props on a tag imported from an installed
    /// package while no upstream system is composed. That package's runtime
    /// mints classes under its own system name, which only a composed
    /// baseSystem (`extends` / `layers`) backs; warned once per tag site,
    /// default channel, and the props still extract.
    ExternalUnbacked,
    /// `extract/recipes/slots`: a malformed `slots` list (not an inline array of
    /// distinct, whitespace-free string literals, or empty), a slot-keyed style map
    /// naming a slot the list does not, or a slot map that is not an inline object.
    /// The whole definition is refused.
    RecipeSlot,
}

/// The code table: one row per variant, in enum declaration order.
/// Both directions of the mapping read this table, so a code string can
/// never drift between serialization and parsing. New codes append rows.
const CODE_TABLE: [(DiagnosticCode, &str); 56] = [
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
    (DiagnosticCode::HarvestSink, "ATM-I-HARVEST-SINK"),
    (DiagnosticCode::MissingStylePlan, "ATM-W-MISSING-STYLE-PLAN"),
    (DiagnosticCode::ExpectedLookup, "ATM-I-EXPECTED-LOOKUP"),
    (DiagnosticCode::DynamicSlot, "ATM-I-DYNAMIC-SLOT"),
    (
        DiagnosticCode::ResponsiveLeafImportant,
        "ATM-W-RESPONSIVE-LEAF-IMPORTANT",
    ),
    (
        DiagnosticCode::UnrealizableExtension,
        "ATM-W-UNREALIZABLE-EXTENSION",
    ),
    (
        DiagnosticCode::ConflictingScanInputs,
        "ATM-E-CONFLICTING-SCAN-INPUTS",
    ),
    (
        DiagnosticCode::UnknownRetentionToken,
        "ATM-E-UNKNOWN-RETENTION-TOKEN",
    ),
    (
        DiagnosticCode::DrainedRetentionToken,
        "ATM-E-DRAINED-RETENTION-TOKEN",
    ),
    (DiagnosticCode::RhythmRootCycle, "ATM-E-RHYTHM-ROOT-CYCLE"),
    (DiagnosticCode::UnknownTone, "ATM-W-UNKNOWN-TONE"),
    (DiagnosticCode::UnknownToken, "ATM-W-UNKNOWN-TOKEN"),
    (DiagnosticCode::UnbracedTokenRef, "ATM-W-UNBRACED-TOKEN-REF"),
    (DiagnosticCode::ExternalUnbacked, "ATM-W-EXTERNAL-UNBACKED"),
    (DiagnosticCode::RecipeSlot, "ATM-E-RECIPE-SLOT"),
];

// hints.test.ts reads the negative fixture `ATM-W-NOPE` out of this file, so the refusal
// test stays beside the table it refuses against.
#[cfg(test)]
mod refusal {
    use super::DiagnosticCode;

    #[test]
    fn unknown_code_strings_refuse() {
        assert!("ATM-W-NOPE".parse::<DiagnosticCode>().is_err());
        assert!(serde_json::from_str::<DiagnosticCode>("\"ATM1001\"").is_err());
    }
}
