//! Collect scalar, style-object, and const-array declarators from a parsed
//! program at every depth. Component-body declarators resolve like top-level
//! ones; only literals, multi-leaf style objects (literals, branching
//! leaves, nested entries), literal-element arrays, and branching
//! initializers with literal leaves are indexed. Imports, functions, and
//! spreads are ignored. Any declarator kind may resolve, but a write
//! anywhere in the file poisons the binding and its init is dropped. The
//! index is later consulted by the expression walker; this file inserts no wants.

use std::collections::BTreeMap;

use oxc_ast::ast::{
    ArrayExpressionElement, AssignmentExpression, BindingPattern, Expression, ForInStatement,
    ForOfStatement, ObjectPropertyKind, Program, PropertyKey, UpdateExpression, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_span::Span;

use super::entries::object_entries;
use super::index::{ConstArrayElement, LocalConstants, MutatedBinding};
use super::mutate::{for_head_writes, simple_target_writes, target_writes, Write};
use crate::atom::AtomValue;
use crate::diagnostics::line_col;
use crate::extract::expressions::walk::is_guard_expression;

/// Collect all constant definitions from a parsed AST program.
///
/// File and source locate the write sites of mutated bindings; without source
/// text the mutation record still names the binding and its file. Mutated
/// bindings are stripped before return, so both walkers read them as dynamic.
pub fn collect_local_constants(
    program: &Program<'_>,
    file: &str,
    source: Option<&str>,
) -> LocalConstants {
    // const space = '2r'
    // const theme = { primary: 'n300' }
    // const subtleBorder = isDark ? 'gray.800' : 'gray.200'
    let mut collector = ConstCollector {
        constants: LocalConstants::new(),
        file,
        source,
    };
    collector.visit_program(program);
    collector.constants.drop_mutated();
    collector.constants
}

/// Visitor recording every declarator, top-level or nested in a body.
///
/// Any kind (`const`, `let`, `var`, `export let`) may resolve; a later write
/// anywhere in the file poisons the binding instead (SPEC-V2-35).
struct ConstCollector<'a> {
    constants: LocalConstants,
    file: &'a str,
    source: Option<&'a str>,
}

impl<'a> Visit<'a> for ConstCollector<'a> {
    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        if let BindingPattern::BindingIdentifier(ident) = &decl.id {
            if let Some(init) = &decl.init {
                record_declaration(
                    &mut self.constants,
                    ident.name.as_str(),
                    unwrap_expression(init),
                );
            }
        }
        walk::walk_variable_declarator(self, decl);
    }

    fn visit_assignment_expression(&mut self, expr: &AssignmentExpression<'a>) {
        // color = 'blue'  — the init is stale from here on
        let mut writes = Vec::new();
        target_writes(&expr.left, &mut writes);
        self.mark_writes(writes);
        walk::walk_assignment_expression(self, expr);
    }

    fn visit_update_expression(&mut self, expr: &UpdateExpression<'a>) {
        // count++  — self-assignment is still a write
        let mut writes = Vec::new();
        simple_target_writes(&expr.argument, &mut writes);
        self.mark_writes(writes);
        walk::walk_update_expression(self, expr);
    }

    fn visit_for_in_statement(&mut self, stmt: &ForInStatement<'a>) {
        // for (picked in theme)  — the head reassigns each iteration
        let mut writes = Vec::new();
        for_head_writes(&stmt.left, &mut writes);
        self.mark_writes(writes);
        walk::walk_for_in_statement(self, stmt);
    }

    fn visit_for_of_statement(&mut self, stmt: &ForOfStatement<'a>) {
        // for (picked of list)
        let mut writes = Vec::new();
        for_head_writes(&stmt.left, &mut writes);
        self.mark_writes(writes);
        walk::walk_for_of_statement(self, stmt);
    }
}

impl ConstCollector<'_> {
    /// Poison every written name with its write site.
    fn mark_writes(&mut self, writes: Vec<Write<'_>>) {
        for (name, span) in writes {
            self.mark_write(name, span);
        }
    }

    /// Poison one name; the first write site wins.
    fn mark_write(&mut self, name: &str, span: Span) {
        let position = self.source.and_then(|source| line_col(source, span.start));
        self.constants
            .mark_mutated(name, MutatedBinding::new(self.file, position));
    }
}

fn record_declaration(constants: &mut LocalConstants, name: &str, expr: &Expression<'_>) {
    // const space = '2r'
    if let Some(leaf) = literal_leaf(expr) {
        constants.insert_scalar(name, leaf);
        return;
    }
    // const theme = { primary: 'n300' }
    if let Expression::ObjectExpression(obj) = expr {
        record_object_properties(constants, name, obj);
        return;
    }
    // const sizes = ['2px', '4px']
    if let Expression::ArrayExpression(arr) = expr {
        if let Some(elements) = array_elements(arr) {
            constants.insert_array(name, elements);
        }
        return;
    }
    // const subtleBorder = isDark ? 'gray.800' : 'gray.200'
    if matches!(
        expr,
        Expression::ConditionalExpression(_) | Expression::LogicalExpression(_)
    ) {
        let mut leaves = Vec::new();
        collect_branching_leaves(expr, &mut leaves);
        constants.insert_scalar_leaves(name, &leaves);
    }
}

/// Scoop every literal leaf of a branching initializer, mirroring the want
/// walker leaf-for-leaf: both ternary arms, non-guard logical operands.
fn collect_branching_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) {
    let unwrapped = unwrap_expression(expr);
    if collect_conditional_leaves(unwrapped, out) {
        return;
    }
    if collect_logical_leaves(unwrapped, out) {
        return;
    }
    if let Some(atom) = literal_leaf(unwrapped) {
        out.push(atom);
    }
}

/// Scoop both arms of a ternary initializer, or false when not a ternary.
fn collect_conditional_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) -> bool {
    let Expression::ConditionalExpression(cond) = expr else {
        return false;
    };
    collect_branching_leaves(&cond.consequent, out);
    collect_branching_leaves(&cond.alternate, out);
    true
}

/// Scoop the non-guard operands of a logical initializer, or false when not logical.
fn collect_logical_leaves(expr: &Expression<'_>, out: &mut Vec<AtomValue>) -> bool {
    let Expression::LogicalExpression(log) = expr else {
        return false;
    };
    if !is_guard_expression(&log.left) {
        collect_branching_leaves(&log.left, out);
    }
    if !is_guard_expression(&log.right) {
        collect_branching_leaves(&log.right, out);
    }
    true
}

/// A literal initializer leaf, or None for dynamic shapes.
fn literal_leaf(expr: &Expression<'_>) -> Option<AtomValue> {
    match expr {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => {
            Some(AtomValue::Number(n.value.to_string().into_boxed_str()))
        }
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// The recorded elements of a const array init, or None when any element
/// is not a literal, a literal-entry object, or a hole. Identifier and
/// spread elements stay unrecorded (SPEC-V2-34 const-graph depth), so the
/// binding shadows instead of resolving to a partial array.
fn array_elements(
    arr: &oxc_ast::ast::ArrayExpression<'_>,
) -> Option<Vec<ConstArrayElement>> {
    let mut elements = Vec::with_capacity(arr.elements.len());
    for elem in &arr.elements {
        elements.push(array_element(elem)?);
    }
    Some(elements)
}

/// One recorded array element, or None for dynamic shapes.
fn array_element(elem: &ArrayExpressionElement<'_>) -> Option<ConstArrayElement> {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            // const sizes = ['2px', , '8px']
            Some(ConstArrayElement::Hole)
        }
        ArrayExpressionElement::SpreadElement(_) => None,
        _ => array_value_element(elem.as_expression()?),
    }
}

/// One recorded array value element: a literal leaf or a static object.
fn array_value_element(expr: &Expression<'_>) -> Option<ConstArrayElement> {
    let expr = unwrap_expression(expr);
    if let Some(leaf) = literal_leaf(expr) {
        return Some(ConstArrayElement::Leaf(leaf));
    }
    if let Expression::ObjectExpression(obj) = expr {
        return object_element_map(obj).map(ConstArrayElement::Object);
    }
    None
}

/// The literal entries of an object nested in a const array init, or None
/// when any entry is a spread, a computed key, or a non-literal value — the
/// whole array stays unrecorded so the use site refuses with a diagnostic
/// instead of spreading a partial object.
fn object_element_map(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
) -> Option<BTreeMap<String, AtomValue>> {
    let mut leaves = BTreeMap::new();
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            return None;
        };
        let Some(key) = resolve_property_key(&prop.key) else {
            return None;
        };
        let Some(leaf) = literal_leaf(unwrap_expression(&prop.value)) else {
            return None;
        };
        leaves.insert(key, leaf);
    }
    Some(leaves)
}

fn record_object_properties(
    constants: &mut LocalConstants,
    obj_name: &str,
    obj: &oxc_ast::ast::ObjectExpression<'_>,
) {
    // const theme = { primary: 'n300', tone: flag ? 'r' : 'b' }
    for (key, prop) in object_entries(obj) {
        constants.insert_object_prop(obj_name, key, prop);
    }
}

fn resolve_property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // { primary: 'n300' }
            Some(ident.name.to_string())
        }
        PropertyKey::StringLiteral(lit) => {
            // { 'primary': 'n300' }
            Some(lit.value.to_string())
        }
        _ => None,
    }
}

fn unwrap_expression<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(p) => {
            // const space = ('2r')
            unwrap_expression(&p.expression)
        }
        Expression::TSAsExpression(as_expr) => {
            // const space = '2r' as const
            unwrap_expression(&as_expr.expression)
        }
        Expression::TSSatisfiesExpression(sat) => {
            // const space = '2r' satisfies string
            unwrap_expression(&sat.expression)
        }
        Expression::TSNonNullExpression(non_null) => {
            // const space = '2r'!
            unwrap_expression(&non_null.expression)
        }
        _ => expr,
    }
}
