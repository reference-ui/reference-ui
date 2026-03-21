use std::collections::BTreeMap;
use std::path::Path;

use oxc_ast::ast::{
    ImportDeclaration, ImportDeclarationSpecifier, ImportOrExportKind, ModuleExportName,
};
use oxc_span::GetSpan;

use crate::tasty::ast::model::{ImportBinding, ImportBindingKind};
use crate::tasty::scanner::resolve_import;
use super::super::slice_span;

struct ImportBindingEntry {
    local_name: String,
    binding: ImportBinding,
}

pub(in crate::tasty::ast::extract) fn collect_import_bindings(
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

fn insert_import_binding(
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    entry: ImportBindingEntry,
) {
    import_bindings.insert(entry.local_name, entry.binding);
}

pub(super) fn module_export_name_to_string(name: &ModuleExportName<'_>, source: &str) -> String {
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
