//! The shared extraction session and its host gating.
//!
//! `ExtractContext` is the session the `jsx`, `css`, and `recipe` passes
//! share: it answers host membership (`allows_jsx_tag`, `host_owns`),
//! reports located diagnostics, and mints the `ObjectWalk` /
//! `ExpressionWalk` contexts that lower expressions into wants.
//! `ExtractConfig` carries the borrowed inputs and `ExtractSinks` the
//! borrowed outputs, so the visitor can build an ephemeral context per
//! node without cloning either side.

use std::collections::{BTreeMap, BTreeSet};

use oxc_span::Span;
use rustc_hash::FxHashSet;

use crate::atom::Want;
use crate::diagnostics::adapters::extract::{extract_note, extract_note_with_help};
use crate::diagnostics::{
    byte_span, line_col, Diagnostic, DiagnosticCode, DiagnosticLocation, DiagnosticSeverity,
    DiagnosticSink, DiagnosticsSession, LineIndex, Policy,
};
use crate::recipes::Recipe;
use base_system::BreakpointScale;

use super::bindings::{self, ExtractBindings};
use super::expressions::{BagSemantics, ExpressionWalk, ObjectWalk};
use super::harvest;
use super::jsx_hosts::JsxHosts;
use super::recipes::selection::{RecipeBinding, TentativeSelection};
use super::scope::{BindingInit, BindingKind, Lookup, ScopeChain, ScopeId, Scoped, ROOT_SCOPE};

/// Configuration references passed into style extraction contexts.
pub struct ExtractConfig<'a> {
    pub chain: ScopeChain<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: JsxHosts<'a>,
    pub owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    pub shadowed: &'a [FxHashSet<String>],
}

/// Mutable collections the extract walk writes into.
pub struct ExtractSinks<'a> {
    pub wants: &'a mut Vec<Want>,
    pub recipes: &'a mut Vec<Recipe>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: &'a mut Vec<crate::runtime::AuthoredDeclaration>,
    pub sinks: &'a mut Vec<harvest::Sink>,
    pub session: &'a mut DiagnosticsSession,
    pub recipe_bindings: &'a mut Vec<RecipeBinding>,
    pub tentative: &'a mut Vec<TentativeSelection>,
}

/// Context for extracting style declarations across an AST file.
pub struct ExtractContext<'a> {
    pub file: &'a str,
    pub source: Option<&'a str>,
    line_index: Option<LineIndex>,
    pub chain: ScopeChain<'a>,
    pub scope: ScopeId,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: JsxHosts<'a>,
    pub owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    pub shadowed: &'a [FxHashSet<String>],
    pub recipe_binding: Option<&'a str>,
    pub recipe_binding_span: Option<Span>,
    pub default_recipe_export: bool,
    pub wants: &'a mut Vec<Want>,
    pub recipes: &'a mut Vec<Recipe>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: &'a mut Vec<crate::runtime::AuthoredDeclaration>,
    pub sinks: &'a mut Vec<harvest::Sink>,
    pub session: &'a mut DiagnosticsSession,
    pub recipe_bindings: &'a mut Vec<RecipeBinding>,
    pub tentative: &'a mut Vec<TentativeSelection>,
    pub(crate) missing_graph_reported: bool,
}

impl<'a> ExtractContext<'a> {
    pub fn new(
        file: &'a str,
        source: Option<&'a str>,
        config: ExtractConfig<'a>,
        sinks: ExtractSinks<'a>,
    ) -> Self {
        Self {
            file,
            source,
            line_index: None,
            chain: config.chain,
            scope: ROOT_SCOPE,
            breakpoints: config.breakpoints,
            bindings: config.bindings,
            jsx_hosts: config.jsx_hosts,
            owned_props: config.owned_props,
            shadowed: config.shadowed,
            recipe_binding: None,
            recipe_binding_span: None,
            default_recipe_export: false,
            wants: sinks.wants,
            recipes: sinks.recipes,
            diagnostics: sinks.diagnostics,
            authored: sinks.authored,
            sinks: sinks.sinks,
            session: sinks.session,
            recipe_bindings: sinks.recipe_bindings,
            tentative: sinks.tentative,
            missing_graph_reported: false,
        }
    }

    /// True when this tag is a StyleProps host. An empty host set admits
    /// nothing: the caller reports the missing graph once per file.
    /// Member tags match concatenated hosts (`<Overlay.Content />` admits
    /// `OverlayContent`), the Panda discovery spelling (core parity). A
    /// member tag resolves through its root, so a locally bound root
    /// (`const Tabs = Other`) rebinds every `<Tabs.*>` use and gates it —
    /// unless the root re-admits through its own const object literal (see
    /// `shadowed_member_admitted`), after which membership decides.
    pub fn allows_jsx_tag(&self, name: &str) -> bool {
        if bindings::is_shadowed(self.shadowed, name) {
            return false;
        }
        if let Some((root, member)) = name.split_once('.') {
            if bindings::is_shadowed(self.shadowed, root)
                && !self.shadowed_member_admitted(root, member)
            {
                return false;
            }
        }
        if self.jsx_hosts.contains(name) {
            return true;
        }
        name.contains('.') && self.jsx_hosts.contains(&name.replace('.', ""))
    }

    /// True when a shadowed member root re-admits through the scope table:
    /// `const NS = { Panel: Div }` re-admits `NS.Panel` exactly when the
    /// statically matched member value is itself an admitted host tag. The
    /// root must be a same-file `const` object literal resolved from the
    /// use-site scope, so declaration order never matters; opaque bindings
    /// (aliases, params, functions, imports, `let`/`var`) never re-admit.
    fn shadowed_member_admitted(&self, root: &str, member: &str) -> bool {
        if self.scoped().mutation(root).is_some() {
            return false;
        }
        let Lookup::Local(binding) = self.chain.resolve(root, self.scope) else {
            return false;
        };
        if !matches!(binding.kind, BindingKind::Const) {
            return false;
        }
        let Some(BindingInit::Object(entries)) = &binding.init else {
            return false;
        };
        let Some(value) = entries.get(member).and_then(|prop| prop.ident.as_deref()) else {
            return false;
        };
        !bindings::is_shadowed(self.shadowed, value) && self.jsx_hosts.contains(value)
    }

    /// True when the host's own declaration owns this prop name (§14).
    /// Owned names shadow style props on that host, so the JSX check
    /// consults this before any macro or style-prop test. Member tags
    /// match concatenated hosts, mirroring [`Self::allows_jsx_tag`].
    pub fn host_owns(&self, tag: &str, name: &str) -> bool {
        if let Some(owned) = self.owned_props.get(tag) {
            if owned.contains(name) {
                return true;
            }
        }
        tag.contains('.')
            && self
                .owned_props
                .get(&tag.replace('.', ""))
                .is_some_and(|owned| owned.contains(name))
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics
            .push(location.warning(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Warning, code, message));
    }

    /// Report a warning with instance help at the offending node's span.
    /// The help rides the pushed line and the session fact alike, so the
    /// compiler re-render re-attaches it.
    pub fn warn_help(
        &mut self,
        span: Span,
        code: DiagnosticCode,
        message: impl Into<String>,
        help: Vec<String>,
    ) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(Policy::attach_help(
            location.warning(code, message.clone()),
            help.clone(),
        ));
        self.session.report(extract_note_with_help(
            location,
            DiagnosticSeverity::Warning,
            code,
            message,
            Some(help),
        ));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let message: String = message.into();
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        let location = DiagnosticLocation {
            file: Some(self.file.to_string()),
            line,
            column,
            span: Some(byte_span(span)),
        };
        self.diagnostics.push(location.info(code, message.clone()));
        self.session
            .report(extract_note(location, DiagnosticSeverity::Info, code, message));
    }

    /// Record the missing-graph error once per file. With no hosts
    /// resolvable, style-bearing JSX is skipped instead of scanned.
    pub fn report_missing_graph(&mut self, tag: &str, line: Option<u32>, column: Option<u32>) {
        if self.missing_graph_reported {
            return;
        }
        self.missing_graph_reported = true;
        self.diagnostics.push(
            Diagnostic::error(
                DiagnosticCode::MissingHostGraph,
                format!(
                    "no StyleProps hosts resolvable (missing primitive graph); skipped styles on <{tag}>"
                ),
            )
            .with_location(self.file, line, column),
        );
    }

    /// The identifier lookup handle fixed at this context's use-site scope.
    pub fn scoped(&self) -> Scoped<'a> {
        self.chain.at(self.scope)
    }

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
    ) -> ObjectWalk<'b> {
        self.ensure_line_index();
        ObjectWalk {
            origin,
            important,
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
    ) -> ObjectWalk<'b> {
        self.ensure_line_index();
        ObjectWalk {
            origin,
            important: false,
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
        origin: Option<&'b str>,
        important: bool,
    ) -> ExpressionWalk<'b> {
        self.ensure_line_index();
        ExpressionWalk {
            prop,
            origin,
            important,
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
