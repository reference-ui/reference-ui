//! Main entry point for Oxc-based TSX parsing and trace generation.
//! Orchestrates the parsing phase of styletrace.
//! Discovers exports, components, factories, and style signal dependencies.

pub mod component;
pub mod context;
pub mod pipeline;
pub mod types;

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::{Path, PathBuf};

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportDefaultDeclarationKind, ExportNamedDeclaration, ImportDeclarationSpecifier,
    ImportOrExportKind, Statement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use crate::analysis::model::{
    ExportTarget, FactoryTarget, TraceComponent, TraceFactory, TraceImport, TraceModule,
};
use crate::analysis::surface::StyleSurface;
use crate::analysis::util::{module_export_name, module_source_literal};
use crate::resolver::StyleTraceError;

use self::component::{
    component_from_expression, component_from_function_declaration, component_from_function_like,
    factory_from_function_declaration, factory_target_from_expression,
};
use self::context::ParserContext;

pub struct ParseState {
    pub components: HashMap<String, TraceComponent>,
    pub component_factories: HashMap<String, FactoryTarget>,
    pub factories: HashMap<String, TraceFactory>,
    pub exports: HashMap<String, ExportTarget>,
    pub export_all_sources: Vec<String>,
}

impl Default for ParseState {
    fn default() -> Self {
        Self {
            components: HashMap::new(),
            component_factories: HashMap::new(),
            factories: HashMap::new(),
            exports: HashMap::new(),
            export_all_sources: Vec::new(),
        }
    }
}

pub(super) fn parse_trace_module(
    path: &Path,
    workspace_root: &Path,
    surface: &StyleSurface,
    staged: &HashMap<PathBuf, &str>,
) -> Result<TraceModule, StyleTraceError> {
    let source = module_source(path, staged)?;

    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::tsx());
    let parsed = Parser::new(&allocator, &source, source_type).parse();
    if !parsed.errors.is_empty() {
        return Err(StyleTraceError::new(format!(
            "failed to parse {}: {} parse error(s)",
            path.display(),
            parsed.errors.len()
        )));
    }

    let mut imports = HashMap::new();
    let mut state = ParseState::default();

    for statement in &parsed.program.body {
        if let Statement::ImportDeclaration(import_decl) = statement {
            collect_imports(&source, import_decl, &mut imports);
        }
    }

    let ctx = ParserContext {
        path,
        workspace_root,
        source: &source,
        surface,
        imports: &imports,
    };

    for statement in &parsed.program.body {
        collect_statement(statement, &ctx, &mut state)?;
    }

    Ok(TraceModule {
        components: state.components,
        component_factories: state.component_factories,
        factories: state.factories,
        exports: state.exports,
        export_all_sources: state.export_all_sources,
    })
}

/// One module's bytes: the staged compile content when present, else a
/// disk read for edge targets beyond the entries.
fn module_source<'a>(
    path: &Path,
    staged: &'a HashMap<PathBuf, &'a str>,
) -> Result<std::borrow::Cow<'a, str>, StyleTraceError> {
    if let Some(content) = staged.get(path) {
        return Ok(std::borrow::Cow::Borrowed(content));
    }
    fs::read_to_string(path)
        .map(std::borrow::Cow::Owned)
        .map_err(|error| StyleTraceError::new(format!("failed to read {}: {error}", path.display())))
}

fn collect_imports(
    source: &str,
    import_decl: &oxc_ast::ast::ImportDeclaration<'_>,
    imports: &mut HashMap<String, TraceImport>,
) {
    let source_module = module_source_literal(source, import_decl.source.span());
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };

    for specifier in specifiers {
        match specifier {
            ImportDeclarationSpecifier::ImportSpecifier(named) => {
                imports.insert(
                    named.local.name.to_string(),
                    TraceImport {
                        source: source_module.clone(),
                        imported_name: module_export_name(source, &named.imported),
                        is_namespace: false,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                if import_decl.import_kind == ImportOrExportKind::Type {
                    continue;
                }
                imports.insert(
                    default_specifier.local.name.to_string(),
                    TraceImport {
                        source: source_module.clone(),
                        imported_name: "default".to_string(),
                        is_namespace: false,
                    },
                );
            }
            ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
                imports.insert(
                    namespace_specifier.local.name.to_string(),
                    TraceImport {
                        source: source_module.clone(),
                        imported_name: "*".to_string(),
                        is_namespace: true,
                    },
                );
            }
        }
    }
}

fn collect_statement(
    statement: &Statement<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match statement {
        Statement::FunctionDeclaration(function) => {
            if let Some((name, component)) = component_from_function_declaration(function, ctx)? {
                state.components.insert(name, component);
            }
            if let Some((name, factory)) = factory_from_function_declaration(function, ctx)? {
                state.factories.insert(name, factory);
            }
        }
        Statement::VariableDeclaration(declaration) => {
            collect_variable_symbols(
                declaration.declarations.iter(),
                ctx,
                &mut state.components,
                &mut state.component_factories,
            )?;
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            collect_export_named_declaration(export_decl, ctx, state)?;
        }
        Statement::ExportDefaultDeclaration(export_default) => {
            collect_export_default_declaration(export_default, ctx, state)?;
        }
        Statement::ExportAllDeclaration(export_all) => {
            state
                .export_all_sources
                .push(module_source_literal(ctx.source, export_all.source.span()));
        }
        _ => {}
    }
    Ok(())
}

fn collect_export_default_declaration(
    export_default: &oxc_allocator::Box<'_, oxc_ast::ast::ExportDefaultDeclaration<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            let component_name = function
                .id
                .as_ref()
                .map(|id| id.name.to_string())
                .unwrap_or_else(|| "__default__".to_string());
            if let Some(component) = component_from_function_like(
                &crate::analysis::parser::component::FunctionLikeContext {
                    name: &component_name,
                    first_param: function.params.items.first(),
                    body_statements: function.body.as_ref().map(|body| &body.statements),
                    wrapper_style_props: BTreeSet::new(),
                },
                ctx,
            )? {
                state.components.insert(component_name.clone(), component);
                state
                    .exports
                    .insert("default".to_string(), ExportTarget::Local(component_name));
            }
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            let name = identifier.name.to_string();
            if state.components.contains_key(&name) || state.component_factories.contains_key(&name)
            {
                state
                    .exports
                    .insert("default".to_string(), ExportTarget::Local(name));
            }
        }
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            if let Some(component) = component_from_function_like(
                &crate::analysis::parser::component::FunctionLikeContext {
                    name: "__default__",
                    first_param: arrow.params.items.first(),
                    body_statements: Some(&arrow.body.statements),
                    wrapper_style_props: BTreeSet::new(),
                },
                ctx,
            )? {
                state
                    .components
                    .insert("__default__".to_string(), component);
                state.exports.insert(
                    "default".to_string(),
                    ExportTarget::Local("__default__".to_string()),
                );
            }
        }
        ExportDefaultDeclarationKind::FunctionExpression(function) => {
            if let Some(component) = component_from_function_like(
                &crate::analysis::parser::component::FunctionLikeContext {
                    name: "__default__",
                    first_param: function.params.items.first(),
                    body_statements: function.body.as_ref().map(|body| &body.statements),
                    wrapper_style_props: BTreeSet::new(),
                },
                ctx,
            )? {
                state
                    .components
                    .insert("__default__".to_string(), component);
                state.exports.insert(
                    "default".to_string(),
                    ExportTarget::Local("__default__".to_string()),
                );
            }
        }
        _ => {}
    }
    Ok(())
}

fn collect_export_named_declaration(
    export_decl: &oxc_allocator::Box<'_, ExportNamedDeclaration<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        collect_export_named_declaration_body(declaration, ctx, state)?;
        return Ok(());
    }

    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| module_source_literal(ctx.source, value.span()));
    for specifier in &export_decl.specifiers {
        let local = module_export_name(ctx.source, &specifier.local);
        let exported = module_export_name(ctx.source, &specifier.exported);

        if let Some(source_module) = &source_module {
            state.exports.insert(
                exported,
                ExportTarget::Imported {
                    source: source_module.clone(),
                    imported_name: local,
                },
            );
            continue;
        }

        if state.components.contains_key(&local) {
            state.exports.insert(exported, ExportTarget::Local(local));
            continue;
        }

        if let Some(import_binding) = ctx.imports.get(&local) {
            state.exports.insert(
                exported,
                ExportTarget::Imported {
                    source: import_binding.source.clone(),
                    imported_name: import_binding.imported_name.clone(),
                },
            );
        }
    }
    Ok(())
}

fn collect_export_named_declaration_body(
    declaration: &Declaration<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match declaration {
        Declaration::FunctionDeclaration(function) => {
            if let Some((name, component)) = component_from_function_declaration(function, ctx)? {
                state.components.insert(name.clone(), component);
                state
                    .exports
                    .insert(name.clone(), ExportTarget::Local(name));
            }
            if let Some((name, factory)) = factory_from_function_declaration(function, ctx)? {
                state.factories.insert(name, factory);
            }
        }
        Declaration::VariableDeclaration(declaration) => {
            collect_variable_symbols(
                declaration.declarations.iter(),
                ctx,
                &mut state.components,
                &mut state.component_factories,
            )?;
            for declarator in &declaration.declarations {
                let oxc_ast::ast::BindingPattern::BindingIdentifier(identifier) = &declarator.id
                else {
                    continue;
                };
                let name = identifier.name.to_string();
                if state.components.contains_key(&name)
                    || state.component_factories.contains_key(&name)
                {
                    state
                        .exports
                        .insert(name.clone(), ExportTarget::Local(name));
                }
            }
        }
        _ => {}
    }
    Ok(())
}

pub fn collect_variable_symbols<'a, I>(
    declarators: I,
    ctx: &ParserContext,
    components: &mut HashMap<String, TraceComponent>,
    component_factories: &mut HashMap<String, FactoryTarget>,
) -> Result<(), StyleTraceError>
where
    I: IntoIterator<Item = &'a oxc_ast::ast::VariableDeclarator<'a>>,
{
    for declarator in declarators {
        let oxc_ast::ast::BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };
        if let Some(component) =
            component_from_expression(&identifier.name.to_string(), init, ctx, BTreeSet::new())?
        {
            components.insert(identifier.name.to_string(), component);
            continue;
        }
        if let Some(factory_target) = factory_target_from_expression(init, ctx.imports) {
            component_factories.insert(identifier.name.to_string(), factory_target);
        }
    }
    Ok(())
}
