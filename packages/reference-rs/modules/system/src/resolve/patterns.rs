//! Macro and pattern property lowering pass for Reference UI primitives.
//! Expands high-level ergonomics like \`container\`, \`size\`, \`font\`, and \`weight\` into canonical styling declarations.
//! Guarantees seamless compatibility between authored primitive abstractions and emitted atomic utilities.

use crate::atom::{AtomValue, Want};

const FONT_PRESETS: &[(&str, (&str, &str, &str))] = &[
    ("mono", ("mono", "normal", "-0.04em")),
    ("sans", ("sans", "normal", "-0.01em")),
    ("serif", ("serif", "normal", "normal")),
];

const WEIGHT_TOKENS: &[(&str, &str)] = &[
    ("black", "900"),
    ("bold", "700"),
    ("light", "300"),
    ("mono.bold", "700"),
    ("mono.light", "300"),
    ("mono.normal", "393"),
    ("mono.semibold", "600"),
    ("mono.thin", "100"),
    ("normal", "400"),
    ("sans.black", "900"),
    ("sans.bold", "700"),
    ("sans.light", "300"),
    ("sans.normal", "400"),
    ("sans.semibold", "600"),
    ("sans.thin", "200"),
    ("semibold", "600"),
    ("serif.black", "900"),
    ("serif.bold", "700"),
    ("serif.light", "300"),
    ("serif.normal", "373"),
    ("serif.semibold", "600"),
    ("serif.thin", "100"),
    ("thin", "200"),
];

/// Lower Reference UI macro props (container, size, font, weight, variant, colorMode) into canonical atoms.
pub fn lower_pattern_props(want: &Want) -> Option<Vec<(Box<str>, AtomValue)>> {
    let prop = want.prop.as_ref();
    if matches!(prop, "variant" | "colorMode") {
        return Some(Vec::new());
    }
    if prop == "container" {
        return Some(lower_container_prop(want));
    }
    if prop == "size" {
        return Some(lower_size_prop(want));
    }
    if prop == "font" {
        return lower_font_prop(want);
    }
    if prop == "weight" {
        return Some(lower_weight_prop(want));
    }
    None
}

fn lower_container_prop(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    let mut out = vec![("containerType".into(), AtomValue::String("inline-size".into()))];
    let val = want.value.class_name_str();
    if !val.is_empty() && val != "true" {
        out.push(("containerName".into(), AtomValue::String(val.into())));
    }
    out
}

fn lower_size_prop(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    vec![
        ("width".into(), want.value.clone()),
        ("height".into(), want.value.clone()),
    ]
}

fn lower_font_prop(want: &Want) -> Option<Vec<(Box<str>, AtomValue)>> {
    let val = want.value.class_name_str();
    let (_, (ff, fw, ls)) = FONT_PRESETS
        .binary_search_by_key(&val, |(k, _)| *k)
        .ok()
        .map(|idx| FONT_PRESETS[idx])?;

    Some(vec![
        ("fontFamily".into(), AtomValue::String((*ff).into())),
        ("fontWeight".into(), AtomValue::String((*fw).into())),
        ("letterSpacing".into(), AtomValue::String((*ls).into())),
    ])
}

fn lower_weight_prop(want: &Want) -> Vec<(Box<str>, AtomValue)> {
    let val = want.value.class_name_str();
    let mapped = WEIGHT_TOKENS
        .binary_search_by_key(&val, |(k, _)| *k)
        .ok()
        .map(|idx| WEIGHT_TOKENS[idx].1)
        .unwrap_or(val);

    vec![("fontWeight".into(), AtomValue::String(mapped.into()))]
}
