//! Oxc-backed parsing and type lowering for the style-prop resolver.

use std::collections::{BTreeSet, HashMap};
use std::path::Path;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    PropertyKey, Statement, TSInterfaceDeclaration, TSLiteral, TSSignature, TSType,
    TSTypeAliasDeclaration,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType};

use super::model::{
    ImportBinding, InterfaceDecl, ParsedModule, TypeAliasDecl, TypeDeclaration, TypeExpr,
};
use super::error::StyleTraceError;

pub(super) fn parse_module(path: &Path, source: &str) -> Result<ParsedModule, StyleTraceError> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(path).unwrap_or_else(|_| SourceType::ts());
    let parsed = Parser::new(&allocator, source, source_type).parse();

    if !parsed.errors.is_empty() {
        return Err(StyleTraceError::new(format!(
            "failed to parse {}: {} parse error(s)",
            path.display(),
            parsed.errors.len()
        )));
    }

    let mut imports = HashMap::new();
    let mut declarations = HashMap::new();
    let mut reexports = HashMap::new();
    let mut export_all_sources = Vec::new();

    for statement in &parsed.program.body {
        collect_statement(
            statement,
            source,
            &mut imports,
            &mut declarations,
            &mut reexports,
            &mut export_all_sources,
        );
    }

    Ok(ParsedModule {
        imports,
        declarations,
        reexports,
        export_all_sources,
    })
}

fn collect_statement(
    statement: &Statement<'_>,
    source: &str,
    imports: &mut HashMap<String, ImportBinding>,
    declarations: &mut HashMap<String, TypeDeclaration>,
    reexports: &mut HashMap<String, ImportBinding>,
    export_all_sources: &mut Vec<String>,
) {
    match statement {
        Statement::ImportDeclaration(import_decl) => {
            let module_source = unquote(&string_from_span(source, import_decl.source.span()));
            let Some(specifiers) = &import_decl.specifiers else {
                return;
            };

            for specifier in specifiers {
                match specifier {
                    ImportDeclarationSpecifier::ImportSpecifier(named) => {
                        imports.insert(
                            named.local.name.to_string(),
                            ImportBinding {
                                imported_name: module_export_name(source, &named.imported),
                                source: module_source.clone(),
                            },
                        );
                    }
                    ImportDeclarationSpecifier::ImportDefaultSpecifier(default_specifier) => {
                        if import_decl.import_kind != ImportOrExportKind::Type {
                            continue;
                        }

                        imports.insert(
                            default_specifier.local.name.to_string(),
                            ImportBinding {
                                imported_name: "default".to_string(),
                                source: module_source.clone(),
                            },
                        );
                    }
                    ImportDeclarationSpecifier::ImportNamespaceSpecifier(_) => {}
                }
            }
        }
        Statement::TSInterfaceDeclaration(interface_decl) => {
            let parsed = parse_interface(interface_decl, source);
            declarations.insert(parsed.name.clone(), TypeDeclaration::Interface(parsed));
        }
        Statement::TSTypeAliasDeclaration(type_alias) => {
            let parsed = parse_type_alias(type_alias, source);
            declarations.insert(parsed.name.clone(), TypeDeclaration::TypeAlias(parsed));
        }
        Statement::ExportNamedDeclaration(export_decl) => {
            collect_export_declaration(export_decl, source, declarations, reexports);
        }
        Statement::ExportAllDeclaration(export_all) => {
            export_all_sources.push(unquote(&string_from_span(source, export_all.source.span())))
        }
        _ => {}
    }
}

fn collect_export_declaration(
    export_decl: &oxc_allocator::Box<'_, ExportNamedDeclaration<'_>>,
    source: &str,
    declarations: &mut HashMap<String, TypeDeclaration>,
    reexports: &mut HashMap<String, ImportBinding>,
) {
    if let Some(declaration) = export_decl.declaration.as_ref() {
        match declaration {
            Declaration::TSInterfaceDeclaration(interface_decl) => {
                let parsed = parse_interface(interface_decl, source);
                declarations.insert(parsed.name.clone(), TypeDeclaration::Interface(parsed));
            }
            Declaration::TSTypeAliasDeclaration(type_alias) => {
                let parsed = parse_type_alias(type_alias, source);
                declarations.insert(parsed.name.clone(), TypeDeclaration::TypeAlias(parsed));
            }
            _ => {}
        }
        return;
    }

    let Some(source_module) = export_decl.source.as_ref() else {
        return;
    };

    let source_module = unquote(&string_from_span(source, source_module.span()));
    for specifier in &export_decl.specifiers {
        reexports.insert(
            module_export_name(source, &specifier.exported),
            ImportBinding {
                imported_name: module_export_name(source, &specifier.local),
                source: source_module.clone(),
            },
        );
    }
}

fn parse_interface(
    interface_decl: &oxc_allocator::Box<'_, TSInterfaceDeclaration<'_>>,
    source: &str,
) -> InterfaceDecl {
    let extends = interface_decl
        .extends
        .iter()
        .map(|heritage| {
            let args = heritage
                .type_arguments
                .as_ref()
                .map(|instantiation| {
                    instantiation
                        .params
                        .iter()
                        .map(parse_type_expr)
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();

            TypeExpr::Reference {
                name: slice_span(source, heritage.expression.span()).to_string(),
                args,
            }
        })
        .collect::<Vec<_>>();

    let props = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| match signature {
            TSSignature::TSPropertySignature(property) => property_name(&property.key, source),
            _ => None,
        })
        .collect::<BTreeSet<_>>();

    InterfaceDecl {
        name: interface_decl.id.name.to_string(),
        type_params: type_params(interface_decl.type_parameters.as_deref()),
        extends,
        props,
    }
}

fn parse_type_alias(
    type_alias: &oxc_allocator::Box<'_, TSTypeAliasDeclaration<'_>>,
    source: &str,
) -> TypeAliasDecl {
    TypeAliasDecl {
        name: type_alias.id.name.to_string(),
        type_params: type_params(type_alias.type_parameters.as_deref()),
        expr: parse_type_expr_with_source(&type_alias.type_annotation, source),
    }
}

fn parse_type_expr(type_annotation: &TSType<'_>) -> TypeExpr {
    parse_type_expr_with_source(type_annotation, "")
}

fn parse_type_expr_with_source(type_annotation: &TSType<'_>, source: &str) -> TypeExpr {
    match type_annotation {
        TSType::TSTypeLiteral(type_literal) => TypeExpr::Object(
            type_literal
                .members
                .iter()
                .filter_map(|signature| match signature {
                    TSSignature::TSPropertySignature(property) => {
                        property_name(&property.key, source)
                    }
                    _ => None,
                })
                .collect(),
        ),
        TSType::TSIntersectionType(intersection) => TypeExpr::Intersection(
            intersection
                .types
                .iter()
                .map(|nested| parse_type_expr_with_source(nested, source))
                .collect(),
        ),
        TSType::TSParenthesizedType(parenthesized) => {
            parse_type_expr_with_source(&parenthesized.type_annotation, source)
        }
        TSType::TSUnionType(union) => {
            let literals = union
                .types
                .iter()
                .filter_map(|nested| literal_value(nested, source))
                .collect::<BTreeSet<_>>();
            if literals.is_empty() {
                TypeExpr::Unknown
            } else {
                TypeExpr::UnionLiterals(literals)
            }
        }
        TSType::TSLiteralType(_) => literal_value(type_annotation, source)
            .map(|value| TypeExpr::UnionLiterals(BTreeSet::from([value])))
            .unwrap_or(TypeExpr::Unknown),
        TSType::TSTypeReference(reference) => TypeExpr::Reference {
            name: slice_span(source, reference.type_name.span()).to_string(),
            args: reference
                .type_arguments
                .as_ref()
                .map(|instantiation| {
                    instantiation
                        .params
                        .iter()
                        .map(|arg| parse_type_expr_with_source(arg, source))
                        .collect()
                })
                .unwrap_or_default(),
        },
        TSType::TSIndexedAccessType(indexed_access) => TypeExpr::IndexedAccess {
            object: Box::new(parse_type_expr_with_source(
                &indexed_access.object_type,
                source,
            )),
            index: Box::new(parse_type_expr_with_source(
                &indexed_access.index_type,
                source,
            )),
        },
        TSType::TSMappedType(mapped) => TypeExpr::Mapped {
            key_source: Box::new(parse_type_expr_with_source(&mapped.constraint, source)),
            value_type: Box::new(
                mapped
                    .type_annotation
                    .as_ref()
                    .map(|value| parse_type_expr_with_source(value, source))
                    .unwrap_or(TypeExpr::Unknown),
            ),
        },
        TSType::TSTypeOperatorType(operator) => match operator.operator {
            oxc_ast::ast::TSTypeOperatorOperator::Keyof => TypeExpr::Keyof(Box::new(
                parse_type_expr_with_source(&operator.type_annotation, source),
            )),
            _ => TypeExpr::Unknown,
        },
        TSType::TSConditionalType(conditional) => TypeExpr::Conditional {
            true_type: Box::new(parse_type_expr_with_source(&conditional.true_type, source)),
            false_type: Box::new(parse_type_expr_with_source(&conditional.false_type, source)),
        },
        TSType::TSStringKeyword(_)
        | TSType::TSNumberKeyword(_)
        | TSType::TSBooleanKeyword(_)
        | TSType::TSUnknownKeyword(_)
        | TSType::TSAnyKeyword(_)
        | TSType::TSUndefinedKeyword(_)
        | TSType::TSNullKeyword(_)
        | TSType::TSObjectKeyword(_)
        | TSType::TSBigIntKeyword(_)
        | TSType::TSSymbolKeyword(_)
        | TSType::TSNeverKeyword(_)
        | TSType::TSVoidKeyword(_)
        | TSType::TSIntrinsicKeyword(_) => TypeExpr::Unknown,
        _ => TypeExpr::Unknown,
    }
}

fn literal_value(type_annotation: &TSType<'_>, source: &str) -> Option<String> {
    match type_annotation {
        TSType::TSLiteralType(literal) => literal_from_ts_literal(&literal.literal, source),
        TSType::TSParenthesizedType(parenthesized) => {
            literal_value(&parenthesized.type_annotation, source)
        }
        _ => None,
    }
}

fn literal_from_ts_literal(literal: &TSLiteral<'_>, source: &str) -> Option<String> {
    let raw = string_from_span(source, literal.span());
    Some(unquote(&raw))
}

fn property_name(key: &PropertyKey<'_>, source: &str) -> Option<String> {
    Some(unquote(&slice_span(source, key.span())))
}

fn module_export_name(source: &str, imported: &oxc_ast::ast::ModuleExportName<'_>) -> String {
    unquote(&slice_span(source, imported.span()))
}

fn type_params(params: Option<&oxc_ast::ast::TSTypeParameterDeclaration<'_>>) -> Vec<String> {
    params
        .map(|params| {
            params
                .params
                .iter()
                .map(|param| param.name.name.to_string())
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

fn slice_span<'a>(source: &'a str, span: oxc_span::Span) -> &'a str {
    let start = span.start as usize;
    let end = span.end as usize;
    source.get(start..end).unwrap_or_default()
}

fn string_from_span(source: &str, span: oxc_span::Span) -> String {
    slice_span(source, span).to_string()
}

fn unquote(value: &str) -> String {
    value
        .trim()
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}
