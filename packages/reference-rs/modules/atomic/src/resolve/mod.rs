//! Orchestration pipeline for transforming raw styling wants into fully resolved atomic utilities.
//! Coordinates dialect utilities (`font`, `weight`, `container`, `size`, `r`), shorthand expansion, rhythm, and tokens.
//! Font tracking, named weights, and token lookup come from `BaseSystem`, not a second preset table here.

pub mod conditions;
pub mod container;
pub mod font;
pub mod gradient;
pub mod r;
pub mod rhythm;
pub mod shorthands;
pub mod size;
pub mod tokens;
pub mod unit;

use base_system::BaseSystem;
use smallvec::SmallVec;

use crate::atom::{Atom, AtomValue, CssValue, Want, When};
use crate::diagnostics::{Diagnostic, DiagnosticLocation};
use crate::resolve::conditions::{lower_when, LoweredWhen};

/// Pass state for one want → atom lowering.
pub struct ResolveSession<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub location: DiagnosticLocation,
}

/// Resolve a raw styling want into one or more canonical atomic declarations.
pub fn resolve_want(want: &Want) -> Vec<Atom> {
    let mut diagnostics = Vec::new();
    let system = BaseSystem::default();
    let mut session = ResolveSession {
        system: &system,
        diagnostics: &mut diagnostics,
        location: DiagnosticLocation::default(),
    };
    resolve_want_with(want, &mut session)
}

/// Resolve a want against an ingested base system.
pub fn resolve_want_with(want: &Want, session: &mut ResolveSession<'_>) -> Vec<Atom> {
    session.location = want.location();
    if !canon::is_known_style_prop(&want.prop) {
        session.diagnostics.push(Diagnostic::warning(format!(
            "Unknown style property \"{}\"",
            want.prop
        )));
        return Vec::new();
    }
    let Some(clean_when) = lower_conditions(&want.when, session) else {
        return Vec::new();
    };
    let pairs = expand_or_passthrough(want, session.system);

    let mut atoms = Vec::with_capacity(pairs.len());
    for (prop, val) in pairs {
        if let Some(final_val) = resolve_atom_value(&prop, val, session) {
            atoms.push(Atom::new(
                prop,
                final_val,
                clean_when.clone(),
                want.important,
            ));
        }
    }
    atoms
}

fn expand_or_passthrough(want: &Want, system: &BaseSystem) -> Vec<(Box<str>, AtomValue)> {
    if let Some(expanded) = lower_macro(want, system) {
        expanded
    } else if let Some(expanded) = shorthands::expand_shorthand(&want.prop, &want.value) {
        expanded
    } else {
        vec![(want.prop.clone(), want.value.clone())]
    }
}

fn lower_macro(want: &Want, system: &BaseSystem) -> Option<Vec<(Box<str>, AtomValue)>> {
    let prop = want.prop.as_ref();
    if is_runtime_owned(prop) {
        return Some(Vec::new());
    }
    let fonts = system.fonts();
    if prop == "font" {
        return Some(font::lower_font(want.value.class_name_str(), fonts));
    }
    if prop == "weight" {
        return Some(font::lower_weight(want.value.class_name_str(), fonts));
    }
    if prop == "container" {
        return Some(container::lower(want));
    }
    if prop == "size" {
        return Some(size::lower(want));
    }
    if prop == "textGradient" {
        return Some(gradient::lower(want));
    }
    if prop == "border" && matches!(want.value, AtomValue::Bool(true)) {
        // <Div border /> → border-width: 1px; border-style: solid.
        return Some(vec![
            ("borderWidth".into(), AtomValue::String("1px".into())),
            ("borderStyle".into(), AtomValue::String("solid".into())),
        ]);
    }
    None
}

fn is_runtime_owned(prop: &str) -> bool {
    matches!(prop, "variant" | "colorMode")
}

fn lower_conditions(
    when: &[Box<str>],
    session: &mut ResolveSession<'_>,
) -> Option<SmallVec<[When; 2]>> {
    let mut out = SmallVec::new();
    let mut known = true;
    for raw in when {
        match lower_when(raw, session.system) {
            LoweredWhen::Skip => {}
            LoweredWhen::Known(cond) => out.push(cond),
            LoweredWhen::Unknown => {
                session
                    .diagnostics
                    .push(Diagnostic::warning(format!("Unknown condition \"{raw}\"")));
                known = false;
            }
        }
    }
    if known {
        Some(out)
    } else {
        None
    }
}

fn resolve_atom_value(
    prop: &str,
    val: AtomValue,
    session: &mut ResolveSession<'_>,
) -> Option<CssValue> {
    let css = unit::css_value_from_authored(prop, val, session.diagnostics)?;
    apply_rhythm_and_tokens(prop, css, session)
}

fn apply_rhythm_and_tokens(
    prop: &str,
    css: CssValue,
    session: &mut ResolveSession<'_>,
) -> Option<CssValue> {
    let val_str = css.class_name_str();
    let rhythm_resolved = rhythm::resolve_rhythm(val_str);
    let token_resolved = tokens::resolve_token_value(prop, &rhythm_resolved, session)?;

    if token_resolved != val_str {
        Some(CssValue::Token {
            path: val_str.into(),
            value: token_resolved.into_owned().into_boxed_str(),
        })
    } else {
        Some(css)
    }
}

#[cfg(test)]
mod tests;
