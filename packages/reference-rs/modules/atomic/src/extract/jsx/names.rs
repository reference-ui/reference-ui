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

/// True when a JSX tag names a component rather than a DOM element, by the
/// JSX capitalization rule alone: the root segment (before the first `.`)
/// must start with a character that exists and is not ASCII-lowercase, so
/// `_Foo`, `$Bar`, and `Élan` are components while `div` and an empty tag are
/// not. Syntactic only — no shadow or scope consult. It decides only whether
/// a non-host tag may lower at all (a DOM tag never does); which systems back
/// it is decided by its binding, never its spelling. The extract gate and the
/// analysis gate share it.
pub(crate) fn is_component_tag(tag: &str) -> bool {
    let root = tag.split('.').next().unwrap_or(tag);
    root.chars().next().is_some_and(|c| !c.is_ascii_lowercase())
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

#[cfg(test)]
mod tests {
    use super::is_component_tag;

    /// The capitalization rule reads only the root segment (G0 §D): components
    /// are any leading character that is not ASCII-lowercase, member tags take
    /// their root's verdict, and lowercase/empty tags are DOM elements.
    #[test]
    fn component_tag_is_the_leading_character_rule() {
        for tag in ["BoltIcon", "_Foo", "$Bar", "Élan", "Foo.Bar", "Foo.bar.Baz"] {
            assert!(is_component_tag(tag), "{tag} is a component");
        }
        for tag in ["div", "span", "my-element", "foo.Bar", ""] {
            assert!(!is_component_tag(tag), "{tag} is a DOM element");
        }
    }
}
