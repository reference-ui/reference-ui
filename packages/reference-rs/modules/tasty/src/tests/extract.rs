//! Unit tests for `ast::extract` — `ScannedWorkspace` → `ParsedTypeScriptAst` without resolve/scan.

mod exports;
mod lowering;
mod values;

use std::collections::BTreeSet;
use std::path::Path;
use std::rc::Rc;

use crate::ast::extract_ast;
use crate::model::TypeRef;
use crate::scanner::{ImportResolver, ScannedFile, ScannedWorkspace};

fn test_resolver() -> Rc<ImportResolver> {
    Rc::new(ImportResolver::new(Path::new(".")))
}

fn workspace(files: &[(&str, &str)]) -> ScannedWorkspace {
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
        resolver: test_resolver(),
        files: out,
        file_ids,
        bridged_libraries: BTreeSet::new(),
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
    let mut file_ids = BTreeSet::new();
    file_ids.insert(file_id.to_string());
    ScannedWorkspace {
        resolver: test_resolver(),
        files: vec![ScannedFile {
            file_id: file_id.to_string(),
            module_specifier: module_specifier.to_string(),
            library: library.to_string(),
            source: source.to_string(),
        }],
        file_ids,
        bridged_libraries: BTreeSet::new(),
    }
}

fn parsed_file<'a>(
    ast: &'a crate::ast::model::ParsedTypeScriptAst,
    file_id: &str,
) -> &'a crate::ast::model::ParsedFileAst {
    ast.files
        .iter()
        .find(|f| f.file_id == file_id)
        .unwrap_or_else(|| panic!("missing file {file_id}"))
}

/// The underlying type of the first export of a single-file workspace.
fn first_export_underlying(source: &str) -> TypeRef {
    let scanned = single_file("test.ts", source);
    let ast = extract_ast(&scanned).expect("extract should succeed");
    let file = parsed_file(&ast, "test.ts");
    file.exports[0]
        .underlying
        .clone()
        .expect("type alias should have underlying")
}

fn assert_intrinsic(type_ref: &TypeRef, expected: &str) {
    assert!(
        matches!(type_ref, TypeRef::Intrinsic { name } if name == expected),
        "expected intrinsic `{expected}`, got {type_ref:?}"
    );
}

#[test]
fn extracts_interface_with_optional_member() {
    let scanned = single_file("test.ts", "export interface Props { label?: string }\n");
    let ast = extract_ast(&scanned).expect("extract should succeed");
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
    let ast = extract_ast(&scanned).expect("extract should succeed");
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
    let ast = extract_ast(&scanned).expect("extract should succeed");
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
