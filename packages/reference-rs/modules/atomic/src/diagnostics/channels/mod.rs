//! Userspace/compiler channel partition for final diagnostics.
//!
//! `diagnostics` carries existing errors plus proof-backed warnings;
//! `compilerDiagnostics` carries the opt-in backchannel and stays absent
//! unless requested. Hosts never re-filter one mixed array. Partition runs
//! once at end of compile: every compiler-classified fact strips its
//! re-derived legacy line from default and, only when requested, renders
//! the line onto the backchannel. Per-fact rendering lives in `render`.

mod render;

use render::{is_false_refusal, render_fact};

use super::proof::lines::{find_line, remove_line};
use super::{
    Audience, Diagnostic, DiagnosticCode, DiagnosticFact, DiagnosticLocation, Policy, SourceCatalog,
};

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

    /// Partition pushed lines by fact audience. Compiler-classified facts
    /// strip their re-derived legacy line from default and, only when
    /// requested, render it onto the backchannel. Analysis facts render
    /// fresh (never pushed, nothing to strip); covered-sink removals no-op
    /// harmlessly. A final echo sweep reaps unfacted re-resolve dupes.
    /// Dead renders are skipped, never weakened: an unrequested backchannel
    /// drops every analysis line (no strip, no echo reads it), and an empty
    /// default channel makes every strip and sweep vacuous.
    pub fn partition(
        facts: &[DiagnosticFact],
        diagnostics: Vec<Diagnostic>,
        catalog: &SourceCatalog,
        render_compiler: bool,
    ) -> DiagnosticChannels {
        let mut channels = DiagnosticChannels {
            userspace: diagnostics,
            compiler: Vec::new(),
        };
        if !render_compiler && channels.userspace.is_empty() {
            return channels;
        }
        let mut false_echoes: Vec<EchoTriple> = Vec::new();
        for fact in facts {
            if Policy::classify(fact) != Audience::Compiler {
                continue;
            }
            channels.partition_fact(fact, catalog, render_compiler, &mut false_echoes);
        }
        sweep_false_echoes(&mut channels.userspace, &false_echoes);
        channels
    }

    /// Render one compiler-classified fact onto its channel: strip its
    /// re-derived line from default, collect its echo identity, and push
    /// it to the backchannel when requested. Analysis facts skip the
    /// render when the backchannel is off: no strip or echo reads a line
    /// that was never pushed.
    fn partition_fact(
        &mut self,
        fact: &DiagnosticFact,
        catalog: &SourceCatalog,
        render_compiler: bool,
        false_echoes: &mut Vec<EchoTriple>,
    ) {
        if !render_compiler && !is_pushed_fact(fact) {
            return;
        }
        let Some(line) = render_fact(fact, catalog) else {
            return;
        };
        if is_pushed_fact(fact) {
            remove_rendered(&mut self.userspace, &line);
        }
        if is_false_fact(fact) {
            false_echoes.push(EchoTriple::from_line(&line));
        }
        if render_compiler {
            self.compiler.push(line);
        }
    }
}

/// One hole-valued refusal identity for the echo sweep: re-resolve echoes
/// carry no fact, so the sweep reaps every remaining identity match.
struct EchoTriple {
    code: DiagnosticCode,
    location: DiagnosticLocation,
    message: String,
}

impl EchoTriple {
    /// The identity of one rendered line: code plus its own position.
    fn from_line(line: &Diagnostic) -> Self {
        Self {
            code: line.code,
            location: DiagnosticLocation {
                file: line.file.clone(),
                line: line.line,
                column: line.column,
                span: line.span,
            },
            message: line.message.clone(),
        }
    }
}

/// Exact expectations and dynamic slots were never pushed; every other
/// compiler fact re-derives a pushed legacy line to strip.
fn is_pushed_fact(fact: &DiagnosticFact) -> bool {
    !matches!(
        fact,
        DiagnosticFact::ExactLookupExpected { .. } | DiagnosticFact::DynamicSlot { .. }
    )
}

/// True when one rendered fact is a hole-valued resolve refusal.
fn is_false_fact(fact: &DiagnosticFact) -> bool {
    matches!(
        fact,
        DiagnosticFact::ResolveOutcome { outcome, .. } if is_false_refusal(outcome)
    )
}

/// Drop one rendered line's identity match from the default channel.
fn remove_rendered(userspace: &mut Vec<Diagnostic>, line: &Diagnostic) {
    let location = DiagnosticLocation {
        file: line.file.clone(),
        line: line.line,
        column: line.column,
        span: line.span,
    };
    remove_line(userspace, line.code, &location, &line.message);
}

/// Reap every remaining identity match per hole-valued refusal: re-resolve
/// echoes carry no fact, so the sweep makes removal count-free.
fn sweep_false_echoes(userspace: &mut Vec<Diagnostic>, echoes: &[EchoTriple]) {
    for echo in echoes {
        while find_line(userspace, echo.code, &echo.location, &echo.message).is_some() {
            remove_line(userspace, echo.code, &echo.location, &echo.message);
        }
    }
}

#[cfg(test)]
mod tests;
