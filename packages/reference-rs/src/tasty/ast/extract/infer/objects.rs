use oxc_ast::ast::{ObjectExpression, ObjectPropertyKind, PropertyKind};

use crate::tasty::shared::type_ref_util::property_key_name;

use crate::tasty::model::{JsDoc, TsMember, TsMemberKind, TypeRef};

use super::super::values::infer_value_type_with_const_context;
use super::super::ExtractionContext;

pub(crate) fn infer_object_type(
    object: &ObjectExpression<'_>,
    ctx: &ExtractionContext<'_>,
    const_asserted: bool,
) -> Option<TypeRef> {
    let mut members = Vec::new();

    for property in object.properties.iter() {
        let ObjectPropertyKind::ObjectProperty(property) = property else {
            return None;
        };

        if property.kind != PropertyKind::Init || property.computed || property.method {
            return None;
        }

        let name = property_key_name(&property.key, ctx.source)?;
        let value_type = infer_value_type_with_const_context(&property.value, ctx, const_asserted)?;

        members.push(TsMember {
            name,
            optional: false,
            readonly: const_asserted,
            kind: TsMemberKind::Property,
            description: None,
            description_raw: None,
            jsdoc: Some(JsDoc {
                summary: None,
                tags: Vec::new(),
            }),
            type_ref: Some(value_type),
        });
    }

    Some(TypeRef::Object { members })
}
