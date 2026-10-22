//! Source-file discovery for Styletrace analysis.
//!
//! This stays separate from JSX tracing so directory walking and file filtering
//! rules can evolve without adding more branching to the analyzer itself. Styletrace
//! has no include scope: a symlinked directory is entered once per real target, a link
//! back to an ancestor is cut, and a file is listed once, under its real path when one
//! exists, else under the first alias the walk reaches, so the listing matches what the
//! compiler reads.

use std::fs;
use std::path::{Path, PathBuf};

use rustc_hash::FxHashSet;

use crate::diagnostics::scan_failed;
use crate::resolver::StyleTraceError;

/// One discovery walk: the files listed so far, the canonical identities already listed, the canonical
/// link targets already entered, and the link-alias files waiting for the real tree.
#[derive(Default)]
struct SourceWalk {
    files: Vec<PathBuf>,
    listed: FxHashSet<PathBuf>,
    linked: FxHashSet<PathBuf>,
    deferred: Vec<(PathBuf, PathBuf)>,
}

pub(super) fn discover_source_files(root_dir: &Path) -> Result<Vec<PathBuf>, StyleTraceError> {
    if root_dir.is_file() {
        let file_name = root_dir.file_name().unwrap_or_default().to_string_lossy();
        if is_traceable_source_file(root_dir, &file_name) {
            return Ok(vec![root_dir.to_path_buf()]);
        }
        return Ok(Vec::new());
    }

    let mut walk = SourceWalk::default();
    let root = dunce::canonicalize(root_dir).unwrap_or_else(|_| root_dir.to_path_buf());
    collect_source_files(root_dir, &root, false, &mut walk)?;
    drain_deferred(&mut walk);
    walk.files.sort();
    Ok(walk.files)
}

fn collect_source_files(
    current_dir: &Path,
    canon: &Path,
    via_link: bool,
    walk: &mut SourceWalk,
) -> Result<(), StyleTraceError> {
    let entries = fs::read_dir(current_dir).map_err(|error| {
        StyleTraceError::new(scan_failed(format!(
            "failed to read {}: {error}",
            current_dir.display()
        )))
    })?;
    for entry in entries {
        let entry = entry.map_err(|error| {
            StyleTraceError::new(scan_failed(format!(
                "failed to read dir entry in {}: {error}",
                current_dir.display()
            )))
        })?;
        visit_entry(&entry, canon, via_link, walk)?;
    }
    Ok(())
}

/// Handles one directory entry: a directory is walked into, and a traceable source is listed.
fn visit_entry(
    entry: &fs::DirEntry,
    canon: &Path,
    via_link: bool,
    walk: &mut SourceWalk,
) -> Result<(), StyleTraceError> {
    let path = entry.path();
    let file_name = entry.file_name();
    let name_text = file_name.to_string_lossy();
    if path.is_dir() {
        if should_skip_directory(name_text.as_ref()) {
            return Ok(());
        }
        let link = entry.file_type().is_ok_and(|kind| kind.is_symlink());
        if let Some(child) = child_canon(entry, canon, link, walk) {
            collect_source_files(&path, &child, via_link || link, walk)?;
        }
    } else if is_traceable_source_file(&path, name_text.as_ref()) {
        list_source(path, canon.join(&file_name), via_link, walk);
    }
    Ok(())
}

/// Lists one traceable source: a real path lists it at once, while a link alias waits for the real tree.
fn list_source(path: PathBuf, identity: PathBuf, via_link: bool, walk: &mut SourceWalk) {
    if via_link {
        walk.deferred.push((identity, path));
    } else if walk.listed.insert(identity) {
        walk.files.push(path);
    }
}

/// The canonical directory the walk enters for one directory entry, or None when it must not. A real
/// directory sits canonically under its parent, so its path is the parent's joined with its name. A
/// symlink resolves once: it is cut when its target is an ancestor of the directory holding it, and
/// skipped when an earlier link already entered the same target.
fn child_canon(
    entry: &fs::DirEntry,
    parent: &Path,
    link: bool,
    walk: &mut SourceWalk,
) -> Option<PathBuf> {
    if !link {
        return Some(parent.join(entry.file_name()));
    }
    let target = dunce::canonicalize(entry.path()).ok()?;
    if parent.starts_with(&target) || !walk.linked.insert(target.clone()) {
        return None;
    }
    Some(target)
}

/// Lists the queued link aliases in walk order, each identity once, and only where no real path listed it.
fn drain_deferred(walk: &mut SourceWalk) {
    for (identity, path) in std::mem::take(&mut walk.deferred) {
        if walk.listed.insert(identity) {
            walk.files.push(path);
        }
    }
}

fn should_skip_directory(file_name: &str) -> bool {
    matches!(file_name, "node_modules" | "dist" | "target" | ".git")
}

fn is_traceable_source_file(path: &Path, file_name: &str) -> bool {
    matches!(
        path.extension().and_then(|ext| ext.to_str()),
        Some("ts" | "tsx" | "js" | "jsx" | "mts")
    ) && !file_name.ends_with(".d.ts")
        && !file_name.ends_with(".d.mts")
}

pub(super) fn format_relative_module(
    module_path: &Path,
    source_root: &Path,
    source_root_is_file: bool,
) -> String {
    let base = if source_root_is_file {
        source_root.parent().unwrap_or(source_root)
    } else {
        source_root
    };
    module_path
        .strip_prefix(base)
        .unwrap_or(module_path)
        .to_string_lossy()
        .replace('\\', "/")
        .trim_start_matches('/')
        .to_string()
}

#[cfg(test)]
mod tests {
    use super::discover_source_files;

    /// Discovered paths sit under a canonical root with no verbatim prefix. The test runs on every platform; the
    /// prefix check only bites on Windows.
    #[test]
    fn discovered_paths_carry_no_verbatim_prefix() {
        let dir = std::env::temp_dir().join(format!("styletrace-canonical-{}", std::process::id()));
        std::fs::create_dir_all(dir.join("src")).expect("temp root");
        std::fs::write(dir.join("src/a.tsx"), "export const a = 1;\n").expect("temp file");
        let found = discover_source_files(&dir).expect("discovery");
        assert!(found.iter().all(|path| !path.to_string_lossy().starts_with(r"\\?\")), "{found:?}");
        assert!(found.iter().any(|path| path.ends_with("src/a.tsx")), "{found:?}");
        std::fs::remove_dir_all(&dir).expect("cleanup");
    }
}
