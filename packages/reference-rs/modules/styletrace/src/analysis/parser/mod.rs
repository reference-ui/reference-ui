//! Main entry point for Oxc-based TSX parsing and trace generation.
//! Orchestrates the parsing phase of styletrace.
//! Discovers exports, components, factories, class components and style signal dependencies.

pub mod classes;
pub mod component;
pub mod context;
pub mod export_resolve;
pub mod exports;
pub mod factory;
mod imports;
pub mod member_alias;
pub mod pipeline;
pub mod types;
pub mod wrappers;

use std::cell::RefCell;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use rustc_hash::FxHashMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    ExportAllDeclaration, ImportOrExportKind, Program, Statement,
};
use shared::parse::parse_bounded;
use oxc_span::{GetSpan, SourceType};

use crate::analysis::model::{
    ExportTarget, FactoryCall, MemberAlias, NamespaceExport, TraceComponent, TraceFactory,
    TraceModule,
};
use crate::analysis::surface::{StyleSurface, TraceSources};
use crate::analysis::util::{module_export_name, module_source_literal};
use crate::resolver::StyleTraceError;

use self::component::{declared_component_from_binding, declared_from_function_declaration};
use self::context::ParserContext;
use self::exports::LocalExports;
use self::imports::collect_imports;
use self::factory::{
    factory_call_from_expression, factory_from_expression, factory_from_function_declaration,
};

#[derive(Default)]
pub struct ParseState {
    pub components: FxHashMap<String, TraceComponent>,
    pub component_factories: FxHashMap<String, FactoryCall>,
    pub factories: FxHashMap<String, TraceFactory>,
    pub exports: HashMap<String, ExportTarget>,
    pub export_all_sources: Vec<String>,
    pub namespace_exports: Vec<NamespaceExport>,
    pub class_components: Vec<String>,
    pub member_aliases: Vec<MemberAlias>,
    pub identifier_aliases: FxHashMap<String, String>,
    pub local_exports: LocalExports,
}

pub(super) fn parse_trace_module(
    path: &Path,
    workspace_root: &Path,
    surface: &StyleSurface,
    sources: &TraceSources,
) -> Result<TraceModule, StyleTraceError> {
    let source = module_source(path, sources.staged)?;
    if let Some(program) = sources.programs.get(path) {
        return fold_trace_module(ModuleFold {
            path,
            workspace_root,
            source: &source,
            program,
            surface,
        });
    }

    let allocator = Allocator::default();
    // Same options as the main-phase parse (atomic `parse_source`): TS on
    // for every extension, so a file the main phase accepts never fails
    // the trace re-parse (C1 keep-alive soundness).
    let source_type = SourceType::from_path(path).unwrap_or_default().with_typescript(true);
    let parsed = parse_bounded(&allocator, &source, source_type)
        .map_err(|refusal| StyleTraceError::new(refusal.message()))?;
    if !parsed.errors.is_empty() {
        return Err(StyleTraceError::new(format!(
            "failed to parse {}: {} parse error(s)",
            path.display(),
            parsed.errors.len()
        )));
    }

    fold_trace_module(ModuleFold {
        path,
        workspace_root,
        source: &source,
        program: &parsed.program,
        surface,
    })
}

/// One module to fold: its path and workspace root, its source text, the parsed program over that
/// text, and the style surface it resolves against.
pub struct ModuleFold<'a, 'b> {
    pub path: &'a Path,
    pub workspace_root: &'a Path,
    pub source: &'a str,
    pub program: &'a Program<'b>,
    pub surface: &'a StyleSurface,
}

/// Fold one program's top level into its trace module. Shared by the
/// fresh-parse path and the retained-program reuse path: a reused program
/// comes from the same bytes with identical options, so the walk observes
/// exactly what a fresh parse of `source` would produce.
pub fn fold_trace_module(input: ModuleFold<'_, '_>) -> Result<TraceModule, StyleTraceError> {
    let ModuleFold {
        path,
        workspace_root,
        source,
        program,
        surface,
    } = input;
    let mut imports = FxHashMap::default();
    let mut state = ParseState::default();

    for statement in &program.body {
        if let Statement::ImportDeclaration(import_decl) = statement {
            collect_imports(source, import_decl, &mut imports);
            exports::collect_type_only_imports(import_decl, &mut state.local_exports.type_only);
        }
    }

    let ctx = ParserContext {
        path,
        workspace_root,
        source,
        surface,
        imports: &imports,
        type_cuts: RefCell::new(Vec::new()),
    };

    for statement in &program.body {
        collect_statement(statement, &ctx, &mut state)?;
    }
    export_resolve::finish(&mut state, &imports);
    let type_cuts = ctx.type_cuts.into_inner();

    Ok(TraceModule {
        components: state.components,
        component_factories: state.component_factories,
        factories: state.factories,
        exports: state.exports,
        export_all_sources: state.export_all_sources,
        namespace_exports: state.namespace_exports,
        class_components: state.class_components,
        type_cuts,
        imports,
        member_aliases: state.member_aliases,
        identifier_aliases: state.identifier_aliases,
    })
}

/// One module's bytes: the staged compile content when present, else a
/// disk read for edge targets beyond the entries.
fn module_source<'a>(
    path: &Path,
    staged: &'a FxHashMap<PathBuf, &'a str>,
) -> Result<std::borrow::Cow<'a, str>, StyleTraceError> {
    if let Some(content) = staged.get(path) {
        return Ok(std::borrow::Cow::Borrowed(content));
    }
    fs::read_to_string(path)
        .map(std::borrow::Cow::Owned)
        .map_err(|error| StyleTraceError::new(format!("failed to read {}: {error}", path.display())))
}

fn collect_statement(
    statement: &Statement<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match statement {
        Statement::FunctionDeclaration(function) => {
            collect_function_statement(function, ctx, state)
        }
        Statement::ClassDeclaration(class) => {
            classes::note_class(class, ctx, &mut state.class_components)
        }
        Statement::VariableDeclaration(declaration) => {
            collect_variable_symbols(declaration.declarations.iter(), ctx, state)
        }
        _ => collect_module_statement(statement, ctx, state),
    }
}

/// Expression statements and module-level exports; every other statement mints nothing here.
fn collect_module_statement(
    statement: &Statement<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match statement {
        Statement::ExpressionStatement(expression) => {
            member_alias::collect_member_alias(expression, &mut state.member_aliases);
            Ok(())
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            exports::collect_export_named_declaration(export_decl, ctx, state)
        }
        Statement::ExportDefaultDeclaration(export_default) => {
            exports::collect_export_default_declaration(export_default, ctx, state)
        }
        Statement::ExportAllDeclaration(export_all) => {
            collect_export_all(export_all, ctx, state);
            Ok(())
        }
        _ => Ok(()),
    }
}

/// A function declaration may be a component, a factory, or both.
fn collect_function_statement(
    function: &oxc_allocator::Box<'_, oxc_ast::ast::Function<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    if let Some((name, component)) = declared_from_function_declaration(function, ctx)? {
        state.components.insert(name, component);
    }
    if let Some((name, factory)) = factory_from_function_declaration(function, ctx)? {
        state.factories.insert(name, factory);
    }
    Ok(())
}

/// `export * from 'source'` re-exports the names the source exposes; `export * as Name from 'source'`
/// exposes them under `Name.`. Type-only forms name no value, so they mint nothing.
fn collect_export_all(
    export_all: &ExportAllDeclaration<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) {
    if export_all.export_kind == ImportOrExportKind::Type {
        return;
    }
    let source = module_source_literal(ctx.source, export_all.source.span());
    match &export_all.exported {
        Some(exported) => state.namespace_exports.push(NamespaceExport {
            namespace: module_export_name(ctx.source, exported),
            source,
        }),
        None => state.export_all_sources.push(source),
    }
}

/// Fold one declaration list into the symbol maps: components, factory definitions and call sites,
/// identifier links (`const A = B`), wrapper links (`const A = memo(B)`), `Object.assign` members,
/// and class components.
pub fn collect_variable_symbols<'a, I>(
    declarators: I,
    ctx: &ParserContext,
    state: &mut ParseState,
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
        collect_declarator_symbol(identifier.name.as_str(), init, ctx, state)?;
    }
    Ok(())
}

/// Fold one `name = init` binding into the symbol maps. The first shape that matches claims the name.
fn collect_declarator_symbol<'a>(
    name: &str,
    init: &'a oxc_ast::ast::Expression<'a>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    wrappers::collect_object_assign_members(name, init, &mut state.member_aliases);
    if let Some((factory_name, factory)) = factory_from_expression(name, init, ctx)? {
        state.factories.insert(factory_name, factory);
    }
    if let oxc_ast::ast::Expression::ClassExpression(class) = init {
        return classes::note_named_class(name, class, ctx, &mut state.class_components);
    }
    if let Some(component) = declared_component_from_binding(name, init, ctx)? {
        state.components.insert(name.to_string(), component);
        return Ok(());
    }
    if let Some(target) = wrappers::react_wrapper_identifier(init, ctx.imports) {
        link_wrapper(state, name, target);
        return Ok(());
    }
    if let Some(call) = factory_call_from_expression(init, ctx) {
        state.component_factories.insert(name.to_string(), call);
        return Ok(());
    }
    member_alias::collect_identifier_alias(name, init, &mut state.identifier_aliases);
    Ok(())
}

/// Link a binding to the identifier its React wrapper call wraps, and mark the link as a
/// wrapper so the export and member walks do not treat the wrapper object as the wrapped one.
fn link_wrapper(state: &mut ParseState, name: &str, target: &str) {
    if target == name {
        return;
    }
    state
        .identifier_aliases
        .insert(name.to_string(), target.to_string());
    state.local_exports.wrapper_links.insert(name.to_string());
}
