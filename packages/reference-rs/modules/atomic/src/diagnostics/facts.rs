//! Typed producer protocol between compiler phases and diagnostics.
//!
//! Phases report semantic [`DiagnosticFact`] values to a [`DiagnosticSink`];
//! they never construct final user prose and never choose an audience.
//! [`OwnedLookupKey`] names runtime truth and must be built by the same
//! key authority as `RuntimeStylePlan`; diagnostics grows no second
//! canonicalizer. Producer facts carry [`DiagnosticLocation`] (the honest
//! position each phase holds) while analysis facts keep span-identified
//! [`SourceSite`](super::SourceSite); no source catalog exists yet to map
//! file paths back to `SourceId`s. Slice 3 migrates the four producer
//! families onto this protocol; Slice 4 renders session facts into proof.

use super::{Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity};
use crate::diagnostics::SourceSite;
use crate::extract::fold::ElementRefusal;
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

/// What extraction refused at one source site. The vocabulary holds reported
/// events only: success outcomes rejoin if Slice 4 reports them (proof
/// reads final plans today, not extraction-success facts).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExtractOutcome {
    /// The site refused a dynamic value position through `warn_dynamic`.
    /// `sink_recorded` names whether a harvest sink was actually pushed:
    /// false for non-sink codes (mutation) and record-time filter drops.
    Refused {
        code: DiagnosticCode,
        detail: ExtractDetail,
        sink_recorded: bool,
    },
}

/// The structured refusal behind one extract warning. Variants carry
/// referring expressions (names, paths, reason phrases) — never sentences:
/// policy owns the sentence template, keyed by this vocabulary.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ExtractDetail {
    /// Leaf-shape refusals: members, chains, identifiers, call fragments.
    Leaf(LeafDetail),
    /// Fold-shape refusals: unary, binary, and template folds.
    Fold(FoldDetail),
    /// An element-access refusal over one base and index spelling.
    Element {
        refusal: ElementRefusal,
        base: Box<str>,
        index: Box<str>,
    },
}

/// Leaf-shape extract refusals: one dynamic position, no fold structure.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum LeafDetail {
    /// A dynamic leaf with no further structure (member, chain, fallback).
    Generic,
    /// A non-literal identifier by name.
    Identifier { name: Box<str> },
    /// A refused call-argument fragment by its detail phrase.
    CallArgument { detail: Box<str> },
}

/// Fold-shape extract refusals: one failed fold with its reason phrase.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FoldDetail {
    /// A unary fold refusal with its reason phrase.
    Unary { detail: Box<str> },
    /// A binary fold refusal with its reason phrase.
    Binary { detail: Box<str> },
    /// A template refusal: one hole by one-based index, or the whole
    /// template when `part` is None.
    Template {
        part: Option<usize>,
        detail: Box<str>,
    },
}

/// What resolve did with one exact authored declaration. The vocabulary
/// holds reported events only: success outcomes rejoin if Slice 4 reports
/// them (proof reads final plans today, not resolve-success facts).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveOutcome {
    /// The declaration was rejected and produced no atoms.
    Rejected {
        code: DiagnosticCode,
        detail: ResolveDetail,
    },
    /// The declaration warned but still painted (warn-and-paint passthrough).
    Passthrough {
        code: DiagnosticCode,
        detail: ResolveDetail,
    },
    /// An aggregate advisory over emitted atoms, not one declaration.
    Advisory {
        code: DiagnosticCode,
        detail: ResolveDetail,
    },
}

/// The structured refusal behind one resolve warning. Every variant carries
/// its render parts, so policy renders without unwrapping the key (which is
/// absent when no want context is in hand). Values travel as spellings so
/// policy can split verdicts by (code, value): `InvalidCssValue` on Bool
/// `true` is userspace-provable, on `false` never userspace (ledger E9).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ResolveDetail {
    /// Declaration-shape refusals from resolve and unit lowering.
    Declaration(DeclarationDetail),
    /// Token-shape refusals from token lookup and brace interpolation.
    Token(TokenDetail),
}

/// Declaration-shape resolve refusals: the name or value under test.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DeclarationDetail {
    /// Unknown-name refusals: properties and conditions.
    Name(NameDetail),
    /// Value-shape refusals: numerics, strings, and booleans.
    Value(ValueDetail),
    /// `@container condition emitted but no container root (container-type)
    /// is defined in globalCss` (unit variant: the advisory names no part).
    ContainerRoot,
}

/// Unknown-name resolve refusals.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum NameDetail {
    /// `Unknown style property "{prop}"`.
    Property { prop: Box<str> },
    /// `Unknown condition "{name}"`.
    Condition { name: Box<str> },
}

/// Value-shape resolve refusals.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValueDetail {
    /// `Non-canonical numeric value "{spelling}" on `{prop}``.
    NonCanonicalNumber { prop: Box<str>, spelling: Box<str> },
    /// ``Empty string value on `{prop}` ``.
    EmptyString { prop: Box<str> },
    /// `` `{prop}` value `{value}` is not valid CSS ``.
    InvalidValue { prop: Box<str>, value: Box<str> },
}

/// Token-shape resolve refusals: the raw spelling under test.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TokenDetail {
    /// ``malformed opacity modifier `{text}` ``.
    MalformedOpacity { text: Box<str> },
    /// ``unknown token path `{path}` ``.
    UnknownTokenPath { path: Box<str> },
    /// `` `{text}` is neither a color token nor a CSS color ``.
    UnknownColor { text: Box<str> },
    /// ``unterminated `{` in value `{value}` ``.
    UnterminatedBrace { value: Box<str> },
}

/// One semantic report from a compiler phase. Small vocabulary on purpose:
/// producers describe what happened; policy decides wording and audience.
#[derive(Debug, Clone, PartialEq)]
pub enum DiagnosticFact {
    /// A pre-protocol diagnostic, preserved with its severity. Carries
    /// dependency-built lines (host traces) and, later, fatal pass-throughs.
    ExistingDiagnostic(Diagnostic),
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
    /// What extraction refused at one located site.
    ExtractOutcome {
        location: DiagnosticLocation,
        prop: Box<str>,
        when: Vec<Box<str>>,
        outcome: ExtractOutcome,
    },
    /// A compiler-only extract note: a structure/refusal line that predates
    /// the structured-detail vocabulary. Slice 5 carries the legacy sentence
    /// verbatim — sixty bespoke call-site sentences; restructuring them
    /// risks byte drift for zero behavioral gain.
    ExtractNote {
        location: DiagnosticLocation,
        severity: DiagnosticSeverity,
        code: DiagnosticCode,
        message: Box<str>,
    },
    /// How many net-new pairs harvest minted onto one located sink, plus
    /// every kind-accepted pool value (pre-twin-skip) for coverage proof.
    HarvestOutcome {
        location: DiagnosticLocation,
        prop: Box<str>,
        when: Vec<Box<str>>,
        minted: usize,
        offered: Vec<Box<str>>,
    },
    /// What resolve did with one authored declaration: the exact key when a
    /// want context is in hand, the outcome always.
    ResolveOutcome {
        location: DiagnosticLocation,
        key: Option<OwnedLookupKey>,
        outcome: ResolveOutcome,
    },
    /// One skipped host trace: a file-only line with a dependency message.
    HostOutcome {
        file: Option<Box<str>>,
        message: Box<str>,
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
        assert!(matches!(sink[1], DiagnosticFact::ExactLookupExpected { .. }));
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
        assert_eq!(key.lookup_key(), r#"["test",["_hover","_focus"],"color","red",true]"#);
    }

    #[test]
    fn resolve_outcomes_distinguish_drop_from_passthrough() {
        let dropped = ResolveOutcome::Rejected {
            code: DiagnosticCode::UnknownCondition,
            detail: ResolveDetail::Declaration(DeclarationDetail::Name(NameDetail::Condition {
                name: "_nope".into(),
            })),
        };
        let painted = ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownTokenPath,
            detail: ResolveDetail::Token(TokenDetail::UnknownTokenPath {
                path: "ui.ghost".into(),
            }),
        };
        assert_ne!(dropped, painted);
        assert!(matches!(dropped, ResolveOutcome::Rejected { .. }));
    }

    #[test]
    fn extract_refusal_records_whether_a_sink_was_pushed() {
        let refused = ExtractOutcome::Refused {
            code: DiagnosticCode::DynamicIdentifier,
            detail: ExtractDetail::Leaf(LeafDetail::Identifier { name: "space".into() }),
            sink_recorded: true,
        };
        let unstaged = ExtractOutcome::Refused {
            code: DiagnosticCode::MutatedBinding,
            detail: ExtractDetail::Leaf(LeafDetail::Generic),
            sink_recorded: false,
        };
        assert_ne!(refused, unstaged);
    }
}
