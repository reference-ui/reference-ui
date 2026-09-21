//! Per-compile probe memo for the specifier ladder.
//!
//! One compile resolves thousands of edges through the same ancestor
//! chains and manifest paths, and every probe that reaches disk costs a
//! syscall. [`ProbeMemo`] caches each probe outcome (file/dir hits, file
//! text, canonical forms — misses included) behind [`RefCell`]s so every
//! edge sharing one filesystem reuses them. It is deliberately
//! per-compile state: each owner (atomic's `AtomicFs`, styletrace's
//! resolver) is rebuilt per compile, so no entry outlives the disk
//! state it saw. Resolution runs single-threaded; a contended borrow
//! skips the store rather than blocking.

use std::cell::RefCell;
use std::collections::HashMap;

/// Memoized filesystem probes for one compile: path to outcome.
#[derive(Debug, Default)]
pub struct ProbeMemo {
    is_file: RefCell<HashMap<String, bool>>,
    is_dir: RefCell<HashMap<String, bool>>,
    text: RefCell<HashMap<String, Option<String>>>,
    canon: RefCell<HashMap<String, Option<String>>>,
}

impl ProbeMemo {
    /// An empty memo; the owner fills it as edges probe.
    pub fn new() -> Self {
        Self::default()
    }

    /// Cached `is_file`, computing through `probe` on first sight.
    pub fn is_file(&self, path: &str, probe: impl FnOnce(&str) -> bool) -> bool {
        cached(&self.is_file, path, probe)
    }

    /// Cached `is_dir`, computing through `probe` on first sight.
    pub fn is_dir(&self, path: &str, probe: impl FnOnce(&str) -> bool) -> bool {
        cached(&self.is_dir, path, probe)
    }

    /// Cached file text (misses included), computing once per path.
    pub fn read_to_string(
        &self,
        path: &str,
        probe: impl FnOnce(&str) -> Option<String>,
    ) -> Option<String> {
        cached(&self.text, path, probe)
    }

    /// Cached canonical form (misses included), computing once per path.
    pub fn canonicalize(
        &self,
        path: &str,
        probe: impl FnOnce(&str) -> Option<String>,
    ) -> Option<String> {
        cached(&self.canon, path, probe)
    }
}

/// One memo cell: the stored outcome, or the probe computed and stored.
/// An unreadable or contended cell computes through without storing.
fn cached<T: Clone>(
    cell: &RefCell<HashMap<String, T>>,
    path: &str,
    probe: impl FnOnce(&str) -> T,
) -> T {
    if let Ok(cache) = cell.try_borrow() {
        if let Some(hit) = cache.get(path) {
            return hit.clone();
        }
    }
    let outcome = probe(path);
    if let Ok(mut cache) = cell.try_borrow_mut() {
        cache.insert(path.to_string(), outcome.clone());
    }
    outcome
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::cell::Cell;

    /// Repeated probes compute once: hits and misses both stick.
    #[test]
    fn repeated_probes_compute_once() {
        let memo = ProbeMemo::new();
        let calls = Cell::new(0);
        let probe = |path: &str| {
            calls.set(calls.get() + 1);
            path.ends_with(".ts")
        };
        for _ in 0..50 {
            assert!(memo.is_file("/p/a.ts", &probe));
            assert!(!memo.is_file("/p/b.js", &probe));
            assert!(!memo.is_dir("/p/sub", &probe));
        }
        assert_eq!(calls.get(), 3);
    }

    /// File text memoizes misses too: one manifest read per path.
    #[test]
    fn text_and_canon_memoize_misses() {
        let memo = ProbeMemo::new();
        let calls = Cell::new(0);
        let probe = |path: &str| {
            calls.set(calls.get() + 1);
            if path.ends_with("package.json") {
                Some("{}".to_string())
            } else {
                None
            }
        };
        for _ in 0..25 {
            assert_eq!(
                memo.read_to_string("/p/package.json", &probe).as_deref(),
                Some("{}")
            );
            assert_eq!(memo.read_to_string("/p/other.json", &probe), None);
            assert_eq!(memo.canonicalize("/p/other.json", &probe), None);
        }
        assert_eq!(calls.get(), 3);
    }
}
