//! Small readers that turn oxc JSX nodes into the plain strings and values Atlas records.
//! They name a JSX tag or attribute, decide whether a child is meaningful, slice a span out of the
//! source, and read an attribute's literal value when it has one. They take borrowed AST nodes and
//! emit owned data, so the usage walker can drop the parse arena as soon as a module is read.

use crate::internal::{wrapped_expression, JsxAttribute};
use oxc_ast::ast::{
    Expression, JSXAttributeItem, JSXAttributeName,
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
    if let Some(inner) = wrapped_expression(expression) {
        return expression_literal_value(inner, source);
    }
    match expression {
        Expression::StringLiteral(literal) => Some(literal.value.to_string()),
        Expression::BooleanLiteral(literal) => Some(literal.value.to_string()),
        _ => source_literal_value(expression, source),
    }
}

/// Numeric literals keep their source text; an interpolation-free template keeps its text without backticks.
fn source_literal_value(expression: &Expression<'_>, source: &str) -> Option<String> {
    match expression {
        Expression::NumericLiteral(_) => Some(slice_span(source, expression.span()).trim().to_string()),
        Expression::TemplateLiteral(template) if template.expressions.is_empty() => {
            Some(slice_span(source, template.span()).trim_matches('`').to_string())
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
