//! Collect top-level `const` scalars and style objects from a parsed program.
//! Only literals and simple object records are indexed. Imports, functions, and spreads are ignored.
//! The index is later consulted by the expression walker; this file does not insert wants.

use oxc_ast::ast::{
    BindingPattern, Declaration, Expression, ObjectPropertyKind, Program, PropertyKey, Statement,
};

use super::index::LocalConstants;
use crate::atom::AtomValue;

/// Collect all top-level constant definitions from a parsed AST program.
pub fn collect_local_constants(program: &Program<'_>) -> LocalConstants {
    // const space = '2r'
    // const theme = { primary: 'n300' }
    let mut constants = LocalConstants::new();
    for stmt in &program.body {
        process_statement(&mut constants, stmt);
    }
    constants
}

fn process_statement(constants: &mut LocalConstants, stmt: &Statement<'_>) {
    if let Statement::VariableDeclaration(var_decl) = stmt {
        // const space = '2r'
        extract_from_var_decl(constants, var_decl);
    } else if let Statement::ExportNamedDeclaration(exp_decl) = stmt {
        if let Some(Declaration::VariableDeclaration(var_decl)) = &exp_decl.declaration {
            // export const space = '2r'
            extract_from_var_decl(constants, var_decl);
        }
    }
}

fn extract_from_var_decl(
    constants: &mut LocalConstants,
    var_decl: &oxc_ast::ast::VariableDeclaration<'_>,
) {
    for decl in &var_decl.declarations {
        let BindingPattern::BindingIdentifier(ident) = &decl.id else {
            // const { primary } = theme  — skip
            continue;
        };
        let Some(init) = &decl.init else {
            continue;
        };
        record_declaration(constants, ident.name.as_str(), unwrap_expression(init));
    }
}

fn record_declaration(constants: &mut LocalConstants, name: &str, expr: &Expression<'_>) {
    match expr {
        Expression::StringLiteral(s) => {
            // const space = '2r'
            constants.insert_scalar(name, AtomValue::String(s.value.as_str().into()));
        }
        Expression::NumericLiteral(n) => {
            // const z = 0
            constants.insert_scalar(
                name,
                AtomValue::Number(n.value.to_string().into_boxed_str()),
            );
        }
        Expression::BooleanLiteral(b) => {
            // const on = true
            constants.insert_scalar(name, AtomValue::Bool(b.value));
        }
        Expression::ObjectExpression(obj) => {
            // const theme = { primary: 'n300' }
            record_object_properties(constants, name, obj);
        }
        _ => {}
    }
}

fn record_object_properties(
    constants: &mut LocalConstants,
    obj_name: &str,
    obj: &oxc_ast::ast::ObjectExpression<'_>,
) {
    // const theme = { primary: 'n300', space: '2r' }
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = resolve_property_key(&prop.key) else {
            continue;
        };
        record_object_entry(constants, obj_name, &key, unwrap_expression(&prop.value));
    }
}

fn record_object_entry(
    constants: &mut LocalConstants,
    obj_name: &str,
    key: &str,
    expr: &Expression<'_>,
) {
    match expr {
        Expression::StringLiteral(s) => {
            // { primary: 'n300' }
            constants.insert_object_prop(obj_name, key, AtomValue::String(s.value.as_str().into()));
        }
        Expression::NumericLiteral(n) => {
            // { opacity: 0.5 }
            constants.insert_object_prop(
                obj_name,
                key,
                AtomValue::Number(n.value.to_string().into_boxed_str()),
            );
        }
        Expression::BooleanLiteral(b) => {
            // { truncate: true }
            constants.insert_object_prop(obj_name, key, AtomValue::Bool(b.value));
        }
        _ => {}
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
