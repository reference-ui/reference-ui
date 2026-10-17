//! Walk constructors for the extraction session: each builds the borrowed walk context that lowers
//! a style object or property expression into wants. Every constructor first makes sure the file's
//! line-start table exists, so walks that report diagnostics can locate them, and files that never
//! walk never pay for the scan. `WalkSite` carries the origin and flags a property walk needs, and
//! `expression_walk` takes it as one value. Takes the session and its per-property inputs; emits
//! `ObjectWalk` and `ExpressionWalk` values that borrow the session.

use crate::atom::Want;
use crate::diagnostics::LineIndex;
use crate::extract::expressions::{BagSemantics, ExpressionWalk, ObjectWalk};

use super::ExtractContext;

/// The origin and flags one property walk carries into its expression leaves.
#[derive(Clone, Copy)]
pub struct WalkSite<'b> {
    /// The tag or name the property belongs to, for origin-aware diagnostics.
    pub origin: Option<&'b str>,
    /// True when the declaration carries `!important`.
    pub important: bool,
    /// True when the style comes from an external host.
    pub external: bool,
}

impl<'a> ExtractContext<'a> {
    /// Build this file's line-start table on first walk construction.
    /// Files that never construct a walk never pay for the scan.
    fn ensure_line_index(&mut self) {
        if self.line_index.is_none() {
            self.line_index = self.source.map(LineIndex::for_source);
        }
    }

    /// Create an ObjectWalk context for traversing a style object.
    pub fn object_walk<'b>(
        &'b mut self,
        origin: Option<&'b str>,
        important: bool,
        external: bool,
    ) -> ObjectWalk<'b> {
        self.ensure_line_index();
        ObjectWalk {
            origin,
            important,
            external,
            file: self.file,
            source: self.source,
            line_index: self.line_index.as_ref(),
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
            authored: Some(self.authored),
            bag: BagSemantics::StyleObject,
            sinks: self.sinks,
            session: self.session,
        }
    }

    /// Walk a style object into an explicit want list (recipe leaves).
    pub fn object_walk_into<'b>(
        &'b mut self,
        origin: Option<&'b str>,
        wants: &'b mut Vec<Want>,
        external: bool,
    ) -> ObjectWalk<'b> {
        self.ensure_line_index();
        ObjectWalk {
            origin,
            important: false,
            external,
            file: self.file,
            source: self.source,
            line_index: self.line_index.as_ref(),
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants,
            diagnostics: self.diagnostics,
            authored: None,
            bag: BagSemantics::StyleObject,
            sinks: self.sinks,
            session: self.session,
        }
    }

    /// Create an ExpressionWalk context for traversing a single property expression.
    pub fn expression_walk<'b>(
        &'b mut self,
        prop: &'b str,
        site: WalkSite<'b>,
    ) -> ExpressionWalk<'b> {
        self.ensure_line_index();
        ExpressionWalk {
            prop,
            origin: site.origin,
            important: site.important,
            external: site.external,
            file: self.file,
            source: self.source,
            line_index: self.line_index.as_ref(),
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
            sinks: self.sinks,
            session: self.session,
        }
    }
}
