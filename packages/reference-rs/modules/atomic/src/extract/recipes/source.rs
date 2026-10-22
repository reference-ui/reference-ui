//! Const references in recipe fields. A style or map position that names a const object literal reads
//! the entries `css(name)` reads: the scope table records each entry and `lower_const_object` lowers
//! them, as it does for `css()`. `map_entries` reads a map value (`variants`, an axis, a value map, or
//! a spread) as named entries, inline or recorded, and `recorded_style` lowers one recorded entry as a
//! style object. A default or a compound predicate reads a scalar instead: `scalar_text` reads a literal
//! or a same-file const that holds one, and `predicate_values` reads one scalar or a non-empty list of
//! them. A value none of these can read refuses its field, and an imported object's unfoldable spreads
//! warn at the call site, as `css()` warns them.

use oxc_ast::ast::{Expression, ObjectExpression, ObjectProperty, ObjectPropertyKind};
use oxc_span::{GetSpan, Span};
use smallvec::smallvec;

use super::walk::{boolean_str, normalized_value, static_key, unwrap_expression, RecipeWalk};
use crate::atom::backing::OWN;
use crate::atom::{AtomValue, Want};
use crate::diagnostics::DiagnosticCode;
use crate::extract::constants::{ConstObject, ObjectProp};
use crate::extract::expressions::object::lower::LowerSite;
use crate::extract::expressions::{lower_const_object, resolve_block_target, BlockLookup};
use crate::extract::ExtractContext;
use crate::resolve::font::scope;

/// One named entry of a recipe map: its value, and the span a refusal of it points at (the value
/// itself, or the spread or name that brought a recorded entry in).
pub(super) struct MapEntry<'a, 'b> {
    pub(super) name: String,
    pub(super) span: Span,
    pub(super) value: EntryValue<'a, 'b>,
}

/// An entry as written in the object literal, or as a const object literal recorded it.
pub(super) enum EntryValue<'a, 'b> {
    Inline(&'a Expression<'a>),
    Recorded(&'b ObjectProp),
}

/// The entries a map value names: an inline object's properties in order, with each spread resolved
/// in place, or the recorded entries of the const object literal it names. `None` refuses the map.
pub(super) fn map_entries<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    val: &'x Expression<'x>,
) -> Option<Vec<MapEntry<'x, 'b>>> {
    let target = unwrap_expression(val);
    if let Expression::ObjectExpression(obj) = target {
        let mut entries = Vec::new();
        push_inline_entries(walk, field, obj, &mut entries);
        return Some(entries);
    }
    match const_object(walk, target) {
        Some((_, obj)) => Some(recorded_entries(obj, target.span())),
        None => {
            walk.refuse_unreadable(field, val.span());
            None
        }
    }
}

/// The const object literal an identifier or member names, with the name it lowers under. An
/// imported object warns at `expr` for the spreads it could not unfold, as `css()` does.
pub(super) fn const_object<'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    expr: &Expression<'_>,
) -> Option<(String, &'b ConstObject)> {
    let BlockLookup::Hit(name, obj) = resolve_block_target(walk.ctx.scoped(), expr) else {
        return None;
    };
    emit_import_residue(walk.ctx, &name, expr.span());
    Some((name, obj))
}

/// Append an inline object's entries in source order. A computed key refuses the map.
fn push_inline_entries<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    obj: &'x ObjectExpression<'x>,
    out: &mut Vec<MapEntry<'x, 'b>>,
) {
    for kind in &obj.properties {
        match kind {
            ObjectPropertyKind::ObjectProperty(prop) => {
                push_inline_property(walk, field, prop, out);
            }
            ObjectPropertyKind::SpreadProperty(spread) => {
                push_spread(walk, field, &spread.argument, out);
            }
        }
    }
}

fn push_inline_property<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    prop: &'x ObjectProperty<'x>,
    out: &mut Vec<MapEntry<'x, 'b>>,
) {
    let Some(name) = static_key(&prop.key) else {
        walk.refuse_computed(field, prop.key.span());
        return;
    };
    out.push(MapEntry {
        name,
        span: prop.value.span(),
        value: EntryValue::Inline(&prop.value),
    });
}

/// A spread inside a map: an inline object contributes its own entries, a const object literal
/// contributes its recorded entries at the spread's argument, and anything else refuses the map.
fn push_spread<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    arg: &'x Expression<'x>,
    out: &mut Vec<MapEntry<'x, 'b>>,
) {
    let target = unwrap_expression(arg);
    if let Expression::ObjectExpression(obj) = target {
        push_inline_entries(walk, field, obj, out);
        return;
    }
    match const_object(walk, target) {
        Some((_, obj)) => out.extend(recorded_entries(obj, target.span())),
        None => walk.refuse_spread(field, arg.span()),
    }
}

/// The entries of a recorded const map, each reported at the span that named it.
fn recorded_entries<'x, 'b>(obj: &'b ConstObject, span: Span) -> Vec<MapEntry<'x, 'b>> {
    obj.iter()
        .map(|(name, prop)| MapEntry {
            name: name.clone(),
            span,
            value: EntryValue::Recorded(prop),
        })
        .collect()
}

/// A recorded entry read as a map of its own: its nested entries, when it holds no static leaf.
/// A leaf, a dynamic marker and an empty map each refuse the field.
pub(super) fn recorded_map<'x, 'b>(
    walk: &mut RecipeWalk<'_, 'b>,
    field: &str,
    prop: &'b ObjectProp,
    span: Span,
) -> Option<Vec<MapEntry<'x, 'b>>> {
    if !is_map_entry(prop) {
        walk.refuse_unreadable(field, span);
        return None;
    }
    Some(recorded_entries(&prop.nested, span))
}

/// A recorded entry read as a style object: its nested entries lower as `css(name)` lowers them.
/// A leaf, a dynamic marker and an empty map each refuse the field.
pub(super) fn recorded_style(
    walk: &mut RecipeWalk<'_, '_>,
    field: &str,
    prop: &ObjectProp,
    span: Span,
) -> Option<Vec<Want>> {
    if !is_map_entry(prop) {
        walk.refuse_unreadable(field, span);
        return None;
    }
    let mut wants = Vec::new();
    let site = LowerSite {
        name: field,
        when: &smallvec![],
        span,
    };
    lower_const_style(walk, &prop.nested, site, &mut wants);
    Some(wants)
}

/// True when a recorded entry holds nested entries and no static leaf. A recorded empty map is
/// indistinguishable from a dynamic value, so it refuses like one (fail closed).
fn is_map_entry(prop: &ObjectProp) -> bool {
    prop.leaves.is_empty() && !prop.nested.is_empty()
}

/// Lower a recorded const style object into `wants` at `site`, as `css(name)` lowers it, with the
/// block's own font scope applied to its wants.
pub(super) fn lower_const_style(
    walk: &mut RecipeWalk<'_, '_>,
    obj: &ConstObject,
    site: LowerSite<'_>,
    wants: &mut Vec<Want>,
) {
    let wants_at = wants.len();
    let mut obj_ctx = walk
        .ctx
        .object_walk_into(Some(walk.site.origin), wants, &OWN);
    lower_const_object(&mut obj_ctx, obj, site);
    scope::apply_to_wants(&mut wants[wants_at..]);
}

/// The text a scalar position reads as: a string, boolean or number literal, or a same-file `const`
/// that holds exactly one such leaf. A call, a ternary, a `let`, an import or an unbound name reads as
/// `None`, and the caller refuses its field.
pub(super) fn scalar_text(ctx: &ExtractContext<'_>, expr: &Expression<'_>) -> Option<String> {
    let target = unwrap_expression(expr);
    if let Some(text) = normalized_value(target) {
        return Some(text);
    }
    let Expression::Identifier(ident) = target else {
        return None;
    };
    atom_text(ctx.scoped().const_scalar(ident.name.as_str())?)
}

/// The values of a compound predicate: one scalar, or a non-empty array of scalars. An empty array,
/// or an entry that reads as no scalar (a spread or a hole included), reads as `None`.
pub(super) fn predicate_values(
    ctx: &ExtractContext<'_>,
    expr: &Expression<'_>,
) -> Option<Vec<String>> {
    let target = unwrap_expression(expr);
    let Expression::ArrayExpression(list) = target else {
        return scalar_text(ctx, target).map(|text| vec![text]);
    };
    if list.elements.is_empty() {
        return None;
    }
    list.elements
        .iter()
        .map(|element| element.as_expression().and_then(|item| scalar_text(ctx, item)))
        .collect()
}

/// The text one recorded leaf reads as: the same text its literal would read as.
fn atom_text(leaf: &AtomValue) -> Option<String> {
    match leaf {
        AtomValue::String(text) | AtomValue::Number(text) => Some(text.to_string()),
        AtomValue::Bool(value) => Some(boolean_str(*value)),
        AtomValue::Token { .. } | AtomValue::Null => None,
    }
}

/// Diagnose nested spreads of an imported object that could not unfold, as `css()` does at its call.
fn emit_import_residue(ctx: &mut ExtractContext<'_>, name: &str, span: Span) {
    for marker in ctx.scoped().import_unfoldable(name) {
        ctx.warn_help(
            span,
            DiagnosticCode::UnfoldableSpread,
            marker.message(),
            vec![format!(
                "define '{}' as a static style object or inline it",
                marker.local()
            )],
        );
    }
}
