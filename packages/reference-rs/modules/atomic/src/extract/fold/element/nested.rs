//! Chained const-entry reads for element access: `colors['red']['500']` resolves inside out through
//! nested const objects and arrays. Each chain step yields a nested entry map, a named write that
//! poisons the chain, or nothing; the outer key then reads like a single-hop lookup, so misses and
//! non-scalars report with the outer key. Takes the chain's base expression, its scope, and the
//! key; emits leaves, residue, and refusals into the caller's fold.

use oxc_ast::ast::Expression;

use super::super::element_index::{fold_index, IndexFold};
use super::super::member::{member_path_object, member_root_name};
use super::inline::array_position;
use super::{ElementFold, ElementRefusal};
use crate::extract::constants::{object_entries, ConstArrayElement, ConstObject};
use crate::extract::expressions::walk::unwrap_wrapper_target;
use crate::extract::scope::Scoped;

/// A chained base resolved to entries, a named write, or unresolvable.
enum Nested {
    /// The entries the chain names; the caller looks the key up in them.
    Entries(ConstObject),
    /// An identifier hop was written; the caller names the write.
    Mutated { name: String, write: String },
    /// Anything else; the caller refuses the base at its span.
    Dynamic,
}

/// Look one key up in a chained base (`colors['red']['500']`), or false.
///
/// Member and computed chains resolve inside out through [`nested_entries`];
/// the outer key then looks up exactly like a single-hop read, so misses
/// and non-scalars diagnose with the outer key. An unresolvable chain falls
/// through to the caller's base refusal, so only a named write returns handled.
pub(super) fn lookup_nested_base(
    object: &Expression<'_>,
    key: &str,
    scoped: Scoped<'_>,
    fold: &mut ElementFold,
) -> bool {
    let mut probe = object;
    while let Some(inner) = unwrap_wrapper_target(probe) {
        probe = inner;
    }
    if !matches!(
        probe,
        Expression::ComputedMemberExpression(_) | Expression::StaticMemberExpression(_)
    ) {
        return false;
    }
    match nested_entries(probe, scoped) {
        Nested::Entries(entries) => {
            lookup_nested_entry(&entries, key, fold);
            true
        }
        Nested::Mutated { name, write } => {
            fold.refusals
                .push(ElementRefusal::MutatedBase { name, write });
            true
        }
        Nested::Dynamic => false,
    }
}

/// Look the outer key up in resolved nested entries.
fn lookup_nested_entry(entries: &ConstObject, key: &str, fold: &mut ElementFold) {
    match entries.get(key) {
        Some(prop) if !prop.leaves.is_empty() => {
            fold.values.extend(prop.leaves.iter().cloned());
            fold.residue |= prop.residue;
        }
        Some(_) => {
            fold.refusals.push(ElementRefusal::NonScalar {
                key: key.to_string(),
            });
        }
        None => fold.refusals.push(ElementRefusal::Missing {
            key: key.to_string(),
        }),
    }
}

/// Resolve a chained base to its entries, peeling wrappers first.
fn nested_entries(expr: &Expression<'_>, scoped: Scoped<'_>) -> Nested {
    if let Some(inner) = unwrap_wrapper_target(expr) {
        return nested_entries(inner, scoped);
    }
    nested_entries_inner(expr, scoped)
}

/// Resolve an unwrapped chained base: identifier tables, static member
/// paths, inline objects, and computed reads over them, inside out.
fn nested_entries_inner(expr: &Expression<'_>, scoped: Scoped<'_>) -> Nested {
    match expr {
        Expression::Identifier(base) => nested_ident(base.name.as_str(), scoped),
        Expression::StaticMemberExpression(mem) => nested_static(mem, scoped),
        Expression::ComputedMemberExpression(mem) => nested_computed(mem, scoped),
        Expression::ObjectExpression(obj) => Nested::Entries(object_entries(obj)),
        _ => Nested::Dynamic,
    }
}

/// An identifier hop: its const table, or the write that poisoned it.
fn nested_ident(name: &str, scoped: Scoped<'_>) -> Nested {
    if let Some(write) = scoped.mutation(name) {
        return Nested::Mutated {
            name: name.to_string(),
            write: write.write_phrase(),
        };
    }
    match scoped.object(name) {
        Some(entries) => Nested::Entries(entries.clone()),
        None => Nested::Dynamic,
    }
}

/// A static-member hop (`o.red['500']`) through the member path node.
fn nested_static(mem: &oxc_ast::ast::StaticMemberExpression<'_>, scoped: Scoped<'_>) -> Nested {
    if let Some(root) = member_root_name(mem) {
        if let Some(write) = scoped.mutation(root) {
            return Nested::Mutated {
                name: root.to_string(),
                write: write.write_phrase(),
            };
        }
    }
    match member_path_object(mem, scoped) {
        Some(entries) => Nested::Entries(entries.clone()),
        None => Nested::Dynamic,
    }
}

/// A computed hop: its base's entries under its single intermediate key.
///
/// Multi-leaf intermediates refuse, verbatim v2 (Conditional keys drop in
/// `literal_to_property_key`); only the terminal index fans out.
fn nested_computed(mem: &oxc_ast::ast::ComputedMemberExpression<'_>, scoped: Scoped<'_>) -> Nested {
    let IndexFold::Keys(keys) = fold_index(&mem.expression, scoped) else {
        return Nested::Dynamic;
    };
    let [key] = keys.as_slice() else {
        return Nested::Dynamic;
    };
    match nested_entries(&mem.object, scoped) {
        Nested::Entries(entries) => nested_prop_object(&entries, key),
        Nested::Mutated { name, write } => Nested::Mutated { name, write },
        Nested::Dynamic => nested_array_object(&mem.object, key, scoped),
    }
}

/// The nested entries under one intermediate key, if it holds an object.
fn nested_prop_object(entries: &ConstObject, key: &str) -> Nested {
    match entries.get(key) {
        Some(prop) if !prop.nested.is_empty() => Nested::Entries(prop.nested.clone()),
        _ => Nested::Dynamic,
    }
}

/// A const-array hop (`matrix[0]['x']`): the indexed object entries.
fn nested_array_object(object: &Expression<'_>, key: &str, scoped: Scoped<'_>) -> Nested {
    let mut probe = object;
    while let Some(inner) = unwrap_wrapper_target(probe) {
        probe = inner;
    }
    let Expression::Identifier(base) = probe else {
        return Nested::Dynamic;
    };
    let name = base.name.as_str();
    if let Some(write) = scoped.mutation(name) {
        return Nested::Mutated {
            name: name.to_string(),
            write: write.write_phrase(),
        };
    }
    let Some(elements) = scoped.array(name) else {
        return Nested::Dynamic;
    };
    let Some(pos) = array_position(key) else {
        return Nested::Dynamic;
    };
    match elements.get(pos) {
        Some(ConstArrayElement::Object(leaves)) => {
            // Array objects record flat leaf maps; lift each leaf to an entry.
            let mut entries = ConstObject::new();
            for (name, leaf) in leaves {
                entries.insert(
                    name.clone(),
                    crate::extract::constants::ObjectProp {
                        leaves: vec![leaf.clone()],
                        nested: ConstObject::new(),
                        residue: false,
                        ident: None,
                    },
                );
            }
            Nested::Entries(entries)
        }
        _ => Nested::Dynamic,
    }
}
