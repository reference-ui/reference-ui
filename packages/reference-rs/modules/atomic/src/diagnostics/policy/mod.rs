//! Proof-to-verdict table: which audience hears each diagnostic fact.
//!
//! Userspace hears existing fatals plus proof-backed absent-key warnings;
//! the compiler backchannel hears everything useful that cannot clear that
//! bar. Slice 4 joined proof over the pushed lines; Slice 5 partitions the
//! rest behind the opt-in channel per this table. Wording lives here too:
//! per-family `render_*` functions own every sentence template,
//! byte-identical to the legacy call-site strings.

pub(crate) mod analysis;
mod extract;
mod harvest;
mod hosts;
mod proof;
mod resolve;

use super::{
    DeclarationDetail, DiagnosticFact, ResolveDetail, ResolveOutcome, ValueDetail,
};

/// The two diagnostic audiences. Severity is never used as an audience proxy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Audience {
    /// Authors: fatals plus proven absent-key warnings.
    Userspace,
    /// Compiler developers: dynamic refusals, spreads, harvest, dead branches.
    Compiler,
}

/// The Slice-5 verdict table: proof-backed resolve lines stay userspace;
/// analysis observations, extract refusals and notes, harvest telemetry,
/// and hole-valued (`false`) resolve refusals ride the opt-in compiler
/// channel. Resolve passthroughs/advisories, host skips, and static/global
/// lines stay default pending the deferred token-passthrough/host policy.
pub struct Policy;

impl Policy {
    /// The audience for one fact under the Slice-5 table.
    pub fn classify(fact: &DiagnosticFact) -> Audience {
        match fact {
            DiagnosticFact::ExistingDiagnostic(_) => Audience::Userspace,
            DiagnosticFact::ExactLookupExpected { .. }
            | DiagnosticFact::DynamicSlot { .. }
            | DiagnosticFact::ExtractOutcome { .. }
            | DiagnosticFact::ExtractNote { .. }
            | DiagnosticFact::HarvestOutcome { .. } => Audience::Compiler,
            DiagnosticFact::ResolveOutcome { outcome, .. } => Self::resolve_audience(outcome),
            DiagnosticFact::HostOutcome { .. } => Audience::Userspace,
        }
    }

    /// Resolve lines stay userspace except hole-valued `false` refusals:
    /// runtime skips holes without querying, so they can never be a
    /// userspace miss (ledger E9 / F6 — the (code, value) split executes
    /// here; proof's join gate asks its own question separately).
    fn resolve_audience(outcome: &ResolveOutcome) -> Audience {
        match outcome {
            ResolveOutcome::Rejected { detail, .. } if is_false_refusal(detail) => {
                Audience::Compiler
            }
            _ => Audience::Userspace,
        }
    }

    /// Render one extract refusal report to its final warning line.
    pub fn render_extract(
        report: &super::adapters::extract::ExtractReport,
    ) -> super::Diagnostic {
        extract::render(report)
    }

    /// Render one harvest mint report to its final info line.
    pub fn render_harvest(
        report: &super::adapters::harvest::HarvestReport,
    ) -> super::Diagnostic {
        harvest::render(report)
    }

    /// Render one resolve outcome report to its final warning line.
    pub fn render_resolve(
        report: &super::adapters::resolve::ResolveReport,
    ) -> super::Diagnostic {
        resolve::render(report)
    }

    /// Render one host skip report to its final file-only warning line.
    pub fn render_host(report: &super::adapters::hosts::HostReport) -> super::Diagnostic {
        hosts::render(report)
    }

    /// Render one proven miss with its resolver cause.
    pub fn render_proof(
        key: &super::OwnedLookupKey,
        location: &super::DiagnosticLocation,
        code: super::DiagnosticCode,
        reason: &str,
    ) -> super::Diagnostic {
        proof::render_proof(key, location, code, reason)
    }

    /// Render one proven miss with no resolver cause.
    pub fn render_causeless(key: &super::OwnedLookupKey) -> super::Diagnostic {
        proof::render_causeless(key)
    }

    /// Render one expected exact lookup as compiler-channel telemetry.
    pub fn render_expected(
        key: &super::OwnedLookupKey,
        location: &super::DiagnosticLocation,
    ) -> super::Diagnostic {
        analysis::render_expected(key, location)
    }

    /// Render one dynamic slot as compiler-channel telemetry.
    pub fn render_dynamic(
        prop: &str,
        shape: super::DynamicShape,
        location: &super::DiagnosticLocation,
    ) -> super::Diagnostic {
        analysis::render_dynamic(prop, shape, location)
    }
}

/// True for a refusal of the hole value `false`: runtime skips it without
/// querying. Only `AtomValue::Bool` builds this spelling, so `false` here
/// is exactly the unqueryable hole (mirrors proof's join gate, which asks
/// its own question — the two must agree that false never warns userspace).
fn is_false_refusal(detail: &ResolveDetail) -> bool {
    matches!(
        detail,
        ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::InvalidValue {
            value,
            ..
        })) if value.as_ref() == "false"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{
        Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity, DynamicShape,
        ExtractDetail, ExtractOutcome, LeafDetail, NameDetail, ResolveOutcome, SourceId,
        SourceSite, StyleSurfaceKind, TokenDetail,
    };
    use oxc_span::Span;

    fn site() -> SourceSite {
        SourceSite {
            source: SourceId(0),
            span: Span::new(0, 1),
            surface: StyleSurfaceKind::Css,
            prop: "color".into(),
            when: Vec::new(),
        }
    }

    fn key() -> crate::diagnostics::OwnedLookupKey {
        crate::diagnostics::OwnedLookupKey {
            system: "lib".into(),
            when: Vec::new(),
            prop: "color".into(),
            value: serde_json::json!("red"),
            important: false,
        }
    }

    fn invalid_reject(value: &str) -> ResolveOutcome {
        ResolveOutcome::Rejected {
            code: DiagnosticCode::InvalidCssValue,
            detail: ResolveDetail::Declaration(DeclarationDetail::Value(ValueDetail::InvalidValue {
                prop: "display".into(),
                value: value.into(),
            })),
        }
    }

    #[test]
    fn fatals_and_proof_backed_lines_stay_userspace() {
        let facts = [
            DiagnosticFact::ExistingDiagnostic(Diagnostic::error(
                DiagnosticCode::ParseError,
                "x",
            )),
            DiagnosticFact::ResolveOutcome {
                location: DiagnosticLocation::default(),
                key: Some(key()),
                outcome: invalid_reject("true"),
            },
            DiagnosticFact::ResolveOutcome {
                location: DiagnosticLocation::default(),
                key: Some(key()),
                outcome: ResolveOutcome::Passthrough {
                    code: DiagnosticCode::UnknownTokenPath,
                    detail: ResolveDetail::Token(TokenDetail::UnknownTokenPath {
                        path: "ui.ghost".into(),
                    }),
                },
            },
            DiagnosticFact::ResolveOutcome {
                location: DiagnosticLocation::default(),
                key: None,
                outcome: ResolveOutcome::Advisory {
                    code: DiagnosticCode::UnknownCondition,
                    detail: ResolveDetail::Declaration(DeclarationDetail::Name(
                        NameDetail::Condition { name: "_x".into() },
                    )),
                },
            },
            DiagnosticFact::HostOutcome {
                file: None,
                message: "trace skipped".into(),
            },
        ];
        for fact in &facts {
            assert_eq!(Policy::classify(fact), Audience::Userspace);
        }
    }

    #[test]
    fn observations_refusals_and_false_rejects_ride_the_compiler_channel() {
        let facts = [
            DiagnosticFact::ExactLookupExpected {
                site: site(),
                key: key(),
            },
            DiagnosticFact::DynamicSlot {
                site: site(),
                shape: DynamicShape::UnknownValue,
            },
            DiagnosticFact::ExtractOutcome {
                location: DiagnosticLocation::default(),
                prop: "color".into(),
                when: Vec::new(),
                outcome: ExtractOutcome::Refused {
                    code: DiagnosticCode::DynamicIdentifier,
                    detail: ExtractDetail::Leaf(LeafDetail::Generic),
                    sink_recorded: true,
                },
            },
            DiagnosticFact::ExtractNote {
                location: DiagnosticLocation::default(),
                severity: DiagnosticSeverity::Warning,
                code: DiagnosticCode::UnfoldableSpread,
                message: "spread".into(),
            },
            DiagnosticFact::HarvestOutcome {
                location: DiagnosticLocation::default(),
                prop: "color".into(),
                when: Vec::new(),
                minted: 2,
                offered: Vec::new(),
            },
            DiagnosticFact::ResolveOutcome {
                location: DiagnosticLocation::default(),
                key: Some(key()),
                outcome: invalid_reject("false"),
            },
        ];
        for fact in &facts {
            assert_eq!(Policy::classify(fact), Audience::Compiler);
        }
    }
}
