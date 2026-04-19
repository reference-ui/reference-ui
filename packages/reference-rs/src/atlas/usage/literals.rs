use crate::atlas::internal::JsxAttribute;
use oxc_ast::ast::{
    ExportDefaultDeclarationKind, Expression, JSXAttributeItem, JSXAttributeName,
    JSXAttributeValue, JSXChild, JSXElementName, JSXExpression, JSXMemberExpressionObject,
};
use oxc_span::{GetSpan, Span};

pub(super) fn jsx_attribute_from_item(
    attribute: &JSXAttributeItem<'_>,
    source: &str,
) -> Option<JsxAttribute> {
    let JSXAttributeItem::Attribute(attribute) = attribute else {
        return None;
    };

    Some(JsxAttribute {
        name: jsx_attribute_name_to_string(&attribute.name),
        literal_value: jsx_attribute_literal_value(attribute.value.as_ref(), source),
    })
}

pub(super) fn jsx_name_to_string(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(identifier) => identifier.name.to_string(),
        JSXElementName::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXElementName::NamespacedName(namespaced) => {
            format!("{}:{}", namespaced.namespace.name, namespaced.name.name)
        }
        JSXElementName::MemberExpression(member) => {
            format!(
                "{}.{}",
                jsx_member_object_to_string(&member.object),
                member.property.name
            )
        }
        JSXElementName::ThisExpression(_) => "this".to_string(),
    }
}

pub(super) fn jsx_child_is_meaningful(child: &JSXChild<'_>) -> bool {
    match child {
        JSXChild::Text(text) => !text.value.trim().is_empty(),
        _ => true,
    }
}

pub(super) fn export_default_expression<'a>(
    expression: &'a ExportDefaultDeclarationKind<'a>,
) -> Option<&'a Expression<'a>> {
    match expression {
        ExportDefaultDeclarationKind::FunctionDeclaration(_) => None,
        ExportDefaultDeclarationKind::ClassDeclaration(_) => None,
        ExportDefaultDeclarationKind::TSInterfaceDeclaration(_) => None,
        _ => Some(expression.to_expression()),
    }
}

pub(super) fn slice_span(source: &str, span: Span) -> &str {
    &source[span.start as usize..span.end as usize]
}

fn jsx_attribute_name_to_string(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(identifier) => identifier.name.to_string(),
        JSXAttributeName::NamespacedName(namespaced) => {
            format!("{}:{}", namespaced.namespace.name, namespaced.name.name)
        }
    }
}

fn jsx_attribute_literal_value(
    value: Option<&JSXAttributeValue<'_>>,
    source: &str,
) -> Option<String> {
    match value {
        None => Some("true".to_string()),
        Some(JSXAttributeValue::StringLiteral(literal)) => Some(literal.value.to_string()),
        Some(JSXAttributeValue::ExpressionContainer(container)) => {
            jsx_expression_literal_value(&container.expression, source)
        }
        Some(JSXAttributeValue::Element(_)) | Some(JSXAttributeValue::Fragment(_)) => None,
    }
}

fn jsx_expression_literal_value(expression: &JSXExpression<'_>, source: &str) -> Option<String> {
    match expression {
        JSXExpression::EmptyExpression(_) => None,
        _ => expression_literal_value(expression.to_expression(), source),
    }
}

fn expression_literal_value(expression: &Expression<'_>, source: &str) -> Option<String> {
    match expression {
        Expression::StringLiteral(literal) => Some(literal.value.to_string()),
        Expression::BooleanLiteral(literal) => Some(literal.value.to_string()),
        Expression::NumericLiteral(_) => {
            Some(slice_span(source, expression.span()).trim().to_string())
        }
        Expression::TemplateLiteral(template) if template.expressions.is_empty() => Some(
            slice_span(source, template.span())
                .trim_matches('`')
                .to_string(),
        ),
        Expression::ParenthesizedExpression(parenthesized) => {
            expression_literal_value(&parenthesized.expression, source)
        }
        Expression::TSAsExpression(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        Expression::TSSatisfiesExpression(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        Expression::TSTypeAssertion(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        Expression::TSNonNullExpression(asserted) => {
            expression_literal_value(&asserted.expression, source)
        }
        _ => None,
    }
}

fn jsx_member_object_to_string(object: &JSXMemberExpressionObject<'_>) -> String {
    match object {
        JSXMemberExpressionObject::IdentifierReference(identifier) => identifier.name.to_string(),
        JSXMemberExpressionObject::MemberExpression(member) => {
            format!(
                "{}.{}",
                jsx_member_object_to_string(&member.object),
                member.property.name
            )
        }
        JSXMemberExpressionObject::ThisExpression(_) => "this".to_string(),
    }
}
