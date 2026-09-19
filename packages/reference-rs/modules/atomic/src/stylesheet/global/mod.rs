//! Global CSS emission and reset layer rendering for atomic stylesheets.
//! Lowers structured GlobalStyleNode AST fragments, formatting rules into @layer reset
//! and @layer global blocks. Handles preflight separation, font-face definitions,
//! and keyframe step generation.

pub mod value;
pub mod walker;

use base_system::BaseSystem;
use walker::{format_global_rules, GlobalWalker};

/// Returns true if the system has reset fragments or rules to print.
pub fn has_printable_reset(system: &BaseSystem) -> bool {
    system
        .global_css
        .iter()
        .any(|f| is_reset_fragment(&f.source) && !f.rules.is_empty())
}

/// Append `@layer reset { ... }` when the system defines reset or preflight fragments.
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

/// Returns true if a fragment's source indicates it is part of the reset/preflight layer.
pub fn is_reset_fragment(source: &str) -> bool {
    let lower = source.to_ascii_lowercase();
    lower.contains("reset") || lower.contains("preflight")
}

/// Returns true if the system has non-reset global rules to print.
pub fn has_printable_global_rules(system: &BaseSystem) -> bool {
    system
        .global_css
        .iter()
        .any(|f| !is_reset_fragment(&f.source) && !f.rules.is_empty())
}
