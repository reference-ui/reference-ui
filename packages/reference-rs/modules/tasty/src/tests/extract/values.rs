//! Value-binding tests for `ast::extract`: `as const` objects and recipe or cva factory calls, whose selection parameter lists the variants. Each case extracts an in-memory workspace and checks the value binding it produces.

use crate::ast::extract_ast;
use crate::model::{TsMember, TypeRef};

use super::{single_file, parsed_file};

/// The variant members of the selection parameter of the factory call bound to `buttonRecipe` in `source`.
fn recipe_selection_members(source: &str) -> Vec<TsMember> {
    let scanned = single_file("test.ts", source);
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    let binding = file
        .value_bindings
        .get("buttonRecipe")
        .expect("value binding for buttonRecipe");
    let TypeRef::Function { params, .. } = binding else {
        panic!("expected function value binding, got {binding:?}");
    };
    let selection = params
        .first()
        .and_then(|param| param.type_ref.as_ref())
        .expect("factory selection parameter");
    let TypeRef::Object { members } = selection else {
        panic!("expected object selection type, got {selection:?}");
    };
    members.clone()
}

#[test]
fn const_object_as_const_populates_value_bindings() {
    let scanned = single_file("test.ts", "const cfg = { a: 1 } as const\nexport {}\n");
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    let binding = file
        .value_bindings
        .get("cfg")
        .expect("value binding for cfg");
    match binding {
        TypeRef::Object { members } => {
            assert!(
                members.iter().any(|m| m.name == "a"),
                "expected member a, got {members:?}"
            );
        }
        other => panic!("expected Object type ref, got {other:?}"),
    }
}

#[test]
fn recipe_call_populates_value_bindings_with_variant_selection_function() {
    let members = recipe_selection_members("import { recipe } from '@reference-ui/react'\nconst buttonRecipe = recipe({ variants: { visual: { solid: {}, ghost: {} }, size: { sm: {}, md: {} } } })\nexport {}\n");
    assert!(
        members.iter().any(|member| member.name == "visual"),
        "expected visual member, got {members:?}"
    );
    assert!(
        members.iter().any(|member| member.name == "size"),
        "expected size member, got {members:?}"
    );
}

#[test]
fn cva_call_populates_value_bindings_with_variant_selection_function() {
    let members = recipe_selection_members("import { cva } from 'src/system/runtime'\nconst buttonRecipe = cva({ variants: { visual: { solid: {}, ghost: {} }, size: { sm: {}, md: {} } } })\nexport {}\n");
    assert!(
        members.iter().any(|member| member.name == "visual"),
        "expected visual member, got {members:?}"
    );
    assert!(
        members.iter().any(|member| member.name == "size"),
        "expected size member, got {members:?}"
    );
}
