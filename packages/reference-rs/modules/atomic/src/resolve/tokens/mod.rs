//! Design token resolution against a `BaseSystem` dictionary.
//! Turns author paths (`colors.blue.600`, `gray.800`, `{radii.md}`) into `var(--…)`
//! when the utterance declares them. Opacity `/50` becomes `color-mix` here, not in
//! base-system. Unknown dotted paths pass through as raw CSS and emit a warning.
//! Explicit `{path}` references that name no token are errors with source locations.
//! Heuristic category lists are gone; lookup is the fixture.
//! Warn-and-paint refusals report typed token facts through the session.

use std::borrow::Cow;

use base_system::{BaseSystem, TokenEntry};

use crate::diagnostics::{DiagnosticCode, ResolveDetail, ResolveOutcome, TokenDetail};
use crate::resolve::{want_key, ResolveSession};

mod interpolate;
mod negation;
mod opacity;
mod scale;
mod tone_value;
pub(crate) mod tones;
#[cfg(test)]
mod braced_base_tests;
#[cfg(test)]
mod braced_tone_tests;
#[cfg(test)]
mod tests;
#[cfg(test)]
mod tones_resolve_tests;
#[cfg(test)]
mod tones_tests;

pub(crate) use interpolate::{expand_brace_segments, BraceExpansion};
use negation::resolve_negated_token;
use opacity::{format_entry, malformed_opacity, malformed_passthrough, split_opacity};
use tone_value::ToneValue;

/// Returns true if the property semantically accepts color values and tokens.
pub fn is_color_prop(prop: &str) -> bool {
    canon::is_color_prop(prop)
}

/// Resolves a raw token value to its CSS custom property representation.
/// None drops the atom: the `{path}` named no token and the error is pushed.
pub fn resolve_token_value<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_, '_>,
) -> Option<Cow<'a, str>> {
    let trimmed = raw_val.trim();
    if trimmed.is_empty() || trimmed.starts_with("var(") {
        return Some(Cow::Borrowed(raw_val));
    }
    if is_whole_css_value(trimmed) {
        return Some(Cow::Borrowed(raw_val));
    }

    let unbraced = strip_braces(trimmed);
    if let Some(special) = resolve_special_value(prop, unbraced, session.system) {
        return Some(special);
    }
    if let Some(negated) = resolve_negated_token(prop, unbraced, session.system) {
        return Some(Cow::Owned(negated));
    }
    resolve_pathed_value(prop, raw_val, session)
}

/// Font families and CSS color keywords resolve before dictionary lookup.
fn resolve_special_value<'a>(
    prop: &str,
    unbraced: &str,
    system: &BaseSystem,
) -> Option<Cow<'a, str>> {
    if let Some(font_var) = resolve_font_token(prop, unbraced, system) {
        return Some(Cow::Owned(font_var));
    }
    if is_color_prop(prop) {
        if let Some(keyword) = tones::colors_keyword(unbraced) {
            return Some(Cow::Owned(keyword.to_string()));
        }
    }
    None
}

/// Opacity-split dictionary lookup, then a tone, then interpolation or fallback.
/// Gate order: an empty path malformed-passes through, the numeric `/opacity`
/// split lookup runs split-first (its historic order), then the whole-value key
/// resolves, then a named tone (`base/name` over a declared colour), then
/// today's malformed-opacity warning and its lookup/interpolation fallthrough.
/// Numeric keeps its historic split-first order; tones are new, so a literal
/// whole key still wins over a tone rather than the other way round.
fn resolve_pathed_value<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_, '_>,
) -> Option<Cow<'a, str>> {
    let unbraced = strip_braces(raw_val.trim());
    let (path, opacity) = split_opacity(unbraced);
    if path.is_empty() {
        return Some(malformed_passthrough(prop, unbraced, raw_val, session));
    }
    if let Some(opacity) = opacity {
        if let Some(entry) = lookup_entry(prop, path, session.system) {
            return Some(Cow::Owned(format_entry(entry, Some(opacity))));
        }
    }
    if let Some(entry) = lookup_entry(prop, unbraced, session.system) {
        return Some(Cow::Owned(format_entry(entry, None)));
    }
    if opacity.is_some() {
        return interpolate_or_fallback(prop, raw_val, session);
    }
    resolve_unsuffixed(prop, raw_val, unbraced, session)
}

/// A value with no numeric modifier that names no whole token: a named tone,
/// then the malformed-opacity warning, then interpolation or fallback.
fn resolve_unsuffixed<'a>(
    prop: &str,
    raw_val: &'a str,
    unbraced: &str,
    session: &mut ResolveSession<'_, '_>,
) -> Option<Cow<'a, str>> {
    match tone_value::resolve_tone(prop, raw_val, unbraced, session) {
        ToneValue::NotTone => {}
        ToneValue::Value(resolved) => return Some(resolved),
        ToneValue::Dropped => return None,
    }
    if malformed_opacity(unbraced) {
        return Some(malformed_passthrough(prop, unbraced, raw_val, session));
    }
    interpolate_or_fallback(prop, raw_val, session)
}

/// Brace interpolation for values the dictionary missed, else error or warn.
fn interpolate_or_fallback<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_, '_>,
) -> Option<Cow<'a, str>> {
    let unbraced = strip_braces(raw_val.trim());
    match expand_brace_segments(unbraced, prop, session) {
        BraceExpansion::Expanded(expanded) => Some(Cow::Owned(expanded)),
        BraceExpansion::Missing => None,
        BraceExpansion::Absent => unbraced_fallback(prop, raw_val, session),
    }
}

/// A brace-wrapped miss errors and drops the atom; anything else warns through.
fn unbraced_fallback<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_, '_>,
) -> Option<Cow<'a, str>> {
    let trimmed = raw_val.trim();
    let unbraced = strip_braces(trimmed);
    if is_braced(trimmed) && !unbraced.trim().is_empty() {
        let diagnostic = session.location.error(
            DiagnosticCode::UnknownTokenReference,
            format!("unknown token reference `{{{unbraced}}}`"),
        );
        session.diagnostics.push(diagnostic);
        return None;
    }
    warn_unresolved_token(prop, unbraced, session);
    Some(Cow::Borrowed(raw_val))
}

/// True for a complete CSS or rhythm value, which never consults the dictionary.
/// Braced `{path}` references are explicit token lookups and never fence.
fn is_whole_css_value(trimmed: &str) -> bool {
    !is_braced(trimmed)
        && (canon::classify_css_value(trimmed).is_some()
            || crate::resolve::rhythm::resolve_single_rhythm(trimmed).is_some())
}

/// Warn for an unresolvable value: a dotted path that names no token, or a
/// bare value on a color prop that is neither a token nor CSS. Bare values
/// elsewhere pass through silently; cross-category unique-name stories are
/// retired, since the author typed a scale the theme does not have.
fn warn_unresolved_token(prop: &str, unbraced: &str, session: &mut ResolveSession<'_, '_>) {
    if looks_like_token_path(unbraced) {
        let key = want_key(
            session,
            prop,
            serde_json::Value::String(unbraced.to_string()),
        );
        session.emit(
            key,
            ResolveOutcome::Passthrough {
                code: DiagnosticCode::UnknownTokenPath,
                detail: ResolveDetail::Token(TokenDetail::UnknownTokenPath {
                    path: unbraced.into(),
                }),
            },
        );
        return;
    }
    warn_unknown_color(prop, unbraced, session);
}

/// Warn when a bare value on a color prop is neither a token nor CSS color.
/// The color grammar is closed, so this is the one true bare-value diagnostic.
fn warn_unknown_color(prop: &str, unbraced: &str, session: &mut ResolveSession<'_, '_>) {
    if !is_color_prop(prop) {
        return;
    }
    let (path, _) = split_opacity(unbraced);
    if path.is_empty() || canon::classify_css_value(path).is_some() {
        return;
    }
    let key = want_key(
        session,
        prop,
        serde_json::Value::String(unbraced.to_string()),
    );
    session.emit(
        key,
        ResolveOutcome::Passthrough {
            code: DiagnosticCode::UnknownColor,
            detail: ResolveDetail::Token(TokenDetail::UnknownColor {
                text: unbraced.into(),
            }),
        },
    );
}

fn is_braced(trimmed: &str) -> bool {
    trimmed.starts_with('{') && trimmed.ends_with('}') && trimmed.len() >= 2
}

fn strip_braces(trimmed: &str) -> &str {
    if is_braced(trimmed) {
        &trimmed[1..trimmed.len() - 1]
    } else {
        trimmed
    }
}

fn resolve_font_token(prop: &str, trimmed: &str, system: &BaseSystem) -> Option<String> {
    if (prop == "fontFamily" || prop == "ff") && system.fonts().has_family(trimmed) {
        Some(format!("var(--fonts-{trimmed})"))
    } else {
        None
    }
}

fn lookup_entry<'a>(prop: &str, path: &str, system: &'a BaseSystem) -> Option<&'a TokenEntry> {
    if let Some(entry) = system.token(path) {
        return Some(entry);
    }
    if prop.starts_with("--") {
        return system.token_by_unique_name(path);
    }
    let category = token_category_for_prop(prop)?;
    if let Some(entry) = system.token_in_category(category, path) {
        return Some(entry);
    }
    let fallback = fallback_category(category)?;
    system.token_in_category(fallback, path)
}

/// Size properties accept the spacing scale when sizes miss, mirroring
/// `static_css` wildcard expansion so synthesized wants resolve.
fn fallback_category(category: &str) -> Option<&str> {
    match category {
        "sizes" => Some("spacing"),
        _ => None,
    }
}

fn token_category_for_prop(prop: &str) -> Option<&'static str> {
    if is_color_prop(prop) {
        return Some("colors");
    }
    scale::token_category_for_prop(prop)
}

fn looks_like_token_path(val: &str) -> bool {
    if val.is_empty() || val.starts_with('#') || val.contains(' ') || !val.contains('.') {
        return false;
    }
    let first = val.split('.').next().unwrap_or("");
    first.chars().any(|ch| ch.is_ascii_alphabetic())
}
