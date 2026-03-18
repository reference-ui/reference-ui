use super::super::super::model::{
    FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement, TypeRef,
};

pub(super) fn collect_references_from_members(
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
        collect_optional_type_ref_references(member.type_ref.as_ref(), &mut references);
    }

    for type_parameter in type_parameters {
        collect_type_parameter_references(type_parameter, &mut references);
    }

    references
}

fn collect_optional_type_ref_references(type_ref: Option<&TypeRef>, references: &mut Vec<TypeRef>) {
    if let Some(type_ref) = type_ref {
        collect_type_ref_references(type_ref, references);
    }
}

fn collect_type_parameter_references(
    type_parameter: &TsTypeParameter,
    references: &mut Vec<TypeRef>,
) {
    collect_optional_type_ref_references(type_parameter.constraint.as_ref(), references);
    collect_optional_type_ref_references(type_parameter.default.as_ref(), references);
}

fn collect_fn_param_references(param: &FnParam, references: &mut Vec<TypeRef>) {
    collect_optional_type_ref_references(param.type_ref.as_ref(), references);
}

fn collect_type_ref_slice_references(type_refs: &[TypeRef], references: &mut Vec<TypeRef>) {
    for type_ref in type_refs {
        collect_type_ref_references(type_ref, references);
    }
}

fn collect_tuple_element_references(elements: &[TupleElement], references: &mut Vec<TypeRef>) {
    for element in elements {
        collect_type_ref_references(&element.element, references);
    }
}

fn collect_member_type_references(members: &[TsMember], references: &mut Vec<TypeRef>) {
    for member in members {
        collect_optional_type_ref_references(member.type_ref.as_ref(), references);
    }
}

fn collect_fn_params_references(params: &[FnParam], references: &mut Vec<TypeRef>) {
    for param in params {
        collect_fn_param_references(param, references);
    }
}

fn collect_template_literal_part_references(
    parts: &[TemplateLiteralPart],
    references: &mut Vec<TypeRef>,
) {
    for part in parts {
        if let TemplateLiteralPart::Type { value } = part {
            collect_type_ref_references(value, references);
        }
    }
}

fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    match type_ref {
        TypeRef::Reference {
            type_arguments: Some(arguments),
            ..
        } => {
            references.push(type_ref.clone());
            collect_type_ref_slice_references(arguments, references);
        }
        TypeRef::Reference { .. } => references.push(type_ref.clone()),
        TypeRef::Union { types } | TypeRef::Intersection { types } => {
            collect_type_ref_slice_references(types, references)
        }
        TypeRef::Array { element } => collect_type_ref_references(element, references),
        TypeRef::Tuple { elements } => collect_tuple_element_references(elements, references),
        TypeRef::Object { members } => collect_member_type_references(members, references),
        TypeRef::IndexedAccess { object, index } => {
            collect_type_ref_references(object, references);
            collect_type_ref_references(index, references);
        }
        TypeRef::Function {
            params,
            return_type,
        } => {
            collect_fn_params_references(params, references);
            collect_type_ref_references(return_type, references);
        }
        TypeRef::Constructor {
            type_parameters,
            params,
            return_type,
            ..
        } => {
            for type_parameter in type_parameters {
                collect_type_parameter_references(type_parameter, references);
            }
            collect_fn_params_references(params, references);
            collect_type_ref_references(return_type, references);
        }
        TypeRef::TypeOperator { target, .. } => collect_type_ref_references(target, references),
        TypeRef::TypeQuery { .. } => {}
        TypeRef::Conditional {
            check_type,
            extends_type,
            true_type,
            false_type,
        } => {
            collect_type_ref_references(check_type, references);
            collect_type_ref_references(extends_type, references);
            collect_type_ref_references(true_type, references);
            collect_type_ref_references(false_type, references);
        }
        TypeRef::Mapped {
            source_type,
            name_type,
            value_type,
            ..
        } => {
            collect_type_ref_references(source_type, references);
            collect_optional_type_ref_references(name_type.as_deref(), references);
            collect_optional_type_ref_references(value_type.as_deref(), references);
        }
        TypeRef::TemplateLiteral { parts } => {
            collect_template_literal_part_references(parts, references)
        }
        _ => {}
    }
}
