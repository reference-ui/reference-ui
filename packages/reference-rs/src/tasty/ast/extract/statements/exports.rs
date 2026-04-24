//! Export statement collection: named exports, default exports, and bare type declarations.

use std::collections::BTreeMap;
use std::path::Path;

use oxc_ast::ast::Statement;
use oxc_span::GetSpan;

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;

use super::super::module_bindings::{
    collect_default_export_declaration, collect_exported_declaration, record_named_reexports,
};
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::super::ExtractionContext;
use crate::tasty::ast::model::{ImportBinding, SymbolShell};
use crate::tasty::scanner::{resolve_import, ScannedFile};

pub(crate) fn exports_from_statement(
    root_dir: &Path,
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
        root_dir,
        file_id_set,
        scanned_file,
        statement,
        comments,
        import_bindings,
        export_bindings,
        reexport_target,
        exports,
    );
    collect_export_all_statement(
        root_dir,
        file_id_set,
        scanned_file,
        statement,
        export_all_targets,
    );

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
    root_dir: &Path,
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
            export_decl,
            scanned_file.source.as_str(),
            export_bindings,
            reexport_target,
            root_dir,
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
        root_dir,
        file_id_set,
        exports,
    );
}

fn collect_export_all_statement(
    root_dir: &Path,
    file_id_set: &std::collections::BTreeSet<String>,
    scanned_file: &ScannedFile,
    statement: &Statement<'_>,
    export_all_targets: &mut Vec<String>,
) {
    let Statement::ExportAllDeclaration(export_all) = statement else {
        return;
    };

    let source_module = export_all
        .source
        .value
        .as_str()
        .trim_matches('"')
        .trim_matches('\'');
    let Some(target_file_id) = resolve_import(root_dir, &scanned_file.file_id, source_module, file_id_set) else {
        return;
    };

    export_all_targets.push(target_file_id);
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
