//! Style extraction orchestrator and AST visitor.
//!
//! Discovers `jsx` tags, `css()` calls, and `recipe()` calls, then hands their
//! expressions to the shared walker. `ExtractContext` is the session those passes share.

pub mod constants;
pub mod css;
pub mod expressions;
pub mod jsx;
pub mod recipes;

#[cfg(test)]
mod tests;

use oxc_ast::ast::{CallExpression, JSXOpeningElement, Program};
use oxc_ast_visit::{walk, Visit};

use crate::atom::Want;
use crate::config::BreakpointScale;
use crate::diagnostics::Diagnostic;
use constants::{collect_local_constants, LocalConstants};
use expressions::{ExpressionWalk, ObjectWalk};

/// Configuration references passed into style extraction contexts.
pub struct ExtractConfig<'a> {
    pub constants: &'a LocalConstants,
    pub breakpoints: &'a BreakpointScale,
}

/// Context for extracting style declarations across an AST file.
pub struct ExtractContext<'a> {
    pub file: &'a str,
    pub constants: &'a LocalConstants,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
}

impl<'a> ExtractContext<'a> {
    pub fn new(
        file: &'a str,
        config: ExtractConfig<'a>,
        wants: &'a mut Vec<Want>,
        diagnostics: &'a mut Vec<Diagnostic>,
    ) -> Self {
        Self {
            file,
            constants: config.constants,
            breakpoints: config.breakpoints,
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
            breakpoints: self.breakpoints,
            wants: self.wants,
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
    pub wants: Vec<Want>,
    pub diagnostics: Vec<Diagnostic>,
}

impl<'a> ExtractVisitor<'a> {
    pub fn new(file: &'a str, config: ExtractConfig<'a>) -> Self {
        Self {
            file,
            constants: config.constants.clone(),
            breakpoints: config.breakpoints,
            wants: Vec::new(),
            diagnostics: Vec::new(),
        }
    }
}

impl<'a> Visit<'a> for ExtractVisitor<'a> {
    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        // <Div mt="2r" css={{ color: 'red' }} />
        let config = ExtractConfig {
            constants: &self.constants,
            breakpoints: self.breakpoints,
        };
        let mut ctx =
            ExtractContext::new(self.file, config, &mut self.wants, &mut self.diagnostics);
        jsx::extract(elem, &mut ctx);
        walk::walk_jsx_opening_element(self, elem);
    }

    fn visit_call_expression(&mut self, call: &CallExpression<'a>) {
        // css({ mt: '2r' })  /  recipe({ base: { color: 'white' } })
        let config = ExtractConfig {
            constants: &self.constants,
            breakpoints: self.breakpoints,
        };
        let mut ctx =
            ExtractContext::new(self.file, config, &mut self.wants, &mut self.diagnostics);
        css::extract(call, &mut ctx);
        recipes::extract(call, &mut ctx);
        walk::walk_call_expression(self, call);
    }
}

/// Extract all style wants and diagnostics from a parsed AST program with provided context.
pub fn extract_with_context(program: &Program<'_>, ctx: &mut ExtractContext<'_>) {
    // const space = '2r'; <Div mt={space} />; css({ color: 'red' })
    let config = ExtractConfig {
        constants: ctx.constants,
        breakpoints: ctx.breakpoints,
    };
    let mut visitor = ExtractVisitor::new(ctx.file, config);
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
    // <Div mt="2r" />  +  css({ color: 'red' })  +  recipe({ base: { ... } })
    let constants = collect_local_constants(program);
    let scale = BreakpointScale::default_scale();
    let config = ExtractConfig {
        constants: &constants,
        breakpoints: &scale,
    };
    let mut ctx = ExtractContext::new(file, config, wants, diagnostics);
    extract_with_context(program, &mut ctx);
}
