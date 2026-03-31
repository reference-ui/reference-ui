mod walk;

use crate::tasty::model::{TsMember, TsTypeParameter, TypeRef};

pub(super) fn collect_references_from_members(
    members: &[TsMember],
    extends: &[TypeRef],
    underlying: Option<&TypeRef>,
    type_parameters: &[TsTypeParameter],
) -> Vec<TypeRef> {
    let mut references = Vec::new();
    references.extend(extends.iter().cloned());

    if let Some(underlying) = underlying {
        walk::collect_type_ref_references(underlying, &mut references);
    }

    for member in members {
        if let Some(type_ref) = member.type_ref.as_ref() {
            walk::collect_type_ref_references(type_ref, &mut references);
        }
    }

    for type_parameter in type_parameters {
        walk::collect_type_parameter_shell_references(type_parameter, &mut references);
    }

    references
}
