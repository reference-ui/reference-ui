//! One nesting-gate run per file in a tasty scan, pinned on a small tree with one external package.
//! The tree holds three user files, two external declaration files and one user file nested past the gate. Scanning it and
//! extracting its ASTs must move `gate_runs` by exactly the file count, and the refused file must report one
//! TST-W-PARSE-ERROR. The binary holds one test, so the process-wide counter has no concurrent caller.

use shared::parse::{gate_runs, MAX_NESTING};
use shared::testing::ScratchWorkspace;
use tasty::{scan_typescript_bundle, ScanRequest};

#[test]
fn a_scan_runs_the_gate_once_per_file_and_reports_a_refusal_once() {
    let root = ScratchWorkspace::new("tasty-gate-once");
    root.write(
        "src/index.ts",
        "export type { ButtonProps } from 'external-lib';\nexport * from './local';\nexport * from './deep';\n",
    );
    root.write("src/local.ts", "export interface Local { size: number }\n");
    root.write(
        "src/deep.ts",
        &format!(
            "export const deep = {}1{}\n",
            "(".repeat(MAX_NESTING + 1),
            ")".repeat(MAX_NESTING + 1)
        ),
    );
    root.write(
        "node_modules/external-lib/package.json",
        r#"{ "name": "external-lib", "types": "index.d.ts" }"#,
    );
    root.write(
        "node_modules/external-lib/index.d.ts",
        "export type { SharedProps as ButtonProps } from './shared';\n",
    );
    root.write(
        "node_modules/external-lib/shared.d.ts",
        "export interface SharedProps { label: string }\n",
    );
    let files = 5;

    let request = ScanRequest {
        root_dir: root.root().to_path_buf(),
        include: vec!["src/**/*.ts".to_string()],
    };
    let before = gate_runs();
    let bundle = scan_typescript_bundle(&request).expect("the scan succeeds");
    let runs = gate_runs() - before;

    assert_eq!(runs, files, "gate runs for {files} files");
    assert!(bundle.files.contains_key("node_modules/external-lib/shared.d.ts"));
    let diagnostics = serde_json::to_string(&bundle.diagnostics).expect("diagnostics serialize");
    assert_eq!(
        diagnostics.matches("TST-W-PARSE-ERROR").count(),
        1,
        "the refused file reports once: {diagnostics}"
    );
}
