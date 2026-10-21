//! Reference identity through consumer re-exports (SPEC-V2-76 rider, S12).
//!
//! Answers one question per import: does this name trace to a Reference
//! package export? A consumer wrapper (`export { css } from
//! '@reference-ui/react'`) carries site identity to its importers with zero
//! config, replacing Panda's `importMap`. The walk follows named
//! re-exports, local re-exports of imports, and star re-exports across
//! project files, entering each `(file, name)` once per query so an export
//! cycle costs one visit; a consumer declaration anywhere on the path ends
//! the walk. Specifier probing here is relative-only and minimal —
//! the Ph4 resolver (ATM-SITE-54) subsumes it when it lands. The origin walk
//! (`origin`) reuses these maps to name where any import ends: Reference, a
//! project declaration, or an installed package.

use std::cell::RefCell;
use std::sync::Arc;

use oxc_ast::ast::Program;
use rustc_hash::{FxHashMap, FxHashSet};

use super::bindings::is_reference_package;
use super::identity_map::{collect_map, parse_export_map, ExportMap, NamedTarget};

mod alias;
mod origin;
mod paths;

pub(crate) use origin::Origin;
use paths::{candidates, dir_of, named_hop, normalize_path, strip_relative};

/// One identity question: does `name` exported from `file` trace to Reference?
struct Query<'a> {
    file: &'a str,
    name: &'a str,
}

/// One hop across a module boundary: resolve `specifier` from the current file, then trace
/// `imported`.
struct Hop<'a> {
    specifier: &'a str,
    imported: &'a str,
}

/// A relative specifier split for probing: the joined path plus whether only a directory fits.
struct RelativeRef<'a> {
    path: &'a str,
    dir_only: bool,
}

/// The `(file, name)` nodes one identity query has entered: still walking, or fully walked.
type Visited = FxHashSet<(String, String)>;

/// Claim `query`'s node for this walk. A node already entered answers no at
/// once: it is still on the walk (a cycle cut) or fully walked. A fully walked
/// node reaches a hit only through a node still on the walk, and that node is
/// refused on re-entry too, so skipping the revisit changes no answer.
fn enter(visited: &mut Visited, query: &Query) -> bool {
    visited.insert((query.file.to_string(), query.name.to_string()))
}

/// Project file index plus memoized export maps: everything the identity walk reads.
pub struct IdentityGraph<'s> {
    sources: &'s [(String, String)],
    index: FxHashMap<String, usize>,
    memo: RefCell<FxHashMap<String, Option<Arc<ExportMap>>>>,
    /// Retained programs by source position; a hit reuses the main-phase
    /// parse instead of re-parsing bytes. Missing positions (streamed,
    /// panicked, or never parsed) fall back to a fresh parse.
    programs: Option<&'s FxHashMap<usize, &'s Program<'s>>>,
    /// Memoized `tsconfig` alias probes for the origin walk.
    aliases: alias::AliasMemo,
}

impl<'s> IdentityGraph<'s> {
    /// Index project sources by normalized path; export maps parse lazily.
    pub fn new(sources: &'s [(String, String)]) -> Self {
        Self::build(sources, None)
    }

    /// Index with retained-program reuse: positions present in `programs`
    /// fold the main-phase program; every other position parses bytes.
    pub fn with_programs(
        sources: &'s [(String, String)],
        programs: &'s FxHashMap<usize, &'s Program<'s>>,
    ) -> Self {
        Self::build(sources, Some(programs))
    }

    /// Index from export maps already folded on the parsing thread.
    /// A present entry is the file's surface; `None` is a failed parse.
    /// Missing paths still parse from bytes, so external hops are unchanged.
    pub(crate) fn from_shared(
        sources: &'s [(String, String)],
        maps: &[Option<Arc<ExportMap>>],
    ) -> Self {
        let mut graph = Self::build(sources, None);
        let mut memo = FxHashMap::default();
        for (index, map) in maps.iter().enumerate() {
            if let Some((path, _)) = sources.get(index) {
                memo.insert(path.clone(), map.clone());
            }
        }
        graph.memo = RefCell::new(memo);
        graph
    }

    /// Index project sources by normalized path with an optional program map.
    fn build(
        sources: &'s [(String, String)],
        programs: Option<&'s FxHashMap<usize, &'s Program<'s>>>,
    ) -> Self {
        let mut index = FxHashMap::default();
        for (position, (path, _)) in sources.iter().enumerate() {
            index.entry(normalize_path(path)).or_insert(position);
        }
        Self {
            sources,
            index,
            memo: RefCell::new(FxHashMap::default()),
            programs,
            aliases: alias::AliasMemo::default(),
        }
    }

    /// The Reference export a project import traces to, if any.
    /// `import { css } from './ui'` answers `Some("css")` when `./ui`
    /// re-exports Reference's `css`; anything else answers `None`.
    pub fn trace_reference_export(
        &self,
        from_file: &str,
        specifier: &str,
        imported: &str,
    ) -> Option<String> {
        if is_reference_package(specifier) {
            return Some(imported.to_string());
        }
        let target = self.resolve(specifier, from_file)?;
        let query = Query {
            file: &target,
            name: imported,
        };
        self.trace(&query, &mut Visited::default())
    }

    /// The defining file and local name one import resolves to, if traceable.
    /// Follows the same hops as the Reference walk; a consumer declaration
    /// ends the walk and names its local (`export const b` answers `b`,
    /// `export default <expr>` answers the `default` pseudo-binding the
    /// selection pass records). Reference terminals answer `None`: recipe
    /// results never come from Reference packages.
    pub(crate) fn trace_binding_terminal(
        &self,
        from_file: &str,
        specifier: &str,
        imported: &str,
    ) -> Option<(String, String)> {
        if is_reference_package(specifier) {
            return None;
        }
        let target = self.resolve(specifier, from_file)?;
        let query = Query {
            file: &target,
            name: imported,
        };
        self.trace_terminal(&query, &mut Visited::default())
    }

    /// Follow named exports, then star re-exports; a node already entered answers none.
    fn trace_terminal(&self, query: &Query, visited: &mut Visited) -> Option<(String, String)> {
        if !enter(visited, query) {
            return None;
        }
        self.trace_terminal_inner(query, visited)
    }

    /// One terminal step: hops follow, declarations name their local, unknown
    /// names try the stars. The caller's binding index decides whether the
    /// terminal local is a recipe binding.
    fn trace_terminal_inner(
        &self,
        query: &Query,
        visited: &mut Visited,
    ) -> Option<(String, String)> {
        let map = self.export_map(query.file)?;
        if let Some(hop) = named_hop(&map, query.name) {
            return self.follow_terminal_hop(query.file, &hop, visited);
        }
        match map.named_target(query.name) {
            Some(NamedTarget::Local(local)) => Some((query.file.to_string(), local.to_string())),
            Some(NamedTarget::Opaque) => Some((query.file.to_string(), query.name.to_string())),
            _ => self.follow_terminal_stars(query, &map, visited),
        }
    }

    /// Resolve one terminal hop: a Reference source ends the walk with
    /// nothing, a project file recurses.
    fn follow_terminal_hop(
        &self,
        from: &str,
        hop: &Hop,
        visited: &mut Visited,
    ) -> Option<(String, String)> {
        if is_reference_package(hop.specifier) {
            return None;
        }
        let target = self.resolve(hop.specifier, from)?;
        self.trace_terminal(
            &Query {
                file: &target,
                name: hop.imported,
            },
            visited,
        )
    }

    /// Star re-exports in order, first hit wins; a star never carries
    /// `default`, and a Reference star carries no recipe binding.
    fn follow_terminal_stars(
        &self,
        query: &Query,
        map: &ExportMap,
        visited: &mut Visited,
    ) -> Option<(String, String)> {
        if query.name == "default" {
            return None;
        }
        for star in map.stars() {
            if is_reference_package(star) {
                continue;
            }
            let hop = Hop {
                specifier: star,
                imported: query.name,
            };
            if let Some(found) = self.follow_terminal_hop(query.file, &hop, visited) {
                return Some(found);
            }
        }
        None
    }

    /// Follow named exports, then star re-exports; a node already entered answers none.
    fn trace(&self, query: &Query, visited: &mut Visited) -> Option<String> {
        if !enter(visited, query) {
            return None;
        }
        self.trace_inner(query, visited)
    }

    /// One trace step: a hop follows, an opaque export stops, an unknown name tries the stars.
    fn trace_inner(&self, query: &Query, visited: &mut Visited) -> Option<String> {
        let map = self.export_map(query.file)?;
        if let Some(hop) = named_hop(&map, query.name) {
            return self.follow_hop(query.file, &hop, visited);
        }
        if map.named_target(query.name).is_some() {
            return None;
        }
        self.follow_stars(query, &map, visited)
    }

    /// Resolve one hop: a Reference source terminates, a project file recurses.
    fn follow_hop(&self, from: &str, hop: &Hop, visited: &mut Visited) -> Option<String> {
        if is_reference_package(hop.specifier) {
            return Some(hop.imported.to_string());
        }
        let target = self.resolve(hop.specifier, from)?;
        self.trace(
            &Query {
                file: &target,
                name: hop.imported,
            },
            visited,
        )
    }

    /// Star re-exports in order, first hit wins; a star never carries `default`.
    /// True star ambiguity is a runtime link error, so order is unobservable.
    fn follow_stars(
        &self,
        query: &Query,
        map: &ExportMap,
        visited: &mut Visited,
    ) -> Option<String> {
        if query.name == "default" {
            return None;
        }
        for star in map.stars() {
            if is_reference_package(star) {
                return Some(query.name.to_string());
            }
            let hop = Hop {
                specifier: star,
                imported: query.name,
            };
            if let Some(found) = self.follow_hop(query.file, &hop, visited) {
                return Some(found);
            }
        }
        None
    }

    /// Memoized export surface of one project file; unparseable files map to `None`.
    fn export_map(&self, path: &str) -> Option<Arc<ExportMap>> {
        if let Some(hit) = self.memo.borrow().get(path) {
            return hit.clone();
        }
        let parsed = self
            .index
            .get(&normalize_path(path))
            .and_then(|position| self.parse_position(*position))
            .map(Arc::new);
        self.memo
            .borrow_mut()
            .insert(path.to_string(), parsed.clone());
        parsed
    }

    /// One position's export surface: the retained program when mapped,
    /// else a fresh parse of its bytes. The parser is deterministic and
    /// both paths use identical options, so a mapped program folds exactly
    /// what its re-parse would.
    fn parse_position(&self, position: usize) -> Option<ExportMap> {
        if let Some(program) = self.programs.and_then(|maps| maps.get(&position).copied()) {
            return Some(collect_map(program));
        }
        let (file_path, content) = &self.sources[position];
        parse_export_map(content, file_path)
    }

    /// Resolve a relative specifier against the project sources. Bare and
    /// aliased specifiers wait for the Ph4 resolver (ATM-SITE-54).
    fn resolve(&self, specifier: &str, from_file: &str) -> Option<String> {
        let relative = strip_relative(specifier)?;
        let from = normalize_path(from_file);
        let parent = dir_of(&from);
        let joined = if parent.is_empty() {
            normalize_path(relative.path)
        } else {
            normalize_path(&format!("{parent}/{}", relative.path))
        };
        self.probe(&joined, relative.dir_only)
    }

    /// First candidate present in the project wins.
    fn probe(&self, joined: &str, dir_only: bool) -> Option<String> {
        for candidate in candidates(joined, dir_only) {
            if let Some(position) = self.index.get(&candidate) {
                return Some(self.sources[*position].0.clone());
            }
        }
        None
    }
}
