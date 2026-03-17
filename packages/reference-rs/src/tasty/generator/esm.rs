use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;

use super::super::emitted::{TastyManifest, TastySymbolIndexEntry, TastySymbolKind};
use super::super::model::{
    FnParam, JsDoc, JsDocTag, TemplateLiteralPart, TsMember, TsMemberKind, TsSymbol,
    TsSymbolKind, TsTypeParameter, TupleElement, TypeRef, TypeScriptBundle,
};

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct TypeScriptEsmBundle {
    pub modules: BTreeMap<String, String>,
    pub type_declarations: BTreeMap<String, String>,
}

const MANIFEST_MODULE_PATH: &str = "./manifest.js";
const RUNTIME_MODULE_PATH: &str = "./runtime.js";
const CHUNK_REGISTRY_MODULE_PATH: &str = "./chunk-registry.js";
const MANIFEST_DECLARATION_PATH: &str = "./manifest.d.ts";
const RUNTIME_DECLARATION_PATH: &str = "./runtime.d.ts";

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize)]
struct SymbolRef {
    id: String,
    name: String,
    library: String,
}

#[allow(dead_code)]
pub fn emit_esm_bundle(bundle: &TypeScriptBundle) -> Result<TypeScriptEsmBundle, String> {
    let export_names = build_symbol_export_names(bundle)?;

    let mut modules = BTreeMap::new();
    modules.insert(
        MANIFEST_MODULE_PATH.to_string(),
        emit_manifest_module(bundle, &export_names)?,
    );
    modules.insert(
        RUNTIME_MODULE_PATH.to_string(),
        emit_runtime_module().to_string(),
    );
    modules.insert(
        CHUNK_REGISTRY_MODULE_PATH.to_string(),
        emit_chunk_registry_module(&export_names),
    );

    for (symbol_id, symbol) in &bundle.symbols {
        let export_name = export_names
            .get(symbol_id)
            .expect("symbol export name should exist");
        modules.insert(
            chunk_path_for_export_name(export_name),
            emit_chunk_module(bundle, symbol, export_name, &export_names)?,
        );
    }

    let mut type_declarations = BTreeMap::new();
    type_declarations.insert(
        MANIFEST_DECLARATION_PATH.to_string(),
        emit_manifest_declaration_module().to_string(),
    );
    type_declarations.insert(
        RUNTIME_DECLARATION_PATH.to_string(),
        emit_runtime_declaration_module().to_string(),
    );

    Ok(TypeScriptEsmBundle {
        modules,
        type_declarations,
    })
}

fn emit_runtime_module() -> &'static str {
    "import manifest from \"./manifest.js\";\nimport { tastyChunkLoaders } from \"./chunk-registry.js\";\n\nexport { manifest };\n\nexport const manifestUrl = new URL(\"./manifest.js\", import.meta.url).href;\n\nconst loadersBySpecifier = new Map();\nfor (const [specifier, loader] of Object.entries(tastyChunkLoaders)) {\n  loadersBySpecifier.set(specifier, loader);\n  try {\n    loadersBySpecifier.set(new URL(specifier, manifestUrl).href, loader);\n  } catch {\n    // Bundlers may inline the manifest into a data: URL, which cannot act as a base URL.\n  }\n}\n\nexport async function importTastyArtifact(specifier) {\n  const loader = loadersBySpecifier.get(specifier);\n  if (!loader) {\n    throw new Error(`Unknown Tasty artifact: ${specifier}`);\n  }\n  return loader();\n}\n"
}

fn emit_manifest_declaration_module() -> &'static str {
    "import type { RawTastyManifest } from \"@reference-ui/rust/tasty\";\n\ndeclare const manifest: RawTastyManifest;\n\nexport { manifest };\nexport default manifest;\n"
}

fn emit_runtime_declaration_module() -> &'static str {
    "import type { RawTastyManifest } from \"@reference-ui/rust/tasty\";\n\nexport declare const manifest: RawTastyManifest;\nexport declare const manifestUrl: string;\n\nexport declare function importTastyArtifact(specifier: string): Promise<unknown>;\n"
}

fn emit_chunk_registry_module(export_names: &BTreeMap<String, String>) -> String {
    let entries = export_names
        .values()
        .map(|export_name| chunk_path_for_export_name(export_name))
        .map(|chunk_path| {
            format!(
                "  {}: () => import({}),",
                to_js_literal(&chunk_path).expect("chunk path should serialize"),
                to_js_literal(&chunk_path).expect("chunk path should serialize")
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    format!("export const tastyChunkLoaders = {{\n{entries}\n}};\n")
}

fn emit_manifest_module(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut symbols_by_name = BTreeMap::new();
    let mut symbols_by_id = BTreeMap::new();
    let mut warnings = bundle
        .diagnostics
        .iter()
        .map(|diagnostic| format!("{}: {}", diagnostic.file_id, diagnostic.message))
        .collect::<Vec<_>>();

    for (symbol_id, symbol) in &bundle.symbols {
        let export_name = export_names
            .get(symbol_id)
            .expect("symbol export name should exist")
            .clone();
        symbols_by_name
            .entry(symbol.name.clone())
            .or_insert_with(Vec::new)
            .push(export_name.clone());
        symbols_by_id.insert(
            export_name.clone(),
            TastySymbolIndexEntry {
                id: export_name.clone(),
                name: symbol.name.clone(),
                kind: emitted_symbol_kind(symbol.kind.clone()),
                chunk: chunk_path_for_export_name(&export_name),
                library: symbol.library.clone(),
            },
        );
    }

    for (symbol_name, symbol_ids) in &symbols_by_name {
        if symbol_ids.len() <= 1 {
            continue;
        }
        let matches = symbol_ids
            .iter()
            .filter_map(|symbol_id| {
                symbols_by_id
                    .get(symbol_id)
                    .map(|entry| format!("{} ({})", entry.id, entry.library))
            })
            .collect::<Vec<_>>()
            .join(", ");
        warnings.push(format!(
            "Duplicate symbol name \"{symbol_name}\" matched {} entries: {matches}. Use symbol id or scoped lookup to disambiguate.",
            symbol_ids.len()
        ));
    }

    let manifest = TastyManifest {
        version: "2".to_string(),
        warnings,
        symbols_by_name,
        symbols_by_id,
    };
    let literal = to_js_literal(&manifest)?;

    Ok(format!("export const manifest = {literal};\nexport default manifest;\n"))
}

fn emit_chunk_module(
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_name: &str,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let symbol_source = emit_symbol_object(bundle, symbol, export_name, export_names)?;
    Ok(format!(
        "const symbol = {symbol_source};\nexport {{ symbol as {export_name} }};\nexport default symbol;\n"
    ))
}

fn emit_symbol_object(
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_name: &str,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut fields = vec![
        format!("  id: {},", to_js_literal(export_name)?),
        format!("  name: {},", to_js_literal(&symbol.name)?),
        format!("  library: {},", to_js_literal(&symbol.library)?),
    ];
    if let Some(ref d) = symbol.description {
        fields.push(format!("  description: {},", to_js_literal(d)?));
    }
    if let Some(ref d) = symbol.description_raw {
        fields.push(format!("  descriptionRaw: {},", to_js_literal(d)?));
    }
    if let Some(ref jsdoc) = symbol.jsdoc {
        fields.push(format!("  jsdoc: {},", emit_jsdoc(bundle, jsdoc, export_names)?));
    }
    if !symbol.type_parameters.is_empty() {
        fields.push(format!(
            "  typeParameters: {},",
            emit_type_parameters(bundle, &symbol.type_parameters, export_names)?
        ));
    }

    match symbol.kind {
        TsSymbolKind::Interface => {
            fields.push(format!(
                "  members: {},",
                emit_members(bundle, &symbol.defined_members, export_names)?
            ));
            fields.push(format!(
                "  extends: {},",
                emit_ref_array(reference_descriptors_from_type_refs(
                    bundle,
                    &symbol.extends,
                    export_names,
                ))?
            ));
            fields.push(format!(
                "  types: {},",
                emit_ref_array(supporting_type_descriptors(bundle, symbol, export_names))?
            ));
        }
        TsSymbolKind::TypeAlias => {
            fields.push(format!(
                "  definition: {},",
                emit_optional_type_ref(bundle, symbol.underlying.as_ref(), export_names)?
            ));
        }
    }

    Ok(format!("{{\n{}\n}}", fields.join("\n")))
}

fn emit_type_parameters(
    bundle: &TypeScriptBundle,
    params: &[TsTypeParameter],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    if params.is_empty() {
        return Ok("[]".to_string());
    }
    let lines = params
        .iter()
        .map(|p| {
            let mut parts = vec![format!("  name: {}", to_js_literal(&p.name)?)];
            if let Some(ref c) = p.constraint {
                let constraint_str = emit_type_ref(bundle, c, export_names)?;
                parts.push(format!("  constraint: {}", indent_block(&constraint_str, 2)));
            }
            if let Some(ref d) = p.default {
                let default_str = emit_type_ref(bundle, d, export_names)?;
                parts.push(format!("  default: {}", indent_block(&default_str, 2)));
            }
            Ok::<String, String>(indent_block(&format!("{{\n{}\n}}", parts.join(",\n")), 2))
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_members(
    bundle: &TypeScriptBundle,
    members: &[TsMember],
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    if members.is_empty() {
        return Ok("[]".to_string());
    }

    let lines = members
        .iter()
        .map(|member| {
            emit_member(bundle, member, export_names).map(|value| indent_block(&value, 2))
        })
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_member(
    bundle: &TypeScriptBundle,
    member: &TsMember,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let kind_str = match member.kind {
        TsMemberKind::Property => "property",
        TsMemberKind::Method => "method",
        TsMemberKind::CallSignature => "call",
        TsMemberKind::IndexSignature => "index",
        TsMemberKind::ConstructSignature => "construct",
    };
    let mut parts = vec![
        format!("  name: {}", to_js_literal(&member.name)?),
        format!("  optional: {}", to_js_literal(&member.optional)?),
        format!("  readonly: {}", to_js_literal(&member.readonly)?),
        format!("  kind: {}", to_js_literal(kind_str)?),
    ];
    if let Some(ref d) = member.description {
        parts.push(format!("  description: {}", to_js_literal(d)?));
    }
    if let Some(ref d) = member.description_raw {
        parts.push(format!("  descriptionRaw: {}", to_js_literal(d)?));
    }
    if let Some(ref jsdoc) = member.jsdoc {
        parts.push(format!("  jsdoc: {}", emit_jsdoc(bundle, jsdoc, export_names)?));
    }
    parts.push(format!(
        "  type: {}",
        emit_optional_type_ref(bundle, member.type_ref.as_ref(), export_names)?
    ));
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

fn emit_jsdoc(
    _bundle: &TypeScriptBundle,
    jsdoc: &JsDoc,
    _export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut parts = Vec::new();
    if let Some(ref summary) = jsdoc.summary {
        parts.push(format!("  summary: {}", to_js_literal(summary)?));
    }
    parts.push(format!("  tags: {}", emit_jsdoc_tags(&jsdoc.tags)?));
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

fn emit_jsdoc_tags(tags: &[JsDocTag]) -> Result<String, String> {
    if tags.is_empty() {
        return Ok("[]".to_string());
    }
    let lines = tags
        .iter()
        .map(|tag| {
            let mut parts = vec![format!("  name: {}", to_js_literal(&tag.name)?)];
            if let Some(ref value) = tag.value {
                parts.push(format!("  value: {}", to_js_literal(value)?));
            }
            Ok::<String, String>(indent_block(&format!("{{\n{}\n}}", parts.join(",\n")), 2))
        })
        .collect::<Result<Vec<_>, _>>()?;
    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_tuple_element(
    bundle: &TypeScriptBundle,
    te: &TupleElement,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let mut parts = vec![
        format!("  optional: {}", to_js_literal(&te.optional)?),
        format!("  rest: {}", to_js_literal(&te.rest)?),
        format!(
            "  element: {}",
            indent_block(&emit_type_ref(bundle, &te.element, export_names)?, 2)
        ),
    ];
    if let Some(ref label) = te.label {
        parts.insert(0, format!("  label: {}", to_js_literal(label)?));
    }
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
}

fn emit_fn_param(
    bundle: &TypeScriptBundle,
    p: &FnParam,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let name_str = match &p.name {
        Some(n) => to_js_literal(n)?,
        None => "null".to_string(),
    };
    let type_ref_str = emit_optional_type_ref(bundle, p.type_ref.as_ref(), export_names)?;
    Ok(format!(
        "{{\n  name: {},\n  optional: {},\n  typeRef: {},\n}}",
        name_str,
        to_js_literal(&p.optional)?,
        indent_block(&type_ref_str, 2)
    ))
}

fn emit_optional_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: Option<&TypeRef>,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        Some(type_ref) => emit_type_ref(bundle, type_ref, export_names),
        None => Ok("null".to_string()),
    }
}

fn emit_template_literal_part(
    bundle: &TypeScriptBundle,
    part: &TemplateLiteralPart,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match part {
        TemplateLiteralPart::Text { value } => Ok(format!(
            "{{\n  kind: \"text\",\n  value: {},\n}}",
            to_js_literal(value)?,
        )),
        TemplateLiteralPart::Type { value } => Ok(format!(
            "{{\n  kind: \"type\",\n  value: {},\n}}",
            indent_block(&emit_type_ref(bundle, value, export_names)?, 2)
        )),
    }
}

fn emit_type_ref(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    match type_ref {
        TypeRef::Intrinsic { name } => Ok(format!(
            "{{\n  kind: \"intrinsic\",\n  name: {},\n}}",
            to_js_literal(name)?,
        )),
        TypeRef::Literal { value } => Ok(format!(
            "{{\n  kind: \"literal\",\n  value: {},\n}}",
            to_js_literal(value)?,
        )),
        TypeRef::Reference {
            type_arguments: Some(args),
            ..
        } => {
            let reference = reference_descriptor(bundle, type_ref, export_names)
                .ok_or_else(|| "Failed to emit reference.".to_string())?;
            let args_lines: Vec<_> = args
                .iter()
                .map(|t| {
                    emit_type_ref(bundle, t, export_names).map(|s| indent_block(&s, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  id: {},\n  name: {},\n  library: {},\n  typeArguments: [\n{}\n  ],\n}}",
                to_js_literal(&reference.id)?,
                to_js_literal(&reference.name)?,
                to_js_literal(&reference.library)?,
                args_lines.join(",\n")
            ))
        }
        TypeRef::Reference { .. } => {
            let reference = reference_descriptor(bundle, type_ref, export_names)
                .ok_or_else(|| "Failed to emit reference.".to_string())?;
            emit_ref_object(&reference)
        }
        TypeRef::Object { members } => {
            let lines = members
                .iter()
                .map(|m| {
                    emit_member(bundle, m, export_names).map(|s| indent_block(&s, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"object\",\n  members: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Union { types } => {
            let lines = types
                .iter()
                .map(|nested| {
                    emit_type_ref(bundle, nested, export_names).map(|value| indent_block(&value, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;

            Ok(format!(
                "{{\n  kind: \"union\",\n  types: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Array { element } => {
            let inner = emit_type_ref(bundle, element, export_names)?;
            Ok(format!(
                "{{\n  kind: \"array\",\n  element: {},\n}}",
                indent_block(&inner, 2)
            ))
        }
        TypeRef::Tuple { elements } => {
            let lines = elements
                .iter()
                .map(|te| emit_tuple_element(bundle, te, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"tuple\",\n  elements: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Intersection { types } => {
            let lines = types
                .iter()
                .map(|t| {
                    emit_type_ref(bundle, t, export_names).map(|s| indent_block(&s, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"intersection\",\n  types: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::IndexedAccess { object, index } => {
            let object_str = emit_type_ref(bundle, object, export_names)?;
            let index_str = emit_type_ref(bundle, index, export_names)?;
            Ok(format!(
                "{{\n  kind: \"indexed_access\",\n  object: {},\n  index: {},\n}}",
                indent_block(&object_str, 2),
                indent_block(&index_str, 2)
            ))
        }
        TypeRef::Function { params, return_type } => {
            let param_lines: Vec<_> = params
                .iter()
                .map(|p| emit_fn_param(bundle, p, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            let return_str = emit_type_ref(bundle, return_type, export_names)?;
            Ok(format!(
                "{{\n  kind: \"function\",\n  params: [\n{}\n  ],\n  returnType: {},\n}}",
                param_lines
                    .iter()
                    .map(|s| indent_block(s, 2))
                    .collect::<Vec<_>>()
                    .join(",\n"),
                indent_block(&return_str, 2)
            ))
        }
        TypeRef::Constructor {
            r#abstract,
            type_parameters,
            params,
            return_type,
        } => {
            let param_lines: Vec<_> = params
                .iter()
                .map(|p| emit_fn_param(bundle, p, export_names))
                .collect::<Result<Vec<_>, _>>()?;
            let return_str = emit_type_ref(bundle, return_type, export_names)?;
            let mut parts = vec![
                "  kind: \"constructor\"".to_string(),
                format!("  abstract: {}", to_js_literal(r#abstract)?),
                format!(
                    "  params: [\n{}\n  ]",
                    param_lines
                        .iter()
                        .map(|s| indent_block(s, 2))
                        .collect::<Vec<_>>()
                        .join(",\n")
                ),
                format!("  returnType: {}", indent_block(&return_str, 2)),
            ];
            if !type_parameters.is_empty() {
                parts.insert(
                    2,
                    format!(
                        "  typeParameters: {}",
                        indent_block(&emit_type_parameters(bundle, type_parameters, export_names)?, 2)
                    ),
                );
            }
            Ok(format!("{{\n{}\n}}", parts.join(",\n")))
        }
        TypeRef::TypeOperator { operator, target } => {
            let target_str = emit_type_ref(bundle, target, export_names)?;
            Ok(format!(
                "{{\n  kind: \"type_operator\",\n  operator: {},\n  target: {},\n}}",
                to_js_literal(operator.as_str())?,
                indent_block(&target_str, 2)
            ))
        }
        TypeRef::TypeQuery { expression } => Ok(format!(
            "{{\n  kind: \"type_query\",\n  expression: {},\n}}",
            to_js_literal(expression)?,
        )),
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => Ok(format!(
            "{{\n  kind: \"conditional\",\n  checkType: {},\n  extendsType: {},\n  trueType: {},\n  falseType: {},\n}}",
            indent_block(&emit_type_ref(bundle, check_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, extends_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, true_type, export_names)?, 2),
            indent_block(&emit_type_ref(bundle, false_type, export_names)?, 2)
        )),
        TypeRef::Mapped {
            type_param,
            source_type,
            name_type,
            optional_modifier,
            readonly_modifier,
            value_type,
        } => {
            let mut parts = vec![
                format!("  kind: {}", to_js_literal("mapped")?),
                format!("  typeParam: {}", to_js_literal(type_param)?),
                format!(
                    "  sourceType: {}",
                    indent_block(&emit_type_ref(bundle, source_type, export_names)?, 2)
                ),
                format!("  optionalModifier: {}", to_js_literal(optional_modifier.as_str())?),
                format!("  readonlyModifier: {}", to_js_literal(readonly_modifier.as_str())?),
            ];
            if let Some(name_type) = name_type {
                parts.push(format!(
                    "  nameType: {}",
                    indent_block(&emit_type_ref(bundle, name_type, export_names)?, 2)
                ));
            }
            let value_type_str = match value_type {
                Some(value_type) => emit_type_ref(bundle, value_type, export_names)?,
                None => "null".to_string(),
            };
            parts.push(format!("  valueType: {}", indent_block(&value_type_str, 2)));
            Ok(format!("{{\n{}\n}}", parts.join(",\n")))
        }
        TypeRef::TemplateLiteral { parts } => {
            let lines = parts
                .iter()
                .map(|part| {
                    emit_template_literal_part(bundle, part, export_names)
                        .map(|value| indent_block(&value, 2))
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(format!(
                "{{\n  kind: \"template_literal\",\n  parts: [\n{}\n  ],\n}}",
                lines.join(",\n")
            ))
        }
        TypeRef::Raw { summary } => Ok(format!(
            "{{\n  kind: \"raw\",\n  summary: {},\n}}",
            to_js_literal(summary)?,
        )),
    }
}

fn supporting_type_descriptors(
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Vec<SymbolRef> {
    symbol
        .references
        .iter()
        .filter(|type_ref| local_target_is_type_alias(bundle, type_ref))
        .filter_map(|type_ref| reference_descriptor(bundle, type_ref, export_names))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn local_target_is_type_alias(bundle: &TypeScriptBundle, type_ref: &TypeRef) -> bool {
    let TypeRef::Reference {
        target_id: Some(target_id),
        ..
    } = type_ref
    else {
        return false;
    };

    matches!(
        bundle.symbols.get(target_id).map(|symbol| &symbol.kind),
        Some(TsSymbolKind::TypeAlias)
    )
}

fn reference_descriptors_from_type_refs(
    bundle: &TypeScriptBundle,
    type_refs: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Vec<SymbolRef> {
    type_refs
        .iter()
        .filter_map(|type_ref| reference_descriptor(bundle, type_ref, export_names))
        .collect()
}

fn reference_descriptor(
    bundle: &TypeScriptBundle,
    type_ref: &TypeRef,
    export_names: &BTreeMap<String, String>,
) -> Option<SymbolRef> {
    let TypeRef::Reference {
        name,
        target_id,
        source_module,
        type_arguments: _,
    } = type_ref
    else {
        return None;
    };

    if let Some(target_id) = target_id {
        let target_symbol = bundle.symbols.get(target_id)?;
        return Some(SymbolRef {
            id: export_names.get(target_id)?.clone(),
            name: target_symbol.name.clone(),
            library: target_symbol.library.clone(),
        });
    }

    Some(SymbolRef {
        id: name.to_string(),
        name: name.to_string(),
        library: source_module.clone().unwrap_or_else(|| "user".to_string()),
    })
}

/// Deterministic hash for symbol IDs so the same id always gets the same export name.
fn stable_hash_symbol_id(symbol_id: &str) -> u64 {
    const FNV_OFFSET: u64 = 14695981039346656037;
    const FNV_PRIME: u64 = 1099511628211;
    symbol_id
        .bytes()
        .fold(FNV_OFFSET, |h, b| h.wrapping_mul(FNV_PRIME) ^ u64::from(b))
}

fn emitted_symbol_kind(kind: TsSymbolKind) -> TastySymbolKind {
    match kind {
        TsSymbolKind::Interface => TastySymbolKind::Interface,
        TsSymbolKind::TypeAlias => TastySymbolKind::TypeAlias,
    }
}

fn chunk_path_for_export_name(export_name: &str) -> String {
    format!("./chunks/{export_name}.js")
}

fn build_symbol_export_names(bundle: &TypeScriptBundle) -> Result<BTreeMap<String, String>, String> {
    build_symbol_export_names_with(bundle, stable_hash_symbol_id)
}

fn build_symbol_export_names_with<F>(
    bundle: &TypeScriptBundle,
    hash_symbol_id: F,
) -> Result<BTreeMap<String, String>, String>
where
    F: Fn(&str) -> u64,
{
    let mut export_names = BTreeMap::new();
    let mut symbol_ids_by_export_name = BTreeMap::new();

    for symbol_id in bundle.symbols.keys() {
        let export_name = format!("_{:016x}", hash_symbol_id(symbol_id));
        if let Some(existing_symbol_id) =
            symbol_ids_by_export_name.insert(export_name.clone(), symbol_id.clone())
        {
            return Err(format!(
                "Tasty emitted-id collision between \"{existing_symbol_id}\" and \"{symbol_id}\" for export name \"{export_name}\"."
            ));
        }
        export_names.insert(symbol_id.clone(), export_name);
    }

    Ok(export_names)
}

fn emit_ref_array(refs: Vec<SymbolRef>) -> Result<String, String> {
    if refs.is_empty() {
        return Ok("[]".to_string());
    }

    let lines = refs
        .iter()
        .map(|reference| emit_ref_object(reference).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn emit_ref_object(reference: &SymbolRef) -> Result<String, String> {
    Ok(format!(
        "{{\n  id: {},\n  name: {},\n  library: {},\n}}",
        to_js_literal(&reference.id)?,
        to_js_literal(&reference.name)?,
        to_js_literal(&reference.library)?,
    ))
}

fn to_js_literal<T: Serialize + ?Sized>(value: &T) -> Result<String, String> {
    serde_json::to_string(value).map_err(|error| format!("Failed to serialize ESM value: {error}"))
}

fn indent_block(value: &str, spaces: usize) -> String {
    let indent = " ".repeat(spaces);
    value
        .lines()
        .map(|line| format!("{indent}{line}"))
        .collect::<Vec<_>>()
        .join("\n")
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::build_symbol_export_names_with;
    use crate::tasty::model::{TsSymbol, TsSymbolKind, TypeScriptBundle};

    #[test]
    fn build_symbol_export_names_rejects_hash_collisions() {
        let mut symbols = BTreeMap::new();
        symbols.insert(
            "symbol-a".to_string(),
            TsSymbol {
                id: "symbol-a".to_string(),
                name: "Shared".to_string(),
                library: "user".to_string(),
                kind: TsSymbolKind::Interface,
                file_id: "a.ts".to_string(),
                exported: true,
                description: None,
                description_raw: None,
                jsdoc: None,
                type_parameters: Vec::new(),
                defined_members: Vec::new(),
                extends: Vec::new(),
                underlying: None,
                references: Vec::new(),
            },
        );
        symbols.insert(
            "symbol-b".to_string(),
            TsSymbol {
                id: "symbol-b".to_string(),
                name: "Shared".to_string(),
                library: "user".to_string(),
                kind: TsSymbolKind::TypeAlias,
                file_id: "b.ts".to_string(),
                exported: true,
                description: None,
                description_raw: None,
                jsdoc: None,
                type_parameters: Vec::new(),
                defined_members: Vec::new(),
                extends: Vec::new(),
                underlying: None,
                references: Vec::new(),
            },
        );

        let bundle = TypeScriptBundle {
            version: 1,
            root_dir: ".".to_string(),
            entry_globs: Vec::new(),
            files: BTreeMap::new(),
            symbols,
            exports: BTreeMap::new(),
            diagnostics: Vec::new(),
        };

        let error = build_symbol_export_names_with(&bundle, |_symbol_id| 7)
            .expect_err("hash collision should be rejected");

        assert!(error.contains("Tasty emitted-id collision"));
    }
}
