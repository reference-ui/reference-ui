use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    PropertyKey, Statement, TSPropertySignature, TSSignature, TSType,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use super::super::api::{ScannerDiagnostic, TsMember, TsSymbolKind, TypeRef};
use super::super::scanner::{resolve_local_import, symbol_id, ScannedFile, ScannedWorkspace};
use super::model::{ImportBinding, ParsedFileAst, SymbolShell};

pub(super) fn extract_files(
    scanned_workspace: &ScannedWorkspace,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> Vec<ParsedFileAst> {
    scanned_workspace
        .files
        .iter()
        .map(|scanned_file| extract_file(scanned_file, &scanned_workspace.file_ids, diagnostics))
        .collect()
}

fn extract_file(
    scanned_file: &ScannedFile,
    file_id_set: &std::collections::BTreeSet<String>,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> ParsedFileAst {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(&scanned_file.file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, &scanned_file.source, source_type).parse();

    if !parse_result.errors.is_empty() {
        diagnostics.push(ScannerDiagnostic {
            file_id: scanned_file.file_id.clone(),
            message: format!("parse reported {} error(s)", parse_result.errors.len()),
        });
    }

    let mut import_bindings = BTreeMap::new();
    let mut exports = Vec::new();

    for statement in parse_result.program.body.iter() {
        match statement {
            Statement::ImportDeclaration(import) => {
                collect_import_bindings(
                    &scanned_file.file_id,
                    import,
                    &scanned_file.source,
                    file_id_set,
                    &mut import_bindings,
                );
            }
            Statement::ExportNamedDeclaration(export_decl) => {
                collect_exported_declaration(
                    &scanned_file.file_id,
                    export_decl,
                    &scanned_file.source,
                    &import_bindings,
                    &mut exports,
                );
            }
            _ => {}
        }
    }

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        source: scanned_file.source.clone(),
        import_bindings,
        exports,
    }
}

fn collect_import_bindings(
    current_file_id: &str,
    import: &oxc_ast::ast::ImportDeclaration<'_>,
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
        let target_file_id = resolve_local_import(current_file_id, &source_module, file_id_set);

        if let Some(specifiers) = &import.specifiers {
            for specifier in specifiers {
                if let ImportDeclarationSpecifier::ImportSpecifier(named) = specifier {
                    let local_name = slice_span(source, named.local.span).to_string();
                    let imported_name = named.imported.name().to_string();
                    import_bindings.insert(
                        local_name,
                        ImportBinding {
                            imported_name,
                            source_module: source_module.clone(),
                            target_file_id: target_file_id.clone(),
                        },
                    );
                }
            }
        }
    }
}

fn collect_exported_declaration(
    file_id: &str,
    export_decl: &ExportNamedDeclaration<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    exports: &mut Vec<SymbolShell>,
) {
    let Some(declaration) = &export_decl.declaration else {
        return;
    };

    match declaration {
        Declaration::TSInterfaceDeclaration(interface_decl) => {
            let name = interface_decl.id.name.to_string();
            let id = symbol_id(file_id, &name);
            let defined_members = interface_decl
                .body
                .body
                .iter()
                .filter_map(|signature| match signature {
                    TSSignature::TSPropertySignature(property) => Some(
                        property_signature_to_member(property, source, import_bindings),
                    ),
                    _ => None,
                })
                .collect::<Vec<_>>();

            let extends = interface_decl
                .extends
                .iter()
                .map(|heritage| {
                    expression_to_reference(&heritage.expression, source, import_bindings)
                })
                .collect::<Vec<_>>();

            let references = collect_references_from_members(&defined_members, &extends, None);

            exports.push(SymbolShell {
                id,
                name,
                kind: TsSymbolKind::Interface,
                exported: true,
                defined_members,
                extends,
                underlying: None,
                references,
            });
        }
        Declaration::TSTypeAliasDeclaration(type_alias) => {
            let name = type_alias.id.name.to_string();
            let id = symbol_id(file_id, &name);
            let underlying = Some(type_to_ref(
                &type_alias.type_annotation,
                source,
                import_bindings,
            ));
            let references = collect_references_from_members(&[], &[], underlying.as_ref());

            exports.push(SymbolShell {
                id,
                name,
                kind: TsSymbolKind::TypeAlias,
                exported: true,
                defined_members: Vec::new(),
                extends: Vec::new(),
                underlying,
                references,
            });
        }
        _ => {}
    }
}

fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
) -> TsMember {
    let name = property_key_name(&property.key, source);
    let type_ref = property
        .type_annotation
        .as_ref()
        .map(|annotation| type_to_ref(&annotation.type_annotation, source, import_bindings));

    TsMember {
        name,
        optional: property.optional,
        type_ref,
    }
}

fn type_to_ref(
    type_annotation: &TSType<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
) -> TypeRef {
    match type_annotation {
        TSType::TSStringKeyword(_) => TypeRef::Intrinsic {
            name: "string".to_string(),
        },
        TSType::TSNumberKeyword(_) => TypeRef::Intrinsic {
            name: "number".to_string(),
        },
        TSType::TSBooleanKeyword(_) => TypeRef::Intrinsic {
            name: "boolean".to_string(),
        },
        TSType::TSUnknownKeyword(_) => TypeRef::Intrinsic {
            name: "unknown".to_string(),
        },
        TSType::TSAnyKeyword(_) => TypeRef::Intrinsic {
            name: "any".to_string(),
        },
        TSType::TSUndefinedKeyword(_) => TypeRef::Intrinsic {
            name: "undefined".to_string(),
        },
        TSType::TSNullKeyword(_) => TypeRef::Intrinsic {
            name: "null".to_string(),
        },
        TSType::TSLiteralType(literal) => TypeRef::Literal {
            value: slice_span(source, literal.span).to_string(),
        },
        TSType::TSUnionType(union) => TypeRef::Union {
            types: union
                .types
                .iter()
                .map(|nested| type_to_ref(nested, source, import_bindings))
                .collect(),
        },
        TSType::TSTypeReference(reference) => {
            let name = slice_span(source, reference.type_name.span()).to_string();
            let source_module = import_bindings
                .get(&name)
                .map(|binding| binding.source_module.clone());

            TypeRef::Reference {
                name,
                target_id: None,
                source_module,
            }
        }
        _ => TypeRef::Unknown {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
    }
}

fn expression_to_reference(
    expression: &oxc_ast::ast::Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
) -> TypeRef {
    let name = slice_span(source, expression.span()).to_string();
    let source_module = import_bindings
        .get(&name)
        .map(|binding| binding.source_module.clone());

    TypeRef::Reference {
        name,
        target_id: None,
        source_module,
    }
}

fn collect_references_from_members(
    members: &[TsMember],
    extends: &[TypeRef],
    underlying: Option<&TypeRef>,
) -> Vec<TypeRef> {
    let mut references = Vec::new();
    references.extend(extends.iter().cloned());
    if let Some(underlying) = underlying {
        collect_type_ref_references(underlying, &mut references);
    }
    for member in members {
        if let Some(type_ref) = &member.type_ref {
            collect_type_ref_references(type_ref, &mut references);
        }
    }
    references
}

fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference { .. } => references.push(type_ref.clone()),
        TypeRef::Union { types } => {
            for nested in types {
                collect_type_ref_references(nested, references);
            }
        }
        _ => {}
    }
}

fn property_key_name(key: &PropertyKey<'_>, source: &str) -> String {
    slice_span(source, key.span()).to_string()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}
