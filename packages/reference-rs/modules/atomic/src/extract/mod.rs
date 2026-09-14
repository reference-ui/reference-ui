//! Style extraction orchestrator and AST visitor.
//!
//! Orchestrates the static discovery of style-bearing JSX elements and `css()` calls,
//! providing unified extraction contexts (`ExtractContext`) that coordinate leaf collection
//! and diagnostic reporting across source files.

pub mod constants;
pub mod leaves;
pub mod sites;

#[cfg(test)]
mod tests;

use oxc_ast::ast::{CallExpression, JSXOpeningElement, Program};
use oxc_ast_visit::{walk, Visit};

use crate::atom::Want;
use crate::diagnostics::Diagnostic;
use constants::{collect_local_constants, LocalConstants};
use leaves::{LeafWalk, ObjectWalk};
use sites::{handle_call_expression, handle_jsx_opening_element};

/// Context for extracting style declarations across an AST file.
pub struct ExtractContext<'a> {
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> ExtractContext<'a> {
    pub fn new(
        file: &'a str,
        constants: &'a LocalConstants,
        wants: &'a mut Vec<Want>,
        diagnostics: &'a mut Vec<Diagnostic>,
    ) -> Self {
        Self {
            file,
            constants,
            wants,
            diagnostics,
        }
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
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }

    /// Create a LeafWalk context for traversing a single property expression.
    pub fn leaf_walk<'b>(
        &'b mut self,
        prop: &'b str,
        origin: Option<&'b str>,
        important: bool,
    ) -> LeafWalk<'b> {
        LeafWalk {
            prop,
            origin,
            important,
            file: self.file,
            constants: self.constants,
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }
}

/// AST visitor collecting style wants and diagnostics from JSX and calls.
pub struct ExtractVisitor<'a> {
    pub file: &'a str,
    pub constants: LocalConstants,
    pub wants: Vec<Want>,
    pub diagnostics: Vec<Diagnostic>,
}

impl<'a> ExtractVisitor<'a> {
    pub fn new(file: &'a str, constants: LocalConstants) -> Self {
        Self {
            file,
            constants,
            wants: Vec::new(),
            diagnostics: Vec::new(),
        }
    }
}

impl<'a> Visit<'a> for ExtractVisitor<'a> {
    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        let mut ctx = ExtractContext::new(
            self.file,
            &self.constants,
            &mut self.wants,
            &mut self.diagnostics,
        );
        handle_jsx_opening_element(elem, &mut ctx);
        walk::walk_jsx_opening_element(self, elem);
    }

    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        let mut ctx = ExtractContext::new(
            self.file,
            &self.constants,
            &mut self.wants,
            &mut self.diagnostics,
        );
        handle_call_expression(call, &mut ctx);
        walk::walk_call_expression(self, call);
    }
}

/// Extract all style wants and diagnostics from a parsed AST program with provided context.
pub fn extract_with_context(program: &Program<'_>, ctx: &mut ExtractContext<'_>) {
    let mut visitor = ExtractVisitor::new(ctx.file, ctx.constants.clone());
    visitor.visit_program(program);
    ctx.wants.extend(visitor.wants);
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
    let mut ctx = ExtractContext::new(file, &constants, wants, diagnostics);
    extract_with_context(program, &mut ctx);
}
