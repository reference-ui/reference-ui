//! Handles built-in TypeScript utility types during resolution.
//! 
//! This module resolves utility types like `Omit`, `Pick`, `Extract`, and `Exclude`,
//! as well as Reference-specific builtins like `ConditionalValue` or `StylePropValue`.
//! It intercepts these names and applies their specific resolution logic.

use std::collections::BTreeSet;

use crate::resolver::error::StyleTraceError;
use crate::resolver::model::TypeExpr;

use super::context::TraceContext;
use super::resolve::{resolve_prop_names, resolve_literal_names};

pub fn resolve_builtin_props(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    match name {
        "Omit" => resolve_omit_props(ctx, args),
        "Pick" => resolve_pick_props(ctx, args),
        "Nested" | "Pretty" | "ConditionalValue" | "StylePropValue" | "WithEscapeHatch"
        | "OnlyKnown" => resolve_pass_through(ctx, args),
        "Assign" | "DistributiveUnion" => resolve_union_props(ctx, args),
        "Partial" | "Required" | "Readonly" | "Array" => resolve_pass_through(ctx, args),
        _ => Ok(None),
    }
}

fn resolve_omit_props(
    ctx: &mut TraceContext<'_>,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let Some(target) = args.first() else {
        return Ok(Some(BTreeSet::new()));
    };
    let mut names = resolve_prop_names(ctx, target)?;
    if let Some(keys) = args.get(1) {
        for key in resolve_literal_names(ctx, keys)? {
            names.remove(&key);
        }
    }
    Ok(Some(names))
}

fn resolve_pick_props(
    ctx: &mut TraceContext<'_>,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let Some(target) = args.first() else {
        return Ok(Some(BTreeSet::new()));
    };
    let names = resolve_prop_names(ctx, target)?;
    let keys = args
        .get(1)
        .map(|expr| resolve_literal_names(ctx, expr))
        .transpose()?
        .unwrap_or_default();
    Ok(Some(names.intersection(&keys).cloned().collect()))
}

fn resolve_pass_through(
    ctx: &mut TraceContext<'_>,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let Some(target) = args.first() else {
        return Ok(Some(BTreeSet::new()));
    };
    Ok(Some(resolve_prop_names(ctx, target)?))
}

fn resolve_union_props(
    ctx: &mut TraceContext<'_>,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    let mut names = BTreeSet::new();
    if let Some(left) = args.first() {
        names.extend(resolve_prop_names(ctx, left)?);
    }
    if let Some(right) = args.get(1) {
        names.extend(resolve_prop_names(ctx, right)?);
    }
    Ok(Some(names))
}

pub fn resolve_builtin_literals(
    ctx: &mut TraceContext<'_>,
    name: &str,
    args: &[TypeExpr],
) -> Result<Option<BTreeSet<String>>, StyleTraceError> {
    match name {
        "Extract" => {
            let left = args
                .first()
                .map(|expr| resolve_literal_names(ctx, expr))
                .transpose()?
                .unwrap_or_default();
            let right = args
                .get(1)
                .map(|expr| resolve_literal_names(ctx, expr))
                .transpose()?
                .unwrap_or_default();
            Ok(Some(left.intersection(&right).cloned().collect()))
        }
        "Exclude" => {
            let left = args
                .first()
                .map(|expr| resolve_literal_names(ctx, expr))
                .transpose()?
                .unwrap_or_default();
            let right = args
                .get(1)
                .map(|expr| resolve_literal_names(ctx, expr))
                .transpose()?
                .unwrap_or_default();
            Ok(Some(left.difference(&right).cloned().collect()))
        }
        _ => Ok(None),
    }
}
