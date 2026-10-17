//! Lowering tests for `ast::extract`: type aliases and nested references, JSDoc on interfaces, named default namespace imports, and readonly tuples. Each case extracts an in-memory workspace and checks the lowered `TypeRef` values.

use crate::ast::extract_ast;
use crate::ast::model::ImportBindingKind;
use crate::model::TypeRef;

use super::{workspace, single_file, parsed_file, first_export_underlying, assert_intrinsic};

#[test]
fn type_alias_union_underlying() {
    let underlying = first_export_underlying("export type U = string | number | boolean\n");
    let TypeRef::Union { types } = &underlying else {
        panic!("expected Union, got {underlying:?}");
    };
    assert_eq!(types.len(), 3);
    assert_intrinsic(&types[0], "string");
    assert_intrinsic(&types[1], "number");
    assert_intrinsic(&types[2], "boolean");
}

#[test]
fn jsdoc_block_on_interface_is_parsed() {
    let scanned = single_file(
        "test.ts",
        "/**\n * Summary line for the interface.\n */\nexport interface Documented {}\n",
    );
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    let shell = &file.exports[0];
    let summary = shell
        .jsdoc
        .as_ref()
        .and_then(|j| j.summary.as_ref())
        .map(|s| s.as_str())
        .or(shell.description.as_deref());
    assert!(
        summary
            .unwrap_or("")
            .contains("Summary line for the interface"),
        "expected summary text, got {:?}",
        summary
    );
}

#[test]
fn nested_array_map_reference_structure() {
    let underlying = first_export_underlying("export type Nested = Array<Map<string, number>>\n");
    let TypeRef::Array { element } = &underlying else {
        panic!("expected Array, got {underlying:?}");
    };
    let TypeRef::Reference {
        name,
        type_arguments,
        ..
    } = element.as_ref()
    else {
        panic!("expected Map reference inside Array, got {element:?}");
    };
    assert_eq!(name, "Map");
    let args = type_arguments.as_ref().expect("Map args");
    assert_eq!(args.len(), 2);
    assert_intrinsic(&args[0], "string");
    assert_intrinsic(&args[1], "number");
}

#[test]
fn import_bindings_named_default_namespace() {
    let scanned = workspace(&[
        ("src/dep.ts", "export interface Foo { x: number }\n"),
        (
            "src/entry.ts",
            "import type { Foo } from './dep'\nimport D from './dep'\nimport * as DepNs from './dep'\n\nexport type Entry = Foo\n",
        ),
    ]);
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "src/entry.ts");

    let named = file.import_bindings.get("Foo").expect("Foo import");
    assert!(matches!(named.kind, ImportBindingKind::Named));
    assert_eq!(named.imported_name, "Foo");
    assert_eq!(named.source_module, "./dep");
    assert_eq!(named.target_file_id.as_deref(), Some("src/dep.ts"));

    let default_binding = file.import_bindings.get("D").expect("default import");
    assert!(matches!(default_binding.kind, ImportBindingKind::Default));
    assert_eq!(default_binding.imported_name, "default");
    assert_eq!(
        default_binding.target_file_id.as_deref(),
        Some("src/dep.ts")
    );

    let ns = file.import_bindings.get("DepNs").expect("namespace import");
    assert!(matches!(ns.kind, ImportBindingKind::Namespace));
    assert_eq!(ns.imported_name, "*");
    assert_eq!(ns.target_file_id.as_deref(), Some("src/dep.ts"));
}

#[test]
fn readonly_tuple_of_string_literals_lowers_to_tuple() {
    let scanned = single_file(
        "test.ts",
        "export type ConstAssertion = readonly ['users', 'posts', 'comments']\n",
    );
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    let underlying = file.exports[0].underlying.as_ref().expect("underlying");
    match underlying {
        TypeRef::Tuple { elements } => {
            assert_eq!(elements.len(), 3);
            assert!(elements.iter().all(|e| e.readonly));
        }
        other => panic!("expected Tuple, got {other:?}"),
    }
}

#[test]
fn readonly_tuple_primitive_lowers() {
    let scanned = single_file(
        "test.ts",
        "export type ReadonlyTuple = readonly [string, number]\n",
    );
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    let underlying = file.exports[0].underlying.as_ref().expect("underlying");
    eprintln!("ReadonlyTuple underlying: {underlying:?}");
}
