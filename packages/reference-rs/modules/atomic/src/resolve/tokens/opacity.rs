//! Numeric `/N` opacity modifiers on token references, such as `/50` or `/25%`.
//! `split_opacity` peels the modifier off a path, `opacity_suffix` decides whether the
//! text after the slash is a real amount, and `format_entry` emits the token as a
//! `color-mix(in srgb, var(…) N%, transparent)`. A slash that looks like a broken modifier
//! is warned through `malformed_passthrough` and keeps its authored bytes.
//! Named tones (`/medium`) are not numeric, so `split_opacity` leaves them whole for `tones.rs`.

use std::borrow::Cow;

use base_system::TokenEntry;

use super::looks_like_token_path;
use crate::diagnostics::{DiagnosticCode, ResolveDetail, ResolveOutcome, TokenDetail};
use crate::resolve::{want_key, ResolveSession};

pub(super) fn split_opacity(path: &str) -> (&str, Option<&str>) {
    let Some((base, opacity)) = path.rsplit_once('/') else {
        return (path, None);
    };
    if opacity_suffix(opacity) {
        (base, Some(opacity))
    } else {
        (path, None)
    }
}

pub(super) fn opacity_suffix(opacity: &str) -> bool {
    let digits = opacity.strip_suffix('%').unwrap_or(opacity);
    !digits.is_empty() && digits.chars().all(|ch| ch.is_ascii_digit())
}

pub(super) fn format_entry(entry: &TokenEntry, opacity: Option<&str>) -> String {
    let var_expr = format!("var({})", entry.css_var());
    match opacity {
        Some(opacity) => format_color_mix(&var_expr, opacity),
        None => var_expr,
    }
}

fn format_color_mix(var_expr: &str, opacity: &str) -> String {
    let pct = if opacity.ends_with('%') {
        opacity.to_string()
    } else {
        format!("{opacity}%")
    };
    format!("color-mix(in srgb, {var_expr} {pct}, transparent)")
}

/// True when a `/` looks like a broken opacity modifier rather than CSS content.
pub(super) fn malformed_opacity(unbraced: &str) -> bool {
    let Some((base, _)) = unbraced.rsplit_once('/') else {
        return false;
    };
    if base.contains('(') {
        return false;
    }
    if base.is_empty() {
        return true;
    }
    base.starts_with(|ch: char| ch.is_ascii_alphabetic()) && looks_like_token_path(base)
}

/// Warn-and-paint a malformed `/opacity` modifier, keeping the authored bytes.
pub(super) fn malformed_passthrough<'a>(
    prop: &str,
    unbraced: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_, '_>,
) -> Cow<'a, str> {
    let key = want_key(
        session,
        prop,
        serde_json::Value::String(raw_val.to_string()),
    );
    session.emit(
        key,
        ResolveOutcome::Passthrough {
            code: DiagnosticCode::MalformedOpacity,
            detail: ResolveDetail::Token(TokenDetail::MalformedOpacity {
                text: unbraced.into(),
            }),
        },
    );
    Cow::Borrowed(raw_val)
}
