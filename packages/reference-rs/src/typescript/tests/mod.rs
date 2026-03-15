use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;
use std::time::{Duration, Instant};

use super::generator::emit_esm_bundle;
use super::{scan_typescript_bundle, ScanRequest, TsSymbolKind, TypeRef, TypeScriptBundle};

#[test]
fn scans_fixture_successfully() {
    let bundle = scan_fixture();

    assert_eq!(bundle.version, 1);
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
                "ButtonSchema".to_string(),
                "sym:scan_here/button.ts#ButtonSchema".to_string(),
            ),
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
    let schema_member = button_props
        .defined_members
        .iter()
        .find(|member| member.name == "schema")
        .expect("schema member should exist");

    assert_eq!(
        css_member.type_ref,
        Some(TypeRef::Reference {
            name: "CSSProperties".to_string(),
            source_module: Some("csstype".to_string()),
            target_id: Some("sym:node_modules/csstype/index.d.ts#Properties".to_string()),
        })
    );
    assert_eq!(
        schema_member.type_ref,
        Some(TypeRef::Reference {
            name: "JSONSchema4".to_string(),
            source_module: Some("json-schema".to_string()),
            target_id: Some(
                "sym:node_modules/@types/json-schema/index.d.ts#JSONSchema4".to_string()
            ),
        })
    );
}

#[test]
fn resolves_external_symbols_and_tracks_library_metadata() {
    let bundle = scan_fixture();

    let button_schema = bundle
        .symbols
        .get("sym:scan_here/button.ts#ButtonSchema")
        .expect("ButtonSchema symbol should exist");
    let css_properties = bundle
        .symbols
        .get("sym:node_modules/csstype/index.d.ts#Properties")
        .expect("csstype Properties symbol should exist");
    let json_schema = bundle
        .symbols
        .get("sym:node_modules/@types/json-schema/index.d.ts#JSONSchema4")
        .expect("JSONSchema4 symbol should exist");

    assert_eq!(button_schema.library, "user");
    assert_eq!(css_properties.library, "csstype");
    assert_eq!(json_schema.library, "json-schema");
    assert_eq!(
        button_schema.extends,
        vec![TypeRef::Reference {
            name: "JSONSchema4".to_string(),
            source_module: Some("json-schema".to_string()),
            target_id: Some(
                "sym:node_modules/@types/json-schema/index.d.ts#JSONSchema4".to_string()
            ),
        }]
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
    let written_output = fs::read_to_string(fixture_output_esm_path())
        .expect("fixture ESM output should be readable");
    let metrics_output = fs::read_to_string(fixture_metrics_path())
        .expect("fixture metrics output should be readable");

    assert_eq!(esm_bundle.entrypoint, "./bundle.js");
    assert!(fixture_output_esm_path().exists());
    assert!(fixture_metrics_path().exists());
    assert!(!entry_module.trim().is_empty());
    assert!(entry_module.contains("export const"));
    assert!(entry_module.contains("\"csstype\""));
    assert!(entry_module.contains("\"json-schema\""));
    assert!(entry_module.contains(
        "id: \"Property.Filter\",\n      name: \"Property.Filter\",\n      library: \"csstype\""
    ));
    assert!(entry_module.contains("name: \"ButtonSchema\""));
    assert!(entry_module.contains("name: \"JSONSchema4\",\n    library: \"json-schema\""));
    assert!(!written_output.contains("bundle build metrics"));
    assert!(metrics_output.contains("bundle build metrics"));
    assert!(metrics_output.contains("total_ms:"));
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

fn fixture_output_esm_path() -> PathBuf {
    tests_dir().join("output").join("bundle.js")
}

fn fixture_metrics_path() -> PathBuf {
    tests_dir().join("output").join("bundle-metrics.txt")
}

fn scan_fixture() -> TypeScriptBundle {
    ensure_fixture_dependencies_installed();
    let total_start = Instant::now();
    let scan_start = Instant::now();
    let bundle = scan_typescript_bundle(&ScanRequest {
        root_dir: fixture_input_dir(),
        include: vec!["scan_here/**/*.{ts,tsx}".to_string()],
    })
    .expect("fixture scan should succeed");
    let scan_duration = scan_start.elapsed();

    fs::create_dir_all(
        fixture_output_esm_path()
            .parent()
            .expect("output path should have parent"),
    )
    .expect("fixture output directory should be creatable");

    let emit_start = Instant::now();
    let esm_bundle = emit_esm_bundle(&bundle).expect("fixture ESM emission should succeed");
    let emit_duration = emit_start.elapsed();
    let total_duration = total_start.elapsed();
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
    fs::write(
        fixture_metrics_path(),
        render_bundle_metrics(&bundle, scan_duration, emit_duration, total_duration),
    )
    .expect("fixture metrics output should be writable");

    bundle
}

fn ensure_fixture_dependencies_installed() {
    static INSTALL_ONCE: OnceLock<()> = OnceLock::new();

    INSTALL_ONCE.get_or_init(|| {
        let status = Command::new("npm")
            .args(["install", "--no-audit", "--no-fund"])
            .current_dir(fixture_input_dir())
            .status()
            .expect("fixture npm install should launch");

        assert!(status.success(), "fixture npm install should succeed");
    });
}

fn render_bundle_metrics(
    bundle: &TypeScriptBundle,
    scan_duration: Duration,
    emit_duration: Duration,
    total_duration: Duration,
) -> String {
    format!(
        "// bundle build metrics\n// scan_ms: {:.3}\n// emit_ms: {:.3}\n// total_ms: {:.3}\n// files: {}\n// symbols: {}\n// note: excludes fixture npm install\n\n",
        duration_ms(scan_duration),
        duration_ms(emit_duration),
        duration_ms(total_duration),
        bundle.files.len(),
        bundle.symbols.len(),
    )
}

fn duration_ms(duration: Duration) -> f64 {
    duration.as_secs_f64() * 1000.0
}
