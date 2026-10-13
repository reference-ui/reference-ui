//! Leading-minus negation of token references: `-4` becomes `calc(-1 * var(--spacing-4))`.
//! A braced `-{path}` calc-wraps the explicit lookup, with an optional `/opacity` in either
//! brace position. Composites, second brace pairs and unknown paths return `None`, so the
//! value falls through to interpolation or to the missing-reference error. Lookup goes
//! through the parent's `lookup_entry`, so a negated value follows the same category rules.

use base_system::BaseSystem;

use super::lookup_entry;
use super::opacity::{format_entry, opacity_suffix, split_opacity};

/// A leading `-` negates a scale token: `-4` becomes `calc(-1 * var(--spacing-4))`.
/// The negation distributes over an explicit braced lookup too: `-{spacing.4}`
/// calc-wraps the expansion, with optional opacity in either brace position.
pub(super) fn resolve_negated_token(
    prop: &str,
    unbraced: &str,
    system: &BaseSystem,
) -> Option<String> {
    let rest = unbraced.strip_prefix('-')?;
    if rest.is_empty() || rest.starts_with('-') {
        return None;
    }
    if let Some(after_open) = rest.strip_prefix('{') {
        return resolve_negated_braced(prop, after_open, system);
    }
    let (path, opacity) = split_opacity(rest);
    let entry = lookup_entry(prop, path, system)?;
    Some(format!("calc(-1 * {})", format_entry(entry, opacity)))
}

/// Calc-wrap a negated braced ref: `-{path}` becomes `calc(-1 * var(--…))`.
/// Only exactly one braced ref plus optional opacity in either position
/// qualifies; composites, second brace pairs, and unknown paths return
/// None so the value keeps its current fallthrough (interpolation, or the
/// Missing error that fails closed like `ATM-TOKEN-12`).
fn resolve_negated_braced(prop: &str, after_open: &str, system: &BaseSystem) -> Option<String> {
    let close = after_open.find('}')?;
    let inner = after_open[..close].trim();
    if inner.is_empty() || inner.contains(['{', '}']) {
        return None;
    }
    let outer = negated_brace_tail(&after_open[close + 1..])?;
    let (path, inner_opacity) = split_opacity(inner);
    if path.is_empty() || (inner_opacity.is_some() && outer.is_some()) {
        return None;
    }
    let entry = lookup_entry(prop, path, system)?;
    let opacity = inner_opacity.or(outer);
    Some(format!("calc(-1 * {})", format_entry(entry, opacity)))
}

/// Parse the tail after a negated `-{path}`: empty or exactly `/opacity`.
/// None rejects second brace pairs, trailing literals, and bad opacity.
fn negated_brace_tail(tail: &str) -> Option<Option<&str>> {
    if tail.is_empty() {
        return Some(None);
    }
    let opacity = tail.strip_prefix('/')?;
    if !opacity_suffix(opacity) {
        return None;
    }
    Some(Some(opacity))
}
