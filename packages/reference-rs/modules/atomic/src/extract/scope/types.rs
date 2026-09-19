//! Type-space bindings lowered to const objects: TS enums and param type literals.
//! An enum whose members carry string or numeric initializers folds member
//! reads (`Sizes.Small`) exactly like a const object; uninitialized members
//! drop that path, verbatim v2's fence. A function parameter annotated with
//! a `TSTypeLiteral` folds the same way (`props.color`), all-or-nothing:
//! one unfoldable member refuses the whole annotation, so a partial object
//! never answers `undefined` for a key the type left open. Destructured
//! params bind the members they select. These inits carry no runtime
//! provenance, so the stale-strip pass leaves them alone; a tracked write
//! to the name still poisons every use through the usual mutation check.

use oxc_ast::ast::{
    BindingPattern, Expression, FormalParameter, PropertyKey, TSEnumDeclaration, TSEnumMemberName,
    TSLiteral, TSSignature, TSType, UnaryOperator,
};
use oxc_span::Span;

use super::binding::BindingInit;
use crate::atom::AtomValue;
use crate::extract::constants::{ConstObject, ObjectProp};

/// Lower a TS enum to the object its initialized members name (SPEC-V2-45).
///
/// String, numeric, and boolean initializers record (plus unary `+`/`-` on
/// numerics); uninitialized, computed, and member-reference members drop
/// that path, so the use site warns exactly like a missing member.
pub fn enum_object(decl: &TSEnumDeclaration<'_>) -> ConstObject {
    // enum Sizes { Small = '4px', Auto }
    let mut entries = ConstObject::new();
    for member in &decl.body.members {
        let Some(name) = enum_member_name(&member.id) else {
            continue;
        };
        let Some(init) = member.initializer.as_ref() else {
            continue;
        };
        if let Some(leaf) = enum_member_leaf(init) {
            entries.insert(
                name,
                ObjectProp {
                    leaves: vec![leaf],
                    nested: ConstObject::new(),
                },
            );
        }
    }
    entries
}

/// One enum member's name, or None for exotic member names.
fn enum_member_name(id: &TSEnumMemberName<'_>) -> Option<String> {
    match id {
        TSEnumMemberName::Identifier(ident) => Some(ident.name.to_string()),
        TSEnumMemberName::String(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// One enum member's literal leaf, or None for computed initializers.
fn enum_member_leaf(init: &Expression<'_>) -> Option<AtomValue> {
    match init {
        Expression::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        Expression::NumericLiteral(n) => Some(AtomValue::Number(n.value.to_string().into())),
        Expression::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        Expression::UnaryExpression(unary) => enum_unary_leaf(unary),
        _ => None,
    }
}

/// A unary-prefixed numeric enum member (`-1`, `+2`), or None.
fn enum_unary_leaf(unary: &oxc_ast::ast::UnaryExpression<'_>) -> Option<AtomValue> {
    let Expression::NumericLiteral(n) = &unary.argument else {
        return None;
    };
    match unary.operator {
        UnaryOperator::UnaryNegation => Some(AtomValue::Number((-n.value).to_string().into())),
        UnaryOperator::UnaryPlus => Some(AtomValue::Number(n.value.to_string().into())),
        _ => None,
    }
}

/// Fold a parameter's `TSTypeLiteral` annotation to its object (SPEC-V2-46).
///
/// All-or-nothing, verbatim v2: every member must be a required property
/// signature with a static or string key and a string, number, or boolean
/// literal type. Optional members, index signatures, unions, references,
/// and nested literals refuse the whole annotation.
pub fn param_type_object(param: &FormalParameter<'_>) -> Option<ConstObject> {
    // function paint(props: { color: 'red'; size: 4 })
    let annotation = param.type_annotation.as_ref()?;
    let TSType::TSTypeLiteral(type_lit) = &annotation.type_annotation else {
        return None;
    };
    let mut entries = ConstObject::new();
    for member in &type_lit.members {
        let TSSignature::TSPropertySignature(prop) = member else {
            return None;
        };
        if prop.optional {
            return None;
        }
        let Some(key) = annotation_key(&prop.key) else {
            return None;
        };
        let annotation = prop.type_annotation.as_ref()?;
        let leaf = ts_literal_leaf(&annotation.type_annotation)?;
        entries.insert(
            key,
            ObjectProp {
                leaves: vec![leaf],
                nested: ConstObject::new(),
            },
        );
    }
    Some(entries)
}

/// One annotation member's key, or None for computed and exotic keys.
fn annotation_key(key: &PropertyKey<'_>) -> Option<String> {
    match key {
        PropertyKey::StaticIdentifier(ident) => Some(ident.name.to_string()),
        PropertyKey::StringLiteral(lit) => Some(lit.value.to_string()),
        _ => None,
    }
}

/// One annotation member's literal leaf, or None for non-literal types.
fn ts_literal_leaf(ts_type: &TSType<'_>) -> Option<AtomValue> {
    let TSType::TSLiteralType(lit_type) = ts_type else {
        return None;
    };
    match &lit_type.literal {
        TSLiteral::StringLiteral(s) => Some(AtomValue::String(s.value.as_str().into())),
        TSLiteral::NumericLiteral(n) => Some(AtomValue::Number(n.value.to_string().into())),
        TSLiteral::BooleanLiteral(b) => Some(AtomValue::Bool(b.value)),
        _ => None,
    }
}

/// Bind a destructured parameter against its folded annotation (SPEC-V2-46).
///
/// Identifier and rename selections carry the member's leaves; rest, defaults,
/// nesting, and array patterns refuse the whole parameter (None), so the
/// names bind to shadow with no value.
pub fn bind_param_pattern(
    pattern: &BindingPattern<'_>,
    annotation: &ConstObject,
) -> Option<Vec<(String, Span, BindingInit)>> {
    // function paint({ color }: { color: 'red' })
    let BindingPattern::ObjectPattern(obj) = pattern else {
        return None;
    };
    if obj.rest.is_some() {
        return None;
    }
    let mut bound = Vec::with_capacity(obj.properties.len());
    for prop in &obj.properties {
        let (name, span, key) = pattern_selection(&prop.key, &prop.value)?;
        let entry = annotation.get(&key)?;
        bound.push((name, span, BindingInit::Scalars(entry.leaves.clone())));
    }
    Some(bound)
}

/// One destructured selection: the bound name, its span, and the annotation key.
fn pattern_selection(
    key: &PropertyKey<'_>,
    value: &BindingPattern<'_>,
) -> Option<(String, Span, String)> {
    let BindingPattern::BindingIdentifier(ident) = value else {
        return None;
    };
    let annotation_key = match key {
        PropertyKey::StaticIdentifier(ident) => ident.name.to_string(),
        PropertyKey::StringLiteral(lit) => lit.value.to_string(),
        _ => return None,
    };
    Some((ident.name.to_string(), ident.span, annotation_key))
}
