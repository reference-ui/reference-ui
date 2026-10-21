//! Each node is entered once per query, so a star cycle cannot hide a sibling's declaration.
//! The cases name the component through an aliased re-export (`Card as Button`): a star-reached declaration is also listed under its own name by the module that declares it, so only the alias shows what the walk found.
//! Each case traces a scratch tree and reads the detailed result's owned map, the channel a declared-only export reports through.

use std::collections::BTreeSet;

use crate::trace_style_bindings_detailed;

use super::fixtures::{workspace_scratch_dir, workspace_sync_root};

/// Declares `Card` and keeps `title` for itself, reaching no primitive: a declared-only export.
const CARD_TSX: &str = concat!(
    "export function Card({ title }: { title?: string }) {\n",
    "  return <span>{title}</span>\n",
    "}\n",
);

/// The owned props recorded under `alias` when the scratch tree is traced.
fn owned_of(name: &str, files: &[(&str, &str)], alias: &str) -> Option<BTreeSet<String>> {
    let scratch = workspace_scratch_dir(name);
    for (relative, content) in files {
        scratch.write(relative, content);
    }
    let sync_root = workspace_sync_root();
    let result = trace_style_bindings_detailed(scratch.root(), Some(sync_root.as_path()))
        .expect("expected the detailed trace to succeed");
    result.owned.get(alias).cloned()
}

#[test]
fn declared_walk_finds_a_name_through_a_star_cycle() {
    let owned = owned_of(
        "declared-walk-star-cycle",
        &[
            ("index.tsx", "export { Card as Button } from './a'\n"),
            ("a.tsx", "export * from './b'\n"),
            ("b.tsx", "export * from './a'\nexport * from './c'\n"),
            ("c.tsx", CARD_TSX),
        ],
        "Button",
    );
    assert_eq!(
        owned,
        Some(BTreeSet::from(["title".to_string()])),
        "the cycle a <-> b hid the declaration c keeps"
    );
}

#[test]
fn declared_walk_ends_a_star_cycle_that_declares_nothing() {
    let owned = owned_of(
        "declared-walk-star-cycle-empty",
        &[
            ("index.tsx", "export { Missing as Button } from './a'\n"),
            ("a.tsx", "export * from './b'\n"),
            ("b.tsx", "export * from './a'\n"),
        ],
        "Button",
    );
    assert_eq!(
        owned, None,
        "a cycle that declares nothing must answer nothing"
    );
}
