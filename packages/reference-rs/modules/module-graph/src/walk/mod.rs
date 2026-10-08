//! The origin walk: one binding in one file to the file that declares it.
//!
//! [`BindingWalk::resolve_binding`] follows named import edges through the
//! ladder and `export … from` hops across files; stars fan out in the child
//! module. Every refusal is [`Refused`] data — cycles, unresolvable
//! specifiers, missing exports, ambiguous stars, and the namespace and
//! default edges the value dialect refuses — so consumers word their own
//! diagnostics. A visited set guards cycles and a memo cache replays
//! repeated lookups; both reset with the walk.

mod star;

use rustc_hash::FxHashMap;

use crate::{
    DefaultExport, ExportShape, FileSystem, Imported, Loader, ModuleGraph, ModuleKey, ModuleRecord,
    SpecifierLadder,
};

/// One resolution: an origin, or the refusal as data.
type Outcome = Result<BindingOrigin, Refused>;

/// Where a binding is declared: the file plus the name it carries there.
#[derive(Debug, Clone, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct BindingOrigin {
    /// The declaring file's key.
    pub file: ModuleKey,
    /// The declared name (`default` for anonymous default exports).
    pub name: String,
}

/// Why a binding has no origin. Data only — consumers word the diagnostic.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Refused {
    /// The walk re-entered a `(file, export)` pair; the trail names the loop.
    Cycle {
        /// The visited origins plus the re-entered pair.
        trail: Vec<BindingOrigin>,
    },
    /// The ladder could not map the specifier, or its target has no record.
    Unresolved {
        /// The importing file's key.
        from: ModuleKey,
        /// The specifier as authored.
        specifier: String,
    },
    /// The file has no such export, or the name is neither declared nor
    /// imported in the importing file.
    MissingExport {
        /// The file that was asked.
        file: ModuleKey,
        /// The name that was asked for.
        name: String,
    },
    /// Two or more star targets declare the name with different origins.
    Ambiguous {
        /// The contested name.
        name: String,
        /// The distinct declaring origins.
        candidates: Vec<BindingOrigin>,
    },
    /// The binding arrives through a namespace import edge.
    Namespace {
        /// The file holding the namespace import.
        file: ModuleKey,
        /// The local namespace name.
        local: String,
    },
    /// The binding arrives through a default import edge.
    Default {
        /// The file holding the default import.
        file: ModuleKey,
        /// The local default name.
        local: String,
    },
}

/// One walk over a graph: the graph, the ladder, and this walk's memo state.
/// Records never change mid-compile, so one walk can serve every lookup.
pub struct BindingWalk<'g, L: Loader, F: FileSystem> {
    graph: &'g mut ModuleGraph<L>,
    ladder: &'g SpecifierLadder<'g, F>,
    visited: Vec<(ModuleKey, String)>,
    cache: FxHashMap<(ModuleKey, String), Outcome>,
}

impl<'g, L: Loader, F: FileSystem> BindingWalk<'g, L, F> {
    /// A walk over `graph` resolving specifiers through `ladder`.
    pub fn new(graph: &'g mut ModuleGraph<L>, ladder: &'g SpecifierLadder<'g, F>) -> Self {
        Self {
            graph,
            ladder,
            visited: Vec::new(),
            cache: FxHashMap::default(),
        }
    }

    /// Resolve a binding used in `from`: a declared name lands at home, a
    /// named import walks to its origin, and default or namespace imports
    /// refuse as data.
    pub fn resolve_binding(&mut self, from: &ModuleKey, local: &str) -> Outcome {
        // ('/p/src/app.ts', 'brand')  →  tokens.ts :: brand
        if let Some(edge) = self.edge_of(from, local) {
            return self.follow_edge(from, local, &edge);
        }
        if self.declares(from, local) {
            return Ok(self.origin(from, local));
        }
        Err(self.missing(from, local))
    }

    /// Resolve one export of one file to its declaring origin, if any.
    pub fn resolve_export(&mut self, file: &ModuleKey, name: &str) -> Outcome {
        if self.is_visited(file, name) {
            return Err(self.cycle(file, name));
        }
        let key = (file.clone(), name.to_string());
        if let Some(cached) = self.cache.get(&key).cloned() {
            return cached;
        }
        self.visited.push(key.clone());
        let outcome = self.export_step(file, name);
        self.visited.pop();
        self.cache.insert(key, outcome.clone());
        outcome
    }

    /// Follow one import edge: named walks, default and namespace refuse.
    fn follow_edge(&mut self, from: &ModuleKey, local: &str, edge: &crate::ImportEdge) -> Outcome {
        match &edge.imported {
            Imported::Named(imported) => self.follow_specifier(from, imported, &edge.specifier),
            Imported::Default => Err(Refused::Default {
                file: from.clone(),
                local: local.to_string(),
            }),
            Imported::Namespace => Err(Refused::Namespace {
                file: from.clone(),
                local: local.to_string(),
            }),
        }
    }

    /// Follow one specifier hop into its target file's export.
    fn follow_specifier(&mut self, from: &ModuleKey, imported: &str, specifier: &str) -> Outcome {
        // export { brand } from './tokens'  — probe, then walk the target
        let target = match self.ladder.resolve(from, specifier) {
            Ok(target) => target,
            Err(miss) => {
                return Err(Refused::Unresolved {
                    from: miss.from,
                    specifier: miss.specifier,
                });
            }
        };
        if !self.has_record(&target) {
            return Err(Refused::Unresolved {
                from: from.clone(),
                specifier: specifier.to_string(),
            });
        }
        self.resolve_export(&target, imported)
    }

    /// Follow the export shape behind one pair: explicit names first, stars
    /// only when no explicit shape names the export.
    fn export_step(&mut self, file: &ModuleKey, name: &str) -> Outcome {
        if name == "default" {
            return self.default_step(file);
        }
        if !self.has_record(file) {
            return Err(self.missing(file, name));
        }
        match self.shape_of(file, name) {
            Some(ExportShape::Local(local)) => self.local_step(file, &local),
            Some(ExportShape::Hop {
                imported,
                specifier,
            }) => self.follow_specifier(file, &imported, &specifier),
            None => self.star_step(file, name),
        }
    }

    /// Resolve a local export: a declared name, or an imported name's edge.
    fn local_step(&mut self, file: &ModuleKey, local: &str) -> Outcome {
        if self.declares(file, local) {
            // export const brand = 'red'  — the origin
            return Ok(self.origin(file, local));
        }
        match self.edge_of(file, local) {
            Some(edge) => self.follow_edge(file, local, &edge),
            None => Err(self.missing(file, local)),
        }
    }

    /// Resolve the default export: local, hop, anonymous, or absent.
    fn default_step(&mut self, file: &ModuleKey) -> Outcome {
        if !self.has_record(file) {
            return Err(self.missing(file, "default"));
        }
        match self.default_of(file) {
            Some(DefaultExport::Local(local)) => self.local_step(file, &local),
            Some(DefaultExport::Hop {
                imported,
                specifier,
            }) => self.follow_specifier(file, &imported, &specifier),
            Some(DefaultExport::Anonymous) => Ok(self.origin(file, "default")),
            None => Err(self.missing(file, "default")),
        }
    }

    /// True when this walk already visits the pair (the cycle guard).
    fn is_visited(&self, file: &ModuleKey, name: &str) -> bool {
        self.visited.iter().any(|(f, e)| f == file && e == name)
    }

    /// The cycle refusal: the visited trail plus the re-entered pair.
    fn cycle(&self, file: &ModuleKey, name: &str) -> Refused {
        let mut trail: Vec<BindingOrigin> = self
            .visited
            .iter()
            .map(|(f, e)| BindingOrigin {
                file: f.clone(),
                name: e.clone(),
            })
            .collect();
        trail.push(BindingOrigin {
            file: file.clone(),
            name: name.to_string(),
        });
        Refused::Cycle { trail }
    }

    /// True when `key` has a record, loading on first use.
    fn has_record(&mut self, key: &ModuleKey) -> bool {
        self.graph.ensure(key).is_some()
    }

    /// The import edge behind a local name, if the file imports it.
    fn edge_of(&mut self, file: &ModuleKey, local: &str) -> Option<crate::ImportEdge> {
        self.graph
            .ensure(file)
            .and_then(|record| record.import_edge(local))
            .cloned()
    }

    /// True when the file declares the name at the top level.
    fn declares(&mut self, file: &ModuleKey, name: &str) -> bool {
        self.graph
            .ensure(file)
            .is_some_and(|record| record.declares(name))
    }

    /// The export shape behind a name, if the file exports it.
    fn shape_of(&mut self, file: &ModuleKey, name: &str) -> Option<ExportShape> {
        self.record_copy(file)
            .and_then(|record| record.exports.get(name).cloned())
    }

    /// The default export, if the file has one.
    fn default_of(&mut self, file: &ModuleKey) -> Option<DefaultExport> {
        self.record_copy(file)
            .and_then(|record| record.exports.default_export().cloned())
    }

    /// The star specifiers of the file, in source order.
    fn stars_of(&mut self, file: &ModuleKey) -> Vec<String> {
        self.record_copy(file)
            .map(|record| record.exports.stars().to_vec())
            .unwrap_or_default()
    }

    /// The explicitly exported names of the file, never `default`.
    fn names_of(&mut self, file: &ModuleKey) -> Vec<String> {
        self.record_copy(file)
            .map(|record| record.exports.names())
            .unwrap_or_default()
    }

    /// A clone of the file's record, loading on first use.
    fn record_copy(&mut self, file: &ModuleKey) -> Option<ModuleRecord> {
        self.graph.ensure(file).cloned()
    }

    /// An origin in `file` under `name`.
    fn origin(&self, file: &ModuleKey, name: &str) -> BindingOrigin {
        BindingOrigin {
            file: file.clone(),
            name: name.to_string(),
        }
    }

    /// The missing-export refusal for `name` in `file`.
    fn missing(&self, file: &ModuleKey, name: &str) -> Refused {
        Refused::MissingExport {
            file: file.clone(),
            name: name.to_string(),
        }
    }

    /// The unresolved-specifier refusal for `spec` from `from`.
    fn unresolved(&self, from: &ModuleKey, spec: &str) -> Refused {
        Refused::Unresolved {
            from: from.clone(),
            specifier: spec.to_string(),
        }
    }
}
