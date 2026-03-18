/// Directory name used for installed package lookups.
pub(crate) const NODE_MODULES_DIR: &str = "node_modules";

/// Package metadata file consulted during external resolution.
pub(crate) const PACKAGE_JSON_FILENAME: &str = "package.json";

/// Root declaration fallback inside a package when package metadata does not
/// provide a better entrypoint.
pub(crate) const PACKAGE_INDEX_BASENAME: &str = "index";

/// Scope used by DefinitelyTyped-style declaration packages.
pub(crate) const TYPES_SCOPE_NAME: &str = "@types";

/// Full TypeScript suffixes removed from already-normalized file ids and module
/// paths.
pub(crate) const TS_PATH_SUFFIXES: [&str; 5] = [".d.ts", ".d.mts", ".d.cts", ".ts", ".tsx"];

/// Extension candidates tried when resolving a relative import without an
/// explicit extension.
pub(crate) const TS_PATH_EXTENSIONS: [&str; 5] = ["d.ts", "d.mts", "d.cts", "ts", "tsx"];

/// Index file candidates tried when resolving a directory import.
pub(crate) const TS_INDEX_FILENAMES: [&str; 5] = [
    "index.d.ts",
    "index.d.mts",
    "index.d.cts",
    "index.ts",
    "index.tsx",
];
