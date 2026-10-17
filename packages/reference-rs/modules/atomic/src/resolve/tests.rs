//! Lowering proofs for the resolve pipeline, split by topic: plain want lowering and macros,
//! font scales, refusals and unknown names, and authored keys. This root keeps the shared
//! `resolve_with` fixture helper that the child modules call. Compiled only under `cfg(test)`,
//! beside `mod.rs`, so that file stays under the line budget.

use super::*;

mod authored;
mod fonts;
mod lowering;
mod refusals;

fn resolve_with(want: &Want, system: &BaseSystem) -> Vec<Atom> {
    let mut diagnostics = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    resolve_want_with(want, &mut session)
}
