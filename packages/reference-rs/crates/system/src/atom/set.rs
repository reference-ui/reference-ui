//! Deduplicated collection of atomic utilities backed by high-performance hashing.
//! Guarantees canonical uniqueness across all extracted styles regardless of occurrence frequency across source files.
//! Provides set operations and iteration orders required for deterministic CSS generation.

use rustc_hash::FxHashSet;
use serde::{Deserialize, Serialize};

use super::Atom;

/// Set of atoms deduplicated by identity and condition.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct AtomSet {
    atoms: FxHashSet<Atom>,
}

impl AtomSet {
    pub fn new() -> Self {
        Self {
            atoms: FxHashSet::default(),
        }
    }

    pub fn insert(&mut self, atom: Atom) -> bool {
        self.atoms.insert(atom)
    }

    pub fn len(&self) -> usize {
        self.atoms.len()
    }

    pub fn is_empty(&self) -> bool {
        self.atoms.is_empty()
    }

    pub fn iter(&self) -> std::collections::hash_set::Iter<'_, Atom> {
        self.atoms.iter()
    }

    pub fn contains(&self, atom: &Atom) -> bool {
        self.atoms.contains(atom)
    }
}

impl IntoIterator for AtomSet {
    type Item = Atom;
    type IntoIter = std::collections::hash_set::IntoIter<Atom>;

    fn into_iter(self) -> Self::IntoIter {
        self.atoms.into_iter()
    }
}

impl<'a> IntoIterator for &'a AtomSet {
    type Item = &'a Atom;
    type IntoIter = std::collections::hash_set::Iter<'a, Atom>;

    fn into_iter(self) -> Self::IntoIter {
        self.atoms.iter()
    }
}

impl FromIterator<Atom> for AtomSet {
    fn from_iter<T: IntoIterator<Item = Atom>>(iter: T) -> Self {
        Self {
            atoms: FxHashSet::from_iter(iter),
        }
    }
}
