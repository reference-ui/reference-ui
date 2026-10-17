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

mod bind;
mod enums;
mod shadow;

pub use bind::bind_param_pattern;
pub use enums::enum_object;

use oxc_ast::ast::{FormalParameter, PropertyKey, TSLiteral, TSSignature, TSType};

use crate::atom::AtomValue;
use crate::extract::constants::{ConstObject, ObjectProp};

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
        let key = annotation_key(&prop.key)?;
        let annotation = prop.type_annotation.as_ref()?;
        let leaf = ts_literal_leaf(&annotation.type_annotation)?;
        entries.insert(
            key,
            ObjectProp {
                leaves: vec![leaf],
                nested: ConstObject::new(),
                residue: false,
                ident: None,
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
