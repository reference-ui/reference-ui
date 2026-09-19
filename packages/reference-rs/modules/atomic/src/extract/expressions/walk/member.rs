//! Member reads in value position: static paths, computed keys, and chains.
//! Static member paths resolve through the recorded const objects, computed
//! reads fold each resolving key with one diagnostic per refusal, and
//! optional chains fold their computed links while member links unwrap over
//! known bases. A mutated root names its write; anything else warns exactly
//! like any other dynamic leaf, with siblings kept.

use oxc_ast::ast::{ChainExpression, ComputedMemberExpression, StaticMemberExpression};
use smallvec::SmallVec;

use super::{leaf::mutated_warn, DynamicRefusal, ExpressionWalk};
use crate::diagnostics::DiagnosticCode;

pub(crate) fn handle_static_member(
    ctx: &mut ExpressionWalk<'_>,
    mem: &StaticMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let leaves = crate::extract::fold::member_path_leaves(mem, ctx.scopes);
    if !leaves.is_empty() {
        // color={theme.primary}  /  color={tokens.colors.red}  /  tokens!.color
        for val in leaves {
            ctx.push_want(val.clone(), when.clone(), false, Some(mem.span));
        }
        if crate::extract::fold::member_path_residue(mem, ctx.scopes) {
            let path = crate::extract::fold::member_path_text(mem);
            ctx.warn(
                mem.span,
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        return;
    }
    if let Some(root) = crate::extract::fold::member_root_name(mem) {
        let path = crate::extract::fold::member_path_text(mem);
        if mutated_warn(ctx, root, mem.span, &format!("'{path}' is stale")) {
            // color={theme.primary}  after  theme.primary = 'blue'
            return;
        }
    }
    // width={props.w}
    let prop = ctx.prop;
    ctx.warn_dynamic(DynamicRefusal {
        span: mem.span,
        code: DiagnosticCode::DynamicMember,
        message: format!("Dynamic non-literal expression encountered for prop '{prop}'"),
        when,
    });
}

/// Fold one computed read: each resolving key pushes its leaves, each
/// refusal warns once with the key or side named. Holes omit silently.
pub(crate) fn handle_computed_member(
    ctx: &mut ExpressionWalk<'_>,
    mem: &ComputedMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    use crate::extract::fold::{describe_base, describe_snippet, fold_element_access};
    let fold = fold_element_access(&mem.object, &mem.expression, ctx.scopes);
    for val in &fold.values {
        ctx.push_want(val.clone(), when.clone(), false, Some(mem.span));
    }
    if fold.residue {
        let prop = ctx.prop;
        let base = describe_base(&mem.object);
        let index = describe_snippet(&mem.expression, ctx.source);
        ctx.warn(
            mem.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "Element access '{base}[{index}]' drops a dynamic arm with no static style value for prop '{prop}'"
            ),
        );
    }
    if fold.refusals.is_empty() {
        return;
    }
    let prop = ctx.prop;
    let base = describe_base(&mem.object);
    let index = describe_snippet(&mem.expression, ctx.source);
    for refusal in &fold.refusals {
        ctx.warn_dynamic(DynamicRefusal {
            span: refusal.span(mem.span),
            code: refusal.code(),
            message: refusal.message(prop, &base, &index),
            when,
        });
    }
}

/// Fold an optional chain: computed links fold at SITE-48, static member
/// links unwrap over known bases (SITE-34), and every other chain shape
/// warns exactly like any other dynamic leaf.
pub(crate) fn handle_chain(
    ctx: &mut ExpressionWalk<'_>,
    chain: &ChainExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let oxc_ast::ast::ChainElement::ComputedMemberExpression(mem) = &chain.expression {
        // sizes?.[k]  — optionality never changes the static fold
        handle_computed_member(ctx, mem, when);
        return;
    }
    // tokens?.color  /  t?.colors?.red  — transparent over known bases
    let values = crate::extract::fold::fold_chain(chain, ctx.scopes);
    if !values.is_empty() {
        for val in &values {
            ctx.push_want(val.clone(), when.clone(), false, Some(chain.span));
        }
        if let Some(path) = crate::extract::fold::chain_residue_path(chain, ctx.scopes) {
            ctx.warn(
                chain.span,
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        return;
    }
    // maybe?.foo  /  getColor?.()  — dynamic, warn, keep siblings
    let prop = ctx.prop;
    ctx.warn_dynamic(DynamicRefusal {
        span: chain.span,
        code: DiagnosticCode::DynamicExpression,
        message: format!("Dynamic non-literal expression encountered for prop '{prop}'"),
        when,
    });
}
