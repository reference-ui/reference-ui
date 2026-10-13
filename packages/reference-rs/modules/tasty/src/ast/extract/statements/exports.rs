//! Export statement collection: named exports, default exports, bare type declarations, and star re-exports.
//! `export * from './m'` appends its target to the barrel's star list, so the target's names join the barrel flat.
//! `export * as ns from './m'` records one namespace binding `ns` in the re-export map with the `*` remote name,
//! the same marker a namespace import uses, and never adds the target's names flat; `resolve` rebinds named
//! imports of that binding to the namespace's file.

use std::collections::BTreeMap;

use oxc_ast::ast::{ModuleExportName, Statement};
use oxc_span::GetSpan;

use crate::constants::libraries::USER_LIBRARY_NAME;

use super::super::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration, record_named_reexports,
};
use super::super::slice_span;
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::ExtractionContext;
use crate::ast::model::{ImportBinding, SymbolShell};
use crate::scanner::{ImportResolver, ScannedFile};

pub(crate) fn exports_from_statement(
    resolver: &ImportResolver,
    file_id_set: &std::collections::BTreeSet<String>,
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    reexport_target: &mut BTreeMap<String, (String, String)>,
    export_all_targets: &mut Vec<String>,
    exports: &mut Vec<SymbolShell>,
) {
    collect_named_export_statement(
        resolver,
        file_id_set,
        scanned_file,
        statement,
        comments,
        import_bindings,
        export_bindings,
        reexport_target,
        exports,
    );
    match export_all_binding(resolver, file_id_set, scanned_file, statement) {
        Some(ExportAllBinding::Star(target)) => export_all_targets.push(target),
        Some(ExportAllBinding::Namespace { name, target }) => {
            reexport_target.insert(name, (target, "*".to_string()));
        }
        None => {}
    }

    let ctx = ExtractionContext {
        source: &scanned_file.source,
        comments,
        import_bindings: &*import_bindings,
        module_specifier: &scanned_file.module_specifier,
        library: &scanned_file.library,
    };

    collect_user_export_statement(scanned_file, &ctx, statement, export_bindings, exports);
    collect_user_type_shell(scanned_file, &ctx, statement, exports);
}

fn collect_named_export_statement(
    resolver: &ImportResolver,
    file_id_set: &std::collections::BTreeSet<String>,
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    comments: &[oxc_ast::ast::Comment],
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    reexport_target: &mut BTreeMap<String, (String, String)>,
    exports: &mut Vec<SymbolShell>,
) {
    let Statement::ExportNamedDeclaration(export_decl) = statement else {
        return;
    };

    if export_decl.declaration.is_none() {
        record_named_reexports(
            resolver,
            export_decl,
            scanned_file.source.as_str(),
            export_bindings,
            reexport_target,
            &scanned_file.file_id,
            file_id_set,
        );
        return;
    }

    let ctx = ExtractionContext {
        source: &scanned_file.source,
        comments,
        import_bindings: &*import_bindings,
        module_specifier: &scanned_file.module_specifier,
        library: &scanned_file.library,
    };

    collect_exported_declaration(
        &scanned_file.file_id,
        &ctx,
        export_decl,
        export_bindings,
        reexport_target,
        resolver,
        file_id_set,
        exports,
    );
}

/// One resolved `export * from` or `export * as ns from` statement.
enum ExportAllBinding {
    /// `export * from './m'`: the target's names join the barrel flat.
    Star(String),
    /// `export * as ns from './m'`: one namespace named `ns` over the target, with no flat names.
    Namespace { name: String, target: String },
}

fn export_all_binding(
    resolver: &ImportResolver,
    file_id_set: &std::collections::BTreeSet<String>,
    scanned_file: &ScannedFile,
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
    let target = resolver.resolve_import(&scanned_file.file_id, source_module, file_id_set)?;
    Some(match &export_all.exported {
        Some(exported) => ExportAllBinding::Namespace {
            name: export_name_text(exported, &scanned_file.source),
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

fn collect_user_export_statement(
    scanned_file: &ScannedFile,
    ctx: &ExtractionContext<'_>,
    statement: &Statement<'_>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    // Allow both user files and reference-ui styled packages for symbol extraction
    let is_allowed_library = scanned_file.library == USER_LIBRARY_NAME
        || scanned_file.library.starts_with("@reference-ui/styled")
        || scanned_file.library.starts_with("@reference-ui/");

    if !is_allowed_library {
        return;
    }

    let Statement::ExportDefaultDeclaration(export_default) = statement else {
        return;
    };

    collect_default_export_declaration(
        &scanned_file.file_id,
        ctx,
        export_default,
        export_bindings,
        exports,
    );
}

fn collect_user_type_shell(
    scanned_file: &ScannedFile,
    ctx: &ExtractionContext<'_>,
    statement: &Statement<'_>,
    exports: &mut Vec<SymbolShell>,
) {
    // Allow both user files and reference-ui styled packages for symbol extraction
    let is_allowed_library = scanned_file.library == USER_LIBRARY_NAME
        || scanned_file.library.starts_with("@reference-ui/styled")
        || scanned_file.library.starts_with("@reference-ui/");

    if !is_allowed_library {
        return;
    }

    match statement {
        Statement::TSInterfaceDeclaration(interface_decl) => push_interface_shell(
            &scanned_file.file_id,
            ctx,
            interface_decl,
            interface_decl.span(),
            false,
            exports,
        ),
        Statement::TSTypeAliasDeclaration(type_alias) => push_type_alias_shell(
            &scanned_file.file_id,
            ctx,
            type_alias,
            type_alias.span(),
            false,
            exports,
        ),
        _ => {}
    }
}
