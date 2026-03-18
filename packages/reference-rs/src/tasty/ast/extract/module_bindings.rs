use std::collections::BTreeMap;
use std::path::Path;

use oxc_ast::ast::{
    Comment, Declaration, ExportDefaultDeclaration, ExportDefaultDeclarationKind,
    ExportNamedDeclaration, ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    ModuleExportName,
};
use oxc_span::GetSpan;

use super::super::super::scanner::resolve_import;
use super::super::model::{ImportBinding, ImportBindingKind, SymbolShell};
use super::symbols::{push_interface_shell, push_type_alias_shell};
use super::slice_span;

struct ImportBindingEntry {
    local_name: String,
    binding: ImportBinding,
}

pub(super) fn collect_import_bindings(
    root_dir: &Path,
    current_file_id: &str,
    import: &ImportDeclaration<'_>,
    source: &str,
    file_id_set: &std::collections::BTreeSet<String>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
) {
    if !matches!(
        import.import_kind,
        ImportOrExportKind::Value | ImportOrExportKind::Type
    ) {
        return;
    }

    let Some(specifiers) = &import.specifiers else {
        return;
    };

    let source_module = slice_span(source, import.source.span)
        .trim_matches('"')
        .trim_matches('\'')
        .to_string();
    let target_file_id = resolve_import(root_dir, current_file_id, &source_module, file_id_set);

    for specifier in specifiers {
        let entry = import_binding_from_specifier(
            specifier,
            source,
            source_module.clone(),
            target_file_id.clone(),
        );
        insert_import_binding(import_bindings, entry);
    }
}

pub(super) fn collect_exported_declaration(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    export_decl: &ExportNamedDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    let Some(declaration) = export_decl.declaration.as_ref() else {
        collect_export_specifiers(export_decl, source, export_bindings);
        return;
    };

    match declaration {
        Declaration::TSInterfaceDeclaration(interface_decl) => push_exported_interface(
            file_id,
            current_module_specifier,
            current_library,
            interface_decl,
            source,
            comments,
            import_bindings,
            export_bindings,
            exports,
        ),
        Declaration::TSTypeAliasDeclaration(type_alias) => push_exported_type_alias(
            file_id,
            current_module_specifier,
            current_library,
            type_alias,
            source,
            comments,
            import_bindings,
            export_bindings,
            exports,
        ),
        _ => {}
    }
}

pub(super) fn collect_default_export_declaration(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    export_default: &ExportDefaultDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    match &export_default.declaration {
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(interface_decl) => push_default_interface(
            file_id,
            current_module_specifier,
            current_library,
            interface_decl,
            source,
            comments,
            import_bindings,
            export_bindings,
            exports,
        ),
        ExportDefaultDeclarationKind::Identifier(identifier) => {
            export_bindings.insert("default".to_string(), identifier.name.to_string());
        }
        _ => {}
    }
}

fn collect_export_specifiers(
    export_decl: &ExportNamedDeclaration<'_>,
    source: &str,
    export_bindings: &mut BTreeMap<String, String>,
) {
    for specifier in &export_decl.specifiers {
        let local_name = module_export_name_to_string(&specifier.local, source);
        let exported_name = module_export_name_to_string(&specifier.exported, source);
        export_bindings.insert(exported_name, local_name);
    }
}

fn insert_import_binding(
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    entry: ImportBindingEntry,
) {
    import_bindings.insert(entry.local_name, entry.binding);
}

fn module_export_name_to_string(name: &ModuleExportName<'_>, source: &str) -> String {
    slice_span(source, name.span())
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

fn import_binding_from_specifier(
    specifier: &ImportDeclarationSpecifier<'_>,
    source: &str,
    source_module: String,
    target_file_id: Option<String>,
) -> ImportBindingEntry {
    let (local_name, kind, imported_name) = match specifier {
        ImportDeclarationSpecifier::ImportSpecifier(named) => (
            slice_span(source, named.local.span).to_string(),
            ImportBindingKind::Named,
            module_export_name_to_string(&named.imported, source),
        ),
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => (
            slice_span(source, default_specifier.local.span).to_string(),
            ImportBindingKind::Default,
            "default".to_string(),
        ),
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => (
            slice_span(source, namespace_specifier.local.span).to_string(),
            ImportBindingKind::Namespace,
            "*".to_string(),
        ),
    };

    ImportBindingEntry {
        local_name,
        binding: ImportBinding {
            kind,
            imported_name,
            source_module,
            target_file_id,
        },
    }
}

fn push_exported_interface(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &oxc_ast::ast::TSInterfaceDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    let name = interface_decl.id.name.to_string();
    export_bindings.insert(name.clone(), name);
    push_interface_shell(
        file_id,
        current_module_specifier,
        current_library,
        interface_decl,
        source,
        comments,
        import_bindings,
        true,
        exports,
    );
}

fn push_exported_type_alias(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    type_alias: &oxc_ast::ast::TSTypeAliasDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    let name = type_alias.id.name.to_string();
    export_bindings.insert(name.clone(), name);
    push_type_alias_shell(
        file_id,
        current_module_specifier,
        current_library,
        type_alias,
        source,
        comments,
        import_bindings,
        true,
        exports,
    );
}

fn push_default_interface(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &oxc_ast::ast::TSInterfaceDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    export_bindings: &mut BTreeMap<String, String>,
    exports: &mut Vec<SymbolShell>,
) {
    export_bindings.insert("default".to_string(), interface_decl.id.name.to_string());
    push_interface_shell(
        file_id,
        current_module_specifier,
        current_library,
        interface_decl,
        source,
        comments,
        import_bindings,
        true,
        exports,
    );
}
