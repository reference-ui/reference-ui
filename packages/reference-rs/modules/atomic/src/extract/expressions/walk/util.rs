//! Shared shape helpers for the expression walkers and their callers.
//! Transparent TS wrappers erase at every site, so one unwrapper serves
//! value positions, block positions, and the fold table alike. Block-position
//! helpers decide which refused shapes skip silently and which name their
//! kind, keeping `css()` args and JSX style props diagnosed identically.

use oxc_ast::ast::{Expression, UnaryOperator};

/// The inner expression when `expr` is a transparent TS wrapper, else None.
/// Type wrappers erase at compile time, so every site unwraps through them
/// (`css()` args, JSX style blocks, and value positions alike).
pub(crate) fn unwrap_wrapper_target<'a, 'b>(
    expr: &'b Expression<'a>,
) -> Option<&'b Expression<'a>> {
    match expr {
        Expression::ParenthesizedExpression(p) => {
            // ('2r')
            Some(&p.expression)
        }
        Expression::TSAsExpression(as_expr) => {
            // '2r' as const
            Some(&as_expr.expression)
        }
        Expression::TSSatisfiesExpression(sat) => {
            // '2r' satisfies string
            Some(&sat.expression)
        }
        Expression::TSNonNullExpression(non_null) => {
            // '2r'!
            Some(&non_null.expression)
        }
        Expression::TSTypeAssertion(assertion) => {
            // <string>'2r'  (.ts only)
            Some(&assertion.expression)
        }
        Expression::TSInstantiationExpression(instantiation) => {
            // w<string>  — type arguments erase, like `as`
            Some(&instantiation.expression)
        }
        _ => None,
    }
}

/// True for block-position shapes that skip silently: falsy holes plus
/// literal fillers (`css('panda', {...})`, SPEC-V2-36). Everything else in
/// a style-block position either extracts or diagnoses (SPEC-V2-65).
pub(crate) fn is_silent_block_value(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::StringLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_) => true,
        Expression::Identifier(ident) => ident.name == "undefined" || ident.name == "null",
        Expression::UnaryExpression(unary) => unary.operator == UnaryOperator::Void,
        _ => false,
    }
}

/// Short kind name for a refused style-block value (`css()` args, JSX style
/// props). Identifiers name their binding; the span pinpoints the rest.
pub(crate) fn block_value_kind(expr: &Expression<'_>) -> String {
    match expr {
        Expression::Identifier(ident) => format!("identifier '{}'", ident.name.as_str()),
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_)
        | Expression::ChainExpression(_) => "member expression".to_string(),
        Expression::CallExpression(_) => "call expression".to_string(),
        Expression::LogicalExpression(_) => "logical expression".to_string(),
        Expression::TemplateLiteral(_) | Expression::TaggedTemplateExpression(_) => {
            "template expression".to_string()
        }
        Expression::UnaryExpression(_) | Expression::UpdateExpression(_) => {
            "unary expression".to_string()
        }
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_)
        | Expression::ClassExpression(_) => "function expression".to_string(),
        _ => "expression".to_string(),
    }
}
