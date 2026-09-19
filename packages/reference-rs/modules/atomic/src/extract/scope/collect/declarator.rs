//! Identifier declarator values: what `const name = init` carries.
//! An identifier declarator carries its init through one ordered chain — a
//! const object with resolved entries, an alias copy, a factory name, a
//! member-path read, a `token()` fold, or the literal/array/branch leaves of
//! the shared init node — while destructuring patterns bind the entries they
//! select. Every copied value carries a `Dep` on its source so a later write
//! strips the copy instead of resolving stale.

use oxc_ast::ast::{BindingPattern, VariableDeclarationKind, VariableDeclarator};

use super::super::binding::{Binding, BindingInit, BindingKind};
use super::super::destructure::{bind_pattern, PatternCtx};
use super::super::fill::SpreadResidue;
use super::super::init::binding_init;
use super::super::lookup::{ImportLookup, ScopeChain};
use super::super::value::{self, Dep, DepKey};
use super::ScopeCollector;
use crate::atom::AtomValue;
use crate::extract::constants::LocalConstants;

/// Record a declarator: identifier inits carry values, patterns bind entries.
pub(crate) fn record_declarator(collector: &mut ScopeCollector<'_>, decl: &VariableDeclarator<'_>) {
    let kind = declaration_kind(collector.decl_kind);
    if let BindingPattern::BindingIdentifier(ident) = &decl.id {
        // const space = '2r'  — the name carries its leaves
        let name = ident.name.as_str();
        let (init, deps) = declarator_init(collector, decl.init.as_ref(), name);
        collector.deps.extend(deps);
        collector.declare_current(
            name,
            Binding {
                kind,
                init,
                span: ident.span,
            },
        );
        return;
    }
    // const { color } = theme  — each name carries the entry it selects
    let scope = collector.current();
    let ctx = PatternCtx {
        table: &collector.table,
        scope,
        kind,
        fill: collector.fill,
    };
    let bound = bind_pattern(&ctx, &decl.id, decl.init.as_ref());
    collector.deps.extend(bound.deps);
    for marker in &bound.residues {
        for (name, _) in &bound.bindings {
            collector.residues.push(SpreadResidue {
                scope,
                name: name.clone(),
                marker: marker.clone(),
            });
        }
    }
    for (name, binding) in bound.bindings {
        collector.declare_current(&name, binding);
    }
}

/// An identifier declarator's carried value: resolving objects, else as before.
fn declarator_init(
    collector: &mut ScopeCollector<'_>,
    init: Option<&oxc_ast::ast::Expression<'_>>,
    name: &str,
) -> (Option<BindingInit>, Vec<Dep>) {
    let Some(init) = init else {
        return (None, Vec::new());
    };
    if let Some(obj) = value::as_object_init(init) {
        // const theme = { primary: red, ...base }  — literals plus resolved
        // identifier values and static spreads, with provenance deps.
        let scope = collector.current();
        let sink = value::object_init(obj, &collector.table, scope, collector.fill);
        let deps = sink
            .provenances
            .into_iter()
            .map(|provenance| {
                let key = DepKey::ObjectKey(provenance.key.clone());
                provenance.into_dep(scope, name, key)
            })
            .collect();
        for marker in sink.residues {
            collector.residues.push(SpreadResidue {
                scope,
                name: name.to_string(),
                marker,
            });
        }
        return (Some(BindingInit::Object(sink.entries)), deps);
    }
    if let Some(alias) = alias_init(collector, init, name) {
        return alias;
    }
    if let Some(factory) = factory_init(collector, init, name) {
        return factory;
    }
    if let Some(membered) = member_init(collector, init, name) {
        return membered;
    }
    if let Some(token) = super::token_init::token_init(collector, init, name) {
        return token;
    }
    // Literals, arrays, and branch leaves as before.
    (binding_init(init), Vec::new())
}

/// A static-member init reads the recorded leaves or nested object through
/// the table.
///
/// `const accent = tokens.colors.red` carries the member leaves, and
/// `const hover = styles.hover` carries the nested object, so uses resolve
/// exactly like the member they abbreviate. Only earlier local declarations
/// resolve (no imports, matching aliases); the copy carries a whole-binding
/// dep on the root so a later write strips it (SPEC-V2-31, §13).
fn member_init(
    collector: &ScopeCollector<'_>,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::StaticMemberExpression(mem) = peeled else {
        return None;
    };
    let root = crate::extract::fold::member_root_name(mem)?;
    // An empty import bag: member inits resolve table-locally only, exactly
    // like aliases, so imports and unbound roots stay valueless here.
    let empty = LocalConstants::default();
    let chain = ScopeChain::new(&collector.table, ImportLookup::ProjectBag(&empty));
    let scoped = chain.at(collector.current());
    let leaves = crate::extract::fold::member_path_leaves(mem, scoped);
    if !leaves.is_empty() {
        let dep = member_dep(collector, name, root)?;
        return Some((Some(BindingInit::Scalars(leaves)), vec![dep]));
    }
    if let Some(entries) = crate::extract::fold::member_path_object(mem, scoped) {
        // const hover = styles.hover  — the nested entries carry, so alias
        // uses lower exactly like the member they abbreviate (§13)
        let dep = member_dep(collector, name, root)?;
        return Some((Some(BindingInit::Object(entries.clone())), vec![dep]));
    }
    Some((None, Vec::new()))
}

/// A whole-binding dep from a member init onto its root binding, or None
/// when the root is not table-local (imports stay valueless here).
fn member_dep(collector: &ScopeCollector<'_>, name: &str, root: &str) -> Option<Dep> {
    let (src_scope, _) = collector.table.resolve_from(root, collector.current())?;
    Some(Dep {
        scope: collector.current(),
        name: name.to_string(),
        key: DepKey::Whole,
        src_scope,
        src_name: root.to_string(),
        src_key: None,
    })
}

/// A factory-call init resolves to the declared name, pending verification.
///
/// `const spin = keyframes({...})` carries `'spin'` — the keyframe name the
/// factory registers under. Any identifier callee with a single object arg
/// records optimistically (aliases included); the import binding is verified
/// after the visit, so forward imports and shadowing both answer correctly
/// and non-factory calls clear. The definition contents are unchecked
/// (product codegen is out of axis). `viewTransition` clears in the
/// post-pass: v2 refuses it as a value too, and the use site warns.
fn factory_init(
    collector: &mut ScopeCollector<'_>,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::CallExpression(call) = peeled else {
        return None;
    };
    let oxc_ast::ast::Expression::Identifier(callee) = &call.callee else {
        return None;
    };
    if !is_single_object_arg(call) {
        return None;
    }
    collector.factory.push(super::FactoryWait {
        scope: collector.current(),
        name: name.to_string(),
        callee: callee.name.to_string(),
    });
    Some((
        Some(BindingInit::Scalars(vec![AtomValue::String(
            name.to_string().into_boxed_str(),
        )])),
        Vec::new(),
    ))
}

/// True when a factory call takes exactly one inline object definition.
fn is_single_object_arg(call: &oxc_ast::ast::CallExpression<'_>) -> bool {
    if call.arguments.len() != 1 {
        return false;
    }
    matches!(
        call.arguments[0].as_expression(),
        Some(oxc_ast::ast::Expression::ObjectExpression(_))
    )
}

/// A bare-identifier init clones the target's recorded init, transitively.
///
/// `const b = a` copies whatever `a` already recorded (scalars, object,
/// array), so chains resolve in declaration order; a forward, missing, or
/// valueless target stays valueless, matching runtime TDZ. The copy carries
/// a whole-binding dep so a later write to the source strips it (SPEC-V2-34).
fn alias_init(
    collector: &ScopeCollector<'_>,
    init: &oxc_ast::ast::Expression<'_>,
    name: &str,
) -> Option<(Option<BindingInit>, Vec<Dep>)> {
    let peeled = value::peel(init);
    let oxc_ast::ast::Expression::Identifier(target) = peeled else {
        return None;
    };
    if target.name.as_str() == name {
        // const b = b  — the declarator shadows its own scope, so the
        // target is always TDZ-dead at runtime; never resolve outward.
        return Some((None, Vec::new()));
    }
    let scope = collector.current();
    let (src_scope, binding) = collector.table.resolve_from(target.name.as_str(), scope)?;
    let cloned = binding.init.clone()?;
    Some((
        Some(cloned),
        vec![Dep {
            scope,
            name: name.to_string(),
            key: DepKey::Whole,
            src_scope,
            src_name: target.name.to_string(),
            src_key: None,
        }],
    ))
}

/// Map a declaration keyword to its binding kind.
fn declaration_kind(kind: VariableDeclarationKind) -> BindingKind {
    match kind {
        VariableDeclarationKind::Const => BindingKind::Const,
        VariableDeclarationKind::Let => BindingKind::Let,
        VariableDeclarationKind::Var => BindingKind::Var,
        VariableDeclarationKind::Using | VariableDeclarationKind::AwaitUsing => BindingKind::Const,
    }
}
