//! Prints `@layer reset`, `@layer global`, and `@layer tokens` from an ingested `BaseSystem`.
//! Global is the stored CSS dump (fixture `:root --spacing-root`) plus `@keyframes`
//! rules from the system's motion table and `@font-face` blocks from the font table.
//! Tokens become custom properties on `:root, [data-color-mode=light]` and `[data-color-mode=dark]`.
//! Empty layers and empty keyframe tables are omitted; recipes and utilities stay separate.
//! Keyframe bodies resolve aliases, units, `{token}` refs, and `r` units through
//! the utility passes; unresolvable values print verbatim, mirroring tokens.
//! Token values resolve `{refs}` — whole-value or embedded in a composite — through
//! the shared brace pass, and `r` rhythm through the shared rhythm chain like
//! keyframes; unknown refs print verbatim with an error diagnostic, and the
//! rhythm root itself refuses rhythm values with a diagnostic.

use base_system::{BaseSystem, KeyframeDefinition, StyleMap, TokenEntry};

use crate::atom::AtomValue;
use crate::diagnostics::{DiagnosticCode, DiagnosticLocation};
use crate::resolve::rhythm::resolve_rhythm;
use crate::resolve::tokens::{expand_brace_segments, resolve_token_value, BraceExpansion};
use crate::resolve::unit::css_value_from_authored;
use crate::resolve::ResolveSession;

use super::global;

#[cfg(test)]
mod tests;

const DARK_SELECTOR: &str = "[data-color-mode=dark]";

/// Append globalCss and token custom-property layers when the dump has them.
pub fn append_system_layers(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    global::append_reset_css(out, system, diagnostics);
    append_global(out, system, diagnostics);
    append_tokens(out, system, false, diagnostics);
}

/// Append globalCss and portable [data-layer] token custom-property layers.
pub fn append_portable_system_layers(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    global::append_reset_css(out, system, diagnostics);
    append_global(out, system, diagnostics);
    append_tokens(out, system, true, diagnostics);
}

/// Append `@layer global {…}` when fragments, fonts, or keyframes print.
pub fn append_global(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if !has_printable_global(system) {
        return;
    }
    out.push_str("@layer global {\n");
    global::append_global_fragment_rules(out, system, diagnostics);
    append_font_faces(out, system);
    append_keyframes(out, system);
    out.push_str("}\n");
}

fn has_printable_global(system: &BaseSystem) -> bool {
    global::has_printable_global_rules(system)
        || has_printable_keyframes(system)
        || has_printable_fonts(system)
}

fn has_printable_fonts(system: &BaseSystem) -> bool {
    system.fonts().iter().any(|(_, def)| {
        def.font_face
            .as_ref()
            .is_some_and(|faces| !faces.is_empty())
    })
}

fn has_printable_keyframes(system: &BaseSystem) -> bool {
    system
        .keyframes
        .values()
        .any(KeyframeDefinition::has_declarations)
}

fn append_font_faces(out: &mut String, system: &BaseSystem) {
    for (_, def) in system.fonts().iter() {
        let Some(faces) = def.font_face.as_deref() else {
            continue;
        };
        let family = parse_font_family_name(&def.value);
        for face in faces {
            write_one_font_face(out, family, face);
        }
    }
}

fn write_one_font_face(out: &mut String, family: &str, face: &base_system::FontFaceDefinition) {
    out.push_str("  @font-face {\n");
    out.push_str("    font-family: ");
    out.push_str(&format_font_family_name(family));
    out.push_str(";\n");
    out.push_str("    src: ");
    out.push_str(&face.src);
    out.push_str(";\n");
    let display = face.font_display.as_deref().unwrap_or("swap");
    out.push_str("    font-display: ");
    out.push_str(display);
    out.push_str(";\n");
    if let Some(weight) = &face.font_weight {
        out.push_str("    font-weight: ");
        out.push_str(weight);
        out.push_str(";\n");
    }
    if let Some(style) = &face.font_style {
        out.push_str("    font-style: ");
        out.push_str(style);
        out.push_str(";\n");
    }
    if let Some(size_adjust) = &face.size_adjust {
        out.push_str("    size-adjust: ");
        out.push_str(size_adjust);
        out.push_str(";\n");
    }
    if let Some(descent) = &face.descent_override {
        out.push_str("    descent-override: ");
        out.push_str(descent);
        out.push_str(";\n");
    }
    out.push_str("  }\n");
}

fn parse_font_family_name(value: &str) -> &str {
    let first = value.split(',').next().unwrap_or(value).trim();
    first.trim_matches(|c| c == '\'' || c == '"')
}

fn format_font_family_name(name: &str) -> String {
    if name.contains(' ') && !name.starts_with('"') && !name.starts_with('\'') {
        format!("\"{name}\"")
    } else {
        name.to_string()
    }
}

fn append_keyframes(out: &mut String, system: &BaseSystem) {
    for (name, def) in system.list_keyframes() {
        append_one_keyframe(out, name, def, system);
    }
}

fn append_one_keyframe(
    out: &mut String,
    name: &str,
    def: &KeyframeDefinition,
    system: &BaseSystem,
) {
    if !def.has_declarations() {
        return;
    }
    out.push_str("  @keyframes ");
    out.push_str(name);
    out.push_str(" {\n");
    for (selector, decls) in def.steps() {
        write_keyframe_step(out, selector, decls, system);
    }
    out.push_str("  }\n");
}

fn write_keyframe_step(out: &mut String, selector: &str, decls: &StyleMap, system: &BaseSystem) {
    if decls.is_empty() {
        return;
    }
    out.push_str("    ");
    out.push_str(selector);
    out.push_str(" { ");
    write_declarations(out, decls, system);
    out.push_str(" }\n");
}

fn write_declarations(out: &mut String, decls: &StyleMap, system: &BaseSystem) {
    for (i, (prop, value)) in decls.iter().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        push_css_property(out, prop);
        out.push_str(": ");
        out.push_str(&resolve_keyframe_value(prop, value, system));
        out.push(';');
    }
}

/// Resolve one keyframe value through the `css()` unit + rhythm + token chain.
/// Props alias through canon first, so `h: '4'` lowers to `height: 4px` like
/// the utility path (Panda prints `height: var(--sizes-4)` when the token
/// exists). Keyframes are spec-owned with no source location, so resolution
/// runs on a discarded sink: successes print resolved, misses keep verbatim.
fn resolve_keyframe_value(prop: &str, value: &str, system: &BaseSystem) -> String {
    let mut sink = Vec::new();
    let mut session = ResolveSession {
        system,
        diagnostics: &mut sink,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    let Some(css) = css_value_from_authored(prop, AtomValue::String(value.into()), &mut session)
    else {
        return value.to_string();
    };
    let stem = css.class_name_str().to_string();
    let rhythm = resolve_rhythm(&stem);
    match resolve_token_value(prop, &rhythm, &mut session) {
        Some(resolved) if resolved.as_ref() != stem => resolved.into_owned(),
        _ => css.css_value_str().to_string(),
    }
}

fn push_css_property(out: &mut String, prop: &str) {
    out.push_str(canon::to_css_declaration_property(prop));
}

/// Append `@layer tokens {…}`; portable selects `[data-layer]` over `:root`.
/// Rhythm-root cycles diagnose into `diagnostics` and omit the declaration.
pub fn append_tokens(
    out: &mut String,
    system: &BaseSystem,
    portable: bool,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    if system.tokens.is_empty() {
        return;
    }
    out.push_str("@layer tokens {\n");
    let (light_sel, dark_sel) = if portable && !system.name.is_empty() {
        (
            format!(
                "[data-layer=\"{}\"], [data-layer=\"{}\"][data-color-mode=light]",
                system.name, system.name
            ),
            format!("[data-layer=\"{}\"][data-color-mode=dark]", system.name),
        )
    } else {
        (
            ":root, [data-color-mode=light]".to_string(),
            DARK_SELECTOR.to_string(),
        )
    };
    write_token_block(out, &light_sel, system, TokenMode::Light, diagnostics);
    if has_dark_overrides(system) {
        write_token_block(out, &dark_sel, system, TokenMode::Dark, diagnostics);
    }
    out.push_str("}\n");
}

#[derive(Clone, Copy)]
enum TokenMode {
    Light,
    Dark,
}

fn has_dark_overrides(system: &BaseSystem) -> bool {
    system
        .tokens
        .iter()
        .any(|(_, entry)| entry.dark().is_some())
}

/// The custom property the `r` unit lowers against. A token owning this slot
/// must never carry a rhythm value: resolving it would reference itself.
const SPACING_ROOT_VAR: &str = "--spacing-root";

fn write_token_block(
    out: &mut String,
    selector: &str,
    system: &BaseSystem,
    mode: TokenMode,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    out.push_str("  ");
    out.push_str(selector);
    out.push_str(" {\n");
    for (_, entry) in system.tokens.iter() {
        write_token_entry(out, entry, system, mode, diagnostics);
    }
    out.push_str("  }\n");
}

fn write_token_entry(
    out: &mut String,
    entry: &TokenEntry,
    system: &BaseSystem,
    mode: TokenMode,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    let raw = match mode {
        TokenMode::Light => entry.light(),
        TokenMode::Dark => match entry.dark() {
            Some(dark) => dark,
            None => return,
        },
    };
    let Some(value) = css_token_value(raw, system, entry.css_var(), diagnostics) else {
        return;
    };
    out.push_str("    ");
    out.push_str(entry.css_var());
    out.push_str(": ");
    out.push_str(&value);
    out.push_str(";\n");
}

/// Lower one token value: `{brace}` refs expand through the shared brace pass,
/// `r` values through the shared rhythm chain; genuine CSS prints verbatim.
/// Unknown refs print verbatim with an error. `None` — with an error — only
/// when the rhythm root itself carries a rhythm value (self-reference).
fn css_token_value(
    raw: &str,
    system: &BaseSystem,
    owner_var: &str,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> Option<String> {
    let trimmed = raw.trim();
    let braced = expand_token_refs(trimmed, owner_var, system, diagnostics);
    let resolved = resolve_rhythm(&braced);
    if resolved.as_ref() == braced {
        return Some(braced);
    }
    if owner_var == SPACING_ROOT_VAR {
        diagnostics.push(DiagnosticLocation::default().error(
            DiagnosticCode::RhythmRootCycle,
            format!(
                "token `{owner_var}` defines the rhythm root in rhythm units (`{trimmed}`); self-reference refused, declaration omitted"
            ),
        ));
        return None;
    }
    Some(resolved.into_owned())
}

/// Expand `{path}` refs through the shared brace pass. Unknown refs keep the
/// value verbatim with the pass's error already pushed; unterminated braces
/// stay raw with a warning. Detached session like keyframes, but kept.
fn expand_token_refs(
    trimmed: &str,
    owner_var: &str,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) -> String {
    let mut session = ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink: None,
        want: None,
    };
    match expand_brace_segments(trimmed, owner_var, &mut session) {
        BraceExpansion::Expanded(expanded) => expanded,
        BraceExpansion::Absent | BraceExpansion::Missing => trimmed.to_string(),
    }
}
