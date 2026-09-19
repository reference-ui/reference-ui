//! Binding-aware import resolution for style extraction (SPEC-V2-76).
//! Answers each file's import bindings with the declared export in THAT
//! file: the specifier ladder finds the target, the walk follows `export …
//! from` hops with a cycle guard, and the origin's per-file bag supplies the
//! value. Cycles, missing exports, unresolvable specifiers, and namespace or
//! default imports answer `None`, and the scope chain falls back to the merge
//! bag so unhandled shapes keep their legacy observable. Values stay in the
//! per-file constant bags the merge already built, so export richness matches
//! the merge era exactly. The graph is read-only after collection except for
//! the resolution cache it shares across files.

mod bare;
mod cache;
mod exports;
mod package;
mod patterns;
mod specifier;
mod tsconfig;
mod walk;

use std::collections::{HashMap, HashSet};

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::constants::{collect_local_constants, LocalConstants};
use cache::ResolveCache;
use exports::collect_file;
use specifier::{candidates, normalize_key};
use walk::Walk;

/// Load referenced-but-absent targets into the graph as values-only files.
/// The site set stays the compiled sources, but the value graph follows
/// imports wherever they lead: `node_modules` packages and scope-excluded
/// targets parse into the graph so the walk reads their declared exports.
/// Loaded files never become sites — extraction iterates sources only — and
/// unreadable targets stay absent, leaving their importers on the fallback.
pub fn load_externals(graph: &mut ProjectGraph) {
    let mut visited = HashSet::new();
    for _ in 0..8 {
        let missing = missing_targets(graph, &visited);
        if missing.is_empty() {
            return;
        }
        let mut grew = false;
        for candidate in missing {
            visited.insert(candidate.clone());
            if insert_target(graph, &candidate) {
                grew = true;
            }
        }
        if !grew {
            return;
        }
    }
}

/// Referenced ladder candidates absent from the graph and not yet visited.
fn missing_targets(graph: &ProjectGraph, visited: &HashSet<String>) -> Vec<String> {
    let mut out = Vec::new();
    for (file, values) in graph.files.iter() {
        for edge in values.imports.all_edges() {
            for candidate in candidates(file, &edge.specifier) {
                if !graph.files.contains_key(&candidate) && !visited.contains(&candidate) {
                    out.push(candidate);
                }
            }
        }
    }
    out.sort();
    out.dedup();
    out
}

/// Read, parse, and insert one target as values-only; false when unreadable.
fn insert_target(graph: &mut ProjectGraph, candidate: &str) -> bool {
    let Ok(content) = std::fs::read_to_string(candidate) else {
        return false;
    };
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new(candidate))
        .unwrap_or_default()
        .with_typescript(true);
    let ret = Parser::new(&allocator, &content, source_type).parse();
    if ret.panicked {
        return false;
    }
    let bag = collect_local_constants(&ret.program, candidate, Some(&content));
    graph.insert(candidate.to_string(), FileValues::collect(&ret.program, bag));
    true
}

/// One file's values for the binding walk: its constant bag plus the export
/// shapes and import edges one AST pass collected over it.
#[derive(Debug)]
pub struct FileValues {
    bag: LocalConstants,
    exports: exports::ExportTable,
    imports: exports::ImportMap,
}

impl FileValues {
    /// Collect one file's export shapes and import edges over its bag.
    pub fn collect(program: &oxc_ast::ast::Program<'_>, bag: LocalConstants) -> Self {
        // tokens.ts:  bag { brand: 'red' }  +  shapes { brand: Local }
        let (exports, imports) = collect_file(program);
        Self {
            bag,
            exports,
            imports,
        }
    }
}

/// Every compiled file's values plus the shared resolution cache. Built
/// once per compile beside the merged bag; the externals loader extends it
/// with values-only targets.
#[derive(Debug, Default)]
pub struct ProjectGraph {
    pub(crate) files: HashMap<String, FileValues>,
    cache: ResolveCache,
}

impl ProjectGraph {
    /// An empty graph. Sources arrive via `insert` during collection.
    pub fn new() -> Self {
        Self {
            files: HashMap::new(),
            cache: ResolveCache::new(),
        }
    }

    /// Record one source file's values, normalizing its path into the key.
    /// Per-file bags arrive stripped of mutated inits, so a write in the
    /// origin file already reads as undeclared at the walk.
    pub fn insert(&mut self, path: String, values: FileValues) {
        self.files.insert(normalize_key(&path), values);
    }

    /// A resolver for imports authored in one file of this graph.
    pub fn for_file<'a>(&'a self, file: &'a str) -> FileResolver<'a> {
        FileResolver { graph: self, file }
    }
}

/// One imported name's resolved value, cloned from its declaring origin.
/// Empty in every kind means unresolvable and never enters the map.
#[derive(Debug, Clone, Default)]
pub struct ResolvedExport {
    scalars: Vec<crate::atom::AtomValue>,
    object: Option<super::constants::ConstObject>,
    array: Option<Vec<super::constants::ConstArrayElement>>,
}

impl ResolvedExport {
    /// Every static leaf the origin declares for the imported name.
    pub fn scalars(&self) -> &[crate::atom::AtomValue] {
        &self.scalars
    }

    /// The style object the origin declares for the imported name, if any.
    pub fn object(&self) -> Option<&super::constants::ConstObject> {
        self.object.as_ref()
    }

    /// One member entry of the imported style object, if it carries one.
    pub fn object_prop(&self, prop: &str) -> Option<&super::constants::ObjectProp> {
        self.object.as_ref().and_then(|map| map.get(prop))
    }

    /// The const array the origin declares for the imported name, if any.
    pub fn array(&self) -> Option<&[super::constants::ConstArrayElement]> {
        self.array.as_deref()
    }
}

/// The upfront resolver: the project graph behind the per-file map seam.
/// Built once per compile; each file's imports resolve against it before
/// extraction walks the file.
#[derive(Debug, Default)]
pub struct Resolver {
    graph: ProjectGraph,
}

impl Resolver {
    /// Build the resolver over the compiled sources. Each source parses
    /// once for its bag and export shapes; unparseable files stay out, so
    /// imports targeting them fall back like any unresolvable specifier.
    pub fn new(sources: &[(String, String)], _root_dir: Option<&str>) -> Self {
        let mut graph = ProjectGraph::new();
        for (path, content) in sources {
            insert_source(&mut graph, path, content);
        }
        load_externals(&mut graph);
        Resolver { graph }
    }

    /// Resolve one file's import bindings to cloned origins, keyed by local
    /// name. Namespace and default imports stay out for the rider slices;
    /// so does anything unresolvable — the caller falls back to the bag.
    pub fn resolve_file_imports(
        &self,
        path: &str,
        imports: &[super::scope::ImportRef],
    ) -> HashMap<String, ResolvedExport> {
        let file = self.graph.for_file(path);
        let mut out = HashMap::new();
        for imp in imports {
            let Some(resolved) = file.resolve_import(&imp.imported, &imp.specifier) else {
                continue;
            };
            if let Some(export) = export_value(&self.graph, &resolved) {
                out.insert(imp.local.to_string(), export);
            }
        }
        out
    }
}

/// Parse one source into the graph, skipping files that do not parse.
fn insert_source(graph: &mut ProjectGraph, path: &str, content: &str) {
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    let parser = Parser::new(&allocator, content, source_type);
    let ret = parser.parse();
    if ret.panicked {
        return;
    }
    let bag = super::constants::collect_local_constants(&ret.program, path, Some(content));
    graph.insert(path.to_string(), FileValues::collect(&ret.program, bag));
}

/// Clone an origin's three value kinds, or None when it holds nothing.
fn export_value(graph: &ProjectGraph, resolved: &Resolved) -> Option<ResolvedExport> {
    let bag = graph.files.get(&resolved.file).map(|values| &values.bag)?;
    let export = ResolvedExport {
        scalars: bag.scalar_leaves(&resolved.local).to_vec(),
        object: bag.get_object(&resolved.local).cloned(),
        array: bag
            .get_array(&resolved.local)
            .map(<[super::constants::ConstArrayElement]>::to_vec),
    };
    if export.scalars.is_empty() && export.object.is_none() && export.array.is_none() {
        return None;
    }
    Some(export)
}

/// A resolved import: the origin file and declared name holding the value,
/// plus every declared name along the hops for mutation poison.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resolved {
    /// The origin file holding the declaration.
    pub file: String,
    /// The declared name in the origin file.
    pub local: String,
    /// Every declared name along the hops, consumer-near first.
    pub trail: Vec<String>,
}

/// Imports authored in one file, resolved against the project graph.
#[derive(Debug, Clone, Copy)]
pub struct FileResolver<'a> {
    graph: &'a ProjectGraph,
    file: &'a str,
}

impl<'a> FileResolver<'a> {
    /// Resolve an import to its declaring origin: probe the specifier from
    /// the importing file, then walk the target's export. Namespace and
    /// default imports, cycles, missing exports, and unresolvable specifiers
    /// yield no origin — never stale, never a panic. Poison is precise by
    /// construction: a write in the origin file strips its init, so the walk
    /// reads it as undeclared, while a same-named write in another file never
    /// blocks this origin.
    pub fn resolve_import(&self, imported: &str, specifier: &str) -> Option<Resolved> {
        // import { brand as primary } from './tokens'  →  tokens.ts :: brand
        if imported == "*" || imported == "default" {
            return None;
        }
        let from = normalize_key(self.file);
        let mut walk = Walk::new(&self.graph.files, &self.graph.cache);
        let target = walk.probe_target(&from, specifier)?;
        walk.file_export(&target, imported)
    }

    /// One file's constant bag, for reading a resolved origin's value.
    pub fn bag_for(&self, file: &str) -> Option<&'a LocalConstants> {
        self.graph.files.get(file).map(|values| &values.bag)
    }
}
