//! Destructured parameter binding against a folded type-literal annotation. Each pattern name
//! resolves to the annotation member it selects: values where the member folds, shadows where it
//! does not. Rest binds the unlisted members, and defaults fire only on missing keys. Takes a
//! parameter pattern, its folded annotation object, and the scope table; emits the bound names as
//! scope entries.

use oxc_ast::ast::{BindingPattern, Expression, PropertyKey};

use super::super::binding::BindingInit;
use super::super::table::{ScopeId, ScopeTable};
use super::super::value::{self, peel};
use super::shadow::{shadow_pattern, ShadowOut};
use crate::atom::AtomValue;
use crate::extract::constants::ConstObject;

/// One param-pattern bind session: the annotation plus scope lookup.
struct ParamBind<'t> {
    /// The folded annotation members selections read from.
    annotation: &'t ConstObject,
    /// Bindings recorded so far, for identifier defaults.
    table: &'t ScopeTable,
    /// The scope the pattern declares its names in.
    scope: ScopeId,
    /// Keys the pattern lists, excluded from the rest leftovers.
    listed: Vec<String>,
    /// True when an unresolvable key hides the exclusion set.
    blind: bool,
    /// Bound names: values where they fold, None where they shadow.
    bound: ShadowOut,
}

/// Bind a destructured parameter against its folded annotation (SPEC-V2-46).
///
/// Per-name leniency, verbatim v2's `resolve_pattern_path`: identifier and
/// rename selections carry the member's leaves, rest binds the unlisted
/// members as an object, and defaults fire only on missing keys — a
/// defaulted name over a present key folds from the source. Unresolvable
/// keys, nesting, and array patterns bind their names to shadow, never
/// refusing the whole parameter.
pub fn bind_param_pattern(
    pattern: &BindingPattern<'_>,
    annotation: &ConstObject,
    table: &ScopeTable,
    scope: ScopeId,
) -> Option<ShadowOut> {
    // function paint({ color }: { color: 'red' })
    let BindingPattern::ObjectPattern(obj) = pattern else {
        return None;
    };
    let mut bind = ParamBind {
        annotation,
        table,
        scope,
        listed: Vec::with_capacity(obj.properties.len()),
        blind: false,
        bound: Vec::with_capacity(obj.properties.len() + 1),
    };
    for prop in &obj.properties {
        bind.prop(prop);
    }
    bind.rest(obj.rest.as_deref());
    Some(bind.bound)
}

impl ParamBind<'_> {
    /// Bind one listed property: the entry, its default, or a shadow.
    fn prop(&mut self, prop: &oxc_ast::ast::BindingProperty<'_>) {
        let Some(key) = param_key(&prop.key) else {
            // An unresolvable key hides the exclusion set — the names
            // shadow and the rest goes blind, siblings unaffected.
            self.blind = true;
            shadow_pattern(&prop.value, &mut self.bound);
            return;
        };
        self.listed.push(key.clone());
        match &prop.value {
            BindingPattern::BindingIdentifier(id) => self.plain(&key, id),
            BindingPattern::AssignmentPattern(assign) => self.defaulted(&key, assign),
            _ => shadow_pattern(&prop.value, &mut self.bound),
        }
    }

    /// Bind a plain selection: the member's leaves, or a shadow when missing.
    fn plain(&mut self, key: &str, id: &oxc_ast::ast::BindingIdentifier<'_>) {
        // function paint({ color }: { color: 'red' })
        let init = self.annotation.get(key).map(|entry| BindingInit::Scalars {
            leaves: entry.leaves.clone(),
            residue: entry.residue,
        });
        self.bound.push((id.name.to_string(), id.span, init));
    }

    /// Bind a defaulted selection: the entry wins, else the default.
    fn defaulted(&mut self, key: &str, assign: &oxc_ast::ast::AssignmentPattern<'_>) {
        let BindingPattern::BindingIdentifier(id) = &assign.left else {
            shadow_pattern(&assign.left, &mut self.bound);
            return;
        };
        if let Some(entry) = self.annotation.get(key) {
            // { color = 'blue' } over a present key — the source wins
            let init = BindingInit::Scalars {
                leaves: entry.leaves.clone(),
                residue: entry.residue,
            };
            self.bound.push((id.name.to_string(), id.span, Some(init)));
            return;
        }
        // A missing key falls to the default; an unfoldable default shadows.
        let init = self
            .default_leaf(&assign.right)
            .map(|(leaf, residue)| BindingInit::Scalars {
                leaves: vec![leaf],
                residue,
            });
        self.bound.push((id.name.to_string(), id.span, init));
    }

    /// A default's leaf: a literal or a single-leaf identifier, plus whether
    /// the identifier's binding dropped a dynamic arm beside its leaf.
    fn default_leaf(&self, expr: &Expression<'_>) -> Option<(AtomValue, bool)> {
        let peeled = peel(expr);
        if let Some(leaf) = value::literal_leaf(peeled) {
            return Some((leaf, false));
        }
        if let Expression::Identifier(id) = peeled {
            let (leaf, _) = value::single_scalar(self.table, self.scope, id.name.as_str())?;
            let residue = value::scalar_residue(self.table, self.scope, id.name.as_str());
            return Some((leaf, residue));
        }
        None
    }

    /// Bind a rest element to the unlisted members, if excludable.
    fn rest(&mut self, rest: Option<&oxc_ast::ast::BindingRestElement<'_>>) {
        let Some(rest) = rest else {
            return;
        };
        let BindingPattern::BindingIdentifier(id) = &rest.argument else {
            shadow_pattern(&rest.argument, &mut self.bound);
            return;
        };
        if self.blind {
            // An unresolvable key hides the exclusion set — unknowable.
            self.bound.push((id.name.to_string(), id.span, None));
            return;
        }
        // function paint({ a, ...rest }: ...)  — everything but `a`
        let mut remaining = ConstObject::new();
        for (key, prop) in self.annotation {
            if !self.listed.iter().any(|name| name == key) {
                remaining.insert(key.clone(), prop.clone());
            }
        }
        let init = BindingInit::Object(remaining);
        self.bound.push((id.name.to_string(), id.span, Some(init)));
    }
}

/// One pattern key's annotation spelling, or None when unresolvable.
fn param_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}
