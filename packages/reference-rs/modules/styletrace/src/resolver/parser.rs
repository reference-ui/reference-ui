//! Oxc-backed parsing for the style-prop resolver: one TypeScript module in, one `ParsedModule` out.
//!
//! This root walks the module's top-level statements and records imports, re-exports, `export *` sources and
//! declarations. Type lowering lives in `parser/type_expr.rs` and the shared text helpers in `parser/names.rs`.
//! It takes a path and its source text, and emits a `ParsedModule`, or a parse error when oxc reports any or the
//! nesting gate refuses the source before oxc parses it.

mod names;
mod type_expr;

use std::path::Path;

use rustc_hash::FxHashMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclaration, ImportDeclarationSpecifier,
    ImportOrExportKind, Statement, TSInterfaceDeclaration, TSTypeAliasDeclaration,
};
use shared::parse::parse_bounded;
use oxc_span::{GetSpan, SourceType};

use super::error::StyleTraceError;
use super::model::{ImportBinding, ParsedModule, TypeDeclaration};
use names::{module_export_name, string_from_span, unquote};
use type_expr::{parse_interface, parse_type_alias};

struct ParseContext<'a> {
    source: &'a str,
    imports: &'a mut FxHashMap<String, ImportBinding>,
    declarations: &'a mut FxHashMap<String, TypeDeclaration>,
    reexports: &'a mut FxHashMap<String, ImportBinding>,
    export_all_sources: &'a mut Vec<String>,
}

pub(super) fn parse_module(path: &Path, source: &str) -> Result<ParsedModule, StyleTraceError> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::ts());
    let parsed = parse_bounded(&allocator, source, source_type)
        .map_err(|refusal| StyleTraceError::new(refusal.message()))?;

    if !parsed.errors.is_empty() {
        return Err(StyleTraceError::new(format!(
            "failed to parse {}: {} parse error(s)",
            path.display(),
            parsed.errors.len()
        )));
    }

    let mut imports = FxHashMap::default();
    let mut declarations = FxHashMap::default();
    let mut reexports = FxHashMap::default();
    let mut export_all_sources = Vec::new();

    {
        let mut ctx = ParseContext {
            source,
            imports: &mut imports,
            declarations: &mut declarations,
            reexports: &mut reexports,
            export_all_sources: &mut export_all_sources,
        };

        for statement in &parsed.program.body {
            collect_statement(statement, &mut ctx);
        }
    }

    Ok(ParsedModule {
        imports,
        declarations,
        reexports,
        export_all_sources,
    })
}

fn collect_statement(statement: &Statement<'_>, ctx: &mut ParseContext<'_>) {
    match statement {
        Statement::ImportDeclaration(import_decl) => parse_import_declaration(import_decl, ctx),
        Statement::TSInterfaceDeclaration(interface_decl) => {
            record_interface_declaration(interface_decl, ctx)
        }
        Statement::TSTypeAliasDeclaration(type_alias) => {
            record_type_alias_declaration(type_alias, ctx)
        }
        _ => collect_export_statement(statement, ctx),
    }
}

fn collect_export_statement(statement: &Statement<'_>, ctx: &mut ParseContext<'_>) {
    match statement {
        Statement::ExportNamedDeclaration(export_decl) => {
            collect_export_declaration(export_decl, ctx)
        }
        Statement::ExportAllDeclaration(export_all) => ctx.export_all_sources.push(unquote(
            &string_from_span(ctx.source, export_all.source.span()),
        )),
        _ => {}
    }
}

fn record_interface_declaration(
    interface_decl: &oxc_allocator::Box<'_, TSInterfaceDeclaration<'_>>,
    ctx: &mut ParseContext<'_>,
) {
    let parsed = parse_interface(interface_decl, ctx.source);
    ctx.declarations
        .insert(parsed.name.clone(), TypeDeclaration::Interface(parsed));
}

fn record_type_alias_declaration(
    type_alias: &oxc_allocator::Box<'_, TSTypeAliasDeclaration<'_>>,
    ctx: &mut ParseContext<'_>,
) {
    let parsed = parse_type_alias(type_alias, ctx.source);
    ctx.declarations
        .insert(parsed.name.clone(), TypeDeclaration::TypeAlias(parsed));
}

fn parse_import_declaration(
    import_decl: &oxc_allocator::Box<'_, ImportDeclaration<'_>>,
    ctx: &mut ParseContext<'_>,
) {
    let module_source = unquote(&string_from_span(ctx.source, import_decl.source.span()));
    let Some(specifiers) = &import_decl.specifiers else {
        return;
    };
    let type_only = import_decl.import_kind == ImportOrExportKind::Type;

    for specifier in specifiers {
        record_import_specifier(specifier, ctx, &module_source, type_only);
    }
}

/// Named imports always bind; a default import binds only when its declaration is `import type`.
fn record_import_specifier(
    specifier: &ImportDeclarationSpecifier<'_>,
    ctx: &mut ParseContext<'_>,
    module_source: &str,
    type_only: bool,
) {
    match specifier {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
            ctx.imports.insert(
                named.local.name.to_string(),
                ImportBinding {
                    imported_name: module_export_name(ctx.source, &named.imported),
                    source: module_source.to_string(),
                },
            );
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
            if type_only {
                ctx.imports.insert(
                    default_specifier.local.name.to_string(),
                    ImportBinding {
                        imported_name: "default".to_string(),
                        source: module_source.to_string(),
                    },
                );
            }
        }
        ImportDeclarationSpecifier::ImportNamespaceSpecifier(_) => {}
    }
}

fn collect_export_declaration(
    export_decl: &oxc_allocator::Box<'_, ExportNamedDeclaration<'_>>,
    ctx: &mut ParseContext<'_>,
) {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        collect_exported_declaration(declaration, ctx);
        return;
    }

    let Some(source_module) = export_decl.source.as_ref() else {
        return;
    };

    let source_module = unquote(&string_from_span(ctx.source, source_module.span()));
    for specifier in &export_decl.specifiers {
        ctx.reexports.insert(
            module_export_name(ctx.source, &specifier.exported),
            ImportBinding {
                imported_name: module_export_name(ctx.source, &specifier.local),
                source: source_module.clone(),
            },
        );
    }
}

fn collect_exported_declaration(declaration: &Declaration<'_>, ctx: &mut ParseContext<'_>) {
    match declaration {
        Declaration::TSInterfaceDeclaration(interface_decl) => {
            record_interface_declaration(interface_decl, ctx)
        }
        Declaration::TSTypeAliasDeclaration(type_alias) => {
            record_type_alias_declaration(type_alias, ctx)
        }
        _ => {}
    }
}
