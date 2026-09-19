//! `token()` call shape matchers: callee, args, and operand classifiers.
//!
//! Scope-free pieces both the walker fold (`token.rs`) and binding-init
//! recording (`scope/collect.rs`) compose: callee shapes, arity checks,
//! path and fallback classifiers, recorded-leaf resolvers, and the folded
//! value constructor. Nothing here knows the scope chain; callers resolve
//! identifier operands and pass the leaves in.

use oxc_ast::ast::{CallExpression, Expression};
use oxc_span::{GetSpan, Span};

use super::operand::peel_wrappers;
use super::token::{TokenReason, TokenRefusal};
use crate::atom::AtomValue;
use crate::extract::scope::ImportRef;

/// A `token()` callee shape: bare, `.var`, or a foreign member of an import.
pub enum TokenCallee<'a> {
    /// `token(...)` — the local name that must bind the import.
    Bare(&'a str),
    /// `token.var(...)` — the local name that must bind the import.
    Var(&'a str),
    /// `token.foo(...)` — refused against the surface when bound.
    Foreign {
        /// The local name that must bind the import.
        name: &'a str,
        /// The callee span for the diagnostic.
        span: Span,
    },
}

/// A `token()` callee's shape, or None when the callee is not identifier-based
/// (those calls are never token calls, whatever they name).
pub fn token_callee<'a>(callee: &Expression<'a>) -> Option<TokenCallee<'a>> {
    match peel_wrappers(callee) {
        Expression::Identifier(ident) => Some(TokenCallee::Bare(ident.name.as_str())),
        Expression::StaticMemberExpression(member) => member_callee(member, callee.span()),
        _ => None,
    }
}

/// A member callee's shape: `.var` folds, anything else is foreign.
fn member_callee<'a>(
    member: &oxc_ast::ast::StaticMemberExpression<'a>,
    span: Span,
) -> Option<TokenCallee<'a>> {
    let Expression::Identifier(obj) = &member.object else {
        return None;
    };
    if member.property.name.as_str() == "var" {
        return Some(TokenCallee::Var(obj.name.as_str()));
    }
    Some(TokenCallee::Foreign {
        name: obj.name.as_str(),
        span,
    })
}

/// True when an import binding is the `token` helper from a Reference package.
/// Aliases answer by imported name.
pub fn is_token_import(imp: &ImportRef) -> bool {
    imp.imported.as_ref() == "token" && imp.specifier.as_ref().starts_with("@reference-ui/")
}

/// A `token()` call's validated arguments: path plus optional fallback.
pub struct TokenArgs<'a, 'b> {
    /// The path argument, peeled of transparent wrappers.
    pub path: &'b Expression<'a>,
    /// The fallback argument, if any, peeled of transparent wrappers.
    pub fallback: Option<&'b Expression<'a>>,
}

/// Validate a call's arguments: one path plus an optional fallback, no spreads.
pub fn token_args<'a, 'b>(call: &'b CallExpression<'a>) -> Result<TokenArgs<'a, 'b>, TokenRefusal> {
    let mut exprs = Vec::with_capacity(call.arguments.len());
    for arg in &call.arguments {
        let Some(expr) = arg.as_expression() else {
            return Err(TokenRefusal::at(TokenReason::Arity, arg.span()));
        };
        exprs.push(peel_wrappers(expr));
    }
    if exprs.len() != 1 && exprs.len() != 2 {
        return Err(TokenRefusal::at(TokenReason::Arity, Span::default()));
    }
    Ok(TokenArgs {
        path: exprs[0],
        fallback: exprs.get(1).copied(),
    })
}

/// A path or fallback argument: a literal spelling or an identifier to resolve.
pub enum TokenOperand<'a> {
    /// A literal spelling, ready to use.
    Literal(String),
    /// An identifier whose recorded leaves must answer.
    Name(&'a str),
    /// The argument refuses with this reason.
    Refused(TokenReason),
}

/// Classify a path argument: string literal, interpolation-free template,
/// identifier, or refused. Interpolated templates refuse until the template
/// fold (SPEC-V2-67) lands to compose with.
pub fn classify_path<'a>(path: &Expression<'a>) -> TokenOperand<'a> {
    match path {
        Expression::StringLiteral(lit) => string_path(lit.value.as_str()),
        Expression::TemplateLiteral(lit) => classify_static_template(lit),
        Expression::Identifier(ident) => TokenOperand::Name(ident.name.as_str()),
        _ => TokenOperand::Refused(TokenReason::Path),
    }
}

/// A string path spelling, or an empty-path refusal.
fn string_path(spelling: &str) -> TokenOperand<'_> {
    if spelling.trim().is_empty() {
        return TokenOperand::Refused(TokenReason::EmptyPath);
    }
    TokenOperand::Literal(spelling.to_string())
}

/// An interpolation-free template path, or a refusal for anything else.
fn classify_static_template<'a>(lit: &oxc_ast::ast::TemplateLiteral<'a>) -> TokenOperand<'a> {
    if lit.expressions.is_empty() && lit.quasis.len() == 1 {
        if let Some(cooked) = lit.quasis[0].value.cooked.as_ref() {
            return string_path(cooked.as_str());
        }
    }
    TokenOperand::Refused(TokenReason::Path)
}

/// Classify a fallback argument: string/number literal, identifier, or refused.
pub fn classify_fallback<'a>(fallback: &Expression<'a>) -> TokenOperand<'a> {
    match fallback {
        Expression::StringLiteral(lit) => TokenOperand::Literal(lit.value.to_string()),
        Expression::NumericLiteral(n) => TokenOperand::Literal(n.value.to_string()),
        Expression::Identifier(ident) => TokenOperand::Name(ident.name.as_str()),
        _ => TokenOperand::Refused(TokenReason::Fallback),
    }
}

/// Resolve a path operand against recorded leaves: exactly one const string.
/// An empty const string refuses as empty; a folded reference (`{path}`)
/// is not a path name and refuses; anything else refuses as a path.
pub fn resolve_path_operand(operand: TokenOperand<'_>, leaves: &[AtomValue]) -> Option<String> {
    if let TokenOperand::Literal(spelling) = operand {
        return Some(spelling);
    }
    if !matches!(operand, TokenOperand::Name(_)) {
        return None;
    }
    single_path_string(leaves)
}

/// Exactly one const string leaf that is neither empty nor a folded reference.
fn single_path_string(leaves: &[AtomValue]) -> Option<String> {
    if leaves.len() != 1 {
        return None;
    }
    match &leaves[0] {
        AtomValue::String(s) if !s.trim().is_empty() && !s.trim().starts_with('{') => {
            Some(s.to_string())
        }
        _ => None,
    }
}

/// The refusal reason for an identifier path that did not resolve.
pub fn path_leaves_reason(leaves: &[AtomValue]) -> TokenReason {
    let empty = leaves
        .iter()
        .any(|leaf| matches!(leaf, AtomValue::String(s) if s.trim().is_empty()));
    if empty {
        TokenReason::EmptyPath
    } else {
        TokenReason::Path
    }
}

/// Resolve a fallback operand against recorded leaves: exactly one const
/// string or number.
pub fn resolve_fallback_operand(operand: TokenOperand<'_>, leaves: &[AtomValue]) -> Option<String> {
    if let TokenOperand::Literal(spelling) = operand {
        return Some(spelling);
    }
    if !matches!(operand, TokenOperand::Name(_)) {
        return None;
    }
    single_fallback_string(leaves)
}

/// Exactly one const string or number leaf, rendered.
fn single_fallback_string(leaves: &[AtomValue]) -> Option<String> {
    if leaves.len() != 1 {
        return None;
    }
    match &leaves[0] {
        AtomValue::String(s) => Some(s.to_string()),
        AtomValue::Number(n) => Some(n.to_string()),
        _ => None,
    }
}

/// A folded path and fallback as a value: `{path}` alone, or the path
/// carrying its fallback for resolve to honor on a dictionary miss.
pub fn shape_value(path: &str, fallback: Option<String>) -> AtomValue {
    match fallback {
        Some(value) => AtomValue::Token {
            path: path.to_string().into_boxed_str(),
            value: value.into_boxed_str(),
        },
        None => AtomValue::String(format!("{{{path}}}").into_boxed_str()),
    }
}
