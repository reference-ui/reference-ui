//! The origin walk: where one import's binding comes from, past project
//! re-exports.
//!
//! [`IdentityGraph::trace_origin`] follows the same hops as the Reference
//! walk (named re-exports, re-exported imports, star barrels, each name
//! entered once per query) through relative, `tsconfig`-aliased and
//! bare-specifier hops that land in compile sources, and names the terminal:
//! a Reference export, a project declaration (`Local`), or the package
//! directory a bare specifier resolved to, with its verdict (`Package`). A
//! package that borrows this compile's own runtime answers `Local`. It reuses
//! the memoized export maps and parses nothing new; a walk that cannot see the
//! terminal answers `Local`.

use super::alias::BareHit;
use super::paths::{named_hop, strip_relative};
use super::{enter, Hop, IdentityGraph, Query, Visited};
use crate::extract::bindings::is_reference_package;
use crate::extract::identity_map::{ExportMap, NamedTarget};
use crate::extract::package_system::{DirVerdict, PackageTag};
use crate::extract::provenance::names_package;

/// Where one import binding comes from once project re-exports are followed.
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum Origin {
    /// A Reference package export (`@reference-ui/react` / `styled`).
    Reference,
    /// A project declaration, a project file the walk cannot see into, or
    /// a package that renders through this compile's own runtime.
    Local,
    /// A package: the bare specifier the walk ended on, the directory it
    /// resolved to, and which system renders it.
    Package(PackageTag),
}

impl Origin {
    /// The origin a specifier's spelling alone proves, with no project graph.
    pub(crate) fn of_specifier(specifier: &str) -> Self {
        match locate_spelling(specifier) {
            Spelling::Reference => Self::Reference,
            Spelling::Bare if names_package(specifier) => {
                Self::Package(PackageTag::unresolved(specifier))
            }
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
        self.hop_origin(from_file, &hop, &mut Visited::default())
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

    /// A bare specifier: a compile source continues the walk, a package
    /// directory ends it with its verdict, and an unresolved spelling is a
    /// package when it can name one.
    fn locate_bare(&self, from: &str, specifier: &str) -> Located {
        match self.bare_hit(from, specifier) {
            BareHit::Source(path) => Located::Source(path),
            BareHit::Project => Located::Ends(Origin::Local),
            BareHit::Package { dir, verdict } => package_end(specifier, dir, verdict),
            BareHit::Miss => unmapped_bare(specifier),
        }
    }

    /// One hop across a module boundary; `None` when nothing is visible.
    fn hop_origin(&self, from: &str, hop: &Hop, visited: &mut Visited) -> Option<Origin> {
        match self.locate(from, hop.specifier) {
            Located::Source(target) => self.origin_in(
                &Query {
                    file: &target,
                    name: hop.imported,
                },
                visited,
            ),
            Located::Ends(origin) => Some(origin),
            Located::Missing => None,
        }
    }

    /// Follow one exported name inside a project file; a node already entered answers none.
    fn origin_in(&self, query: &Query, visited: &mut Visited) -> Option<Origin> {
        if !enter(visited, query) {
            return None;
        }
        self.origin_step(query, visited)
    }

    /// One step: a hop follows, a declaration is local, a re-exported
    /// namespace takes its module's origin, an unknown name tries the stars.
    fn origin_step(&self, query: &Query, visited: &mut Visited) -> Option<Origin> {
        let Some(map) = self.export_map(query.file) else {
            return Some(Origin::Local);
        };
        if let Some(hop) = named_hop(&map, query.name) {
            return self.hop_origin(query.file, &hop, visited);
        }
        match map.named_target(query.name) {
            Some(NamedTarget::Local(local)) => Some(self.local_origin(query.file, &map, local)),
            Some(_) => Some(Origin::Local),
            None => self.star_origin(query, &map, visited),
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
    fn star_origin(&self, query: &Query, map: &ExportMap, visited: &mut Visited) -> Option<Origin> {
        let mut guess = None;
        for star in map.stars() {
            match self.star_answer(query, star, visited) {
                StarAnswer::Found(origin) => return Some(origin),
                StarAnswer::Guess(origin) => guess = guess.or(Some(origin)),
                StarAnswer::Nothing => {}
            }
        }
        guess
    }

    /// One star's answer for the queried name; a star never carries `default`.
    fn star_answer(&self, query: &Query, star: &str, visited: &mut Visited) -> StarAnswer {
        if query.name == "default" {
            return StarAnswer::Nothing;
        }
        match self.locate(query.file, star) {
            Located::Source(target) => {
                let inner = Query {
                    file: &target,
                    name: query.name,
                };
                self.origin_in(&inner, visited)
                    .map_or(StarAnswer::Nothing, StarAnswer::Found)
            }
            Located::Ends(origin) => StarAnswer::Guess(origin),
            Located::Missing => StarAnswer::Nothing,
        }
    }
}

/// A package directory ends the walk: one that borrows this compile's own
/// runtime is project code (`Local`), any other is that package.
fn package_end(specifier: &str, dir: Box<str>, verdict: DirVerdict) -> Located {
    let DirVerdict::Package(verdict) = verdict else {
        return Located::Ends(Origin::Local);
    };
    Located::Ends(Origin::Package(PackageTag {
        specifier: specifier.into(),
        dir: Some(dir),
        verdict,
    }))
}

/// A bare specifier nothing resolves: a package when its spelling can name
/// one (foreign, no directory), else an alias this walk cannot see (`~/ui`
/// through a bundler).
fn unmapped_bare(specifier: &str) -> Located {
    if names_package(specifier) {
        return Located::Ends(Origin::Package(PackageTag::unresolved(specifier)));
    }
    Located::Missing
}
