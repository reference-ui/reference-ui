//! Prints `@layer reset`, `@layer global`, and `@layer tokens` from an ingested `BaseSystem`.
//! Global is the stored CSS dump (fixture `:root --spacing-root`) plus `@keyframes`
//! rules from the system's motion table and `@font-face` blocks from the font table.
//! Tokens become custom properties on `:root, [data-color-mode=light]` and `[data-color-mode=dark]`.
//! Empty layers and empty keyframe tables are omitted; recipes and utilities stay separate.
//! Keyframe bodies resolve aliases, units, `{token}` refs, and `r` units through
//! the utility passes; unresolvable values print verbatim, mirroring tokens.

use base_system::{BaseSystem, KeyframeDefinition, StyleMap, TokenEntry};

use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticLocation;
use crate::resolve::rhythm::resolve_rhythm;
use crate::resolve::tokens::resolve_token_value;
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
    append_tokens(out, system, false);
}

/// Append globalCss and portable [data-layer] token custom-property layers.
pub fn append_portable_system_layers(
    out: &mut String,
    system: &BaseSystem,
    diagnostics: &mut Vec<crate::diagnostics::Diagnostic>,
) {
    global::append_reset_css(out, system, diagnostics);
    append_global(out, system, diagnostics);
    append_tokens(out, system, true);
}

fn append_global(
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
    system
        .fonts()
        .iter()
        .any(|(_, def)| def.font_face.as_ref().is_some_and(|faces| !faces.is_empty()))
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

fn write_one_font_face(
    out: &mut String,
    family: &str,
    face: &base_system::FontFaceDefinition,
) {
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
    let Some(css) = css_value_from_authored(prop, AtomValue::String(value.into()), &mut sink)
    else {
        return value.to_string();
    };
    let stem = css.class_name_str().to_string();
    let rhythm = resolve_rhythm(&stem);
    let mut session = ResolveSession {
        system,
        diagnostics: &mut sink,
        location: DiagnosticLocation::default(),
    };
    match resolve_token_value(prop, &rhythm, &mut session) {
        Some(resolved) if resolved.as_ref() != stem => resolved.into_owned(),
        _ => css.css_value_str().to_string(),
    }
}

fn push_css_property(out: &mut String, prop: &str) {
    out.push_str(canon::to_css_declaration_property(prop));
}

fn append_tokens(out: &mut String, system: &BaseSystem, portable: bool) {
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
    write_token_block(out, &light_sel, system, TokenMode::Light);
    if has_dark_overrides(system) {
        write_token_block(out, &dark_sel, system, TokenMode::Dark);
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

fn write_token_block(out: &mut String, selector: &str, system: &BaseSystem, mode: TokenMode) {
    out.push_str("  ");
    out.push_str(selector);
    out.push_str(" {\n");
    for (_, entry) in system.tokens.iter() {
        write_token_entry(out, entry, system, mode);
    }
    out.push_str("  }\n");
}

fn write_token_entry(out: &mut String, entry: &TokenEntry, system: &BaseSystem, mode: TokenMode) {
    let raw = match mode {
        TokenMode::Light => entry.light(),
        TokenMode::Dark => match entry.dark() {
            Some(dark) => dark,
            None => return,
        },
    };
    out.push_str("    ");
    out.push_str(entry.css_var());
    out.push_str(": ");
    out.push_str(&css_token_value(raw, system));
    out.push_str(";\n");
}

fn css_token_value(raw: &str, system: &BaseSystem) -> String {
    let trimmed = raw.trim();
    let Some(inner) = brace_path(trimmed) else {
        return trimmed.to_string();
    };
    match system.token(inner) {
        Some(entry) => format!("var({})", entry.css_var()),
        None => trimmed.to_string(),
    }
}

fn brace_path(trimmed: &str) -> Option<&str> {
    if trimmed.starts_with('{') && trimmed.ends_with('}') && trimmed.len() >= 2 {
        Some(&trimmed[1..trimmed.len() - 1])
    } else {
        None
    }
}
