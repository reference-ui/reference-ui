//! Walks each source file's top-level statements into a `ModuleInfo`.
//! It records what the file imports, declares and exports. Collection is split by statement family: imports here, components in `components`,
//! export statements in `exports`, and type shapes in `types`, all sharing one per-file `FileCtx` and one
//! mutable `ModuleParseState`. `parse_modules` takes the discovered source files and returns the module map
//! keyed by path; a file the nesting gate refuses is left out of that map and reported as `ATL-W-SKIPPED-FILE`. The app's own
//! files are parsed once: the same program also yields the JSX occurrences and module-scope names the usage and observe passes read.

mod components;
mod exports;
mod jsx;
mod types;
mod utils;

use crate::diagnostics::{skipped_file, AtlasDiagnostic, DiagnosticError};
use crate::internal::{ComponentDecl, ImportBinding, ImportKind, ModuleInfo, ReExport, TypeDef};
use crate::scanner::SourceFile;
use crate::usage::{find_jsx_occurrences, module_scope_declarations};
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ExportAllDeclaration, Function, ImportDeclarationSpecifier, ImportOrExportKind, Statement,
    TSInterfaceDeclaration, TSTypeAliasDeclaration,
};
use shared::parse::{parse_bounded, NestingRefusal};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

use components::{collect_variable_components, component_from_function_declaration};
use exports::{collect_default_export, collect_export_named_declaration};
use types::{type_expr_from_interface, type_expr_from_type};
use utils::{
    default_export_name, local_source_display, module_export_name_to_string, path_to_posix,
    slice_span, unquote,
};

/// Parses the discovered files into the module map. A file the nesting gate refuses is left out of the map and reported
/// as `ATL-W-SKIPPED-FILE` at its path, so its siblings still analyze.
pub fn parse_modules(
    source_files: &[SourceFile],
    app_root: Option<&Path>,
    package_name: Option<&str>,
    diagnostics: &mut Vec<AtlasDiagnostic>,
) -> Result<HashMap<PathBuf, ModuleInfo>, DiagnosticError> {
    let mut modules = HashMap::new();
    for source_file in source_files {
        let display_source = package_name
            .map(|name| name.to_string())
            .unwrap_or_else(|| local_source_display(app_root.unwrap(), &source_file.path));
        let app_relative_path = app_root
            .and_then(|root| source_file.path.strip_prefix(root).ok())
            .map(path_to_posix);
        let location = app_relative_path
            .clone()
            .unwrap_or_else(|| source_file.path.display().to_string());
        let local = package_name.is_none();
        match parse_module(source_file, &display_source, app_relative_path, local) {
            Ok(module) => {
                modules.insert(source_file.path.clone(), module);
            }
            Err(refusal) => diagnostics.push(skipped_file(&location, refusal)?),
        }
    }
    Ok(modules)
}

/// Parses one file into its module record, or returns the nesting gate's refusal before Oxc sees the file. A `local` file
/// (the app's own, not a package's) also gets its JSX occurrences and module-scope names from the same program.
fn parse_module(
    source_file: &SourceFile,
    display_source: &str,
    app_relative_path: Option<String>,
    local: bool,
) -> Result<ModuleInfo, NestingRefusal> {
    let allocator = Allocator::default();
    let parsed = parse_bounded(&allocator, &source_file.content, source_file.source_type)?;
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

    let (jsx_occurrences, scope_declarations) = if local {
        (
            find_jsx_occurrences(&parsed.program, &source_file.content),
            module_scope_declarations(&parsed.program),
        )
    } else {
        Default::default()
    };

    Ok(ModuleInfo {
        path: source_file.path.clone(),
        display_source: display_source.to_string(),
        imports: state.imports,
        namespace_imports,
        components: state.exported_components,
        default_component: state.default_component,
        named_component_reexports: state.named_component_reexports,
        types: state.types,
        named_type_reexports: state.named_type_reexports,
        star_reexports: state.star_reexports,
        jsx_occurrences,
        scope_declarations,
    })
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

#[cfg(test)]
mod tests {
    use super::parse_modules;
    use crate::scanner::SourceFile;
    use oxc_span::SourceType;
    use std::path::PathBuf;

    #[test]
    fn a_refused_file_is_reported_at_its_path_and_its_sibling_still_parses() {
        let root = PathBuf::from("/app");
        let deep = format!(
            "export const deep = css({{ color: {}'red'{} }})\n",
            "(".repeat(1100),
            ")".repeat(1100)
        );
        let files = vec![
            SourceFile {
                path: root.join("src/Deep.tsx"),
                content: deep,
                source_type: SourceType::tsx(),
            },
            SourceFile {
                path: root.join("src/Card.tsx"),
                content: "export function Card() { return <div /> }\n".to_string(),
                source_type: SourceType::tsx(),
            },
        ];
        let mut diagnostics = Vec::new();
        let modules = parse_modules(&files, Some(&root), None, &mut diagnostics).unwrap();

        assert!(modules.contains_key(&root.join("src/Card.tsx")));
        assert!(!modules.contains_key(&root.join("src/Deep.tsx")));
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(diagnostics[0].code.as_str(), "ATL-W-SKIPPED-FILE");
        assert_eq!(diagnostics[0].file.as_deref(), Some("src/Deep.tsx"));
        assert_eq!(diagnostics[0].line, Some(1));
    }
}
