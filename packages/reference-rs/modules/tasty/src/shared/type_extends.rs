//! Assignability for conditional types over concrete `TypeRef`s. `type_extends` answers whether a
//! single check type extends an extends type, `every_member_extends` settles a union check that
//! TypeScript does not distribute, and `conditional_decision` applies the distribution policy inside
//! generic instantiations. Literal, primitive, object and top-type rules follow TypeScript; other
//! shapes answer `None`, which leaves the conditional unresolved. `null`, `undefined` and `void` are
//! never decided as a check, because their answers depend on strictNullChecks.

use crate::model::TypeRef;

use super::eval_budget::instantiating;
use super::literal_value::{classify, LiteralValue};

/// Whether a conditional's check extends its extends type. A union check, and `boolean` (which is
/// `true | false`), distributes in TypeScript only when it is a naked type parameter. Inside a generic
/// instantiation a substituted parameter looks exactly like a written union, so those fail closed.
/// At declaration level a union is never distributed, so every member must extend.
pub(crate) fn conditional_decision(check: &TypeRef, extends: &TypeRef) -> Option<bool> {
    if instantiating() && is_distributable(check) {
        return None;
    }
    match check {
        TypeRef::Union { types } => every_member_extends(types, extends),
        _ => type_extends(check, extends),
    }
}

fn is_distributable(check: &TypeRef) -> bool {
    matches!(check, TypeRef::Union { .. })
        || matches!(check, TypeRef::Intrinsic { name } if name == "boolean")
}

/// Whether `check` extends `extends`, for a check type that is not a union.
pub(crate) fn type_extends(check: &TypeRef, extends: &TypeRef) -> Option<bool> {
    if let TypeRef::Union { types } = extends {
        return any_member_extends(check, types);
    }
    match check {
        TypeRef::Literal { value } => literal_extends(value, extends),
        TypeRef::Intrinsic { name } => intrinsic_extends(name, extends),
        TypeRef::Object { .. }
        | TypeRef::Array { .. }
        | TypeRef::Tuple { .. }
        | TypeRef::Function { .. }
        | TypeRef::Constructor { .. } => object_extends(extends),
        _ => None,
    }
}

/// A union check that is not distributed: TypeScript requires every member to extend.
fn every_member_extends(members: &[TypeRef], extends: &TypeRef) -> Option<bool> {
    if members.is_empty() {
        return None;
    }
    let results: Vec<Option<bool>> = members
        .iter()
        .map(|member| type_extends(member, extends))
        .collect();
    if results.contains(&Some(false)) {
        return Some(false);
    }
    results
        .iter()
        .all(|result| *result == Some(true))
        .then_some(true)
}

fn any_member_extends(check: &TypeRef, members: &[TypeRef]) -> Option<bool> {
    let mut undecided = false;
    for member in members {
        match type_extends(check, member) {
            Some(true) => return Some(true),
            Some(false) => {}
            None => undecided = true,
        }
    }
    (!undecided).then_some(false)
}

fn literal_extends(value: &str, extends: &TypeRef) -> Option<bool> {
    let check = classify(value);
    if check == LiteralValue::Opaque {
        return None;
    }
    match extends {
        TypeRef::Literal { value: target } => {
            let target = classify(target);
            (target != LiteralValue::Opaque).then_some(check == target)
        }
        TypeRef::Intrinsic { name } => literal_vs_intrinsic(&check, name),
        _ => None,
    }
}

/// A literal against a primitive or top type: its own family decides a primitive, and the disjoint
/// intrinsics never admit a literal.
fn literal_vs_intrinsic(check: &LiteralValue<'_>, name: &str) -> Option<bool> {
    if is_top(name) {
        Some(true)
    } else if is_primitive(name) {
        Some(check.family() == Some(name))
    } else {
        is_disjoint(name).then_some(false)
    }
}

fn intrinsic_extends(name: &str, extends: &TypeRef) -> Option<bool> {
    if is_primitive(name) {
        primitive_extends(name, extends)
    } else if name == "object" {
        object_extends(extends)
    } else {
        None
    }
}

fn primitive_extends(name: &str, extends: &TypeRef) -> Option<bool> {
    match extends {
        TypeRef::Intrinsic { name: target } => intrinsic_pair(name, target),
        // A wide primitive is never assignable to one specific literal.
        TypeRef::Literal { .. } => Some(false),
        _ => None,
    }
}

fn object_extends(extends: &TypeRef) -> Option<bool> {
    match extends {
        TypeRef::Intrinsic { name } => intrinsic_pair("object", name),
        TypeRef::Literal { .. } => Some(false),
        _ => None,
    }
}

/// Two intrinsics: equal names and the top types are assignable, and a disjoint target is not.
fn intrinsic_pair(source: &str, target: &str) -> Option<bool> {
    if source == target || is_top(target) {
        Some(true)
    } else {
        is_disjoint(target).then_some(false)
    }
}

fn is_primitive(name: &str) -> bool {
    matches!(name, "string" | "number" | "boolean" | "bigint" | "symbol")
}

fn is_top(name: &str) -> bool {
    matches!(name, "unknown" | "any")
}

/// Intrinsics that no other intrinsic or object type is assignable to, besides themselves.
fn is_disjoint(name: &str) -> bool {
    is_primitive(name) || matches!(name, "object" | "null" | "undefined" | "void" | "never")
}
