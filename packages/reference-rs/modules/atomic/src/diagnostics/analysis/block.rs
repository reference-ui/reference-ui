//! Style-block dispatch for independent diagnostics analysis.
//!
//! Lowers `css()` arguments, JSX `css`/condition blocks, and merge-list
//! elements to the shared object walker, and unfolds recorded const blocks
//! from the const values. Objects and merge lists walk; branching, calls,
//! and unknown shapes stay dynamic without descending (walking one arm
//! while runtime takes another would forge exact keys). Scalar leaves are
//! not blocks at all: runtime drops non-object inputs without querying.

use oxc_ast::ast::{ArrayExpressionElement, Expression};
use oxc_span::{GetSpan, Span};

use super::conditions::is_style_value_position;
use super::const_values::atom_to_class;
use super::is_shadowed;
use super::object::{walk_object, Site, WalkCtx};
use super::values::{unwrap_value, ValueClass};
use crate::diagnostics::DynamicShape;
use crate::extract::constants::{ConstArrayElement, ConstObject, ObjectProp};

/// Walk one style block: an object, a merge list, a const block, or a shape
/// that stays dynamic. `when` is the condition stack above the block.
pub fn walk_block(walk: &mut WalkCtx<'_>, expr: &Expression<'_>, when: &[Box<str>]) {
    let expr = unwrap_value(expr);
    match expr {
        Expression::ObjectExpression(obj) => walk_object(walk, obj, when),
        Expression::ArrayExpression(arr) => walk_merge_list(walk, arr, when),
        Expression::ConditionalExpression(_) | Expression::LogicalExpression(_) => {
            walk.dynamic(Site::bare(expr.span(), when), DynamicShape::UnknownValue);
        }
        Expression::Identifier(ident) => {
            walk_block_ident(walk, ident.name.as_str(), expr.span(), when);
        }
        _ => walk_block_other(walk, expr, when),
    }
}

/// Walk one unshaped block: scalar leaves vanish and anything that may
/// evaluate to a block stays dynamic.
fn walk_block_other(walk: &mut WalkCtx<'_>, expr: &Expression<'_>, when: &[Box<str>]) {
    if !is_scalar_leaf(expr) {
        walk.dynamic(Site::bare(expr.span(), when), DynamicShape::UnknownValue);
    }
}

/// Walk one identifier block: const objects unfold, const arrays merge,
/// const scalars vanish (a string is not a style block), and unknown or
/// mutated names stay dynamic.
fn walk_block_ident(walk: &mut WalkCtx<'_>, name: &str, span: Span, when: &[Box<str>]) {
    if is_shadowed(walk.shadows, name) || walk.constants.mutation(name).is_some() {
        walk.dynamic(Site::bare(span, when), DynamicShape::UnknownValue);
        return;
    }
    if let Some(obj) = walk.constants.get_object(name) {
        walk_const_object(walk, obj, when, span);
        return;
    }
    if let Some(elements) = walk.constants.get_array(name) {
        walk_const_merge(walk, elements, when, span);
        return;
    }
    if walk.constants.scalar_leaves(name).is_empty() {
        walk.dynamic(Site::bare(span, when), DynamicShape::UnknownValue);
    }
}

/// Walk one merge list (`css([a, b])`): objects merge, holes skip, inline
/// and const-array spreads flatten in place, dynamic spreads stay dynamic.
pub fn walk_merge_list(
    walk: &mut WalkCtx<'_>,
    arr: &oxc_ast::ast::ArrayExpression<'_>,
    when: &[Box<str>],
) {
    for elem in &arr.elements {
        match elem {
            ArrayExpressionElement::SpreadElement(spread) => {
                walk_merge_spread(walk, &spread.argument, spread.span, when);
            }
            ArrayExpressionElement::Elision(_) => {}
            _ => walk_merge_element(walk, elem, when),
        }
    }
}

/// Walk one merge-list element as a style block.
fn walk_merge_element(
    walk: &mut WalkCtx<'_>,
    elem: &ArrayExpressionElement<'_>,
    when: &[Box<str>],
) {
    if let Some(expr) = elem.as_expression() {
        walk_block(walk, expr, when);
    }
}

/// Walk one merge-list spread: inline arrays flatten element by element,
/// const arrays merge from the recording, and anything else stays dynamic.
fn walk_merge_spread(walk: &mut WalkCtx<'_>, arg: &Expression<'_>, span: Span, when: &[Box<str>]) {
    let arg = unwrap_value(arg);
    if let Expression::ArrayExpression(arr) = arg {
        walk_merge_list(walk, arr, when);
        return;
    }
    if let Expression::Identifier(ident) = arg {
        if walk_const_merge_spread(walk, ident.name.as_str(), span, when) {
            return;
        }
    }
    walk.dynamic(Site::bare(span, when), DynamicShape::Spread);
}

/// Walk one identifier merge spread from the const recording. True when the
/// name resolved (merged or soundly skipped); false stays a dynamic spread.
fn walk_const_merge_spread(
    walk: &mut WalkCtx<'_>,
    name: &str,
    span: Span,
    when: &[Box<str>],
) -> bool {
    if is_shadowed(walk.shadows, name) || walk.constants.mutation(name).is_some() {
        return false;
    }
    if let Some(elements) = walk.constants.get_array(name) {
        walk_const_merge(walk, elements, when, span);
        return true;
    }
    if walk.constants.get_object(name).is_some() {
        return true;
    }
    !walk.constants.scalar_leaves(name).is_empty()
}

/// Walk one recorded const merge list: objects merge, scalar leaves and
/// holes skip (they are not style blocks), exactly like literal elements.
fn walk_const_merge(
    walk: &mut WalkCtx<'_>,
    elements: &[ConstArrayElement],
    when: &[Box<str>],
    span: Span,
) {
    for element in elements {
        if let ConstArrayElement::Object(map) = element {
            walk_const_flat_object(walk, map, when, span);
        }
    }
}

/// Walk one recorded flat const object (a merge-list element): every entry
/// is a single leaf, so style and condition positions take each atom exact.
fn walk_const_flat_object(
    walk: &mut WalkCtx<'_>,
    map: &std::collections::BTreeMap<String, crate::atom::AtomValue>,
    when: &[Box<str>],
    span: Span,
) {
    for (key, atom) in map.iter() {
        let site = Site {
            span,
            prop: key,
            when,
        };
        walk_leaf_class(walk, atom_to_class(atom), site, DynamicShape::UnknownValue);
    }
}

/// Walk one recorded const object in style mode: single-leaf entries go
/// exact, nested maps recurse as conditions, and multi-leaf, residue, or
/// empty entries stay dynamic. Recorded responsive objects stay dynamic in
/// S2: nested const maps never build query values yet. Every fact points at
/// the use-site `span`: the prediction is made from this site.
pub fn walk_const_object(walk: &mut WalkCtx<'_>, obj: &ConstObject, when: &[Box<str>], span: Span) {
    for (key, prop) in obj.iter() {
        let site = Site {
            span,
            prop: key,
            when,
        };
        walk_const_entry(walk, prop, site);
    }
}

/// Walk one recorded const entry: style positions take single leaves exact,
/// condition positions recurse into nested maps or take single scalar
/// leaves exact (runtime queries scalars under any key).
fn walk_const_entry(walk: &mut WalkCtx<'_>, prop: &ObjectProp, site: Site<'_>) {
    if site.prop == "r" && !prop.nested.is_empty() {
        walk.dynamic(site, DynamicShape::UnknownWhen);
        return;
    }
    if prop.residue || prop.is_empty() {
        walk.dynamic(site, DynamicShape::UnknownValue);
        return;
    }
    if is_style_value_position(site.prop, walk.style_props) {
        walk_const_style_entry(walk, prop, site);
    } else {
        walk_const_condition_entry(walk, prop, site);
    }
}

/// Walk one recorded style-position entry: exactly one leaf and no nested
/// map goes exact; anything richer stays dynamic.
fn walk_const_style_entry(walk: &mut WalkCtx<'_>, prop: &ObjectProp, site: Site<'_>) {
    if prop.nested.is_empty() {
        walk_leaf_class(walk, const_leaf_value(prop), site, DynamicShape::UnknownValue);
    } else {
        walk.dynamic(site, DynamicShape::UnknownValue);
    }
}

/// Walk one recorded condition-position entry: nested maps recurse with the
/// key pushed, single scalar leaves go exact, anything else stays dynamic.
fn walk_const_condition_entry(walk: &mut WalkCtx<'_>, prop: &ObjectProp, site: Site<'_>) {
    if !prop.nested.is_empty() && prop.leaves.is_empty() {
        let mut nested = site.when.to_vec();
        nested.push(site.prop.into());
        walk_const_object(walk, &prop.nested, &nested, site.span);
    } else if prop.nested.is_empty() {
        walk_leaf_class(walk, const_leaf_value(prop), site, DynamicShape::UnknownValue);
    } else {
        walk.dynamic(site, DynamicShape::UnknownValue);
    }
}

/// Lower one recorded leaf class: exact predicts, holes emit no fact
/// (runtime never queries them), unknown stays dynamic. Shared with the
/// JSX spread-bag walk.
pub fn walk_leaf_class(
    walk: &mut WalkCtx<'_>,
    class: ValueClass,
    site: Site<'_>,
    shape: DynamicShape,
) {
    match class {
        ValueClass::Exact { value, important } => walk.expect(site, value, important),
        ValueClass::Hole => {}
        ValueClass::Unknown => walk.dynamic(site, shape),
    }
}

/// The class of a single-leaf recorded entry: holes emit no fact (runtime
/// never queries them), single leaves go exact, anything else stays
/// dynamic. Strings split `!` like literals. Shared with the JSX
/// spread-bag walk.
pub fn const_leaf_value(prop: &ObjectProp) -> ValueClass {
    let [leaf] = prop.leaves.as_slice() else {
        return ValueClass::Unknown;
    };
    atom_to_class(leaf)
}

/// True for expressions that evaluate to non-objects and therefore never
/// query: scalar and hole literals, templates (always strings), and unary
/// folds. Calls, binaries, members, and branching may evaluate to blocks.
fn is_scalar_leaf(expr: &Expression<'_>) -> bool {
    match expr {
        Expression::StringLiteral(_)
        | Expression::NumericLiteral(_)
        | Expression::BooleanLiteral(_)
        | Expression::NullLiteral(_)
        | Expression::TemplateLiteral(_)
        | Expression::BigIntLiteral(_)
        | Expression::UnaryExpression(_) => true,
        Expression::Identifier(ident) => ident.name == "undefined" || ident.name == "null",
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::super::support::{css_call_args, dynamic_count, exact_keys, parse_for_test};
    use super::*;
    use crate::diagnostics::{DiagnosticFact, SourceId, StyleSurfaceKind};
    use std::collections::HashSet;

    fn walk_blocks(source: &str) -> Vec<DiagnosticFact> {
        let allocator = oxc_allocator::Allocator::default();
        let program = parse_for_test(&allocator, source);
        let constants =
            crate::extract::constants::collect_local_constants(&program, "test.ts", Some(source));
        let blocks = css_call_args(&program);
        let style_props: HashSet<String> =
            ["color", "mt"].into_iter().map(str::to_string).collect();
        let shadows: Vec<HashSet<String>> = Vec::new();
        let mut facts = Vec::new();
        let mut walk = WalkCtx {
            facts: &mut facts,
            source: SourceId(0),
            surface: StyleSurfaceKind::Css,
            system: "test",
            style_props: &style_props,
            constants: &constants,
            shadows: &shadows,
        };
        for block in blocks {
            walk_block(&mut walk, block, &[]);
        }
        facts
    }

    #[test]
    fn merge_lists_walk_every_element() {
        let facts = walk_blocks("css([{ color: 'red' }, { mt: '2r' }])");
        assert_eq!(exact_keys(&facts).len(), 2);
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn merge_spreads_flatten_inline_and_stay_dynamic() {
        let facts = walk_blocks("css([{ color: 'red' }, ...[{ mt: '2r' }], ...rest])");
        assert_eq!(exact_keys(&facts).len(), 2);
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn conditional_blocks_stay_dynamic_without_descending() {
        let facts = walk_blocks("css(ok ? { color: 'red' } : { color: 'blue' })");
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
    }

    #[test]
    fn const_blocks_unfold_and_scalars_vanish() {
        let facts = walk_blocks("const s = { color: 'red' }; css(s)");
        assert_eq!(exact_keys(&facts).len(), 1);
        let facts = walk_blocks("const s = 'red'; css(s)");
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn scalar_args_emit_no_fact() {
        let facts = walk_blocks("css('red', 42, null, `x`)");
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 0);
    }

    #[test]
    fn const_hole_entries_emit_no_fact_and_true_stays_exact() {
        let facts = walk_blocks("const s = { color: false }; css(s)");
        assert!(facts.is_empty());
        // Null object leaves stay dynamic: the const recorder drops them
        // (`entries.rs` records no Null leaf), so analysis cannot tell null
        // from dynamic — silence-valid, and never an Exact null.
        let facts = walk_blocks("const s = { color: null }; css(s)");
        assert!(exact_keys(&facts).is_empty());
        assert_eq!(dynamic_count(&facts), 1);
        let facts = walk_blocks("const s = { _hover: false }; css(s)");
        assert!(facts.is_empty());
        let facts = walk_blocks("const s = [{ color: false }]; css(s)");
        assert!(facts.is_empty());
        let facts = walk_blocks("const s = { color: true }; css(s)");
        assert_eq!(exact_keys(&facts).len(), 1);
        assert_eq!(dynamic_count(&facts), 0);
    }
}
