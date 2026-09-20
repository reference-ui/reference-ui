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
mod scale;
#[cfg(test)]
mod tests;

use interpolate::{expand_brace_segments, BraceExpansion};

/// Returns true if the property semantically accepts color values and tokens.
pub fn is_color_prop(prop: &str) -> bool {
    canon::is_color_prop(prop)
}

/// Resolves a raw token value to its CSS custom property representation.
/// None drops the atom: the `{path}` named no token and the error is pushed.
pub fn resolve_token_value<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_>,
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
        if let Some(keyword) = colors_keyword(unbraced) {
            return Some(Cow::Owned(keyword.to_string()));
        }
    }
    None
}

/// Opacity-split dictionary lookup, then brace interpolation or fallback.
fn resolve_pathed_value<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_>,
) -> Option<Cow<'a, str>> {
    let unbraced = strip_braces(raw_val.trim());
    let (path, opacity) = split_opacity(unbraced);
    if path.is_empty() || (opacity.is_none() && malformed_opacity(unbraced)) {
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
        return Some(Cow::Borrowed(raw_val));
    }
    if let Some(entry) = lookup_entry(prop, path, session.system) {
        return Some(Cow::Owned(format_entry(entry, opacity)));
    }
    interpolate_or_fallback(prop, raw_val, session)
}

/// Brace interpolation for values the dictionary missed, else error or warn.
fn interpolate_or_fallback<'a>(
    prop: &str,
    raw_val: &'a str,
    session: &mut ResolveSession<'_>,
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
    session: &mut ResolveSession<'_>,
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
fn warn_unresolved_token(prop: &str, unbraced: &str, session: &mut ResolveSession<'_>) {
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
fn warn_unknown_color(prop: &str, unbraced: &str, session: &mut ResolveSession<'_>) {
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

fn colors_keyword(path: &str) -> Option<&str> {
    let rest = path.strip_prefix("colors.").unwrap_or(path);
    if is_css_color_keyword(rest) {
        Some(rest)
    } else {
        None
    }
}

fn is_css_color_keyword(val: &str) -> bool {
    matches!(
        val.to_ascii_lowercase().as_str(),
        "transparent"
            | "currentcolor"
            | "inherit"
            | "initial"
            | "unset"
            | "none"
            | "black"
            | "white"
    )
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

/// A leading `-` negates a scale token: `-4` becomes `calc(-1 * var(--spacing-4))`.
/// The negation distributes over an explicit braced lookup too: `-{spacing.4}`
/// calc-wraps the expansion, with optional opacity in either brace position.
fn resolve_negated_token(prop: &str, unbraced: &str, system: &BaseSystem) -> Option<String> {
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

/// True when a `/` looks like a broken opacity modifier rather than CSS content.
fn malformed_opacity(unbraced: &str) -> bool {
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

fn token_category_for_prop(prop: &str) -> Option<&'static str> {
    if is_color_prop(prop) {
        return Some("colors");
    }
    scale::token_category_for_prop(prop)
}

fn split_opacity(path: &str) -> (&str, Option<&str>) {
    let Some((base, opacity)) = path.rsplit_once('/') else {
        return (path, None);
    };
    if opacity_suffix(opacity) {
        (base, Some(opacity))
    } else {
        (path, None)
    }
}

fn opacity_suffix(opacity: &str) -> bool {
    let digits = opacity.strip_suffix('%').unwrap_or(opacity);
    !digits.is_empty() && digits.chars().all(|ch| ch.is_ascii_digit())
}

fn format_entry(entry: &TokenEntry, opacity: Option<&str>) -> String {
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

fn looks_like_token_path(val: &str) -> bool {
    if val.is_empty() || val.starts_with('#') || val.contains(' ') || !val.contains('.') {
        return false;
    }
    let first = val.split('.').next().unwrap_or("");
    first.chars().any(|ch| ch.is_ascii_alphabetic())
}
