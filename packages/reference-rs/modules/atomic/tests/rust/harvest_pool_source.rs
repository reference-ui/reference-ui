//! Fixture reader and pool collector for the harvest census: walks the enterprise fixture's sources
//! in sorted order and parses each one with the same oxc options that `compile()` uses. Takes the
//! fixture root and emits the `(path, content)` pairs, plus the harvest pool that `collect_pool`
//! builds from their parses. Source keys are fixture-relative with forward slashes, so the census
//! JSON stays stable across machines.

use std::path::Path;

use atomic::extract::harvest::collect_pool;
use oxc_allocator::Allocator;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;

use super::FIXTURE_SRC;

/// Collect every compile-input source under the fixture dir, sorted.
pub(crate) fn fixture_sources() -> Vec<(String, String)> {
    let mut files = Vec::new();
    collect_dir(Path::new(FIXTURE_SRC), &mut files);
    files.sort();
    files
}

/// Recursively gather `.ts/.tsx/.js/.jsx` sources, mirroring the case helper.
fn collect_dir(dir: &Path, files: &mut Vec<(String, String)>) {
    let entries = std::fs::read_dir(dir).expect("fixture src dir reads");
    for entry in entries {
        let entry = entry.expect("fixture dir entry reads");
        let path = entry.path();
        if path.is_dir() {
            collect_dir(&path, files);
            continue;
        }
        let is_source = path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| matches!(ext, "ts" | "tsx" | "js" | "jsx"));
        if is_source {
            let content = std::fs::read_to_string(&path).expect("fixture file reads");
            files.push((path_to_key(&path), content));
        }
    }
}

/// Stable source key: the fixture-relative path with forward slashes.
fn path_to_key(path: &Path) -> String {
    path.components()
        .map(|part| part.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

/// Parse every source with `compile()`'s options and collect the pool.
pub(crate) fn pool_for_sources(sources: &[(String, String)]) -> atomic::extract::harvest::HarvestPool {
    let allocators: Vec<Allocator> = sources.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<ParserReturn<'_>> = sources
        .iter()
        .zip(allocators.iter())
        .map(|((path, content), allocator)| parse_source(path, content, allocator))
        .collect();
    collect_pool(&parsed, &vec![false; parsed.len()])
}

/// One source parsed exactly as `compile()` parses it: JSX follows the
/// extension, TypeScript always on.
fn parse_source<'a>(
    path: &str,
    content: &'a str,
    allocator: &'a Allocator,
) -> ParserReturn<'a> {
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    Parser::new(allocator, content, source_type).parse()
}
