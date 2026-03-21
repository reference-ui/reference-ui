mod helpers;
mod variants;

use crate::tasty::model::{TsTypeParameter, TypeRef};

pub(super) fn collect_type_ref_references(type_ref: &TypeRef, references: &mut Vec<TypeRef>) {
    variants::dispatch(type_ref, references);
}

pub(super) fn collect_type_parameter_shell_references(
    type_parameter: &TsTypeParameter,
    references: &mut Vec<TypeRef>,
) {
    helpers::walk_type_parameter(type_parameter, references);
}
