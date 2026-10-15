//! Unit tests for Atlas file discovery. Each test builds a temp tree, runs `discover_files` on it,
//! and asserts the exact paths returned, covering the loop skip, dependency pruning, include anchoring and exclude filtering.
//! Symlink cases are gated to unix because they create links with `std::os::unix::fs`.

use super::*;
use std::fs;

fn fresh_root(name: &str) -> PathBuf {
    let root = std::env::temp_dir().join(format!("atlas_{}_{}", name, std::process::id()));
    if root.exists() {
        fs::remove_dir_all(&root).unwrap();
    }
    fs::create_dir_all(&root).unwrap();
    root
}

fn write(path: &Path, content: &str) {
    fs::create_dir_all(path.parent().unwrap()).unwrap();
    fs::write(path, content).unwrap();
}

fn discover(root: &Path, config: AtlasConfig) -> Vec<PathBuf> {
    Scanner::new(root.to_str().unwrap())
        .discover_files(&config)
        .unwrap()
}

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

#[cfg(unix)]
#[test]
fn test_discovery_skips_symlink_loop() {
    use std::os::unix::fs::symlink;

    let temp_dir = std::env::temp_dir();
    let root = temp_dir.join(format!("atlas_test_loop_{}", std::process::id()));

    // Clean up any existing directory
    if root.exists() {
        fs::remove_dir_all(&root).unwrap();
    }

    let src = root.join("src");
    fs::create_dir_all(&src).unwrap();
    fs::write(root.join("index.ts"), "export const Index = 1;").unwrap();
    fs::write(src.join("Button.tsx"), "export const Button = () => null;").unwrap();
    // Points back at an ancestor, like a pnpm workspace self-link inside node_modules.
    symlink(&root, src.join("self")).unwrap();

    let scanner = Scanner::new(root.to_str().unwrap());
    let files = scanner.discover_files(&AtlasConfig::default()).unwrap();

    // The loop entry is skipped, so each real file is listed exactly once.
    assert_eq!(files.len(), 2);
    assert!(files.iter().any(|f| f.ends_with("index.ts")));
    assert!(files.iter().any(|f| f.ends_with("Button.tsx")));

    // Cleanup
    fs::remove_dir_all(&root).unwrap();
}

#[cfg(unix)]
#[test]
fn test_local_walk_never_enters_node_modules() {
    use std::os::unix::fs::symlink;

    let root = fresh_root("deps");
    write(&root.join("src/Button.tsx"), "export const Button = () => null;");
    let pkg = root.join("node_modules/pkg");
    write(&pkg.join("index.ts"), "export const Pkg = 1;");
    // A dangling link fails any walk that reaches it, and a link back to an ancestor loops.
    symlink(root.join("missing.ts"), pkg.join("dangling.ts")).unwrap();
    symlink("..", pkg.join("loop")).unwrap();

    let files = discover(&root, AtlasConfig::default());

    assert_eq!(files, vec![root.join("src/Button.tsx")]);
    fs::remove_dir_all(&root).unwrap();
}

#[cfg(unix)]
#[test]
fn test_include_follows_symlinked_package_and_prunes_its_dependencies() {
    use std::os::unix::fs::symlink;

    let temp = fresh_root("linked");
    let project = temp.join("project");
    let lib = temp.join("outside/lib");
    write(&project.join("src/App.tsx"), "export const App = () => null;");
    write(&lib.join("src/Card.tsx"), "export const Card = () => null;");
    write(&lib.join("src/node_modules/inner/Bad.tsx"), "export const Bad = () => null;");
    fs::create_dir_all(project.join("node_modules/@fixtures")).unwrap();
    // The link sits under the project and points at a package outside it, as pnpm links do.
    symlink("../../../outside/lib", project.join("node_modules/@fixtures/lib")).unwrap();

    let config = AtlasConfig {
        include: Some(vec!["node_modules/@fixtures/lib/src/**/*.tsx".to_string()]),
        ..Default::default()
    };
    let files = discover(&project, config);

    assert_eq!(
        files,
        vec![
            project.join("node_modules/@fixtures/lib/src/Card.tsx"),
            project.join("src/App.tsx"),
        ]
    );
    fs::remove_dir_all(&temp).unwrap();
}

#[test]
fn test_include_stays_anchored_and_skips_missing_base() {
    let root = fresh_root("anchor");
    write(&root.join("node_modules/pkg/index.ts"), "export const Index = 1;");
    write(&root.join("node_modules/pkg/deep/Nested.ts"), "export const Nested = 1;");

    let config = AtlasConfig {
        include: Some(vec![
            "node_modules/pkg/*.ts".to_string(),
            "missing/dir/**/*.tsx".to_string(),
        ]),
        ..Default::default()
    };
    let files = discover(&root, config);

    // A `*.ts` under a directory matches its direct children only, and a missing base matches nothing.
    assert_eq!(files, vec![root.join("node_modules/pkg/index.ts")]);
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn test_exclude_removes_a_dependency_file_that_an_include_named() {
    let root = fresh_root("named");
    write(&root.join("node_modules/pkg/index.ts"), "export const Index = 1;");
    write(&root.join("node_modules/pkg/index.test.ts"), "export const Test = 1;");

    let config = AtlasConfig {
        include: Some(vec!["node_modules/pkg/**/*.ts".to_string()]),
        exclude: Some(vec!["**/*.test.ts".to_string()]),
        ..Default::default()
    };
    let files = discover(&root, config);

    // The include put both files in the set. The exclude filters that set and drops the test file without walking node_modules.
    assert_eq!(files, vec![root.join("node_modules/pkg/index.ts")]);
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn test_exclude_filters_a_named_dependency_and_leaves_other_trees_alone() {
    let root = fresh_root("filter");
    write(&root.join("src/a.ts"), "export const A = 1;");
    write(&root.join("src/a.test.ts"), "export const ATest = 1;");
    write(&root.join("node_modules/pkg/index.ts"), "export const Index = 1;");
    write(&root.join("node_modules/pkg/index.test.ts"), "export const IndexTest = 1;");
    write(&root.join("node_modules/other/index.ts"), "export const Other = 1;");

    let config = AtlasConfig {
        include: Some(vec!["node_modules/pkg/**/*.ts".to_string()]),
        exclude: Some(vec!["**/*.test.ts".to_string()]),
        ..Default::default()
    };
    let files = discover(&root, config);

    // The include names only pkg, so other never enters the set and the exclude drops the test files from it.
    assert_eq!(
        files,
        vec![root.join("node_modules/pkg/index.ts"), root.join("src/a.ts")]
    );
    fs::remove_dir_all(&root).unwrap();
}

#[cfg(unix)]
#[test]
fn test_exclude_never_walks_an_unnamed_dependency_tree() {
    use std::os::unix::fs::symlink;

    let root = fresh_root("unnamed");
    write(&root.join("node_modules/pkg/index.ts"), "export const Index = 1;");
    write(&root.join("node_modules/other/index.ts"), "export const Other = 1;");
    // A dangling link fails any walk that reaches it, so the exclude must not enter other.
    symlink(root.join("missing.ts"), root.join("node_modules/other/dangling.ts")).unwrap();

    let config = AtlasConfig {
        include: Some(vec!["node_modules/pkg/**/*.ts".to_string()]),
        exclude: Some(vec!["**/*.test.ts".to_string()]),
        ..Default::default()
    };
    let files = discover(&root, config);

    assert_eq!(files, vec![root.join("node_modules/pkg/index.ts")]);
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn test_directory_exclude_drops_files_under_that_directory() {
    let root = fresh_root("legacy_dir");
    write(&root.join("src/keep.ts"), "export const Keep = 1;");
    write(&root.join("src/legacy.ts"), "export const LegacyFile = 1;");
    write(&root.join("src/legacy/old.ts"), "export const Old = 1;");
    write(&root.join("src/legacy/nested/deep.tsx"), "export const Deep = () => null;");

    let config = AtlasConfig {
        exclude: Some(vec!["src/legacy/**".to_string()]),
        ..Default::default()
    };
    let files = discover(&root, config);

    // Every file under src/legacy goes, while a sibling file that only shares its stem stays.
    assert_eq!(files, vec![root.join("src/keep.ts"), root.join("src/legacy.ts")]);
    fs::remove_dir_all(&root).unwrap();
}

#[test]
fn test_split_literal_base_anchors_a_bare_name_under_its_base() {
    assert_eq!(
        split_literal_base("node_modules/pkg/src/**/*.tsx"),
        (PathBuf::from("node_modules/pkg/src"), "**/*.tsx".to_string())
    );
    assert_eq!(split_literal_base("src/*.tsx"), (PathBuf::from("src"), "/*.tsx".to_string()));
    assert_eq!(split_literal_base("src/index.tsx"), (PathBuf::from("src"), "/index.tsx".to_string()));
    assert_eq!(split_literal_base("**/*.tsx"), (PathBuf::new(), "**/*.tsx".to_string()));
    assert_eq!(split_literal_base("./src/**"), (PathBuf::new(), "./src/**".to_string()));
    assert_eq!(split_literal_base("src/"), (PathBuf::from("src"), String::new()));
}
