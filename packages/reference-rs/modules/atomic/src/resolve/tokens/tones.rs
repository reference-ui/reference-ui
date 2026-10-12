//! Tones: a colour token at a named opacity, `blue.500/medium`.
//!
//! A tone is an ordinary token in category `tones` whose value names a near
//! alpha percentage (`10%`, `12.5%`), optionally routed through other tone
//! entries (`{tones.other}`). Resolving `path/name` emits the colour variable
//! mixed with the tone variable, never a literal, so a theme can retune the
//! amount. The role (surface vs line) is decided by the property receiving the
//! value, and an unknown or unusable tone never paints invalid CSS: the bare
//! caller warns and stays raw, the brace caller drops the atom.
//! Everything here is pure lookup and formatting; the callers own diagnostics.

use base_system::{BaseSystem, TokenEntry};

/// Which tone amount a property draws. `line` reads strokes and text, every
/// other property (backgrounds, fills, customs, unknowns) draws `surface`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum ToneRole {
    Surface,
    Line,
}

/// The exact properties that draw the `line` amount but do not start with
/// `border` or `outline`. Every other property defaults to `surface`.
const LINE_PROPS: &[&str] = &[
    "color",
    "caretColor",
    "columnRule",
    "columnRuleColor",
    "rowRuleColor",
    "ruleColor",
    "textDecoration",
    "textDecorationColor",
    "textEmphasis",
    "textEmphasisColor",
    "stroke",
    "strokeColor",
    "boxShadow",
    "boxShadowColor",
    "textShadow",
    "textShadowColor",
    "webkitTextFillColor",
    "webkitTextStroke",
    "webkitTextStrokeColor",
    "webkitTextDecorationColor",
    "webkitTextEmphasisColor",
    "webkitColumnRuleColor",
    "webkitBorderBeforeColor",
    "mozColumnRuleColor",
    "mozOutlineColor",
    "mozTextDecorationColor",
    "mozBorderBottomColors",
    "mozBorderEndColor",
    "mozBorderLeftColors",
    "mozBorderRightColors",
    "mozBorderStartColor",
    "mozBorderTopColors",
];

/// The tone role for one property, canonicalised before matching. `border*`
/// and `outline*` are line; the explicit list adds strokes, text, and rules;
/// everything else is surface.
pub(crate) fn role_for_prop(prop: &str) -> ToneRole {
    let canonical = canon::resolve_canonical_prop(prop);
    if canonical.starts_with("border") || canonical.starts_with("outline") {
        return ToneRole::Line;
    }
    if LINE_PROPS.contains(&canonical) {
        ToneRole::Line
    } else {
        ToneRole::Surface
    }
}

/// Split a `base/name` value into its colour base and tone name, when the name
/// is an identifier and the base is a legal colour path. A negated base, a CSS
/// colour keyword, or a non-identifier name is not a tone reference.
pub(crate) fn split_tone_reference(value: &str) -> Option<(&str, &str)> {
    let (base, name) = value.rsplit_once('/')?;
    if !is_identifier(name) || base.is_empty() || base.starts_with('-') {
        return None;
    }
    if colors_keyword(base).is_some() {
        return None;
    }
    Some((base, name))
}

/// The named tone entry for `name` and `role`: `tones.N.R`, then the flat
/// `tones.N` leaf (serves every role), then `tones.N.surface` (a surface-only
/// tone serves every role). The first hit wins.
pub(crate) fn lookup<'a>(
    system: &'a BaseSystem,
    name: &str,
    role: ToneRole,
) -> Option<&'a TokenEntry> {
    let specific = format!("tones.{name}.{}", role_key(role));
    let flat = format!("tones.{name}");
    let surface = format!("tones.{name}.surface");
    system
        .token(&specific)
        .or_else(|| system.token(&flat))
        .or_else(|| system.token(&surface))
}

/// Resolve a tone to its `color-mix` value, or None when the tone is unknown
/// or its value cannot serve as an amount. The colour entry must already be a
/// declared colours token; the caller validates the base and owns the warning.
pub(crate) fn resolve(
    system: &BaseSystem,
    prop: &str,
    color: &TokenEntry,
    name: &str,
) -> Option<String> {
    let entry = lookup(system, name, role_for_prop(prop))?;
    if !is_usable(system, entry) {
        return None;
    }
    Some(format_color_mix(
        &color_var(color),
        &color_var(entry),
    ))
}

/// The colour-mix emission every resolved tone shares: the base colour, the
/// tone variable in the amount slot, over transparent.
pub(crate) fn format_color_mix(color_var: &str, tone_var: &str) -> String {
    format!("color-mix(in srgb, {color_var} {tone_var}, transparent)")
}

/// The distinct tone names in a system: the first segment after `tones.`.
/// Used for did-you-mean ranking, so it preserves dictionary order.
pub(crate) fn tone_names(system: &BaseSystem) -> Vec<&str> {
    let mut names: Vec<&str> = Vec::new();
    for (key, entry) in system.tokens.iter() {
        if entry.category() != "tones" {
            continue;
        }
        let Some(rest) = key.strip_prefix("tones.") else {
            continue;
        };
        let name = rest.split('.').next().unwrap_or(rest);
        if !name.is_empty() && !names.contains(&name) {
            names.push(name);
        }
    }
    names
}

/// The names a suggestion for `query` may be drawn from. A query that is itself a
/// declared tone is not a misspelling (its value is what is wrong), so nothing is
/// offered: a neighbour within the gate's budget would be as wrong as its own name.
pub(crate) fn suggestion_candidates<'a>(system: &'a BaseSystem, query: &str) -> Vec<&'a str> {
    let names = tone_names(system);
    if names.iter().any(|name| *name == query) {
        return Vec::new();
    }
    names
}

/// The nearest tone name to `name`, through the shared suggestion gate.
pub(crate) fn nearest<'a>(system: &'a BaseSystem, name: &str) -> Option<&'a str> {
    let names = suggestion_candidates(system, name);
    diagnostics::message::suggest(name, &names)
}

/// A CSS colour keyword (optionally `colors.`-prefixed) never takes the tone
/// path, even when a `colors.white` token exists.
pub(crate) fn colors_keyword(path: &str) -> Option<&str> {
    let rest = path.strip_prefix("colors.").unwrap_or(path);
    if is_css_color_keyword(rest) {
        Some(rest)
    } else {
        None
    }
}

/// True when a tone entry is usable: its light value and, when present, its
/// dark value is a percentage or a whole reference to another usable tone.
fn is_usable(system: &BaseSystem, entry: &TokenEntry) -> bool {
    usable_value(system, entry.light(), 0)
        && entry
            .dark()
            .is_none_or(|dark| usable_value(system, dark, 0))
}

/// At most eight reference hops, so a cycle of tone references fails closed
/// instead of recursing forever.
const MAX_TONE_HOPS: usize = 8;

fn usable_value(system: &BaseSystem, value: &str, depth: usize) -> bool {
    if is_percentage(value) {
        return true;
    }
    if depth >= MAX_TONE_HOPS {
        return false;
    }
    let Some(path) = whole_tone_ref(value) else {
        return false;
    };
    let Some(entry) = system.token(path) else {
        return false;
    };
    entry.category() == "tones"
        && usable_value(system, entry.light(), depth + 1)
        && entry
            .dark()
            .is_none_or(|dark| usable_value(system, dark, depth + 1))
}

/// A whole `{tones.<path>}` reference, or None.
fn whole_tone_ref(value: &str) -> Option<&str> {
    let inner = value.strip_prefix('{')?.strip_suffix('}')?;
    inner.starts_with("tones.").then_some(inner)
}

/// True for `<number>%` where number is digits with at most one decimal point.
fn is_percentage(value: &str) -> bool {
    let Some(number) = value.strip_suffix('%') else {
        return false;
    };
    let mut digits = 0usize;
    let mut dots = 0usize;
    for ch in number.chars() {
        match ch {
            '0'..='9' => digits += 1,
            '.' => dots += 1,
            _ => return false,
        }
    }
    digits > 0 && dots <= 1
}

/// `[A-Za-z][A-Za-z0-9_-]*`.
fn is_identifier(name: &str) -> bool {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) if first.is_ascii_alphabetic() => {}
        _ => return false,
    }
    chars.all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-')
}

fn role_key(role: ToneRole) -> &'static str {
    match role {
        ToneRole::Surface => "surface",
        ToneRole::Line => "line",
    }
}

fn color_var(entry: &TokenEntry) -> String {
    format!("var({})", entry.css_var())
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
