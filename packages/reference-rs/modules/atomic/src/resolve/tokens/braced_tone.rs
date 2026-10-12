//! Whole braced tone values: a declaration whose entire value is `{base/name}`.
//! The shorthand decomposition hands `borderColor` its braced longhand whole, so
//! the bare tone path would warn and paint raw braces that do not parse as CSS.
//! An unknown tone inside explicit braces is refused instead, through the shared
//! tone error, and the caller drops the declaration (TONES-02). Known tones and
//! every other shape return false and keep the resolver's existing path.

use super::interpolate::push_unknown_tone;
use super::{is_braced, lookup_entry, strip_braces, tones};
use crate::resolve::ResolveSession;

/// Refuse an unknown colour tone that is the whole of a braced value. The error
/// is pushed here; true means refused, and the caller returns None to drop the
/// declaration. Known tones, bare values, non-colour bases, and every non-tone
/// shape return false so the resolver handles them exactly as before.
pub(super) fn refuse_unknown_braced_tone(
    prop: &str,
    raw_val: &str,
    session: &mut ResolveSession<'_, '_>,
) -> bool {
    let trimmed = raw_val.trim();
    if !is_braced(trimmed) {
        return false;
    }
    let inner = strip_braces(trimmed).trim();
    let Some((base, name)) = tones::split_tone_reference(inner) else {
        return false;
    };
    let Some(entry) = lookup_entry(prop, base, session.system) else {
        return false;
    };
    if entry.category() != "colors" {
        return false;
    }
    if tones::resolve(session.system, prop, entry, name).is_some() {
        return false;
    }
    push_unknown_tone(session, name, inner);
    true
}
