//! Import-resolution helpers for the analysis layer.
//!
//! These helpers keep package and relative module resolution out of the main
//! JSX graph traversal so the analyzer stays focused on tracing decisions.
//! [`ModuleResolver`] serves one trace session: staged compile bytes answer
//! probes first, disk answers the rest, and every disk probe memoizes for
//! the session — edges repeat the same misses, so the ladder pays once.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use module_graph::{
    DiskFs, ExtensionPolicy, FileSystem, ModuleKey, ProbeMemo, SpecifierLadder,
};

use crate::resolver::{
    is_ignorable_module_specifier, prefer_sync_root_source_module, StyleTraceError,
};

/// One session's import resolver over staged bytes plus a probe memo.
/// Staged hits answer `is_file` and reads; canonicalization always
/// reaches disk, so resolutions (and misses) match an unmemoized ladder
/// exactly — a file deleted after the scan still misses.
pub(super) struct ModuleResolver<'s> {
    staged: HashMap<String, &'s str>,
    disk: DiskFs,
    memo: ProbeMemo,
}

impl<'s> ModuleResolver<'s> {
    /// A resolver over the session's staged bytes, keyed raw: probes
    /// hit the raw form and normalize only on miss.
    pub(super) fn new(staged: &'s HashMap<PathBuf, &'s str>) -> Self {
        let staged = staged
            .iter()
            .map(|(path, content)| (path.to_string_lossy().to_string(), *content))
            .collect();
        Self {
            staged,
            disk: DiskFs,
            memo: ProbeMemo::new(),
        }
    }

    pub(super) fn resolve_relative_module(
        &self,
        current_module: &Path,
        source: &str,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        Ok(self.resolve_specifier(current_module, source))
    }

    pub(super) fn resolve_imported_module(
        &self,
        current_module: &Path,
        source: &str,
        sync_root: &Path,
    ) -> Result<Option<PathBuf>, StyleTraceError> {
        if source.starts_with('.') {
            return self.resolve_relative_module(current_module, source);
        }

        if is_ignorable_module_specifier(source) {
            return Ok(None);
        }

        let Some(resolved) = self.resolve_specifier(current_module, source) else {
            return Ok(None);
        };

        Ok(Some(prefer_sync_root_source_module(&resolved, sync_root)))
    }

    /// Resolve `source` authored in `current_module` through the shared
    /// ladder with source-first probing. This mirrors
    /// `resolver::path::resolve_specifier`; it lives here because
    /// `analysis` cannot see that private module directly.
    fn resolve_specifier(&self, current_module: &Path, source: &str) -> Option<PathBuf> {
        let ladder = SpecifierLadder::new(self, ExtensionPolicy::Source);
        let from = ModuleKey::new(&current_module.to_string_lossy());
        ladder
            .resolve(&from, source)
            .ok()
            .map(|key| PathBuf::from(key.as_str()))
    }

    /// Staged bytes for a probe: raw first, normalized on miss.
    fn staged(&self, path: &str) -> Option<&'s str> {
        if let Some(content) = self.staged.get(path) {
            return Some(*content);
        }
        self.staged.get(ModuleKey::new(path).as_str()).copied()
    }
}

impl FileSystem for ModuleResolver<'_> {
    fn read_to_string(&self, path: &str) -> Option<String> {
        if let Some(content) = self.staged(path) {
            return Some(content.to_string());
        }
        self.memo
            .read_to_string(path, |probed| self.disk.read_to_string(probed))
    }

    fn is_file(&self, path: &str) -> bool {
        if self.staged(path).is_some() {
            return true;
        }
        self.memo.is_file(path, |probed| self.disk.is_file(probed))
    }

    fn is_dir(&self, path: &str) -> bool {
        self.memo.is_dir(path, |probed| self.disk.is_dir(probed))
    }

    fn read_dir(&self, path: &str) -> Vec<String> {
        self.disk.read_dir(path)
    }

    fn canonicalize(&self, path: &str) -> Option<String> {
        self.memo
            .canonicalize(path, |probed| self.disk.canonicalize(probed))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Staged bytes answer probes; disk answers the rest, memoized.
    #[test]
    fn staged_first_disk_memoized() {
        let staged = HashMap::from([(
            PathBuf::from("/p/src/app.ts"),
            "export const a = 1;",
        )]);
        let resolver = ModuleResolver::new(&staged);
        assert!(resolver.is_file("/p/src/app.ts"));
        assert!(resolver.is_file("/p/src/./app.ts"));
        assert_eq!(
            resolver.read_to_string("/p/src/app.ts").as_deref(),
            Some("export const a = 1;")
        );
        assert!(!resolver.is_file("/p/src/missing.ts"));
        assert!(!resolver.is_file("/p/src/missing.ts"));
        assert_eq!(resolver.canonicalize("/p/src/missing.ts"), None);
    }

    /// Relative edges resolve through the staged map, not the disk.
    #[test]
    fn relative_edge_resolves_staged() {
        use std::time::{SystemTime, UNIX_EPOCH};
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("expected current time")
            .as_nanos();
        let scratch = std::env::temp_dir().join(format!(
            "reference-rs-module-resolution-{stamp}-{}",
            std::process::id()
        ));
        let src = scratch.join("src");
        std::fs::create_dir_all(&src).expect("expected fixture dir");
        std::fs::write(src.join("app.ts"), "import './b';\n").expect("expected app");
        std::fs::write(src.join("b.ts"), "export const b = 1;\n").expect("expected b");
        let staged = HashMap::from([
            (src.join("app.ts"), "import './b';"),
            (src.join("b.ts"), "export const b = 1;"),
        ]);
        let resolver = ModuleResolver::new(&staged);
        let hit = resolver
            .resolve_relative_module(&src.join("app.ts"), "./b")
            .expect("resolution runs")
            .expect("staged edge resolves");
        let expected = std::fs::canonicalize(src.join("b.ts"))
            .expect("expected canonical b")
            .to_string_lossy()
            .replace('\\', "/");
        assert_eq!(hit, PathBuf::from(expected));
        let miss = resolver
            .resolve_relative_module(&src.join("app.ts"), "./gone")
            .expect("resolution runs");
        assert_eq!(miss, None);
        let _ = std::fs::remove_dir_all(&scratch);
    }
}
