use crate::atlas::internal::{
    ComponentDecl, ImportBinding, ImportKind, ModuleInfo, ReExport, TypeDef,
};
use crate::atlas::scanner::SourceFile;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportDefaultDeclarationKind, ImportDeclarationSpecifier, ImportOrExportKind,
    Statement,
};
use oxc_parser::Parser;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

mod components;
mod jsx;
mod types;
mod utils;

use components::{
    collect_variable_components, component_from_arrow, component_from_function_declaration,
    component_from_function_like,
};
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

    for statement in parsed.program.body.iter() {
        collect_statement(
            statement,
            &source_file.path,
            display_source,
            app_relative_path.as_ref(),
            &source_file.content,
            &default_name,
            &mut state,
        );
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
    }
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
}

fn collect_statement(
    statement: &Statement<'_>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    default_name: &str,
    state: &mut ModuleParseState,
) {
    match statement {
        Statement::ImportDeclaration(import_decl) => collect_imports(import_decl, state, source),
        Statement::FunctionDeclaration(function) => {
            if let Some(component) = component_from_function_declaration(
                function,
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state
                    .local_components
                    .insert(component.name.clone(), component);
            }
        }
        Statement::VariableDeclaration(declaration) => collect_variable_components(
            declaration.declarations.iter(),
            file_path,
            display_source,
            app_relative_path,
            source,
            state,
            false,
        ),
        Statement::TSInterfaceDeclaration(interface_decl) => {
            state.types.insert(
                interface_decl.id.name.to_string(),
                TypeDef {
                    expr: type_expr_from_interface(interface_decl, source),
                },
            );
        }
        Statement::TSTypeAliasDeclaration(type_alias) => {
            state.types.insert(
                type_alias.id.name.to_string(),
                TypeDef {
                    expr: type_expr_from_type(&type_alias.type_annotation, source),
                },
            );
        }
        Statement::ExportNamedDeclaration(export_decl) => collect_export_named_declaration(
            export_decl,
            file_path,
            display_source,
            app_relative_path,
            source,
            state,
        ),
        Statement::ExportDefaultDeclaration(export_default) => collect_default_export(
            export_default,
            file_path,
            display_source,
            app_relative_path,
            source,
            default_name,
            state,
        ),
        _ => {}
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

fn collect_export_named_declaration(
    export_decl: &oxc_allocator::Box<'_, oxc_ast::ast::ExportNamedDeclaration<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    state: &mut ModuleParseState,
) {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        match declaration {
            Declaration::FunctionDeclaration(function) => {
                if let Some(component) = component_from_function_declaration(
                    function,
                    file_path,
                    display_source,
                    app_relative_path,
                    source,
                ) {
                    state
                        .local_components
                        .insert(component.name.clone(), component.clone());
                    state
                        .exported_components
                        .insert(component.name.clone(), component);
                }
            }
            Declaration::VariableDeclaration(declaration) => collect_variable_components(
                declaration.declarations.iter(),
                file_path,
                display_source,
                app_relative_path,
                source,
                state,
                true,
            ),
            Declaration::TSInterfaceDeclaration(interface_decl) => {
                state.types.insert(
                    interface_decl.id.name.to_string(),
                    TypeDef {
                        expr: type_expr_from_interface(interface_decl, source),
                    },
                );
            }
            Declaration::TSTypeAliasDeclaration(type_alias) => {
                state.types.insert(
                    type_alias.id.name.to_string(),
                    TypeDef {
                        expr: type_expr_from_type(&type_alias.type_annotation, source),
                    },
                );
            }
            _ => {}
        }
        return;
    }

    let type_only_declaration = export_decl.export_kind == ImportOrExportKind::Type;
    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| unquote(slice_span(source, value.span)));

    for specifier in &export_decl.specifiers {
        let local = module_export_name_to_string(&specifier.local);
        let exported = module_export_name_to_string(&specifier.exported);
        let type_only = type_only_declaration || specifier.export_kind == ImportOrExportKind::Type;

        if let Some(source_module) = &source_module {
            let reexport = ReExport {
                source: source_module.clone(),
                imported: local,
            };
            if type_only {
                state.named_type_reexports.insert(exported, reexport);
            } else {
                state.named_component_reexports.insert(exported, reexport);
            }
            continue;
        }

        if type_only {
            continue;
        }

        if let Some(component) = state.local_components.get(&local).cloned() {
            let mut exported_component = component;
            exported_component.name = exported.clone();
            state
                .exported_components
                .insert(exported, exported_component);
        }
    }
}

fn collect_default_export(
    export_default: &oxc_allocator::Box<'_, oxc_ast::ast::ExportDefaultDeclaration<'_>>,
    file_path: &Path,
    display_source: &str,
    app_relative_path: Option<&String>,
    source: &str,
    default_name: &str,
    state: &mut ModuleParseState,
) {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| default_name.to_string());
            if let Some(component) = component_from_function_like(
                &component_name,
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state
                    .local_components
                    .insert(component.name.clone(), component.clone());
                state
                    .exported_components
                    .insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            let name = identifier.name.to_string();
            if let Some(component) = state.local_components.get(&name).cloned() {
                state
                    .exported_components
                    .entry(name.clone())
                    .or_insert(component);
                state.default_component = Some(name);
            }
        }
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            if let Some(component) = component_from_arrow(
                default_name,
                arrow,
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state
                    .exported_components
                    .insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        ExportDefaultDeclarationKind::FunctionExpression(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| default_name.to_string());
            if let Some(component) = component_from_function_like(
                &component_name,
                function.params.items.first(),
                function.body.as_ref().map(|body| &body.statements),
                file_path,
                display_source,
                app_relative_path,
                source,
            ) {
                state
                    .local_components
                    .insert(component.name.clone(), component.clone());
                state
                    .exported_components
                    .insert(component.name.clone(), component.clone());
                state.default_component = Some(component.name);
            }
        }
        _ => {}
    }
}
