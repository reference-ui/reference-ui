use std::collections::BTreeMap;

use super::super::model::{
    ExportMap, FnParam, ScannerDiagnostic, TemplateLiteralPart, TsFile, TsMember, TsSymbol,
    TsTypeParameter, TupleElement, TypeRef,
};
use super::model::{ImportBindingKind, ParsedFileAst, ParsedTypeScriptAst, SymbolShell};

#[derive(Debug, Clone)]
pub(crate) struct ResolvedTypeScriptGraph {
    pub(crate) files: BTreeMap<String, TsFile>,
    pub(crate) symbols: BTreeMap<String, TsSymbol>,
    pub(crate) exports: BTreeMap<String, ExportMap>,
    pub(crate) diagnostics: Vec<ScannerDiagnostic>,
}

pub(crate) fn resolve_ast(parsed_ast: ParsedTypeScriptAst) -> ResolvedTypeScriptGraph {
    let symbol_index = build_symbol_index(&parsed_ast.files);
    let export_index = build_export_index(&parsed_ast.files, &symbol_index);
    let mut files = BTreeMap::new();
    let mut symbols = BTreeMap::new();
    let mut exports = BTreeMap::new();

    for parsed in parsed_ast.files {
        let ParsedFileAst {
            file_id,
            module_specifier,
            library,
            source,
            import_bindings,
            export_bindings,
            exports: parsed_exports,
        } = parsed;

        files.insert(
            file_id.clone(),
            TsFile {
                path: file_id.clone(),
                module_specifier: module_specifier.clone(),
                library: library.clone(),
            },
        );

        let mut file_exports = ExportMap::new();
        let parsed_view = ParsedFileAst {
            file_id: file_id.clone(),
            module_specifier: module_specifier.clone(),
            library: library.clone(),
            source,
            import_bindings,
            export_bindings: export_bindings.clone(),
            exports: Vec::new(),
        };

        for symbol in parsed_exports {
            let resolved_symbol =
                resolve_symbol_references(symbol, &symbol_index, &export_index, &parsed_view);
            symbols.insert(resolved_symbol.id.clone(), resolved_symbol);
        }

        for (export_name, local_name) in export_bindings {
            if let Some(symbol_id) = symbol_index.get(&(file_id.clone(), local_name)) {
                file_exports.insert(export_name, symbol_id.clone());
            }
        }

        if !file_exports.is_empty() {
            exports.insert(module_specifier, file_exports);
        }
    }

    ResolvedTypeScriptGraph {
        files,
        symbols,
        exports,
        diagnostics: parsed_ast.diagnostics,
    }
}

fn build_symbol_index(parsed_files: &[ParsedFileAst]) -> BTreeMap<(String, String), String> {
    let mut index = BTreeMap::new();
    for parsed in parsed_files {
        for symbol in &parsed.exports {
            index.insert(
                (parsed.file_id.clone(), symbol.name.clone()),
                symbol.id.clone(),
            );
        }
    }
    index
}

fn build_export_index(
    parsed_files: &[ParsedFileAst],
    symbol_index: &BTreeMap<(String, String), String>,
) -> BTreeMap<(String, String), String> {
    let mut index = BTreeMap::new();

    for parsed in parsed_files {
        for (export_name, local_name) in &parsed.export_bindings {
            if let Some(symbol_id) = symbol_index.get(&(parsed.file_id.clone(), local_name.clone())) {
                index.insert((parsed.file_id.clone(), export_name.clone()), symbol_id.clone());
            }
        }
    }

    index
}

fn resolve_symbol_references(
    mut symbol: SymbolShell,
    symbol_index: &BTreeMap<(String, String), String>,
    export_index: &BTreeMap<(String, String), String>,
    parsed: &ParsedFileAst,
) -> TsSymbol {
    symbol.extends = symbol
        .extends
        .into_iter()
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, export_index, parsed))
        .collect();
    symbol.underlying = symbol
        .underlying
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, export_index, parsed));
    symbol.defined_members = symbol
        .defined_members
        .into_iter()
        .map(|member| TsMember {
            type_ref: member
                .type_ref
                .map(|type_ref| resolve_type_ref(type_ref, symbol_index, export_index, parsed)),
            ..member
        })
        .collect();
    symbol.references = symbol
        .references
        .into_iter()
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, export_index, parsed))
        .collect();

    let type_parameters = symbol
        .type_parameters
        .into_iter()
        .map(|param| TsTypeParameter {
            name: param.name,
            constraint: param
                .constraint
                .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed)),
            default: param.default.map(|t| resolve_type_ref(t, symbol_index, export_index, parsed)),
        })
        .collect();

    TsSymbol {
        id: symbol.id,
        name: symbol.name,
        library: parsed.library.clone(),
        kind: symbol.kind,
        file_id: parsed.file_id.clone(),
        exported: symbol.exported,
        description: symbol.description,
        description_raw: symbol.description_raw,
        jsdoc: symbol.jsdoc,
        type_parameters,
        defined_members: symbol.defined_members,
        extends: symbol.extends,
        underlying: symbol.underlying,
        references: symbol.references,
    }
}

fn resolve_type_ref(
    type_ref: TypeRef,
    symbol_index: &BTreeMap<(String, String), String>,
    export_index: &BTreeMap<(String, String), String>,
    parsed: &ParsedFileAst,
) -> TypeRef {
    match type_ref {
        TypeRef::Reference {
            name,
            target_id,
            source_module,
            type_arguments,
        } => {
            let resolved_args = type_arguments.map(|args| {
                args.into_iter()
                    .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed))
                    .collect()
            });

            if target_id.is_some() {
                return TypeRef::Reference {
                    name,
                    target_id,
                    source_module,
                    type_arguments: resolved_args,
                };
            }

            let lookup_name = reference_lookup_name(&name).to_string();
            if let Some(binding) = parsed.import_bindings.get(&lookup_name) {
                if let Some(target_file_id) = &binding.target_file_id {
                    let export_name = match binding.kind {
                        ImportBindingKind::Namespace => namespace_export_lookup_name(&name),
                        _ => Some(binding.imported_name.as_str()),
                    };
                    if let Some(export_name) = export_name {
                        if let Some(target_id) =
                            export_index.get(&(target_file_id.clone(), export_name.to_string()))
                        {
                            return TypeRef::Reference {
                                name,
                                target_id: Some(target_id.clone()),
                                source_module,
                                type_arguments: resolved_args,
                            };
                        }
                    }
                }
            }

            if let Some(target_id) = symbol_index.get(&(parsed.file_id.clone(), name.clone())) {
                return TypeRef::Reference {
                    name,
                    target_id: Some(target_id.clone()),
                    source_module,
                    type_arguments: resolved_args,
                };
            }

            TypeRef::Reference {
                name,
                target_id: None,
                source_module,
                type_arguments: resolved_args,
            }
        }
        TypeRef::Union { types } => TypeRef::Union {
            types: types
                .into_iter()
                .map(|nested| resolve_type_ref(nested, symbol_index, export_index, parsed))
                .collect(),
        },
        TypeRef::Array { element } => TypeRef::Array {
            element: Box::new(resolve_type_ref(*element, symbol_index, export_index, parsed)),
        },
        TypeRef::Tuple { elements } => TypeRef::Tuple {
            elements: elements
                .into_iter()
                .map(|te| TupleElement {
                    element: resolve_type_ref(te.element, symbol_index, export_index, parsed),
                    ..te
                })
                .collect(),
        },
        TypeRef::Intersection { types } => TypeRef::Intersection {
            types: types
                .into_iter()
                .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed))
                .collect(),
        },
        TypeRef::Object { members } => TypeRef::Object {
            members: members
                .into_iter()
                .map(|m| TsMember {
                    type_ref: m
                        .type_ref
                        .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed)),
                    ..m
                })
                .collect(),
        },
        TypeRef::IndexedAccess { object, index } => TypeRef::IndexedAccess {
            object: Box::new(resolve_type_ref(*object, symbol_index, export_index, parsed)),
            index: Box::new(resolve_type_ref(*index, symbol_index, export_index, parsed)),
        },
        TypeRef::Function { params, return_type } => TypeRef::Function {
            params: params
                .iter()
                .map(|p| FnParam {
                    type_ref: p
                        .type_ref
                        .as_ref()
                        .map(|t| resolve_type_ref(t.clone(), symbol_index, export_index, parsed)),
                    ..p.clone()
                })
                .collect(),
            return_type: Box::new(resolve_type_ref(
                (*return_type).clone(),
                symbol_index,
                export_index,
                parsed,
            )),
        },
        TypeRef::Constructor {
            r#abstract,
            type_parameters,
            params,
            return_type,
        } => TypeRef::Constructor {
            r#abstract,
            type_parameters: type_parameters
                .into_iter()
                .map(|param| TsTypeParameter {
                    name: param.name,
                    constraint: param
                        .constraint
                        .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed)),
                    default: param
                        .default
                        .map(|t| resolve_type_ref(t, symbol_index, export_index, parsed)),
                })
                .collect(),
            params: params
                .iter()
                .map(|p| FnParam {
                    type_ref: p
                        .type_ref
                        .as_ref()
                        .map(|t| resolve_type_ref(t.clone(), symbol_index, export_index, parsed)),
                    ..p.clone()
                })
                .collect(),
            return_type: Box::new(resolve_type_ref(
                (*return_type).clone(),
                symbol_index,
                export_index,
                parsed,
            )),
        },
        TypeRef::TypeOperator { operator, target } => TypeRef::TypeOperator {
            operator,
            target: Box::new(resolve_type_ref(*target, symbol_index, export_index, parsed)),
        },
        TypeRef::TypeQuery { expression } => TypeRef::TypeQuery { expression },
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => TypeRef::Conditional {
            check_type: Box::new(resolve_type_ref(
                *check_type,
                symbol_index,
                export_index,
                parsed,
            )),
            extends_type: Box::new(resolve_type_ref(
                *extends_type,
                symbol_index,
                export_index,
                parsed,
            )),
            true_type: Box::new(resolve_type_ref(
                *true_type,
                symbol_index,
                export_index,
                parsed,
            )),
            false_type: Box::new(resolve_type_ref(
                *false_type,
                symbol_index,
                export_index,
                parsed,
            )),
        },
        TypeRef::Mapped {
            type_param,
            source_type,
            name_type,
            optional_modifier,
            readonly_modifier,
            value_type,
        } => TypeRef::Mapped {
            type_param,
            source_type: Box::new(resolve_type_ref(
                *source_type,
                symbol_index,
                export_index,
                parsed,
            )),
            name_type: name_type.map(|name_type| {
                Box::new(resolve_type_ref(*name_type, symbol_index, export_index, parsed))
            }),
            optional_modifier,
            readonly_modifier,
            value_type: value_type.map(|value_type| {
                Box::new(resolve_type_ref(*value_type, symbol_index, export_index, parsed))
            }),
        },
        TypeRef::TemplateLiteral { parts } => TypeRef::TemplateLiteral {
            parts: parts
                .into_iter()
                .map(|part| match part {
                    TemplateLiteralPart::Text { value } => TemplateLiteralPart::Text { value },
                    TemplateLiteralPart::Type { value } => TemplateLiteralPart::Type {
                        value: resolve_type_ref(value, symbol_index, export_index, parsed),
                    },
                })
                .collect(),
        },
        other => other,
    }
}

fn namespace_export_lookup_name(reference_name: &str) -> Option<&str> {
    let after_dot = reference_name.split_once('.')?.1;
    after_dot.split(['.', '<']).next()
}

fn reference_lookup_name(reference_name: &str) -> &str {
    reference_name
        .split(['.', '<'])
        .next()
        .unwrap_or(reference_name)
}
