//! JSX element and attribute name formatting for host matching.
//!
//! Renders oxc tag and attribute names to the dotted strings the extractor
//! compares against StyleProps hosts (`Overlay.Content` admits the
//! concatenated `OverlayContent` host). Pure string mapping; no extract state.

use oxc_ast::ast::{JSXAttributeName, JSXElementName, JSXMemberExpression};

/// Render a JSX tag name: identifiers verbatim, member chains dotted.
pub(crate) fn format_jsx_element_name(name: &JSXElementName<'_>) -> String {
    match name {
        JSXElementName::Identifier(ident) => {
            // <div />
            ident.name.to_string()
        }
        JSXElementName::IdentifierReference(ident) => {
            // <Div />
            ident.name.to_string()
        }
        JSXElementName::NamespacedName(ns) => {
            // <svg:path />
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
        JSXElementName::MemberExpression(member) => {
            // <Foo.Bar />
            format_jsx_member_expr(member)
        }
        JSXElementName::ThisExpression(_) => {
            // <this />
            "this".to_string()
        }
    }
}

fn format_jsx_member_expr(member: &JSXMemberExpression<'_>) -> String {
    // <Foo.Bar /> / <Foo.Bar.Baz />
    format!(
        "{}.{}",
        format_jsx_member_object(&member.object),
        member.property.name
    )
}

fn format_jsx_member_object(object: &oxc_ast::ast::JSXMemberExpressionObject<'_>) -> String {
    match object {
        oxc_ast::ast::JSXMemberExpressionObject::IdentifierReference(ident) => {
            // <Foo.Bar />
            ident.name.to_string()
        }
        oxc_ast::ast::JSXMemberExpressionObject::MemberExpression(inner) => {
            // <Foo.Bar.Baz />
            format_jsx_member_expr(inner)
        }
        oxc_ast::ast::JSXMemberExpressionObject::ThisExpression(_) => {
            // <this.Foo />
            "this".to_string()
        }
    }
}

/// Render a JSX attribute name, preserving XML namespaces.
pub(crate) fn format_jsx_attribute_name(name: &JSXAttributeName<'_>) -> String {
    match name {
        JSXAttributeName::Identifier(ident) => {
            // mt=
            ident.name.to_string()
        }
        JSXAttributeName::NamespacedName(ns) => {
            // xlink:href=
            format!("{}:{}", ns.namespace.name, ns.name.name)
        }
    }
}
