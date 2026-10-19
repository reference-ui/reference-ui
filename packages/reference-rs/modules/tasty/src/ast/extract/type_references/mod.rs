//! Reference collection entry point.
//! Collects TypeRef reference nodes from symbol shells for downstream resolution.

mod walk;

use crate::model::{TsMember, TsTypeParameter, TypeRef};

pub(super) fn collect_references_from_members(
    members: &[TsMember],
    extends: &[TypeRef],
    underlying: Option<&TypeRef>,
    type_parameters: &[TsTypeParameter],
) -> Vec<TypeRef> {
    let mut references = Vec::new();
    // A heritage clause is a reference that may carry type arguments, so it is walked like any other type:
    // the arguments are dependencies of the symbol too.
    for heritage in extends {
        walk::collect_type_ref_references(heritage, &mut references);
    }

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
