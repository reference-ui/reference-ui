//! Selection observation: what a recipe selection's arguments and object leaves contribute to its
//! responsive gates. A literal leaf records its class triple, a runtime skip (null or an unshadowed
//! undefined) drops out, and anything dynamic flags the selection so its gate stays open. Takes a
//! resolved call or an object leaf with the shadow stack; emits triples and the dynamic flag into
//! the selection observation.

use super::ResponsiveTriple;
use oxc_ast::ast::{CallExpression, Expression, ObjectExpression, ObjectPropertyKind};
use rustc_hash::FxHashSet;

use crate::extract::ExtractContext;

use super::super::super::bindings::is_shadowed;
use super::super::walk::{static_key, unwrap_expression};

/// One selection's observations: responsive triples plus the dynamic flag.
pub(super) struct ObservedCall {
    pub(super) responsive: FxHashSet<ResponsiveTriple>,
    pub(super) dynamic: bool,
}

/// Observe a resolved call's first argument: literals record, dynamics flag.
/// Zero-arg calls mark called and observe nothing; the caller already pushed.
pub(super) fn observe_call(call: &CallExpression<'_>, ctx: &ExtractContext<'_>) -> ObservedCall {
    let mut walk = SelectionWalk::new();
    let Some(first) = call.arguments.first() else {
        return walk.finish();
    };
    let Some(expr) = first.as_expression() else {
        walk.flag_dynamic();
        return walk.finish();
    };
    let Expression::ObjectExpression(obj) = unwrap_expression(expr) else {
        walk.flag_dynamic();
        return walk.finish();
    };
    walk.observe_object(obj, ctx.shadowed);
    walk.finish()
}

/// What one selection leaf carries: text, a runtime skip, or dynamics.
enum LeafOutcome {
    Text(String),
    Skip,
    Dynamic,
}

/// Accumulating walk over one selection object: triples plus one flag.
struct SelectionWalk {
    responsive: FxHashSet<ResponsiveTriple>,
    dynamic: bool,
}

impl SelectionWalk {
    fn new() -> Self {
        Self {
            responsive: FxHashSet::default(),
            dynamic: false,
        }
    }

    fn finish(self) -> ObservedCall {
        ObservedCall {
            responsive: self.responsive,
            dynamic: self.dynamic,
        }
    }

    fn flag_dynamic(&mut self) {
        self.dynamic = true;
    }

    /// Observe every axis of a selection object; spreads and methods flag.
    fn observe_object(&mut self, obj: &ObjectExpression<'_>, shadowed: &[FxHashSet<String>]) {
        for prop in &obj.properties {
            let ObjectPropertyKind::ObjectProperty(prop) = prop else {
                self.flag_dynamic();
                continue;
            };
            let Some(axis) = static_key(&prop.key) else {
                self.flag_dynamic();
                continue;
            };
            self.observe_axis_value(&axis, &prop.value, shadowed);
        }
    }

    /// Observe one axis: a nested object is responsive, leaves are plain.
    /// Plain literals, null, and unshadowed undefined record nothing at all.
    fn observe_axis_value(
        &mut self,
        axis: &str,
        value: &Expression<'_>,
        shadowed: &[FxHashSet<String>],
    ) {
        if let Expression::ObjectExpression(obj) = unwrap_expression(value) {
            self.observe_responsive_object(axis, obj, shadowed);
            return;
        }
        if matches!(leaf_outcome(value, shadowed), LeafOutcome::Dynamic) {
            self.flag_dynamic();
        }
    }

    /// Observe one responsive object: every non-base leaf is a triple.
    /// `base` paints through the plain class, so its leaf needs nothing.
    fn observe_responsive_object(
        &mut self,
        axis: &str,
        obj: &ObjectExpression<'_>,
        shadowed: &[FxHashSet<String>],
    ) {
        for prop in &obj.properties {
            self.observe_breakpoint_prop(axis, prop, shadowed);
        }
    }

    /// Observe one breakpoint entry: text leaves record triples.
    fn observe_breakpoint_prop(
        &mut self,
        axis: &str,
        prop: &ObjectPropertyKind<'_>,
        shadowed: &[FxHashSet<String>],
    ) {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            self.flag_dynamic();
            return;
        };
        let Some(breakpoint) = static_key(&prop.key) else {
            self.flag_dynamic();
            return;
        };
        if breakpoint == "base" {
            return;
        }
        match leaf_outcome(&prop.value, shadowed) {
            LeafOutcome::Text(value) => {
                self.responsive
                    .insert((axis.to_string(), value, breakpoint));
            }
            LeafOutcome::Skip => {}
            LeafOutcome::Dynamic => self.flag_dynamic(),
        }
    }
}

/// Classify one selection leaf under runtime `String()` semantics: strings
/// and booleans map exactly, null and unshadowed undefined skip like the
/// runtime, and everything else (numbers, arrays, identifiers) is dynamic.
fn leaf_outcome(value: &Expression<'_>, shadowed: &[FxHashSet<String>]) -> LeafOutcome {
    match unwrap_expression(value) {
        Expression::StringLiteral(lit) => LeafOutcome::Text(lit.value.to_string()),
        Expression::BooleanLiteral(lit) => LeafOutcome::Text(boolean_str(lit.value)),
        Expression::NullLiteral(_) => LeafOutcome::Skip,
        Expression::Identifier(ident) => undefined_outcome(ident.name.as_str(), shadowed),
        _ => LeafOutcome::Dynamic,
    }
}

/// Classify an identifier leaf: unshadowed `undefined` skips like the
/// runtime, anything else (a variable) is dynamic.
fn undefined_outcome(name: &str, shadowed: &[FxHashSet<String>]) -> LeafOutcome {
    if name != "undefined" {
        return LeafOutcome::Dynamic;
    }
    if is_shadowed(shadowed, "undefined") {
        LeafOutcome::Dynamic
    } else {
        LeafOutcome::Skip
    }
}

/// Runtime `String(bool)` spelling for boolean selection leaves.
fn boolean_str(value: bool) -> String {
    if value {
        "true".to_string()
    } else {
        "false".to_string()
    }
}
