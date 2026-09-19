//! Object destructuring against const object sources.
//! Each listed property binds the recorded entry it selects (literals,
//! branching leaves, and identifier-fed fills alike); rest binds the
//! unlisted entries as a const object. Present-but-dynamic entries feed
//! the shadow, never the default — defaults fire only on missing keys.

use std::collections::BTreeMap;

use oxc_ast::ast::{BindingPattern, Expression, ObjectPattern, PropertyKey};

use super::super::binding::{Binding, BindingInit};
use super::super::table::ScopeId;
use super::super::value::{self, Dep, DepKey, KeyProvenance};
use super::{default_value, push_leaves, shadow_binding, LeavesBind, PatternBind, PatternCtx};
use crate::atom::AtomValue;
use crate::extract::constants::ConstObject;
use crate::extract::resolver::UnfoldableSpread;

/// A resolved object source: its entries plus per-key provenance.
struct ObjectSource {
    entries: ConstObject,
    provenances: BTreeMap<String, KeyProvenance>,
    /// The source binding when the source is an identifier (for root deps).
    root: Option<(ScopeId, String)>,
    /// Markers for refused import spreads inside an inline source.
    residues: Vec<UnfoldableSpread>,
}

/// The static leaves of one source entry, plus whether the entry dropped a
/// dynamic arm: absent and empty markers bind nothing.
fn entry_leaves(source: &ObjectSource, key: &str) -> Option<(Vec<AtomValue>, bool)> {
    let prop = source.entries.get(key)?;
    if prop.leaves.is_empty() {
        return None;
    }
    Some((prop.leaves.clone(), prop.residue))
}

/// One property a pattern lists: its key plus the value pattern.
struct ListedProp<'a> {
    key: String,
    key_dep: Option<KeyProvenance>,
    value: &'a BindingPattern<'a>,
}

/// Bind an object pattern's names against its init.
pub(crate) fn bind_object_pattern(
    ctx: &PatternCtx<'_, '_>,
    pattern: &BindingPattern<'_>,
    obj: &ObjectPattern<'_>,
    init: Option<&Expression<'_>>,
) -> PatternBind {
    let Some(source) = resolve_object_source(ctx, init) else {
        return PatternBind::shadowed(ctx, pattern);
    };
    let mut out = PatternBind::empty();
    out.residues.extend(source.residues.iter().cloned());
    let mut listed = Vec::new();
    let mut rest_blind = false;
    for prop in &obj.properties {
        let Some((key, key_dep)) = pattern_key(ctx, &prop.key) else {
            rest_blind = true;
            PatternBind::shadowed(ctx, &prop.value).drain_into(&mut out);
            continue;
        };
        listed.push(key.clone());
        bind_listed_prop(
            ctx,
            &source,
            ListedProp {
                key,
                key_dep,
                value: &prop.value,
            },
            &mut out,
        );
    }
    bind_object_rest(
        ctx,
        &source,
        ObjectRest {
            rest: obj.rest.as_deref(),
            listed: &listed,
            blind: rest_blind,
        },
        &mut out,
    );
    out
}

/// An object rest element plus the keys it must exclude, if knowable.
struct ObjectRest<'a> {
    rest: Option<&'a oxc_ast::ast::BindingRestElement<'a>>,
    listed: &'a [String],
    blind: bool,
}

/// Bind one listed property: the entry, its default, or a shadow.
fn bind_listed_prop(
    ctx: &PatternCtx<'_, '_>,
    source: &ObjectSource,
    prop: ListedProp<'_>,
    out: &mut PatternBind,
) {
    if let BindingPattern::BindingIdentifier(id) = prop.value {
        // const { color } = tokens  /  const { primary: color } = tokens
        let Some((leaves, residue)) = entry_leaves(source, &prop.key) else {
            out.bindings
                .push(shadow_binding(ctx, id.name.as_str(), id.span));
            return;
        };
        push_leaves(
            ctx,
            LeavesBind {
                name: id.name.as_str(),
                span: id.span,
                leaves,
                residue,
                entry: source.provenances.get(&prop.key).cloned(),
                key: prop.key_dep,
                root: source.root.clone(),
            },
            out,
        );
        return;
    }
    bind_defaulted_prop(ctx, source, prop, out);
}

/// Bind an assignment-pattern value: the entry wins, else the default.
fn bind_defaulted_prop(
    ctx: &PatternCtx<'_, '_>,
    source: &ObjectSource,
    prop: ListedProp<'_>,
    out: &mut PatternBind,
) {
    let BindingPattern::AssignmentPattern(assign) = prop.value else {
        // const { nested: { deep } } = tokens  — nested defers to SITE-29
        PatternBind::shadowed(ctx, prop.value).drain_into(out);
        return;
    };
    let BindingPattern::BindingIdentifier(id) = &assign.left else {
        PatternBind::shadowed(ctx, prop.value).drain_into(out);
        return;
    };
    if source.entries.contains_key(&prop.key) {
        // A present key holds its runtime value — even an empty marker feeds
        // the shadow, never the default (the default only fires on `undefined`).
        let Some((leaves, residue)) = entry_leaves(source, &prop.key) else {
            out.bindings
                .push(shadow_binding(ctx, id.name.as_str(), id.span));
            return;
        };
        // const { color = 'red' } = props  — the entry wins, default ignored
        push_leaves(
            ctx,
            LeavesBind {
                name: id.name.as_str(),
                span: id.span,
                leaves,
                residue,
                entry: source.provenances.get(&prop.key).cloned(),
                key: prop.key_dep,
                root: source.root.clone(),
            },
            out,
        );
        return;
    }
    // const { color = 'red' } = props  — a missing key falls to the default
    let Some((leaf, default_dep, residue)) = default_value(ctx, &assign.right) else {
        out.bindings
            .push(shadow_binding(ctx, id.name.as_str(), id.span));
        return;
    };
    push_leaves(
        ctx,
        LeavesBind {
            name: id.name.as_str(),
            span: id.span,
            leaves: vec![leaf],
            residue,
            entry: default_dep,
            key: prop.key_dep,
            root: source.root.clone(),
        },
        out,
    );
}

/// Bind an object rest element to the unlisted entries, if excludable.
fn bind_object_rest(
    ctx: &PatternCtx<'_, '_>,
    source: &ObjectSource,
    rest: ObjectRest<'_>,
    out: &mut PatternBind,
) {
    let Some(rest_elem) = rest.rest else {
        return;
    };
    let BindingPattern::BindingIdentifier(id) = &rest_elem.argument else {
        PatternBind::shadowed(ctx, &rest_elem.argument).drain_into(out);
        return;
    };
    if rest.blind {
        // An unresolvable key hides the exclusion set — the rest is unknowable.
        out.bindings
            .push(shadow_binding(ctx, id.name.as_str(), id.span));
        return;
    }
    // const { color, ...space } = tokens  — everything but `color`
    let mut remaining = ConstObject::new();
    for (key, prop) in &source.entries {
        if !rest.listed.iter().any(|name| name == key) {
            remaining.insert(key.clone(), prop.clone());
            if let Some(prov) = source.provenances.get(key) {
                let dep = prov.clone().into_dep(
                    ctx.scope,
                    id.name.as_str(),
                    DepKey::ObjectKey(key.clone()),
                );
                out.deps.push(dep);
            }
        }
    }
    out.bindings.push((
        id.name.to_string(),
        Binding {
            kind: ctx.kind.clone(),
            init: Some(BindingInit::Object(remaining)),
            span: id.span,
        },
    ));
    if let Some((src_scope, src_name)) = &source.root {
        out.deps.push(Dep {
            scope: ctx.scope,
            name: id.name.to_string(),
            key: DepKey::Whole,
            src_scope: *src_scope,
            src_name: src_name.clone(),
            src_key: None,
        });
    }
}

/// Resolve an object pattern's source: an inline object or a bound object.
fn resolve_object_source(
    ctx: &PatternCtx<'_, '_>,
    init: Option<&Expression<'_>>,
) -> Option<ObjectSource> {
    let init = value::peel(init?);
    if let Expression::ObjectExpression(obj) = init {
        // const { color } = { color: 'red' }
        let sink = value::object_init(obj, ctx.table, ctx.scope, ctx.fill);
        let provenances = sink
            .provenances
            .into_iter()
            .map(|p| (p.key.clone(), p))
            .collect();
        return Some(ObjectSource {
            entries: sink.entries,
            provenances,
            root: None,
            residues: sink.residues,
        });
    }
    if let Expression::Identifier(id) = init {
        // const { color } = tokens
        let (src_scope, binding) = ctx.table.resolve_from(id.name.as_str(), ctx.scope)?;
        if let Some(BindingInit::Object(map)) = &binding.init {
            let mut provenances = BTreeMap::new();
            for key in map.keys() {
                provenances.insert(
                    key.clone(),
                    KeyProvenance {
                        key: key.clone(),
                        src_scope,
                        src_name: id.name.to_string(),
                        src_key: Some(DepKey::ObjectKey(key.clone())),
                    },
                );
            }
            return Some(ObjectSource {
                entries: map.clone(),
                provenances,
                root: Some((src_scope, id.name.to_string())),
                residues: Vec::new(),
            });
        }
    }
    None
}

/// A pattern key: static spellings plus single-string computed identifiers.
fn pattern_key(
    ctx: &PatternCtx<'_, '_>,
    key: &PropertyKey<'_>,
) -> Option<(String, Option<KeyProvenance>)> {
    match key {
        PropertyKey::StaticIdentifier(ident) => {
            // { color }  /  { primary: color }
            Some((ident.name.to_string(), None))
        }
        PropertyKey::StringLiteral(lit) => {
            // { 'color': c }  /  { ['color']: c } — the spelling is static
            Some((lit.value.to_string(), None))
        }
        PropertyKey::Identifier(id) => {
            // { [key]: color }  after  const key = 'primary'
            let (leaf, src_scope) = value::single_scalar(ctx.table, ctx.scope, id.name.as_str())?;
            if let AtomValue::String(name) = leaf {
                let prov = KeyProvenance {
                    key: name.to_string(),
                    src_scope,
                    src_name: id.name.to_string(),
                    src_key: None,
                };
                return Some((name.to_string(), Some(prov)));
            }
            None
        }
        _ => None,
    }
}
