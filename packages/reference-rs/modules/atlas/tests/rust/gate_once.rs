//! One nesting-gate run per file in an Atlas analysis, pinned on a small app with observe specs.
//! The app holds three source files and one file nested past the gate. Observed names are configured, so the parse, usage
//! and observe passes all read the app's files. `analyze_detailed` must move `gate_runs` by exactly the file count, and the
//! refused file must report one ATL-W-SKIPPED-FILE. The binary holds one test, so the process-wide counter has no
//! concurrent caller.

use atlas::{AtlasAnalyzer, AtlasConfig, ObserveSpec};
use shared::parse::{gate_runs, MAX_NESTING};
use shared::testing::ScratchWorkspace;

#[test]
fn an_analysis_runs_the_gate_once_per_file_with_observe_specs() {
    let root = ScratchWorkspace::new("atlas-gate-once");
    root.write(
        "src/Card.tsx",
        "import { Div } from 'ui-kit'\nexport function Card() { return <Div tone=\"a\">x</Div> }\n",
    );
    root.write(
        "src/Page.tsx",
        "import { Card } from './Card'\nimport { Div } from 'ui-kit'\nexport const Page = () => <Div><Card /></Div>\n",
    );
    root.write("src/util.ts", "export const size = 4\n");
    root.write(
        "src/Deep.tsx",
        &format!(
            "export const deep = {}1{}\n",
            "(".repeat(MAX_NESTING + 1),
            ")".repeat(MAX_NESTING + 1)
        ),
    );
    let files = 4;

    let config = AtlasConfig {
        root_dir: root.root().to_string_lossy().to_string(),
        observe: vec![ObserveSpec {
            source: "ui-kit".to_string(),
            names: vec!["Div".to_string()],
        }],
        ..Default::default()
    };
    let mut analyzer = AtlasAnalyzer::new(config);
    let before = gate_runs();
    let result = analyzer
        .analyze_detailed(&root.root().to_string_lossy())
        .expect("the analysis succeeds");
    let runs = gate_runs() - before;

    assert_eq!(runs, files, "gate runs for {files} files");
    let div = result
        .observed
        .iter()
        .find(|element| element.name == "Div")
        .expect("Div is observed");
    assert_eq!(div.count, 2);
    let skipped: Vec<_> = result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code.as_str() == "ATL-W-SKIPPED-FILE")
        .collect();
    assert_eq!(skipped.len(), 1, "the refused file reports once");
}
