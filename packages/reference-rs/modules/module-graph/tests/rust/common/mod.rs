//! Shared fixtures for the module-graph integration tests.
//!
//! Builds [`MemoryFs`] trees from `(path, content)` pairs, parses sources
//! with the workspace oxc parser for [`ModuleRecord`] collection, and serves
//! a counting [`Loader`] over the same pairs so walk tests share one shape of
//! world. Every helper asserts its input parses: a bad fixture fails loudly
//! instead of testing the parser's error recovery.
//!
//! Each test binary compiles this module but uses only its own helpers, so
//! per-binary dead code is expected and silenced here, once, at the source.

#![allow(dead_code)]

use std::collections::HashMap;
use std::path::Path;

use module_graph::{Loader, MemoryFs, ModuleKey, ModuleRecord};
use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

/// A [`MemoryFs`] holding `files`, keyed by normalized path.
pub fn fs(files: &[(&str, &str)]) -> MemoryFs {
    let mut out = MemoryFs::new();
    for (path, content) in files {
        out.insert(path, content);
    }
    out
}

/// Parse `source` as TypeScript and collect its module record.
pub fn collect(source: &str) -> ModuleRecord {
    let allocator = Allocator::default();
    let ret = Parser::new(&allocator, source, SourceType::ts()).parse();
    assert!(!ret.panicked, "fixture parses: {source}");
    ModuleRecord::collect(&ret.program)
}

/// A [`Loader`] over in-memory sources, counting loads for memo tests.
/// Sources parse by file extension; missing or panicking files load as `None`.
pub struct TestLoader {
    sources: HashMap<String, String>,
    /// How many `load` calls ran, including misses.
    pub loads: usize,
}

impl TestLoader {
    /// A loader over `files`, keyed by normalized path.
    pub fn new(files: &[(&str, &str)]) -> Self {
        let mut sources = HashMap::new();
        for (path, content) in files {
            sources.insert(
                ModuleKey::new(path).as_str().to_string(),
                content.to_string(),
            );
        }
        Self { sources, loads: 0 }
    }
}

impl Loader for TestLoader {
    fn load(&mut self, key: &ModuleKey) -> Option<ModuleRecord> {
        self.loads += 1;
        let source = self.sources.get(key.as_str())?;
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(Path::new(key.as_str()))
            .unwrap_or_default()
            .with_typescript(true);
        let ret = Parser::new(&allocator, source, source_type).parse();
        if ret.panicked {
            return None;
        }
        Some(ModuleRecord::collect(&ret.program))
    }
}
