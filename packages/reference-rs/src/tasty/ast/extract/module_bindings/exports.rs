use std::collections::BTreeMap;

use oxc_ast::ast::{
    Comment, Declaration, ExportDefaultDeclaration, ExportDefaultDeclarationKind,
    ExportNamedDeclaration,
};
use oxc_span::GetSpan;

use super::super::super::model::{ImportBinding, SymbolShell};
use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::imports::module_export_name_to_string;

pub(in crate::tasty::ast::extract) fn collect_exported_declaration(
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
            export_decl.span(),
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
            export_decl.span(),
            source,
            comments,
            import_bindings,
            export_bindings,
            exports,
        ),
        _ => {}
    }
}

pub(in crate::tasty::ast::extract) fn collect_default_export_declaration(
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
            push_default_interface(
                file_id,
                current_module_specifier,
                current_library,
                interface_decl,
                export_default.span(),
                source,
                comments,
                import_bindings,
                export_bindings,
                exports,
            )
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

fn push_exported_interface(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &oxc_ast::ast::TSInterfaceDeclaration<'_>,
    comment_span: oxc_span::Span,
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
        comment_span,
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
    comment_span: oxc_span::Span,
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
        comment_span,
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
    comment_span: oxc_span::Span,
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
        comment_span,
        source,
        comments,
        import_bindings,
        true,
        exports,
    );
}
