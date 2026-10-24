//! Module-scope declarations of one source file: the names it binds at the top level.
//! Functions, classes, variables (destructured ones included) and enums count, exported or not.
//! Takes a module's parsed program and emits that name set, so the observation pass can tell a locally
//! defined `Div` from the library primitive. Imports are left out because `ModuleInfo.imports`
//! already records them, and declarations nested inside function bodies are not modeled. The parser stores
//! the set on the module, so the program is not parsed again for it.

use oxc_ast::ast::{
    ArrayPattern, BindingIdentifier, BindingPattern, Declaration, ExportDefaultDeclarationKind,
    ObjectPattern, Program, Statement, VariableDeclaration,
};
use std::collections::HashSet;

pub(crate) fn module_scope_declarations(program: &Program<'_>) -> HashSet<String> {
    let mut names = HashSet::new();

    for statement in program.body.iter() {
        collect_statement(statement, &mut names);
    }

    names
}

fn collect_statement(statement: &Statement<'_>, names: &mut HashSet<String>) {
    if let Some(declaration) = statement.as_declaration() {
        collect_declaration(declaration, names);
        return;
    }

    match statement {
        Statement::ExportNamedDeclaration(export) => {
            if let Some(declaration) = &export.declaration {
                collect_declaration(declaration, names);
            }
        }
        Statement::ExportDefaultDeclaration(export) => {
            collect_default_export(&export.declaration, names)
        }
        _ => {}
    }
}

fn collect_declaration(declaration: &Declaration<'_>, names: &mut HashSet<String>) {
    match declaration {
        Declaration::FunctionDeclaration(function) => insert_name(function.id.as_ref(), names),
        Declaration::ClassDeclaration(class) => insert_name(class.id.as_ref(), names),
        Declaration::TSEnumDeclaration(enum_declaration) => {
            insert_name(Some(&enum_declaration.id), names)
        }
        Declaration::VariableDeclaration(variables) => collect_variable_names(variables, names),
        _ => {}
    }
}

fn collect_variable_names(variables: &VariableDeclaration<'_>, names: &mut HashSet<String>) {
    for declarator in &variables.declarations {
        collect_pattern(&declarator.id, names);
    }
}

fn collect_default_export(
    declaration: &ExportDefaultDeclarationKind<'_>,
    names: &mut HashSet<String>,
) {
    match declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            insert_name(function.id.as_ref(), names)
        }
        ExportDefaultDeclarationKind::ClassDeclaration(class) => {
            insert_name(class.id.as_ref(), names)
        }
        _ => {}
    }
}

fn collect_pattern(pattern: &BindingPattern<'_>, names: &mut HashSet<String>) {
    match pattern {
        BindingPattern::BindingIdentifier(identifier) => {
            names.insert(identifier.name.to_string());
        }
        BindingPattern::ObjectPattern(object) => collect_object_pattern(object, names),
        BindingPattern::ArrayPattern(array) => collect_array_pattern(array, names),
        BindingPattern::AssignmentPattern(assignment) => collect_pattern(&assignment.left, names),
    }
}

fn collect_object_pattern(object: &ObjectPattern<'_>, names: &mut HashSet<String>) {
    for property in &object.properties {
        collect_pattern(&property.value, names);
    }
    if let Some(rest) = &object.rest {
        collect_pattern(&rest.argument, names);
    }
}

fn collect_array_pattern(array: &ArrayPattern<'_>, names: &mut HashSet<String>) {
    for element in array.elements.iter().flatten() {
        collect_pattern(element, names);
    }
    if let Some(rest) = &array.rest {
        collect_pattern(&rest.argument, names);
    }
}

fn insert_name(identifier: Option<&BindingIdentifier<'_>>, names: &mut HashSet<String>) {
    if let Some(identifier) = identifier {
        names.insert(identifier.name.to_string());
    }
}
