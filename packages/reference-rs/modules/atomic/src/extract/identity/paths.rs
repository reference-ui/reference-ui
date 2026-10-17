//! Path and hop helpers for the identity walk: the hop a named or local export implies, and the
//! spellings a relative specifier may resolve to. `named_hop` and `local_hop` read an export map
//! and return the next hop the walk follows, while `candidates` and `strip_relative` turn a
//! specifier into the file spellings the caller probes against the sources. Nothing here touches
//! the file system. Takes export maps, names, and specifiers; emits hops, normalized paths, and
//! candidate spellings.

use super::super::identity_map::{ExportMap, FileImport, NamedTarget};
use super::{Hop, RelativeRef};

/// The cross-module hop a named export implies; `None` for opaque locals and unknown names.
pub(super) fn named_hop<'m>(map: &'m ExportMap, name: &str) -> Option<Hop<'m>> {
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
pub(super) fn candidates(joined: &str, dir_only: bool) -> Vec<String> {
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
pub(super) fn strip_relative(specifier: &str) -> Option<RelativeRef<'_>> {
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
pub(super) fn dir_of(path: &str) -> &str {
    path.rsplit_once('/').map_or("", |(dir, _)| dir)
}

/// Lexical path normalization: both separators to `/`, `.` dropped, `..` popped.
pub(super) fn normalize_path(path: &str) -> String {
    // Pieces never exceed separators plus one, and each piece pushes at
    // most once, so the separator count bounds the parts vec exactly.
    let separators = path
        .bytes()
        .filter(|byte| *byte == b'/' || *byte == b'\\')
        .count();
    let mut parts: Vec<&str> = Vec::with_capacity(separators + 1);
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
