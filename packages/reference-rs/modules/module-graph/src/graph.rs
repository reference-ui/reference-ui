//! Demand-driven module records over a consumer loader.
//!
//! [`ModuleGraph`] memoizes one [`ModuleRecord`] per [`ModuleKey`]: the first
//! [`ensure`](ModuleGraph::ensure) call loads through the consumer's
//! [`Loader`], later ones replay the cache. The loader reads via a
//! [`FileSystem`](crate::FileSystem), parses once, collects the record, and
//! attaches whatever consumer-side values it wants elsewhere — the graph
//! holds records only, never ASTs or values.

use std::collections::HashMap;

use crate::{ModuleKey, ModuleRecord};

/// Loads one record per key: read, parse once, collect. Returns `None` when
/// the key has no module behind it (missing file, unparseable source, or a
/// values-only external the consumer chose not to load).
pub trait Loader {
    /// Load the record for `key`, or `None` when it has no module.
    fn load(&mut self, key: &ModuleKey) -> Option<ModuleRecord>;
}

/// Memoized records over a [`Loader`]: demand-driven, one load per key.
pub struct ModuleGraph<L> {
    loader: L,
    records: HashMap<ModuleKey, ModuleRecord>,
}

impl<L: Loader> ModuleGraph<L> {
    /// A graph over `loader`, starting empty.
    pub fn new(loader: L) -> Self {
        Self {
            loader,
            records: HashMap::new(),
        }
    }

    /// The record for `key`, loading on first use. `None` stays uncached —
    /// a later `ensure` retries the loader rather than pinning the miss.
    pub fn ensure(&mut self, key: &ModuleKey) -> Option<&ModuleRecord> {
        if !self.records.contains_key(key) {
            let record = self.loader.load(key)?;
            self.records.insert(key.clone(), record);
        }
        self.records.get(key)
    }

    /// The record for `key` when already loaded, without loading.
    pub fn get(&self, key: &ModuleKey) -> Option<&ModuleRecord> {
        self.records.get(key)
    }

    /// True when `key` already has a loaded record.
    pub fn contains(&self, key: &ModuleKey) -> bool {
        self.records.contains_key(key)
    }

    /// The number of loaded records.
    pub fn len(&self) -> usize {
        self.records.len()
    }

    /// True when no record has loaded yet.
    pub fn is_empty(&self) -> bool {
        self.records.is_empty()
    }

    /// The loader, for consumer-side inspection.
    pub fn loader(&self) -> &L {
        &self.loader
    }

    /// The loader, mutably, for consumer-side inspection.
    pub fn loader_mut(&mut self) -> &mut L {
        &mut self.loader
    }
}
