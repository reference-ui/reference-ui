//! Userspace/compiler channel partition for final diagnostics.
//!
//! `diagnostics` carries existing errors plus proof-backed warnings;
//! `compilerDiagnostics` carries the opt-in backchannel and stays absent
//! unless requested. Hosts never re-filter one mixed array. Slice 5 owns
//! the config threading and the wire fields; this type is the Rust-side
//! partition it fills.

use super::{Audience, Diagnostic};

/// The two final diagnostic lists for one compile.
#[derive(Debug, Default)]
pub struct DiagnosticChannels {
    /// Default channel: errors plus proof-backed warnings.
    pub userspace: Vec<Diagnostic>,
    /// Opt-in backchannel: populated only when requested.
    pub compiler: Vec<Diagnostic>,
}

impl DiagnosticChannels {
    /// Empty channels for a new compile.
    pub fn new() -> Self {
        Self {
            userspace: Vec::new(),
            compiler: Vec::new(),
        }
    }

    /// Push one diagnostic onto its audience's list.
    pub fn push(&mut self, audience: Audience, diagnostic: Diagnostic) {
        match audience {
            Audience::Userspace => self.userspace.push(diagnostic),
            Audience::Compiler => self.compiler.push(diagnostic),
        }
    }

    /// True when both lists are empty.
    pub fn is_empty(&self) -> bool {
        self.userspace.is_empty() && self.compiler.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::diagnostics::{DiagnosticCode, DiagnosticSeverity};

    fn warning(message: &str) -> Diagnostic {
        Diagnostic::warning(DiagnosticCode::UnfoldableSpread, message)
    }

    #[test]
    fn audiences_land_on_separate_lists() {
        let mut channels = DiagnosticChannels::new();
        assert!(channels.is_empty());
        channels.push(Audience::Userspace, warning("user"));
        channels.push(Audience::Compiler, warning("compiler"));
        assert_eq!(channels.userspace.len(), 1);
        assert_eq!(channels.compiler.len(), 1);
        assert_eq!(channels.userspace[0].severity, DiagnosticSeverity::Warning);
        assert!(!channels.is_empty());
    }
}
