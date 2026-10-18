//! The origin walk: where one import's binding comes from, past project
//! re-exports.
//!
//! [`IdentityGraph::trace_origin`] follows the same hops as the Reference
//! walk (named re-exports, re-exported imports, star barrels, with a cycle
//! guard) through relative and `tsconfig`-aliased project files, and names
//! the terminal: a Reference export, a project declaration (`Local`), or the
//! bare specifier of an installed package (`Package`). A relative barrel that
//! re-exports `@reference-ui/lib/primitives` therefore answers `Package`
//! instead of nothing. It reuses the memoized export maps and parses nothing
//! new; a walk that cannot see the terminal answers `Local`.

use super::alias::AliasHit;
use super::paths::{named_hop, strip_relative};
use super::{Hop, IdentityGraph, Query};
use crate::extract::bindings::is_reference_package;
use crate::extract::identity_map::{ExportMap, NamedTarget};
use crate::extract::provenance::names_package;

/// Where one import binding comes from once project re-exports are followed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum Origin {
    /// A Reference package export (`@reference-ui/react` / `styled`).
    Reference,
    /// A project declaration, or a project file the walk cannot see into.
    Local,
    /// An installed package: the bare specifier the walk ended on.
    Package(Box<str>),
}

impl Origin {
    /// The origin a specifier's spelling alone proves, with no project graph.
    pub(crate) fn of_specifier(specifier: &str) -> Self {
        match locate_spelling(specifier) {
            Spelling::Reference => Self::Reference,
            Spelling::Bare if names_package(specifier) => Self::Package(specifier.into()),
            _ => Self::Local,
        }
    }
}

/// What a specifier's spelling says before any probing.
enum Spelling {
    Reference,
    Relative,
    Bare,
    Other,
}

/// Classify a specifier by spelling: Reference, relative, bare, or other.
fn locate_spelling(specifier: &str) -> Spelling {
    if is_reference_package(specifier) {
        return Spelling::Reference;
    }
    if strip_relative(specifier).is_some() {
        return Spelling::Relative;
    }
    if specifier.is_empty() || specifier.starts_with('/') {
        return Spelling::Other;
    }
    Spelling::Bare
}

/// What one star re-export says about the queried name.
enum StarAnswer {
    /// A visible project star exports it.
    Found(Origin),
    /// An opaque star might: its export list is unseen.
    Guess(Origin),
    /// This star cannot carry it.
    Nothing,
}

/// Where one hop's specifier lands from the importing file.
enum Located {
    /// A compile source the walk continues in.
    Source(String),
    /// The walk ends here with this origin.
    Ends(Origin),
    /// Nothing the walk can see: a relative miss or an unmapped alias.
    Missing,
}

impl IdentityGraph<'_> {
    /// The origin of `imported` from `specifier` as `from_file` imports it.
    /// Unseen terminals answer `Local`: never own by proof, never a package.
    pub(crate) fn trace_origin(&self, from_file: &str, specifier: &str, imported: &str) -> Origin {
        let hop = Hop {
            specifier,
            imported,
        };
        self.hop_origin(from_file, &hop, &mut Vec::new())
            .unwrap_or(Origin::Local)
    }

    /// The origin of a namespace import: its module's, never one member's.
    pub(crate) fn namespace_origin(&self, from_file: &str, specifier: &str) -> Origin {
        match self.locate(from_file, specifier) {
            Located::Ends(origin) => origin,
            Located::Source(_) | Located::Missing => Origin::Local,
        }
    }

    /// Resolve one hop's specifier: Reference and packages end the walk,
    /// relative and aliased project sources continue it.
    fn locate(&self, from: &str, specifier: &str) -> Located {
        match locate_spelling(specifier) {
            Spelling::Reference => Located::Ends(Origin::Reference),
            Spelling::Relative => self
                .resolve(specifier, from)
                .map_or(Located::Missing, Located::Source),
            Spelling::Bare => self.locate_bare(from, specifier),
            Spelling::Other => Located::Missing,
        }
    }

    /// A bare specifier: a `tsconfig` alias when `paths` maps it, else a
    /// package when its spelling can name one.
    fn locate_bare(&self, from: &str, specifier: &str) -> Located {
        match self.alias_hit(from, specifier) {
            AliasHit::Source(path) => Located::Source(path),
            AliasHit::Project => Located::Ends(Origin::Local),
            AliasHit::Installed => package_end(specifier),
            AliasHit::Miss => unmapped_bare(specifier),
        }
    }

    /// One hop across a module boundary; `None` when nothing is visible.
    fn hop_origin(
        &self,
        from: &str,
        hop: &Hop,
        stack: &mut Vec<(String, String)>,
    ) -> Option<Origin> {
        match self.locate(from, hop.specifier) {
            Located::Source(target) => self.origin_in(
                &Query {
                    file: &target,
                    name: hop.imported,
                },
                stack,
            ),
            Located::Ends(origin) => Some(origin),
            Located::Missing => None,
        }
    }

    /// Follow one exported name inside a project file, with `stack` as the cycle guard.
    fn origin_in(&self, query: &Query, stack: &mut Vec<(String, String)>) -> Option<Origin> {
        let key = (query.file.to_string(), query.name.to_string());
        if stack.contains(&key) {
            return None;
        }
        stack.push(key);
        let found = self.origin_step(query, stack);
        stack.pop();
        found
    }

    /// One step: a hop follows, a declaration is local, a re-exported
    /// namespace takes its module's origin, an unknown name tries the stars.
    fn origin_step(&self, query: &Query, stack: &mut Vec<(String, String)>) -> Option<Origin> {
        let Some(map) = self.export_map(query.file) else {
            return Some(Origin::Local);
        };
        if let Some(hop) = named_hop(&map, query.name) {
            return self.hop_origin(query.file, &hop, stack);
        }
        match map.named_target(query.name) {
            Some(NamedTarget::Local(local)) => Some(self.local_origin(query.file, &map, local)),
            Some(_) => Some(Origin::Local),
            None => self.star_origin(query, &map, stack),
        }
    }

    /// A re-exported local with no hop: a namespace import takes its
    /// module's origin; anything else is a project declaration.
    fn local_origin(&self, file: &str, map: &ExportMap, local: &str) -> Origin {
        match map.import_of(local) {
            Some(imp) => self.namespace_origin(file, &imp.specifier),
            None => Origin::Local,
        }
    }

    /// Star re-exports: visible project stars first, in order; then the
    /// first opaque star (Reference or package) is the best guess, since
    /// its export list is unseen.
    fn star_origin(
        &self,
        query: &Query,
        map: &ExportMap,
        stack: &mut Vec<(String, String)>,
    ) -> Option<Origin> {
        let mut guess = None;
        for star in map.stars() {
            match self.star_answer(query, star, stack) {
                StarAnswer::Found(origin) => return Some(origin),
                StarAnswer::Guess(origin) => guess = guess.or(Some(origin)),
                StarAnswer::Nothing => {}
            }
        }
        guess
    }

    /// One star's answer for the queried name; a star never carries `default`.
    fn star_answer(
        &self,
        query: &Query,
        star: &str,
        stack: &mut Vec<(String, String)>,
    ) -> StarAnswer {
        if query.name == "default" {
            return StarAnswer::Nothing;
        }
        match self.locate(query.file, star) {
            Located::Source(target) => {
                let inner = Query {
                    file: &target,
                    name: query.name,
                };
                self.origin_in(&inner, stack)
                    .map_or(StarAnswer::Nothing, StarAnswer::Found)
            }
            Located::Ends(origin) => StarAnswer::Guess(origin),
            Located::Missing => StarAnswer::Nothing,
        }
    }
}

/// A package terminal named by its bare specifier.
fn package_end(specifier: &str) -> Located {
    Located::Ends(Origin::Package(specifier.into()))
}

/// A bare specifier no `paths` entry maps: a package when its spelling can
/// name one, else an alias this walk cannot see (`~/ui` through a bundler).
fn unmapped_bare(specifier: &str) -> Located {
    if names_package(specifier) {
        return package_end(specifier);
    }
    Located::Missing
}
