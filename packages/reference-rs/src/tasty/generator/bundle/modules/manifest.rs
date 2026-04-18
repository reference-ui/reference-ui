use std::collections::BTreeMap;

use super::chunk_path_for_export_name;
use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
use crate::tasty::emitted::{TastyManifest, TastySymbolIndexEntry, TastySymbolKind};
use crate::tasty::generator::util::to_js_literal;
use crate::tasty::model::{TsSymbolKind, TypeScriptBundle};

pub(crate) fn emit_manifest_module(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> Result<String, String> {
    let (symbols_by_name, symbols_by_id) = build_manifest_symbol_indices(bundle, export_names);
    let mut warnings = bundle
        .diagnostics
        .iter()
        .map(|diagnostic| format!("{}: {}", diagnostic.file_id, diagnostic.message))
        .collect::<Vec<_>>();
    warnings.extend(duplicate_symbol_name_warnings(
        bundle,
        export_names,
        &symbols_by_name,
        &symbols_by_id,
    ));

    let manifest = TastyManifest {
        version: "2".to_string(),
        warnings,
        symbols_by_name,
        symbols_by_id,
    };
    let literal = to_js_literal(&manifest)?;

    Ok(format!(
        "export const manifest = {literal};\nexport default manifest;\n"
    ))
}

fn build_manifest_symbol_indices(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
) -> (
    BTreeMap<String, Vec<String>>,
    BTreeMap<String, TastySymbolIndexEntry>,
) {
    let mut symbols_by_name = BTreeMap::new();
    let mut symbols_by_id = BTreeMap::new();

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

    (symbols_by_name, symbols_by_id)
}

fn duplicate_symbol_name_warnings(
    bundle: &TypeScriptBundle,
    export_names: &BTreeMap<String, String>,
    symbols_by_name: &BTreeMap<String, Vec<String>>,
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> Vec<String> {
    let symbol_ids_by_export_name = export_names
        .iter()
        .map(|(symbol_id, export_name)| (export_name.clone(), symbol_id.clone()))
        .collect::<BTreeMap<_, _>>();

    symbols_by_name
        .iter()
        .filter(|(_, symbol_ids)| {
            should_warn_duplicate_symbol_name(
                symbol_ids,
                symbols_by_id,
                &bundle.symbols,
                &symbol_ids_by_export_name,
            )
        })
        .map(|(symbol_name, symbol_ids)| {
            let matches = duplicate_symbol_matches(symbol_ids, symbols_by_id);
            format!(
                "Duplicate symbol name \"{symbol_name}\" matched {} entries: {matches}. Use symbol id or scoped lookup to disambiguate.",
                symbol_ids.len()
            )
        })
        .collect()
}

fn should_warn_duplicate_symbol_name(
    symbol_ids: &[String],
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
    symbols: &BTreeMap<String, crate::tasty::model::TsSymbol>,
    symbol_ids_by_export_name: &BTreeMap<String, String>,
) -> bool {
    if symbol_ids.len() <= 1 {
        return false;
    }

    let libraries = symbol_ids
        .iter()
        .filter_map(|symbol_id| {
            symbols_by_id
                .get(symbol_id)
                .map(|entry| entry.library.as_str())
        })
        .collect::<Vec<_>>();
    if libraries.len() <= 1 {
        return true;
    }

    let has_user_symbol = libraries
        .iter()
        .any(|library| *library == USER_LIBRARY_NAME);
    let user_symbol_count = libraries
        .iter()
        .filter(|library| **library == USER_LIBRARY_NAME)
        .count();
    let distinct_libraries = libraries
        .iter()
        .copied()
        .collect::<std::collections::BTreeSet<_>>();
    if distinct_libraries.len() <= 1 {
        return true;
    }

    if !has_user_symbol {
        return false;
    }

    if user_symbol_count == 1 {
        return false;
    }

    !all_duplicate_symbols_equivalent(symbol_ids, symbols, symbol_ids_by_export_name)
}

fn all_duplicate_symbols_equivalent(
    symbol_ids: &[String],
    symbols: &BTreeMap<String, crate::tasty::model::TsSymbol>,
    symbol_ids_by_export_name: &BTreeMap<String, String>,
) -> bool {
    let mut resolved_symbols = symbol_ids.iter().map(|export_name| {
        symbol_ids_by_export_name
            .get(export_name)
            .and_then(|symbol_id| symbols.get(symbol_id))
    });
    let Some(first) = resolved_symbols.next().flatten() else {
        return false;
    };

    resolved_symbols.all(|current| {
        current
            .map(|symbol| symbols_equivalent(first, symbol))
            .unwrap_or(false)
    })
}

fn symbols_equivalent(
    left: &crate::tasty::model::TsSymbol,
    right: &crate::tasty::model::TsSymbol,
) -> bool {
    left.name == right.name
        && left.kind == right.kind
        && left.description == right.description
        && left.description_raw == right.description_raw
        && left.jsdoc == right.jsdoc
        && type_parameters_equivalent(&left.type_parameters, &right.type_parameters)
        && members_equivalent(&left.defined_members, &right.defined_members)
        && type_refs_equivalent(&left.extends, &right.extends)
        && optional_type_ref_equivalent(&left.underlying, &right.underlying)
        && type_refs_equivalent(&left.references, &right.references)
}

fn type_parameters_equivalent(
    left: &[crate::tasty::model::TsTypeParameter],
    right: &[crate::tasty::model::TsTypeParameter],
) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && optional_type_ref_equivalent(&left.constraint, &right.constraint)
                && optional_type_ref_equivalent(&left.default, &right.default)
        })
}

fn members_equivalent(
    left: &[crate::tasty::model::TsMember],
    right: &[crate::tasty::model::TsMember],
) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && left.optional == right.optional
                && left.readonly == right.readonly
                && left.kind == right.kind
                && left.description == right.description
                && left.description_raw == right.description_raw
                && left.jsdoc == right.jsdoc
                && optional_type_ref_equivalent(&left.type_ref, &right.type_ref)
        })
}

fn optional_type_ref_equivalent(
    left: &Option<crate::tasty::model::TypeRef>,
    right: &Option<crate::tasty::model::TypeRef>,
) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_ref_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}

fn type_refs_equivalent(
    left: &[crate::tasty::model::TypeRef],
    right: &[crate::tasty::model::TypeRef],
) -> bool {
    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| type_ref_equivalent(left, right))
}

fn type_ref_equivalent(
    left: &crate::tasty::model::TypeRef,
    right: &crate::tasty::model::TypeRef,
) -> bool {
    use crate::tasty::model::TypeRef;

    match (left, right) {
        (TypeRef::Intrinsic { name: left }, TypeRef::Intrinsic { name: right }) => left == right,
        (TypeRef::Literal { value: left }, TypeRef::Literal { value: right }) => left == right,
        (
            TypeRef::Reference {
                name: left_name,
                type_arguments: left_args,
                ..
            },
            TypeRef::Reference {
                name: right_name,
                type_arguments: right_args,
                ..
            },
        ) => {
            left_name == right_name
                && optional_type_ref_list_equivalent(left_args.as_deref(), right_args.as_deref())
        }
        (TypeRef::Union { types: left }, TypeRef::Union { types: right }) => {
            type_refs_equivalent(left, right)
        }
        (TypeRef::Array { element: left }, TypeRef::Array { element: right }) => {
            type_ref_equivalent(left, right)
        }
        (TypeRef::Tuple { elements: left }, TypeRef::Tuple { elements: right }) => {
            tuple_elements_equivalent(left, right)
        }
        (TypeRef::Intersection { types: left }, TypeRef::Intersection { types: right }) => {
            type_refs_equivalent(left, right)
        }
        (TypeRef::Object { members: left }, TypeRef::Object { members: right }) => {
            members_equivalent(left, right)
        }
        (
            TypeRef::IndexedAccess {
                object: left_object,
                index: left_index,
                resolved: left_resolved,
            },
            TypeRef::IndexedAccess {
                object: right_object,
                index: right_index,
                resolved: right_resolved,
            },
        ) => {
            type_ref_equivalent(left_object, right_object)
                && type_ref_equivalent(left_index, right_index)
                && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
        }
        (
            TypeRef::Function {
                params: left_params,
                return_type: left_return,
            },
            TypeRef::Function {
                params: right_params,
                return_type: right_return,
            },
        ) => {
            fn_params_equivalent(left_params, right_params)
                && type_ref_equivalent(left_return, right_return)
        }
        (
            TypeRef::Constructor {
                r#abstract: left_abstract,
                type_parameters: left_type_parameters,
                params: left_params,
                return_type: left_return,
            },
            TypeRef::Constructor {
                r#abstract: right_abstract,
                type_parameters: right_type_parameters,
                params: right_params,
                return_type: right_return,
            },
        ) => {
            left_abstract == right_abstract
                && type_parameters_equivalent(left_type_parameters, right_type_parameters)
                && fn_params_equivalent(left_params, right_params)
                && type_ref_equivalent(left_return, right_return)
        }
        (
            TypeRef::TypeOperator {
                operator: left_operator,
                target: left_target,
                resolved: left_resolved,
            },
            TypeRef::TypeOperator {
                operator: right_operator,
                target: right_target,
                resolved: right_resolved,
            },
        ) => {
            left_operator == right_operator
                && type_ref_equivalent(left_target, right_target)
                && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
        }
        (
            TypeRef::TypeQuery {
                expression: left_expression,
                resolved: left_resolved,
            },
            TypeRef::TypeQuery {
                expression: right_expression,
                resolved: right_resolved,
            },
        ) => {
            left_expression == right_expression
                && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
        }
        (
            TypeRef::Conditional {
                check_type: left_check,
                extends_type: left_extends,
                true_type: left_true,
                false_type: left_false,
                resolved: left_resolved,
            },
            TypeRef::Conditional {
                check_type: right_check,
                extends_type: right_extends,
                true_type: right_true,
                false_type: right_false,
                resolved: right_resolved,
            },
        ) => {
            type_ref_equivalent(left_check, right_check)
                && type_ref_equivalent(left_extends, right_extends)
                && type_ref_equivalent(left_true, right_true)
                && type_ref_equivalent(left_false, right_false)
                && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
        }
        (
            TypeRef::Mapped {
                type_param: left_type_param,
                source_type: left_source,
                name_type: left_name_type,
                optional_modifier: left_optional,
                readonly_modifier: left_readonly,
                value_type: left_value,
            },
            TypeRef::Mapped {
                type_param: right_type_param,
                source_type: right_source,
                name_type: right_name_type,
                optional_modifier: right_optional,
                readonly_modifier: right_readonly,
                value_type: right_value,
            },
        ) => {
            left_type_param == right_type_param
                && type_ref_equivalent(left_source, right_source)
                && optional_boxed_type_ref_equivalent(left_name_type, right_name_type)
                && left_optional == right_optional
                && left_readonly == right_readonly
                && optional_boxed_type_ref_equivalent(left_value, right_value)
        }
        (
            TypeRef::TemplateLiteral {
                parts: left_parts,
                resolved: left_resolved,
            },
            TypeRef::TemplateLiteral {
                parts: right_parts,
                resolved: right_resolved,
            },
        ) => {
            template_literal_parts_equivalent(left_parts, right_parts)
                && optional_boxed_type_ref_equivalent(left_resolved, right_resolved)
        }
        (TypeRef::Raw { summary: left }, TypeRef::Raw { summary: right }) => left == right,
        _ => false,
    }
}

fn optional_type_ref_list_equivalent(
    left: Option<&[crate::tasty::model::TypeRef]>,
    right: Option<&[crate::tasty::model::TypeRef]>,
) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_refs_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}

fn optional_boxed_type_ref_equivalent(
    left: &Option<Box<crate::tasty::model::TypeRef>>,
    right: &Option<Box<crate::tasty::model::TypeRef>>,
) -> bool {
    match (left, right) {
        (Some(left), Some(right)) => type_ref_equivalent(left, right),
        (None, None) => true,
        _ => false,
    }
}

fn fn_params_equivalent(
    left: &[crate::tasty::model::FnParam],
    right: &[crate::tasty::model::FnParam],
) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.name == right.name
                && left.optional == right.optional
                && optional_type_ref_equivalent(&left.type_ref, &right.type_ref)
        })
}

fn tuple_elements_equivalent(
    left: &[crate::tasty::model::TupleElement],
    right: &[crate::tasty::model::TupleElement],
) -> bool {
    left.len() == right.len()
        && left.iter().zip(right).all(|(left, right)| {
            left.label == right.label
                && left.optional == right.optional
                && left.rest == right.rest
                && left.readonly == right.readonly
                && type_ref_equivalent(&left.element, &right.element)
        })
}

fn template_literal_parts_equivalent(
    left: &[crate::tasty::model::TemplateLiteralPart],
    right: &[crate::tasty::model::TemplateLiteralPart],
) -> bool {
    use crate::tasty::model::TemplateLiteralPart;

    left.len() == right.len()
        && left
            .iter()
            .zip(right)
            .all(|(left, right)| match (left, right) {
                (
                    TemplateLiteralPart::Text { value: left },
                    TemplateLiteralPart::Text { value: right },
                ) => left == right,
                (
                    TemplateLiteralPart::Type { value: left },
                    TemplateLiteralPart::Type { value: right },
                ) => type_ref_equivalent(left, right),
                _ => false,
            })
}

fn duplicate_symbol_matches(
    symbol_ids: &[String],
    symbols_by_id: &BTreeMap<String, TastySymbolIndexEntry>,
) -> String {
    symbol_ids
        .iter()
        .filter_map(|symbol_id| {
            symbols_by_id
                .get(symbol_id)
                .map(|entry| format!("{} ({})", entry.id, entry.library))
        })
        .collect::<Vec<_>>()
        .join(", ")
}

fn emitted_symbol_kind(kind: TsSymbolKind) -> TastySymbolKind {
    match kind {
        TsSymbolKind::Interface => TastySymbolKind::Interface,
        TsSymbolKind::TypeAlias => TastySymbolKind::TypeAlias,
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::should_warn_duplicate_symbol_name;
    use crate::tasty::constants::libraries::USER_LIBRARY_NAME;
    use crate::tasty::emitted::{TastySymbolIndexEntry, TastySymbolKind};
    use crate::tasty::model::{TsSymbol, TsSymbolKind, TypeRef};

    fn entry(id: &str, name: &str, library: &str) -> TastySymbolIndexEntry {
        TastySymbolIndexEntry {
            id: id.to_string(),
            name: name.to_string(),
            kind: TastySymbolKind::TypeAlias,
            chunk: format!("./chunks/{id}.js"),
            library: library.to_string(),
        }
    }

    fn symbol(id: &str, name: &str, library: &str, underlying: Option<TypeRef>) -> TsSymbol {
        TsSymbol {
            id: id.to_string(),
            name: name.to_string(),
            library: library.to_string(),
            kind: TsSymbolKind::TypeAlias,
            file_id: format!("{id}.ts"),
            exported: true,
            description: None,
            description_raw: None,
            jsdoc: None,
            type_parameters: vec![],
            defined_members: vec![],
            extends: vec![],
            underlying,
            references: vec![],
        }
    }

    fn symbol_ids_by_export_name(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
        pairs
            .iter()
            .map(|(export_name, symbol_id)| ((*export_name).to_string(), (*symbol_id).to_string()))
            .collect()
    }

    #[test]
    fn suppresses_cross_library_external_duplicates() {
        let symbols_by_id = BTreeMap::from([
            (
                "_a".to_string(),
                entry("_a", "Shared", "@reference-ui/react"),
            ),
            (
                "_b".to_string(),
                entry("_b", "Shared", "@reference-ui/system"),
            ),
            (
                "_c".to_string(),
                entry("_c", "Shared", "@reference-ui/types"),
            ),
        ]);
        let symbols = BTreeMap::new();
        let symbol_ids = vec!["_a".to_string(), "_b".to_string(), "_c".to_string()];

        assert!(!should_warn_duplicate_symbol_name(
            &symbol_ids,
            &symbols_by_id,
            &symbols,
            &BTreeMap::new(),
        ));
    }

    #[test]
    fn suppresses_unique_user_external_collisions_warning() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
            (
                "_b".to_string(),
                entry("_b", "Shared", "@reference-ui/system"),
            ),
        ]);
        let symbols = BTreeMap::from([
            (
                "user-symbol".to_string(),
                symbol(
                    "user-symbol",
                    "Shared",
                    USER_LIBRARY_NAME,
                    Some(TypeRef::Intrinsic {
                        name: "string".to_string(),
                    }),
                ),
            ),
            (
                "system-symbol".to_string(),
                symbol(
                    "system-symbol",
                    "Shared",
                    "@reference-ui/system",
                    Some(TypeRef::Intrinsic {
                        name: "number".to_string(),
                    }),
                ),
            ),
        ]);
        let export_name_map =
            symbol_ids_by_export_name(&[("_a", "user-symbol"), ("_b", "system-symbol")]);
        let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

        assert!(!should_warn_duplicate_symbol_name(
            &symbol_ids,
            &symbols_by_id,
            &symbols,
            &export_name_map,
        ));
    }

    #[test]
    fn keeps_same_library_collisions_warning() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
            ("_b".to_string(), entry("_b", "Shared", USER_LIBRARY_NAME)),
        ]);
        let symbols = BTreeMap::new();
        let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

        assert!(should_warn_duplicate_symbol_name(
            &symbol_ids,
            &symbols_by_id,
            &symbols,
            &BTreeMap::new(),
        ));
    }

    #[test]
    fn suppresses_structurally_identical_user_external_duplicates() {
        let symbols_by_id = BTreeMap::from([
            ("_a".to_string(), entry("_a", "Shared", USER_LIBRARY_NAME)),
            (
                "_b".to_string(),
                entry("_b", "Shared", "@reference-ui/styled"),
            ),
        ]);
        let shared_definition = Some(TypeRef::Intersection {
            types: vec![
                TypeRef::Intrinsic {
                    name: "string".to_string(),
                },
                TypeRef::Object { members: vec![] },
            ],
        });
        let symbols = BTreeMap::from([
            (
                "user-symbol".to_string(),
                symbol(
                    "user-symbol",
                    "Shared",
                    USER_LIBRARY_NAME,
                    shared_definition.clone(),
                ),
            ),
            (
                "styled-symbol".to_string(),
                symbol(
                    "styled-symbol",
                    "Shared",
                    "@reference-ui/styled",
                    shared_definition,
                ),
            ),
        ]);
        let export_name_map =
            symbol_ids_by_export_name(&[("_a", "user-symbol"), ("_b", "styled-symbol")]);
        let symbol_ids = vec!["_a".to_string(), "_b".to_string()];

        assert!(!should_warn_duplicate_symbol_name(
            &symbol_ids,
            &symbols_by_id,
            &symbols,
            &export_name_map,
        ));
    }
}
