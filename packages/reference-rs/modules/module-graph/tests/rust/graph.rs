//! ModuleGraph loading: demand-driven, memoized, and retrying misses.
//!
//! The graph loads through its consumer loader on first `ensure` and replays
//! the cache after; `get` never loads. Misses stay uncached so a later
//! `ensure` retries the loader instead of pinning the absence.

mod common;

use module_graph::{ModuleGraph, ModuleKey};

#[test]
fn ensure_loads_once_then_replays() {
    let mut graph = ModuleGraph::new(common::TestLoader::new(&[(
        "/p/src/tokens.ts",
        "export const brand = 'red';",
    )]));
    let key = ModuleKey::new("/p/src/tokens.ts");
    assert!(!graph.contains(&key));
    assert_eq!(graph.len(), 0);
    assert!(graph.is_empty());
    assert!(graph.ensure(&key).is_some());
    assert!(graph.ensure(&key).is_some());
    assert!(graph.contains(&key));
    assert_eq!(graph.len(), 1);
    assert_eq!(graph.loader().loads, 1);
}

#[test]
fn get_never_loads() {
    let graph = ModuleGraph::new(common::TestLoader::new(&[]));
    let key = ModuleKey::new("/p/src/tokens.ts");
    assert!(graph.get(&key).is_none());
    assert_eq!(graph.loader().loads, 0);
}

#[test]
fn misses_retry_instead_of_pinning() {
    let mut graph = ModuleGraph::new(common::TestLoader::new(&[]));
    let key = ModuleKey::new("/p/src/missing.ts");
    assert!(graph.ensure(&key).is_none());
    assert!(graph.ensure(&key).is_none());
    assert_eq!(graph.loader().loads, 2);
    assert!(!graph.contains(&key));
}

#[test]
fn loader_sees_normalized_keys() {
    let mut graph = ModuleGraph::new(common::TestLoader::new(&[(
        "/p/src/tokens.ts",
        "export const brand = 'red';",
    )]));
    let dotted = ModuleKey::new("/p/src/./tokens.ts");
    assert!(graph.ensure(&dotted).is_some());
    assert_eq!(graph.loader().loads, 1);
}
