//! Spread recording for const objects: direct, member, and branching.
//!
//! [`record_spread`] copies a static spread's entries verbatim — an
//! identifier's recorded object, an inline object, or a member path's nested
//! entries — while [`union_spread_arms`] unions every resolvable arm of a
//! conditional or logical spread (SPEC-V2-24). Same-key leaves concatenate —
//! dropping an arm would lose keys the runtime spread carries — so a spread
//! of `cond ? { color: 'red' } : { color: 'blue' }` records both colors and
//! the use site lowers both, exactly like the top-level walk. The origin fill
//! answers identifier spreads of imports from their origin values; refused
//! ones record residue markers instead of dropping silently.

use oxc_ast::ast::{Expression, StaticMemberExpression};
use oxc_span::{GetSpan, Span};

use super::binding::BindingKind;
use super::fill::OriginFill;
use super::lookup::{ImportLookup, ScopeChain};
use super::table::{ScopeId, ScopeTable};
use super::value::{object_binding, object_init, peel, DepKey, EntrySink, KeyProvenance};
use crate::extract::constants::{union_entry, ConstObject, LocalConstants};
use crate::extract::expressions::walk::is_guard_expression;
use crate::extract::resolver::{reason_text, RefusalCtx, UnfoldableSpread, ValueRefused};

/// What one spread records against: the table, the use scope, and the
/// origin fill answering imports. Without a fill, imports stay out.
#[derive(Debug, Clone, Copy)]
pub(crate) struct SpreadCtx<'t, 'v> {
    /// Bindings recorded so far.
    pub table: &'t ScopeTable,
    /// The scope the spread sits in.
    pub scope: ScopeId,
    /// The origin file's resolved imports, when baking one.
    pub fill: Option<OriginFill<'v>>,
}

/// One import spread answered through the fill: merged or marked.
enum FillOutcome {
    /// The origin value to merge, with its transitive markers.
    Resolved {
        /// The origin object to merge, when the value carries one.
        object: Option<ConstObject>,
        /// Markers riding the origin value, still true and located.
        markers: Vec<UnfoldableSpread>,
    },
    /// The import refused; the marker the use site diagnoses.
    Marked(UnfoldableSpread),
}

/// Copy a static spread's entries verbatim; branching spreads union every
/// resolvable arm; other spreads stay out.
pub(crate) fn record_spread(
    argument: &Expression<'_>,
    ctx: SpreadCtx<'_, '_>,
    sink: &mut EntrySink,
) {
    let spread = peel(argument);
    if record_direct_spread(spread, ctx, sink) {
        return;
    }
    record_branching_spread(spread, ctx, sink);
    // Calls never spread statically.
}

/// A direct spread: an identifier's recorded object, an inline object, or a
/// member path's nested entries. True when the shape matched, resolved or not.
fn record_direct_spread(
    spread: &Expression<'_>,
    ctx: SpreadCtx<'_, '_>,
    sink: &mut EntrySink,
) -> bool {
    if let Expression::Identifier(id) = spread {
        // { ...base }  after  const base = { mt: '2r' }
        record_ident_spread(id.name.as_str(), spread.span(), ctx, sink);
        return true;
    }
    if let Expression::ObjectExpression(inner) = spread {
        // { ...{ mt: '2r' } }  — inline spreads recurse with their provenance
        let inner_sink = object_init(inner, ctx.table, ctx.scope, ctx.fill);
        sink.provenances.extend(inner_sink.provenances);
        sink.residues.extend(inner_sink.residues);
        sink.entries.extend(inner_sink.entries);
        return true;
    }
    if let Expression::StaticMemberExpression(mem) = spread {
        // { ...styles.hover }  — the nested entries copy verbatim (§13)
        record_member_spread(mem, ctx.table, ctx.scope, sink);
        return true;
    }
    false
}

/// Spread one identifier: its recorded object, else its fill outcome.
fn record_ident_spread(name: &str, span: Span, ctx: SpreadCtx<'_, '_>, sink: &mut EntrySink) {
    if let Some((src_scope, map)) = object_binding(ctx.table, ctx.scope, name) {
        for (key, prop) in map {
            push_spread_provenance(sink, &key, src_scope, name);
            sink.entries.insert(key, prop);
        }
    } else if let Some(outcome) = fill_spread(ctx, name, span) {
        merge_fill_outcome(outcome, sink, false);
    }
}

/// Merge one fill outcome: entries by overwrite or union, markers always.
fn merge_fill_outcome(outcome: FillOutcome, sink: &mut EntrySink, union: bool) {
    match outcome {
        FillOutcome::Resolved { object, markers } => {
            sink.residues.extend(markers);
            merge_fill_object(object, sink, union);
        }
        FillOutcome::Marked(marker) => sink.residues.push(marker),
    }
}

/// Merge one fill object by overwrite or union into the sink.
fn merge_fill_object(object: Option<ConstObject>, sink: &mut EntrySink, union: bool) {
    let Some(map) = object else {
        return;
    };
    for (key, prop) in map {
        if union {
            union_entry(&mut sink.entries, key, prop);
        } else {
            sink.entries.insert(key, prop);
        }
    }
}

/// One import spread through the fill: merge, mark, or stay out.
/// Same-file bindings and unbound names never reach the maps.
fn fill_spread(ctx: SpreadCtx<'_, '_>, name: &str, span: Span) -> Option<FillOutcome> {
    let fill = ctx.fill?;
    let (_, binding) = ctx.table.resolve_from(name, ctx.scope)?;
    let BindingKind::Import(import) = &binding.kind else {
        return None;
    };
    if let Some(export) = fill.resolved.get(name) {
        return Some(FillOutcome::Resolved {
            object: export.object().cloned(),
            markers: export.unfoldable().to_vec(),
        });
    }
    let refused = fill.refused.get(name)?;
    let site = MarkerSite {
        fill,
        import,
        name,
        span,
    };
    Some(FillOutcome::Marked(spread_marker(site, refused)))
}

/// Everything one residue marker needs beyond the refusal itself.
struct MarkerSite<'i> {
    /// The origin file's fill, for file names and line numbers.
    fill: OriginFill<'i>,
    /// The authored import edge, for reason wording.
    import: &'i super::binding::ImportRef,
    /// The spread name as authored in the origin file.
    name: &'i str,
    /// The spread's span, for the marker line.
    span: Span,
}

/// The residue marker for one refused import spread.
fn spread_marker(site: MarkerSite<'_>, refused: &ValueRefused) -> UnfoldableSpread {
    let ctx = RefusalCtx {
        specifier: site.import.specifier.as_ref(),
        imported: site.import.imported.as_ref(),
    };
    UnfoldableSpread::new(
        site.name,
        site.fill.file,
        line_of(site.fill.content, site.span),
        reason_text(refused, &ctx),
    )
}

/// The 1-based line of a span's start in its file's content.
fn line_of(content: &str, span: Span) -> u32 {
    crate::diagnostics::line_col(content, span.start)
        .map(|(line, _)| line)
        .unwrap_or(1)
}

/// A branching spread: conditionals union both arms, logicals union the
/// non-guard operands. Anything else is not a spread shape at all.
fn record_branching_spread(spread: &Expression<'_>, ctx: SpreadCtx<'_, '_>, sink: &mut EntrySink) {
    if let Expression::ConditionalExpression(cond) = spread {
        // { ...(c ? a : b) }  — union every arm that resolves (SPEC-V2-24)
        union_spread_arms(&[&cond.consequent, &cond.alternate], ctx, sink);
        return;
    }
    if let Expression::LogicalExpression(log) = spread {
        // { ...(u && a) }  — non-guard operands union, as walked
        union_spread_arms(&logical_arms(log), ctx, sink);
    }
}

/// The non-guard operands of a logical spread, as the walk lowers them.
fn logical_arms<'a, 'b>(log: &'b oxc_ast::ast::LogicalExpression<'a>) -> Vec<&'b Expression<'a>> {
    [&log.left, &log.right]
        .into_iter()
        .filter(|side| !is_guard_expression(side))
        .collect()
}

/// Union every resolvable arm of a branching spread into the sink.
///
/// The caller filters logical operands for guards first; conditional arms
/// arrive whole. Calls, member paths, and non-object arms stay out: calls
/// never spread statically, and member paths union only as direct spreads
/// (`record_spread`), never as branch arms.
pub(crate) fn union_spread_arms(
    arms: &[&Expression<'_>],
    ctx: SpreadCtx<'_, '_>,
    sink: &mut EntrySink,
) {
    for arm in arms {
        union_one_arm(arm, ctx, sink);
    }
}

/// Union one spread arm: an inline object, a named object, or nothing.
fn union_one_arm(arm: &Expression<'_>, ctx: SpreadCtx<'_, '_>, sink: &mut EntrySink) {
    let arm = super::value::peel(arm);
    if let Expression::ObjectExpression(obj) = arm {
        union_inline_arm(obj, ctx, sink);
        return;
    }
    if let Expression::Identifier(id) = arm {
        union_ident_arm(id.name.as_str(), arm.span(), ctx, sink);
    }
}

/// Union one inline-object arm, recursing with its provenance.
fn union_inline_arm(
    obj: &oxc_ast::ast::ObjectExpression<'_>,
    ctx: SpreadCtx<'_, '_>,
    sink: &mut EntrySink,
) {
    let inner_sink = object_init(obj, ctx.table, ctx.scope, ctx.fill);
    sink.provenances.extend(inner_sink.provenances);
    sink.residues.extend(inner_sink.residues);
    union_sink_entries(sink, inner_sink.entries);
}

/// Union one identifier arm's recorded object, with per-key provenance.
fn union_ident_arm(target: &str, span: Span, ctx: SpreadCtx<'_, '_>, sink: &mut EntrySink) {
    if let Some((src_scope, map)) = object_binding(ctx.table, ctx.scope, target) {
        for (key, prop) in map {
            push_spread_provenance(sink, &key, src_scope, target);
            union_entry(&mut sink.entries, key, prop);
        }
    } else if let Some(outcome) = fill_spread(ctx, target, span) {
        merge_fill_outcome(outcome, sink, true);
    }
}

/// Union resolved entries into the sink one key at a time.
fn union_sink_entries(sink: &mut EntrySink, entries: ConstObject) {
    for (key, prop) in entries {
        union_entry(&mut sink.entries, key, prop);
    }
}

/// Copy a member-hop spread's nested entries verbatim, with whole-root
/// provenance: any write to the root strips every copied entry, matching
/// the poison member inits carry. Unresolvable paths stay out.
pub(crate) fn record_member_spread(
    mem: &StaticMemberExpression<'_>,
    table: &ScopeTable,
    scope: ScopeId,
    sink: &mut EntrySink,
) {
    let Some((src_scope, root, map)) = member_spread_object(table, scope, mem) else {
        return;
    };
    for (key, prop) in map {
        sink.provenances.push(KeyProvenance {
            key: key.clone(),
            src_scope,
            src_name: root.clone(),
            src_key: None,
        });
        sink.entries.insert(key, prop);
    }
}

/// The nested entries a member-hop spread names, with the root's scope and
/// name. Resolves table-locally only (no imports), exactly like member inits.
fn member_spread_object(
    table: &ScopeTable,
    scope: ScopeId,
    mem: &StaticMemberExpression<'_>,
) -> Option<(ScopeId, String, ConstObject)> {
    let root = crate::extract::fold::member_root_name(mem)?;
    let empty = LocalConstants::default();
    let chain = ScopeChain::new(table, ImportLookup::ProjectBag(&empty));
    let entries = crate::extract::fold::member_path_object(mem, chain.at(scope))?;
    let (src_scope, _) = table.resolve_from(root, scope)?;
    Some((src_scope, root.to_string(), entries.clone()))
}

/// Provenance for one copied spread entry: the source object and key.
pub(crate) fn push_spread_provenance(
    sink: &mut EntrySink,
    key: &str,
    src_scope: ScopeId,
    src_name: &str,
) {
    sink.provenances.push(KeyProvenance {
        key: key.to_string(),
        src_scope,
        src_name: src_name.to_string(),
        src_key: Some(DepKey::ObjectKey(key.to_string())),
    });
}
