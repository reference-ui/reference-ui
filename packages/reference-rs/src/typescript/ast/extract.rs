use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Comment, Declaration, ExportNamedDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    PropertyKey, Statement, TSConstructSignatureDeclaration, TSIndexSignature,
    TSCallSignatureDeclaration, TSInterfaceDeclaration, TSMethodSignature, TSPropertySignature,
    TSSignature, TSType, TSTypeAliasDeclaration,
    TSTypeParameterDeclaration, TSTupleElement,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use super::super::api::{
    ScannerDiagnostic, TsMember, TsMemberKind, TsSymbolKind, TsTypeParameter, TupleElement, TypeRef,
};
use super::super::scanner::{resolve_import, symbol_id, ScannedFile, ScannedWorkspace};
use super::model::{ImportBinding, ParsedFileAst, SymbolShell};

/// Returns the raw text of the leading comment block immediately before `node_span`, or None.
/// Only comments that end before `node_span.start` are considered; the block is the one(s)
/// that end closest to the node. If `exclude_starts_between` is provided, a comment is only
/// used when no excluded start lies strictly between the comment end and `node_span.start`
/// (so we don't attribute a comment to a declaration when another declaration appears in between).
fn leading_comment_for_span(
    source: &str,
    comments: &[Comment],
    node_span: Span,
    exclude_starts_between: Option<&[u32]>,
) -> Option<String> {
    let node_start = node_span.start;
    let leading: Vec<_> = comments
        .iter()
        .filter(|c| c.span.end <= node_start)
        .collect();
    if leading.is_empty() {
        return None;
    }
    // Sort by end position descending so the comment closest to the node is first.
    let mut by_end: Vec<_> = leading.into_iter().collect();
    by_end.sort_by_key(|c| std::cmp::Reverse(c.span.end));

    let first = by_end[0];
    // If another node starts between this comment and our node, this comment belongs to that node.
    if let Some(exclude) = exclude_starts_between {
        if exclude
            .iter()
            .any(|&s| s > first.span.end && s < node_start)
        {
            return None;
        }
    }
    let mut block_start = first.span.start as usize;
    let block_end = first.span.end as usize;

    // Extend backward to include adjacent leading comments (e.g. multiple lines or blocks).
    for c in by_end.iter().skip(1) {
        let c_end = c.span.end as usize;
        let c_start = c.span.start as usize;
        // Consider adjacent if the gap is only whitespace (e.g. newlines).
        let gap = source.get(c_end..block_start).unwrap_or("");
        if gap.trim().is_empty() && c_end <= block_start {
            block_start = c_start;
        } else {
            break;
        }
    }

    let raw = source.get(block_start..block_end)?;
    let normalized = normalize_comment_text(raw);
    if normalized.is_empty() {
        None
    } else {
        Some(normalized)
    }
}

/// Strips comment markers (//, /*, */, /**) and leading `*` on lines; trims; preserves newlines.
fn normalize_comment_text(raw: &str) -> String {
    let mut s = raw.trim();
    // Strip block start
    if s.starts_with("/**") {
        s = s[3..].trim_start();
    } else if s.starts_with("/*") {
        s = s[2..].trim_start();
    }
    // Strip block end
    if s.ends_with("*/") {
        s = s[..s.len() - 2].trim_end();
    }
    // Line comments: strip // from each line
    let lines: Vec<&str> = s.lines().collect();
    let normalized_lines: Vec<String> = lines
        .iter()
        .map(|line| {
            let t = line.trim_start();
            let stripped = if t.starts_with("//") {
                t[2..].trim_start()
            } else if t.starts_with('*') {
                t[1..].trim_start()
            } else {
                t
            };
            stripped.to_string()
        })
        .collect();
    let result = normalized_lines.join("\n").trim().to_string();
    result
}

pub(super) fn extract_files(
    scanned_workspace: &ScannedWorkspace,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> Vec<ParsedFileAst> {
    scanned_workspace
        .files
        .iter()
        .map(|scanned_file| {
            extract_file(
                &scanned_workspace.root_dir,
                scanned_file,
                &scanned_workspace.file_ids,
                diagnostics,
            )
        })
        .collect()
}

fn extract_file(
    root_dir: &std::path::Path,
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
                    root_dir,
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
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    export_decl,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    &mut exports,
                );
            }
            Statement::TSInterfaceDeclaration(interface_decl) if scanned_file.library == "user" => {
                push_interface_shell(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    interface_decl,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    false,
                    &mut exports,
                );
            }
            Statement::TSTypeAliasDeclaration(type_alias) if scanned_file.library == "user" => {
                push_type_alias_shell(
                    &scanned_file.file_id,
                    &scanned_file.module_specifier,
                    &scanned_file.library,
                    type_alias,
                    &scanned_file.source,
                    &parse_result.program.comments,
                    &import_bindings,
                    false,
                    &mut exports,
                );
            }
            _ => {}
        }
    }

    ParsedFileAst {
        file_id: scanned_file.file_id.clone(),
        module_specifier: scanned_file.module_specifier.clone(),
        library: scanned_file.library.clone(),
        source: scanned_file.source.clone(),
        import_bindings,
        exports,
    }
}

fn collect_import_bindings(
    root_dir: &std::path::Path,
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
        let target_file_id = resolve_import(root_dir, current_file_id, &source_module, file_id_set);

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
    current_module_specifier: &str,
    current_library: &str,
    export_decl: &ExportNamedDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exports: &mut Vec<SymbolShell>,
) {
    let Some(declaration) = &export_decl.declaration else {
        return;
    };

    match declaration {
        Declaration::TSInterfaceDeclaration(interface_decl) => {
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

fn push_interface_shell<'a>(
    file_id: &str,
    current_module_specifier: &str,
    current_library: &str,
    interface_decl: &TSInterfaceDeclaration<'a>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    let name = interface_decl.id.name.to_string();
    let id = symbol_id(file_id, &name);
    let description = leading_comment_for_span(source, comments, interface_decl.span(), None);
    let interface_start = interface_decl.span().start;
    let all_member_starts: Vec<u32> = interface_decl
        .body
        .body
        .iter()
        .map(|sig| sig.span().start)
        .collect();
    let defined_members = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| {
            let start = signature.span().start;
            let others: Vec<u32> = std::iter::once(interface_start)
                .chain(all_member_starts.iter().copied().filter(|&s| s != start))
                .collect();
            let exclude = if others.is_empty() {
                None
            } else {
                Some(others.as_slice())
            };
            match signature {
                TSSignature::TSPropertySignature(property) => Some(property_signature_to_member(
                    property,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSMethodSignature(method) => Some(method_signature_to_member(
                    method,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSCallSignatureDeclaration(call) => Some(call_signature_to_member(
                    call,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSIndexSignature(index) => Some(index_signature_to_member(
                    index,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
                TSSignature::TSConstructSignatureDeclaration(decl) => Some(construct_signature_to_member(
                    decl,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                )),
            }
        })
        .collect::<Vec<_>>();

    let extends = interface_decl
        .extends
        .iter()
        .map(|heritage| {
            expression_to_reference(
                &heritage.expression,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )
        })
        .collect::<Vec<_>>();

    let type_parameters = type_parameters_from_oxc(
        interface_decl.type_parameters.as_deref(),
        source,
        comments,
        import_bindings,
        current_module_specifier,
        current_library,
    );

    let references = collect_references_from_members(&defined_members, &extends, None, &type_parameters);

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::Interface,
        exported,
        description,
        type_parameters,
        defined_members,
        extends,
        underlying: None,
        references,
    });
}

fn push_type_alias_shell<'a>(
    file_id: &str,
    _current_module_specifier: &str,
    current_library: &str,
    type_alias: &TSTypeAliasDeclaration<'a>,
    source: &str,
    comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    exported: bool,
    exports: &mut Vec<SymbolShell>,
) {
    let name = type_alias.id.name.to_string();
    let id = symbol_id(file_id, &name);
    let description = leading_comment_for_span(source, comments, type_alias.span(), None);
    let type_parameters = type_parameters_from_oxc(
        type_alias.type_parameters.as_deref(),
        source,
        comments,
        import_bindings,
        _current_module_specifier,
        current_library,
    );

    let underlying = Some(type_to_ref(
        &type_alias.type_annotation,
        source,
        import_bindings,
        _current_module_specifier,
        current_library,
    ));
    let references = collect_references_from_members(&[], &[], underlying.as_ref(), &type_parameters);

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::TypeAlias,
        exported,
        description,
        type_parameters,
        defined_members: Vec::new(),
        extends: Vec::new(),
        underlying,
        references,
    });
}

fn property_signature_to_member(
    property: &TSPropertySignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&property.key, source);
    let description = leading_comment_for_span(
        source,
        comments,
        property.span(),
        exclude_starts_between,
    );
    let type_ref = property.type_annotation.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: property.optional,
        readonly: property.readonly,
        kind: TsMemberKind::Property,
        description,
        type_ref,
    }
}

fn method_signature_to_member(
    method: &TSMethodSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let name = property_key_name(&method.key, source);
    let description = leading_comment_for_span(source, comments, method.span(), exclude_starts_between);
    let type_ref = method.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name,
        optional: method.optional,
        readonly: false,
        kind: TsMemberKind::Method,
        description,
        type_ref,
    }
}

fn call_signature_to_member(
    call: &TSCallSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let description = leading_comment_for_span(source, comments, call.span(), exclude_starts_between);
    let type_ref = call.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[call]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::CallSignature,
        description,
        type_ref,
    }
}

fn construct_signature_to_member(
    decl: &TSConstructSignatureDeclaration<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let description = leading_comment_for_span(source, comments, decl.span(), exclude_starts_between);
    let type_ref = decl.return_type.as_ref().map(|annotation| {
        type_to_ref(
            &annotation.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        )
    });

    TsMember {
        name: "[new]".to_string(),
        optional: false,
        readonly: false,
        kind: TsMemberKind::ConstructSignature,
        description,
        type_ref,
    }
}

fn index_signature_to_member(
    index: &TSIndexSignature<'_>,
    source: &str,
    comments: &[Comment],
    exclude_starts_between: Option<&[u32]>,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TsMember {
    let description = leading_comment_for_span(source, comments, index.span(), exclude_starts_between);
    let type_ref = Some(type_to_ref(
        &index.type_annotation.type_annotation,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
    ));

    TsMember {
        name: "[index]".to_string(),
        optional: false,
        readonly: index.readonly,
        kind: TsMemberKind::IndexSignature,
        description,
        type_ref,
    }
}

/// Converts a tuple element to TupleElement (label, optional, rest, element type).
fn tuple_element_to_tuple_element(
    el: &TSTupleElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TupleElement {
    match el {
        TSTupleElement::TSOptionalType(opt) => TupleElement {
            label: None,
            optional: true,
            rest: false,
            element: type_to_ref(
                &opt.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSTupleElement::TSRestType(rest) => TupleElement {
            label: None,
            optional: false,
            rest: true,
            element: type_to_ref(
                &rest.type_annotation,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            ),
        },
        TSTupleElement::TSNamedTupleMember(named) => {
            let label = slice_span(source, named.label.span()).to_string();
            let element = tuple_element_to_tuple_element(
                &named.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            );
            TupleElement {
                label: Some(label),
                optional: named.optional,
                rest: false,
                element: element.element,
            }
        }
        _ => {
            // TSTupleElement shares layout with TSType for inherited variants (per oxc inherit_variants macro).
            TupleElement {
                label: None,
                optional: false,
                rest: false,
                element: type_to_ref(
                    unsafe { &*(el as *const TSTupleElement<'_> as *const TSType<'_>) },
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ),
            }
        }
    }
}

fn type_parameters_from_oxc<'a>(
    decl: Option<&TSTypeParameterDeclaration<'a>>,
    source: &str,
    _comments: &[Comment],
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Vec<TsTypeParameter> {
    let Some(decl) = decl else {
        return Vec::new();
    };
    decl.params
        .iter()
        .map(|param| {
            let name = slice_span(source, param.name.span()).to_string();
            let constraint = param
                .constraint
                .as_ref()
                .map(|t| type_to_ref(t, source, import_bindings, current_module_specifier, current_library));
            let default = param
                .default
                .as_ref()
                .map(|t| type_to_ref(t, source, import_bindings, current_module_specifier, current_library));
            TsTypeParameter {
                name,
                constraint,
                default,
            }
        })
        .collect()
}

fn type_to_ref(
    type_annotation: &TSType<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
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
        TSType::TSObjectKeyword(_) => TypeRef::Intrinsic {
            name: "object".to_string(),
        },
        TSType::TSLiteralType(literal) => TypeRef::Literal {
            value: slice_span(source, literal.span).to_string(),
        },
        TSType::TSUnionType(union) => TypeRef::Union {
            types: union
                .types
                .iter()
                .map(|nested| {
                    type_to_ref(
                        nested,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSArrayType(arr) => TypeRef::Array {
            element: Box::new(type_to_ref(
                &arr.element_type,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
            )),
        },
        TSType::TSTupleType(tuple) => TypeRef::Tuple {
            elements: tuple
                .element_types
                .iter()
                .map(|el| {
                    tuple_element_to_tuple_element(
                        el,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSIntersectionType(inter) => TypeRef::Intersection {
            types: inter
                .types
                .iter()
                .map(|t| {
                    type_to_ref(
                        t,
                        source,
                        import_bindings,
                        current_module_specifier,
                        current_library,
                    )
                })
                .collect(),
        },
        TSType::TSTypeLiteral(lit) => {
            let all_starts: Vec<u32> = lit.members.iter().map(|s| s.span().start).collect();
            let no_comments: &[Comment] = &[];
            let members: Vec<TsMember> = lit
                .members
                .iter()
                .filter_map(|sig| {
                    let start = sig.span().start;
                    let others: Vec<u32> =
                        all_starts.iter().copied().filter(|&s| s != start).collect();
                    let exclude = if others.is_empty() {
                        None
                    } else {
                        Some(others.as_slice())
                    };
                    match sig {
                        TSSignature::TSPropertySignature(property) => {
                            Some(property_signature_to_member(
                                property,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ))
                        }
                        TSSignature::TSMethodSignature(method) => Some(method_signature_to_member(
                            method,
                            source,
                            no_comments,
                            exclude,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )),
                        TSSignature::TSCallSignatureDeclaration(call) => {
                            Some(call_signature_to_member(
                                call,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ))
                        }
                        TSSignature::TSIndexSignature(index) => Some(index_signature_to_member(
                            index,
                            source,
                            no_comments,
                            exclude,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )),
                        TSSignature::TSConstructSignatureDeclaration(decl) => {
                            Some(construct_signature_to_member(
                                decl,
                                source,
                                no_comments,
                                exclude,
                                import_bindings,
                                current_module_specifier,
                                current_library,
                            ))
                        }
                    }
                })
                .collect();
            TypeRef::Object { members }
        }
        TSType::TSParenthesizedType(parent) => type_to_ref(
            &parent.type_annotation,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        ),
        TSType::TSTypeReference(reference) => {
            let name = slice_span(source, reference.type_name.span()).to_string();
            let lookup = reference_lookup_name(&name);
            let type_arguments = reference.type_arguments.as_ref().map(|inst| {
                inst.params
                    .iter()
                    .map(|t| {
                        type_to_ref(
                            t,
                            source,
                            import_bindings,
                            current_module_specifier,
                            current_library,
                        )
                    })
                    .collect::<Vec<_>>()
            });
            if lookup == "Array"
                && type_arguments
                    .as_ref()
                    .map_or(false, |a| a.len() == 1)
            {
                let element = type_arguments.as_ref().unwrap()[0].clone();
                TypeRef::Array {
                    element: Box::new(element),
                }
            } else {
                let source_module = reference_source_module(
                    &name,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                );
                TypeRef::Reference {
                    name,
                    target_id: None,
                    source_module,
                    type_arguments,
                }
            }
        }
        // Remaining TSType variants: explicit handling so nothing slips through.
        // Intrinsic keywords (TS 5.9+ bigint, symbol, never, void, intrinsic).
        TSType::TSBigIntKeyword(_) => TypeRef::Intrinsic {
            name: "bigint".to_string(),
        },
        TSType::TSSymbolKeyword(_) => TypeRef::Intrinsic {
            name: "symbol".to_string(),
        },
        TSType::TSNeverKeyword(_) => TypeRef::Intrinsic {
            name: "never".to_string(),
        },
        TSType::TSVoidKeyword(_) => TypeRef::Intrinsic {
            name: "void".to_string(),
        },
        TSType::TSIntrinsicKeyword(kw) => TypeRef::Intrinsic {
            name: slice_span(source, kw.span()).to_string(),
        },
        // Single named tuple member as type (e.g. in union): treat as one-element tuple.
        TSType::TSNamedTupleMember(named) => {
            let inner =
                tuple_element_to_tuple_element(
                    &named.element_type,
                    source,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                );
            TypeRef::Tuple {
                elements: vec![TupleElement {
                    label: Some(slice_span(source, named.label.span()).to_string()),
                    optional: named.optional,
                    rest: false,
                    element: inner.element,
                }],
            }
        }
        // Complex types we do not model: emit Unknown with source summary.
        TSType::TSConditionalType(_)
        | TSType::TSMappedType(_)
        | TSType::TSTemplateLiteralType(_)
        | TSType::TSImportType(_)
        | TSType::TSIndexedAccessType(_)
        | TSType::TSInferType(_)
        | TSType::TSConstructorType(_)
        | TSType::TSFunctionType(_)
        | TSType::TSTypeOperatorType(_)
        | TSType::TSTypePredicate(_)
        | TSType::TSTypeQuery(_)
        | TSType::TSThisType(_) => TypeRef::Unknown {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
        // JSDoc-only types: preserve source as Unknown.
        TSType::JSDocNullableType(_)
        | TSType::JSDocNonNullableType(_)
        | TSType::JSDocUnknownType(_) => TypeRef::Unknown {
            summary: slice_span(source, type_annotation.span()).to_string(),
        },
    }
}

fn expression_to_reference(
    expression: &oxc_ast::ast::Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> TypeRef {
    let name = slice_span(source, expression.span()).to_string();
    let source_module = reference_source_module(
        &name,
        import_bindings,
        current_module_specifier,
        current_library,
    );

    TypeRef::Reference {
        name,
        target_id: None,
        source_module,
        type_arguments: None,
    }
}

fn collect_references_from_members(
    members: &[TsMember],
    extends: &[TypeRef],
    underlying: Option<&TypeRef>,
    type_parameters: &[TsTypeParameter],
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
    for param in type_parameters {
        if let Some(ref c) = param.constraint {
            collect_type_ref_references(c, &mut references);
        }
        if let Some(ref d) = param.default {
            collect_type_ref_references(d, &mut references);
        }
    }
    references
}

fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => {
            references.push(type_ref.clone());
            for arg in args {
                collect_type_ref_references(arg, references);
            }
        }
        TypeRef::Reference { .. } => references.push(type_ref.clone()),
        TypeRef::Union { types } => {
            for nested in types {
                collect_type_ref_references(nested, references);
            }
        }
        TypeRef::Array { element } => collect_type_ref_references(element, references),
        TypeRef::Tuple { elements } => {
            for te in elements {
                collect_type_ref_references(&te.element, references);
            }
        }
        TypeRef::Intersection { types } => {
            for t in types {
                collect_type_ref_references(t, references);
            }
        }
        TypeRef::Object { members } => {
            for m in members {
                if let Some(ref tr) = m.type_ref {
                    collect_type_ref_references(tr, references);
                }
            }
        }
        _ => {}
    }
}

fn reference_source_module(
    reference_name: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Option<String> {
    let lookup_name = reference_lookup_name(reference_name);

    import_bindings
        .get(lookup_name)
        .map(|binding| binding.source_module.clone())
        .or_else(|| {
            if current_library == "user" {
                None
            } else {
                Some(current_module_specifier.to_string())
            }
        })
}

fn reference_lookup_name(reference_name: &str) -> &str {
    reference_name
        .split(['.', '<'])
        .next()
        .unwrap_or(reference_name)
}

fn property_key_name(key: &PropertyKey<'_>, source: &str) -> String {
    slice_span(source, key.span()).to_string()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}
