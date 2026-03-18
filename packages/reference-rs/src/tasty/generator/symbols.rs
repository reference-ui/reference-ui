use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;

use super::types::{
    emit_jsdoc, emit_members, emit_optional_type_ref, emit_type_parameters,
};
use super::util::{indent_block, to_js_literal};
use super::super::model::{TsSymbol, TsSymbolKind, TypeRef, TypeScriptBundle};

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize)]
pub(super) struct SymbolRef {
    pub(super) id: String,
    pub(super) name: String,
    pub(super) library: String,
}

pub(super) fn emit_chunk_module(
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
        fields.push(format!("  jsdoc: {},", emit_jsdoc(jsdoc)?));
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

pub(super) fn reference_descriptors_from_type_refs(
    bundle: &TypeScriptBundle,
    type_refs: &[TypeRef],
    export_names: &BTreeMap<String, String>,
) -> Vec<SymbolRef> {
    type_refs
        .iter()
        .filter_map(|type_ref| reference_descriptor(bundle, type_ref, export_names))
        .collect()
}

pub(super) fn reference_descriptor(
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

pub(super) fn emit_ref_array(refs: Vec<SymbolRef>) -> Result<String, String> {
    if refs.is_empty() {
        return Ok("[]".to_string());
    }

    let lines = refs
        .iter()
        .map(|reference| emit_ref_object(reference).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(format!("[\n{}\n]", lines.join(",\n")))
}

pub(super) fn emit_ref_object(reference: &SymbolRef) -> Result<String, String> {
    Ok(format!(
        "{{\n  id: {},\n  name: {},\n  library: {},\n}}",
        to_js_literal(&reference.id)?,
        to_js_literal(&reference.name)?,
        to_js_literal(&reference.library)?,
    ))
}
