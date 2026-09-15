//! Prints `@layer global` and `@layer tokens` from an ingested `BaseSystem`.
//! Global is the stored CSS dump (fixture `:root --spacing-root`) plus `@keyframes`
//! rules from the system's motion table. Tokens become custom properties on `:root`
//! (light) and `[data-panda-theme=dark]` (dark overrides). `{path}` aliases look up
//! the same dictionary. Empty layers and empty keyframe tables are omitted; recipes
//! and reset stay empty until those dumps exist. Custom dumps without keyframes do
//! not inherit the lib fixture motion table.

use base_system::{BaseSystem, KeyframeDefinition, StyleMap, TokenEntry};

const DARK_SELECTOR: &str = "[data-panda-theme=dark]";

/// Append globalCss and token custom-property layers when the dump has them.
pub fn append_system_layers(out: &mut String, system: &BaseSystem) {
    append_global(out, system);
    append_tokens(out, system);
}

fn append_global(out: &mut String, system: &BaseSystem) {
    if system.global_css.is_empty() && !has_printable_keyframes(system) {
        return;
    }
    out.push_str("@layer global {\n");
    for css in &system.global_css {
        write_indented_css(out, css);
    }
    append_keyframes(out, system);
    out.push_str("}\n");
}

fn has_printable_keyframes(system: &BaseSystem) -> bool {
    system
        .keyframes
        .values()
        .any(KeyframeDefinition::has_declarations)
}

fn append_keyframes(out: &mut String, system: &BaseSystem) {
    for (name, def) in system.list_keyframes() {
        append_one_keyframe(out, name, def);
    }
}

fn append_one_keyframe(out: &mut String, name: &str, def: &KeyframeDefinition) {
    if !def.has_declarations() {
        return;
    }
    out.push_str("  @keyframes ");
    out.push_str(name);
    out.push_str(" {\n");
    for (selector, decls) in def.steps() {
        write_keyframe_step(out, selector, decls);
    }
    out.push_str("  }\n");
}

fn write_keyframe_step(out: &mut String, selector: &str, decls: &StyleMap) {
    if decls.is_empty() {
        return;
    }
    out.push_str("    ");
    out.push_str(selector);
    out.push_str(" { ");
    write_declarations(out, decls);
    out.push_str(" }\n");
}

fn write_declarations(out: &mut String, decls: &StyleMap) {
    for (i, (prop, value)) in decls.iter().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        push_css_property(out, prop);
        out.push_str(": ");
        out.push_str(value);
        out.push(';');
    }
}

fn push_css_property(out: &mut String, prop: &str) {
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
}

fn write_indented_css(out: &mut String, css: &str) {
    for line in css.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        out.push_str("  ");
        out.push_str(trimmed);
        out.push('\n');
    }
}

fn append_tokens(out: &mut String, system: &BaseSystem) {
    if system.tokens.is_empty() {
        return;
    }
    out.push_str("@layer tokens {\n");
    write_token_block(out, ":root", system, TokenMode::Light);
    if has_dark_overrides(system) {
        write_token_block(out, DARK_SELECTOR, system, TokenMode::Dark);
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

#[cfg(test)]
mod tests {
    use super::*;
    use base_system::{TokenDictionary, TokenLeaf};

    fn custom_system() -> BaseSystem {
        let mut tokens = TokenDictionary::default();
        tokens.insert_leaf(TokenLeaf {
            category: "colors",
            path: "brand",
            light: "red",
            dark: "navy",
        });
        tokens.insert_leaf(TokenLeaf {
            category: "colors",
            path: "alias",
            light: "{colors.brand}",
            dark: "{colors.brand}",
        });
        BaseSystem {
            name: "custom".into(),
            tokens,
            global_css: vec![":root { --spacing-root: 0.25rem }".into()],
            ..Default::default()
        }
    }

    fn emit(system: &BaseSystem) -> String {
        let mut out = String::new();
        append_system_layers(&mut out, system);
        out
    }

    #[test]
    fn empty_system_prints_no_layers() {
        assert_eq!(emit(&BaseSystem::default()), "");
    }

    #[test]
    fn fixture_prints_spacing_root_and_token_vars() {
        let css = emit(BaseSystem::lib_fixture());
        assert!(css.contains("@layer global {"));
        assert!(css.contains("--spacing-root: 0.25rem"));
        assert!(css.contains("@keyframes fadeIn"));
        assert!(css.contains("@keyframes spin"));
        assert!(css.contains("from { opacity: 0; }"));
        assert!(css.contains("to { opacity: 1; }"));
        assert!(css.contains("@layer tokens {"));
        assert!(css.contains(":root {"));
        assert!(css.contains("--colors-blue-600:"));
        assert!(css.contains("[data-panda-theme=dark]"));
        assert!(!css.contains("@layer reset {"));
        assert!(!css.contains("@layer recipes {"));
    }

    #[test]
    fn bas_motion_02_fixture_emits_fade_in_and_spin_keyframes() {
        let css = emit(BaseSystem::lib_fixture());
        assert!(css.contains("@keyframes fadeIn"));
        assert!(css.contains("@keyframes spin"));
        assert!(css.contains("from { transform: rotate(0deg); }"));
        assert!(css.contains("to { transform: rotate(360deg); }"));
    }

    #[test]
    fn custom_dump_prints_only_declared_tokens() {
        let css = emit(&custom_system());
        assert!(css.contains("--colors-brand: red;"));
        assert!(css.contains("[data-panda-theme=dark] {"));
        assert!(css.contains("--colors-brand: navy;"));
        assert!(css.contains("--colors-alias: var(--colors-brand);"));
        assert!(!css.contains("--colors-blue-600"));
        assert!(!css.contains("@keyframes"));
        assert!(!css.contains("fadeIn"));
    }

    #[test]
    fn empty_keyframe_definition_does_not_print_at_rule() {
        let mut system = BaseSystem::default();
        system
            .keyframes
            .insert("ghost".into(), KeyframeDefinition::default());
        assert_eq!(emit(&system), "");
    }

    #[test]
    fn camel_case_keyframe_props_emit_kebab() {
        let system = BaseSystem::from_json(
            r#"{"keyframes":{"shimmer":{"0%":{"backgroundPosition":"-200% 0"},"100%":{"backgroundPosition":"200% 0"}}}}"#,
        )
        .unwrap();
        let css = emit(&system);
        assert!(css.contains("@keyframes shimmer"));
        assert!(css.contains("background-position: -200% 0;"));
        assert!(!css.contains("backgroundPosition"));
    }
}
