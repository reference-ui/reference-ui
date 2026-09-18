//! Global CSS declaration value lowering for evaluated design systems.
//! Resolves scalar values, numbers, macros, shorthands, rhythm expressions, and design tokens.
//! Dialect macros such as container, size, font, and weight expand into their canonical
//! CSS declaration properties, while boolean values on standard properties are rejected.

use base_system::{BaseSystem, GlobalDeclarationValue};

use crate::atom::AtomValue;
use crate::diagnostics::{Diagnostic, DiagnosticLocation};
use crate::resolve::{font, rhythm, tokens, unit, ResolveSession};

/// Lowering session holding design system references and diagnostic accumulators.
pub struct ValueSession<'a> {
    pub system: &'a BaseSystem,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

/// Lowers one authored global property and declaration value into CSS property-value pairs.
pub fn lower_declaration(
    prop: &str,
    val: &GlobalDeclarationValue,
    session: &mut ValueSession<'_>,
) -> Vec<(String, String)> {
    if prop == "container" {
        return lower_container_macro(val);
    }
    if prop == "size" {
        return lower_size_macro(val, session);
    }
    if prop == "font" {
        return lower_font_macro(val, session.system);
    }
    if prop == "weight" {
        return lower_weight_macro(val, session.system);
    }
    if !prop.starts_with("--") && !canon::is_known_style_prop(prop) {
        session.diagnostics.push(Diagnostic::warning(format!(
            "Unknown style property in global CSS: \"{prop}\""
        )));
        return Vec::new();
    }
    lower_standard_property(prop, val, session)
}

fn lower_container_macro(val: &GlobalDeclarationValue) -> Vec<(String, String)> {
    if let GlobalDeclarationValue::Boolean(true) = val {
        return vec![("container-type".to_string(), "inline-size".to_string())];
    }
    let GlobalDeclarationValue::String(name) = val else {
        return Vec::new();
    };
    if name == "true" {
        return vec![("container-type".to_string(), "inline-size".to_string())];
    }
    if !name.is_empty() {
        return vec![
            ("container-type".to_string(), "inline-size".to_string()),
            ("container-name".to_string(), name.clone()),
        ];
    }
    Vec::new()
}

fn lower_size_macro(
    val: &GlobalDeclarationValue,
    session: &mut ValueSession<'_>,
) -> Vec<(String, String)> {
    let lowered = lower_standard_property("width", val, session);
    let mut out = Vec::with_capacity(lowered.len() * 2);
    for (_, v) in &lowered {
        out.push(("width".to_string(), v.clone()));
        out.push(("height".to_string(), v.clone()));
    }
    out
}

fn lower_font_macro(val: &GlobalDeclarationValue, system: &BaseSystem) -> Vec<(String, String)> {
    let GlobalDeclarationValue::String(family) = val else {
        return Vec::new();
    };
    font::lower_font(family, system.fonts())
        .into_iter()
        .map(|(p, v)| {
            (
                canon::to_css_declaration_property(&p).to_string(),
                atom_val_to_string(v),
            )
        })
        .collect()
}

fn lower_weight_macro(val: &GlobalDeclarationValue, system: &BaseSystem) -> Vec<(String, String)> {
    let GlobalDeclarationValue::String(weight) = val else {
        return Vec::new();
    };
    font::lower_weight(weight, system.fonts())
        .into_iter()
        .map(|(p, v)| {
            (
                canon::to_css_declaration_property(&p).to_string(),
                atom_val_to_string(v),
            )
        })
        .collect()
}

fn atom_val_to_string(val: AtomValue) -> String {
    match val {
        AtomValue::String(s) => s.to_string(),
        AtomValue::Token { value, .. } => value.to_string(),
        AtomValue::Number(n) => n.to_string(),
        _ => String::new(),
    }
}

fn lower_standard_property(
    prop: &str,
    val: &GlobalDeclarationValue,
    session: &mut ValueSession<'_>,
) -> Vec<(String, String)> {
    let css_prop = to_css_property(prop);
    match val {
        GlobalDeclarationValue::String(s) => {
            let Some(final_val) = resolve_string_val(prop, &css_prop, s, session) else {
                return Vec::new();
            };
            vec![(css_prop, final_val)]
        }
        GlobalDeclarationValue::Number(n) => vec![(css_prop, lower_number_value(prop, n))],
        GlobalDeclarationValue::Boolean(_) => {
            session.diagnostics.push(Diagnostic::warning(format!(
                "Boolean value is not allowed on standard property \"{prop}\""
            )));
            Vec::new()
        }
        _ => Vec::new(),
    }
}

/// Unitize a bare global number through the shared `css()` unit policy:
/// dimensional props gain `px`, unitless-stay props and zero stay bare.
fn lower_number_value(prop: &str, n: &serde_json::Number) -> String {
    unit::resolve_numeric_value(prop, &n.to_string())
        .css_value_str()
        .to_string()
}

fn resolve_string_val(
    prop: &str,
    css_prop: &str,
    s: &str,
    session: &mut ValueSession<'_>,
) -> Option<String> {
    if prop.starts_with("--") {
        Some(resolve_token_reference(s, session.system))
    } else {
        let (stem, unitized) = unitized_stem(prop, s);
        let rhythm_val = rhythm::resolve_rhythm(&stem);
        let mut resolve_session = ResolveSession {
            system: session.system,
            diagnostics: &mut *session.diagnostics,
            location: DiagnosticLocation::default(),
        };
        tokens::resolve_token_value(css_prop, &rhythm_val, &mut resolve_session).map(|resolved| {
            if resolved.as_ref() != stem {
                resolved.into_owned()
            } else {
                unitized
            }
        })
    }
}

/// `css()` unit policy for global strings: canonical numerics gain `px` on
/// dimensional props (color/font carve-outs match `css()`); tokens still win
/// on the stem when the scale holds the value. Returns (token stem, fallback).
fn unitized_stem(prop: &str, s: &str) -> (String, String) {
    if !canon::is_color_prop(prop) && prop != "font" && prop != "fontFamily" {
        if let Some(num) = unit::parse_canonical_number(s) {
            let css = unit::resolve_numeric_value(prop, num);
            return (
                css.class_name_str().to_string(),
                css.css_value_str().to_string(),
            );
        }
    }
    (s.to_string(), s.to_string())
}

fn resolve_token_reference(raw: &str, system: &BaseSystem) -> String {
    let trimmed = raw.trim();
    if trimmed.starts_with('{') && trimmed.ends_with('}') && trimmed.len() >= 2 {
        let inner = &trimmed[1..trimmed.len() - 1];
        if let Some(entry) = system.token(inner) {
            return format!("var({})", entry.css_var());
        }
    }
    raw.to_string()
}

fn to_css_property(prop: &str) -> String {
    if prop.starts_with("--") {
        return prop.to_string();
    }
    canon::to_css_declaration_property(prop).to_string()
}
