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
    cast_wrapper_target(expr).or_else(|| assertion_wrapper_target(expr))
}

/// Parentheses and the `as` / `satisfies` casts around an expression.
fn cast_wrapper_target<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        // ('2r')
        Expression::ParenthesizedExpression(p) => Some(&p.expression),
        // '2r' as const
        Expression::TSAsExpression(as_expr) => Some(&as_expr.expression),
        // '2r' satisfies string
        Expression::TSSatisfiesExpression(sat) => Some(&sat.expression),
        _ => None,
    }
}

/// Non-null, angle-bracket, and instantiation assertions around an expression.
fn assertion_wrapper_target<'a, 'b>(expr: &'b Expression<'a>) -> Option<&'b Expression<'a>> {
    match expr {
        // '2r'!
        Expression::TSNonNullExpression(non_null) => Some(&non_null.expression),
        // <string>'2r'  (.ts only)
        Expression::TSTypeAssertion(assertion) => Some(&assertion.expression),
        // w<string>  — type arguments erase, like `as`
        Expression::TSInstantiationExpression(instantiation) => Some(&instantiation.expression),
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
        _ => shape_kind(expr).to_string(),
    }
}

/// The shape name of a non-identifier style-block value: member reads, calls, and logicals.
fn shape_kind(expr: &Expression<'_>) -> &'static str {
    match expr {
        Expression::StaticMemberExpression(_)
        | Expression::ComputedMemberExpression(_)
        | Expression::PrivateFieldExpression(_)
        | Expression::ChainExpression(_) => "member expression",
        Expression::CallExpression(_) => "call expression",
        Expression::LogicalExpression(_) => "logical expression",
        _ => operator_or_literal_kind(expr),
    }
}

/// The shape name of templates, unary operators, and function-like values.
fn operator_or_literal_kind(expr: &Expression<'_>) -> &'static str {
    match expr {
        Expression::TemplateLiteral(_) | Expression::TaggedTemplateExpression(_) => {
            "template expression"
        }
        Expression::UnaryExpression(_) | Expression::UpdateExpression(_) => "unary expression",
        Expression::ArrowFunctionExpression(_)
        | Expression::FunctionExpression(_)
        | Expression::ClassExpression(_) => "function expression",
        _ => "expression",
    }
}
