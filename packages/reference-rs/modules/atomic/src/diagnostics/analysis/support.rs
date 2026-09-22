//! Shared test support for diagnostics analysis (tests only).
//!
//! Parses inline fixtures, finds `css()` argument objects, and summarizes
//! facts into keys and counts. Every analysis test module builds on these
//! helpers instead of duplicating fixture plumbing.

use std::collections::BTreeMap;

use oxc_ast::ast::{Declaration, Expression, ObjectPropertyKind, Program, Statement};

use super::{AnalysisInput, AnalyzedSource};
use crate::diagnostics::DiagnosticFact;
use crate::hosts::ResolvedHosts;

/// Parse one inline fixture; fixtures must parse.
pub(crate) fn parse_for_test<'a>(
    allocator: &'a oxc_allocator::Allocator,
    source: &'a str,
) -> Program<'a> {
    use oxc_parser::Parser;
    use oxc_span::SourceType;
    let ret = Parser::new(allocator, source, SourceType::tsx()).parse();
    assert!(!ret.panicked, "test fixture must parse: {source}");
    ret.program
}

/// Analyze one inline source end to end: parse, collect the file's const
/// values, and run both surfaces with empty hosts.
pub(crate) fn analyze_source(source: &str) -> Vec<DiagnosticFact> {
    let allocator = oxc_allocator::Allocator::default();
    let program = parse_for_test(&allocator, source);
    let constants =
        crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
    let hosts = ResolvedHosts {
        traced: Vec::new(),
        configured: Vec::new(),
        owned_props: BTreeMap::new(),
    };
    let analyzed = AnalyzedSource {
        path: "test.ts",
        content: source,
        program: &program,
    };
    let input = AnalysisInput {
        sources: vec![analyzed],
        hosts: &hosts,
        constants: &constants,
        system: "test",
    };
    super::analyze(&input)
}

/// Every top-level initializer expression: bare statements plus `const` and
/// exported `const` initializers.
fn top_inits<'a>(program: &'a Program<'a>) -> Vec<&'a Expression<'a>> {
    let mut out = Vec::new();
    for stmt in &program.body {
        out.extend(stmt_inits(stmt));
    }
    out
}

/// The initializer expressions of one top-level statement, if any.
fn stmt_inits<'a>(stmt: &'a Statement<'a>) -> Vec<&'a Expression<'a>> {
    match stmt {
        Statement::ExpressionStatement(expr_stmt) => vec![&expr_stmt.expression],
        Statement::VariableDeclaration(var) => var_inits(var),
        Statement::ExportNamedDeclaration(decl) => export_inits(decl),
        _ => Vec::new(),
    }
}

/// The initializers of one export declaration, if it declares variables.
fn export_inits<'a>(decl: &'a oxc_ast::ast::ExportNamedDeclaration<'a>) -> Vec<&'a Expression<'a>> {
    match &decl.declaration {
        Some(Declaration::VariableDeclaration(var)) => var_inits(var),
        _ => Vec::new(),
    }
}

/// The initializers of one variable declaration.
fn var_inits<'a>(var: &'a oxc_ast::ast::VariableDeclaration<'a>) -> Vec<&'a Expression<'a>> {
    var.declarations
        .iter()
        .filter_map(|declarator| declarator.init.as_ref())
        .collect()
}

/// Every `css()`-call argument expression in one program.
pub(crate) fn css_call_args<'a>(program: &'a Program<'a>) -> Vec<&'a Expression<'a>> {
    let mut out = Vec::new();
    for expr in top_inits(program) {
        if let Expression::CallExpression(call) = super::values::unwrap_value(expr) {
            for arg in &call.arguments {
                if let Some(arg_expr) = arg.as_expression() {
                    out.push(arg_expr);
                }
            }
        }
    }
    out
}

/// The first `css()` object argument in one program.
pub(crate) fn first_style_object<'a>(
    program: &'a Program<'a>,
) -> &'a oxc_ast::ast::ObjectExpression<'a> {
    for arg in css_call_args(program) {
        if let Expression::ObjectExpression(obj) = super::values::unwrap_value(arg) {
            return obj;
        }
    }
    panic!("test fixture must hold one css object");
}

/// The first entry key of the first `css()` object, plus its computed flag.
pub(crate) fn first_prop_key<'a>(
    program: &'a Program<'a>,
) -> (&'a oxc_ast::ast::PropertyKey<'a>, bool) {
    for prop_kind in &first_style_object(program).properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            return (&prop.key, prop.computed);
        }
    }
    panic!("test fixture must hold one css object entry");
}

/// The first entry value of the first `css()` object.
pub(crate) fn first_prop_value<'a>(program: &'a Program<'a>) -> &'a Expression<'a> {
    for prop_kind in &first_style_object(program).properties {
        if let ObjectPropertyKind::ObjectProperty(prop) = prop_kind {
            return &prop.value;
        }
    }
    panic!("test fixture must hold one css object entry");
}

/// Walk the first `css()` object of one inline source with the given
/// surface and style props, returning every fact the walk emits.
pub(crate) fn walk_first_object(
    source: &str,
    surface: crate::diagnostics::StyleSurfaceKind,
    props: &[&str],
) -> Vec<DiagnosticFact> {
    use super::object::{walk_object, WalkCtx};
    use crate::diagnostics::SourceId;
    use rustc_hash::FxHashSet;
    let allocator = oxc_allocator::Allocator::default();
    let program = parse_for_test(&allocator, source);
    let constants =
        crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
    let obj = first_style_object(&program);
    let style: FxHashSet<String> = props.iter().map(|name| name.to_string()).collect();
    let shadows: Vec<FxHashSet<String>> = Vec::new();
    let mut facts = Vec::new();
    let mut walk = WalkCtx {
        facts: &mut facts,
        source: SourceId(0),
        surface,
        system: "test",
        style_props: &style,
        constants: &constants,
        shadows: &shadows,
    };
    walk_object(&mut walk, obj, &[]);
    facts
}

/// The serialized key of every exact expectation, in fact order.
pub(crate) fn exact_keys(facts: &[DiagnosticFact]) -> Vec<String> {
    facts
        .iter()
        .filter_map(|fact| match fact {
            DiagnosticFact::ExactLookupExpected { key, .. } => Some(key.lookup_key()),
            _ => None,
        })
        .collect()
}

/// The count of dynamic-slot facts.
pub(crate) fn dynamic_count(facts: &[DiagnosticFact]) -> usize {
    facts
        .iter()
        .filter(|fact| matches!(fact, DiagnosticFact::DynamicSlot { .. }))
        .count()
}

