//! Harvest sinks: the dynamic value positions pool values mint onto.
//!
//! A sink is `(prop, when)` at a site where the walk refused the value
//! position as dynamic — the six `Dynamic*` codes — carrying the prop's
//! value kind from canon. Spreads have no prop and are never sinks; mutated
//! bindings, residue markers, and non-dynamic refusals are not sinks either.

use canon::ValueKind;
use smallvec::SmallVec;

use crate::diagnostics::DiagnosticCode;

/// Props Slice 5 owns per host (§14); until the surface lands, the S4-1 sink
/// filter drops them wholesale. `gap`/`offset` on ToastHost and
/// Overlay.Content are component props, not style positions.
const OWNED_PROPS: &[&str] = &["gap", "offset"];

/// Props resolve owns at runtime (`resolve/mod.rs is_runtime_owned`): they
/// lower to zero declarations, so a sink there could never paint.
const RUNTIME_OWNED_PROPS: &[&str] = &["variant", "colorMode"];

/// One refused dynamic value position: the sink harvest mints onto.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Sink {
    /// The style prop the site refused.
    pub prop: Box<str>,
    /// The condition scope the site refused under.
    pub when: SmallVec<[Box<str>; 2]>,
    /// The prop's primary value kind from canon.
    pub kind: ValueKind,
    /// The refused site, locating the sink's info diagnostic.
    pub file: Box<str>,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

/// The refused site a sink is recorded from (the hook's context struct).
pub struct SinkSite<'a> {
    pub prop: &'a str,
    pub when: &'a SmallVec<[Box<str>; 2]>,
    pub file: &'a str,
    pub line: Option<u32>,
    pub column: Option<u32>,
}

impl Sink {
    /// The sink for a refused site, or None when a record-time filter drops
    /// it: §14 owned props (S4-1), unknown style props (resolve would warn,
    /// against A5), and runtime-owned props (zero declarations).
    pub fn for_site(site: SinkSite<'_>) -> Option<Self> {
        if is_owned_prop(site.prop)
            || !canon::is_known_style_prop(site.prop)
            || is_runtime_owned(site.prop)
        {
            return None;
        }
        Some(Self {
            prop: site.prop.into(),
            when: site.when.clone(),
            kind: sink_kind_for_prop(site.prop),
            file: site.file.into(),
            line: site.line,
            column: site.column,
        })
    }
}

/// True for the six dynamic-refusal codes: the walk could not read the value
/// position. A dynamic ternary arm lands in one of these through its
/// re-walked arm; mutation, spreads, and residue codes are never sinks.
pub fn is_sink_code(code: DiagnosticCode) -> bool {
    matches!(
        code,
        DiagnosticCode::DynamicIdentifier
            | DiagnosticCode::DynamicMember
            | DiagnosticCode::DynamicExpression
            | DiagnosticCode::DynamicTemplate
            | DiagnosticCode::DynamicBinary
            | DiagnosticCode::DynamicUnary
    )
}

/// True for a §14 owned prop under the S4-1 sink filter.
fn is_owned_prop(prop: &str) -> bool {
    OWNED_PROPS.contains(&prop)
}

/// True for a runtime-owned prop: it lowers to zero declarations.
fn is_runtime_owned(prop: &str) -> bool {
    RUNTIME_OWNED_PROPS.contains(&prop)
}

/// The prop's primary value kind from canon: the first channel the prop
/// accepts. Mint still gates every pair through `prop_accepts`, so this
/// records the sink; it never narrows the gate. (Math shares the Length
/// table, so Length covers it.)
fn sink_kind_for_prop(prop: &str) -> ValueKind {
    for kind in [
        ValueKind::Color,
        ValueKind::Transform,
        ValueKind::Url,
        ValueKind::Length,
    ] {
        if canon::prop_accepts(prop, kind) {
            return kind;
        }
    }
    ValueKind::Keyword
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Record a bare `(prop, when)` site for filter assertions.
    fn record(prop: &str) -> Option<Sink> {
        Sink::for_site(SinkSite {
            prop,
            when: &SmallVec::new(),
            file: "t.ts",
            line: None,
            column: None,
        })
    }

    #[test]
    fn sink_codes_are_the_six_dynamic_refusals() {
        for code in [
            DiagnosticCode::DynamicIdentifier,
            DiagnosticCode::DynamicMember,
            DiagnosticCode::DynamicExpression,
            DiagnosticCode::DynamicTemplate,
            DiagnosticCode::DynamicBinary,
            DiagnosticCode::DynamicUnary,
        ] {
            assert!(is_sink_code(code));
        }
        for code in [
            DiagnosticCode::MutatedBinding,
            DiagnosticCode::UnfoldableSpread,
            DiagnosticCode::PartialObjectProp,
            DiagnosticCode::DeadBranch,
            DiagnosticCode::UnknownProperty,
        ] {
            assert!(!is_sink_code(code));
        }
    }

    #[test]
    fn record_time_filters_drop_owned_unknown_and_runtime() {
        assert!(record("gap").is_none(), "§14 owned");
        assert!(record("offset").is_none(), "§14 owned");
        assert!(record("notAProp").is_none(), "unknown prop");
        assert!(record("colorMode").is_none(), "runtime-owned");
        assert!(record("variant").is_none(), "runtime-owned");
        assert!(record("color").is_some());
        assert!(record("margin").is_some());
    }

    #[test]
    fn primary_kind_follows_the_property_table() {
        assert_eq!(record("color").unwrap().kind, ValueKind::Color);
        assert_eq!(record("margin").unwrap().kind, ValueKind::Length);
        assert_eq!(record("transform").unwrap().kind, ValueKind::Transform);
    }
}
