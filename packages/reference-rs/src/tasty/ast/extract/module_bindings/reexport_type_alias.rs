//! Synthetic type-alias shells for `export type { Name } from 'module'` so symbols register
//! in the manifest without a handwritten local alias (`export type X = import(...).X`).

use std::collections::BTreeMap;
use std::path::Path;

use oxc_ast::ast::{ExportNamedDeclaration, ImportOrExportKind};
use oxc_span::GetSpan;

use super::imports::module_export_name_to_string;
use crate::tasty::ast::extract::type_references::collect_references_from_members;
use crate::tasty::ast::extract::slice_span;
use crate::tasty::ast::model::{ImportBinding, ImportBindingKind, SymbolShell};
use crate::tasty::model::{TsSymbolKind, TypeRef};
use crate::tasty::scanner::{resolve_import, symbol_id};

/// When `export_decl` is `export type { ... } from '...'` (no inline declaration), register
/// import bindings and a type-alias shell per specifier so `symbols_by_name` includes each name.
pub(in crate::tasty::ast::extract) fn collect_type_reexports_from_module(
    file_id: &str,
    root_dir: &Path,
    file_id_set: &std::collections::BTreeSet<String>,
    source_text: &str,
    export_decl: &ExportNamedDeclaration<'_>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    exports: &mut Vec<SymbolShell>,
) {
    if export_decl.export_kind != ImportOrExportKind::Type {
        return;
    }
    let Some(source_atom) = export_decl.source.as_ref() else {
        return;
    };
    let source_module = slice_span(source_text, source_atom.span())
        .trim_matches('"')
        .trim_matches('\'')
        .to_string();
    let target_file_id = resolve_import(root_dir, file_id, &source_module, file_id_set);

    for spec in &export_decl.specifiers {
        let remote_name = module_export_name_to_string(&spec.local, source_text);
        let exported = module_export_name_to_string(&spec.exported, source_text);
        if exported != remote_name {
            // `export type { A as B } from` — needs export_index to map B → target id via A;
            // same-name re-exports cover the common doc barrel case.
            continue;
        }
        push_reexport_type_alias_shell(
            file_id,
            &exported,
            &source_module,
            target_file_id.clone(),
            import_bindings,
            exports,
        );
    }
}

fn push_reexport_type_alias_shell(
    file_id: &str,
    exported: &str,
    source_module: &str,
    target_file_id: Option<String>,
    import_bindings: &mut BTreeMap<String, ImportBinding>,
    exports: &mut Vec<SymbolShell>,
) {
    import_bindings.insert(
        exported.to_string(),
        ImportBinding {
            kind: ImportBindingKind::Named,
            imported_name: exported.to_string(),
            source_module: source_module.to_string(),
            target_file_id,
        },
    );

    let id = symbol_id(file_id, exported);
    let underlying = Some(TypeRef::Reference {
        name: exported.to_string(),
        target_id: None,
        source_module: Some(source_module.to_string()),
        type_arguments: None,
    });
    let references = collect_references_from_members(&[], &[], underlying.as_ref(), &[]);

    exports.push(SymbolShell {
        id,
        name: exported.to_string(),
        kind: TsSymbolKind::TypeAlias,
        exported: true,
        description: None,
        description_raw: None,
        jsdoc: None,
        type_parameters: vec![],
        defined_members: vec![],
        extends: vec![],
        underlying,
        references,
    });
}
