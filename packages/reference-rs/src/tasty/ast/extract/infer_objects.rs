use oxc_ast::ast::{ObjectExpression, ObjectPropertyKind, PropertyKind};

use crate::tasty::shared::typeref_util::property_key_name;

use crate::tasty::model::{JsDoc, TsMember, TsMemberKind, TypeRef};

use super::values::infer_value_type_with_const_context;

pub(super) fn infer_object_type(
    object: &ObjectExpression<'_>,
    source: &str,
    import_bindings: &std::collections::BTreeMap<String, crate::tasty::ast::model::ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
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

        let name = property_key_name(&property.key, source)?;
        let value_type = infer_value_type_with_const_context(
            &property.value,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?;

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
