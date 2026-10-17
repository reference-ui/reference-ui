//! `@keyframes` emission for the global layer: each keyframe set prints one step per selector with its declarations.
//! Keyframe values lower through the `css()` unit, rhythm, and token chain, and misses keep the authored value verbatim.
//! `has_printable_keyframes` gates the layer, so an empty definition never prints an at-rule.

use base_system::{BaseSystem, KeyframeDefinition, StyleMap};

use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticLocation;
use crate::resolve::rhythm::resolve_rhythm;
use crate::resolve::tokens::resolve_token_value;
use crate::resolve::unit::css_value_from_authored;
use crate::resolve::ResolveSession;

pub(super) fn has_printable_keyframes(system: &BaseSystem) -> bool {
    system
        .keyframes
        .values()
        .any(KeyframeDefinition::has_declarations)
}

pub(super) fn append_keyframes(out: &mut String, system: &BaseSystem) {
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
