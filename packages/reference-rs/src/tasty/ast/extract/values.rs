use std::collections::BTreeMap;

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, BindingPattern, Declaration, Expression,
    ObjectExpression, ObjectPropertyKind, PropertyKey, PropertyKind, Statement, TSAsExpression,
    TSSatisfiesExpression, VariableDeclarationKind,
};
use oxc_span::GetSpan;

use super::super::super::model::{JsDoc, TsMember, TsMemberKind, TypeRef};
use super::super::model::ImportBinding;
use super::slice_span;

pub(super) fn collect_statement_value_bindings(
    statement: &Statement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    value_bindings: &mut BTreeMap<String, TypeRef>,
) {
    match statement {
        Statement::VariableDeclaration(declaration) => collect_variable_declaration_value_bindings(
            declaration,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            value_bindings,
        ),
        Statement::ExportNamedDeclaration(export_named) => {
            let Some(Declaration::VariableDeclaration(declaration)) = export_named.declaration.as_ref()
            else {
                return;
            };

            collect_variable_declaration_value_bindings(
                declaration,
                source,
                import_bindings,
                current_module_specifier,
                current_library,
                value_bindings,
            );
        }
        _ => {}
    }
}

fn collect_variable_declaration_value_bindings(
    declaration: &oxc_allocator::Box<'_, oxc_ast::ast::VariableDeclaration<'_>>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    value_bindings: &mut BTreeMap<String, TypeRef>,
) {
    if declaration.kind != VariableDeclarationKind::Const {
        return;
    }

    for declarator in declaration.declarations.iter() {
        let BindingPattern::BindingIdentifier(identifier) = &declarator.id else {
            continue;
        };
        let Some(init) = declarator.init.as_ref() else {
            continue;
        };

        if let Some(value_type) = infer_value_type(
            init,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
        ) {
            value_bindings.insert(identifier.name.to_string(), value_type);
        }
    }
}

fn infer_value_type(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(
        expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        false,
    )
}

fn infer_value_type_with_const_context(
    expression: &Expression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    match expression {
        Expression::BooleanLiteral(_) => Some(infer_boolean_type(source, expression, const_asserted)),
        Expression::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        Expression::NumericLiteral(_) => Some(infer_numeric_type(source, expression, const_asserted)),
        Expression::StringLiteral(_) => Some(infer_string_type(source, expression, const_asserted)),
        Expression::ObjectExpression(object) => Some(infer_object_type(
            object,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?),
        Expression::ArrayExpression(array) => Some(infer_array_type(
            array,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?),
        Expression::TSAsExpression(assertion) => infer_ts_as_expression(
            assertion,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        Expression::TSSatisfiesExpression(satisfies) => infer_ts_satisfies_expression(
            satisfies,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        _ => None,
    }
}

fn infer_ts_as_expression(
    assertion: &TSAsExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    let next_const_context = const_asserted || slice_span(source, assertion.type_annotation.span()) == "const";
    infer_value_type_with_const_context(
        &assertion.expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        next_const_context,
    )
}

fn infer_ts_satisfies_expression(
    satisfies: &TSSatisfiesExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    infer_value_type_with_const_context(
        &satisfies.expression,
        source,
        import_bindings,
        current_module_specifier,
        current_library,
        const_asserted,
    )
}

fn infer_object_type(
    object: &ObjectExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
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

fn infer_array_type(
    array: &ArrayExpression<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    let mut element_types = Vec::new();

    for element in array.elements.iter() {
        let inferred = infer_array_element_type(
            element,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        )?;
        element_types.push(inferred);
    }

    if const_asserted {
        return Some(TypeRef::Tuple {
            elements: element_types
                .into_iter()
                .map(|element| super::super::super::model::TupleElement {
                    label: None,
                    optional: false,
                    rest: false,
                    element,
                })
                .collect(),
        });
    }

    let element = collapse_union(element_types)?;
    Some(TypeRef::Array {
        element: Box::new(element),
    })
}

fn infer_array_element_type(
    element: &ArrayExpressionElement<'_>,
    source: &str,
    import_bindings: &BTreeMap<String, ImportBinding>,
    current_module_specifier: &str,
    current_library: &str,
    const_asserted: bool,
) -> Option<TypeRef> {
    match element {
        ArrayExpressionElement::SpreadElement(_) | ArrayExpressionElement::Elision(_) => None,
        ArrayExpressionElement::BooleanLiteral(expression) => Some(infer_boolean_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::NullLiteral(_) => Some(TypeRef::Intrinsic {
            name: "null".to_string(),
        }),
        ArrayExpressionElement::NumericLiteral(expression) => Some(infer_numeric_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::StringLiteral(expression) => Some(infer_string_type_span(
            source,
            expression.span(),
            const_asserted,
        )),
        ArrayExpressionElement::ObjectExpression(object) => infer_object_type(
            object,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::ArrayExpression(array) => infer_array_type(
            array,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::TSAsExpression(assertion) => infer_ts_as_expression(
            assertion,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        ArrayExpressionElement::TSSatisfiesExpression(satisfies) => infer_ts_satisfies_expression(
            satisfies,
            source,
            import_bindings,
            current_module_specifier,
            current_library,
            const_asserted,
        ),
        _ => None,
    }
}

fn infer_boolean_type(source: &str, expression: &Expression<'_>, const_asserted: bool) -> TypeRef {
    infer_boolean_type_span(source, expression.span(), const_asserted)
}

fn infer_boolean_type_span(source: &str, span: oxc_span::Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "boolean".to_string(),
    }
}

fn infer_numeric_type(source: &str, expression: &Expression<'_>, const_asserted: bool) -> TypeRef {
    infer_numeric_type_span(source, expression.span(), const_asserted)
}

fn infer_numeric_type_span(source: &str, span: oxc_span::Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "number".to_string(),
    }
}

fn infer_string_type(source: &str, expression: &Expression<'_>, const_asserted: bool) -> TypeRef {
    infer_string_type_span(source, expression.span(), const_asserted)
}

fn infer_string_type_span(source: &str, span: oxc_span::Span, const_asserted: bool) -> TypeRef {
    if const_asserted {
        return TypeRef::Literal {
            value: slice_span(source, span).to_string(),
        };
    }

    TypeRef::Intrinsic {
        name: "string".to_string(),
    }
}

fn property_key_name(property_key: &PropertyKey<'_>, source: &str) -> Option<String> {
    match property_key {
        PropertyKey::StaticIdentifier(identifier) => Some(identifier.name.to_string()),
        PropertyKey::StringLiteral(_) => Some(unquote_string_literal(
            slice_span(source, property_key.span()),
        )?),
        PropertyKey::NumericLiteral(_) => Some(slice_span(source, property_key.span()).to_string()),
        _ => None,
    }
}

fn collapse_union(types: Vec<TypeRef>) -> Option<TypeRef> {
    let mut unique_types = Vec::new();

    for type_ref in types {
        if !unique_types.contains(&type_ref) {
            unique_types.push(type_ref);
        }
    }

    match unique_types.len() {
        0 => None,
        1 => unique_types.into_iter().next(),
        _ => Some(TypeRef::Union { types: unique_types }),
    }
}

fn unquote_string_literal(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.len() < 2 {
        return None;
    }

    let starts_with_quote = trimmed.starts_with('"') || trimmed.starts_with('\'') || trimmed.starts_with('`');
    let ends_with_quote = trimmed.ends_with('"') || trimmed.ends_with('\'') || trimmed.ends_with('`');
    if !starts_with_quote || !ends_with_quote {
        return None;
    }

    Some(trimmed[1..trimmed.len() - 1].to_string())
}
