//! Source discovery for the atomic compile pipeline.
//! Takes the request's virtual `files` list or `root_dir` and emits sorted
//! `(path, content)` pairs for extraction. The disk scan skips fixed build and
//! metadata directories plus non-source extensions; the include scope then
//! filters both paths to matching files, silently dropping the rest.

use std::path::Path;

use crate::includes::IncludeScope;
use crate::{CompileRequest, VirtualSource};

/// Gather in-scope sources, sorted by path for deterministic extraction.
pub(crate) fn collect(request: &CompileRequest) -> Vec<(String, String)> {
    let mut sources = gather(request);
    sources.sort_unstable_by(|a, b| a.0.cmp(&b.0));
    sources
}

/// Virtual `files` when present, otherwise the filtered `root_dir` scan.
fn gather(request: &CompileRequest) -> Vec<(String, String)> {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return filter_virtual_sources(files, request.root_dir.as_deref(), &scope);
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(Path::new(root_dir), &mut sources);
    }
    sources
        .into_iter()
        .filter(|(path, _)| scope.matches_file(request.root_dir.as_deref(), path))
        .collect()
}

/// Virtual sources inside the include scope; an open scope keeps every file.
fn filter_virtual_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    scope: &IncludeScope,
) -> Vec<(String, String)> {
    files
        .iter()
        .filter(|file| scope.matches_file(root, &file.path))
        .map(|file| (file.path.clone(), file.content.clone()))
        .collect()
}

/// Recursively collect supported sources under `dir`, skipping fixed ignores.
fn scan_dir(dir: &Path, acc: &mut Vec<(String, String)>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    let mut paths: Vec<_> = entries.flatten().map(|entry| entry.path()).collect();
    paths.sort();
    for path in paths {
        handle_dir_entry(&path, acc);
    }
}

/// Descend into kept directories, read supported source files.
fn handle_dir_entry(path: &Path, acc: &mut Vec<(String, String)>) {
    if path.is_dir() {
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        const IGNORE: &[&str] = &[
            "node_modules",
            ".git",
            "dist",
            "build",
            ".turbo",
            "target",
            ".reference-ui",
            ".reference",
            ".pipeline",
        ];
        if !IGNORE.contains(&name) {
            scan_dir(path, acc);
        }
    } else if is_supported_extension(path) {
        if let Ok(content) = std::fs::read_to_string(path) {
            acc.push((path.to_string_lossy().to_string(), content));
        }
    }
}

/// True for the extensions the extractor parses.
fn is_supported_extension(path: &Path) -> bool {
    let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
        return false;
    };
    matches!(ext, "tsx" | "ts" | "jsx" | "js")
}
