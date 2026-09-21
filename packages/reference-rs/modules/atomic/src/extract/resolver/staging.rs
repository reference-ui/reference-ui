//! The staging census: which files the value graph stages. Takes every
//! collected record plus the source set and returns the plan: a file stages
//! iff it carries outgoing specifiers (a walk start) or specifiers reach it
//! (a walk target). Matching is lexical against the in-memory sources —
//! relative specifiers over the ladder's spelling union, order-free — so
//! bare, aliased, and exotic edges conservatively miss into the loader's
//! existing fallback, which serves them bit-identically on demand.

use std::collections::HashSet;

use module_graph::{DefaultExport, ModuleKey, ModuleRecord};
use oxc_ast::ast::Program;

use crate::extract::constants::{collect_local_constants, LocalConstants};

/// One retained file's shared parse: path, bytes, and borrowed program.
pub(crate) struct RetainedSource<'s> {
    pub(crate) path: &'s str,
    pub(crate) content: &'s str,
    pub(crate) program: &'s Program<'s>,
}

/// One streamed file's carried staging: module record plus literal bag,
/// both owned; the program never stages and refines by re-parse on demand.
pub(crate) struct StreamedSource {
    pub(crate) key: ModuleKey,
    pub(crate) record: ModuleRecord,
    pub(crate) bag: LocalConstants,
}

impl StreamedSource {
    /// Stage one streamed file from its transient program: record plus bag.
    pub(crate) fn collect(program: &Program<'_>, path: &str, content: &str) -> Self {
        Self {
            key: ModuleKey::new(path),
            record: ModuleRecord::collect(program),
            bag: collect_local_constants(program, path, Some(content)),
        }
    }
}

/// Source extension spellings for the staging census: the ladder's
/// `ExtensionPolicy::Source` union, order-free (membership only).
const CENSUS_EXTS: [&str; 11] = [
    "ts", "tsx", "js", "jsx", "mts", "cts", "mjs", "cjs", "d.ts", "d.mts", "d.cts",
];

/// Source index spellings for the staging census: the ladder's union.
const CENSUS_INDEX: [&str; 9] = [
    "index.ts",
    "index.tsx",
    "index.js",
    "index.jsx",
    "index.mts",
    "index.cts",
    "index.mjs",
    "index.cjs",
    "index.d.ts",
];

/// Source siblings for a runtime-extension stem: the ladder's remap union.
const CENSUS_REMAP: [&str; 7] = ["ts", "tsx", "mts", "cts", "d.ts", "d.mts", "d.cts"];

/// The source key a relative specifier reaches, if any. Probes the ladder's
/// relative spelling union against the source set, most-likely first with
/// early exit; order affects speed only, never membership. Bare, absolute,
/// and empty specifiers match nothing: they resolve outside the sources or
/// miss outright, and the loader's existing fallback serves them as today.
pub(crate) fn match_relative_target(
    from_file: &str,
    specifier: &str,
    is_source: &dyn Fn(&ModuleKey) -> bool,
) -> Option<ModuleKey> {
    if !specifier.starts_with('.') {
        return None;
    }
    // Mirror the ladder's join exactly: slashless importers join without a
    // leading slash, so the census never diverges from the ladder's key.
    let base = match from_file.rfind('/') {
        Some(idx) => format!("{}/{specifier}", &from_file[..idx]),
        None => specifier.to_string(),
    };
    let hit = ModuleKey::new(&base);
    if is_source(&hit) {
        return Some(hit);
    }
    if let Some(hit) = probe_union(&base, CENSUS_EXTS.as_slice(), '.', is_source) {
        return Some(hit);
    }
    if let Some(hit) = probe_union(&base, CENSUS_INDEX.as_slice(), '/', is_source) {
        return Some(hit);
    }
    let stem = runtime_stem(&base)?;
    probe_union(&stem, CENSUS_REMAP.as_slice(), '.', is_source)
}

/// The first `stem{suffix}` spelling in the source set, if any.
fn probe_union(
    stem: &str,
    suffixes: &[&str],
    sep: char,
    is_source: &dyn Fn(&ModuleKey) -> bool,
) -> Option<ModuleKey> {
    suffixes.iter().find_map(|suffix| {
        let hit = ModuleKey::new(&format!("{stem}{sep}{suffix}"));
        is_source(&hit).then_some(hit)
    })
}

/// The stem when a joined base ends in `.js`, `.mjs`, or `.cjs`.
fn runtime_stem(base: &str) -> Option<&str> {
    ["js", "mjs", "cjs"].iter().find_map(|ext| {
        base.strip_suffix(&format!(".{ext}"))
            .filter(|stem| !stem.is_empty() && !stem.ends_with('/'))
    })
}

/// Every outgoing specifier a record carries: value import edges plus
/// `export … from` hops, the default hop, and `export *` stars. Mirrors
/// the four walk-read accessors (`import_edge`, `exports.get`,
/// `default_export`, `stars`); drift here is a soundness bug.
fn outgoing_specifiers(record: &ModuleRecord) -> Vec<&str> {
    let mut out: Vec<&str> = record.imports.iter().map(|edge| edge.specifier.as_str()).collect();
    // Borrowed hop reads (never `names()` clones): the scan stays
    // zero-alloc for hop-free files, which is nearly all of them.
    out.extend(record.exports.hop_specifiers());
    if let Some(DefaultExport::Hop { specifier, .. }) = record.exports.default_export() {
        out.push(specifier.as_str());
    }
    out.extend(record.exports.stars().iter().map(String::as_str));
    out
}

/// The staging plan: which files carry outgoing edges and which files the
/// edges reach. A file stages iff it carries edges (a walk start) or edges
/// reach it (a walk target); everything else unstages and the loader's
/// existing miss path serves it bit-identically on the rare reach.
pub(crate) struct StagingPlan {
    outgoing: HashSet<ModuleKey>,
    imported: HashSet<ModuleKey>,
}

impl StagingPlan {
    /// Census every record's outgoing specifiers against the source set.
    pub(crate) fn census<'r>(
        pairs: impl Iterator<Item = (ModuleKey, &'r ModuleRecord)>,
        is_source: &dyn Fn(&ModuleKey) -> bool,
    ) -> Self {
        let mut plan = Self {
            outgoing: HashSet::new(),
            imported: HashSet::new(),
        };
        for (key, record) in pairs {
            let specs = outgoing_specifiers(record);
            if specs.is_empty() {
                continue;
            }
            plan.outgoing.insert(key.clone());
            for spec in specs {
                if let Some(target) = match_relative_target(key.as_str(), spec, is_source) {
                    plan.imported.insert(target);
                }
            }
        }
        plan
    }

    /// True when the file stages: it starts walks or walks reach it.
    pub(crate) fn stages(&self, key: &ModuleKey) -> bool {
        self.outgoing.contains(key) || self.imported.contains(key)
    }
}

#[cfg(test)]
impl StagingPlan {
    /// A plan staging nothing: the force-unstage differential arm.
    pub(crate) fn empty() -> Self {
        Self {
            outgoing: HashSet::new(),
            imported: HashSet::new(),
        }
    }

    /// A plan staging every given key: the full-staging differential arm.
    pub(crate) fn full(keys: impl Iterator<Item = ModuleKey>) -> Self {
        Self {
            outgoing: keys.collect(),
            imported: HashSet::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    /// Collect one snippet's record, asserting it parses cleanly.
    fn record_of(content: &str) -> ModuleRecord {
        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, content, SourceType::ts()).parse();
        assert!(!ret.panicked, "fixture parses");
        ModuleRecord::collect(&ret.program)
    }

    /// Census one edged file over the given source keys.
    fn census_over(from: &str, content: &str, keys: &[&str]) -> StagingPlan {
        let record = record_of(content);
        let set: HashSet<ModuleKey> = keys.iter().map(|key| ModuleKey::new(key)).collect();
        StagingPlan::census(
            [(ModuleKey::new(from), &record)].into_iter(),
            &|key| set.contains(key),
        )
    }

    #[test]
    fn exact_and_extension_targets_match() {
        let plan = census_over(
            "/v/src/app.ts",
            "import { a } from './tokens'\nimport { b } from './exact.ts'",
            &["/v/src/app.ts", "/v/src/tokens.ts", "/v/src/exact.ts"],
        );
        assert!(plan.stages(&ModuleKey::new("/v/src/app.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/tokens.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/exact.ts")));
    }

    #[test]
    fn index_and_runtime_remap_targets_match() {
        let plan = census_over(
            "/v/src/app.ts",
            "import { a } from './dir'\nimport { b } from './legacy.js'",
            &["/v/src/app.ts", "/v/src/dir/index.ts", "/v/src/legacy.ts"],
        );
        assert!(plan.stages(&ModuleKey::new("/v/src/dir/index.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/legacy.ts")));
    }

    #[test]
    fn bare_absolute_and_empty_match_nothing() {
        for spec in ["@scope/pkg", "pkg/sub", "/abs/path", ""] {
            let target = match_relative_target("/v/src/app.ts", spec, &|_| true);
            assert!(target.is_none(), "{spec}");
        }
        let target = match_relative_target("/v/src/app.ts", "./tokens", &|_| false);
        assert!(target.is_none());
    }

    #[test]
    fn slashless_importers_join_without_a_leading_slash() {
        // Mirrors the ladder's join_under: no dir means no leading slash.
        let target = match_relative_target("app.ts", "./tokens", &|key| {
            key.as_str() == "tokens"
        });
        assert_eq!(target.as_ref().map(ModuleKey::as_str), Some("tokens"));
    }

    #[test]
    fn parent_segments_fold_before_matching() {
        let plan = census_over(
            "/v/src/ui/app.ts",
            "import { r } from '../recipes/one'",
            &["/v/src/ui/app.ts", "/v/src/recipes/one.ts"],
        );
        assert!(plan.stages(&ModuleKey::new("/v/src/recipes/one.ts")));
    }

    #[test]
    fn hops_stars_and_default_hop_carry_outgoing_edges() {
        let plan = census_over(
            "/v/src/barrel.ts",
            "export { a } from './a'\nexport * from './b'\nexport { c as default } from './c'",
            &["/v/src/barrel.ts", "/v/src/a.ts", "/v/src/b.ts", "/v/src/c.ts"],
        );
        assert!(plan.stages(&ModuleKey::new("/v/src/barrel.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/a.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/b.ts")));
        assert!(plan.stages(&ModuleKey::new("/v/src/c.ts")));
    }

    #[test]
    fn edgeless_files_unstage() {
        // Exports, side-effect imports, type imports, namespace-shape stars,
        // and require calls carry no outgoing specifier: all unstage.
        let cases = [
            "export const FACTOR_1 = 8",
            "import './side-effect'",
            "import type { T } from './types'",
            "export * as ns from './tokens'",
            "const y = require('./y')",
            "const z = await import('./z')",
        ];
        for content in cases {
            let record = record_of(content);
            assert!(
                outgoing_specifiers(&record).is_empty(),
                "{content}"
            );
        }
    }

    #[test]
    fn default_and_namespace_edges_count_as_outgoing() {
        // The walk refuses these without loading their targets, but the
        // census still stages both ends: over-staging, the safe direction.
        let record = record_of("import d from './d'\nimport * as n from './n'");
        assert_eq!(outgoing_specifiers(&record).len(), 2);
    }

    /// Local names the scope table binds as imports.
    fn scope_refs(content: &str) -> Vec<String> {
        use crate::extract::constants::LocalConstants;
        use crate::extract::scope;
        let allocator = Allocator::default();
        let ret = Parser::new(&allocator, content, SourceType::ts()).parse();
        assert!(!ret.panicked, "fixture parses");
        let project = LocalConstants::new();
        let mut refs: Vec<String> = scope::collect(&ret.program, &project)
            .import_refs()
            .iter()
            .map(|imp| imp.local.to_string())
            .collect();
        refs.sort();
        refs
    }

    #[test]
    fn scope_refs_match_record_edges() {
        // The FROM-leg invariant: the walk starts exactly where the census
        // stages. Both collectors share the ESM value-import filter.
        let cases = [
            ("import { a, b as c } from './t'", vec!["a", "c"]),
            ("import d from './d'", vec!["d"]),
            ("import * as n from './n'", vec!["n"]),
            ("import type { T } from './t'", vec![]),
            ("import { type T, v } from './t'", vec!["v"]),
            ("import './side-effect'", vec![]),
            ("export const x = 1", vec![]),
        ];
        for (content, expected) in cases {
            let record = record_of(content);
            let mut edged: Vec<String> =
                record.imports.iter().map(|edge| edge.local.clone()).collect();
            edged.sort();
            assert_eq!(edged, expected, "{content}");
            assert_eq!(scope_refs(content), expected, "{content}");
        }
    }
}
