//! Global CSS emission and reset layer rendering for atomic stylesheets.
//! Lowers structured GlobalStyleNode AST fragments, formatting rules into @layer reset
//! and @layer global blocks. Only the normalizeCss reset fragment, matched by its exact
//! source, prints in @layer reset; every other fragment prints in @layer global, even a
//! user file whose path mentions reset or preset. Also handles font-face definitions
//! and keyframe step generation.

pub mod value;
pub mod walker;

use base_system::BaseSystem;
use walker::{format_global_rules, GlobalWalker};

/// Source tag of the normalizeCss reset fragment. It mirrors `RESET_FRAGMENT_SOURCE` in
/// `packages/reference-neo/src/sync/reset.ts`; keep the two in step, since a mismatch
/// moves the real reset out of `@layer reset`.
pub const RESET_FRAGMENT_SOURCE: &str = "normalizeCss/reset";

/// Returns true if the system has the normalizeCss reset fragment with rules to print.
pub fn has_printable_reset(system: &BaseSystem) -> bool {
    system
        .global_css
        .iter()
        .any(|f| is_reset_fragment(&f.source) && !f.rules.is_empty())
}

/// Append `@layer reset { ... }` when the system carries the normalizeCss reset fragment.
pub fn append_reset_css(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if !has_printable_reset(system) {
        return;
    }
    let mut walker = GlobalWalker::new(system, diagnostics);
    for fragment in &system.global_css {
        if is_reset_fragment(&fragment.source) {
            walker.walk_rules(&fragment.source, &fragment.rules);
        }
    }
    if walker.rules.is_empty() {
        return;
    }
    out.push_str("@layer reset {\n");
    format_global_rules(&walker.rules, out);
    out.push_str("}\n");
}

/// Append global CSS fragment rules into `@layer global`.
pub fn append_global_fragment_rules(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    let mut walker = GlobalWalker::new(system, diagnostics);
    for fragment in &system.global_css {
        if !is_reset_fragment(&fragment.source) {
            walker.walk_rules(&fragment.source, &fragment.rules);
        }
    }
    format_global_rules(&walker.rules, out);
}

/// Returns true only for the normalizeCss reset source. The match is exact, so a user file
/// whose path merely mentions reset or preset stays in `@layer global`.
pub fn is_reset_fragment(source: &str) -> bool {
    source == RESET_FRAGMENT_SOURCE
}

/// Returns true if the system has non-reset global rules to print.
pub fn has_printable_global_rules(system: &BaseSystem) -> bool {
    system
        .global_css
        .iter()
        .any(|f| !is_reset_fragment(&f.source) && !f.rules.is_empty())
}
