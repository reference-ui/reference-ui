//! Typed producer protocol between compiler phases and diagnostics.
//!
//! Phases report semantic [`DiagnosticFact`] values to a [`DiagnosticSink`];
//! they never construct final user prose and never choose an audience.
//! [`OwnedLookupKey`] names runtime truth and must be built by the same
//! key authority as `RuntimeStylePlan`; diagnostics grows no second
//! canonicalizer. Slice 3 migrates producers onto this protocol.

use super::{Diagnostic, DiagnosticCode};
use crate::diagnostics::SourceSite;
use crate::runtime::serializer::{serialize_lookup_key, LookupKey};

/// An exact runtime style lookup key, owned. The serializer authority stays
/// with the runtime plan builder; this type only carries the five-tuple.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OwnedLookupKey {
    pub system: Box<str>,
    pub when: Vec<Box<str>>,
    pub prop: Box<str>,
    pub value: serde_json::Value,
    pub important: bool,
}

impl OwnedLookupKey {
    /// Serialize this expectation with the one runtime-key authority, so
    /// analysis bytes equal plan bytes and neo `serializeLookupKey` bytes.
    pub fn lookup_key(&self) -> String {
        let when: Vec<String> = self.when.iter().map(|part| part.to_string()).collect();
        serialize_lookup_key(&LookupKey {
            system: &self.system,
            when: &when,
            prop: &self.prop,
            value: &self.value,
            important: self.important,
        })
    }
}

/// Which part of a runtime lookup key is statically unknown. A dynamic slot
/// can never prove an absent key, so it stays compiler-channel at most.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DynamicShape {
    /// The value is not statically known (identifier, member, call, binary).
    UnknownValue,
    /// The property key is not statically known (computed key).
    UnknownProp,
    /// The condition stack is not statically known.
    UnknownWhen,
    /// An object spread with unknown shape.
    Spread,
}

/// What extraction did with one source site.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ExtractOutcome {
    /// The site produced wants.
    Extracted,
    /// The site was refused with a stable failure class.
    Refused { code: DiagnosticCode },
}

/// What resolve did with one exact authored declaration.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResolveOutcome {
    /// The declaration produced atoms.
    Resolved,
    /// The declaration was rejected and produced no atoms.
    Rejected { code: DiagnosticCode },
    /// The declaration warned but still painted (warn-and-paint passthrough).
    Passthrough { code: DiagnosticCode },
}

/// One semantic report from a compiler phase. Small vocabulary on purpose:
/// producers describe what happened; policy decides wording and audience.
#[derive(Debug, Clone, PartialEq)]
pub enum DiagnosticFact {
    /// An existing fatal diagnostic, preserved unchanged.
    ExistingError(Diagnostic),
    /// Analysis predicts runtime will request exactly this key here.
    ExactLookupExpected {
        site: SourceSite,
        key: OwnedLookupKey,
    },
    /// A runtime style slot whose key is not statically known.
    DynamicSlot {
        site: SourceSite,
        shape: DynamicShape,
    },
    /// What extraction did with one site.
    ExtractOutcome {
        site: SourceSite,
        outcome: ExtractOutcome,
    },
    /// How many net-new pairs harvest minted onto one sink.
    HarvestOutcome { site: SourceSite, minted: usize },
    /// What resolve did with one authored declaration.
    ResolveOutcome {
        site: SourceSite,
        key: Option<OwnedLookupKey>,
        outcome: ResolveOutcome,
    },
}

/// The narrow producer interface: phases report facts, nothing else.
pub trait DiagnosticSink {
    fn report(&mut self, fact: DiagnosticFact);
}

impl DiagnosticSink for Vec<DiagnosticFact> {
    fn report(&mut self, fact: DiagnosticFact) {
        self.push(fact);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{SourceId, StyleSurfaceKind};
    use oxc_span::Span;

    fn site() -> SourceSite {
        SourceSite {
            source: SourceId(1),
            span: Span::new(0, 4),
            surface: StyleSurfaceKind::Css,
            prop: "color".into(),
            when: Vec::new(),
        }
    }

    fn key() -> OwnedLookupKey {
        OwnedLookupKey {
            system: "test".into(),
            when: Vec::new(),
            prop: "color".into(),
            value: serde_json::Value::String("red".to_string()),
            important: false,
        }
    }

    #[test]
    fn vec_sink_collects_facts_in_order() {
        let mut sink: Vec<DiagnosticFact> = Vec::new();
        sink.report(DiagnosticFact::DynamicSlot {
            site: site(),
            shape: DynamicShape::UnknownValue,
        });
        sink.report(DiagnosticFact::ExactLookupExpected {
            site: site(),
            key: key(),
        });
        assert_eq!(sink.len(), 2);
        assert!(matches!(sink[0], DiagnosticFact::DynamicSlot { .. }));
        assert!(matches!(
            sink[1],
            DiagnosticFact::ExactLookupExpected { .. }
        ));
    }

    #[test]
    fn lookup_key_serializes_the_five_tuple() {
        let key = key();
        assert_eq!(key.lookup_key(), r#"["test",[],"color","red",false]"#);
    }

    #[test]
    fn lookup_key_sorts_object_values_canonically() {
        let mut key = key();
        key.prop = "width".into();
        key.value = serde_json::json!({"md": "60px", "base": "50px"});
        assert_eq!(
            key.lookup_key(),
            r#"["test",[],"width",{"base":"50px","md":"60px"},false]"#
        );
    }

    #[test]
    fn lookup_key_keeps_nested_whens_and_important() {
        let mut key = key();
        key.when = vec!["_hover".into(), "_focus".into()];
        key.important = true;
        assert_eq!(
            key.lookup_key(),
            r#"["test",["_hover","_focus"],"color","red",true]"#
        );
    }

    #[test]
    fn resolve_outcomes_distinguish_drop_from_passthrough() {
        let dropped = ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
        };
        let painted = ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownTokenPath,
        };
        assert_ne!(dropped, painted);
        assert!(matches!(dropped, ResolveOutcome::Rejected { .. }));
    }
}
