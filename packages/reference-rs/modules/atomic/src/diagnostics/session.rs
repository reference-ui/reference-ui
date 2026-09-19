//! Compile-long fact and expectation store for the diagnostics subsystem.
//!
//! The coordinator creates one [`DiagnosticsSession`] per compile; phases
//! report [`DiagnosticFact`] values into it through the [`DiagnosticSink`]
//! protocol, and final proof reads the owned facts back after plans exist.
//! The session owns data, never AST references, so expectations outlive the
//! parse they were derived from. Slice 3 wires producers to this store.

use super::{DiagnosticFact, DiagnosticSink};

/// Owns every fact reported during one compile, in report order.
#[derive(Debug, Default)]
pub struct DiagnosticsSession {
    facts: Vec<DiagnosticFact>,
}

impl DiagnosticsSession {
    /// An empty session for a new compile.
    pub fn new() -> Self {
        Self { facts: Vec::new() }
    }

    /// Every fact reported so far, in report order.
    pub fn facts(&self) -> &[DiagnosticFact] {
        &self.facts
    }

    /// Drain all facts, leaving the session empty for reuse.
    pub fn take_facts(&mut self) -> Vec<DiagnosticFact> {
        std::mem::take(&mut self.facts)
    }
}

impl DiagnosticSink for DiagnosticsSession {
    fn report(&mut self, fact: DiagnosticFact) {
        self.facts.push(fact);
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
            source: SourceId(3),
            span: Span::new(1, 5),
            surface: StyleSurfaceKind::JsxStyle,
            prop: "mt".into(),
            when: Vec::new(),
        }
    }

    #[test]
    fn session_collects_and_drains_in_order() {
        let mut session = DiagnosticsSession::new();
        assert!(session.facts().is_empty());
        session.report(DiagnosticFact::DynamicSlot {
            site: site(),
            shape: DynamicShape::Spread,
        });
        session.report(DiagnosticFact::ExistingError(Diagnostic::error(
            DiagnosticCode::ParseError,
            "boom",
        )));
        assert_eq!(session.facts().len(), 2);
        let drained = session.take_facts();
        assert_eq!(drained.len(), 2);
        assert!(session.facts().is_empty());
    }
}
