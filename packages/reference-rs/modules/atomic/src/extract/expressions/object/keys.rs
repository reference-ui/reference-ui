//! Style-object keys: static folding, residue warnings, and the `r` prop.
//! Keys fold through the shared key node, so static spellings and single-leaf
//! const keys resolve alike; a folded key that read a partially static entry
//! warns through the residue channel. The `r` prop object maps each key to a
//! container query that scopes its nested styles, refusing unknown names.

use oxc_ast::ast::{ObjectExpression, ObjectPropertyKind, PropertyKey};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::{condition::handle_condition_value, ObjectWalk};
use crate::diagnostics::DiagnosticCode;
use crate::extract::scope::Scoped;
use crate::extract::suggest;
use crate::resolve::r;
use base_system::BreakpointScale;

/// Walk an `r` prop object: each key becomes an `@container` condition wrapping nested styles.
pub fn walk_r_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // r={{ 300: { p: '1r' }, md: { mt: '2r' }, "card/md": { p: '1r' } }}
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            continue;
        };
        let Some(raw_key) = resolve_property_key(&prop.key, ctx.scopes) else {
            continue;
        };
        warn_key_residue(ctx, &prop.key);
        let trimmed = raw_key.trim();
        let Some(query) = resolve_r_key(trimmed, ctx.breakpoints) else {
            // r={{ wat: { p: '1r' } }}
            let help = suggest::suggestion_lines(
                suggest::suggest_breakpoint(trimmed, ctx.breakpoints),
                "use a breakpoint from the theme".to_string(),
            );
            ctx.warn_help(
                prop.key.span(),
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
                help,
            );
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        handle_condition_value(ctx, &prop.value, &nested_when, trimmed);
    }
}

pub(crate) fn resolve_r_key(key: &str, scale: &BreakpointScale) -> Option<String> {
    if let Some((container, bp)) = key.split_once('/') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else if let Some((bp, container)) = key.split_once('@') {
        r::lower_r_key_named(bp.trim(), scale, container.trim())
    } else {
        r::lower_r_key(key, scale)
    }
}

/// Fold a style-object key through the shared key node: static spellings
/// resolve as before, and single-leaf const keys (`[k]`, `[t.p]`) fold to
/// their value. Callers warn `UnfoldableKey` on None with siblings kept.
pub(crate) fn resolve_property_key(key: &PropertyKey<'_>, scoped: Scoped<'_>) -> Option<String> {
    crate::extract::fold::fold_property_key(key, scoped)
}

/// Warn when a folded key read a partially static entry (Ph4 residue
/// channel). Callers run this only after the key folds: a refused key
/// already warns `UnfoldableKey`, never both.
pub(crate) fn warn_key_residue(ctx: &mut ObjectWalk<'_>, key: &PropertyKey<'_>) {
    if let Some(path) = crate::extract::fold::key_entry_residue(key, ctx.scopes) {
        ctx.warn_help(
            key.span(),
            DiagnosticCode::PartialObjectProp,
            format!("property '{path}' drops a dynamic arm with no static style value"),
            vec![format!("make the dynamic arm of '{path}' static or drop it")],
        );
    }
}

#[cfg(test)]
mod tests {
    use crate::{compile, CompileRequest, VirtualSource};

    fn compile_logs(code: &str) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource { path: "test.tsx".into(), content: code.into() }]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    fn channel_for(
        res: &crate::CompileResult,
        code: crate::diagnostics::DiagnosticCode,
    ) -> Vec<crate::Diagnostic> {
        res.compiler_diagnostics
            .as_deref()
            .expect("compiler channel requested")
            .iter()
            .filter(|diag| diag.code == code)
            .cloned()
            .collect()
    }

    /// An unknown `r` key suggests the closest scale name, then the fix.
    #[test]
    fn unknown_breakpoint_help_suggests_scale_name() {
        let res = compile_logs(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ r: { md2: { p: '1r' } } });",
        );
        let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::UnknownBreakpoint);
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec![
                "did you mean `md`?".to_string(),
                "use a breakpoint from the theme".to_string(),
            ])
        );
    }

    /// A far-off `r` key carries the fix line alone, never a wild guess.
    #[test]
    fn unknown_breakpoint_without_candidate_keeps_fix_only() {
        let res = compile_logs(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ r: { zzznope: { p: '1r' } } });",
        );
        let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::UnknownBreakpoint);
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec!["use a breakpoint from the theme".to_string()])
        );
    }

    /// A scalar `r` sub names the authored sub key, not the container query.
    #[test]
    fn scalar_r_value_help_names_the_authored_sub_key() {
        let res = compile_logs(
            "import { css } from '@reference-ui/react';\
             export const cls = css({ r: { md: '1r' } });",
        );
        let hits = channel_for(&res, crate::diagnostics::DiagnosticCode::NonObjectCondition);
        assert_eq!(hits.len(), 1);
        assert_eq!(
            hits[0].help,
            Some(vec!["give condition 'md' a style object".to_string()])
        );
    }
}
