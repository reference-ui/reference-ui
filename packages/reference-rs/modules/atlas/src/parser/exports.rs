//! Records what a module exposes through `export` statements: named exports of declarations, named
//! re-exports (`export { x } from "./m"`), local-binding exports (`export { x as y }`), and every form of
//! default export. Component exports and type exports go into separate maps, and a default export of a
//! component declared in place is also a local binding so later export lines can find it. It takes the
//! statement node, the file context and the parse state, and mutates only that state.

use super::components::{
    collect_variable_components, component_from_arrow, component_from_expression,
    component_from_function, component_from_function_declaration,
};
use super::utils::{module_export_name_to_string, slice_span, unquote};
use super::{collect_interface, collect_type_alias, FileCtx, ModuleParseState};
use crate::internal::{ComponentDecl, ReExport};
use oxc_ast::ast::{
    ArrowFunctionExpression, Declaration, ExportDefaultDeclaration, ExportDefaultDeclarationKind,
    ExportNamedDeclaration, ExportSpecifier, Function, IdentifierReference, ImportOrExportKind,
};

pub(super) fn collect_export_named_declaration(
    export_decl: &ExportNamedDeclaration<'_>,
    ctx: &FileCtx<'_>,
    state: &mut ModuleParseState,
) {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        collect_exported_declaration(declaration, ctx, state);
        return;
    }
    collect_export_specifiers(export_decl, ctx.source, state);
}

fn collect_exported_declaration(declaration: &Declaration<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    match declaration {
        Declaration::FunctionDeclaration(function) => collect_exported_function(function, ctx, state),
        Declaration::VariableDeclaration(declaration) => {
            collect_variable_components(declaration.declarations.iter(), ctx, state, true)
        }
        Declaration::TSInterfaceDeclaration(interface_decl) => {
            collect_interface(interface_decl, ctx.source, state)
        }
        Declaration::TSTypeAliasDeclaration(type_alias) => collect_type_alias(type_alias, ctx.source, state),
        _ => {}
    }
}

fn collect_exported_function(function: &Function<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    if let Some(component) = component_from_function_declaration(function, ctx) {
        state
            .local_components
            .insert(component.name.clone(), component.clone());
        state
            .exported_components
            .insert(component.name.clone(), component);
    }
}

fn collect_export_specifiers(export_decl: &ExportNamedDeclaration<'_>, source: &str, state: &mut ModuleParseState) {
    let type_only_declaration = export_decl.export_kind == ImportOrExportKind::Type;
    let source_module = export_decl
        .source
        .as_ref()
        .map(|value| unquote(slice_span(source, value.span)));

    for specifier in &export_decl.specifiers {
        collect_export_specifier(specifier, type_only_declaration, source_module.as_ref(), state);
    }
}

fn collect_export_specifier(
    specifier: &ExportSpecifier<'_>,
    type_only_declaration: bool,
    source_module: Option<&String>,
    state: &mut ModuleParseState,
) {
    let local = module_export_name_to_string(&specifier.local);
    let exported = module_export_name_to_string(&specifier.exported);
    let type_only = type_only_declaration || specifier.export_kind == ImportOrExportKind::Type;

    match source_module {
        Some(source_module) => {
            let reexport = ReExport {
                source: source_module.clone(),
                imported: local,
            };
            record_reexport(state, exported, reexport, type_only);
        }
        None if !type_only => export_local_component(state, &local, exported),
        None => {}
    }
}

fn record_reexport(state: &mut ModuleParseState, exported: String, reexport: ReExport, type_only: bool) {
    if type_only {
        state.named_type_reexports.insert(exported, reexport);
    } else {
        state.named_component_reexports.insert(exported, reexport);
    }
}

fn export_local_component(state: &mut ModuleParseState, local: &str, exported: String) {
    if let Some(component) = state.local_components.get(local).cloned() {
        let mut exported_component = component;
        exported_component.name = exported.clone();
        state.exported_components.insert(exported, exported_component);
    }
}

pub(super) fn collect_default_export(
    export_default: &ExportDefaultDeclaration<'_>,
    ctx: &FileCtx<'_>,
    state: &mut ModuleParseState,
) {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::FunctionDeclaration(function)
        | ExportDefaultDeclarationKind::FunctionExpression(function) => {
            collect_default_function(function, ctx, state)
        }
        ExportDefaultDeclarationKind::Identifier(identifier) => collect_default_identifier(identifier, state),
        ExportDefaultDeclarationKind::ArrowFunctionExpression(arrow) => {
            collect_default_arrow(arrow, ctx, state)
        }
        ExportDefaultDeclarationKind::CallExpression(_) => collect_default_call(export_default, ctx, state),
        _ => {}
    }
}

fn collect_default_function(function: &Function<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    let component_name = function
        .id
        .as_ref()
        .map(|id| id.name.to_string())
        .unwrap_or_else(|| ctx.default_name.to_string());
    if let Some(component) = component_from_function(&component_name, function, ctx) {
        register_default_component(state, component);
    }
}

fn collect_default_identifier(identifier: &IdentifierReference<'_>, state: &mut ModuleParseState) {
    let name = identifier.name.to_string();
    if let Some(component) = state.local_components.get(&name).cloned() {
        state
            .exported_components
            .entry(name.clone())
            .or_insert(component);
        state.default_component = Some(name);
    }
}

fn collect_default_arrow(arrow: &ArrowFunctionExpression<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    if let Some(component) = component_from_arrow(ctx.default_name, arrow, ctx) {
        let name = component.name.clone();
        state.exported_components.insert(name.clone(), component);
        state.default_component = Some(name);
    }
}

/// Direct `export default memo(...)`: unwrap through the shared wrapper rule, named after the file.
fn collect_default_call(export_default: &ExportDefaultDeclaration<'_>, ctx: &FileCtx<'_>, state: &mut ModuleParseState) {
    let Some(expression) = export_default.declaration.as_expression() else {
        return;
    };
    if let Some(component) = component_from_expression(ctx.default_name, expression, ctx) {
        register_default_component(state, component);
    }
}

/// A default export declared in place is also a local binding, so later `export { X }` lines find it.
fn register_default_component(state: &mut ModuleParseState, component: ComponentDecl) {
    let name = component.name.clone();
    state
        .local_components
        .insert(name.clone(), component.clone());
    state
        .exported_components
        .insert(name.clone(), component);
    state.default_component = Some(name);
}
