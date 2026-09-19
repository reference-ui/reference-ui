//! Proof-to-verdict table: which audience hears each diagnostic fact.
//!
//! Userspace hears existing fatals plus proof-backed absent-key warnings;
//! the compiler backchannel hears everything useful that cannot clear that
//! bar. Today every phase pushes straight onto the default channel, so the
//! table pins that uniform behavior; Slices 4 and 5 refine it per proof.

use super::DiagnosticFact;

/// The two diagnostic audiences. Severity is never used as an audience proxy.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Audience {
    /// Authors: fatals plus proven absent-key warnings.
    Userspace,
    /// Compiler developers: dynamic refusals, spreads, harvest, dead branches.
    Compiler,
}

/// Today's verdict table: every fact lands on the default channel. Slice 4
/// keeps only proof-backed warnings here; Slice 5 moves the rest behind
/// the opt-in compiler channel.
pub struct Policy;

impl Policy {
    /// The audience for one fact under the current (pre-proof) table.
    pub fn classify(_fact: &DiagnosticFact) -> Audience {
        Audience::Userspace
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{
        Diagnostic, DiagnosticCode, DynamicShape, SourceId, SourceSite, StyleSurfaceKind,
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

    #[test]
    fn every_fact_is_default_channel_until_proof_lands() {
        let facts = [
            DiagnosticFact::ExistingError(Diagnostic::error(DiagnosticCode::ParseError, "x")),
            DiagnosticFact::DynamicSlot {
                site: site(),
                shape: DynamicShape::UnknownValue,
            },
            DiagnosticFact::HarvestOutcome {
                site: site(),
                minted: 2,
            },
        ];
        for fact in &facts {
            assert_eq!(Policy::classify(fact), Audience::Userspace);
        }
    }
}
