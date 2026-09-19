//! Star fan-out for the origin walk: resolution and enumeration.
//!
//! Takes the walk plus one file and fans through its `export *` sources:
//! [`BindingWalk::resolve_export`] lands here when no explicit shape names
//! the export, and [`BindingWalk::exported_names`] enumerates every member
//! a barrel re-exports. Exactly one distinct origin wins a lookup; two
//! refuse as ambiguous. Stars never contribute `default`, missing targets
//! simply do not declare the name, and one winner beats a pending error
//! from a star that cycled.

use std::collections::{BTreeSet, HashSet};

use super::{BindingOrigin, BindingWalk, Refused};
use crate::{FileSystem, Loader, ModuleKey};

/// One star poll: the distinct-candidate collector plus the first error a
/// winner has not already beaten. Freed from the walk so polling stays flat.
struct StarPoll {
    candidates: Vec<BindingOrigin>,
    pending: Option<Refused>,
}

/// Enumeration state for `exported_names`: the names, the refused star
/// targets, the visited files, and the queued `(from, specifier)` stars.
struct StarCollect {
    names: BTreeSet<String>,
    refused: Vec<Refused>,
    seen: HashSet<ModuleKey>,
    stack: Vec<(ModuleKey, String)>,
}

impl<'g, L: Loader, F: FileSystem> BindingWalk<'g, L, F> {
    /// Every name `file` exports, fanning through stars, plus the refused
    /// star targets as data. Stars never contribute `default`. `None` when
    /// the entry file itself has no record.
    pub fn exported_names(&mut self, file: &ModuleKey) -> Option<(BTreeSet<String>, Vec<Refused>)> {
        if !self.has_record(file) {
            return None;
        }
        let mut names = BTreeSet::from_iter(self.names_of(file));
        if self.default_of(file).is_some() {
            names.insert("default".to_string());
        }
        let mut collect = StarCollect {
            names,
            refused: Vec::new(),
            seen: HashSet::new(),
            stack: self
                .stars_of(file)
                .into_iter()
                .map(|spec| (file.clone(), spec))
                .collect(),
        };
        while let Some((from, spec)) = collect.stack.pop() {
            self.collect_star(&from, &spec, &mut collect);
        }
        Some((collect.names, collect.refused))
    }

    /// Fan out through stars: exactly one distinct origin wins, two refuse
    /// as ambiguous, and missing targets simply do not declare the name.
    pub(super) fn star_step(&mut self, file: &ModuleKey, name: &str) -> super::Outcome {
        let mut poll = StarPoll {
            candidates: Vec::new(),
            pending: None,
        };
        for spec in self.stars_of(file) {
            self.poll_star(file, &spec, name, &mut poll);
        }
        poll.candidates.sort();
        poll.candidates.dedup();
        if poll.candidates.len() > 1 {
            return Err(Refused::Ambiguous {
                name: name.to_string(),
                candidates: poll.candidates,
            });
        }
        if let Some(only) = poll.candidates.pop() {
            return Ok(only);
        }
        Err(poll.pending.unwrap_or_else(|| self.missing(file, name)))
    }

    /// Poll one star target into the poll: hits collect, misses skip, and
    /// the first non-missing error waits for a winner to beat it.
    fn poll_star(&mut self, file: &ModuleKey, spec: &str, name: &str, poll: &mut StarPoll) {
        let Some(outcome) = self.star_candidate(file, spec, name) else {
            return;
        };
        match outcome {
            Ok(origin) => poll.candidates.push(origin),
            Err(Refused::MissingExport { .. } | Refused::Unresolved { .. }) => {}
            Err(other) => {
                if poll.pending.is_none() {
                    poll.pending = Some(other);
                }
            }
        }
    }

    /// One star target's answer for the name, or `None` when the target is
    /// unusable: unresolvable, or loaded without a record.
    fn star_candidate(
        &mut self,
        file: &ModuleKey,
        spec: &str,
        name: &str,
    ) -> Option<super::Outcome> {
        let target = self.ladder.resolve(file, spec).ok()?;
        if !self.has_record(&target) {
            return None;
        }
        Some(self.resolve_export(&target, name))
    }

    /// Merge one star target's names into the enumeration, queueing its stars.
    fn collect_star(&mut self, from: &ModuleKey, spec: &str, collect: &mut StarCollect) {
        let target = match self.ladder.resolve(from, spec) {
            Ok(target) => target,
            Err(miss) => {
                collect.refused.push(Refused::Unresolved {
                    from: miss.from,
                    specifier: miss.specifier,
                });
                return;
            }
        };
        if !collect.seen.insert(target.clone()) {
            return;
        }
        if !self.has_record(&target) {
            collect.refused.push(self.unresolved(from, spec));
            return;
        }
        collect.names.extend(self.names_of(&target));
        collect.stack.extend(
            self.stars_of(&target)
                .into_iter()
                .map(|star| (target.clone(), star)),
        );
    }
}
