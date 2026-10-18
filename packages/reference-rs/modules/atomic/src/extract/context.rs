//! The shared extraction session and its host gating.
//!
//! `ExtractContext` is the session the `jsx`, `css`, and `recipe` passes
//! share: it answers host membership by provenance and roster
//! (`allows_jsx_tag`, `tag_provenance`, `host_owns`),
//! reports located diagnostics, and mints the `ObjectWalk` /
//! `ExpressionWalk` contexts that lower expressions into wants.
//! `ExtractConfig` carries the borrowed inputs and `ExtractSinks` the
//! borrowed outputs, so the visitor can build an ephemeral context per
//! node without cloning either side.

mod diagnostics;
mod walks;

pub use walks::WalkSite;

use oxc_span::Span;
use rustc_hash::FxHashSet;

use crate::atom::Want;
use crate::diagnostics::{Diagnostic, DiagnosticsSession, LineIndex};
use crate::recipes::Recipe;
use base_system::BreakpointScale;

use super::bindings::{self, ExtractBindings};
use super::harvest;
use super::jsx_hosts::JsxHosts;
use super::owned_props::OwnedProps;
use super::provenance::{self, HostGate, TagProvenance};
use super::recipes::selection::{RecipeBinding, TentativeSelection};
use super::scope::{BindingInit, BindingKind, Lookup, ScopeChain, ScopeId, Scoped, ROOT_SCOPE};
use super::wrapper_thread::WrapperThreads;

/// Configuration references passed into style extraction contexts.
pub struct ExtractConfig<'a> {
    pub chain: ScopeChain<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: JsxHosts<'a>,
    pub owned_props: OwnedProps<'a>,
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
    pub(crate) recipe_bindings: &'a mut Vec<RecipeBinding>,
    pub(crate) tentative: &'a mut Vec<TentativeSelection>,
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
    pub owned_props: OwnedProps<'a>,
    pub wrapper_threads: Option<&'a WrapperThreads>,
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
    pub(crate) recipe_bindings: &'a mut Vec<RecipeBinding>,
    pub(crate) tentative: &'a mut Vec<TentativeSelection>,
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
            wrapper_threads: None,
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
    /// `shadowed_member_admitted`), after which membership decides. A root
    /// bound to an installed package is never an own host, whatever its
    /// name: `Button` from any package takes the external path.
    pub fn allows_jsx_tag(&self, name: &str) -> bool {
        if bindings::is_shadowed(self.shadowed, name) {
            // A shadowed plain tag is a host only through its alias chain;
            // the chain verdict replaces membership below (the alias name
            // itself is never configured). Dotted names never shadow, so
            // member tags always fall through to the root check.
            return self.shadowed_plain_admitted(name);
        }
        if let Some((root, member)) = name.split_once('.') {
            if bindings::is_shadowed(self.shadowed, root)
                && !self.shadowed_member_admitted(root, member)
            {
                return false;
            }
        }
        !self.binds_package(name) && self.host_gate().names_host(name)
    }

    /// The provenance of a tag's root here: a scope binding outranks any import.
    pub fn tag_provenance(&self, tag: &str) -> &'a TagProvenance {
        provenance::classify(self.bindings, self.shadowed, provenance::tag_root(tag))
    }

    /// True when the tag's root is an unshadowed package-bound import.
    fn binds_package(&self, tag: &str) -> bool {
        matches!(self.tag_provenance(tag), TagProvenance::Package(_))
    }

    /// The scope-free host gate over this file's roster and provenance.
    pub fn host_gate(&self) -> HostGate<'a> {
        HostGate {
            hosts: self.jsx_hosts,
            bindings: self.bindings,
        }
    }

    /// True when a shadowed plain tag re-admits through a same-file const
    /// ident alias chain: `const IconShell = Div` re-admits `<IconShell>`
    /// exactly when the chain ends at an admitted, unshadowed host tag.
    /// Hops resolve lexically (each target from its own declaring scope)
    /// with a cycle guard, so `const A = B; const B = A` stays silent.
    /// Member tags keep their object-literal path below.
    fn shadowed_plain_admitted(&self, name: &str) -> bool {
        if name.contains('.') {
            return false;
        }
        let mut seen = FxHashSet::default();
        let mut current = name.to_string();
        let mut scope = self.scope;
        loop {
            if !seen.insert(current.clone()) {
                return false;
            }
            let Some((decl, target)) = self.chain.alias_edge(&current, scope) else {
                return !bindings::is_shadowed(self.shadowed, &current)
                    && self.host_gate().admits(&current);
            };
            current = target;
            scope = decl;
        }
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
        !bindings::is_shadowed(self.shadowed, value) && self.host_gate().admits(value)
    }

    /// True when the host's own declaration owns this prop name (§14).
    /// Owned names shadow style props on that host, so the JSX check
    /// consults this before any macro or style-prop test. Member tags
    /// match concatenated hosts, mirroring [`Self::allows_jsx_tag`], and
    /// this file's own components answer beside the exported ones.
    pub fn host_owns(&self, tag: &str, name: &str) -> bool {
        self.owned_props.owns(tag, name)
    }

    /// True when the tag threads `css` into a host (inner rebinds veto).
    pub fn threads_css(&self, tag: &str) -> bool {
        !bindings::is_inner_shadowed(self.shadowed, tag)
            && self.wrapper_threads.is_some_and(|t| t.threads_css(tag))
    }

    /// The identifier lookup handle fixed at this context's use-site scope.
    pub fn scoped(&self) -> Scoped<'a> {
        self.chain.at(self.scope)
    }
}
