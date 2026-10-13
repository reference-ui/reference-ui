//! Collects a module's named exports during the statement walk, before any binding is resolved.
//! Export specifiers, declarations and identifier-valued declarators record `(exported, local)` pairs, so an export may name a binding declared later in the file.
//! The walk also keeps the facts resolution needs: which bindings are type-only imports, and which identifier links run through a memo or forwardRef wrapper.
//! Type-only exports (`export type { ... }` and `export { type X }`) record no pair, so they mint no name.

use std::collections::BTreeSet;

use oxc_ast::ast::{
    BindingPattern, Declaration, ExportDefaultDeclarationKind, ExportNamedDeclaration,
    ArrowFunctionExpression, ExportSpecifier, Function, ImportDeclaration,
    ImportDeclarationSpecifier, ImportOrExportKind, VariableDeclaration,
};
use oxc_span::GetSpan;

use crate::analysis::model::{ExportTarget, TraceComponent};
use crate::analysis::util::{module_export_name, module_source_literal};
use crate::resolver::StyleTraceError;

use super::component::{
    component_from_function_declaration, component_from_function_like,
    factory_from_function_declaration, FunctionLikeContext,
};
use super::context::ParserContext;
use super::{collect_variable_symbols, ParseState};

pub(super) const DEFAULT_EXPORT: &str = "default";
const ANONYMOUS_DEFAULT: &str = "__default__";

/// One export of a local binding: the public `exported` name (`default` for the default
/// export) and the module-level `local` binding it names.
pub struct LocalExport {
    pub exported: String,
    pub local: String,
}

/// Export-side state gathered while walking the module, settled by `export_resolve::finish`.
#[derive(Default)]
pub struct LocalExports {
    pub entries: Vec<LocalExport>,
    /// Bindings introduced by `import type` or `import { type X }`; they name no value.
    pub type_only: BTreeSet<String>,
    /// Bindings whose identifier link runs through `memo` or `forwardRef`. The wrapper is a new
    /// object, so these links trace the wrapped component but carry no compound-member identity.
    pub wrapper_links: BTreeSet<String>,
}

/// Record `import type` bindings so the export walk never mints a name for them.
pub(super) fn collect_type_only_imports(
    import_decl: &ImportDeclaration<'_>,
    type_only: &mut BTreeSet<String>,
) {
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };
    let whole_declaration_is_type = import_decl.import_kind == ImportOrExportKind::Type;
    type_only.extend(
        specifiers
            .iter()
            .filter_map(|specifier| type_only_binding(specifier, whole_declaration_is_type)),
    );
}

/// The local name an import specifier binds when the specifier, or its whole declaration, is type-only.
fn type_only_binding(
    specifier: &ImportDeclarationSpecifier<'_>,
    whole_declaration_is_type: bool,
) -> Option<String> {
    let (local, named_type) = match specifier {
        ImportDeclarationSpecifier::ImportSpecifier(named) => (
            named.local.name.as_str(),
            named.import_kind == ImportOrExportKind::Type,
        ),
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
            (default_specifier.local.name.as_str(), false)
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
            (namespace_specifier.local.name.as_str(), false)
        }
    };
    (whole_declaration_is_type || named_type).then(|| local.to_string())
}

pub(super) fn collect_export_named_declaration(
    export_decl: &oxc_allocator::Box<'_, ExportNamedDeclaration<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        return collect_export_named_declaration_body(declaration, ctx, state);
    }
    // `export type { ... }` names only types, so none of its specifiers mint.
    if export_decl.export_kind == ImportOrExportKind::Type {
        return Ok(());
    }

    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| module_source_literal(ctx.source, value.span()));
    for specifier in &export_decl.specifiers {
        if specifier.export_kind != ImportOrExportKind::Type {
            record_specifier(ctx, specifier, source_module.as_deref(), state);
        }
    }
    Ok(())
}

/// One `export { local as exported }` specifier: a re-export from `source_module` when present,
/// else a local binding resolved once the module is complete.
fn record_specifier(
    ctx: &ParserContext,
    specifier: &ExportSpecifier<'_>,
    source_module: Option<&str>,
    state: &mut ParseState,
) {
    let local = module_export_name(ctx.source, &specifier.local);
    let exported = module_export_name(ctx.source, &specifier.exported);
    match source_module {
        Some(source) => {
            state.exports.insert(
                exported,
                ExportTarget::Imported {
                    source: source.to_string(),
                    imported_name: local,
                },
            );
        }
        None => state
            .local_exports
            .entries
            .push(LocalExport { exported, local }),
    }
}

fn collect_export_named_declaration_body(
    declaration: &Declaration<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    match declaration {
        Declaration::FunctionDeclaration(function) => {
            collect_function_export(function, ctx, state)
        }
        Declaration::VariableDeclaration(declaration) => {
            collect_variable_export(declaration, ctx, state)
        }
        _ => Ok(()),
    }
}

fn collect_function_export(
    function: &oxc_allocator::Box<'_, Function<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    if let Some((name, component)) = component_from_function_declaration(function, ctx)? {
        state.components.insert(name, component);
    }
    if let Some((name, factory)) = factory_from_function_declaration(function, ctx)? {
        state.factories.insert(name, factory);
    }
    if let Some(id) = function.id.as_ref() {
        record_named_export(state, id.name.as_str());
    }
    Ok(())
}

fn collect_variable_export(
    declaration: &VariableDeclaration<'_>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    collect_variable_symbols(declaration.declarations.iter(), ctx, state)?;
    for declarator in &declaration.declarations {
        if let BindingPattern::BindingIdentifier(identifier) = &declarator.id {
            record_named_export(state, identifier.name.as_str());
        }
    }
    Ok(())
}

fn record_named_export(state: &mut ParseState, name: &str) {
    state.local_exports.entries.push(LocalExport {
        exported: name.to_string(),
        local: name.to_string(),
    });
}

pub(super) fn collect_export_default_declaration(
    export_default: &oxc_allocator::Box<'_, oxc_ast::ast::ExportDefaultDeclaration<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    record_default_local(&export_default.declaration, state);
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            collect_default_function(function, ctx, state)
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            record_default_identifier(identifier.name.as_str(), state);
            Ok(())
        }
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            collect_default_arrow(arrow, ctx, state)
        }
        ExportDefaultDeclarationKind::FunctionExpression(function) => {
            collect_default_expression(function, ctx, state)
        }
        _ => Ok(()),
    }
}

/// `export default () => ...`: an anonymous arrow traces under the default export only.
fn collect_default_arrow(
    arrow: &oxc_allocator::Box<'_, ArrowFunctionExpression<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    let context = FunctionLikeContext {
        name: ANONYMOUS_DEFAULT,
        first_param: arrow.params.items.first(),
        body_statements: Some(&arrow.body.statements),
        wrapper_style_props: BTreeSet::new(),
    };
    let component = component_from_function_like(&context, ctx)?;
    collect_anonymous_default(component, state);
    Ok(())
}

/// `export default function () {...}` as an expression: an anonymous function, traced as the default export.
fn collect_default_expression(
    function: &oxc_allocator::Box<'_, Function<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    let context = FunctionLikeContext {
        name: ANONYMOUS_DEFAULT,
        first_param: function.params.items.first(),
        body_statements: function.body.as_ref().map(|body| &body.statements),
        wrapper_style_props: BTreeSet::new(),
    };
    let component = component_from_function_like(&context, ctx)?;
    collect_anonymous_default(component, state);
    Ok(())
}

/// `export default function Name() {}` or an anonymous default function declaration.
fn collect_default_function(
    function: &oxc_allocator::Box<'_, Function<'_>>,
    ctx: &ParserContext,
    state: &mut ParseState,
) -> Result<(), StyleTraceError> {
    let component_name = function
        .id
        .as_ref()
        .map(|id| id.name.to_string())
        .unwrap_or_else(|| ANONYMOUS_DEFAULT.to_string());
    let context = FunctionLikeContext {
        name: &component_name,
        first_param: function.params.items.first(),
        body_statements: function.body.as_ref().map(|body| &body.statements),
        wrapper_style_props: BTreeSet::new(),
    };
    let Some(component) = component_from_function_like(&context, ctx)? else {
        return Ok(());
    };
    state.components.insert(component_name.clone(), component);
    state.exports.insert(
        DEFAULT_EXPORT.to_string(),
        ExportTarget::Local(component_name),
    );
    Ok(())
}

/// `export default Name` mints the default export only when `Name` already traces as a component or factory.
fn record_default_identifier(name: &str, state: &mut ParseState) {
    if state.components.contains_key(name) || state.component_factories.contains_key(name) {
        state.exports.insert(
            DEFAULT_EXPORT.to_string(),
            ExportTarget::Local(name.to_string()),
        );
    }
}

/// A named default export (`export default function Card` or `export default Card`) records the
/// binding it names, so compound members on that binding answer to the public name `default`'s
/// legacy spelling. Anonymous defaults name no binding and record nothing.
fn record_default_local(declaration: &ExportDefaultDeclarationKind<'_>, state: &mut ParseState) {
    let local = match declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function) => {
            function.id.as_ref().map(|id| id.name.to_string())
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => Some(identifier.name.to_string()),
        _ => None,
    };
    if let Some(local) = local {
        state.local_exports.entries.push(LocalExport {
            exported: DEFAULT_EXPORT.to_string(),
            local,
        });
    }
}

fn collect_anonymous_default(component: Option<TraceComponent>, state: &mut ParseState) {
    let Some(component) = component else {
        return;
    };
    state
        .components
        .insert(ANONYMOUS_DEFAULT.to_string(), component);
    state.exports.insert(
        DEFAULT_EXPORT.to_string(),
        ExportTarget::Local(ANONYMOUS_DEFAULT.to_string()),
    );
}
