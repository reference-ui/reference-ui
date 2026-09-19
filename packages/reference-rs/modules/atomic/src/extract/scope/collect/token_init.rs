//! `token()` declarator inits: what `const c = token('colors.red.500')` carries.
//! A `token()` init records its folded reference — the path plus an optional
//! fallback shaped exactly like the value walkers fold — so the const
//! resolves at its uses. Only already-recorded same-file consts answer for
//! identifier paths and fallbacks, with provenance deps keeping later writes
//! from going stale. An unbound callee records optimistically for a forward
//! import and verifies after the visit; anything else records nothing.

use super::super::binding::{BindingInit, BindingKind};
use super::super::table::{ScopeId, ScopeTable};
use super::super::value::{self, Dep, DepKey};
use super::ScopeCollector;

/// A `token()` init records its folded reference, with provenance deps.
///
/// `const c = token('colors.red.500')` carries `'{colors.red.500}'`, and a
/// fallback rides the Token value — the same shapes the value walkers fold,
/// so the const resolves at its uses. Only already-recorded same-file consts
/// answer for identifier paths and fallbacks; the deps keep a later write
/// from going stale. An unbound callee records optimistically for a forward
/// import and verifies after the visit; anything else records nothing.
pub(crate) fn token_init(
    collector: &mut ScopeCollector<'_>,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::CallExpression(call) = peeled else {
        return None;
    };
    let (args, local) = match token_init_head(call) {
        TokenInitHead::Fold(args, local) => (args, local),
        TokenInitHead::Valueless => return Some((None, Vec::new())),
        TokenInitHead::NotACall => return None,
    };
    let scope = collector.current();
    if !token_init_verify(collector, scope, name, local) {
        return None;
    }
    let mut deps = Vec::new();
    let ctx = TokenInitCtx {
        table: &collector.table,
        scope,
        name,
    };
    let Some(value) = token_init_value(&ctx, &args, &mut deps) else {
        return Some((None, Vec::new()));
    };
    Some((Some(BindingInit::Scalars(vec![value])), deps))
}

/// Fold a validated call's path and fallback to its carried value.
fn token_init_value(
    ctx: &TokenInitCtx<'_>,
    args: &crate::extract::fold::TokenArgs<'_, '_>,
    deps: &mut Vec<Dep>,
) -> Option<crate::atom::AtomValue> {
    use crate::extract::fold::shape_value;
    let path = token_init_operand(ctx, args.path, true, deps)?;
    let mut fallback = None;
    if let Some(expr) = args.fallback {
        fallback = Some(token_init_operand(ctx, expr, false, deps)?);
    }
    Some(shape_value(&path, fallback))
}

/// A `token()` init call head: foldable, valueless, or not a token call.
enum TokenInitHead<'a, 'b> {
    /// A bound name plus validated args, ready to fold.
    Fold(crate::extract::fold::TokenArgs<'a, 'b>, &'a str),
    /// A foreign member or bad arity: record nothing and shadow.
    Valueless,
    /// Not a token call shape at all: fall through to the next init kind.
    NotACall,
}

/// Validate a `token()` init call's callee shape and arity.
fn token_init_head<'a, 'b>(call: &'b oxc_ast::ast::CallExpression<'a>) -> TokenInitHead<'a, 'b> {
    use crate::extract::fold::{token_args, token_callee, TokenCallee};
    let Some(callee) = token_callee(&call.callee) else {
        return TokenInitHead::NotACall;
    };
    let local = match callee {
        TokenCallee::Bare(local) | TokenCallee::Var(local) => local,
        TokenCallee::Foreign { .. } => return TokenInitHead::Valueless,
    };
    match token_args(call) {
        Ok(args) => TokenInitHead::Fold(args, local),
        Err(_) => TokenInitHead::Valueless,
    }
}

/// What the callee check decided for a `token()` init.
enum TokenCalleeStatus {
    /// Import-bound already: record.
    Bound,
    /// Unbound yet: record optimistically, verify after the visit.
    Forward,
    /// Shadowed or foreign: not a token call.
    Refused,
}

/// Verify a `token()` init callee: bound records, forward records with a
/// post-visit wait, and refused (shadowed or foreign) answers false.
fn token_init_verify(
    collector: &mut ScopeCollector<'_>,
    scope: ScopeId,
    name: &str,
    local: &str,
) -> bool {
    match token_callee_status(&collector.table, scope, local) {
        TokenCalleeStatus::Refused => false,
        TokenCalleeStatus::Forward => {
            collector.token_waits.push(super::TokenWait {
                scope,
                name: name.to_string(),
                callee: local.to_string(),
            });
            true
        }
        TokenCalleeStatus::Bound => true,
    }
}

/// Check a `token()` init callee against the table: bound, forward, or refused.
fn token_callee_status(table: &ScopeTable, scope: ScopeId, local: &str) -> TokenCalleeStatus {
    use crate::extract::fold::is_token_import;
    let Some((_, binding)) = table.resolve_from(local, scope) else {
        return TokenCalleeStatus::Forward;
    };
    if matches!(&binding.kind, BindingKind::Import(imp) if is_token_import(imp)) {
        TokenCalleeStatus::Bound
    } else {
        TokenCalleeStatus::Refused
    }
}

/// Where a `token()` init records: the table, scope, and binding name.
struct TokenInitCtx<'a> {
    table: &'a ScopeTable,
    scope: ScopeId,
    name: &'a str,
}

/// One `token()` init operand: literals fold, recorded consts resolve with a
/// provenance dep, and anything else refuses the init.
fn token_init_operand(
    ctx: &TokenInitCtx<'_>,
    expr: &oxc_ast::ast::Expression<'_>,
    is_path: bool,
    deps: &mut Vec<Dep>,
) -> Option<String> {
    use crate::extract::fold::{
        classify_fallback, classify_path, resolve_fallback_operand, resolve_path_operand,
        TokenOperand,
    };
    let operand = if is_path {
        classify_path(expr)
    } else {
        classify_fallback(expr)
    };
    let TokenOperand::Name(target) = operand else {
        return match operand {
            TokenOperand::Literal(spelling) => Some(spelling),
            TokenOperand::Refused(_) | TokenOperand::Name(_) => None,
        };
    };
    let (src_scope, binding) = ctx.table.resolve_from(target, ctx.scope)?;
    let BindingInit::Scalars(leaves) = binding.init.as_ref()? else {
        return None;
    };
    let resolved = if is_path {
        resolve_path_operand(TokenOperand::Name(target), leaves)
    } else {
        resolve_fallback_operand(TokenOperand::Name(target), leaves)
    }?;
    deps.push(Dep {
        scope: ctx.scope,
        name: ctx.name.to_string(),
        key: DepKey::Whole,
        src_scope,
        src_name: target.to_string(),
        src_key: None,
    });
    Some(resolved)
}
