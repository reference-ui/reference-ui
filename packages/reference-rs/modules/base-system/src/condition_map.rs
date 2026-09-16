//! Dual-key condition index for `_hover` / `hover` lookups without allocating
//! on the hit path. Authored maps keep their keys for serde; ingest also indexes
//! the underscore twin so `get` is a borrow-only FxHashMap probe. Unknown names
//! stay `None`. The inner maps sit behind Arc so cloning is a pointer bump.

use std::sync::Arc;

use indexmap::IndexMap;
use rustc_hash::{FxBuildHasher, FxHashMap};
use serde::de::Deserializer;
use serde::ser::Serializer;
use serde::{Deserialize, Serialize};

type FxIndexMap<K, V> = IndexMap<K, V, FxBuildHasher>;

#[derive(Debug, Clone, Default)]
struct ConditionStore {
    authored: FxIndexMap<String, String>,
    lookup: FxHashMap<String, usize>,
}

/// Authored condition wraps plus a dual-key lookup (`_hover` and `hover`).
#[derive(Debug, Clone)]
pub struct ConditionMap {
    inner: Arc<ConditionStore>,
}

impl Default for ConditionMap {
    fn default() -> Self {
        Self {
            inner: Arc::new(ConditionStore::default()),
        }
    }
}

impl PartialEq for ConditionMap {
    fn eq(&self, other: &Self) -> bool {
        self.inner.authored == other.inner.authored
    }
}

impl Eq for ConditionMap {}

impl Serialize for ConditionMap {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.inner.authored.serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for ConditionMap {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let authored = IndexMap::<String, String>::deserialize(deserializer)?;
        Ok(Self::from(authored))
    }
}

impl From<IndexMap<String, String>> for ConditionMap {
    fn from(authored: IndexMap<String, String>) -> Self {
        Self::from_authored(authored)
    }
}

impl ConditionMap {
    /// True when no conditions were declared.
    pub fn is_empty(&self) -> bool {
        self.inner.authored.is_empty()
    }

    /// Wrap string for `_hover` or `hover`. No heap on the hit path.
    pub fn get(&self, key: &str) -> Option<&str> {
        let idx = *self.inner.lookup.get(key)?;
        self.inner
            .authored
            .get_index(idx)
            .map(|(_, wrap)| wrap.as_str())
    }

    fn from_authored(authored: IndexMap<String, String>) -> Self {
        let mut store = ConditionStore {
            authored: IndexMap::with_capacity_and_hasher(authored.len(), FxBuildHasher),
            lookup: FxHashMap::default(),
        };
        for (key, wrap) in authored {
            store.authored.insert(key, wrap);
        }
        index_aliases(&mut store);
        Self {
            inner: Arc::new(store),
        }
    }
}

fn index_aliases(store: &mut ConditionStore) {
    store.lookup.clear();
    for (idx, (key, _)) in store.authored.iter().enumerate() {
        store.lookup.insert(key.clone(), idx);
        insert_twin(&mut store.lookup, key, idx);
    }
}

fn insert_twin(lookup: &mut FxHashMap<String, usize>, key: &str, idx: usize) {
    if let Some(stripped) = key.strip_prefix('_') {
        lookup.entry(stripped.to_string()).or_insert(idx);
        return;
    }
    let mut underscored = String::with_capacity(key.len() + 1);
    underscored.push('_');
    underscored.push_str(key);
    lookup.entry(underscored).or_insert(idx);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hover_and_underscore_hover_share_one_wrap() {
        let mut authored = IndexMap::new();
        authored.insert("_hover".into(), "&:is(:hover, [data-hover])".into());
        let map = ConditionMap::from(authored);
        assert_eq!(map.get("_hover"), Some("&:is(:hover, [data-hover])"));
        assert_eq!(map.get("hover"), Some("&:is(:hover, [data-hover])"));
        assert!(map.get("unknown").is_none());
        assert!(map.get("_missing").is_none());
    }

    #[test]
    fn bare_authored_key_also_answers_underscore() {
        let mut authored = IndexMap::new();
        authored.insert("dark".into(), "[data-theme=dark] &".into());
        let map = ConditionMap::from(authored);
        assert_eq!(map.get("dark"), Some("[data-theme=dark] &"));
        assert_eq!(map.get("_dark"), Some("[data-theme=dark] &"));
    }
}
