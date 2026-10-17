//! `@font-face` emission for the global layer: one block per declared face in the system's font table.
//! `has_printable_fonts` gates the layer, and each family name passes through `format_font_family_name` before it prints.

use base_system::BaseSystem;

pub(super) fn has_printable_fonts(system: &BaseSystem) -> bool {
    system.fonts().iter().any(|(_, def)| {
        def.font_face
            .as_ref()
            .is_some_and(|faces| !faces.is_empty())
    })
}

pub(super) fn append_font_faces(out: &mut String, system: &BaseSystem) {
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
