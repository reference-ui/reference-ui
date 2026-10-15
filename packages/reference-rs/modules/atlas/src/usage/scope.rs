//! Module-scope declarations of one source file: the names its functions, classes, variables
//! (destructured ones included) and enums bind at the top level, exported or not.
//! Takes a module's source and emits that name set, so the observation pass can tell a locally
//! defined `Div` from the library primitive. Imports are left out because `ModuleInfo.imports`
//! already records them, and declarations nested inside function bodies are not modeled.

use crate::internal::ModuleInfo;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ArrayPattern, BindingIdentifier, BindingPattern, Declaration, ExportDefaultDeclarationKind,
    ObjectPattern, Statement, VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_span::SourceType;
use std::collections::HashSet;

pub(super) fn module_scope_declarations(module: &ModuleInfo) -> HashSet<String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&module.path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &module.content, source_type).parse();
    let mut names = HashSet::new();

    for statement in parsed.program.body.iter() {
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
