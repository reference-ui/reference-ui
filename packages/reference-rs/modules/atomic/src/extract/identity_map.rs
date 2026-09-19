//! Per-file export surfaces for the re-export identity walk.
//!
//! Parses one project file into its owned export surface: named exports,
//! star sources, and value imports. A re-export hop (`export { a as b }
//! from './x'`) points across modules; a local re-export (`export { a }`)
//! resolves through this file's imports; an exported declaration
//! (`export const b`) is opaque — a consumer value, never Reference
//! identity. Type-only imports and exports bind no runtime value and are
//! skipped, matching the direct-Reference pass in `bindings.rs`.

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ArrayPattern, BindingIdentifier, BindingPattern, Declaration, ExportAllDeclaration,
    ExportDefaultDeclaration, ExportDefaultDeclarationKind, ExportNamedDeclaration,
    ExportSpecifier, ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    ObjectPattern, Program, Statement, StringLiteral, TSModuleDeclarationName, VariableDeclaration,
};
use oxc_parser::Parser;
use oxc_span::SourceType;
use std::path::Path;

use super::bindings::imported_name;

/// What one exported name points at: another module, a local name, or an opaque declaration.
#[derive(Debug)]
pub(crate) enum NamedTarget {
    /// `export { a as b } from './x'`: follow `a` in `./x`.
    ReExport {
        specifier: Box<str>,
        imported: Box<str>,
    },
    /// `export { a as b }` / `export default a`: resolve local `a` through this file's imports.
    Local(Box<str>),
    /// A consumer declaration (`export const b`, `export * as b`, `export default <expr>`).
    Opaque,
}

/// One value import of a file, for resolving re-exported locals.
#[derive(Debug)]
pub(crate) struct FileImport {
    pub(crate) local: Box<str>,
    pub(crate) imported: Box<str>,
    pub(crate) specifier: Box<str>,
}

/// Owned export surface of one project file: named exports, star sources, and value imports.
#[derive(Debug, Default)]
pub(crate) struct ExportMap {
    named: Vec<(Box<str>, NamedTarget)>,
    stars: Vec<Box<str>>,
    imports: Vec<FileImport>,
}

impl ExportMap {
    /// First target exported under `name`; duplicates are author errors.
    pub(crate) fn named_target(&self, name: &str) -> Option<&NamedTarget> {
        self.named
            .iter()
            .find(|(exported, _)| exported.as_ref() == name)
            .map(|(_, target)| target)
    }

    /// Star re-export sources in authored order, for the fallback walk.
    pub(crate) fn stars(&self) -> &[Box<str>] {
        &self.stars
    }

    /// The value import behind a local name, if the file imports it.
    pub(crate) fn import_of(&self, local: &str) -> Option<&FileImport> {
        self.imports.iter().find(|imp| imp.local.as_ref() == local)
    }
}

/// Parse one file's export surface; a panicked parse is an opaque dead end.
pub(crate) fn parse_export_map(content: &str, path: &str) -> Option<ExportMap> {
    let allocator = Allocator::default();
    // Mirror lib.rs: JSX follows the extension, TypeScript always on.
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    let parsed = Parser::new(&allocator, content, source_type).parse();
    if parsed.panicked {
        return None;
    }
    Some(collect_map(&parsed.program))
}

/// Fold a program's top level into its export surface.
fn collect_map(program: &Program<'_>) -> ExportMap {
    let mut map = ExportMap::default();
    for stmt in &program.body {
        collect_statement(&mut map, stmt);
    }
    map
}

/// Sort one top-level statement into imports or exports; declarations only
/// matter when exported, so bare statements fall through.
fn collect_statement(map: &mut ExportMap, stmt: &Statement<'_>) {
    match stmt {
        Statement::ImportDeclaration(decl) => collect_file_imports(map, decl),
        Statement::ExportNamedDeclaration(decl) => collect_named_export(map, decl),
        Statement::ExportDefaultDeclaration(decl) => collect_default_export(map, decl),
        Statement::ExportAllDeclaration(decl) => collect_star_export(map, decl),
        _ => {}
    }
}

/// Record value imports; type-only imports bind no runtime value.
fn collect_file_imports(map: &mut ExportMap, decl: &ImportDeclaration<'_>) {
    if decl.import_kind == ImportOrExportKind::Type {
        return;
    }
    let Some(specifiers) = &decl.specifiers else {
        return;
    };
    for spec in specifiers {
        collect_file_specifier(map, decl.source.value.as_str(), spec);
    }
}

/// One import specifier as a file import; namespace imports record `*`.
fn collect_file_specifier(
    map: &mut ExportMap,
    source: &str,
    spec: &ImportDeclarationSpecifier<'_>,
) {
    let (local, imported) = match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            if named.import_kind == ImportOrExportKind::Type {
                return;
            }
            (named.local.name.as_str(), imported_name(&named.imported))
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => {
            (default.local.name.as_str(), "default".to_string())
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(ns) => {
            (ns.local.name.as_str(), "*".to_string())
        }
    };
    map.imports.push(FileImport {
        local: local.into(),
        imported: imported.into(),
        specifier: source.into(),
    });
}

/// Named exports: `export { a as b } [from './x']`, or exported declarations.
fn collect_named_export(map: &mut ExportMap, decl: &ExportNamedDeclaration<'_>) {
    if let Some(declaration) = &decl.declaration {
        collect_declaration_names(map, declaration);
        return;
    }
    if decl.export_kind == ImportOrExportKind::Type {
        return;
    }
    for spec in &decl.specifiers {
        collect_export_specifier(map, decl.source.as_ref(), spec);
    }
}

/// One `export { a as b } [from './x']`: a hop with a source, a local without.
fn collect_export_specifier(
    map: &mut ExportMap,
    source: Option<&StringLiteral<'_>>,
    spec: &ExportSpecifier<'_>,
) {
    if spec.export_kind == ImportOrExportKind::Type {
        return;
    }
    let exported = imported_name(&spec.exported);
    let target = match source {
        Some(source) => NamedTarget::ReExport {
            specifier: source.value.as_str().into(),
            imported: imported_name(&spec.local).into(),
        },
        None => NamedTarget::Local(imported_name(&spec.local).into()),
    };
    map.named.push((exported.into(), target));
}

/// `export default <expr>`: an identifier stays local, anything else is opaque.
fn collect_default_export(map: &mut ExportMap, decl: &ExportDefaultDeclaration<'_>) {
    match &decl.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(func) => {
            collect_binding_id(map, func.id.as_ref());
            push_opaque(map, "default");
        }
        ExportDefaultDeclarationKind::ClassDeclaration(class) => {
            collect_binding_id(map, class.id.as_ref());
            push_opaque(map, "default");
        }
        ExportDefaultDeclarationKind::Identifier(ident) => {
            map.named.push((
                "default".into(),
                NamedTarget::Local(ident.name.as_str().into()),
            ));
        }
        _ => push_opaque(map, "default"),
    }
}

/// `export * from './x'`; `export * as ns` names an opaque namespace object.
fn collect_star_export(map: &mut ExportMap, decl: &ExportAllDeclaration<'_>) {
    if decl.export_kind == ImportOrExportKind::Type {
        return;
    }
    if let Some(exported) = &decl.exported {
        map.named
            .push((imported_name(exported).into(), NamedTarget::Opaque));
        return;
    }
    map.stars.push(decl.source.value.as_str().into());
}

/// Declared names of an `export <declaration>`; every one exports opaque,
/// which also shadows same-named star re-exports per ESM.
fn collect_declaration_names(map: &mut ExportMap, declaration: &Declaration<'_>) {
    match declaration {
        Declaration::VariableDeclaration(decl) => collect_declarator_names(map, decl),
        Declaration::FunctionDeclaration(func) => collect_binding_id(map, func.id.as_ref()),
        Declaration::ClassDeclaration(class) => collect_binding_id(map, class.id.as_ref()),
        _ => collect_ts_declaration_names(map, declaration),
    }
}

/// Every name a variable declaration binds, each an opaque export.
fn collect_declarator_names(map: &mut ExportMap, decl: &VariableDeclaration<'_>) {
    for declarator in &decl.declarations {
        collect_pattern_names(map, &declarator.id);
    }
}

/// TS declaration names of an `export <declaration>`; opaque like all exports.
fn collect_ts_declaration_names(map: &mut ExportMap, declaration: &Declaration<'_>) {
    if let Some(name) = ts_declaration_name(declaration) {
        push_opaque(map, name);
    } else if let Declaration::TSModuleDeclaration(decl) = declaration {
        collect_module_name(map, &decl.id);
    }
}

/// The bound name of a TS type, interface, enum, or import-equals declaration.
fn ts_declaration_name<'a>(declaration: &Declaration<'a>) -> Option<&'a str> {
    match declaration {
        Declaration::TSTypeAliasDeclaration(decl) => Some(decl.id.name.as_str()),
        Declaration::TSInterfaceDeclaration(decl) => Some(decl.id.name.as_str()),
        Declaration::TSEnumDeclaration(decl) => Some(decl.id.name.as_str()),
        Declaration::TSImportEqualsDeclaration(decl) => Some(decl.id.name.as_str()),
        _ => None,
    }
}

/// Every name a binding pattern binds, each an opaque export.
fn collect_pattern_names(map: &mut ExportMap, pattern: &BindingPattern<'_>) {
    match pattern {
        BindingPattern::BindingIdentifier(id) => push_opaque(map, id.name.as_str()),
        BindingPattern::ObjectPattern(obj) => collect_object_pattern_names(map, obj),
        BindingPattern::ArrayPattern(arr) => collect_array_pattern_names(map, arr),
        BindingPattern::AssignmentPattern(assign) => collect_pattern_names(map, &assign.left),
    }
}

/// Property and rest names of an object pattern.
fn collect_object_pattern_names(map: &mut ExportMap, obj: &ObjectPattern<'_>) {
    for prop in &obj.properties {
        collect_pattern_names(map, &prop.value);
    }
    if let Some(rest) = &obj.rest {
        collect_pattern_names(map, &rest.argument);
    }
}

/// Element and rest names of an array pattern; holes bind nothing.
fn collect_array_pattern_names(map: &mut ExportMap, arr: &ArrayPattern<'_>) {
    for element in arr.elements.iter().flatten() {
        collect_pattern_names(map, element);
    }
    if let Some(rest) = &arr.rest {
        collect_pattern_names(map, &rest.argument);
    }
}

/// An optional function or class name as an opaque export.
fn collect_binding_id(map: &mut ExportMap, id: Option<&BindingIdentifier<'_>>) {
    if let Some(name) = id {
        push_opaque(map, name.name.as_str());
    }
}

/// A namespace name as an opaque export; string-literal module names never bind.
fn collect_module_name(map: &mut ExportMap, name: &TSModuleDeclarationName<'_>) {
    if let TSModuleDeclarationName::Identifier(id) = name {
        push_opaque(map, id.name.as_str());
    }
}

/// Record one opaque export: a consumer value, never Reference identity.
fn push_opaque(map: &mut ExportMap, name: &str) {
    map.named.push((name.into(), NamedTarget::Opaque));
}
