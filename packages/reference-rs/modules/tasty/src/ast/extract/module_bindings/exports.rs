//! Export collection for module-level declarations: named `export` declarations, re-export specifiers, and
//! default-exported interfaces. A statement is read through an [`ExportScope`] (the file, its extraction context,
//! and the resolver with the workspace file ids) and writes into [`ExportOutputs`] (the export-name map, the
//! re-export targets, the star list, and the emitted symbol shells).

use std::collections::{BTreeMap, BTreeSet};

use oxc_ast::ast::{
    Declaration, ExportDefaultDeclaration, ExportDefaultDeclarationKind, ExportNamedDeclaration,
    TSInterfaceDeclaration, TSTypeAliasDeclaration,
};
use oxc_span::{GetSpan, Span};

use super::super::slice_span;
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::{ExtractionContext, ShellSink};
use super::imports::module_export_name_to_string;
use crate::ast::model::SymbolShell;
use crate::scanner::ImportResolver;

/// Read-only inputs for one file's export statements: the file id, its extraction context, and the resolver with
/// the workspace file ids.
pub(crate) struct ExportScope<'s, 'a> {
    pub(crate) file_id: &'s str,
    pub(crate) ctx: &'s ExtractionContext<'a>,
    pub(crate) resolver: &'s ImportResolver,
    pub(crate) file_id_set: &'s BTreeSet<String>,
}

/// Mutable destinations for one file's exports: the export-name map, the re-export targets, the star re-export
/// list, and the emitted symbol shells.
pub(crate) struct ExportOutputs<'s> {
    pub(crate) export_bindings: &'s mut BTreeMap<String, String>,
    pub(crate) reexport_target: &'s mut BTreeMap<String, (String, String)>,
    pub(crate) export_all_targets: &'s mut Vec<String>,
    pub(crate) exports: &'s mut Vec<SymbolShell>,
}

pub(in crate::ast::extract) fn collect_exported_declaration(
    scope: &ExportScope<'_, '_>,
    export_decl: &ExportNamedDeclaration<'_>,
    out: &mut ExportOutputs<'_>,
) {
    let Some(declaration) = export_decl.declaration.as_ref() else {
        record_named_reexports(scope, export_decl, out);
        return;
    };

    match declaration {
        Declaration::TSInterfaceDeclaration(decl) => {
            named_interface(scope, decl, export_decl.span(), out);
        }
        Declaration::TSTypeAliasDeclaration(decl) => {
            named_type_alias(scope, decl, export_decl.span(), out);
        }
        _ => {}
    }
}

pub(in crate::ast::extract) fn collect_default_export_declaration(
    scope: &ExportScope<'_, '_>,
    export_default: &ExportDefaultDeclaration<'_>,
    out: &mut ExportOutputs<'_>,
) {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(decl) => {
            default_interface(scope, decl, export_default.span(), out);
        }
        ExportDefaultDeclarationKind::Identifier(id) => {
            bind_default_to(id.name.as_str(), out.export_bindings);
        }
        _ => {}
    }
}

fn named_interface(
    scope: &ExportScope<'_, '_>,
    decl: &TSInterfaceDeclaration<'_>,
    comment_span: Span,
    out: &mut ExportOutputs<'_>,
) {
    let name = decl.id.name.to_string();
    bind_export_name_to_local(&name, &name, out.export_bindings);
    let mut sink = ShellSink {
        file_id: scope.file_id,
        ctx: scope.ctx,
        exports: &mut *out.exports,
    };
    push_interface_shell(&mut sink, decl, comment_span, true);
}

fn named_type_alias(
    scope: &ExportScope<'_, '_>,
    decl: &TSTypeAliasDeclaration<'_>,
    comment_span: Span,
    out: &mut ExportOutputs<'_>,
) {
    let name = decl.id.name.to_string();
    bind_export_name_to_local(&name, &name, out.export_bindings);
    let mut sink = ShellSink {
        file_id: scope.file_id,
        ctx: scope.ctx,
        exports: &mut *out.exports,
    };
    push_type_alias_shell(&mut sink, decl, comment_span, true);
}

fn default_interface(
    scope: &ExportScope<'_, '_>,
    decl: &TSInterfaceDeclaration<'_>,
    comment_span: Span,
    out: &mut ExportOutputs<'_>,
) {
    bind_default_to(decl.id.name.as_str(), out.export_bindings);
    let mut sink = ShellSink {
        file_id: scope.file_id,
        ctx: scope.ctx,
        exports: &mut *out.exports,
    };
    push_interface_shell(&mut sink, decl, comment_span, true);
}

pub(in crate::ast::extract) fn record_named_reexports(
    scope: &ExportScope<'_, '_>,
    export_decl: &ExportNamedDeclaration<'_>,
    out: &mut ExportOutputs<'_>,
) {
    let source = scope.ctx.source;
    let target_file_id = export_decl.source.as_ref().and_then(|src| {
        let source_module = slice_span(source, src.span)
            .trim_matches('"')
            .trim_matches('\'')
            .to_string();
        scope
            .resolver
            .resolve_import(scope.file_id, &source_module, scope.file_id_set)
    });

    for spec in &export_decl.specifiers {
        let local = module_export_name_to_string(&spec.local, source);
        let exported = module_export_name_to_string(&spec.exported, source);

        out.export_bindings.insert(exported, local.clone());
        if let Some(ref target) = target_file_id {
            out.reexport_target
                .insert(local.clone(), (target.clone(), local));
        }
    }
}

fn bind_export_name_to_local(
    exported: &str,
    local: &str,
    export_bindings: &mut BTreeMap<String, String>,
) {
    export_bindings.insert(exported.to_string(), local.to_string());
}

fn bind_default_to(local_name: &str, export_bindings: &mut BTreeMap<String, String>) {
    export_bindings.insert("default".to_string(), local_name.to_string());
}
