//! Style extraction orchestrator and AST visitor.
//!
//! Discovers `jsx` tags, `css()` calls, and `recipe()` calls, then hands their
//! expressions to the shared walker. `css()` fills utility wants; `recipe()`
//! fills Recipe IR (`ctx.recipes`) and must not pollute the utility list.
//! `ExtractContext` is the session those passes share. Call extract is
//! import-bound; JSX extract consults styletrace names plus Reference
//! component imports and fails closed when no host is known: an empty host
//! set plus style-bearing JSX is a missing-graph error, never a scan.

pub mod bindings;
pub mod constants;
pub mod css;
pub mod expressions;
pub mod fold;
pub mod identity;
pub mod identity_map;
pub mod jsx;
pub mod recipes;
pub mod resolver;
pub mod scope;

#[cfg(test)]
mod gating_tests;
#[cfg(test)]
mod identity_tests;
#[cfg(test)]
mod site_plan_tests;
#[cfg(test)]
mod tests;

use std::cell::Cell;
use std::collections::HashSet;

use oxc_ast::ast::{
    BindingPattern, CallExpression, FormalParameters, JSXOpeningElement, Program,
    TaggedTemplateExpression, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_span::Span;
use oxc_syntax::scope::ScopeFlags;
use oxc_syntax::scope::ScopeId as OxcScopeId;

use crate::atom::Want;
use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode};
use crate::recipes::Recipe;
use base_system::BreakpointScale;
use expressions::{ExpressionWalk, ObjectWalk};
use scope::{ScopeChain, ScopeId, Scoped, ROOT_SCOPE};

pub use bindings::{collect_bindings, collect_bindings_with_identity, ExtractBindings};

/// Configuration references passed into style extraction contexts.
pub struct ExtractConfig<'a> {
    pub chain: ScopeChain<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: &'a HashSet<String>,
    pub shadowed: &'a [HashSet<String>],
}

/// Mutable collections the extract walk writes into.
pub struct ExtractSinks<'a> {
    pub wants: &'a mut Vec<Want>,
    pub recipes: &'a mut Vec<Recipe>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: &'a mut Vec<crate::runtime::AuthoredDeclaration>,
}

/// Context for extracting style declarations across an AST file.
pub struct ExtractContext<'a> {
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub chain: ScopeChain<'a>,
    pub scope: ScopeId,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: &'a HashSet<String>,
    pub shadowed: &'a [HashSet<String>],
    pub recipe_binding: Option<String>,
    pub wants: &'a mut Vec<Want>,
    pub recipes: &'a mut Vec<Recipe>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: &'a mut Vec<crate::runtime::AuthoredDeclaration>,
    missing_graph_reported: bool,
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
            chain: config.chain,
            scope: ROOT_SCOPE,
            breakpoints: config.breakpoints,
            bindings: config.bindings,
            jsx_hosts: config.jsx_hosts,
            shadowed: config.shadowed,
            recipe_binding: None,
            wants: sinks.wants,
            recipes: sinks.recipes,
            diagnostics: sinks.diagnostics,
            authored: sinks.authored,
            missing_graph_reported: false,
        }
    }

    /// True when this tag is a StyleProps host. An empty host set admits
    /// nothing: the caller reports the missing graph once per file.
    /// Member tags match concatenated hosts (`<Overlay.Content />` admits
    /// `OverlayContent`), the Panda discovery spelling (core parity).
    pub fn allows_jsx_tag(&self, name: &str) -> bool {
        if bindings::is_shadowed(self.shadowed, name) {
            return false;
        }
        if self.jsx_hosts.contains(name) {
            return true;
        }
        name.contains('.') && self.jsx_hosts.contains(&name.replace('.', ""))
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        self.diagnostics
            .push(Diagnostic::warning(code, message.into()).with_location(self.file, line, column));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self
            .source
            .and_then(|source| line_col(source, span.start))
            .unzip();
        self.diagnostics
            .push(Diagnostic::info(code, message.into()).with_location(self.file, line, column));
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

    /// Create an ObjectWalk context for traversing a style object.
    pub fn object_walk<'b>(
        &'b mut self,
        origin: Option<&'b str>,
        important: bool,
    ) -> ObjectWalk<'b> {
        ObjectWalk {
            origin,
            important,
            file: self.file,
            source: self.source,
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
            authored: Some(self.authored),
        }
    }

    /// Walk a style object into an explicit want list (recipe leaves).
    pub fn object_walk_into<'b>(
        &'b mut self,
        origin: Option<&'b str>,
        wants: &'b mut Vec<Want>,
    ) -> ObjectWalk<'b> {
        ObjectWalk {
            origin,
            important: false,
            file: self.file,
            source: self.source,
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants,
            diagnostics: self.diagnostics,
            authored: None,
        }
    }

    /// Create an ExpressionWalk context for traversing a single property expression.
    pub fn expression_walk<'b>(
        &'b mut self,
        prop: &'b str,
        origin: Option<&'b str>,
        important: bool,
    ) -> ExpressionWalk<'b> {
        ExpressionWalk {
            prop,
            origin,
            important,
            file: self.file,
            source: self.source,
            scopes: self.scoped(),
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }
}

/// AST visitor collecting style wants and diagnostics from JSX and calls.
pub struct ExtractVisitor<'a> {
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub chain: ScopeChain<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: ExtractBindings,
    pub jsx_hosts: HashSet<String>,
    pub shadows: Vec<HashSet<String>>,
    pub scope_stack: Vec<ScopeId>,
    next_scope: ScopeId,
    pub recipe_binding: Option<String>,
    pub wants: Vec<Want>,
    pub recipes: Vec<Recipe>,
    pub diagnostics: Vec<Diagnostic>,
    pub authored: Vec<crate::runtime::AuthoredDeclaration>,
    missing_graph_reported: bool,
}

impl<'a> ExtractVisitor<'a> {
    pub fn new(file: &'a str, source: Option<&'a str>, config: ExtractConfig<'a>) -> Self {
        Self {
            file,
            source,
            chain: config.chain,
            breakpoints: config.breakpoints,
            bindings: config.bindings.clone(),
            jsx_hosts: config.jsx_hosts.clone(),
            shadows: Vec::new(),
            scope_stack: Vec::new(),
            next_scope: ROOT_SCOPE,
            recipe_binding: None,
            wants: Vec::new(),
            recipes: Vec::new(),
            diagnostics: Vec::new(),
            authored: Vec::new(),
            missing_graph_reported: false,
        }
    }
}

impl<'a> Visit<'a> for ExtractVisitor<'a> {
    fn enter_scope(&mut self, _flags: ScopeFlags, _scope_id: &Cell<Option<OxcScopeId>>) {
        self.shadows.push(HashSet::new());
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
        self.recipe_binding = binding_ident_name(&decl.id);
        walk::walk_variable_declarator(self, decl);
        self.recipe_binding = prev;
        add_declarator_shadow(&mut self.shadows, decl);
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

fn visitor_context<'a>(visitor: &'a mut ExtractVisitor<'_>) -> ExtractContext<'a> {
    let binding = visitor.recipe_binding.clone();
    let scope = visitor.scope_stack.last().copied().unwrap_or(ROOT_SCOPE);
    let config = ExtractConfig {
        chain: visitor.chain,
        breakpoints: visitor.breakpoints,
        bindings: &visitor.bindings,
        jsx_hosts: &visitor.jsx_hosts,
        shadowed: &visitor.shadows,
    };
    let sinks = ExtractSinks {
        wants: &mut visitor.wants,
        recipes: &mut visitor.recipes,
        diagnostics: &mut visitor.diagnostics,
        authored: &mut visitor.authored,
    };
    let mut ctx = ExtractContext::new(visitor.file, visitor.source, config, sinks);
    ctx.recipe_binding = binding;
    ctx.scope = scope;
    ctx
}

fn add_param_shadows(shadows: &mut [HashSet<String>], params: &FormalParameters<'_>) {
    let Some(scope) = shadows.last_mut() else {
        return;
    };
    for param in &params.items {
        if let BindingPattern::BindingIdentifier(id) = &param.pattern {
            scope.insert(id.name.to_string());
        }
    }
}

fn add_declarator_shadow(shadows: &mut [HashSet<String>], decl: &VariableDeclarator<'_>) {
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

/// Extract all style wants and diagnostics from a parsed AST program with provided context.
pub fn extract_with_context(program: &Program<'_>, ctx: &mut ExtractContext<'_>) {
    let config = ExtractConfig {
        chain: ctx.chain,
        breakpoints: ctx.breakpoints,
        bindings: ctx.bindings,
        jsx_hosts: ctx.jsx_hosts,
        shadowed: &[],
    };
    let mut visitor = ExtractVisitor::new(ctx.file, ctx.source, config);
    visitor.visit_program(program);
    ctx.wants.extend(visitor.wants);
    ctx.recipes.extend(visitor.recipes);
    ctx.diagnostics.extend(visitor.diagnostics);
    ctx.authored.extend(visitor.authored);
}

/// Extract all style wants and diagnostics from a parsed AST program.
/// Callers thread the system's breakpoint scale; no fixture is consulted here.
/// Wants carry file-only locations here; `compile()` threads source text for lines.
/// Without a project, the import stub answers from an empty bag: locals
/// resolve through the chain, cross-file names stay dynamic.
pub fn extract(
    program: &Program<'_>,
    file: &str,
    breakpoints: &BreakpointScale,
    sinks: ExtractSinks<'_>,
) {
    let empty = constants::LocalConstants::new();
    let table = scope::collect(program, &empty);
    let stub = scope::ImportLookup::ProjectBag(&empty);
    let chain = scope::ScopeChain::new(&table, stub);
    let bindings = collect_bindings(program);
    let jsx_hosts = bindings.jsx_hosts();
    let config = ExtractConfig {
        chain,
        breakpoints,
        bindings: &bindings,
        jsx_hosts: &jsx_hosts,
        shadowed: &[],
    };
    let mut ctx = ExtractContext::new(file, None, config, sinks);
    extract_with_context(program, &mut ctx);
}
