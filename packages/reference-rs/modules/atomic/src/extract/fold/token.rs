//! The `token()` / `token.var()` call surface, evaluated our way (SPEC-V2-61).
//!
//! A call folds only when its callee binds to a `token` import from a
//! Reference package. The path folds to a `{path}` reference — never a
//! parse-time hex — so the value stays live under theme switches; an
//! unknown path with a fallback carries the fallback, and without one the
//! reference errors at resolve with no ghost. Aliased imports fold by
//! imported name; shadowed or foreign callees are not token calls at all,
//! so the generic dynamic diagnostic answers. Both walkers fold through
//! [`fold_token_call`]; binding inits compose the shared matchers in
//! `token_shape.rs`, so a `token()` const resolves at its uses.
//! Pure-helper application lives in `call.rs` (SPEC-V2-39).

use oxc_ast::ast::{CallExpression, Expression};
use oxc_span::{GetSpan, Span};

use super::token_shape::{
    classify_fallback, classify_path, is_token_import, path_leaves_reason,
    resolve_fallback_operand, resolve_path_operand, shape_value, token_args, token_callee,
    TokenCallee, TokenOperand,
};
use crate::atom::AtomValue;
use crate::diagnostics::DiagnosticCode;
use crate::extract::scope::Scoped;

/// What one `token()` call folded to: a value, a refusal, or not a token call.
pub struct TokenFold {
    /// The folded reference (`{path}`) or path-plus-fallback token value.
    pub value: Option<AtomValue>,
    /// Why a token call refused, with the offending span.
    pub refusal: Option<TokenRefusal>,
}

/// One refused `token()` call: its span and what stopped the fold.
pub struct TokenRefusal {
    span: Span,
    reason: TokenReason,
}

/// Why a `token()` call refused to fold.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenReason {
    /// `token.foo(...)` — only bare and `.var` callees fold.
    Surface,
    /// Arity or spread args.
    Arity,
    /// Empty or whitespace-only path.
    EmptyPath,
    /// Non-literal, template, or multi-leaf path.
    Path,
    /// Non-literal or multi-leaf fallback.
    Fallback,
}

impl TokenRefusal {
    /// A refusal at an explicit span.
    pub fn at(reason: TokenReason, span: Span) -> Self {
        Self { span, reason }
    }

    /// The diagnostic code for a refused `token()` call.
    pub fn code(&self) -> DiagnosticCode {
        DiagnosticCode::TokenCallRefused
    }

    /// The span of the offending argument, or the call itself.
    pub fn span(&self, call: Span) -> Span {
        if self.span == Span::default() {
            call
        } else {
            self.span
        }
    }

    /// The refusal message for a style prop.
    pub fn message(&self, prop: &str) -> String {
        match self.reason {
            TokenReason::Surface => {
                format!("token() surface is token(path) and token.var(path) for prop '{prop}'")
            }
            TokenReason::Arity => {
                format!("token() takes a path and an optional fallback for prop '{prop}'")
            }
            TokenReason::EmptyPath => {
                format!("token() path must not be empty for prop '{prop}'")
            }
            TokenReason::Path => {
                format!("token() path must be a string literal or const string for prop '{prop}'")
            }
            TokenReason::Fallback => {
                format!("token() fallback must be a string or number literal for prop '{prop}'")
            }
        }
    }
}

/// Fold one call expression as a `token()` call, or None when the callee is
/// not a Reference `token` import (the generic dynamic path answers those).
pub fn fold_token_call(call: &CallExpression<'_>, scoped: Scoped<'_>) -> Option<TokenFold> {
    let callee = token_callee(&call.callee)?;
    let name = callee_name(&callee);
    if !scoped.import_ref(name).is_some_and(is_token_import) {
        return None;
    }
    if let TokenCallee::Foreign { span, .. } = callee {
        return Some(refused(TokenReason::Surface, span));
    }
    let args = match token_args(call) {
        Ok(args) => args,
        Err(refusal) => {
            return Some(TokenFold {
                value: None,
                refusal: Some(refusal),
            });
        }
    };
    let Some(path) = fold_scoped_path(args.path, scoped) else {
        return Some(refused(path_reason(args.path, scoped), args.path.span()));
    };
    let Some(fallback_expr) = args.fallback else {
        return Some(TokenFold {
            value: Some(shape_value(&path, None)),
            refusal: None,
        });
    };
    let Some(fallback) = fold_scoped_fallback(fallback_expr, scoped) else {
        return Some(refused(TokenReason::Fallback, fallback_expr.span()));
    };
    Some(TokenFold {
        value: Some(shape_value(&path, Some(fallback))),
        refusal: None,
    })
}

/// A refused fold with no value.
fn refused(reason: TokenReason, span: Span) -> TokenFold {
    TokenFold {
        value: None,
        refusal: Some(TokenRefusal::at(reason, span)),
    }
}

/// The local name a token callee shape must bind.
fn callee_name<'a>(callee: &TokenCallee<'a>) -> &'a str {
    match callee {
        TokenCallee::Bare(name) | TokenCallee::Var(name) => name,
        TokenCallee::Foreign { name, .. } => name,
    }
}

/// A path argument through the scope chain: literals fold, identifiers
/// resolve to exactly one const string.
fn fold_scoped_path(path: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    match classify_path(path) {
        TokenOperand::Literal(spelling) => Some(spelling),
        TokenOperand::Name(name) => {
            let leaves = scoped.scalar_leaves(name);
            resolve_path_operand(TokenOperand::Name(name), leaves)
        }
        TokenOperand::Refused(_) => None,
    }
}

/// The refusal reason for a path that did not fold through the chain.
fn path_reason(path: &Expression<'_>, scoped: Scoped<'_>) -> TokenReason {
    match classify_path(path) {
        TokenOperand::Name(name) => path_leaves_reason(scoped.scalar_leaves(name)),
        TokenOperand::Refused(reason) => reason,
        TokenOperand::Literal(_) => TokenReason::Path,
    }
}

/// A fallback argument through the scope chain: literals fold, identifiers
/// resolve to exactly one const string or number.
fn fold_scoped_fallback(fallback: &Expression<'_>, scoped: Scoped<'_>) -> Option<String> {
    match classify_fallback(fallback) {
        TokenOperand::Literal(spelling) => Some(spelling),
        TokenOperand::Name(name) => {
            let leaves = scoped.scalar_leaves(name);
            resolve_fallback_operand(TokenOperand::Name(name), leaves)
        }
        TokenOperand::Refused(_) => None,
    }
}
