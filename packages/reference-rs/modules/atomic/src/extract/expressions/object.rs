//! Style object property traversal and condition nesting.
//!
//! Handles recursive traversal of JavaScript object literals inside `css({...})` and JSX props.
//! Dispatches condition keys into nested scopes, asks `resolve/r` for `r` prop queries, and
//! creates dedicated `ExpressionWalk` contexts for each style property.

use std::collections::BTreeMap;

use oxc_ast::ast::{
    Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind, PropertyKey, SpreadElement,
};
use oxc_span::{GetSpan, Span};
use smallvec::SmallVec;

use super::walk::{walk_expression, ExpressionWalk};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::{line_col, Diagnostic, DiagnosticCode};
use crate::extract::constants::{ConstObject, ObjectProp};
use crate::extract::scope::Scoped;
use crate::resolve::{conditions::pseudoselectors::has_parent_reference, r};
use base_system::BreakpointScale;
use canon::{is_condition_prop, is_known_style_prop};

/// Context for traversing a style object literal to extract property wants.
pub struct ObjectWalk<'a> {
    pub origin: Option<&'a str>,
    pub important: bool,
    pub file: &'a str,
    pub source: Option<&'a str>,
    pub scopes: Scoped<'a>,
    pub breakpoints: &'a BreakpointScale,
    pub wants: &'a mut Vec<Want>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub authored: Option<&'a mut Vec<crate::runtime::AuthoredDeclaration>>,
}

impl<'a> ObjectWalk<'a> {
    /// Create a child ExpressionWalk context for a specific property.
    pub fn expression_walk<'b>(&'b mut self, prop: &'b str) -> ExpressionWalk<'b> {
        ExpressionWalk {
            prop,
            origin: self.origin,
            important: self.important,
            file: self.file,
            source: self.source,
            scopes: self.scopes,
            breakpoints: self.breakpoints,
            wants: self.wants,
            diagnostics: self.diagnostics,
        }
    }

    /// Report a diagnostic warning at the offending node's span.
    pub fn warn(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::warning(code, message.into()).with_location(self.file, line, column));
    }

    /// Report an info diagnostic at the offending node's span.
    pub fn info(&mut self, span: Span, code: DiagnosticCode, message: impl Into<String>) {
        let (line, column) = self.span_position(Some(span)).unzip();
        self.diagnostics
            .push(Diagnostic::info(code, message.into()).with_location(self.file, line, column));
    }

    /// 1-based line/column for a span, or None without source text.
    fn span_position(&self, span: Option<Span>) -> Option<(u32, u32)> {
        let source = self.source?;
        line_col(source, span?.start)
    }
}

/// Traverse a style object literal, nesting conditions and extracting property leaves.
pub fn walk_style_object(
    ctx: &mut ObjectWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // css({ color: 'red', _hover: { bg: 'n200' }, r: { md: { p: '1r' } } })
    for prop_kind in &obj.properties {
        match prop_kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                // color: 'red'
                handle_object_property(ctx, prop, when);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                // ...{ margin: '10px' }
                handle_spread_property(ctx, spread, when);
            }
        }
    }
}

fn handle_object_property(
    ctx: &mut ObjectWalk<'_>,
    prop: &ObjectProperty<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let Some(key) = resolve_property_key(&prop.key, ctx.scopes) else {
        // { [dynamicKey]: '10px' }
        ctx.warn(
            prop.key.span(),
            DiagnosticCode::UnfoldableKey,
            "Dynamic computed property key encountered in style object",
        );
        return;
    };
    warn_key_residue(ctx, &prop.key);

    if key == "r" {
        if let Expression::ObjectExpression(r_obj) = &prop.value {
            // r: { 300: { p: '1r' }, md: { mt: '2r' } }
            walk_r_object(ctx, r_obj, when);
            return;
        }
    }

    if is_condition_key(&key, ctx.breakpoints) {
        // _hover: { bg: 'n200' }
        let mut nested_when = when.clone();
        nested_when.push(key.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
    } else if is_known_style_prop(&key) {
        // color: 'red'  /  mt: '2r'
        handle_known_style_prop(ctx, &key, &prop.value, when);
    } else {
        // fooBar: 'x' — warn and drop (N12), like the globalCss path.
        ctx.warn(
            prop.key.span(),
            DiagnosticCode::UnknownProperty,
            format!("Unknown style property \"{key}\""),
        );
    }
}

pub(crate) fn is_condition_key(key: &str, breakpoints: &BreakpointScale) -> bool {
    is_condition_prop(key)
        || breakpoints.names().iter().any(|n| n == key)
        || is_breakpoint_range(key, breakpoints)
        || has_parent_reference(key)
}

fn is_breakpoint_range(key: &str, breakpoints: &BreakpointScale) -> bool {
    if key.ends_with("Down") || key.ends_with("Only") {
        return true;
    }
    if let Some((from, to)) = key.split_once("To") {
        if to.eq_ignore_ascii_case("p") || to.starts_with('p') || to.starts_with('P') {
            return false;
        }
        return breakpoints
            .names()
            .iter()
            .any(|n| n.eq_ignore_ascii_case(from))
            || breakpoints
                .names()
                .iter()
                .any(|n| n.eq_ignore_ascii_case(to));
    }
    false
}

fn handle_known_style_prop(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    val_expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(authored) = ctx.authored.as_mut() {
        let when_strings: Vec<String> = when.iter().map(|w| w.to_string()).collect();
        for (val, imp) in super::ast_value::ast_to_json_values(val_expr, ctx.scopes) {
            authored.push(crate::runtime::AuthoredDeclaration {
                when: when_strings.clone(),
                prop: key.to_string(),
                value: val,
                important: ctx.important || imp,
            });
        }
    }
    let mut expr_ctx = ctx.expression_walk(key);
    walk_expression(&mut expr_ctx, val_expr, when);
}

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
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::UnknownBreakpoint,
                format!("Unknown breakpoint name in r prop: \"{trimmed}\""),
            );
            continue;
        };
        let mut nested_when = when.clone();
        nested_when.push(query.into());
        handle_condition_value(ctx, &prop.value, &nested_when);
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
pub(crate) fn resolve_property_key(
    key: &PropertyKey<'_>,
    scoped: Scoped<'_>,
) -> Option<String> {
    crate::extract::fold::fold_property_key(key, scoped)
}

/// Warn when a folded key read a partially static entry (Ph4 residue
/// channel). Callers run this only after the key folds: a refused key
/// already warns `UnfoldableKey`, never both.
pub(crate) fn warn_key_residue(ctx: &mut ObjectWalk<'_>, key: &PropertyKey<'_>) {
    if let Some(path) = crate::extract::fold::key_entry_residue(key, ctx.scopes) {
        ctx.warn(
            key.span(),
            DiagnosticCode::PartialObjectProp,
            format!("property '{path}' drops a dynamic arm with no static style value"),
        );
    }
}

fn handle_condition_value(
    ctx: &mut ObjectWalk<'_>,
    value: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    match value {
        Expression::ObjectExpression(inner_obj) => {
            // _hover: { color: 'red' }
            walk_style_object(ctx, inner_obj, when);
        }
        Expression::ConditionalExpression(cond) => {
            // _hover: on ? { color: 'red' } : { color: 'blue' }  — both arms
            // lower; a folded test lowers the live arm only and names the dead
            condition_ternary(ctx, cond, when);
        }
        Expression::ParenthesizedExpression(p) => {
            // _hover: ({ color: 'red' })
            handle_condition_value(ctx, &p.expression, when);
        }
        _ => {
            // _hover: 'red'  — not an object
            ctx.warn(
                value.span(),
                DiagnosticCode::NonObjectCondition,
                "Condition block expected object expression",
            );
        }
    }
}

fn handle_spread_property(
    ctx: &mut ObjectWalk<'_>,
    spread: &SpreadElement<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // ...{ margin: '10px' }
    walk_spread_argument(ctx, &spread.argument, when);
}

/// Unpack a spread argument: inline objects, identifier local consts, or warn.
pub fn walk_spread_argument(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if walk_spread_value(ctx, expr, when) {
        return;
    }
    if walk_spread_branching(ctx, expr, when) {
        return;
    }
    // ...maybeFn()
    ctx.warn(
        expr.span(),
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

fn walk_spread_value(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ObjectExpression(inner_obj) => {
            // ...{ margin: '10px' }
            walk_style_object(ctx, inner_obj, when);
            true
        }
        Expression::Identifier(ident) => {
            // ...base  after  const base = { mt: '2r' }
            unpack_local_const_object(ctx, ident.name.as_str(), when, ident.span);
            true
        }
        Expression::ParenthesizedExpression(p) => {
            // ...({ margin: '10px' })
            walk_spread_argument(ctx, &p.expression, when);
            true
        }
        Expression::StaticMemberExpression(mem) => {
            // ...styles.hover  — member-hop spread over a nested const object
            unpack_member_const_object(ctx, mem, when);
            true
        }
        Expression::CallExpression(call) => {
            // ...getStyles()  — the folded object lowers exactly as if spread
            spread_pure_call(ctx, call, when);
            true
        }
        _ => false,
    }
}

/// Spread a pure-helper call: a folded object lowers entry by entry with
/// plans, refused fragments warn, and anything else warns the generic
/// spread diagnostic — naming the write for a reassigned callee.
fn spread_pure_call(
    ctx: &mut ObjectWalk<'_>,
    call: &oxc_ast::ast::CallExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let fold = crate::extract::fold::fold_pure_call(call, ctx.scopes);
    if let Some(crate::extract::fold::FenceValue::Object(entries)) = fold.value {
        for refusal in &fold.refusals {
            ctx.warn(
                refusal.span(),
                DiagnosticCode::DynamicExpression,
                refusal.message_for_spread(),
            );
        }
        emit_spread_residue(ctx, call.span, fold.residue.as_deref());
        crate::extract::fold::lower_call_spread(ctx, &entries, when, call.span);
        return;
    }
    if fold.value.is_some() {
        // ...sizes()  — a spread needs an object, not leaves or an array
        ctx.warn(
            call.span,
            DiagnosticCode::UnfoldableSpread,
            "Dynamic object spread encountered in style object; keeping sibling properties",
        );
        return;
    }
    let mut callee = &call.callee;
    while let Some(inner) = super::walk::unwrap_wrapper_target(callee) {
        callee = inner;
    }
    if let Expression::Identifier(ident) = callee {
        if let Some(write) = ctx.scopes.mutation(ident.name.as_str()) {
            ctx.warn(
                call.span,
                DiagnosticCode::MutatedBinding,
                format!(
                    "Dynamic mutated binding '{}' spread in style object ({}; keeping sibling properties)",
                    ident.name.as_str(),
                    write.write_phrase()
                ),
            );
            return;
        }
    }
    // ...maybeFn()  — dynamic, warn, keep siblings
    ctx.warn(
        call.span,
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

/// Warn when a spread call's callee baked a dropped dynamic arm (Ph4
/// residue channel). Runs only for folded object spreads, beside the refusals.
fn emit_spread_residue(ctx: &mut ObjectWalk<'_>, span: Span, residue: Option<&str>) {
    if let Some(subject) = residue {
        ctx.warn(
            span,
            DiagnosticCode::PartialObjectProp,
            format!("{subject} drops a dynamic arm with no static style value"),
        );
    }
}

/// Unpack a member-hop spread over its nested entries, or diagnose the miss.
///
/// A miss names the write when the root is mutated, else warns the generic
/// spread diagnostic — the same vocabulary as identifier spreads.
fn unpack_member_const_object(
    ctx: &mut ObjectWalk<'_>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    if let Some(obj) = crate::extract::fold::member_path_object(mem, ctx.scopes) {
        let name = crate::extract::fold::member_path_text(mem);
        lower_const_object(ctx, &name, obj, when, mem.span);
        return;
    }
    // ...styles.missing  — not a recorded object; a rootless base warns generic
    let root = crate::extract::fold::member_root_name(mem).unwrap_or("");
    spread_miss_warn(ctx, root, mem.span);
}

fn walk_spread_branching(
    ctx: &mut ObjectWalk<'_>,
    expr: &Expression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) -> bool {
    match expr {
        Expression::ConditionalExpression(cond) => {
            // ...(on ? { padding: '10px' } : { gap: '8px' })  — both arms
            // lower; a folded test lowers the live arm only and names the dead
            spread_conditional(ctx, cond, when);
            true
        }
        Expression::LogicalExpression(log) => {
            // ...(unk && { padding: '10px' })  /  ...(unk || { margin: '20px' })
            walk_spread_argument(ctx, &log.left, when);
            walk_spread_argument(ctx, &log.right, when);
            true
        }
        _ => false,
    }
}

/// Lower a conditional spread: the live arm when the test folds, else both.
fn spread_conditional(
    ctx: &mut ObjectWalk<'_>,
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_spread_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        walk_spread_argument(ctx, &cond.consequent, when);
        walk_spread_argument(ctx, &cond.alternate, when);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_spread_dead_arms(ctx, std::slice::from_ref(&arm));
    walk_spread_argument(ctx, live, when);
}

/// Report one info diagnostic per arm eliminated from a spread test.
fn emit_spread_dead_arms(ctx: &mut ObjectWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message("in style object spread"),
        );
    }
}

/// Report one info diagnostic per arm eliminated from a condition test.
fn emit_condition_dead_arms(ctx: &mut ObjectWalk<'_>, arms: &[crate::extract::fold::DeadArm]) {
    for arm in arms {
        ctx.info(
            arm.span,
            DiagnosticCode::DeadBranch,
            arm.message("in condition block"),
        );
    }
}

/// Lower a conditional condition value: the live arm when folded, else both.
fn condition_ternary(
    ctx: &mut ObjectWalk<'_>,
    cond: &oxc_ast::ast::ConditionalExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    let test = crate::extract::fold::fold_test(&cond.test, ctx.scopes);
    emit_condition_dead_arms(ctx, &test.dead_arms);
    let Some(pick) = test.value else {
        handle_condition_value(ctx, &cond.consequent, when);
        handle_condition_value(ctx, &cond.alternate, when);
        return;
    };
    let (live, dead) = if pick {
        (&cond.consequent, &cond.alternate)
    } else {
        (&cond.alternate, &cond.consequent)
    };
    let arm = crate::extract::fold::dead_arm(dead, pick, ctx.scopes);
    emit_condition_dead_arms(ctx, std::slice::from_ref(&arm));
    handle_condition_value(ctx, live, when);
}

/// Resolution of an identifier or single-hop member in a block position
/// (`css()` arg, JSX style prop) against recorded const objects.
pub enum BlockLookup<'a> {
    /// Not an identifier or member shape — the caller refuses generically.
    NotBlock,
    /// Resolved to a const object; the caller lowers it under this name.
    Hit(String, &'a ConstObject),
    /// Shape matched but nothing resolved; the caller checks mutation,
    /// then refuses. Carries the base name for the stale check.
    Miss(String),
}

/// Resolve an identifier or `base.prop` member to its const object: a bare
/// identifier answers its recorded object, a member answers the nested
/// entries one hop down. Deeper paths stay unresolved for SPEC-V2-31.
pub fn resolve_block_target<'a>(scopes: Scoped<'a>, expr: &Expression<'_>) -> BlockLookup<'a> {
    match expr {
        Expression::Identifier(ident) => {
            // css(styles)
            resolve_named_object(scopes, ident.name.as_str())
        }
        Expression::StaticMemberExpression(mem) => {
            // css(theme.colors)
            resolve_member_target(scopes, mem)
        }
        _ => BlockLookup::NotBlock,
    }
}

/// Resolve a bare identifier to its recorded const object, or miss.
fn resolve_named_object<'a>(scopes: Scoped<'a>, name: &str) -> BlockLookup<'a> {
    match scopes.object(name) {
        Some(obj) => BlockLookup::Hit(name.to_string(), obj),
        None => BlockLookup::Miss(name.to_string()),
    }
}

/// Resolve a single-hop member to its nested entries, or miss. Deeper
/// bases are not block shapes at all.
fn resolve_member_target<'a>(
    scopes: Scoped<'a>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
) -> BlockLookup<'a> {
    let Expression::Identifier(base) = &mem.object else {
        return BlockLookup::NotBlock;
    };
    let base_name = base.name.as_str();
    let prop_name = mem.property.name.as_str();
    match scopes.member_object(base_name, prop_name) {
        Some(obj) => BlockLookup::Hit(format!("{base_name}.{prop_name}"), obj),
        None => BlockLookup::Miss(base_name.to_string()),
    }
}

/// Lower one const-array object element exactly as if spread: its
/// single-leaf entries lower like const-object leaves with plans, unknown
/// keys warn like literals. Merge-list spreads lower through here, so array
/// and const-object spreads paint alike.
pub fn lower_array_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    map: &BTreeMap<String, AtomValue>,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    let obj: ConstObject = map
        .iter()
        .map(|(key, val)| {
            (
                key.clone(),
                ObjectProp {
                    leaves: vec![val.clone()],
                    nested: ConstObject::new(),
                    residue: false,
                },
            )
        })
        .collect();
    lower_const_object(ctx, name, &obj, when, span);
}

/// Warn on an unresolvable spread, naming the write when the name is mutated.
fn spread_miss_warn(ctx: &mut ObjectWalk<'_>, name: &str, span: Span) {
    if let Some(write) = ctx.scopes.mutation(name) {
        // css({ ...palette })  after  palette.color = 'blue'
        ctx.warn(
            span,
            DiagnosticCode::MutatedBinding,
            format!(
                "Dynamic mutated binding '{name}' spread in style object ({}; keeping sibling properties)",
                write.write_phrase()
            ),
        );
        return;
    }
    ctx.warn(
        span,
        DiagnosticCode::UnfoldableSpread,
        "Dynamic object spread encountered in style object; keeping sibling properties",
    );
}

fn unpack_local_const_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    let Some(obj) = ctx.scopes.object(name) else {
        // ...unknown  — not a file-top const object
        spread_miss_warn(ctx, name, span);
        return;
    };
    lower_const_object(ctx, name, obj, when, span);
}

/// Where one const-object lowering sits: whose object, under which
/// conditions, diagnosed at which span.
struct LowerSite<'a> {
    name: &'a str,
    when: &'a SmallVec<[Box<str>; 2]>,
    span: Span,
}

/// Lower a resolved const object exactly as if spread: one want and one
/// authored plan per recorded leaf, unknown keys diagnosed like literal
/// keys, entries with no static value diagnosed, nested conditions scoped
/// under their key (SPEC-V2-24). Whole-object `css()` args and JSX style
/// blocks lower through here, so arg and spread paint agree.
pub fn lower_const_object(
    ctx: &mut ObjectWalk<'_>,
    name: &str,
    obj: &ConstObject,
    when: &SmallVec<[Box<str>; 2]>,
    span: Span,
) {
    warn_unknown_spread_keys(ctx, obj, span);
    let site = LowerSite { name, when, span };
    for (key, prop) in obj.iter() {
        if is_known_style_prop(key) {
            lower_style_entry(ctx, &site, key, prop);
        }
    }
    for (key, prop) in obj.iter() {
        if is_condition_key(key, ctx.breakpoints) {
            lower_condition_entry(ctx, &site, key, prop);
        }
    }
}

/// Warn once per spread key that is neither a style prop nor a condition.
fn warn_unknown_spread_keys(ctx: &mut ObjectWalk<'_>, obj: &ConstObject, span: Span) {
    for (key, _) in obj.iter() {
        // Spread keys warn and drop like literal keys (N12).
        if !is_known_style_prop(key) && !is_condition_key(key, ctx.breakpoints) {
            ctx.warn(
                span,
                DiagnosticCode::UnknownProperty,
                format!("Unknown style property \"{key}\""),
            );
        }
    }
}

/// Lower one style entry: its leaves, or its responsive sub-entries by key.
fn lower_style_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    if !prop.nested.is_empty() {
        // { padding: { base: '1r', md: '2r' } }  — sub-keys ride `when`,
        // exactly like an inline responsive object
        lower_responsive_entries(ctx, site, key, &prop.nested);
    }
    if prop.leaves.is_empty() {
        if prop.nested.is_empty() {
            // { color: pick() } — recorded but unlowerable; name it (55/65)
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!("property '{key}' of '{}' has no static style value", site.name),
            );
        } else if prop.residue {
            // { ...(c ? { color: { base: 'red' } } : { color: pick() }) } —
            // the nested entries lowered above; name the dropped value arm
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
        return;
    }
    push_entry_leaves(ctx, key, &prop.leaves, site);
    if prop.residue {
        // { color: flag ? 'white' : run() } — the kept leaves lowered; name
        // the dropped arm (Ph4 residue channel)
        ctx.warn(
            site.span,
            DiagnosticCode::PartialObjectProp,
            format!(
                "property '{key}' of '{}' drops a dynamic arm with no static style value",
                site.name
            ),
        );
    }
}

/// Push one want and one authored plan per recorded leaf at one site.
fn push_entry_leaves(
    ctx: &mut ObjectWalk<'_>,
    key: &str,
    leaves: &[AtomValue],
    site: &LowerSite<'_>,
) {
    let when_strings: Vec<String> = site.when.iter().map(|w| w.to_string()).collect();
    let important = ctx.important;
    for val in leaves {
        let mut expr_ctx = ctx.expression_walk(key);
        expr_ctx.push_want(val.clone(), site.when.clone(), false, Some(site.span));
        if let Some(authored) = ctx.authored.as_mut() {
            if let Some(json) = super::ast_value::atom_value_to_json(val) {
                authored.push(crate::runtime::AuthoredDeclaration {
                    when: when_strings.clone(),
                    prop: key.to_string(),
                    value: json,
                    important,
                });
            }
        }
    }
}

/// Lower responsive sub-entries under their sub-key conditions.
fn lower_responsive_entries(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    nested: &ConstObject,
) {
    for (sub, subprop) in nested.iter() {
        if !subprop.nested.is_empty() || subprop.leaves.is_empty() {
            // Doubly nested or unlowerable responsive values stay out, named
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' has no static style value",
                    site.name
                ),
            );
            continue;
        }
        let mut sub_when = site.when.clone();
        sub_when.push(sub.clone().into());
        let sub_site = LowerSite {
            name: site.name,
            when: &sub_when,
            span: site.span,
        };
        push_entry_leaves(ctx, key, &subprop.leaves, &sub_site);
        if subprop.residue {
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}.{sub}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
    }
}

/// Lower one condition entry: nested objects scope under the key, scalar
/// values refuse like inline conditions, empty markers diagnose.
fn lower_condition_entry(
    ctx: &mut ObjectWalk<'_>,
    site: &LowerSite<'_>,
    key: &str,
    prop: &ObjectProp,
) {
    if !prop.nested.is_empty() {
        // { _hover: { color: 'red' } }  — the nested entries lower scoped,
        // preserving the conditional data through the spread (SPEC-V2-24)
        let mut nested_when = site.when.clone();
        nested_when.push(key.into());
        lower_const_object(ctx, site.name, &prop.nested, &nested_when, site.span);
    }
    if prop.leaves.is_empty() {
        if prop.nested.is_empty() {
            // { _hover: pick() }  — recorded but unlowerable; name it
            ctx.warn(
                site.span,
                DiagnosticCode::UnfoldableObjectProp,
                format!("property '{key}' of '{}' has no static style value", site.name),
            );
        } else if prop.residue {
            // The nested entries lowered above; name the dropped value arm
            // a union merged beside them
            ctx.warn(
                site.span,
                DiagnosticCode::PartialObjectProp,
                format!(
                    "property '{key}' of '{}' drops a dynamic arm with no static style value",
                    site.name
                ),
            );
        }
        return;
    }
    // { _hover: 'red' }  — a condition block must be an object, as inline
    ctx.warn(
        site.span,
        DiagnosticCode::NonObjectCondition,
        "Condition block expected object expression",
    );
}
