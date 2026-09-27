//! AST visitor dispatching JSX and call sites into the extract passes.
//!
//! `ExtractVisitor` walks the program once, tracking scope shadows and the
//! ambient recipe binding, and builds an ephemeral `ExtractContext` per
//! visited node. The once-per-file missing-graph flag lives on the visitor
//! and syncs across each per-element context. Shadow helpers record only
//! plain identifier bindings; destructured patterns stay unshadowed.

use std::cell::Cell;
use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::{
    BindingPattern, CallExpression, ExportDefaultDeclaration, FormalParameters, JSXOpeningElement,
    TaggedTemplateExpression, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_span::Span;
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::scope::ScopeId as OxcScopeId;
use rustc_hash::FxHashSet;

use crate::atom::Want;
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticsSession};
use crate::recipes::Recipe;
use base_system::BreakpointScale;

use super::bindings::ExtractBindings;
use super::context::{ExtractConfig, ExtractContext, ExtractSinks};
use super::css;
use super::harvest;
use super::jsx;
use super::jsx_hosts::JsxHosts;
use super::recipes;
use super::recipes::selection::{RecipeBinding, TentativeSelection};
use super::scope::{ScopeChain, ScopeId, ROOT_SCOPE};

/// AST visitor collecting style wants and diagnostics from JSX and calls.
pub struct ExtractVisitor<'a> {
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub chain: ScopeChain<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: JsxHosts<'a>,
    pub owned_props: &'a BTreeMap<String, BTreeSet<String>>,
    pub shadows: Vec<FxHashSet<String>>,
    pub scope_stack: Vec<ScopeId>,
    next_scope: ScopeId,
    pub recipe_binding: Option<String>,
    pub recipe_binding_span: Option<Span>,
    pub default_recipe_export: bool,
    pub wants: Vec<Want>,
    pub recipes: Vec<Recipe>,
    pub diagnostics: Vec<Diagnostic>,
    pub authored: Vec<crate::runtime::AuthoredDeclaration>,
    pub sinks: Vec<harvest::Sink>,
    pub session: DiagnosticsSession,
    pub recipe_bindings: Vec<RecipeBinding>,
    pub tentative: Vec<TentativeSelection>,
    missing_graph_reported: bool,
}

impl<'a> ExtractVisitor<'a> {
    pub fn new(file: &'a str, source: Option<&'a str>, config: ExtractConfig<'a>) -> Self {
        Self {
            file,
            source,
            chain: config.chain,
            breakpoints: config.breakpoints,
            bindings: config.bindings,
            jsx_hosts: config.jsx_hosts,
            owned_props: config.owned_props,
            shadows: Vec::new(),
            scope_stack: Vec::new(),
            next_scope: ROOT_SCOPE,
            recipe_binding: None,
            recipe_binding_span: None,
            default_recipe_export: false,
            wants: Vec::new(),
            recipes: Vec::new(),
            diagnostics: Vec::new(),
            authored: Vec::new(),
            sinks: Vec::new(),
            session: DiagnosticsSession::new(),
            recipe_bindings: Vec::new(),
            tentative: Vec::new(),
            missing_graph_reported: false,
        }
    }
}

impl<'a> Visit<'a> for ExtractVisitor<'a> {
    fn enter_scope(&mut self, _flags: ScopeFlags, _scope_id: &Cell<Option<OxcScopeId>>) {
        self.shadows.push(FxHashSet::default());
        // One id per enter_scope in walk order, mirroring the collector, so
        // the use-site scope here is the binding scope there.
        let id = self.next_scope;
        self.next_scope += 1;
        self.scope_stack.push(id);
    }

    fn leave_scope(&mut self) {
        self.shadows.pop();
        self.scope_stack.pop();
    }

    fn visit_formal_parameters(&mut self, params: &FormalParameters<'a>) {
        add_param_shadows(&mut self.shadows, params);
        walk::walk_formal_parameters(self, params);
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        let prev = self.recipe_binding.take();
        let prev_span = self.recipe_binding_span.take();
        self.recipe_binding = binding_ident_name(&decl.id);
        self.recipe_binding_span = binding_ident_span(&decl.id);
        walk::walk_variable_declarator(self, decl);
        self.recipe_binding = prev;
        self.recipe_binding_span = prev_span;
        add_declarator_shadow(&mut self.shadows, decl);
    }

    fn visit_export_default_declaration(&mut self, decl: &ExportDefaultDeclaration<'a>) {
        let prev = self.default_recipe_export;
        self.default_recipe_export = true;
        walk::walk_export_default_declaration(self, decl);
        self.default_recipe_export = prev;
    }

    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        extract_opening(self, elem);
        walk::walk_jsx_opening_element(self, elem);
    }

    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        extract_call(self, call);
        walk::walk_call_expression(self, call);
    }

    fn visit_tagged_template_expression(&mut self, expr: &TaggedTemplateExpression<'a>) {
        extract_tagged_template(self, expr);
        walk::walk_tagged_template_expression(self, expr);
    }
}

fn extract_opening(visitor: &mut ExtractVisitor<'_>, elem: &JSXOpeningElement<'_>) {
    // The per-element context is ephemeral; the once-per-file report flag
    // lives on the visitor and syncs across the call.
    let reported = visitor.missing_graph_reported;
    let mut ctx = visitor_context(visitor);
    ctx.missing_graph_reported = reported;
    jsx::extract(elem, &mut ctx);
    let reported = ctx.missing_graph_reported;
    drop(ctx);
    visitor.missing_graph_reported = reported;
}

fn extract_call(visitor: &mut ExtractVisitor<'_>, call: &CallExpression<'_>) {
    let mut ctx = visitor_context(visitor);
    css::extract(call, &mut ctx);
    recipes::extract(call, &mut ctx);
    recipes::selection::extract_call(call, &mut ctx);
}

/// Diagnose a tagged template on a live `css` binding. The tag is never a
/// site (the object form is the only API), but on a live binding the author
/// meant `css()` and must be told. Any other tag stays silent.
fn extract_tagged_template(visitor: &mut ExtractVisitor<'_>, expr: &TaggedTemplateExpression<'_>) {
    // css`color: red;`  — live binding, diagnosed non-site
    // styled.div`...`  — not our binding, silent
    let mut ctx = visitor_context(visitor);
    if ctx.bindings.css_origin(&expr.tag, ctx.shadowed).is_none() {
        return;
    }
    ctx.warn(
        expr.span,
        DiagnosticCode::TaggedTemplateSite,
        "tagged template is not a css() site; use css({...})",
    );
}

fn visitor_context<'a, 'v: 'a>(visitor: &'a mut ExtractVisitor<'v>) -> ExtractContext<'a> {
    let binding = visitor.recipe_binding.as_deref();
    let binding_span = visitor.recipe_binding_span;
    let default_export = visitor.default_recipe_export;
    let scope = visitor.scope_stack.last().copied().unwrap_or(ROOT_SCOPE);
    let config = ExtractConfig {
        chain: visitor.chain,
        breakpoints: visitor.breakpoints,
        bindings: visitor.bindings,
        jsx_hosts: visitor.jsx_hosts,
        owned_props: visitor.owned_props,
        shadowed: &visitor.shadows,
    };
    let sinks = ExtractSinks {
        wants: &mut visitor.wants,
        recipes: &mut visitor.recipes,
        diagnostics: &mut visitor.diagnostics,
        authored: &mut visitor.authored,
        sinks: &mut visitor.sinks,
        session: &mut visitor.session,
        recipe_bindings: &mut visitor.recipe_bindings,
        tentative: &mut visitor.tentative,
    };
    let mut ctx = ExtractContext::new(visitor.file, visitor.source, config, sinks);
    ctx.recipe_binding = binding;
    ctx.recipe_binding_span = binding_span;
    ctx.default_recipe_export = default_export;
    ctx.scope = scope;
    ctx
}

fn add_param_shadows(shadows: &mut [FxHashSet<String>], params: &FormalParameters<'_>) {
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    for param in &params.items {
        if let BindingPattern::BindingIdentifier(id) = &param.pattern {
            scope.insert(id.name.to_string());
        }
    }
}

fn add_declarator_shadow(shadows: &mut [FxHashSet<String>], decl: &VariableDeclarator<'_>) {
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    let BindingPattern::BindingIdentifier(id) = &decl.id else {
        return;
    };
    scope.insert(id.name.to_string());
}

fn binding_ident_name(pattern: &BindingPattern<'_>) -> Option<String> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => Some(id.name.to_string()),
        _ => None,
    }
}

fn binding_ident_span(pattern: &BindingPattern<'_>) -> Option<Span> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => Some(id.span),
        _ => None,
    }
}
