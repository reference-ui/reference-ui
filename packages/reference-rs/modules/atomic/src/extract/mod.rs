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
pub mod jsx;
pub mod recipes;

#[cfg(test)]
mod gating_tests;
#[cfg(test)]
mod site_plan_tests;
#[cfg(test)]
mod tests;

use std::cell::Cell;
use std::collections::HashSet;

use oxc_ast::ast::{
    BindingPattern, CallExpression, FormalParameters, JSXOpeningElement, Program,
    VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_syntax::scope::{ScopeFlags, ScopeId};

use crate::atom::Want;
use crate::diagnostics::Diagnostic;
use crate::recipes::Recipe;
use base_system::BreakpointScale;
use constants::{collect_local_constants, LocalConstants};
use expressions::{ExpressionWalk, ObjectWalk};

pub use bindings::{collect_bindings, ExtractBindings};

/// Configuration references passed into style extraction contexts.
pub struct ExtractConfig<'a> {
    pub constants: &'a LocalConstants,
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
    pub constants: &'a LocalConstants,
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
            constants: config.constants,
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

    /// Record the missing-graph error once per file. With no hosts
    /// resolvable, style-bearing JSX is skipped instead of scanned.
    pub fn report_missing_graph(&mut self, tag: &str, line: Option<u32>, column: Option<u32>) {
        if self.missing_graph_reported {
            return;
        }
        self.missing_graph_reported = true;
        self.diagnostics.push(
            Diagnostic::error(format!(
                "no StyleProps hosts resolvable (missing primitive graph); skipped styles on <{tag}>"
            ))
            .with_location(self.file, line, column),
        );
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
            constants: self.constants,
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
            constants: self.constants,
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
            constants: self.constants,
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
    pub constants: LocalConstants,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: ExtractBindings,
    pub jsx_hosts: HashSet<String>,
    pub shadows: Vec<HashSet<String>>,
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
            constants: config.constants.clone(),
            breakpoints: config.breakpoints,
            bindings: config.bindings.clone(),
            jsx_hosts: config.jsx_hosts.clone(),
            shadows: Vec::new(),
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
    fn enter_scope(&mut self, _flags: ScopeFlags, _scope_id: &Cell<Option<ScopeId>>) {
        self.shadows.push(HashSet::new());
    }

    fn leave_scope(&mut self) {
        self.shadows.pop();
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

fn visitor_context<'a>(visitor: &'a mut ExtractVisitor<'_>) -> ExtractContext<'a> {
    let binding = visitor.recipe_binding.clone();
    let config = ExtractConfig {
        constants: &visitor.constants,
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
        constants: ctx.constants,
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
pub fn extract(
    program: &Program<'_>,
    file: &str,
    breakpoints: &BreakpointScale,
    sinks: ExtractSinks<'_>,
) {
    let constants = collect_local_constants(program);
    let bindings = collect_bindings(program);
    let jsx_hosts = bindings.jsx_hosts();
    let config = ExtractConfig {
        constants: &constants,
        breakpoints,
        bindings: &bindings,
        jsx_hosts: &jsx_hosts,
        shadowed: &[],
    };
    let mut ctx = ExtractContext::new(file, None, config, sinks);
    extract_with_context(program, &mut ctx);
}
