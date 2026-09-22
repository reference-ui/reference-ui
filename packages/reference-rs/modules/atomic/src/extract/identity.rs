//! Reference identity through consumer re-exports (SPEC-V2-76 rider, S12).
//!
//! Answers one question per import: does this name trace to a Reference
//! package export? A consumer wrapper (`export { css } from
//! '@reference-ui/react'`) carries site identity to its importers with zero
//! config, replacing Panda's `importMap`. The walk follows named
//! re-exports, local re-exports of imports, and star re-exports across
//! project files with a cycle guard; a consumer declaration anywhere on the
//! path ends the walk. Specifier probing here is relative-only and minimal —
//! the Ph4 resolver (ATM-SITE-54) subsumes it when it lands.

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

use oxc_ast::ast::Program;
use rustc_hash::FxHashMap;

use super::bindings::is_reference_package;
use super::identity_map::{collect_map, parse_export_map, ExportMap, FileImport, NamedTarget};

/// One identity question: does `name` exported from `file` trace to Reference?
struct Query<'a> {
    file: &'a str,
    name: &'a str,
}

/// One hop across a module boundary: resolve `specifier` from the current file, then trace `imported`.
struct Hop<'a> {
    specifier: &'a str,
    imported: &'a str,
}

/// A relative specifier split for probing: the joined path plus whether only a directory fits.
struct RelativeRef<'a> {
    path: &'a str,
    dir_only: bool,
}

/// Project file index plus memoized export maps: everything the identity walk reads.
pub struct IdentityGraph<'s> {
    sources: &'s [(String, String)],
    index: FxHashMap<String, usize>,
    memo: RefCell<FxHashMap<String, Option<Rc<ExportMap>>>>,
    /// Retained programs by source position; a hit reuses the main-phase
    /// parse instead of re-parsing bytes. Missing positions (streamed,
    /// panicked, or never parsed) fall back to a fresh parse.
    programs: Option<&'s HashMap<usize, &'s Program<'s>>>,
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
        programs: &'s HashMap<usize, &'s Program<'s>>,
    ) -> Self {
        Self::build(sources, Some(programs))
    }

    /// Index project sources by normalized path with an optional program map.
    fn build(
        sources: &'s [(String, String)],
        programs: Option<&'s HashMap<usize, &'s Program<'s>>>,
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
        self.trace(&query, &mut Vec::new())
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
        self.trace_terminal(&query, &mut Vec::new())
    }

    /// Follow named exports, then star re-exports, with `stack` as the cycle guard.
    fn trace_terminal(
        &self,
        query: &Query,
        stack: &mut Vec<(String, String)>,
    ) -> Option<(String, String)> {
        let key = (query.file.to_string(), query.name.to_string());
        if stack.contains(&key) {
            return None;
        }
        stack.push(key);
        let found = self.trace_terminal_inner(query, stack);
        stack.pop();
        found
    }

    /// One terminal step: hops follow, declarations name their local, unknown
    /// names try the stars. The caller's binding index decides whether the
    /// terminal local is a recipe binding.
    fn trace_terminal_inner(
        &self,
        query: &Query,
        stack: &mut Vec<(String, String)>,
    ) -> Option<(String, String)> {
        let map = self.export_map(query.file)?;
        if let Some(hop) = named_hop(&map, query.name) {
            return self.follow_terminal_hop(query.file, &hop, stack);
        }
        match map.named_target(query.name) {
            Some(NamedTarget::Local(local)) => Some((query.file.to_string(), local.to_string())),
            Some(NamedTarget::Opaque) => Some((query.file.to_string(), query.name.to_string())),
            _ => self.follow_terminal_stars(query, &map, stack),
        }
    }

    /// Resolve one terminal hop: a Reference source ends the walk with
    /// nothing, a project file recurses.
    fn follow_terminal_hop(
        &self,
        from: &str,
        hop: &Hop,
        stack: &mut Vec<(String, String)>,
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
            stack,
        )
    }

    /// Star re-exports in order, first hit wins; a star never carries
    /// `default`, and a Reference star carries no recipe binding.
    fn follow_terminal_stars(
        &self,
        query: &Query,
        map: &ExportMap,
        stack: &mut Vec<(String, String)>,
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
            if let Some(found) = self.follow_terminal_hop(query.file, &hop, stack) {
                return Some(found);
            }
        }
        None
    }

    /// Follow named exports, then star re-exports, with `stack` as the cycle guard.
    fn trace(&self, query: &Query, stack: &mut Vec<(String, String)>) -> Option<String> {
        let key = (query.file.to_string(), query.name.to_string());
        if stack.contains(&key) {
            return None;
        }
        stack.push(key);
        let found = self.trace_inner(query, stack);
        stack.pop();
        found
    }

    /// One trace step: a hop follows, an opaque export stops, an unknown name tries the stars.
    fn trace_inner(&self, query: &Query, stack: &mut Vec<(String, String)>) -> Option<String> {
        let map = self.export_map(query.file)?;
        if let Some(hop) = named_hop(&map, query.name) {
            return self.follow_hop(query.file, &hop, stack);
        }
        if map.named_target(query.name).is_some() {
            return None;
        }
        self.follow_stars(query, &map, stack)
    }

    /// Resolve one hop: a Reference source terminates, a project file recurses.
    fn follow_hop(
        &self,
        from: &str,
        hop: &Hop,
        stack: &mut Vec<(String, String)>,
    ) -> Option<String> {
        if is_reference_package(hop.specifier) {
            return Some(hop.imported.to_string());
        }
        let target = self.resolve(hop.specifier, from)?;
        self.trace(
            &Query {
                file: &target,
                name: hop.imported,
            },
            stack,
        )
    }

    /// Star re-exports in order, first hit wins; a star never carries `default`.
    /// True star ambiguity is a runtime link error, so order is unobservable.
    fn follow_stars(
        &self,
        query: &Query,
        map: &ExportMap,
        stack: &mut Vec<(String, String)>,
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
            if let Some(found) = self.follow_hop(query.file, &hop, stack) {
                return Some(found);
            }
        }
        None
    }

    /// Memoized export surface of one project file; unparseable files map to `None`.
    fn export_map(&self, path: &str) -> Option<Rc<ExportMap>> {
        if let Some(hit) = self.memo.borrow().get(path).cloned() {
            return hit;
        }
        let parsed = self
            .index
            .get(&normalize_path(path))
            .and_then(|position| self.parse_position(*position))
            .map(Rc::new);
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

/// The cross-module hop a named export implies; `None` for opaque locals and unknown names.
fn named_hop<'m>(map: &'m ExportMap, name: &str) -> Option<Hop<'m>> {
    match map.named_target(name) {
        Some(NamedTarget::ReExport {
            specifier,
            imported,
        }) => Some(Hop {
            specifier,
            imported,
        }),
        Some(NamedTarget::Local(local)) => local_hop(map, local),
        Some(NamedTarget::Opaque) | None => None,
    }
}

/// The hop behind a re-exported local: its value import, unless it is a namespace object.
fn local_hop<'m>(map: &'m ExportMap, local: &str) -> Option<Hop<'m>> {
    let imp: &'m FileImport = map.import_of(local)?;
    if imp.imported.as_ref() == "*" {
        return None;
    }
    Some(Hop {
        specifier: &imp.specifier,
        imported: &imp.imported,
    })
}

/// Probe order for one joined path: `.ts` first so `./ui.js` finds `ui.ts`,
/// then the exact spelling, JS variants, then directory indexes.
fn candidates(joined: &str, dir_only: bool) -> Vec<String> {
    const INDEXES: [&str; 4] = ["index.ts", "index.tsx", "index.js", "index.jsx"];
    let mut out = Vec::new();
    if !dir_only {
        let stem = strip_source_extension(joined);
        out.push(format!("{stem}.ts"));
        out.push(format!("{stem}.tsx"));
        out.push(joined.to_string());
        out.push(format!("{stem}.js"));
        out.push(format!("{stem}.jsx"));
    }
    out.extend(INDEXES.iter().map(|index| format!("{joined}/{index}")));
    out
}

/// Drop a TS/JS source extension so explicit `./ui.js` probes `ui.ts` first.
fn strip_source_extension(path: &str) -> &str {
    const EXTENSIONS: [&str; 8] = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts"];
    for ext in EXTENSIONS {
        if let Some(stem) = path.strip_suffix(ext) {
            return stem;
        }
    }
    path
}

/// The path part of a relative specifier; `None` for bare, aliased, or absolute ids.
fn strip_relative(specifier: &str) -> Option<RelativeRef<'_>> {
    if specifier == "." || specifier == ".." {
        return Some(RelativeRef {
            path: specifier,
            dir_only: true,
        });
    }
    if let Some(rest) = specifier.strip_prefix("./") {
        return Some(RelativeRef {
            path: rest,
            dir_only: rest.is_empty() || rest.ends_with('/'),
        });
    }
    if specifier.starts_with("../") {
        return Some(RelativeRef {
            path: specifier,
            dir_only: specifier.ends_with('/'),
        });
    }
    None
}

/// Parent directory of a normalized path; empty when the path has no parent.
fn dir_of(path: &str) -> &str {
    path.rsplit_once('/').map_or("", |(dir, _)| dir)
}

/// Lexical path normalization: both separators to `/`, `.` dropped, `..` popped.
fn normalize_path(path: &str) -> String {
    let mut parts: Vec<&str> = Vec::new();
    for part in path.split(['/', '\\']) {
        match part {
            "" | "." => {}
            ".." => push_parent(&mut parts),
            _ => parts.push(part),
        }
    }
    parts.join("/")
}

/// One `..` segment: pop a real parent, else keep the leading climb.
fn push_parent(parts: &mut Vec<&str>) {
    if parts.last().is_some_and(|last| *last != "..") {
        parts.pop();
    } else {
        parts.push("..");
    }
}
