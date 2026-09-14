//! Defines the parsing context for styletrace analysis.
//! Encapsulates the configuration and state needed across different parsing functions.
//! Prevents parameter explosion in deeply nested AST traversal.

use std::collections::{BTreeSet, HashMap};
use std::path::Path;
use crate::analysis::model::TraceImport;

/// Shared context for component and factory extraction
pub struct ParserContext<'a> {
    pub path: &'a Path,
    pub workspace_root: &'a Path,
    pub source: &'a str,
    pub style_prop_names: &'a BTreeSet<String>,
    pub primitive_names: &'a BTreeSet<String>,
    pub imports: &'a HashMap<String, TraceImport>,
}
