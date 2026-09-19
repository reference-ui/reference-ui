//! Harvest twin suppression: the canonical identity of a want.
//!
//! Two wants sharing one canonical identity would take one class name for
//! two atoms (GHOST-04), so the mint driver seeds a seen-set from the
//! site walk's wants and skips every pair — exact dupe or alias twin
//! (`mt` vs `marginTop`) — that is already taken. Infos count net-new
//! pairs only.

use smallvec::SmallVec;

use crate::atom::{AtomValue, Want};

/// Canonical identity of a want for alias-twin suppression: the canonical
/// prop (aliases collapse), the authored text, the scope, and importance.
/// Two wants sharing it would take one class name for two atoms (GHOST-04).
pub(crate) type TwinKey = (Box<str>, Box<str>, SmallVec<[Box<str>; 2]>, bool);

/// The twin key a want occupies: canonical prop, authored text, scope,
/// importance. A `Token` keys by path (classes derive from the path, never
/// the resolved value), so a harvested fallback hex never twins its token.
pub(crate) fn twin_key_for(want: &Want) -> TwinKey {
    (
        canon::resolve_canonical_prop(&want.prop).into(),
        twin_text(&want.value).into(),
        want.when.clone(),
        want.important,
    )
}

/// The authored text a value carries for twin comparison.
fn twin_text(value: &AtomValue) -> &str {
    match value {
        AtomValue::String(text) | AtomValue::Number(text) => text,
        AtomValue::Token { path, .. } => path,
        AtomValue::Bool(flag) => twin_bool_text(*flag),
        AtomValue::Null => "null",
    }
}

/// `"true"` or `"false"` for a bool want value.
fn twin_bool_text(flag: bool) -> &'static str {
    if flag {
        "true"
    } else {
        "false"
    }
}
