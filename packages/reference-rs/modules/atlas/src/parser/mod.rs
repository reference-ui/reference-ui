//! Walks each source file's top-level statements and records what the file imports, declares and exports
//! into a `ModuleInfo`. Collection is split by statement family: imports here, components in `components`,
//! export statements in `exports`, and type shapes in `types`, all sharing one per-file `FileCtx` and one
//! mutable `ModuleParseState`. `parse_modules` takes the discovered source files and returns the module map
//! keyed by path.

mod components;
mod exports;
mod jsx;
mod types;
mod utils;

use crate::internal::{ComponentDecl, ImportBinding, ImportKind, ModuleInfo, ReExport, TypeDef};
use crate::scanner::SourceFile;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ExportAllDeclaration, Function, ImportDeclarationSpecifier, ImportOrExportKind, Statement,
    TSInterfaceDeclaration, TSTypeAliasDeclaration,
};
use oxc_parser::Parser;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

use components::{collect_variable_components, component_from_function_declaration};
use exports::{collect_default_export, collect_export_named_declaration};
use types::{type_expr_from_interface, type_expr_from_type};
use utils::{
    default_export_name, local_source_display, module_export_name_to_string, path_to_posix,
    slice_span, unquote,
};

pub fn parse_modules(
    source_files: &[SourceFile],
    app_root: Option<&Path>,
    package_name: Option<&str>,
) -> HashMap<PathBuf, ModuleInfo> {
    source_files
        .iter()
        .map(|source_file| {
            let display_source = package_name
                .map(|name| name.to_string())
                .unwrap_or_else(|| local_source_display(app_root.unwrap(), &source_file.path));
            let app_relative_path = app_root
                .and_then(|root| source_file.path.strip_prefix(root).ok())
                .map(path_to_posix);

            (
                source_file.path.clone(),
                parse_module(source_file, &display_source, app_relative_path),
            )
        })
        .collect()
}

fn parse_module(
    source_file: &SourceFile,
    display_source: &str,
    app_relative_path: Option<String>,
) -> ModuleInfo {
    let allocator = Allocator::default();
    let parsed = Parser::new(&allocator, &source_file.content, source_file.source_type).parse();
    let mut state = ModuleParseState::default();
    let default_name = default_export_name(&source_file.path);
    let ctx = FileCtx {
        file_path: &source_file.path,
        display_source,
        app_relative_path: app_relative_path.as_ref(),
        source: &source_file.content,
        default_name: &default_name,
    };

    for statement in parsed.program.body.iter() {
        collect_statement(statement, &ctx, &mut state);
    }

    let namespace_imports = state
        .imports
        .values()
        .filter(|binding| binding.kind == ImportKind::Namespace)
        .map(|binding| (binding.local.clone(), binding.source.clone()))
        .collect::<HashMap<_, _>>();

    ModuleInfo {
        path: source_file.path.clone(),
        content: source_file.content.clone(),
        display_source: display_source.to_string(),
        imports: state.imports,
        namespace_imports,
        components: state.exported_components,
        default_component: state.default_component,
        named_component_reexports: state.named_component_reexports,
        types: state.types,
        named_type_reexports: state.named_type_reexports,
        star_reexports: state.star_reexports,
    }
}

/// What the file being read exposes to every collector: its path and display name, its app-relative
/// path when it has one, the text its spans slice, and the name a default export takes.
struct FileCtx<'a> {
    file_path: &'a Path,
    display_source: &'a str,
    app_relative_path: Option<&'a String>,
    source: &'a str,
    default_name: &'a str,
}

#[derive(Default)]
struct ModuleParseState {
    imports: HashMap<String, ImportBinding>,
    local_components: HashMap<String, ComponentDecl>,
    exported_components: HashMap<String, ComponentDecl>,
    default_component: Option<String>,
    named_component_reexports: HashMap<String, ReExport>,
    types: HashMap<String, TypeDef>,
    named_type_reexports: HashMap<String, ReExport>,
    star_reexports: Vec<String>,
}

fn collect_statement(statement: &Statement<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    match statement {
        Statement::ImportDeclaration(import_decl) => collect_imports(import_decl, state, ctx.source),
        Statement::VariableDeclaration(declaration) => {
            collect_variable_components(declaration.declarations.iter(), ctx, state, false)
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            collect_export_named_declaration(export_decl, ctx, state)
        }
        Statement::ExportDefaultDeclaration(export_default) => {
            collect_default_export(export_default, ctx, state)
        }
        _ => collect_other_statement(statement, ctx, state),
    }
}

fn collect_other_statement(statement: &Statement<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    match statement {
        Statement::FunctionDeclaration(function) => collect_function_declaration(function, ctx, state),
        Statement::TSInterfaceDeclaration(interface_decl) => {
            collect_interface(interface_decl, ctx.source, state)
        }
        Statement::TSTypeAliasDeclaration(type_alias) => collect_type_alias(type_alias, ctx.source, state),
        Statement::ExportAllDeclaration(export_all) => collect_export_all(export_all, ctx.source, state),
        _ => {}
    }
}

fn collect_function_declaration(function: &Function<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    if let Some(component) = component_from_function_declaration(function, ctx) {
        state
            .local_components
            .insert(component.name.clone(), component);
    }
}

fn collect_interface(interface_decl: &TSInterfaceDeclaration<'_>, source: &str, state: &mut ModuleParseState) {
    state.types.insert(
        interface_decl.id.name.to_string(),
        TypeDef {
            expr: type_expr_from_interface(interface_decl, source),
        },
    );
}

fn collect_type_alias(type_alias: &TSTypeAliasDeclaration<'_>, source: &str, state: &mut ModuleParseState) {
    state.types.insert(
        type_alias.id.name.to_string(),
        TypeDef {
            expr: type_expr_from_type(&type_alias.type_annotation, source),
        },
    );
}

fn collect_export_all(export_all: &ExportAllDeclaration<'_>, source: &str, state: &mut ModuleParseState) {
    if export_all.exported.is_none() {
        let source_module = unquote(slice_span(source, export_all.source.span));
        state.star_reexports.push(source_module);
    }
}

fn collect_imports(
    import_decl: &oxc_allocator::Box<'_, oxc_ast::ast::ImportDeclaration<'_>>,
    state: &mut ModuleParseState,
    source: &str,
) {
    let source_module = unquote(slice_span(source, import_decl.source.span));
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };

    for specifier in specifiers {
        match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(named) => {
                let local = named.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: Some(module_export_name_to_string(&named.imported)),
                        kind: ImportKind::Named,
                        is_type: named.import_kind == ImportOrExportKind::Type,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                let local = default_specifier.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: Some("default".to_string()),
                        kind: ImportKind::Default,
                        is_type: import_decl.import_kind == ImportOrExportKind::Type,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
                let local = namespace_specifier.local.name.to_string();
                state.imports.insert(
                    local.clone(),
                    ImportBinding {
                        source: source_module.clone(),
                        local,
                        imported: None,
                        kind: ImportKind::Namespace,
                        is_type: false,
                    },
                );
            }
        }
    }
}
