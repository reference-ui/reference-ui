//! Prints `@layer global` and `@layer tokens` from an ingested `BaseSystem`.
//! Global is the stored CSS dump (fixture `:root --spacing-root`). Tokens become
//! custom properties on `:root` (light) and `[data-panda-theme=dark]` (dark
//! overrides). `{path}` aliases look up the same dictionary. Empty layers are
//! omitted; recipes and reset stay empty until those dumps exist.

use base_system::{BaseSystem, TokenEntry};

const DARK_SELECTOR: &str = "[data-panda-theme=dark]";

/// Append globalCss and token custom-property layers when the dump has them.
pub fn append_system_layers(out: &mut String, system: &BaseSystem) {
    append_global(out, system);
    append_tokens(out, system);
}

fn append_global(out: &mut String, system: &BaseSystem) {
    if system.global_css.is_empty() {
        return;
    }
    out.push_str("@layer global {\n");
    for css in &system.global_css {
        write_indented_css(out, css);
    }
    out.push_str("}\n");
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
        .any(|(_, entry)| entry.dark != entry.light)
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
        TokenMode::Light => entry.light.as_str(),
        TokenMode::Dark if entry.dark != entry.light => entry.dark.as_str(),
        TokenMode::Dark => return,
    };
    out.push_str("    ");
    out.push_str(&entry.css_var);
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
        Some(entry) => format!("var({})", entry.css_var),
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
        assert!(css.contains("@layer tokens {"));
        assert!(css.contains(":root {"));
        assert!(css.contains("--colors-blue-600:"));
        assert!(css.contains("[data-panda-theme=dark]"));
        assert!(!css.contains("@layer reset {"));
        assert!(!css.contains("@layer recipes {"));
    }

    #[test]
    fn custom_dump_prints_only_declared_tokens() {
        let css = emit(&custom_system());
        assert!(css.contains("--colors-brand: red;"));
        assert!(css.contains("[data-panda-theme=dark] {"));
        assert!(css.contains("--colors-brand: navy;"));
        assert!(css.contains("--colors-alias: var(--colors-brand);"));
        assert!(!css.contains("--colors-blue-600"));
    }
}
