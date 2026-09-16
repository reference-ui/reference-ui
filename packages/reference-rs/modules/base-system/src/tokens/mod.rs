//! Indexed token dictionary for one design-system utterance.
//! Keys are `category.path` (`colors.gray.800`, `radii.md`) or an authored bare
//! key (`md`) when a station spec never prefixed the category. Each entry stores
//! the CSS custom property name, the light value, and an optional dark override —
//! `None` means no dark variant, not a copy of light. Lookup is FxHashMap on
//! the hot path; emit order stays on the IndexMap. The inner table is Arc so
//! cloning a dictionary is a pointer bump.

use std::sync::Arc;

use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashMap};
use serde::de::Deserializer;
use serde::ser::Serializer;
use serde::{Deserialize, Serialize};

/// One declared token: category, custom property, and color-mode values.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenEntry {
    category: String,
    css_var: String,
    light: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    dark: Option<String>,
}

impl TokenEntry {
    /// Construct a lowered entry. `dark` is the override, not a copy of light.
    pub(crate) fn new(
        category: String,
        css_var: String,
        light: String,
        dark: Option<String>,
    ) -> Self {
        Self {
            category,
            css_var,
            light,
            dark,
        }
    }

    /// Token category string (`colors`, `radii`). Open, not an enum.
    pub fn category(&self) -> &str {
        &self.category
    }

    /// CSS custom property name (`--colors-n300`).
    pub fn css_var(&self) -> &str {
        &self.css_var
    }

    /// Light-mode CSS value.
    pub fn light(&self) -> &str {
        &self.light
    }

    /// Dark-mode override when the author supplied one.
    pub fn dark(&self) -> Option<&str> {
        self.dark.as_deref()
    }

    /// True when the token belongs to an internal `_private` tree.
    pub fn is_private(&self) -> bool {
        self.css_var.contains("_private") || self.category.starts_with('_')
    }
}

impl<'de> Deserialize<'de> for TokenEntry {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let wire = TokenEntryWire::deserialize(deserializer)?;
        Ok(Self::new(
            wire.category,
            wire.css_var,
            wire.light.clone(),
            normalize_dark(&wire.light, wire.dark),
        ))
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TokenEntryWire {
    category: String,
    css_var: String,
    light: String,
    #[serde(default)]
    dark: Option<String>,
}

/// Leaf used by tests and `insert_leaf` to declare a token without spec lowering.
pub struct TokenLeaf<'a> {
    pub category: &'a str,
    pub path: &'a str,
    pub light: &'a str,
    pub dark: &'a str,
}

type FxIndexMap<K, V> = IndexMap<K, V, FxBuildHasher>;

#[derive(Debug, Clone, Default)]
struct TokenStore {
    entries: FxIndexMap<String, TokenEntry>,
    by_category: FxHashMap<String, FxHashMap<String, usize>>,
    unique_bare: FxHashMap<String, usize>,
}

/// Category + path → token entry. Empty until a fixture or spec fills it.
#[derive(Debug, Clone)]
pub struct TokenDictionary {
    inner: Arc<TokenStore>,
}

impl Default for TokenDictionary {
    fn default() -> Self {
        Self {
            inner: Arc::new(TokenStore::default()),
        }
    }
}

impl PartialEq for TokenDictionary {
    fn eq(&self, other: &Self) -> bool {
        self.inner.entries == other.inner.entries
    }
}

impl Eq for TokenDictionary {}

impl Serialize for TokenDictionary {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.inner.entries.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for TokenDictionary {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let entries = IndexMap::<String, TokenEntry>::deserialize(deserializer)?;
        Ok(Self::from_entries(entries))
    }
}

impl TokenDictionary {
    /// True when the dictionary has no entries.
    pub fn is_empty(&self) -> bool {
        self.inner.entries.is_empty()
    }

    /// Number of indexed tokens.
    pub fn len(&self) -> usize {
        self.inner.entries.len()
    }

    /// Look up a full map key (`colors.n300`, authored `md`).
    pub fn get(&self, path: &str) -> Option<&TokenEntry> {
        self.inner.entries.get(path)
    }

    /// Category-scoped lookup: `("radii", "md")` and `("radii", "radii.md")`.
    pub fn get_in_category(&self, category: &str, path: &str) -> Option<&TokenEntry> {
        let rest = category_rest(path, category);
        let idx = *self.inner.by_category.get(category)?.get(rest)?;
        self.entry_at(idx)
    }

    /// Unique trailing-path lookup. None when zero or many keys share `name`.
    pub fn get_unique(&self, name: &str) -> Option<&TokenEntry> {
        let idx = *self.inner.unique_bare.get(name)?;
        self.entry_at(idx)
    }

    /// Insertion-order walk of keys and their entries (`@layer tokens` emit order).
    pub fn iter(&self) -> impl Iterator<Item = (&str, &TokenEntry)> {
        self.inner
            .entries
            .iter()
            .map(|(key, entry)| (key.as_str(), entry))
    }

    /// True when both dictionaries share the same Arc table (O(1) clone).
    pub fn ptr_eq(&self, other: &Self) -> bool {
        Arc::ptr_eq(&self.inner, &other.inner)
    }

    /// Insert one leaf, replacing an existing key of the same path.
    /// Equal light/dark strings normalize to `dark: None`.
    pub fn insert_leaf(&mut self, leaf: TokenLeaf<'_>) {
        let inner = Arc::make_mut(&mut self.inner);
        let key = format!("{}.{}", leaf.category, leaf.path);
        let css_var = css_custom_property(leaf.category, leaf.path);
        inner.entries.insert(
            key,
            TokenEntry::new(
                leaf.category.to_string(),
                css_var,
                leaf.light.to_string(),
                normalize_dark(leaf.light, Some(leaf.dark.to_string())),
            ),
        );
        rebuild_indexes(inner);
    }

    /// Build from an already-indexed map. Spec lowering uses this after it has
    /// rejected duplicates; it does not share `insert_leaf`'s replace-on-duplicate.
    pub(crate) fn from_entries(entries: IndexMap<String, TokenEntry>) -> Self {
        let mut store = TokenStore {
            entries: IndexMap::with_capacity_and_hasher(entries.len(), FxBuildHasher),
            by_category: FxHashMap::default(),
            unique_bare: FxHashMap::default(),
        };
        for (key, entry) in entries {
            store.entries.insert(key, entry);
        }
        rebuild_indexes(&mut store);
        Self {
            inner: Arc::new(store),
        }
    }

    fn entry_at(&self, idx: usize) -> Option<&TokenEntry> {
        self.inner.entries.get_index(idx).map(|(_, entry)| entry)
    }
}

pub(crate) fn css_custom_property(category: &str, path: &str) -> String {
    let mut out = String::from("--");
    push_kebab(&mut out, category);
    out.push('-');
    out.push_str(&path.replace('.', "-"));
    out
}

pub(crate) fn normalize_dark(light: &str, dark: Option<String>) -> Option<String> {
    dark.filter(|value| value != light)
}

fn rebuild_indexes(store: &mut TokenStore) {
    store.by_category.clear();
    let mut counts: FxHashMap<String, Vec<usize>> = FxHashMap::default();
    for (idx, (key, entry)) in store.entries.iter().enumerate() {
        let rest = category_rest(key, entry.category()).to_string();
        store
            .by_category
            .entry(entry.category().to_string())
            .or_default()
            .insert(rest, idx);
        counts
            .entry(trailing_path(key).to_string())
            .or_default()
            .push(idx);
    }
    store.unique_bare = unique_from_counts(counts);
}

fn unique_from_counts(counts: FxHashMap<String, Vec<usize>>) -> FxHashMap<String, usize> {
    let mut unique = FxHashMap::default();
    for (bare, idxs) in counts {
        if let [idx] = idxs.as_slice() {
            unique.insert(bare, *idx);
        }
    }
    unique
}

fn trailing_path(key: &str) -> &str {
    key.split_once('.').map(|(_, rest)| rest).unwrap_or(key)
}

fn category_rest<'a>(key: &'a str, category: &str) -> &'a str {
    key.strip_prefix(category)
        .and_then(|rest| rest.strip_prefix('.'))
        .unwrap_or(key)
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

#[cfg(test)]
mod tests;
