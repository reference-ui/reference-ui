//! The binding walk: one export of one file to its declaring origin.
//! Follows `export … from` hops across files and `export { x }` of an
//! imported `x` through the file's own import edge, collecting every
//! declared name along the trail for mutation poison. A visited set of
//! `(file, export)` pairs guards cycles: re-entering a pair yields no
//! origin, so cyclic chains drop with the use-site diagnostic instead of
//! overflowing the stack. Missing exports and unresolvable specifiers yield
//! no origin the same way; all three stay fail-closed at the walker.

use std::collections::HashMap;

use super::cache::ResolveCache;
use super::exports::ExportShape;
use super::specifier;
use super::{FileValues, Resolved};

/// One walk over the project graph: the files, the shared cache, and the
/// visited pairs of this resolution only. A fresh walk per top-level lookup
/// resets the cycle guard between extractions in one session.
pub struct Walk<'a> {
    files: &'a HashMap<String, FileValues>,
    cache: &'a ResolveCache,
    visited: Vec<(String, String)>,
}

impl<'a> Walk<'a> {
    /// A walk over the graph's files sharing the graph's cache.
    pub fn new(files: &'a HashMap<String, FileValues>, cache: &'a ResolveCache) -> Self {
        Self {
            files,
            cache,
            visited: Vec::new(),
        }
    }

    /// Resolve one export of one file to its declaring origin, if any.
    pub fn file_export(&mut self, file: &str, export: &str) -> Option<Resolved> {
        // ('/proj/src/barrel.ts', 'brand')  →  tokens.ts :: brand
        self.uncached(file, export, Vec::new())
    }

    /// Every declared name behind one export, for mutation poison. Follows
    /// the same edges as the value walk but never reads the bag, so a
    /// mutated origin still names its write even though its init is gone.
    pub fn trail_names(&mut self, file: &str, export: &str) -> Vec<String> {
        let mut names = Vec::new();
        self.collect_names(file, export, &mut names);
        names
    }

    /// The graph file a specifier names from the importing file: the first
    /// ladder candidate present in the graph, relative before bare.
    pub fn probe_target(&self, file: &str, specifier: &str) -> Option<String> {
        specifier::candidates(file, specifier)
            .into_iter()
            .find(|candidate| self.files.contains_key(candidate))
    }

    /// Walk one pair, consulting and filling the cache around the visit.
    /// Outcomes are deterministic per pair — shapes never change mid-compile,
    /// so a pair that cycles always cycles — and every outcome caches.
    fn uncached(&mut self, file: &str, export: &str, trail: Vec<String>) -> Option<Resolved> {
        if self.is_visited(file, export) {
            // a.ts ⇄ b.ts  — the recursive hop finds its own pair visited
            return None;
        }
        let cache = self.cache;
        if let Some(cached) = cache.get(file, export) {
            return cached;
        }
        self.visited.push((file.to_string(), export.to_string()));
        let outcome = self.shape_step(file, export, trail);
        self.visited.pop();
        cache.insert(file, export, outcome.clone());
        outcome
    }

    /// Follow the export shape behind one pair, if the file exports it.
    fn shape_step(&mut self, file: &str, export: &str, trail: Vec<String>) -> Option<Resolved> {
        let files = self.files;
        let values = files.get(file)?;
        match values.exports.get(export) {
            Some(ExportShape::Local(local)) => self.local(file, values, local, trail),
            Some(ExportShape::Hop { imported, specifier }) => {
                self.hop(file, imported, specifier, trail)
            }
            None => None,
        }
    }

    /// Resolve a local export: a declared name, or an imported name's edge.
    fn local(
        &mut self,
        file: &str,
        values: &FileValues,
        local: &str,
        mut trail: Vec<String>,
    ) -> Option<Resolved> {
        trail.push(local.to_string());
        if values.bag.declares(local) {
            // export const brand = 'red'  — the origin, with its trail
            return Some(Resolved {
                file: file.to_string(),
                local: local.to_string(),
                trail,
            });
        }
        let edge = values.imports.get(local)?;
        // import { brand } + export { brand }  — follow the import edge
        self.hop(file, &edge.imported, &edge.specifier, trail)
    }

    /// Resolve one hop: probe the specifier, then resolve in the target file.
    fn hop(
        &mut self,
        file: &str,
        imported: &str,
        specifier: &str,
        trail: Vec<String>,
    ) -> Option<Resolved> {
        // export { brand } from './tokens'  — probe, then walk the target
        let target = self.probe_target(file, specifier)?;
        self.uncached(&target, imported, trail)
    }

    /// Collect every declared name behind one pair into `names`.
    fn collect_names(&mut self, file: &str, export: &str, names: &mut Vec<String>) {
        if self.is_visited(file, export) {
            return;
        }
        self.visited.push((file.to_string(), export.to_string()));
        self.names_step(file, export, names);
        self.visited.pop();
    }

    /// Follow one pair's shape, pushing declared and hop names.
    fn names_step(&mut self, file: &str, export: &str, names: &mut Vec<String>) {
        let files = self.files;
        let Some(values) = files.get(file) else {
            return;
        };
        match values.exports.get(export) {
            Some(ExportShape::Local(local)) => {
                names.push(local.clone());
                if let Some(edge) = values.imports.get(local) {
                    self.names_hop(file, &edge.imported, &edge.specifier, names);
                }
            }
            Some(ExportShape::Hop { imported, specifier }) => {
                names.push(imported.clone());
                self.names_hop(file, imported, specifier, names);
            }
            None => {}
        }
    }

    /// Probe one hop's specifier and collect names in the target file.
    fn names_hop(&mut self, file: &str, imported: &str, specifier: &str, names: &mut Vec<String>) {
        if let Some(target) = self.probe_target(file, specifier) {
            self.collect_names(&target, imported, names);
        }
    }

    /// True when this walk already visits the pair (the cycle guard).
    fn is_visited(&self, file: &str, export: &str) -> bool {
        self.visited
            .iter()
            .any(|(f, e)| f == file && e == export)
    }
}

#[cfg(test)]
mod tests {
    use super::super::{FileValues, ProjectGraph};
    use super::*;
    use crate::extract::constants::collect_local_constants;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;
    use std::path::Path;

    /// A graph over in-memory sources, parsed like the compile pipeline.
    fn graph(sources: &[(&str, &str)]) -> ProjectGraph {
        let mut graph = ProjectGraph::new();
        for (path, content) in sources {
            let allocator = Allocator::default();
            let source_type = SourceType::from_path(Path::new(path))
                .unwrap_or_default()
                .with_typescript(true);
            let ret = Parser::new(&allocator, content, source_type).parse();
            assert!(!ret.panicked, "fixture parses: {path}");
            let bag = collect_local_constants(&ret.program, path, Some(content));
            graph.insert(path.to_string(), FileValues::collect(&ret.program, bag));
        }
        graph
    }

    /// Resolve one import of one file through the file resolver.
    fn resolve(graph: &ProjectGraph, file: &str, imported: &str, spec: &str) -> Option<Resolved> {
        graph.for_file(file).resolve_import(imported, spec)
    }

    #[test]
    fn direct_export_resolves_to_its_file() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { brand } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ]);
        let hit = resolve(&graph, "/p/src/app.ts", "brand", "./tokens").unwrap();
        assert_eq!(hit.file, "/p/src/tokens.ts");
        assert_eq!(hit.local, "brand");
        assert_eq!(hit.trail, vec!["brand".to_string()]);
    }

    #[test]
    fn three_hop_barrel_chain_resolves_to_origin() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { brand } from './third';"),
            ("/p/src/third.ts", "export { brand } from './index';"),
            ("/p/src/index.ts", "export { brand } from './barrel';"),
            ("/p/src/barrel.ts", "export { brand } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ]);
        let hit = resolve(&graph, "/p/src/app.ts", "brand", "./third").unwrap();
        assert_eq!(hit.file, "/p/src/tokens.ts");
        assert_eq!(hit.local, "brand");
    }

    #[test]
    fn aliased_reexport_resolves_by_binding() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { space } from './index';"),
            (
                "/p/src/index.ts",
                "export { gap as space } from './barrel';",
            ),
            ("/p/src/barrel.ts", "export { gap } from './tokens';"),
            ("/p/src/tokens.ts", "export const gap = '4px';"),
        ]);
        let hit = resolve(&graph, "/p/src/app.ts", "space", "./index").unwrap();
        assert_eq!(hit.file, "/p/src/tokens.ts");
        assert_eq!(hit.local, "gap");
    }

    #[test]
    fn import_then_export_follows_the_import_edge() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "import { brand } from './b';\nexport { brand };"),
            ("/p/src/b.ts", "export const brand = 'red';"),
        ]);
        let hit = resolve(&graph, "/p/src/app.ts", "brand", "./a").unwrap();
        assert_eq!(hit.file, "/p/src/b.ts");
        assert_eq!(hit.local, "brand");
    }

    #[test]
    fn cycles_guard_to_nothing() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { brand } from './a';"),
            ("/p/src/a.ts", "export { brand } from './b';"),
            ("/p/src/b.ts", "export { brand } from './a';"),
            ("/p/src/self.ts", "export { x } from './self';"),
        ]);
        assert_eq!(resolve(&graph, "/p/src/app.ts", "brand", "./a"), None);
        assert_eq!(resolve(&graph, "/p/src/app.ts", "x", "./self"), None);
    }

    #[test]
    fn missing_export_and_specifier_resolve_to_nothing() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { nope } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ]);
        assert_eq!(resolve(&graph, "/p/src/app.ts", "nope", "./tokens"), None);
        assert_eq!(resolve(&graph, "/p/src/app.ts", "brand", "./missing"), None);
        assert_eq!(
            resolve(&graph, "/p/src/app.ts", "css", "@reference-ui/react"),
            None
        );
    }

    #[test]
    fn poison_is_precise_to_the_origin_file() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { x } from './tokens';"),
            ("/p/src/tokens.ts", "export const x = 'red';"),
            ("/p/src/other.ts", "let x = 'blue';\nx = 'green';"),
            ("/p/src/stale.ts", "export let y = 'red';\ny = 'blue';"),
        ]);
        // A same-named write in another file never blocks this origin.
        assert!(resolve(&graph, "/p/src/app.ts", "x", "./tokens").is_some());
        // A write in the origin file strips its init, so the walk misses.
        assert_eq!(resolve(&graph, "/p/src/app.ts", "y", "./stale"), None);
    }

    #[test]
    fn repeated_lookups_replay_the_cache() {
        let graph = graph(&[
            ("/p/src/app.ts", "import { brand } from './barrel';"),
            ("/p/src/barrel.ts", "export { brand } from './tokens';"),
            ("/p/src/tokens.ts", "export const brand = 'red';"),
        ]);
        let first = resolve(&graph, "/p/src/app.ts", "brand", "./barrel");
        let second = resolve(&graph, "/p/src/app.ts", "brand", "./barrel");
        assert_eq!(first, second);
        assert!(first.is_some());
    }
}
