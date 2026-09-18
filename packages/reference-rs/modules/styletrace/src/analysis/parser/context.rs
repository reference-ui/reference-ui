//! Defines the parsing context for styletrace analysis.
//! Encapsulates the configuration and state needed across different parsing functions.
//! Prevents parameter explosion in deeply nested AST traversal.

use crate::analysis::model::TraceImport;
use crate::analysis::surface::StyleSurface;
use std::collections::HashMap;
use std::path::Path;

/// Shared context for component and factory extraction
pub struct ParserContext<'a> {
    pub path: &'a Path,
    pub workspace_root: &'a Path,
    pub source: &'a str,
    pub surface: &'a StyleSurface,
    pub imports: &'a HashMap<String, TraceImport>,
}
