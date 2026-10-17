//! Export statement collection: named exports, default exports, bare type declarations, and star re-exports.
//! `export * from './m'` appends its target to the barrel's star list, so the target's names join the barrel flat.
//! `export * as ns from './m'` records one namespace binding `ns` in the re-export map with the `*` remote name,
//! the same marker a namespace import uses, and never adds the target's names flat; `resolve` rebinds named
//! imports of that binding to the namespace's file.

use oxc_ast::ast::{ModuleExportName, Statement};
use oxc_span::GetSpan;

use crate::constants::libraries::USER_LIBRARY_NAME;

use super::super::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration, record_named_reexports,
    ExportOutputs, ExportScope,
};
use super::super::slice_span;
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::ShellSink;

pub(crate) fn exports_from_statement(
    scope: &ExportScope<'_, '_>,
    statement: &Statement<'_>,
    out: &mut ExportOutputs<'_>,
) {
    collect_named_export_statement(scope, statement, out);
    match export_all_binding(scope, statement) {
        Some(ExportAllBinding::Star(target)) => out.export_all_targets.push(target),
        Some(ExportAllBinding::Namespace { name, target }) => {
            out.reexport_target.insert(name, (target, "*".to_string()));
        }
        None => {}
    }

    collect_user_export_statement(scope, statement, out);
    collect_user_type_shell(scope, statement, out);
}

fn collect_named_export_statement(
    scope: &ExportScope<'_, '_>,
    statement: &Statement<'_>,
    out: &mut ExportOutputs<'_>,
) {
    let Statement::ExportNamedDeclaration(export_decl) = statement else {
        return;
    };

    if export_decl.declaration.is_none() {
        record_named_reexports(scope, export_decl, out);
        return;
    }

    collect_exported_declaration(scope, export_decl, out);
}

/// One resolved `export * from` or `export * as ns from` statement.
enum ExportAllBinding {
    /// `export * from './m'`: the target's names join the barrel flat.
    Star(String),
    /// `export * as ns from './m'`: one namespace named `ns` over the target, with no flat names.
    Namespace { name: String, target: String },
}

fn export_all_binding(
    scope: &ExportScope<'_, '_>,
    statement: &Statement<'_>,
) -> Option<ExportAllBinding> {
    let Statement::ExportAllDeclaration(export_all) = statement else {
        return None;
    };

    let source_module = export_all
        .source
        .value
        .as_str()
        .trim_matches('"')
        .trim_matches('\'');
    let target = scope
        .resolver
        .resolve_import(scope.file_id, source_module, scope.file_id_set)?;
    Some(match &export_all.exported {
        Some(exported) => ExportAllBinding::Namespace {
            name: export_name_text(exported, scope.ctx.source),
            target,
        },
        None => ExportAllBinding::Star(target),
    })
}

fn export_name_text(name: &ModuleExportName<'_>, source: &str) -> String {
    slice_span(source, name.span())
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

/// User files and reference-ui packages may contribute symbol shells for their declarations.
fn emits_symbol_shells(library: &str) -> bool {
    library == USER_LIBRARY_NAME
        || library.starts_with("@reference-ui/styled")
        || library.starts_with("@reference-ui/")
}

fn collect_user_export_statement(
    scope: &ExportScope<'_, '_>,
    statement: &Statement<'_>,
    out: &mut ExportOutputs<'_>,
) {
    if !emits_symbol_shells(scope.ctx.library) {
        return;
    }

    let Statement::ExportDefaultDeclaration(export_default) = statement else {
        return;
    };

    collect_default_export_declaration(scope, export_default, out);
}

fn collect_user_type_shell(
    scope: &ExportScope<'_, '_>,
    statement: &Statement<'_>,
    out: &mut ExportOutputs<'_>,
) {
    if !emits_symbol_shells(scope.ctx.library) {
        return;
    }

    let mut sink = ShellSink {
        file_id: scope.file_id,
        ctx: scope.ctx,
        exports: &mut *out.exports,
    };
    match statement {
        Statement::TSInterfaceDeclaration(interface_decl) => {
            push_interface_shell(&mut sink, interface_decl, interface_decl.span(), false)
        }
        Statement::TSTypeAliasDeclaration(type_alias) => {
            push_type_alias_shell(&mut sink, type_alias, type_alias.span(), false)
        }
        _ => {}
    }
}
