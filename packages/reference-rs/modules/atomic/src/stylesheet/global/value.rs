//! Global CSS declaration value lowering for evaluated design systems.
//! Resolves scalar values, numbers, macros, shorthands, rhythm expressions, and design tokens.
//! Dialect macros such as container, size, font, and weight expand into their canonical
//! CSS declaration properties, while boolean values on standard properties are rejected.

use base_system::{BaseSystem, GlobalDeclarationValue};

use crate::atom::AtomValue;
use crate::diagnostics::Diagnostic;
use crate::resolve::{font, rhythm, tokens};

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
            let final_val = resolve_string_val(prop, &css_prop, s, session);
            vec![(css_prop, final_val)]
        }
        GlobalDeclarationValue::Number(n) => vec![(css_prop, n.to_string())],
        GlobalDeclarationValue::Boolean(_) => {
            session.diagnostics.push(Diagnostic::warning(format!(
                "Boolean value is not allowed on standard property \"{prop}\""
            )));
            Vec::new()
        }
        _ => Vec::new(),
    }
}

fn resolve_string_val(
    prop: &str,
    css_prop: &str,
    s: &str,
    session: &mut ValueSession<'_>,
) -> String {
    if prop.starts_with("--") {
        resolve_token_reference(s, session.system)
    } else {
        let rhythm_val = rhythm::resolve_rhythm(s);
        tokens::resolve_token_value(css_prop, &rhythm_val, session.system, session.diagnostics)
            .into_owned()
    }
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
    let canon_decl = canon::to_css_declaration_property(prop);
    if canon_decl != prop || canon::is_known_style_prop(prop) {
        return canon_decl.to_string();
    }
    kebab_case(prop)
}

fn kebab_case(prop: &str) -> String {
    let mut out = String::with_capacity(prop.len() + 4);
    for (i, ch) in prop.chars().enumerate() {
        if ch.is_ascii_uppercase() {
            if i > 0 {
                out.push('-');
            }
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}
