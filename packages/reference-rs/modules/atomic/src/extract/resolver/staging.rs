//! The staging census: which files the value graph stages. Takes every
//! collected record plus the source set and returns the plan: a file stages
//! iff it carries outgoing specifiers (a walk start) or specifiers reach it
//! (a walk target). Matching is lexical against the in-memory sources —
//! relative specifiers over the ladder's spelling union, order-free — so
//! bare, aliased, and exotic edges conservatively miss into the loader's
//! existing fallback, which serves them bit-identically on demand.

use module_graph::{DefaultExport, ModuleKey, ModuleRecord};
use oxc_ast::ast::Program;
use rustc_hash::FxHashSet;

#[cfg(test)]
use crate::extract::constants::collect_local_constants;
use crate::extract::constants::LocalConstants;

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
    /// Only the differential harness walks a program this way; production
    /// stages through `with_bag` after the ordered collect.
    #[cfg(test)]
    pub(crate) fn collect(program: &Program<'_>, path: &str, content: &str) -> Self {
        Self::with_bag(
            program,
            path,
            collect_local_constants(program, path, Some(content)),
        )
    }

    /// Stage one streamed file around a pre-collected bag: the ordered walk
    /// already collected these constants for the project merge, so the bag
    /// moves in instead of being walked a second time.
    pub(crate) fn with_bag(program: &Program<'_>, path: &str, bag: LocalConstants) -> Self {
        Self {
            key: ModuleKey::new(path),
            record: ModuleRecord::collect(program),
            bag,
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
    probe_union(stem, CENSUS_REMAP.as_slice(), '.', is_source)
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
    let mut out: Vec<&str> = record
        .imports
        .iter()
        .map(|edge| edge.specifier.as_str())
        .collect();
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
    outgoing: FxHashSet<ModuleKey>,
    imported: FxHashSet<ModuleKey>,
}

impl StagingPlan {
    /// Census every record's outgoing specifiers against the source set.
    pub(crate) fn census<'r>(
        pairs: impl Iterator<Item = (ModuleKey, &'r ModuleRecord)>,
        is_source: &dyn Fn(&ModuleKey) -> bool,
    ) -> Self {
        let mut plan = Self {
            outgoing: FxHashSet::default(),
            imported: FxHashSet::default(),
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
            outgoing: FxHashSet::default(),
            imported: FxHashSet::default(),
        }
    }

    /// A plan staging every given key: the full-staging differential arm.
    pub(crate) fn full(keys: impl Iterator<Item = ModuleKey>) -> Self {
        Self {
            outgoing: keys.collect(),
            imported: FxHashSet::default(),
        }
    }
}

#[cfg(test)]
mod tests;
