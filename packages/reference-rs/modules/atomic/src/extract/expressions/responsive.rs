//! Responsive expansion for array and per-prop object values.
//!
//! Arrays map indices onto the breakpoint scale (`base`, `sm`, …) while
//! per-prop objects (`width: { base, md }`) ride their keys on `when` and
//! leave base-skipping plus unknown-key refusal to `resolve/conditions`.
//! Both forms recurse through `walk_expression`, so ternaries, constants,
//! and null holes behave exactly as they do on scalar props.

use oxc_ast::ast::{
    ArrayExpression, ArrayExpressionElement, Expression, ObjectExpression, ObjectPropertyKind,
};
use oxc_span::GetSpan;
use smallvec::SmallVec;

use super::object::resolve_property_key;
use super::walk::{walk_expression, ExpressionWalk};
use crate::diagnostics::DiagnosticCode;
use crate::extract::fold::{flatten_value_slots, spread_base_name, spread_flattens, ValueSlot};

/// Expand a responsive array onto breakpoint `when` scopes.
///
/// Literal and const-array spreads flatten in place so every sibling keeps
/// its breakpoint index; any other spread refuses the whole array, since an
/// unknown spread length would shift later siblings to the wrong breakpoint.
pub fn walk_array(
    ctx: &mut ExpressionWalk<'_>,
    arr: &ArrayExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // mt={['1r', '2r', null, '4r']}  /  mt={['1r', ...['2r'], '4r']}
    let Some(slots) = flatten_value_slots(&arr.elements, ctx.scopes) else {
        // mt={['1r', ...dyn, '4r']} — refuse all, keep arity honest.
        refuse_array_spread(ctx, arr);
        return;
    };
    for (idx, slot) in slots.iter().enumerate() {
        let Some(breakpoint) = ctx.breakpoint_for_index(idx) else {
            continue;
        };
        let mut item_when = when.clone();
        item_when.push(Box::from(breakpoint));
        walk_slot(ctx, slot, &item_when);
    }
}

/// Refuse a value array carrying a dynamic spread, at the failing spread.
/// A reassigned const array names its write instead of the arity refusal.
fn refuse_array_spread(ctx: &mut ExpressionWalk<'_>, arr: &ArrayExpression<'_>) {
    let failing = arr.elements.iter().find_map(|elem| match elem {
        ArrayExpressionElement::SpreadElement(spread)
            if !spread_flattens(&spread.argument, ctx.scopes) =>
        {
            Some(spread.as_ref())
        }
        _ => None,
    });
    let Some(spread) = failing else {
        return;
    };
    if let Some(name) = spread_base_name(&spread.argument) {
        if let Some(write) = ctx.scopes.mutation(name) {
            let prop = ctx.prop;
            ctx.warn(
                spread.span,
                DiagnosticCode::MutatedBinding,
                format!(
                    "Dynamic mutated binding '{name}' spread in responsive array for prop '{prop}' ({}; refusing the array to keep breakpoint arity honest)",
                    write.write_phrase()
                ),
            );
            return;
        }
    }
    let prop = ctx.prop;
    ctx.warn(
        spread.span,
        DiagnosticCode::ResponsiveArraySpread,
        format!(
            "Spread in responsive array for prop '{prop}'; refusing the array to keep breakpoint arity honest"
        ),
    );
}

/// Walk one flattened slot: elements walk, spliced leaves push, holes skip.
fn walk_slot(
    ctx: &mut ExpressionWalk<'_>,
    slot: &ValueSlot<'_, '_>,
    item_when: &SmallVec<[Box<str>; 2]>,
) {
    match slot {
        ValueSlot::Walk(elem) => walk_array_element(ctx, elem, item_when),
        ValueSlot::Leaf(leaf) => {
            ctx.push_want(leaf.clone(), item_when.clone(), false, None);
        }
        ValueSlot::Hole => {
            // const sizes = ['1r', , '4r']  — spliced holes consume the slot
        }
    }
}

/// Walk one responsive array slot: holes skip, expressions walk at the slot.
fn walk_array_element(
    ctx: &mut ExpressionWalk<'_>,
    elem: &ArrayExpressionElement<'_>,
    item_when: &SmallVec<[Box<str>; 2]>,
) {
    match elem {
        ArrayExpressionElement::Elision(_) => {
            // mt={['1r', , '4r']}
        }
        _ => {
            if let Some(expr) = elem.as_expression() {
                walk_expression(ctx, expr, item_when);
            }
        }
    }
}

/// Expand a per-prop responsive object onto `when` scopes keyed by entry.
pub fn walk_object(
    ctx: &mut ExpressionWalk<'_>,
    obj: &ObjectExpression<'_>,
    when: &SmallVec<[Box<str>; 2]>,
) {
    // width={{ base: '50px', md: '60px' }} — keys ride `when`, resolve lowers them
    for prop_kind in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop_kind else {
            ctx.warn(
                prop_kind.span(),
                DiagnosticCode::UnfoldableSpread,
                "Dynamic object spread encountered in responsive object; keeping sibling entries",
            );
            continue;
        };
        let Some(key) = resolve_property_key(&prop.key, ctx.scopes) else {
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::UnfoldableKey,
                "Dynamic computed property key encountered in style object",
            );
            continue;
        };
        if let Some(path) = crate::extract::fold::key_entry_residue(&prop.key, ctx.scopes) {
            ctx.warn(
                prop.key.span(),
                DiagnosticCode::PartialObjectProp,
                format!("property '{path}' drops a dynamic arm with no static style value"),
            );
        }
        if refuse_leaf_important(ctx, &key, &prop.value) {
            // Diagnosed above; the refused leaf pushes no want (ATM-LEAF-11)
            continue;
        }
        let mut entry_when = when.clone();
        entry_when.push(key.into());
        walk_expression(ctx, &prop.value, &entry_when);
    }
}

/// Refuse a `!` marker on one responsive-object leaf. The whole-object plan
/// carries a single important flag, so a per-leaf marker could never be
/// served and used to paint plain in silence. True when refused: the call
/// site skips the leaf, so no want pushes and no orphan `!` class mints.
/// Detection mirrors plan capture (`ast_to_json_value`): it fires exactly
/// where the capture would drop the flag — string and template leaves plus
/// transparent wrappers — while branching and dynamic leaves keep their own
/// proof-level diagnosis. Default-visible, naming prop + leaf key.
fn refuse_leaf_important(
    ctx: &mut ExpressionWalk<'_>,
    key: &str,
    value: &Expression<'_>,
) -> bool {
    if ctx.important {
        return false;
    }
    let flagged = super::ast_value::ast_to_json_value(value, ctx.scopes)
        .is_some_and(|(_, important)| important);
    if !flagged {
        return false;
    }
    let prop = ctx.prop;
    ctx.warn_default(
        value.span(),
        DiagnosticCode::ResponsiveLeafImportant,
        format!(
            "`!` on leaf '{key}' of prop '{prop}' is not honored: responsive style plans carry one important flag per object, so this serves the non-important class; remove the `!` or move it to a scalar prop"
        ),
    );
    true
}

#[cfg(test)]
mod tests {
    use crate::{compile, CompileRequest, VirtualSource};

    fn compile_code(code: &str) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource { path: "test.tsx".into(), content: code.into() }]),
            base_system: crate::BaseSystem::lib_fixture().clone(),
            logs: Some(vec!["proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    /// A `!` responsive leaf warns on default naming prop + leaf, pushes no
    /// want, and leaves sibling leaves extracting (ATM-LEAF-11).
    #[test]
    fn responsive_leaf_important_refuses_with_diagnostic_and_skips_want() {
        let res = compile_code(
            "import { css } from '@reference-ui/styled';\
             export const cls = css({ width: { base: '50px!', md: '60px' }, color: 'red' });",
        );
        let hits: Vec<_> = res
            .diagnostics
            .iter()
            .filter(|d| d.code == crate::diagnostics::DiagnosticCode::ResponsiveLeafImportant)
            .collect();
        assert_eq!(hits.len(), 1);
        assert!(hits[0].message.contains("'width'"), "names prop: {}", hits[0].message);
        assert!(hits[0].message.contains("'base'"), "names leaf: {}", hits[0].message);
        assert!(
            res.wants.iter().all(|w| !(&*w.prop == "width" && w.important)),
            "refused leaf pushes no important want: {:?}",
            res.wants
        );
        assert!(
            res.wants.iter().any(|w| &*w.prop == "width"
                && w.value.to_string() == "60px"
                && w.when.as_slice() == &["md".into()]),
            "sibling leaf still extracts: {:?}",
            res.wants
        );
        assert!(
            res.wants.iter().any(|w| &*w.prop == "color"),
            "sibling prop still extracts: {:?}",
            res.wants
        );
        assert!(
            !res.stylesheet.contains("50px !important"),
            "no orphan `!` class mints"
        );
    }

    /// Plain responsive leaves stay silent: the refusal fires on `!` only.
    #[test]
    fn responsive_object_without_important_stays_silent() {
        let res = compile_code(
            "import { css } from '@reference-ui/styled';\
             export const cls = css({ width: { base: '50px', md: '60px' } });",
        );
        assert!(
            res.diagnostics.iter().all(|d| d.code
                != crate::diagnostics::DiagnosticCode::ResponsiveLeafImportant),
            "unexpected refusal: {:?}",
            res.diagnostics
        );
    }
}
