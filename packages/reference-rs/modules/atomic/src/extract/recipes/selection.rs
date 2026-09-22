//! Observed recipe call-site selections: the emission gate's signal.
//!
//! Records which recipes are called and which `(axis, value, breakpoint)`
//! responsive triples appear at literal call sites. Same-file result
//! bindings resolve during the visit by scope-table span match; imported
//! names resolve after extraction by tracing the import to its defining
//! export. Non-literal selections mark their recipe dynamic (fail-closed);
//! unresolvable callees stay silent and are never selections.

use oxc_ast::ast::{CallExpression, Expression, ObjectExpression, ObjectPropertyKind};
use rustc_hash::{FxHashMap, FxHashSet};
use oxc_span::Span;

use super::super::bindings::{is_reference_package, is_shadowed};
use super::super::identity::IdentityGraph;
use super::super::scope::Lookup;
use super::walk::{static_key, unwrap_expression};
use crate::extract::ExtractContext;
use crate::recipes::Recipe;

/// One `(axis, value, breakpoint)` responsive triple from a literal selection.
pub(crate) type ResponsiveTriple = (String, String, String);

/// A `const X = recipe(...)` declarator: local name, class, and binding span.
/// Top-level bindings also feed the cross-file index; nested ones resolve
/// same-file calls only.
#[derive(Debug, Clone)]
pub(crate) struct RecipeBinding {
    pub file: String,
    pub local: String,
    pub class_name: String,
    pub span: Span,
    pub top_level: bool,
}

/// Where a tentative selection points: a known class or an import to trace.
#[derive(Debug, Clone)]
pub(crate) enum SelectionTarget {
    /// Same-file binding or IIFE: the className is already known.
    ClassName(String),
    /// Imported name: trace (`specifier`, `imported`) from the caller's file.
    Import { specifier: String, imported: String },
}

/// One call-site observation awaiting cross-file resolution.
#[derive(Debug, Clone)]
pub(crate) struct TentativeSelection {
    pub file: String,
    pub target: SelectionTarget,
    pub responsive: FxHashSet<ResponsiveTriple>,
    pub dynamic: bool,
}

/// One recipe's merged call-site observations: the gate input.
#[derive(Debug, Clone)]
pub(crate) struct RecipeSelection {
    pub class_name: String,
    pub responsive: FxHashSet<ResponsiveTriple>,
    pub dynamic: bool,
}

/// Gate input for one observed recipe: the triples plus the dynamic flag.
#[derive(Debug)]
pub(crate) struct ObservedGate {
    pub responsive: FxHashSet<ResponsiveTriple>,
    pub dynamic: bool,
}

/// Emission gate for one recipe: open, observed-gated, or unobserved.
pub(crate) enum Gate<'a> {
    /// Full matrix: spec recipes and dynamic selections fail closed.
    Open,
    /// Plain rules plus exactly the observed responsive triples.
    Observed(&'a ObservedGate),
    /// No rules at all: uncalled recipes shake out.
    Unobserved,
}

/// Assembly-side index answering the gate for each recipe className.
pub(crate) struct SelectionIndex {
    observed: FxHashMap<String, ObservedGate>,
    open: FxHashSet<String>,
    open_all: bool,
}

impl SelectionIndex {
    /// Index resolved selections; spec recipes stay unconditionally open.
    pub(crate) fn new(selections: &[RecipeSelection], spec: &[Recipe]) -> Self {
        let mut observed = FxHashMap::default();
        for selection in selections {
            observed.insert(
                selection.class_name.clone(),
                ObservedGate {
                    responsive: selection.responsive.clone(),
                    dynamic: selection.dynamic,
                },
            );
        }
        let open = spec
            .iter()
            .map(|recipe| recipe.class_name.clone())
            .collect();
        Self {
            observed,
            open,
            open_all: false,
        }
    }

    /// Answer the gate for one recipe className.
    pub(crate) fn get(&self, class_name: &str) -> Gate<'_> {
        if self.open_all || self.open.contains(class_name) {
            return Gate::Open;
        }
        match self.observed.get(class_name) {
            Some(gate) => Gate::Observed(gate),
            None => Gate::Unobserved,
        }
    }

    /// An index with every gate open, for tests below the extract signal.
    #[cfg(test)]
    pub(crate) fn open() -> Self {
        Self {
            observed: FxHashMap::default(),
            open: FxHashSet::default(),
            open_all: true,
        }
    }
}

/// Collect one call expression as a tentative recipe selection, if it is one.
/// Direct calls to same-file bindings and imports resolve; namespace members
/// trace like named imports; any other callee (including `x.raw`) is silent.
pub(crate) fn extract_call(call: &CallExpression<'_>, ctx: &mut ExtractContext<'_>) {
    let Some(target) = resolve_target(call, ctx) else {
        return;
    };
    let observed = observe_call(call, ctx);
    ctx.tentative.push(TentativeSelection {
        file: ctx.file.to_string(),
        target,
        responsive: observed.responsive,
        dynamic: observed.dynamic,
    });
}

/// Resolve every tentative selection against the binding index and imports.
/// Same-file targets pass through; imports trace to their defining export;
/// Reference and untraceable targets drop silently. Output is sorted.
pub(crate) fn resolve_all(
    tentative: &[TentativeSelection],
    bindings: &[RecipeBinding],
    identity: &IdentityGraph<'_>,
) -> Vec<RecipeSelection> {
    let mut index: FxHashMap<(&str, &str), &str> = FxHashMap::default();
    for binding in bindings.iter().filter(|binding| binding.top_level) {
        index
            .entry((binding.file.as_str(), binding.local.as_str()))
            .or_insert(binding.class_name.as_str());
    }
    let mut merged: FxHashMap<String, RecipeSelection> = FxHashMap::default();
    for selection in tentative {
        let Some(class) = selection.resolve_class(&index, identity) else {
            continue;
        };
        match merged.entry(class) {
            std::collections::hash_map::Entry::Occupied(mut entry) => {
                let current = entry.get_mut();
                current
                    .responsive
                    .extend(selection.responsive.iter().cloned());
                current.dynamic |= selection.dynamic;
            }
            std::collections::hash_map::Entry::Vacant(entry) => {
                let class_name = entry.key().clone();
                entry.insert(RecipeSelection {
                    class_name,
                    responsive: selection.responsive.clone(),
                    dynamic: selection.dynamic,
                });
            }
        }
    }
    let mut out: Vec<RecipeSelection> = merged.into_values().collect();
    out.sort_by(|a, b| a.class_name.cmp(&b.class_name));
    out
}

impl TentativeSelection {
    /// The className this selection points at, if it resolves. Same-file
    /// classes passed visit-time span match; imports trace to their
    /// defining export. Reference and untraceable targets resolve away.
    fn resolve_class(
        &self,
        index: &FxHashMap<(&str, &str), &str>,
        identity: &IdentityGraph<'_>,
    ) -> Option<String> {
        match &self.target {
            SelectionTarget::ClassName(class) => Some(class.clone()),
            SelectionTarget::Import {
                specifier,
                imported,
            } => {
                if is_reference_package(specifier) {
                    return None;
                }
                let (file, local) =
                    identity.trace_binding_terminal(self.file.as_str(), specifier, imported)?;
                index
                    .get(&(file.as_str(), local.as_str()))
                    .map(|class| class.to_string())
            }
        }
    }
}

/// Resolve a call's callee to a selection target, if it names a recipe fn.
fn resolve_target(call: &CallExpression<'_>, ctx: &ExtractContext<'_>) -> Option<SelectionTarget> {
    match &call.callee {
        Expression::Identifier(ident) => resolve_ident(ident.name.as_str(), ctx),
        Expression::StaticMemberExpression(member) => {
            resolve_member(&member.object, member.property.name.as_str(), ctx)
        }
        Expression::ComputedMemberExpression(member) => {
            let Expression::StringLiteral(lit) = unwrap_expression(&member.expression) else {
                return None;
            };
            resolve_member(&member.object, lit.value.as_str(), ctx)
        }
        Expression::CallExpression(inner) => resolve_iife(inner, ctx),
        _ => None,
    }
}

/// Resolve a bare callee: same-file binding by span match, else an import.
/// A local non-recipe binding shadows everything and resolves to nothing.
fn resolve_ident(name: &str, ctx: &ExtractContext<'_>) -> Option<SelectionTarget> {
    match ctx.chain.resolve(name, ctx.scope) {
        Lookup::Local(binding) => ctx
            .recipe_bindings
            .iter()
            .find(|bound| {
                bound.local == name && bound.file == ctx.file && bound.span == binding.span
            })
            .map(|bound| SelectionTarget::ClassName(bound.class_name.clone())),
        Lookup::Import(import) => {
            if is_reference_package(import.specifier.as_ref()) {
                return None;
            }
            Some(SelectionTarget::Import {
                specifier: import.specifier.to_string(),
                imported: import.imported.to_string(),
            })
        }
        Lookup::Unbound => None,
    }
}

/// Resolve a member callee only over a namespace import (`ns.recipe(...)`).
/// Members over any other object (`panel.raw`) are never selections.
fn resolve_member(
    object: &Expression<'_>,
    prop: &str,
    ctx: &ExtractContext<'_>,
) -> Option<SelectionTarget> {
    let Expression::Identifier(namespace) = object else {
        return None;
    };
    let Lookup::Import(import) = ctx.chain.resolve(namespace.name.as_str(), ctx.scope) else {
        return None;
    };
    if import.imported.as_ref() != "*" || is_reference_package(import.specifier.as_ref()) {
        return None;
    }
    Some(SelectionTarget::Import {
        specifier: import.specifier.to_string(),
        imported: prop.to_string(),
    })
}

/// Resolve `recipe({...})(selection)`: the definition carries its className.
/// Anything unreadable stays silent; the inner call keeps its own diagnostic.
fn resolve_iife(inner: &CallExpression<'_>, ctx: &ExtractContext<'_>) -> Option<SelectionTarget> {
    if ctx
        .bindings
        .recipe_origin(&inner.callee, ctx.shadowed)
        .is_none()
    {
        return None;
    }
    let first = inner.arguments.first()?.as_expression()?;
    let Expression::ObjectExpression(obj) = unwrap_expression(first) else {
        return None;
    };
    if let Some(class) = literal_class_name(obj) {
        return Some(SelectionTarget::ClassName(class));
    }
    super::infer_binding_class_name(ctx.recipe_binding).map(SelectionTarget::ClassName)
}

/// Read a silent string-literal `className` prop from a definition object.
fn literal_class_name(obj: &ObjectExpression<'_>) -> Option<String> {
    for prop in &obj.properties {
        let ObjectPropertyKind::ObjectProperty(prop) = prop else {
            continue;
        };
        if static_key(&prop.key).as_deref() != Some("className") {
            continue;
        }
        if let Expression::StringLiteral(lit) = unwrap_expression(&prop.value) {
            if !lit.value.trim().is_empty() {
                return Some(lit.value.to_string());
            }
        }
        return None;
    }
    None
}

/// One selection's observations: responsive triples plus the dynamic flag.
struct ObservedCall {
    responsive: FxHashSet<ResponsiveTriple>,
    dynamic: bool,
}

/// Observe a resolved call's first argument: literals record, dynamics flag.
/// Zero-arg calls mark called and observe nothing; the caller already pushed.
fn observe_call(call: &CallExpression<'_>, ctx: &ExtractContext<'_>) -> ObservedCall {
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
