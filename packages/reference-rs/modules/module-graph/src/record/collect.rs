//! The record collection walk: top-level statements to edges and shapes.
//!
//! Takes a default [`ModuleRecord`] plus one [`Statement`] at a time and
//! files each under its shape: import declarations become [`ImportEdge`]
//! values, export declarations become [`ExportShape`], star, or default
//! entries, and every other top-level declaration contributes its bound
//! names to the declared set. Module statements and plain declarations
//! dispatch separately so each match stays small enough to analyze.

use oxc_ast::ast::{
    ArrayPattern, BindingIdentifier, BindingPattern, Declaration, ExportAllDeclaration,
    ExportDefaultDeclaration, ExportDefaultDeclarationKind, ExportNamedDeclaration,
    ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind, ModuleExportName,
    ObjectPattern, Statement, VariableDeclaration,
};

use super::{DefaultExport, ExportShape, Imported, ModuleRecord};

/// Collect the module shape of one top-level statement.
pub(super) fn statement(record: &mut ModuleRecord, statement: &Statement<'_>) {
    match statement {
        Statement::ImportDeclaration(decl) => record_import(record, decl),
        Statement::ExportNamedDeclaration(decl) => record_export_named(record, decl),
        Statement::ExportDefaultDeclaration(decl) => record_export_default(record, decl),
        Statement::ExportAllDeclaration(decl) => record_export_star(record, decl),
        other => record_declared(record, other),
    }
}

/// Bind the names of one plain top-level declaration; the rest binds nothing.
fn record_declared(record: &mut ModuleRecord, statement: &Statement<'_>) {
    match statement {
        Statement::VariableDeclaration(var) => insert_var_names(record, var, false),
        Statement::FunctionDeclaration(func) => insert_opt_name(record, func.id.as_ref(), false),
        Statement::ClassDeclaration(class) => insert_opt_name(record, class.id.as_ref(), false),
        other => record_ts_statement(record, other, false),
    }
}

/// Bind the name of a `TS*` declaration statement; the rest binds nothing.
fn record_ts_statement(record: &mut ModuleRecord, statement: &Statement<'_>, export: bool) {
    let name = match statement {
        Statement::TSEnumDeclaration(e) => Some(e.id.name.as_str()),
        Statement::TSTypeAliasDeclaration(a) => Some(a.id.name.as_str()),
        Statement::TSInterfaceDeclaration(i) => Some(i.id.name.as_str()),
        _ => None,
    };
    if let Some(name) = name {
        insert_named(record, name, export);
    }
}

/// Record the value imports of one import declaration.
fn record_import(record: &mut ModuleRecord, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    let specifier = decl.source.value.to_string();
    for spec in specifiers {
        record_import_specifier(record, spec, &specifier);
    }
}

/// Record one import specifier: named, default, or namespace.
fn record_import_specifier(
    record: &mut ModuleRecord,
    spec: &ImportDeclarationSpecifier<'_>,
    specifier: &str,
) {
    match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind != ImportOrExportKind::Type {
                // import { brand as primary } from './tokens'
                let imported = Imported::Named(export_name(&named.imported));
                push_edge(record, &named.local.name, imported, specifier);
            }
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            push_edge(record, &default.local.name, Imported::Default, specifier);
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace) => {
            push_edge(
                record,
                &namespace.local.name,
                Imported::Namespace,
                specifier,
            );
        }
    }
}

/// Push one import edge onto the record.
fn push_edge(record: &mut ModuleRecord, local: &str, imported: Imported, specifier: &str) {
    record.imports.push(super::ImportEdge {
        local: local.to_string(),
        imported,
        specifier: specifier.to_string(),
    });
}

/// Record one `export …` declaration, skipping type-only exports.
fn record_export_named(record: &mut ModuleRecord, decl: &ExportNamedDeclaration<'_>) {
    if decl.export_kind == ImportOrExportKind::Type {
        return;
    }
    if let Some(declaration) = &decl.declaration {
        record_export_declaration(record, declaration);
        return;
    }
    match &decl.source {
        Some(source) => record_export_from(record, decl, source.value.as_str()),
        None => record_export_local(record, decl),
    }
}

/// Record `export const x`, `export function f`, and friends.
fn record_export_declaration(record: &mut ModuleRecord, declaration: &Declaration<'_>) {
    match declaration {
        Declaration::VariableDeclaration(var) => insert_var_names(record, var, true),
        Declaration::FunctionDeclaration(func) => insert_opt_name(record, func.id.as_ref(), true),
        Declaration::ClassDeclaration(class) => insert_opt_name(record, class.id.as_ref(), true),
        other => record_ts_declaration(record, other),
    }
}

/// Bind and export the name of a `TS*` export declaration, if it has one.
fn record_ts_declaration(record: &mut ModuleRecord, declaration: &Declaration<'_>) {
    let name = match declaration {
        Declaration::TSEnumDeclaration(e) => Some(e.id.name.as_str()),
        Declaration::TSTypeAliasDeclaration(a) => Some(a.id.name.as_str()),
        Declaration::TSInterfaceDeclaration(i) => Some(i.id.name.as_str()),
        _ => None,
    };
    if let Some(name) = name {
        insert_named(record, name, true);
    }
}

/// Bind every name a variable declaration binds, exporting when asked.
fn insert_var_names(record: &mut ModuleRecord, var: &VariableDeclaration<'_>, export: bool) {
    for declarator in &var.declarations {
        for name in pattern_names(&declarator.id) {
            insert_named(record, &name, export);
        }
    }
}

/// Bind a function or class id when named, exporting when asked.
fn insert_opt_name(record: &mut ModuleRecord, id: Option<&BindingIdentifier<'_>>, export: bool) {
    if let Some(id) = id {
        insert_named(record, id.name.as_str(), export);
    }
}

/// Bind one declared name, and export it under itself when asked.
fn insert_named(record: &mut ModuleRecord, name: &str, export: bool) {
    record.declared.insert(name.to_string());
    if export {
        record.exports.insert_local(name);
    }
}

/// Record `export { a, b as c }`, routing `default` to the default slot.
fn record_export_local(record: &mut ModuleRecord, decl: &ExportNamedDeclaration<'_>) {
    for spec in &decl.specifiers {
        if spec.export_kind == ImportOrExportKind::Type {
            continue;
        }
        // export { gap as space }  — `space` reads local `gap`
        let local = export_name(&spec.local);
        let exported = export_name(&spec.exported);
        record
            .exports
            .insert_exported(&exported, ExportShape::Local(local));
    }
}

/// Record `export { a, b as c } from './x'`, routing `default` along.
fn record_export_from(
    record: &mut ModuleRecord,
    decl: &ExportNamedDeclaration<'_>,
    specifier: &str,
) {
    for spec in &decl.specifiers {
        if spec.export_kind == ImportOrExportKind::Type {
            continue;
        }
        // export { gap as space } from './barrel'
        record.exports.insert_exported(
            &export_name(&spec.exported),
            ExportShape::Hop {
                imported: export_name(&spec.local),
                specifier: specifier.to_string(),
            },
        );
    }
}

/// Record `export default …`: named declarations bind, the rest is anonymous.
fn record_export_default(record: &mut ModuleRecord, decl: &ExportDefaultDeclaration<'_>) {
    let default = match &decl.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(func) => {
            default_named(record, func.id.as_ref().map(|id| id.name.as_str()))
        }
        ExportDefaultDeclarationKind::ClassDeclaration(class) => {
            default_named(record, class.id.as_ref().map(|id| id.name.as_str()))
        }
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(interface) => {
            default_named(record, Some(interface.id.name.as_str()))
        }
        ExportDefaultDeclarationKind::Identifier(id) => DefaultExport::Local(id.name.to_string()),
        _ => DefaultExport::Anonymous,
    };
    record.exports.set_default(default);
}

/// A named default declaration: bound locally, or anonymous when unnamed.
fn default_named(record: &mut ModuleRecord, name: Option<&str>) -> DefaultExport {
    match name {
        Some(name) => {
            record.declared.insert(name.to_string());
            DefaultExport::Local(name.to_string())
        }
        None => DefaultExport::Anonymous,
    }
}

/// Record `export * from './x'`; `export * as ns` has no member shape to keep.
fn record_export_star(record: &mut ModuleRecord, decl: &ExportAllDeclaration<'_>) {
    if decl.export_kind == ImportOrExportKind::Type || decl.exported.is_some() {
        return;
    }
    record.exports.push_star(decl.source.value.as_str());
}

/// The string behind an export name: identifier or string literal.
fn export_name(name: &ModuleExportName<'_>) -> String {
    match name {
        ModuleExportName::IdentifierName(id) => id.name.to_string(),
        ModuleExportName::IdentifierReference(id) => id.name.to_string(),
        ModuleExportName::StringLiteral(lit) => lit.value.to_string(),
    }
}

/// Every name a binding pattern declares, including nested patterns.
fn pattern_names(pattern: &BindingPattern<'_>) -> Vec<String> {
    let mut out = Vec::new();
    collect_pattern_names(pattern, &mut out);
    out
}

/// Walk one binding pattern, pushing each declared identifier.
fn collect_pattern_names(pattern: &BindingPattern<'_>, out: &mut Vec<String>) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => out.push(id.name.to_string()),
        BindingPattern::ObjectPattern(obj) => collect_object_pattern(obj, out),
        BindingPattern::ArrayPattern(arr) => collect_array_pattern(arr, out),
        BindingPattern::AssignmentPattern(assign) => collect_pattern_names(&assign.left, out),
    }
}

/// Push every name an object pattern declares, rest included.
fn collect_object_pattern(obj: &ObjectPattern<'_>, out: &mut Vec<String>) {
    for prop in &obj.properties {
        collect_pattern_names(&prop.value, out);
    }
    if let Some(rest) = &obj.rest {
        collect_pattern_names(&rest.argument, out);
    }
}

/// Push every name an array pattern declares, holes bound to nothing.
fn collect_array_pattern(arr: &ArrayPattern<'_>, out: &mut Vec<String>) {
    for element in arr.elements.iter().flatten() {
        collect_pattern_names(element, out);
    }
    if let Some(rest) = &arr.rest {
        collect_pattern_names(&rest.argument, out);
    }
}
