//! Negative-capable cache for binding resolution (SPEC-V2-76).
//! Keys are `(file, export)` pairs in v2's `CachedFileExports` shape; values
//! are the resolved origin or the absence of one, so every pair pays the walk
//! once per compile. Outcomes are deterministic per pair — export shapes never
//! change mid-compile, so a pair that cycles always cycles — and every outcome
//! caches. Interior mutability keeps the walker shared.

use std::cell::RefCell;
use std::collections::BTreeMap;

use super::Resolved;

/// `(file, export)` → resolved origin, absent when the export has no origin.
#[derive(Debug, Default)]
pub struct ResolveCache {
    inner: RefCell<BTreeMap<(String, String), Option<Resolved>>>,
}

impl ResolveCache {
    /// An empty cache. One lives on the project graph for the whole compile.
    pub fn new() -> Self {
        Self::default()
    }

    /// The cached outcome for one export of one file, if the walk ran before.
    pub fn get(&self, file: &str, export: &str) -> Option<Option<Resolved>> {
        // ('/proj/src/barrel.ts', 'brand')  →  Some(origin in tokens.ts)
        self.inner
            .borrow()
            .get(&(file.to_string(), export.to_string()))
            .cloned()
    }

    /// Store one pair's outcome: an origin, or no origin (missing export,
    /// unresolvable specifier, or cycle — all deterministic per pair).
    pub fn insert(&self, file: &str, export: &str, resolved: Option<Resolved>) {
        self.inner.borrow_mut().insert(
            (file.to_string(), export.to_string()),
            resolved,
        );
    }
}
