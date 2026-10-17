//! Unit tests for system layer generation, split by topic: global layers in `global` and token layers in `tokens`.
//! This file holds the fixtures (`custom_system`, `emit`, `emit_with_diagnostics`, `doom_t_system`) that both submodules share.

use super::*;
use base_system::{TokenDictionary, TokenLeaf};

mod global;
mod tokens;

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
    let mut root_rule = indexmap::IndexMap::new();
    root_rule.insert(
        "--spacing-root".to_string(),
        base_system::GlobalDeclarationValue::String("0.25rem".to_string()),
    );
    let mut rules = indexmap::IndexMap::new();
    rules.insert(":root".to_string(), root_rule);
    let global_css = vec![base_system::GlobalCssFragment {
        source: "test".to_string(),
        rules,
    }];
    BaseSystem {
        name: "custom".into(),
        tokens,
        global_css,
        ..Default::default()
    }
}

fn emit(system: &BaseSystem) -> String {
    let mut out = String::new();
    let mut diagnostics = Vec::new();
    append_system_layers(&mut out, system, TokenScope::Root, &mut diagnostics);
    out
}

fn emit_with_diagnostics(system: &BaseSystem) -> (String, Vec<crate::diagnostics::Diagnostic>) {
    let mut out = String::new();
    let mut diagnostics = Vec::new();
    append_system_layers(&mut out, system, TokenScope::Root, &mut diagnostics);
    (out, diagnostics)
}

fn doom_t_system(light: &str, dark: &str) -> BaseSystem {
    let mut tokens = TokenDictionary::default();
    tokens.insert_leaf(TokenLeaf {
        category: "spacing",
        path: "4",
        light,
        dark,
    });
    BaseSystem {
        name: "doom-t".into(),
        tokens,
        ..Default::default()
    }
}

