use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};

use globwalk::GlobWalkerBuilder;
use oxc_allocator::Allocator;
use oxc_ast::ast::{
    Declaration, ExportNamedDeclaration, ImportDeclarationSpecifier, ImportOrExportKind,
    PropertyKey, Statement, TSPropertySignature, TSSignature, TSType,
};
use oxc_parser::Parser;
use oxc_span::{GetSpan, SourceType, Span};

use super::model::{
    ExportMap, ScanRequest, ScannerDiagnostic, TsFile, TsMember, TsSymbol, TsSymbolKind, TypeRef,
    TypeScriptBundle,
};

#[derive(Debug, Clone)]
struct ParsedFile {
    file_id: String,
    module_specifier: String,
    source: String,
    import_bindings: BTreeMap<String, ImportBinding>,
    exports: Vec<SymbolShell>,
}

#[derive(Debug, Clone)]
struct ImportBinding {
    imported_name: String,
    source_module: String,
    target_file_id: Option<String>,
}

#[derive(Debug, Clone)]
struct SymbolShell {
    id: String,
    name: String,
    kind: TsSymbolKind,
    exported: bool,
    defined_members: Vec<TsMember>,
    extends: Vec<TypeRef>,
    underlying: Option<TypeRef>,
    references: Vec<TypeRef>,
}

pub fn scan_typescript_bundle(request: &ScanRequest) -> Result<TypeScriptBundle, String> {
    let file_ids = discover_file_ids(&request.root_dir, &request.include)?;
    let file_id_set: BTreeSet<_> = file_ids.iter().cloned().collect();
    let mut parsed_files = Vec::new();
    let mut diagnostics = Vec::new();

    for file_id in &file_ids {
        let absolute_path = request.root_dir.join(file_id);
        let source = fs::read_to_string(&absolute_path)
            .map_err(|err| format!("failed to read {}: {err}", absolute_path.display()))?;

        let parsed = parse_file(
            &request.root_dir,
            file_id,
            &source,
            &file_id_set,
            &mut diagnostics,
        )?;
        parsed_files.push(parsed);
    }

    let symbol_index = build_symbol_index(&parsed_files);
    let mut files = BTreeMap::new();
    let mut symbols = BTreeMap::new();
    let mut exports = BTreeMap::new();

    for parsed in parsed_files {
        let ParsedFile {
            file_id,
            module_specifier,
            source,
            import_bindings,
            exports: parsed_exports,
        } = parsed;

        files.insert(
            file_id.clone(),
            TsFile {
                path: file_id.clone(),
                module_specifier: module_specifier.clone(),
            },
        );

        let mut file_exports = ExportMap::new();
        let parsed_view = ParsedFile {
            file_id: file_id.clone(),
            module_specifier: module_specifier.clone(),
            source,
            import_bindings,
            exports: Vec::new(),
        };

        for symbol in parsed_exports {
            if symbol.exported {
                file_exports.insert(symbol.name.clone(), symbol.id.clone());
            }

            let resolved_symbol = resolve_symbol_references(symbol, &symbol_index, &parsed_view);
            symbols.insert(resolved_symbol.id.clone(), resolved_symbol);
        }

        if !file_exports.is_empty() {
            exports.insert(module_specifier, file_exports);
        }
    }

    Ok(TypeScriptBundle {
        version: 1,
        root_dir: ".".to_string(),
        entry_globs: request.include.clone(),
        files,
        symbols,
        exports,
        diagnostics,
    })
}

fn discover_file_ids(root_dir: &Path, include: &[String]) -> Result<Vec<String>, String> {
    let walker = GlobWalkerBuilder::from_patterns(root_dir, include)
        .follow_links(true)
        .build()
        .map_err(|err| format!("failed to build glob walker: {err}"))?;

    let mut file_ids = BTreeSet::new();
    for entry in walker {
        let entry = entry.map_err(|err| format!("failed to walk scan root: {err}"))?;
        if !entry.file_type().is_file() {
            continue;
        }

        let Some(extension) = entry.path().extension().and_then(|ext| ext.to_str()) else {
            continue;
        };
        if !matches!(extension, "ts" | "tsx") {
            continue;
        }

        let relative = entry
            .path()
            .strip_prefix(root_dir)
            .map_err(|err| format!("failed to normalize path {}: {err}", entry.path().display()))?;
        file_ids.insert(path_to_unix(relative));
    }

    Ok(file_ids.into_iter().collect())
}

fn parse_file(
    root_dir: &Path,
    file_id: &str,
    source: &str,
    file_id_set: &BTreeSet<String>,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> Result<ParsedFile, String> {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(file_id).unwrap_or_default();
    let parse_result = Parser::new(&allocator, source, source_type).parse();

    if !parse_result.errors.is_empty() {
        diagnostics.push(ScannerDiagnostic {
            file_id: file_id.to_string(),
            message: format!("parse reported {} error(s)", parse_result.errors.len()),
        });
    }

    let file_path = root_dir.join(file_id);
    let module_specifier = module_specifier_for_file_id(file_id);
    let mut import_bindings = BTreeMap::new();
    let mut exports = Vec::new();

    for statement in parse_result.program.body.iter() {
        match statement {
            Statement::ImportDeclaration(import) => {
                collect_import_bindings(file_id, import, source, file_id_set, &mut import_bindings);
            }
            Statement::ExportNamedDeclaration(export_decl) => {
                collect_exported_declaration(
                    file_id,
                    export_decl,
                    source,
                    &import_bindings,
                    &mut exports,
                );
            }
            _ => {}
        }
    }

    Ok(ParsedFile {
        file_id: path_to_unix(&file_path.strip_prefix(root_dir).unwrap_or(&file_path)),
        module_specifier,
        source: source.to_string(),
        import_bindings,
        exports,
    })
}

fn collect_import_bindings(
    current_file_id: &str,
    import: &oxc_ast::ast::ImportDeclaration<'_>,
    source: &str,
    file_id_set: &BTreeSet<String>,
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

fn build_symbol_index(parsed_files: &[ParsedFile]) -> BTreeMap<(String, String), String> {
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

fn resolve_symbol_references(
    mut symbol: SymbolShell,
    symbol_index: &BTreeMap<(String, String), String>,
    parsed: &ParsedFile,
) -> TsSymbol {
    symbol.extends = symbol
        .extends
        .into_iter()
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, parsed))
        .collect();
    symbol.underlying = symbol
        .underlying
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, parsed));
    symbol.defined_members = symbol
        .defined_members
        .into_iter()
        .map(|member| TsMember {
            type_ref: member
                .type_ref
                .map(|type_ref| resolve_type_ref(type_ref, symbol_index, parsed)),
            ..member
        })
        .collect();
    symbol.references = symbol
        .references
        .into_iter()
        .map(|type_ref| resolve_type_ref(type_ref, symbol_index, parsed))
        .collect();

    TsSymbol {
        id: symbol.id,
        name: symbol.name,
        kind: symbol.kind,
        file_id: parsed.file_id.clone(),
        exported: symbol.exported,
        defined_members: symbol.defined_members,
        extends: symbol.extends,
        underlying: symbol.underlying,
        references: symbol.references,
    }
}

fn resolve_type_ref(
    type_ref: TypeRef,
    symbol_index: &BTreeMap<(String, String), String>,
    parsed: &ParsedFile,
) -> TypeRef {
    match type_ref {
        TypeRef::Reference {
            name,
            target_id,
            source_module,
        } => {
            if target_id.is_some() {
                return TypeRef::Reference {
                    name,
                    target_id,
                    source_module,
                };
            }

            if let Some(binding) = parsed.import_bindings.get(&name) {
                if let Some(target_file_id) = &binding.target_file_id {
                    if let Some(target_id) =
                        symbol_index.get(&(target_file_id.clone(), binding.imported_name.clone()))
                    {
                        return TypeRef::Reference {
                            name,
                            target_id: Some(target_id.clone()),
                            source_module,
                        };
                    }
                }
            }

            if let Some(target_id) = symbol_index.get(&(parsed.file_id.clone(), name.clone())) {
                return TypeRef::Reference {
                    name,
                    target_id: Some(target_id.clone()),
                    source_module,
                };
            }

            TypeRef::Reference {
                name,
                target_id: None,
                source_module,
            }
        }
        TypeRef::Union { types } => TypeRef::Union {
            types: types
                .into_iter()
                .map(|nested| resolve_type_ref(nested, symbol_index, parsed))
                .collect(),
        },
        other => other,
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

fn resolve_local_import(
    current_file_id: &str,
    source_module: &str,
    file_id_set: &BTreeSet<String>,
) -> Option<String> {
    if !source_module.starts_with('.') {
        return None;
    }

    let current_path = Path::new(current_file_id);
    let base_dir = current_path.parent().unwrap_or_else(|| Path::new(""));
    let joined = normalize_relative_path(&base_dir.join(source_module));

    let candidates = [
        joined.clone(),
        joined.with_extension("ts"),
        joined.with_extension("tsx"),
        joined.join("index.ts"),
        joined.join("index.tsx"),
    ];

    for candidate in candidates {
        let file_id = path_to_unix(&candidate);
        if file_id_set.contains(&file_id) {
            return Some(file_id);
        }
    }

    None
}

fn normalize_relative_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

fn module_specifier_for_file_id(file_id: &str) -> String {
    let path = Path::new(file_id);
    let without_extension = path.with_extension("");
    let mut module = path_to_unix(&without_extension);
    if !module.starts_with("./") {
        module = format!("./{module}");
    }
    module
}

fn symbol_id(file_id: &str, name: &str) -> String {
    format!("sym:{}#{name}", file_id)
}

fn property_key_name(key: &PropertyKey<'_>, source: &str) -> String {
    slice_span(source, key.span()).to_string()
}

fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

fn path_to_unix(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}
