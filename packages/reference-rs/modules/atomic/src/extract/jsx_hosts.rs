//! Borrowed union of the file-local and compile-global JSX host sets.
//!
//! Per-file setup used to merge both sets into a fresh set, cloning every
//! global host (the ~101 primitive names plus traced/configured hosts) only
//! to answer membership queries. The union view answers the same queries —
//! `contains` for tag gating, `is_empty` for the missing-graph report —
//! over the two borrowed sets, so host setup allocates nothing per file.

use rustc_hash::FxHashSet;

/// Borrowed union of the file-local and compile-global JSX host sets.
#[derive(Clone, Copy)]
pub struct JsxHosts<'a> {
    pub local: &'a FxHashSet<String>,
    pub global: &'a FxHashSet<String>,
}

impl JsxHosts<'_> {
    /// True when either set admits the tag name.
    pub fn contains(&self, name: &str) -> bool {
        self.local.contains(name) || self.global.contains(name)
    }

    /// True when no hosts are resolvable at all (missing-graph gate).
    pub fn is_empty(&self) -> bool {
        self.local.is_empty() && self.global.is_empty()
    }
}
