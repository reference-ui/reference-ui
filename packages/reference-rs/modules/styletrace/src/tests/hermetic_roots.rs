//! Validates hermetic sync-root resolution and module-qualified binding discovery.
//! Takes isolated source and declaration roots located in committed fixtures or scratch workspaces.
//! Traces component exports to ensure wrapper detection operates correctly across separate directories.
//! Emits module-qualified bindings and ensures missing declaration trees trigger explicit diagnostics.

use crate::analysis::primitive_metadata::collect_reference_primitive_jsx_names;
use crate::analysis::{trace_style_bindings, TracedBinding};
use crate::resolver::collect_reference_style_prop_names;

use super::fixtures::{workspace_scratch_dir, workspace_sync_root};

#[test]
fn committed_sync_root_discovers_primitives_and_style_props() {
    let sync_root = workspace_sync_root();
    let primitives = collect_reference_primitive_jsx_names(&sync_root)
        .expect("primitives should resolve from committed sync root");
    assert!(primitives.contains("Div"));
    assert!(primitives.contains("Button"));
    assert!(primitives.contains("Span"));
    assert!(primitives.contains("Svg"));

    let prop_names = collect_reference_style_prop_names(&sync_root)
        .expect("style props should resolve from committed sync root");
    assert!(prop_names.contains(&"color".to_string()));
    assert!(prop_names.contains(&"backgroundColor".to_string()));
    assert!(prop_names.contains(&"margin".to_string()));
}

#[test]
fn traces_module_qualified_bindings_on_committed_fixture() {
    let sync_root = workspace_sync_root();
    let src_dir = sync_root.join("src");
    let bindings = trace_style_bindings(&src_dir, &sync_root)
        .expect("tracing committed sync-root src should succeed");

    let expected = vec![
        TracedBinding::new("DirectWrapper.tsx", "DirectWrapper"),
        TracedBinding::new("ReexportedWrapper.tsx", "ReexportedWrapper"),
        TracedBinding::new("index.ts", "DirectWrapper"),
        TracedBinding::new("index.ts", "ReexportedWrapper"),
    ];

    for exp in &expected {
        assert!(
            bindings.contains(exp),
            "expected bindings to contain {:?}, got: {:?}",
            exp,
            bindings
        );
    }

    let names: Vec<_> = bindings.iter().map(|b| b.name.as_str()).collect();
    assert!(!names.contains(&"StrippedWrapper"));
    assert!(!names.contains(&"UnrelatedComponent"));
}

#[test]
fn missing_declaration_root_fails_with_explicit_diagnostic() {
    let scratch = workspace_scratch_dir("missing-decl-root");
    let src_dir = scratch.root().join("src");
    std::fs::create_dir_all(&src_dir).expect("create src dir");
    std::fs::write(
        src_dir.join("Card.tsx"),
        "import { Div } from '@reference-ui/react';\nexport const Card = () => <Div />;\n",
    )
    .expect("write Card.tsx");

    let nonexistent_decl = scratch.root().join("nonexistent-decl-root");
    let result = trace_style_bindings(&src_dir, &nonexistent_decl);
    assert!(
        result.is_err(),
        "expected missing declaration root to return explicit error"
    );
    let err_msg = result.err().unwrap().to_string();
    assert!(
        err_msg.contains("missing") || err_msg.contains("entrypoint"),
        "error message should describe missing declaration entrypoint: {err_msg}"
    );
}

#[test]
fn separate_source_and_declaration_roots_in_scratch_dir() {
    let scratch = workspace_scratch_dir("separate-roots");
    let decl_root = scratch.root().join("declarations");
    let src_root = scratch.root().join("application");

    let committed_sync = workspace_sync_root();
    copy_dir_all(
        &committed_sync.join(".reference-ui"),
        &decl_root.join(".reference-ui"),
    );

    std::fs::create_dir_all(&src_root).expect("create src dir");
    std::fs::write(
        src_root.join("Widget.tsx"),
        "import { Div, type StyleProps } from '@reference-ui/react';\n\
         export interface WidgetProps extends StyleProps { label?: string; }\n\
         export function Widget(props: WidgetProps) { return <Div {...props} />; }\n",
    )
    .expect("write Widget.tsx");

    let bindings = trace_style_bindings(&src_root, &decl_root)
        .expect("tracing separate source and decl roots should succeed");
    assert_eq!(bindings.len(), 1);
    assert_eq!(bindings[0].name, "Widget");
    assert_eq!(bindings[0].module, "Widget.tsx");
}

fn copy_dir_all(src: &std::path::Path, dst: &std::path::Path) {
    std::fs::create_dir_all(dst).expect("create dest dir");
    for entry in std::fs::read_dir(src).expect("read src dir") {
        let entry = entry.expect("valid entry");
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_all(&src_path, &dst_path);
        } else {
            std::fs::copy(&src_path, &dst_path).expect("copy file");
        }
    }
}
