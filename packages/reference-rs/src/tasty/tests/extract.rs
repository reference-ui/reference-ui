//! Unit tests for `ast::extract` — `ScannedWorkspace` → `ParsedTypeScriptAst` without resolve/scan.

use std::collections::BTreeSet;
use std::path::PathBuf;

use crate::tasty::ast::extract_ast;
use crate::tasty::ast::model::ImportBindingKind;
use crate::tasty::model::TypeRef;
use crate::tasty::scanner::{ScannedFile, ScannedWorkspace};

fn workspace(files: &[(&str, &str)]) -> ScannedWorkspace {
    let root_dir = PathBuf::from(".");
    let mut file_ids = BTreeSet::new();
    let mut out = Vec::new();
    for (file_id, source) in files {
        file_ids.insert((*file_id).to_string());
        out.push(ScannedFile {
            file_id: (*file_id).to_string(),
            module_specifier: (*file_id).to_string(),
            library: "user".to_string(),
            source: (*source).to_string(),
        });
    }
    ScannedWorkspace {
        root_dir,
        files: out,
        file_ids,
    }
}

fn single_file(file_id: &str, source: &str) -> ScannedWorkspace {
    workspace(&[(file_id, source)])
}

fn single_library_file(
    file_id: &str,
    module_specifier: &str,
    library: &str,
    source: &str,
) -> ScannedWorkspace {
    let root_dir = PathBuf::from(".");
    let mut file_ids = BTreeSet::new();
    file_ids.insert(file_id.to_string());
    ScannedWorkspace {
        root_dir,
        files: vec![ScannedFile {
            file_id: file_id.to_string(),
            module_specifier: module_specifier.to_string(),
            library: library.to_string(),
            source: source.to_string(),
        }],
        file_ids,
    }
}

fn parsed_file<'a>(
    ast: &'a crate::tasty::ast::model::ParsedTypeScriptAst,
    file_id: &str,
) -> &'a crate::tasty::ast::model::ParsedFileAst {
    ast.files
        .iter()
        .find(|f| f.file_id == file_id)
        .unwrap_or_else(|| panic!("missing file {file_id}"))
}

#[test]
fn extracts_interface_with_optional_member() {
    let scanned = single_file("test.ts", "export interface Props { label?: string }\n");
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    assert_eq!(file.exports.len(), 1);
    assert_eq!(file.exports[0].name, "Props");
    assert_eq!(file.exports[0].defined_members[0].name, "label");
    assert!(file.exports[0].defined_members[0].optional);
    assert!(ast.diagnostics.is_empty());
}

#[test]
fn interface_extends_yields_reference_type_refs() {
    let scanned = single_file(
        "test.ts",
        "export interface Child extends Base, Other { x: number }\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let shell = &file.exports[0];
    assert_eq!(shell.extends.len(), 2);
    match &shell.extends[0] {
        TypeRef::Reference {
            name, target_id, ..
        } => {
            assert_eq!(name, "Base");
            assert!(target_id.is_none());
        }
        other => panic!("expected Reference, got {other:?}"),
    }
    match &shell.extends[1] {
        TypeRef::Reference { name, .. } => assert_eq!(name, "Other"),
        other => panic!("expected Reference, got {other:?}"),
    }
}

#[test]
fn interface_extends_utility_preserves_type_arguments() {
    let scanned = single_file(
        "test.ts",
        "export interface Base { a: string; drop: number }\nexport interface S extends Omit<Base, 'drop'> {}\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let shell = file.exports.iter().find(|s| s.name == "S").expect("S");
    assert_eq!(shell.extends.len(), 1);
    match &shell.extends[0] {
        TypeRef::Reference {
            name,
            type_arguments: Some(args),
            ..
        } => {
            assert_eq!(name, "Omit");
            assert_eq!(args.len(), 2);
        }
        other => panic!("expected Reference with type args, got {other:?}"),
    }
}

#[test]
fn type_alias_union_underlying() {
    let scanned = single_file("test.ts", "export type U = string | number | boolean\n");
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let shell = &file.exports[0];
    let underlying = shell
        .underlying
        .as_ref()
        .expect("type alias should have underlying");
    match underlying {
        TypeRef::Union { types } => {
            assert_eq!(types.len(), 3);
            assert!(matches!(&types[0], TypeRef::Intrinsic { name } if name == "string"));
            assert!(matches!(&types[1], TypeRef::Intrinsic { name } if name == "number"));
            assert!(matches!(&types[2], TypeRef::Intrinsic { name } if name == "boolean"));
        }
        other => panic!("expected Union, got {other:?}"),
    }
}

#[test]
fn named_reexport_populates_export_bindings() {
    let scanned = workspace(&[
        ("src/other.ts", "export interface X { x: number }\n"),
        ("src/index.ts", "export { X } from './other'\n"),
    ]);
    let ast = extract_ast(&scanned);
    let index = parsed_file(&ast, "src/index.ts");
    assert_eq!(index.export_bindings.get("X"), Some(&"X".to_string()));
}

#[test]
fn export_type_from_package_does_not_add_local_type_alias_shell() {
    let scanned = single_file("src/index.ts", "export type { T } from 'pkg';\n");
    let ast = extract_ast(&scanned);
    let index = parsed_file(&ast, "src/index.ts");
    assert!(index.exports.iter().all(|s| s.name != "T"));
    assert!(index.import_bindings.get("T").is_none());
}

#[test]
fn export_type_from_local_module_skips_synthetic_type_alias_shell() {
    let scanned = workspace(&[
        ("src/other.ts", "export type T = string;\n"),
        ("src/index.ts", "export type { T } from './other';\n"),
    ]);
    let ast = extract_ast(&scanned);
    let index = parsed_file(&ast, "src/index.ts");
    assert!(
        index.exports.iter().all(|s| s.name != "T"),
        "local same-project type re-exports should not synthesize duplicate alias shells"
    );
    assert!(index.import_bindings.get("T").is_none());
}

#[test]
fn library_export_list_materializes_local_type_closure() {
    let scanned = single_library_file(
        "node_modules/fancy-lib/index.d.mts",
        "fancy-lib",
        "fancy-lib",
        "type Shared = { label: string }\n\
         type ButtonProps = Shared & { size?: number }\n\
         export { type ButtonProps }\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "node_modules/fancy-lib/index.d.mts");

    let shared = file
        .exports
        .iter()
        .find(|shell| shell.name == "Shared")
        .expect("local helper shell should be materialized");
    let button_props = file
        .exports
        .iter()
        .find(|shell| shell.name == "ButtonProps")
        .expect("exported local type should be materialized");

    assert!(!shared.exported);
    assert!(button_props.exported);
}

#[test]
fn default_export_interface_registers_binding_and_export() {
    let scanned = single_file(
        "test.ts",
        "export default interface DefaultExport { n: number }\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    assert_eq!(
        file.export_bindings.get("default"),
        Some(&"DefaultExport".to_string())
    );
    let shell = file
        .exports
        .iter()
        .find(|s| s.name == "DefaultExport")
        .expect("default export interface");
    assert!(shell.exported);
}

#[test]
fn const_object_as_const_populates_value_bindings() {
    let scanned = single_file("test.ts", "const cfg = { a: 1 } as const\nexport {}\n");
    let ast = extract_ast(&scanned);
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
    let scanned = single_file(
        "test.ts",
        "import { recipe } from '@reference-ui/react'\nconst buttonRecipe = recipe({ variants: { visual: { solid: {}, ghost: {} }, size: { sm: {}, md: {} } } })\nexport {}\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let binding = file
        .value_bindings
        .get("buttonRecipe")
        .expect("value binding for buttonRecipe");

    match binding {
        TypeRef::Function { params, .. } => {
            let selection = params
                .first()
                .and_then(|param| param.type_ref.as_ref())
                .expect("recipe selection parameter");
            match selection {
                TypeRef::Object { members } => {
                    let visual = members.iter().find(|member| member.name == "visual");
                    let size = members.iter().find(|member| member.name == "size");
                    assert!(visual.is_some(), "expected visual member, got {members:?}");
                    assert!(size.is_some(), "expected size member, got {members:?}");
                }
                other => panic!("expected object selection type, got {other:?}"),
            }
        }
        other => panic!("expected function value binding, got {other:?}"),
    }
}

#[test]
fn cva_call_populates_value_bindings_with_variant_selection_function() {
    let scanned = single_file(
        "test.ts",
        "import { cva } from 'src/system/css'\nconst buttonRecipe = cva({ variants: { visual: { solid: {}, ghost: {} }, size: { sm: {}, md: {} } } })\nexport {}\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let binding = file
        .value_bindings
        .get("buttonRecipe")
        .expect("value binding for buttonRecipe");

    match binding {
        TypeRef::Function { params, .. } => {
            let selection = params
                .first()
                .and_then(|param| param.type_ref.as_ref())
                .expect("cva selection parameter");
            match selection {
                TypeRef::Object { members } => {
                    assert!(
                        members.iter().any(|member| member.name == "visual"),
                        "expected visual member, got {members:?}"
                    );
                    assert!(
                        members.iter().any(|member| member.name == "size"),
                        "expected size member, got {members:?}"
                    );
                }
                other => panic!("expected object selection type, got {other:?}"),
            }
        }
        other => panic!("expected function value binding, got {other:?}"),
    }
}

#[test]
fn jsdoc_block_on_interface_is_parsed() {
    let scanned = single_file(
        "test.ts",
        "/**\n * Summary line for the interface.\n */\nexport interface Documented {}\n",
    );
    let ast = extract_ast(&scanned);
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
    let scanned = single_file(
        "test.ts",
        "export type Nested = Array<Map<string, number>>\n",
    );
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let underlying = file.exports[0].underlying.as_ref().expect("underlying");
    match underlying {
        TypeRef::Array { element } => match element.as_ref() {
            TypeRef::Reference {
                name,
                type_arguments,
                ..
            } => {
                assert_eq!(name, "Map");
                let args = type_arguments.as_ref().expect("Map args");
                assert_eq!(args.len(), 2);
                assert!(matches!(&args[0], TypeRef::Intrinsic { name } if name == "string"));
                assert!(matches!(&args[1], TypeRef::Intrinsic { name } if name == "number"));
            }
            other => panic!("expected Map reference inside Array, got {other:?}"),
        },
        other => panic!("expected Array, got {other:?}"),
    }
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
    let ast = extract_ast(&scanned);
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
    let ast = extract_ast(&scanned);
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
    let ast = extract_ast(&scanned);
    let file = parsed_file(&ast, "test.ts");
    let underlying = file.exports[0].underlying.as_ref().expect("underlying");
    eprintln!("ReadonlyTuple underlying: {underlying:?}");
}
