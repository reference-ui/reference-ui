use std::collections::BTreeMap;

use oxc_ast::ast::{
    Comment, Declaration, ExportDefaultDeclaration, ExportDefaultDeclarationKind,
    ExportNamedDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration,
};
use oxc_span::{GetSpan, Span};

use super::super::symbols::{push_interface_shell, push_type_alias_shell};
use super::imports::module_export_name_to_string;
use crate::tasty::ast::model::{ImportBinding, SymbolShell};

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
        record_named_reexports(export_decl, source, export_bindings);
        return;
    };

    let pass = ExportPass::new(
        file_id,
        current_module_specifier,
        current_library,
        source,
        comments,
        import_bindings,
    );

    match declaration {
        Declaration::TSInterfaceDeclaration(decl) => {
            pass.named_interface(decl, export_decl.span(), export_bindings, exports);
        }
        Declaration::TSTypeAliasDeclaration(decl) => {
            pass.named_type_alias(decl, export_decl.span(), export_bindings, exports);
        }
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
    let pass = ExportPass::new(
        file_id,
        current_module_specifier,
        current_library,
        source,
        comments,
        import_bindings,
    );

    match &export_default.declaration {
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(decl) => {
            pass.default_interface(decl, export_default.span(), export_bindings, exports);
        }
        ExportDefaultDeclarationKind::Identifier(id) => {
            bind_default_to(id.name.as_str(), export_bindings);
        }
        _ => {}
    }
}

struct ExportPass<'a> {
    file_id: &'a str,
    module_specifier: &'a str,
    library: &'a str,
    source: &'a str,
    comments: &'a [Comment],
    import_bindings: &'a BTreeMap<String, ImportBinding>,
}

impl<'a> ExportPass<'a> {
    fn new(
        file_id: &'a str,
        module_specifier: &'a str,
        library: &'a str,
        source: &'a str,
        comments: &'a [Comment],
        import_bindings: &'a BTreeMap<String, ImportBinding>,
    ) -> Self {
        Self {
            file_id,
            module_specifier,
            library,
            source,
            comments,
            import_bindings,
        }
    }

    fn named_interface(
        &self,
        decl: &TSInterfaceDeclaration<'_>,
        comment_span: Span,
        export_bindings: &mut BTreeMap<String, String>,
        exports: &mut Vec<SymbolShell>,
    ) {
        let name = decl.id.name.to_string();
        bind_export_name_to_local(&name, &name, export_bindings);
        push_interface_shell(
            self.file_id,
            self.module_specifier,
            self.library,
            decl,
            comment_span,
            self.source,
            self.comments,
            self.import_bindings,
            true,
            exports,
        );
    }

    fn named_type_alias(
        &self,
        decl: &TSTypeAliasDeclaration<'_>,
        comment_span: Span,
        export_bindings: &mut BTreeMap<String, String>,
        exports: &mut Vec<SymbolShell>,
    ) {
        let name = decl.id.name.to_string();
        bind_export_name_to_local(&name, &name, export_bindings);
        push_type_alias_shell(
            self.file_id,
            self.module_specifier,
            self.library,
            decl,
            comment_span,
            self.source,
            self.comments,
            self.import_bindings,
            true,
            exports,
        );
    }

    fn default_interface(
        &self,
        decl: &TSInterfaceDeclaration<'_>,
        comment_span: Span,
        export_bindings: &mut BTreeMap<String, String>,
        exports: &mut Vec<SymbolShell>,
    ) {
        bind_default_to(decl.id.name.as_str(), export_bindings);
        push_interface_shell(
            self.file_id,
            self.module_specifier,
            self.library,
            decl,
            comment_span,
            self.source,
            self.comments,
            self.import_bindings,
            true,
            exports,
        );
    }
}

fn record_named_reexports(
    export_decl: &ExportNamedDeclaration<'_>,
    source: &str,
    export_bindings: &mut BTreeMap<String, String>,
) {
    for spec in &export_decl.specifiers {
        let local = module_export_name_to_string(&spec.local, source);
        let exported = module_export_name_to_string(&spec.exported, source);
        export_bindings.insert(exported, local);
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
