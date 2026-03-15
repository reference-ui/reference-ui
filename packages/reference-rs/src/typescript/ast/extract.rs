use std::collections::BTreeMap;

use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Comment, Declaration, ExportNamedDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    PropertyKey, Statement, TSInterfaceDeclaration, TSPropertySignature, TSSignature, TSType,
    TSTypeAliasDeclaration,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use super::super::api::{ScannerDiagnostic, TsMember, TsSymbolKind, TypeRef};
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
    let property_spans: Vec<u32> = interface_decl
        .body
        .body
        .iter()
        .filter_map(|sig| match sig {
            TSSignature::TSPropertySignature(p) => Some(p.span().start),
            _ => None,
        })
        .collect();
    let defined_members = interface_decl
        .body
        .body
        .iter()
        .filter_map(|signature| match signature {
            TSSignature::TSPropertySignature(property) => {
                let others: Vec<u32> = property_spans
                    .iter()
                    .copied()
                    .filter(|&s| s != property.span().start)
                    .collect();
                let exclude = if others.is_empty() {
                    None
                } else {
                    Some(others.as_slice())
                };
                Some(property_signature_to_member(
                    property,
                    source,
                    comments,
                    exclude,
                    import_bindings,
                    current_module_specifier,
                    current_library,
                ))
            }
            _ => None,
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

    let references = collect_references_from_members(&defined_members, &extends, None);

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::Interface,
        exported,
        description,
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
    let underlying = Some(type_to_ref(
        &type_alias.type_annotation,
        source,
        import_bindings,
        _current_module_specifier,
        current_library,
    ));
    let references = collect_references_from_members(&[], &[], underlying.as_ref());

    exports.push(SymbolShell {
        id,
        name,
        kind: TsSymbolKind::TypeAlias,
        exported,
        description,
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
        description,
        type_ref,
    }
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
        TSType::TSTypeReference(reference) => {
            let name = slice_span(source, reference.type_name.span()).to_string();
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
