//! Library-name sentinels shared across tasty modules.
//! Names the user-owned source library so the scanner, extractor, and emitter agree on which files are user code.

/// Sentinel library name used for user-owned source files that do not come from
/// an external package.
pub(crate) const USER_LIBRARY_NAME: &str = "user";
