use std::fs;
use std::path::{Path, PathBuf};

use super::generator::emit_esm_bundle;
use super::{scan_typescript_bundle, ScanRequest, TsSymbolKind, TypeRef, TypeScriptBundle};

#[test]
fn writes_a_concrete_bundle_output_for_fixture_inspection() {
    let bundle = scan_fixture();

    assert_eq!(bundle.version, 1);
    assert!(fixture_output_path().exists());
}

#[test]
fn collects_expected_exported_symbols_from_scanned_files() {
    let bundle = scan_fixture();

    assert_eq!(
        bundle
            .exports
            .get("./scan_here/button")
            .expect("button exports"),
        &std::collections::BTreeMap::from([
            (
                "ButtonProps".to_string(),
                "sym:scan_here/button.ts#ButtonProps".to_string(),
            ),
            (
                "Size".to_string(),
                "sym:scan_here/button.ts#Size".to_string()
            ),
        ])
    );
    assert_eq!(
        bundle
            .exports
            .get("./scan_here/index")
            .expect("index exports"),
        &std::collections::BTreeMap::from([(
            "DocsEntry".to_string(),
            "sym:scan_here/index.ts#DocsEntry".to_string(),
        )])
    );
}

#[test]
fn resolves_local_extends_and_member_references() {
    let bundle = scan_fixture();
    let button_props = bundle
        .symbols
        .get("sym:scan_here/button.ts#ButtonProps")
        .expect("ButtonProps symbol should exist");

    assert_eq!(button_props.kind, TsSymbolKind::Interface);
    assert_eq!(
        button_props.extends,
        vec![TypeRef::Reference {
            name: "StyleProps".to_string(),
            source_module: Some("./style".to_string()),
            target_id: Some("sym:scan_here/style.ts#StyleProps".to_string()),
        }]
    );

    let size_member = button_props
        .defined_members
        .iter()
        .find(|member| member.name == "size")
        .expect("size member should exist");
    assert_eq!(
        size_member.type_ref,
        Some(TypeRef::Reference {
            name: "Size".to_string(),
            source_module: None,
            target_id: Some("sym:scan_here/button.ts#Size".to_string()),
        })
    );
}

#[test]
fn preserves_external_library_references_inside_the_bundle() {
    let bundle = scan_fixture();
    let button_props = bundle
        .symbols
        .get("sym:scan_here/button.ts#ButtonProps")
        .expect("ButtonProps symbol should exist");

    let css_member = button_props
        .defined_members
        .iter()
        .find(|member| member.name == "css")
        .expect("css member should exist");

    assert_eq!(
        css_member.type_ref,
        Some(TypeRef::Reference {
            name: "CSSProperties".to_string(),
            source_module: Some("react".to_string()),
            target_id: None,
        })
    );
}

#[test]
fn writes_a_concrete_esm_output_for_fixture_inspection() {
    let bundle = scan_fixture();
    let esm_bundle = emit_esm_bundle(&bundle).expect("ESM emission should succeed");
    let entry_module = esm_bundle
        .modules
        .get(&esm_bundle.entrypoint)
        .expect("entry module should exist");

    assert_eq!(esm_bundle.entrypoint, "./bundle.js");
    assert!(fixture_output_esm_path().exists());
    assert!(!entry_module.trim().is_empty());
    assert!(entry_module.contains("export const"));
}

fn tests_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("src")
        .join("typescript")
        .join("tests")
}

fn fixture_input_dir() -> PathBuf {
    tests_dir().join("input")
}

fn fixture_output_path() -> PathBuf {
    tests_dir().join("output").join("bundle.json")
}

fn fixture_output_esm_path() -> PathBuf {
    tests_dir().join("output").join("bundle.js")
}

fn scan_fixture() -> TypeScriptBundle {
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_input_dir(),
        include: vec!["scan_here/**/*.{ts,tsx}".to_string()],
    })
    .expect("fixture scan should succeed");

    let actual_pretty =
        serde_json::to_string_pretty(&bundle).expect("bundle should serialize to pretty JSON");
    let output_path = fixture_output_path();
    fs::create_dir_all(
        output_path
            .parent()
            .expect("output path should have parent"),
    )
    .expect("fixture output directory should be creatable");
    fs::write(&output_path, format!("{actual_pretty}\n"))
        .expect("fixture output bundle should be writable");

    let esm_bundle = emit_esm_bundle(&bundle).expect("fixture ESM emission should succeed");
    let esm_output_path = fixture_output_esm_path();
    fs::write(
        &esm_output_path,
        format!(
            "{}\n",
            esm_bundle
                .modules
                .get(&esm_bundle.entrypoint)
                .expect("fixture ESM entry module should exist")
        ),
    )
    .expect("fixture output ESM should be writable");

    bundle
}
