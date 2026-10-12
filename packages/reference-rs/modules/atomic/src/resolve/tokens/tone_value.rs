//! The tone path for one whole value: `base/name` where `base` names a declared
//! colours token and `name` is a tone identifier. A bare value that names an
//! unknown or unusable tone warns and keeps its authored bytes; the same shape
//! inside whole braces is an explicit lookup, so it errors and the caller drops
//! the declaration (TONES-02) rather than painting braces that do not parse as
//! CSS. Composite values with embedded braces take `interpolate.rs` instead.

use std::borrow::Cow;

use super::interpolate::push_unknown_tone;
use super::{is_braced, lookup_entry, tones};
use crate::diagnostics::{DiagnosticCode, ResolveDetail, ResolveOutcome, TokenDetail};
use crate::resolve::{want_key, ResolveSession};

/// How the tone path settled one value.
pub(super) enum ToneValue<'a> {
    /// Not a tone reference at all; the resolver carries on.
    NotTone,
    /// The resolved `color-mix`, or the raw bytes after an unknown-tone warning.
    Value(Cow<'a, str>),
    /// A braced unknown tone: the error is pushed and the declaration drops.
    Dropped,
}

/// Resolve `unbraced` as a tone reference over the outer property's role.
pub(super) fn resolve_tone<'a>(
    prop: &str,
    raw_val: &'a str,
    unbraced: &str,
    session: &mut ResolveSession<'_, '_>,
) -> ToneValue<'a> {
    let Some((base, name)) = tones::split_tone_reference(unbraced) else {
        return ToneValue::NotTone;
    };
    let Some(entry) = lookup_entry(prop, base, session.system) else {
        return ToneValue::NotTone;
    };
    if entry.category() != "colors" {
        return ToneValue::NotTone;
    }
    if let Some(css) = tones::resolve(session.system, prop, entry, name) {
        return ToneValue::Value(Cow::Owned(css));
    }
    if is_braced(raw_val.trim()) {
        push_unknown_tone(session, name, unbraced);
        return ToneValue::Dropped;
    }
    let key = want_key(
        session,
        prop,
        serde_json::Value::String(raw_val.to_string()),
    );
    session.emit(
        key,
        ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownTone,
            detail: ResolveDetail::Token(TokenDetail::UnknownTone {
                text: unbraced.into(),
                tone: name.into(),
            }),
        },
    );
    ToneValue::Value(Cow::Borrowed(raw_val))
}
