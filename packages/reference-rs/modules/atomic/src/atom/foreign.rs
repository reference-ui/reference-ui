//! The atoms a compile lowers for tags other systems render, grouped by the system each prints
//! under. Every atom lands in one group per system its want's backing names, and once in the
//! union whatever backs it, so the atom count stays the count of distinct foreign atoms while
//! the sheet prints exactly the groups the wants named. Groups keep first-seen order; the
//! emitter orders them by the composed qualifier list. An atom whose backing names no system
//! joins the union only: it resolved, but nothing this compile composes prints it.

use super::{Atom, AtomSet, Backing};

/// Foreign atoms: the union, plus one set per backing system.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ForeignAtoms {
    all: AtomSet,
    groups: Vec<(Box<str>, AtomSet)>,
}

impl ForeignAtoms {
    pub fn new() -> Self {
        Self::default()
    }

    /// Record one atom under every system `backing` names. Own backing is
    /// the caller's set, never this one.
    pub fn insert(&mut self, atom: Atom, backing: &Backing) {
        debug_assert!(!backing.is_own(), "own atoms belong to the own set");
        for system in backing.named() {
            self.group_mut(system).insert(atom.clone());
        }
        self.all.insert(atom);
    }

    /// Distinct foreign atoms, backed or not.
    pub fn len(&self) -> usize {
        self.all.len()
    }

    /// True when no foreign atom resolved at all.
    pub fn is_empty(&self) -> bool {
        self.all.is_empty()
    }

    /// True when some group has an atom to print.
    pub fn prints(&self) -> bool {
        self.groups.iter().any(|(_, atoms)| !atoms.is_empty())
    }

    /// The atoms printed under `system`, if any want named it.
    pub fn group(&self, system: &str) -> Option<&AtomSet> {
        self.groups
            .iter()
            .find(|(name, _)| &**name == system)
            .map(|(_, atoms)| atoms)
    }

    /// Every non-empty group, in the order systems were first named.
    pub fn groups(&self) -> impl Iterator<Item = (&str, &AtomSet)> {
        self.groups
            .iter()
            .filter(|(_, atoms)| !atoms.is_empty())
            .map(|(name, atoms)| (&**name, atoms))
    }

    /// Total printed rules across groups: an atom two systems back counts twice.
    pub fn printed_len(&self) -> usize {
        self.groups.iter().map(|(_, atoms)| atoms.len()).sum()
    }

    fn group_mut(&mut self, system: &str) -> &mut AtomSet {
        let at = match self.groups.iter().position(|(name, _)| &**name == system) {
            Some(at) => at,
            None => {
                self.groups.push((system.into(), AtomSet::new()));
                self.groups.len() - 1
            }
        };
        &mut self.groups[at].1
    }
}
