//! Style extraction orchestrator and AST visitor.
//!
//! Discovers `jsx` tags, `css()` calls, and `recipe()` calls, then hands their
//! expressions to the shared walker. `css()` fills utility wants; `recipe()`
//! fills Recipe IR (`ctx.recipes`) and must not pollute the utility list.
//! `ExtractContext` is the session those passes share. Call extract is
//! import-bound; JSX extract consults styletrace names plus Reference
//! component imports and fails closed once any host is known.

pub mod bindings;
pub mod constants;
pub mod css;
pub mod expressions;
pub mod jsx;
pub mod recipes;

#[cfg(test)]
mod tests;
#[cfg(test)]
mod gating_tests;

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
}

/// Context for extracting style declarations across an AST file.
pub struct ExtractContext<'a> {
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: &'a ExtractBindings,
    pub jsx_hosts: &'a HashSet<String>,
    pub shadowed: &'a [HashSet<String>],
    pub recipe_binding: Option<String>,
    pub wants: &'a mut Vec<Want>,
    pub recipes: &'a mut Vec<Recipe>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> ExtractContext<'a> {
    pub fn new(file: &'a str, config: ExtractConfig<'a>, sinks: ExtractSinks<'a>) -> Self {
        Self {
            file,
            constants: config.constants,
            breakpoints: config.breakpoints,
            bindings: config.bindings,
            jsx_hosts: config.jsx_hosts,
            shadowed: config.shadowed,
            recipe_binding: None,
            wants: sinks.wants,
            recipes: sinks.recipes,
            diagnostics: sinks.diagnostics,
        }
    }

    /// True when this tag is a StyleProps host. Empty host set keeps scanning.
    pub fn allows_jsx_tag(&self, name: &str) -> bool {
        if !bindings::is_shadowed(self.shadowed, name) && self.jsx_hosts.contains(name) {
            return true;
        }
        self.jsx_hosts.is_empty()
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
            constants: self.constants,
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
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
            constants: self.constants,
            breakpoints: self.breakpoints,
            wants,
            diagnostics: self.diagnostics,
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
    pub constants: LocalConstants,
    pub breakpoints: &'a BreakpointScale,
    pub bindings: ExtractBindings,
    pub jsx_hosts: HashSet<String>,
    pub shadows: Vec<HashSet<String>>,
    pub recipe_binding: Option<String>,
    pub wants: Vec<Want>,
    pub recipes: Vec<Recipe>,
    pub diagnostics: Vec<Diagnostic>,
}

impl<'a> ExtractVisitor<'a> {
    pub fn new(file: &'a str, config: ExtractConfig<'a>) -> Self {
        Self {
            file,
            constants: config.constants.clone(),
            breakpoints: config.breakpoints,
            bindings: config.bindings.clone(),
            jsx_hosts: config.jsx_hosts.clone(),
            shadows: Vec::new(),
            recipe_binding: None,
            wants: Vec::new(),
            recipes: Vec::new(),
            diagnostics: Vec::new(),
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
    let mut ctx = visitor_context(visitor);
    jsx::extract(elem, &mut ctx);
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
    };
    let mut ctx = ExtractContext::new(visitor.file, config, sinks);
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
    let mut visitor = ExtractVisitor::new(ctx.file, config);
    visitor.visit_program(program);
    ctx.wants.extend(visitor.wants);
    ctx.recipes.extend(visitor.recipes);
    ctx.diagnostics.extend(visitor.diagnostics);
}

/// Extract all style wants and diagnostics from a parsed AST program.
pub fn extract(
    program: &Program<'_>,
    file: &str,
    wants: &mut Vec<Want>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let constants = collect_local_constants(program);
    let bindings = collect_bindings(program);
    let jsx_hosts = bindings.jsx_hosts();
    let scale = base_system::BaseSystem::lib_fixture().breakpoints();
    let config = ExtractConfig {
        constants: &constants,
        breakpoints: &scale,
        bindings: &bindings,
        jsx_hosts: &jsx_hosts,
        shadowed: &[],
    };
    let mut recipes = Vec::new();
    let sinks = ExtractSinks {
        wants,
        recipes: &mut recipes,
        diagnostics,
    };
    let mut ctx = ExtractContext::new(file, config, sinks);
    extract_with_context(program, &mut ctx);
}
