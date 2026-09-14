//! Local constant collector for AST style extraction.
//! Scans top-level variable declarations to index primitive literal values and simple object records.
//! Enables resolution of member and identifier references such as \`constants.activeColor\` during leaf walking.
//! Guarantees cascade integrity without requiring complex JavaScript execution in the style engine.

use std::collections::BTreeMap;
use oxc_ast::ast::{
    BindingPattern, Declaration, Expression, ObjectPropertyKind, Program, PropertyKey, Statement,
};

use crate::atom::AtomValue;

/// Index of local scalar values and object property bags declared at the top-level of a file.
#[derive(Debug, Default, Clone)]
pub struct LocalConstants {
    scalars: BTreeMap<String, AtomValue>,
    objects: BTreeMap<String, BTreeMap<String, AtomValue>>,
}

impl LocalConstants {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert_scalar(&mut self, name: impl Into<String>, value: AtomValue) {
        self.scalars.insert(name.into(), value);
    }

    pub fn insert_object_prop(
        &mut self,
        obj_name: &str,
        prop_name: impl Into<String>,
        value: AtomValue,
    ) {
        self.objects
            .entry(obj_name.to_string())
            .or_default()
            .insert(prop_name.into(), value);
    }

    pub fn get_scalar(&self, name: &str) -> Option<&AtomValue> {
        self.scalars.get(name)
    }

    pub fn get_object_prop(&self, obj_name: &str, prop_name: &str) -> Option<&AtomValue> {
        self.objects.get(obj_name).and_then(|obj| obj.get(prop_name))
    }

    pub fn merge(&mut self, other: &LocalConstants) {
        for (k, v) in &other.scalars {
            self.scalars.entry(k.clone()).or_insert_with(|| v.clone());
        }
        for (k, v) in &other.objects {
            let obj = self.objects.entry(k.clone()).or_default();
            for (prop_k, prop_v) in v {
                obj.entry(prop_k.clone()).or_insert_with(|| prop_v.clone());
            }
        }
    }
}

/// Collect all top-level constant definitions from a parsed AST program.
pub fn collect_local_constants(program: &Program<'_>) -> LocalConstants {
    let mut constants = LocalConstants::new();
    for stmt in &program.body {
        process_statement(&mut constants, stmt);
    }
    constants
}

fn process_statement(constants: &mut LocalConstants, stmt: &Statement<'_>) {
    if let Statement::VariableDeclaration(var_decl) = stmt {
        extract_from_var_decl(constants, var_decl);
    } else if let Statement::ExportNamedDeclaration(exp_decl) = stmt {
        if let Some(Declaration::VariableDeclaration(var_decl)) = &exp_decl.declaration {
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
            continue;
        };
        let Some(init) = &decl.init else {
            continue;
        };
        let unwrapped = unwrap_expression(init);
        record_declaration(constants, ident.name.as_str(), unwrapped);
    }
}

fn record_declaration(constants: &mut LocalConstants, name: &str, expr: &Expression<'_>) {
    match expr {
        Expression::StringLiteral(s) => {
            constants.insert_scalar(name, AtomValue::String(s.value.as_str().into()));
        }
        Expression::NumericLiteral(n) => {
            constants.insert_scalar(name, AtomValue::Number(n.value.to_string().into_boxed_str()));
        }
        Expression::BooleanLiteral(b) => {
            constants.insert_scalar(name, AtomValue::Bool(b.value));
        }
        Expression::ObjectExpression(obj) => {
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
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(key) = resolve_property_key(&prop.key) else {
            continue;
        };
        let val_expr = unwrap_expression(&prop.value);
        record_object_entry(constants, obj_name, &key, val_expr);
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
            constants.insert_object_prop(
                obj_name,
                key,
                AtomValue::String(s.value.as_str().into()),
            );
        }
        Expression::NumericLiteral(n) => {
            constants.insert_object_prop(
                obj_name,
                key,
                AtomValue::Number(n.value.to_string().into_boxed_str()),
            );
        }
        Expression::BooleanLiteral(b) => {
            constants.insert_object_prop(obj_name, key, AtomValue::Bool(b.value));
        }
        _ => {}
    }
}

fn resolve_property_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

fn unwrap_expression<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    match expr {
        Expression::ParenthesizedExpression(p) => unwrap_expression(&p.expression),
        Expression::TSAsExpression(as_expr) => unwrap_expression(&as_expr.expression),
        Expression::TSSatisfiesExpression(sat) => unwrap_expression(&sat.expression),
        Expression::TSNonNullExpression(non_null) => unwrap_expression(&non_null.expression),
        _ => expr,
    }
}
