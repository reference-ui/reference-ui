//! Destructuring declarations bound to const values (SPEC-V2-32).
//! `const { color } / { primary: color } / { color, ...space } / [a, b] /
//! { color = 'red' }` binds each name to the source entry it selects, so
//! uses resolve exactly like the member or index they abbreviate. Sources
//! are inline literals or earlier-recorded bindings; nested patterns bind
//! without values until SITE-29 records nested objects. Every bound name
//! carries a root dep on an identifier source, so a later write to the
//! source object strips all names copied from it.

mod array;
mod object;

use oxc_ast::ast::{BindingPattern, Expression};
use oxc_span::Span;

use super::binding::{Binding, BindingInit, BindingKind};
use super::table::{ScopeId, ScopeTable};
use super::value::{self, Dep, DepKey, KeyProvenance};
use crate::atom::AtomValue;

/// Where a pattern binds: the table, the declaring scope, and the kind.
pub(crate) struct PatternCtx<'t> {
    /// Bindings recorded so far (sources must already be declared).
    pub(crate) table: &'t ScopeTable,
    /// The scope the pattern declares its names in.
    pub(crate) scope: ScopeId,
    /// The declaration keyword (`const`, `let`, `var`).
    pub(crate) kind: BindingKind,
}

/// Names bound by one pattern plus the deps that strip them when stale.
pub(crate) struct PatternBind {
    /// `(name, binding)` pairs to declare in the pattern's scope.
    pub(crate) bindings: Vec<(String, Binding)>,
    /// Provenance deps for every value copied from an identifier source.
    pub(crate) deps: Vec<Dep>,
}

impl PatternBind {
    /// No bindings and no deps.
    pub(crate) fn empty() -> Self {
        Self {
            bindings: Vec::new(),
            deps: Vec::new(),
        }
    }

    /// Every name shadowed (no values), for unresolvable sources and nesting.
    pub(crate) fn shadowed(ctx: &PatternCtx<'_>, pattern: &BindingPattern<'_>) -> Self {
        let mut bindings = Vec::new();
        shadow_names(pattern, &ctx.kind, &mut bindings);
        Self {
            bindings,
            deps: Vec::new(),
        }
    }

    /// Move this bind's bindings and deps into another.
    pub(crate) fn drain_into(self, out: &mut PatternBind) {
        out.bindings.extend(self.bindings);
        out.deps.extend(self.deps);
    }
}

/// Bind every name a declaration pattern declares against its init.
pub(crate) fn bind_pattern(
    ctx: &PatternCtx<'_>,
    pattern: &BindingPattern<'_>,
    init: Option<&Expression<'_>>,
) -> PatternBind {
    match pattern {
        BindingPattern::ObjectPattern(obj) => object::bind_object_pattern(ctx, pattern, obj, init),
        BindingPattern::ArrayPattern(arr) => array::bind_array_pattern(ctx, pattern, arr, init),
        // Nested positions (`{ n: { deep } }`, `[a = x]`, rest args) bind
        // without values: nested sources are unrecorded until SITE-29.
        _ => PatternBind::shadowed(ctx, pattern),
    }
}

/// One scalar a pattern binds: its leaves plus each provenance it inherits.
pub(crate) struct LeavesBind<'a> {
    name: &'a str,
    span: Span,
    leaves: Vec<AtomValue>,
    /// Provenance of the copied entry, default, or slot, if identifier-fed.
    entry: Option<KeyProvenance>,
    /// Provenance of a computed pattern key, if identifier-fed.
    key: Option<KeyProvenance>,
    /// The identifier source root, for the write-poisons-all dep.
    root: Option<(ScopeId, String)>,
}

/// Push one bound scalar with its entry, key, and root deps.
pub(crate) fn push_leaves(ctx: &PatternCtx<'_>, bind: LeavesBind<'_>, out: &mut PatternBind) {
    out.bindings.push((
        bind.name.to_string(),
        Binding {
            kind: ctx.kind.clone(),
            init: Some(BindingInit::Scalars(bind.leaves)),
            span: bind.span,
        },
    ));
    if let Some(prov) = bind.entry {
        out.deps
            .push(prov.into_dep(ctx.scope, bind.name, DepKey::Whole));
    }
    if let Some(prov) = bind.key {
        out.deps
            .push(prov.into_dep(ctx.scope, bind.name, DepKey::Whole));
    }
    if let Some((src_scope, src_name)) = bind.root {
        // Any write to the source object invalidates every name copied from
        // it, including literal entries that carry no entry provenance.
        out.deps.push(Dep {
            scope: ctx.scope,
            name: bind.name.to_string(),
            key: DepKey::Whole,
            src_scope,
            src_name,
            src_key: None,
        });
    }
}

/// One inline slot's value: a literal or a single-leaf identifier.
pub(crate) fn slot_value(
    ctx: &PatternCtx<'_>,
    expr: &Expression<'_>,
) -> Option<(AtomValue, Option<KeyProvenance>)> {
    if let Some(leaf) = value::literal_leaf(expr) {
        return Some((leaf, None));
    }
    if let Expression::Identifier(id) = expr {
        let (leaf, src_scope) = value::single_scalar(ctx.table, ctx.scope, id.name.as_str())?;
        let prov = KeyProvenance {
            key: String::new(),
            src_scope,
            src_name: id.name.to_string(),
            src_key: None,
        };
        return Some((leaf, Some(prov)));
    }
    None
}

/// A destructured default's value: a literal or a single-leaf identifier.
pub(crate) fn default_value(
    ctx: &PatternCtx<'_>,
    expr: &Expression<'_>,
) -> Option<(AtomValue, Option<KeyProvenance>)> {
    slot_value(ctx, value::peel(expr))
}

/// One shadowed name: bound to shadow, carrying no value.
pub(crate) fn shadow_binding(ctx: &PatternCtx<'_>, name: &str, span: Span) -> (String, Binding) {
    (
        name.to_string(),
        Binding {
            kind: ctx.kind.clone(),
            init: None,
            span,
        },
    )
}

/// Gather every name a pattern binds as valueless shadow bindings.
fn shadow_names(
    pattern: &BindingPattern<'_>,
    kind: &BindingKind,
    out: &mut Vec<(String, Binding)>,
) {
    match pattern {
        BindingPattern::BindingIdentifier(ident) => {
            out.push((
                ident.name.to_string(),
                Binding {
                    kind: kind.clone(),
                    init: None,
                    span: ident.span,
                },
            ));
        }
        BindingPattern::ObjectPattern(obj) => {
            for prop in &obj.properties {
                shadow_names(&prop.value, kind, out);
            }
            if let Some(rest) = &obj.rest {
                shadow_names(&rest.argument, kind, out);
            }
        }
        BindingPattern::ArrayPattern(arr) => {
            for element in arr.elements.iter().flatten() {
                shadow_names(element, kind, out);
            }
            if let Some(rest) = &arr.rest {
                shadow_names(&rest.argument, kind, out);
            }
        }
        BindingPattern::AssignmentPattern(assign) => {
            shadow_names(&assign.left, kind, out);
        }
    }
}
