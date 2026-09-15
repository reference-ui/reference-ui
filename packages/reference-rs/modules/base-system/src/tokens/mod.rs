//! Indexed token dictionary for one design-system utterance.
//! Keys are `category.path` (`colors.gray.800`, `radii.md`). Each entry stores the CSS
//! custom property name plus light and dark values copied from the fragment dump.
//! Atomic looks up those keys; opacity `color-mix` and `{…}` brace stripping stay in atomic.

mod palette;
mod semantic;
mod ui;

use crate::fonts::FontScale;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// One declared token: category, custom property, and color-mode values.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenEntry {
    pub category: String,
    pub css_var: String,
    pub light: String,
    pub dark: String,
}

/// Leaf used while filling the lib fixture from static tables.
pub struct TokenLeaf<'a> {
    pub category: &'a str,
    pub path: &'a str,
    pub light: &'a str,
    pub dark: &'a str,
}

/// Category + path → token entry. Empty until a fixture or dump fills it.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenDictionary {
    #[serde(flatten)]
    entries: IndexMap<String, TokenEntry>,
}

impl TokenDictionary {
    /// True when the dictionary has no entries.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    /// Number of indexed tokens.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// Look up a full `category.path` key.
    pub fn get(&self, path: &str) -> Option<&TokenEntry> {
        self.entries.get(path)
    }

    /// Insertion-order walk of `category.path` keys and their entries.
    pub fn iter(&self) -> impl Iterator<Item = (&str, &TokenEntry)> {
        self.entries
            .iter()
            .map(|(key, entry)| (key.as_str(), entry))
    }

    /// Insert one leaf, replacing an existing key of the same path.
    pub fn insert_leaf(&mut self, leaf: TokenLeaf<'_>) {
        let key = format!("{}.{}", leaf.category, leaf.path);
        let css_var = css_custom_property(leaf.category, leaf.path);
        self.entries.insert(
            key,
            TokenEntry {
                category: leaf.category.to_string(),
                css_var,
                light: leaf.light.to_string(),
                dark: leaf.dark.to_string(),
            },
        );
    }
}

/// Fill the `@reference-ui/lib` token tables into `dict`, including font stacks.
pub fn fill_lib(dict: &mut TokenDictionary, fonts: &FontScale) {
    palette::fill(dict);
    ui::fill(dict);
    semantic::fill(dict);
    semantic::fill_fonts(dict, fonts);
}

/// Insert static `(path, light, dark)` rows under one category.
pub fn fill_pairs(dict: &mut TokenDictionary, category: &str, rows: &[(&str, &str, &str)]) {
    for (path, light, dark) in rows {
        dict.insert_leaf(TokenLeaf {
            category,
            path,
            light,
            dark,
        });
    }
}

fn css_custom_property(category: &str, path: &str) -> String {
    let mut out = String::from("--");
    push_kebab(&mut out, category);
    out.push('-');
    out.push_str(&path.replace('.', "-"));
    out
}

fn push_kebab(out: &mut String, category: &str) {
    for ch in category.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
}
