//! Defines the parsing context for styletrace analysis.
//! Encapsulates the configuration and state needed across different parsing functions.
//! Prevents parameter explosion in deeply nested AST traversal. It also carries the module's type-cut
//! sink: prop-type traces report the guard limits they hit here, and the module record keeps them.

use crate::analysis::model::TraceImport;
use crate::analysis::surface::StyleSurface;
use crate::resolver::GuardCut;
use rustc_hash::FxHashMap;
use std::cell::RefCell;
use std::path::Path;

/// Shared context for component and factory extraction
pub struct ParserContext<'a> {
    pub path: &'a Path,
    pub workspace_root: &'a Path,
    pub source: &'a str,
    pub surface: &'a StyleSurface,
    pub imports: &'a FxHashMap<String, TraceImport>,
    /// Guard limits the prop-type traces of this module hit, in discovery order, without repeats.
    pub type_cuts: RefCell<Vec<GuardCut>>,
}

impl ParserContext<'_> {
    /// Record one trace's limit cut, if it hit one. The style and declared traces of one props type can
    /// cut the same declaration, and two components can share a chain; identical cuts collapse to one warning.
    pub fn note_type_cut(&self, cut: Option<GuardCut>) {
        let Some(cut) = cut else {
            return;
        };
        let mut cuts = self.type_cuts.borrow_mut();
        if !cuts.contains(&cut) {
            cuts.push(cut);
        }
    }
}
