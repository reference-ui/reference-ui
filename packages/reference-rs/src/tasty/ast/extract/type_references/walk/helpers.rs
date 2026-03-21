use crate::tasty::model::{
    FnParam, TemplateLiteralPart, TsMember, TsTypeParameter, TupleElement, TypeRef,
};

pub fn walk_optional(opt: Option<&TypeRef>, references: &mut Vec<TypeRef>) {
    let Some(t) = opt else {
        return;
    };
    super::collect_type_ref_references(t, references);
}

pub fn walk_slice(slice: &[TypeRef], references: &mut Vec<TypeRef>) {
    for t in slice {
        super::collect_type_ref_references(t, references);
    }
}

pub fn walk_tuple_elements(elements: &[TupleElement], references: &mut Vec<TypeRef>) {
    for el in elements {
        super::collect_type_ref_references(&el.element, references);
    }
}

pub fn walk_member_types(members: &[TsMember], references: &mut Vec<TypeRef>) {
    for m in members {
        walk_optional(m.type_ref.as_ref(), references);
    }
}

pub fn walk_fn_params(params: &[FnParam], references: &mut Vec<TypeRef>) {
    for p in params {
        walk_optional(p.type_ref.as_ref(), references);
    }
}

pub fn walk_type_parameter(tp: &TsTypeParameter, references: &mut Vec<TypeRef>) {
    walk_optional(tp.constraint.as_ref(), references);
    walk_optional(tp.default.as_ref(), references);
}

pub fn walk_template_literal_parts(parts: &[TemplateLiteralPart], references: &mut Vec<TypeRef>) {
    for part in parts {
        let TemplateLiteralPart::Type { value } = part else {
            continue;
        };
        super::collect_type_ref_references(value, references);
    }
}
