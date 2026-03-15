use std::collections::{BTreeMap, BTreeSet};
use std::fmt::Write;

use serde::Serialize;

use super::super::api::{TsMember, TsSymbol, TsSymbolKind, TypeRef, TypeScriptBundle};

#[allow(dead_code)]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeScriptEsmBundle {
    pub entrypoint: String,
    pub modules: BTreeMap<String, String>,
    pub type_declarations: BTreeMap<String, String>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize)]
struct SymbolRef {
    id: String,
    name: String,
    library: String,
}

#[allow(dead_code)]
pub fn emit_esm_bundle(bundle: &TypeScriptBundle) -> Result<TypeScriptEsmBundle, String> {
    let entrypoint = "./bundle.js".to_string();
    let export_names = build_symbol_export_names(bundle);
    let mut source = String::new();

    for (symbol_id, symbol) in &bundle.symbols {
        let export_name = export_names
            .get(symbol_id)
            .expect("symbol export name should exist");
        writeln!(
            source,
            "export const {export_name} = {};",
            emit_symbol_object(bundle, symbol, export_name, &export_names)?,
        )
        .expect("write to string should succeed");
        source.push('\n');
    }

    writeln!(
        source,
        "export const interfaces = {};",
        emit_symbol_refs_by_kind(bundle, &export_names, TsSymbolKind::Interface)?,
    )
    .expect("write to string should succeed");
    writeln!(
        source,
        "export const types = {};",
        emit_symbol_refs_by_kind(bundle, &export_names, TsSymbolKind::TypeAlias)?,
    )
    .expect("write to string should succeed");
    writeln!(
        source,
        "export const libraries = {};",
        emit_libraries(bundle)?
    )
    .expect("write to string should succeed");

    let mut modules = BTreeMap::new();
    modules.insert(entrypoint.clone(), source);

    Ok(TypeScriptEsmBundle {
        entrypoint,
        modules,
        type_declarations: BTreeMap::new(),
    })
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
    let mut parts = vec![
        format!("  name: {}", to_js_literal(&member.name)?),
        format!("  optional: {}", to_js_literal(&member.optional)?),
    ];
    if let Some(ref d) = member.description {
        parts.push(format!("  description: {}", to_js_literal(d)?));
    }
    parts.push(format!(
        "  type: {}",
        emit_optional_type_ref(bundle, member.type_ref.as_ref(), export_names)?
    ));
    Ok(format!("{{\n{}\n}}", parts.join(",\n")))
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
        TypeRef::Reference { .. } => {
            let reference = reference_descriptor(bundle, type_ref, export_names)
                .ok_or_else(|| "Failed to emit reference.".to_string())?;
            emit_ref_object(&reference)
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
        TypeRef::Unknown { summary } => Ok(format!(
            "{{\n  kind: \"unknown\",\n  summary: {},\n}}",
            to_js_literal(summary)?,
        )),
    }
}

fn emit_symbol_refs_by_kind(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
    kind: TsSymbolKind,
) -> Result<String, String> {
    let refs = bundle
        .symbols
        .iter()
        .filter(|(_, symbol)| symbol.kind == kind)
        .map(|(symbol_id, symbol)| SymbolRef {
            id: export_names
                .get(symbol_id)
                .expect("symbol export name should exist")
                .clone(),
            name: symbol.name.clone(),
            library: symbol.library.clone(),
        })
        .collect::<Vec<_>>();

    emit_ref_array(refs)
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

fn emit_libraries(bundle: &TypeScriptBundle) -> Result<String, String> {
    let mut libraries = BTreeSet::new();

    for symbol in bundle.symbols.values() {
        if symbol.library != "user" {
            libraries.insert(symbol.library.clone());
        }
        collect_libraries_from_type_refs(&symbol.extends, &mut libraries);
        collect_libraries_from_type_refs(&symbol.references, &mut libraries);

        if let Some(underlying) = &symbol.underlying {
            collect_libraries_from_type_ref(underlying, &mut libraries);
        }

        for member in &symbol.defined_members {
            if let Some(type_ref) = &member.type_ref {
                collect_libraries_from_type_ref(type_ref, &mut libraries);
            }
        }
    }

    let libraries = libraries.into_iter().collect::<Vec<_>>();
    emit_string_array(libraries.iter())
}

fn collect_libraries_from_type_refs(type_refs: &[TypeRef], libraries: &mut BTreeSet<String>) {
    for type_ref in type_refs {
        collect_libraries_from_type_ref(type_ref, libraries);
    }
}

fn collect_libraries_from_type_ref(type_ref: &TypeRef, libraries: &mut BTreeSet<String>) {
    match type_ref {
        TypeRef::Reference {
            source_module: Some(source_module),
            target_id: None,
            ..
        } if is_library_module(source_module) => {
            libraries.insert(source_module.clone());
        }
        TypeRef::Union { types } => {
            for nested in types {
                collect_libraries_from_type_ref(nested, libraries);
            }
        }
        _ => {}
    }
}

/// Deterministic hash for symbol IDs so the same id always gets the same export name.
fn stable_hash_symbol_id(symbol_id: &str) -> u64 {
    const FNV_OFFSET: u64 = 14695981039346656037;
    const FNV_PRIME: u64 = 1099511628211;
    symbol_id
        .bytes()
        .fold(FNV_OFFSET, |h, b| h.wrapping_mul(FNV_PRIME) ^ u64::from(b))
}

fn build_symbol_export_names(bundle: &TypeScriptBundle) -> BTreeMap<String, String> {
    bundle
        .symbols
        .keys()
        .map(|symbol_id| {
            let h = stable_hash_symbol_id(symbol_id);
            (symbol_id.clone(), format!("_{:016x}", h))
        })
        .collect()
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

fn emit_string_array<'a>(values: impl Iterator<Item = &'a String>) -> Result<String, String> {
    let values = values.collect::<Vec<_>>();
    if values.is_empty() {
        return Ok("[]".to_string());
    }

    let lines = values
        .into_iter()
        .map(|value| to_js_literal(value).map(|value| format!("  {value}")))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

fn is_library_module(source_module: &str) -> bool {
    !source_module.starts_with('.')
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
