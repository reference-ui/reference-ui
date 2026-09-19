//! Extension, index, and runtime-remap probing for one joined base path.
//!
//! Takes a base path plus an [`ExtensionPolicy`](super::ExtensionPolicy) and
//! returns the first candidate the filesystem holds: the literal path, the
//! policy's extension spellings, then its index spellings. A base already
//! carrying a runtime extension (`.js`, `.mjs`, `.cjs`) probes the source
//! siblings of its stem first and the literal last, so compiled specifiers
//! remap to sources without shadowing a real runtime file.

use super::ExtensionPolicy;
use crate::FileSystem;

/// Source spellings: atomic's probe order first, then module and declaration
/// spellings that only add hits where atomic missed.
const SOURCE_EXTS: [&str; 11] = [
    "ts", "tsx", "js", "jsx", "mts", "cts", "mjs", "cjs", "d.ts", "d.mts", "d.cts",
];

/// Source index spellings: atomic's three first, then the rest.
const SOURCE_INDEX: [&str; 9] = [
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

/// Declaration spellings, tasty's order verbatim: declarations before sources.
const DECL_EXTS: [&str; 5] = ["d.ts", "d.mts", "d.cts", "ts", "tsx"];

/// Declaration index spellings, tasty's order verbatim.
const DECL_INDEX: [&str; 5] = [
    "index.d.ts",
    "index.d.mts",
    "index.d.cts",
    "index.ts",
    "index.tsx",
];

/// Source siblings for a runtime-extension stem: sources before declarations.
const SOURCE_REMAP: [&str; 7] = ["ts", "tsx", "mts", "cts", "d.ts", "d.mts", "d.cts"];

/// Declaration siblings for a runtime-extension stem: declarations first.
const DECL_REMAP: [&str; 5] = ["d.ts", "d.mts", "d.cts", "ts", "tsx"];

/// Runtime extensions that remap to source siblings.
const RUNTIME_EXTS: [&str; 3] = ["js", "mjs", "cjs"];

/// First hit for a joined base: literal, extensions, then index spellings.
pub(crate) fn probe_base<F: FileSystem>(
    fs: &F,
    policy: ExtensionPolicy,
    base: &str,
) -> Option<String> {
    if fs.is_file(base) {
        return Some(base.to_string());
    }
    probe_suffixed(fs, base, extensions(policy))
        .or_else(|| probe_index(fs, base, index_names(policy)))
}

/// First hit for a runtime-extension path: stem siblings, then the literal.
pub(crate) fn probe_runtime<F: FileSystem>(
    fs: &F,
    policy: ExtensionPolicy,
    path: &str,
) -> Option<String> {
    let stem = strip_runtime_ext(path)?;
    probe_suffixed(fs, &stem, remap(policy)).or_else(|| probe_literal(fs, path))
}

/// True when the path ends in a remappable runtime extension.
pub(crate) fn has_runtime_ext(path: &str) -> bool {
    strip_runtime_ext(path).is_some()
}

/// The stem when `path` ends in `.js`, `.mjs`, or `.cjs`.
fn strip_runtime_ext(path: &str) -> Option<String> {
    for ext in RUNTIME_EXTS {
        if let Some(stem) = path.strip_suffix(&format!(".{ext}")) {
            if !stem.is_empty() && !stem.ends_with('/') {
                return Some(stem.to_string());
            }
        }
    }
    None
}

/// The literal path when it names a file.
fn probe_literal<F: FileSystem>(fs: &F, path: &str) -> Option<String> {
    fs.is_file(path).then(|| path.to_string())
}

/// First `base.suffix` hit in table order.
fn probe_suffixed<F: FileSystem>(fs: &F, base: &str, suffixes: &[&str]) -> Option<String> {
    suffixes.iter().find_map(|suffix| {
        let candidate = format!("{base}.{suffix}");
        probe_literal(fs, &candidate)
    })
}

/// First `base/name` hit in table order.
fn probe_index<F: FileSystem>(fs: &F, base: &str, names: &[&str]) -> Option<String> {
    names.iter().find_map(|name| {
        let candidate = format!("{base}/{name}");
        probe_literal(fs, &candidate)
    })
}

/// Extension spellings for the policy.
fn extensions(policy: ExtensionPolicy) -> &'static [&'static str] {
    match policy {
        ExtensionPolicy::Source => &SOURCE_EXTS,
        ExtensionPolicy::Declarations => &DECL_EXTS,
    }
}

/// Index spellings for the policy.
fn index_names(policy: ExtensionPolicy) -> &'static [&'static str] {
    match policy {
        ExtensionPolicy::Source => &SOURCE_INDEX,
        ExtensionPolicy::Declarations => &DECL_INDEX,
    }
}

/// Stem siblings for the policy.
fn remap(policy: ExtensionPolicy) -> &'static [&'static str] {
    match policy {
        ExtensionPolicy::Source => &SOURCE_REMAP,
        ExtensionPolicy::Declarations => &DECL_REMAP,
    }
}
