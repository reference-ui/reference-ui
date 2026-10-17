//! Discovers the TypeScript and JavaScript files Atlas parses under a project root.
//! The local walk and every include walk prune node_modules and .git subtrees, so dependency trees are read only when a pattern names them.
//! Each include walks from the literal directory it names, and symlinked packages resolve through their link path.
//! Excludes never walk: they filter the discovered set with gitignore-style override matching, so an exclude can drop a dependency file that an include named.
//! A link back to an ancestor is skipped rather than failing the scan, and results are sorted root-joined paths, never canonicalized.

mod patterns;
#[cfg(test)]
mod tests;

use crate::config::AtlasConfig;
use globwalk::{GlobWalkerBuilder, WalkError};
use ignore::overrides::OverrideBuilder;
use oxc_span::SourceType;
use patterns::split_literal_base;
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

/// Directory that holds installed dependencies. Walks skip it unless a pattern names it.
const DEPENDENCY_DIR: &str = "node_modules";

/// A discovered source file with its parsed AST
#[derive(Debug, Clone)]
pub struct SourceFile {
    pub path: PathBuf,
    pub content: String,
    pub source_type: SourceType,
}

/// Scanner for discovering TypeScript/JavaScript files in a project
pub struct Scanner {
    root_dir: PathBuf,
}

impl Scanner {
    pub fn new(root_dir: &str) -> Self {
        Self {
            root_dir: PathBuf::from(root_dir),
        }
    }

    /// Discover all files matching the include/exclude patterns
    pub fn discover_files(&self, config: &AtlasConfig) -> Result<Vec<PathBuf>, String> {
        let mut files = BTreeSet::new();
        let includes = config.include.as_deref().unwrap_or_default();

        // Always scan local project files recursively, without entering dependency trees.
        let local = self.walk_sources(&self.root_dir, &["**/*.{ts,tsx,js,jsx}".to_string()], true)?;
        files.extend(local);

        // Apply include patterns
        for pattern in includes.iter().filter(|pattern| !pattern.starts_with('@')) {
            files.extend(self.include_matches(pattern)?);
        }

        // Excludes filter the set instead of walking, so a dependency an include named is still dropped
        // without re-reading the dependency trees the includes skipped.
        if let Some(excludes) = &config.exclude {
            self.apply_excludes(&mut files, excludes)?;
        }

        Ok(files.into_iter().collect())
    }

    /// Removes from `files` every path that an exclude pattern matches. Nothing is walked: each pattern
    /// compiles to a gitignore-style override rooted at the project and is matched against paths already found.
    fn apply_excludes(
        &self,
        files: &mut BTreeSet<PathBuf>,
        excludes: &[String],
    ) -> Result<(), String> {
        for pattern in excludes.iter().filter(|pattern| !pattern.contains(':')) {
            let matcher = OverrideBuilder::new(&self.root_dir)
                .add(pattern)
                .and_then(|builder| builder.build())
                .map_err(|e| format!("Glob error: {}", e))?;
            files.retain(|path| !matcher.matched(path, false).is_whitelist());
        }
        Ok(())
    }

    /// Parse a source file and return the AST
    pub fn parse_file(&self, path: &Path) -> Result<SourceFile, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file {}: {}", path.display(), e))?;

        let source_type = SourceType::from_path(path).unwrap_or_else(|_| {
            // Default to TypeScript if we can't determine the type
            SourceType::tsx()
        });

        Ok(SourceFile {
            path: path.to_path_buf(),
            content,
            source_type,
        })
    }

    /// Parse multiple files
    pub fn parse_files(&self, paths: &[PathBuf]) -> Result<Vec<SourceFile>, String> {
        let mut results = Vec::new();

        for path in paths {
            match self.parse_file(path) {
                Ok(file) => results.push(file),
                Err(e) => return Err(e),
            }
        }

        Ok(results)
    }

    /// Matches one include pattern. The walk starts at the literal directory the pattern names, so
    /// `src/**/*.tsx` never reads the rest of the project.
    fn include_matches(&self, pattern: &str) -> Result<Vec<PathBuf>, String> {
        let (base, glob) = split_literal_base(pattern);
        if glob.is_empty() {
            return Ok(Vec::new());
        }

        let dir = self.root_dir.join(&base);
        // A base that does not exist matches nothing, as a walk of the whole root would.
        if !base.as_os_str().is_empty() && dir.symlink_metadata().is_err() {
            return Ok(Vec::new());
        }

        self.walk_sources(&dir, std::slice::from_ref(&glob), !glob.contains(DEPENDENCY_DIR))
    }

    /// Check if a file is a relevant source file
    fn is_source_file(&self, path: &Path) -> bool {
        if let Some(ext) = path.extension() {
            matches!(
                ext.to_str(),
                Some("ts") | Some("tsx") | Some("js") | Some("jsx")
            )
        } else {
            false
        }
    }

    /// Lists source files under `root` that match `patterns`. Prune globs ride along with them, so globwalk
    /// skips a dependency or .git subtree whole instead of filtering its entries one by one.
    fn walk_sources(
        &self,
        root: &Path,
        patterns: &[String],
        prune_dependencies: bool,
    ) -> Result<Vec<PathBuf>, String> {
        let mut globs = patterns.to_vec();
        if prune_dependencies {
            globs.push(format!("!**/{DEPENDENCY_DIR}"));
        }
        globs.push("!**/.git".to_string());

        let walker = GlobWalkerBuilder::from_patterns(root, &globs)
            .follow_links(true)
            .build()
            .map_err(|e| format!("Glob error: {}", e))?;

        let mut matches = Vec::new();
        for entry in walker {
            let Some(entry) = take_walk_entry(entry)? else {
                continue;
            };
            let path = entry.path().to_path_buf();
            if entry.file_type().is_file() && self.is_source_file(&path) {
                matches.push(path);
            }
        }

        Ok(matches)
    }
}

/// Unwraps one glob walker item. A link back to an ancestor yields `Ok(None)`: walkdir does not
/// descend into it and that ancestor is already being walked, so no file is lost. Other errors fail.
fn take_walk_entry<T>(entry: Result<T, WalkError>) -> Result<Option<T>, String> {
    match entry {
        Ok(entry) => Ok(Some(entry)),
        Err(e) if e.loop_ancestor().is_some() => Ok(None),
        Err(e) => Err(format!("Glob walk error: {}", e)),
    }
}
