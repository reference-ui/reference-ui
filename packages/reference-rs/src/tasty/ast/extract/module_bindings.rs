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

pub(super) fn collect_import_bindings(
    root_dir: &Path,
    current_file_id: &str,
    import: &ImportDeclaration<'_>,
    source: &str,
    file_id_set: &std::collections::BTreeSet<String>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
) {
    if import.import_kind == ImportOrExportKind::Value
        || import.import_kind == ImportOrExportKind::Type
    {
        let source_module = slice_span(source, import.source.span)
            .trim_matches('"')
            .trim_matches('\'')
            .to_string();
        let target_file_id = resolve_import(root_dir, current_file_id, &source_module, file_id_set);

        if let Some(specifiers) = &import.specifiers {
            for specifier in specifiers {
                match specifier {
                    ImportDeclarationSpecifier::ImportSpecifier(named) => {
                        insert_import_binding(
                            import_bindings,
                            slice_span(source, named.local.span).to_string(),
                            ImportBinding {
                                kind: ImportBindingKind::Named,
                                imported_name: module_export_name_to_string(&named.imported, source),
                                source_module: source_module.clone(),
                                target_file_id: target_file_id.clone(),
                            },
                        );
                    }
                    ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                        insert_import_binding(
                            import_bindings,
                            slice_span(source, default_specifier.local.span).to_string(),
                            ImportBinding {
                                kind: ImportBindingKind::Default,
                                imported_name: "default".to_string(),
                                source_module: source_module.clone(),
                                target_file_id: target_file_id.clone(),
                            },
                        );
                    }
                    ImportDeclarationSpecifier::ImportNamespaceSpecifier(namespace_specifier) => {
                        insert_import_binding(
                            import_bindings,
                            slice_span(source, namespace_specifier.local.span).to_string(),
                            ImportBinding {
                                kind: ImportBindingKind::Namespace,
                                imported_name: "*".to_string(),
                                source_module: source_module.clone(),
                                target_file_id: target_file_id.clone(),
                            },
                        );
                    }
                }
            }
        }
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
    if export_decl.declaration.is_none() {
        collect_export_specifiers(export_decl, source, export_bindings);
        return;
    }

    let declaration = export_decl.declaration.as_ref().unwrap();
    match declaration {
        Declaration::TSInterfaceDeclaration(interface_decl) => {
            export_bindings.insert(interface_decl.id.name.to_string(), interface_decl.id.name.to_string());
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
        Declaration::TSTypeAliasDeclaration(type_alias) => {
            export_bindings.insert(type_alias.id.name.to_string(), type_alias.id.name.to_string());
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
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(interface_decl) => {
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
    local_name: String,
    binding: ImportBinding,
) {
    import_bindings.insert(local_name, binding);
}

fn module_export_name_to_string(name: &ModuleExportName<'_>, source: &str) -> String {
    slice_span(source, name.span())
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}
