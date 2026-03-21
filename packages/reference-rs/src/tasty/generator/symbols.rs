use std::collections::{BTreeMap, BTreeSet};

use serde::Serialize;

use crate::tasty::constants::libraries::USER_LIBRARY_NAME;

use super::super::model::{TsSymbol, TsSymbolKind, TypeRef, TypeScriptBundle};
use super::types::{emit_jsdoc, emit_members, emit_optional_type_ref, emit_type_parameters};
use super::util::{emit_array, emit_field, emit_object, indent_block, to_js_literal};

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
        emit_field("id", to_js_literal(export_name)?),
        emit_field("name", to_js_literal(&symbol.name)?),
        emit_field("library", to_js_literal(&symbol.library)?),
    ];

    push_symbol_metadata_fields(&mut fields, bundle, symbol, export_names)?;

    match symbol.kind {
        TsSymbolKind::Interface => {
            push_interface_fields(&mut fields, bundle, symbol, export_names)?
        }
        TsSymbolKind::TypeAlias => {
            push_type_alias_fields(&mut fields, bundle, symbol, export_names)?
        }
    }

    Ok(emit_object(fields))
}

fn supporting_type_descriptors(
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Vec<SymbolRef> {
    collect_reference_descriptors(bundle, symbol.references.iter(), export_names, |type_ref| {
        local_target_is_type_alias(bundle, type_ref)
    })
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
    collect_reference_descriptors(bundle, type_refs.iter(), export_names, |_| true)
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
        return local_reference_descriptor(bundle, target_id, export_names);
    }

    Some(external_reference_descriptor(
        name,
        source_module.as_deref(),
    ))
}

pub(super) fn emit_ref_array(refs: Vec<SymbolRef>) -> Result<String, String> {
    let refs = refs
        .iter()
        .map(|reference| emit_ref_object(reference).map(|value| indent_block(&value, 2)))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(emit_array(refs))
}

pub(super) fn emit_ref_object(reference: &SymbolRef) -> Result<String, String> {
    Ok(emit_object(symbol_ref_fields(reference)?))
}

fn push_symbol_metadata_fields(
    fields: &mut Vec<String>,
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    push_optional_string_field(fields, "description", symbol.description.as_ref())?;
    push_optional_string_field(fields, "descriptionRaw", symbol.description_raw.as_ref())?;
    push_optional_jsdoc_field(fields, symbol.jsdoc.as_ref())?;
    push_type_parameters_field(fields, bundle, symbol, export_names)?;

    Ok(())
}

fn push_optional_string_field(
    fields: &mut Vec<String>,
    name: &str,
    value: Option<&String>,
) -> Result<(), String> {
    if let Some(value) = value {
        fields.push(emit_field(name, to_js_literal(value)?));
    }

    Ok(())
}

fn push_optional_jsdoc_field(
    fields: &mut Vec<String>,
    jsdoc: Option<&super::super::model::JsDoc>,
) -> Result<(), String> {
    if let Some(jsdoc) = jsdoc {
        fields.push(emit_field("jsdoc", emit_jsdoc(jsdoc)?));
    }

    Ok(())
}

fn push_type_parameters_field(
    fields: &mut Vec<String>,
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    if !symbol.type_parameters.is_empty() {
        fields.push(emit_field(
            "typeParameters",
            emit_type_parameters(bundle, &symbol.type_parameters, export_names)?,
        ));
    }

    Ok(())
}

fn push_interface_fields(
    fields: &mut Vec<String>,
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    fields.push(emit_field(
        "members",
        emit_members(bundle, &symbol.defined_members, export_names)?,
    ));
    fields.push(emit_field(
        "extends",
        emit_ref_array(reference_descriptors_from_type_refs(
            bundle,
            &symbol.extends,
            export_names,
        ))?,
    ));
    fields.push(emit_field(
        "types",
        emit_ref_array(supporting_type_descriptors(bundle, symbol, export_names))?,
    ));

    Ok(())
}

fn push_type_alias_fields(
    fields: &mut Vec<String>,
    bundle: &TypeScriptBundle,
    symbol: &TsSymbol,
    export_names: &BTreeMap<String, String>,
) -> Result<(), String> {
    fields.push(emit_field(
        "definition",
        emit_optional_type_ref(bundle, symbol.underlying.as_ref(), export_names)?,
    ));

    Ok(())
}

fn collect_reference_descriptors<'a>(
    bundle: &TypeScriptBundle,
    type_refs: impl Iterator<Item = &'a TypeRef>,
    export_names: &BTreeMap<String, String>,
    mut predicate: impl FnMut(&TypeRef) -> bool,
) -> Vec<SymbolRef> {
    type_refs
        .filter(|type_ref| predicate(type_ref))
        .filter_map(|type_ref| reference_descriptor(bundle, type_ref, export_names))
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect()
}

fn local_reference_descriptor(
    bundle: &TypeScriptBundle,
    target_id: &str,
    export_names: &BTreeMap<String, String>,
) -> Option<SymbolRef> {
    let target_symbol = bundle.symbols.get(target_id)?;

    Some(SymbolRef {
        id: export_names.get(target_id)?.clone(),
        name: target_symbol.name.clone(),
        library: target_symbol.library.clone(),
    })
}

fn external_reference_descriptor(name: &str, source_module: Option<&str>) -> SymbolRef {
    SymbolRef {
        id: name.to_string(),
        name: name.to_string(),
        library: source_module.unwrap_or(USER_LIBRARY_NAME).to_string(),
    }
}

pub(super) fn symbol_ref_fields(reference: &SymbolRef) -> Result<Vec<String>, String> {
    Ok(vec![
        emit_field("id", to_js_literal(&reference.id)?),
        emit_field("name", to_js_literal(&reference.name)?),
        emit_field("library", to_js_literal(&reference.library)?),
    ])
}
