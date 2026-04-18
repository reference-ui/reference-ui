use crate::atlas::config::AtlasConfig;
use globwalk::GlobWalkerBuilder;
use oxc_span::SourceType;
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

/// A discovered source file with its parsed AST
#[derive(Debug, Clone)]
pub struct SourceFile {
    pub path: PathBuf,
    pub content: String,
    #[allow(dead_code)]
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

        // Always scan local project files recursively.
        self.collect_matches(&mut files, &["**/*.{ts,tsx,js,jsx}".to_string()])?;

        // Apply include patterns
        if let Some(includes) = &config.include {
            for pattern in includes {
                if pattern.starts_with('@') {
                    continue;
                }

                self.collect_matches(&mut files, &[pattern.clone()])?;
            }
        }

        // Apply exclude patterns
        if let Some(excludes) = &config.exclude {
            for pattern in excludes {
                if pattern.contains(':') {
                    continue;
                }

                let excluded = self.collect_glob_matches(&[pattern.clone()])?;
                for path in excluded {
                    files.remove(&path);
                }
            }
        }

        Ok(files.into_iter().collect())
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

    fn collect_matches(
        &self,
        files: &mut BTreeSet<PathBuf>,
        patterns: &[String],
    ) -> Result<(), String> {
        let matches = self.collect_glob_matches(patterns)?;
        for path in matches {
            files.insert(path);
        }
        Ok(())
    }

    fn collect_glob_matches(&self, patterns: &[String]) -> Result<Vec<PathBuf>, String> {
        let walker = GlobWalkerBuilder::from_patterns(&self.root_dir, patterns)
            .follow_links(true)
            .build()
            .map_err(|e| format!("Glob error: {}", e))?;

        let mut matches = Vec::new();
        for entry in walker {
            let entry = entry.map_err(|e| format!("Glob walk error: {}", e))?;
            let path = entry.path().to_path_buf();
            if entry.file_type().is_file() && self.is_source_file(&path) {
                matches.push(path);
            }
        }

        Ok(matches)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_scanner_discovery() {
        let temp_dir = std::env::temp_dir();
        let root = temp_dir.join(format!("atlas_test_{}", std::process::id()));

        // Clean up any existing directory
        if root.exists() {
            fs::remove_dir_all(&root).unwrap();
        }

        // Create test directory
        std::fs::create_dir_all(&root).unwrap();

        // Create test files
        fs::write(root.join("test.tsx"), "export const Test = () => null;").unwrap();
        fs::write(root.join("ignore.txt"), "not a source file").unwrap();

        // Create subdirectory and file
        let subdir = root.join("subdir");
        fs::create_dir_all(&subdir).unwrap();
        fs::write(
            subdir.join("component.ts"),
            "export function Component() {}",
        )
        .unwrap();

        let scanner = Scanner::new(root.to_str().unwrap());
        let files = scanner.discover_files(&AtlasConfig::default()).unwrap();

        // Debug: print what files were found
        println!("Found files: {:?}", files);

        // Should find the TypeScript files
        assert!(files.len() >= 2);
        assert!(files.iter().any(|f| f.ends_with("test.tsx")));
        assert!(files.iter().any(|f| f.ends_with("component.ts")));

        // Cleanup
        fs::remove_dir_all(&root).unwrap();
    }

    #[test]
    fn test_exclude_patterns() {
        let temp_dir = std::env::temp_dir();
        let root = temp_dir.join(format!("atlas_test_exclude_{}", std::process::id()));

        // Clean up any existing directory
        if root.exists() {
            fs::remove_dir_all(&root).unwrap();
        }

        // Create test directory
        std::fs::create_dir_all(&root).unwrap();

        // Create test files
        fs::write(root.join("keep.tsx"), "export const Keep = () => null;").unwrap();
        fs::write(
            root.join("exclude.tsx"),
            "export const Exclude = () => null;",
        )
        .unwrap();

        let scanner = Scanner::new(root.to_str().unwrap());
        let config = AtlasConfig {
            exclude: Some(vec!["**/exclude.tsx".to_string()]),
            ..Default::default()
        };

        let files = scanner.discover_files(&config).unwrap();
        // Should only find the keep.tsx file
        assert!(files.len() >= 1);
        assert!(files.iter().any(|f| f.ends_with("keep.tsx")));
        assert!(!files.iter().any(|f| f.ends_with("exclude.tsx")));

        // Cleanup
        fs::remove_dir_all(&root).unwrap();
    }
}
