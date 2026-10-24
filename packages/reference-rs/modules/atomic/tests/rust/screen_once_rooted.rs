//! A rooted compile runs the nesting gate once per source, though styletrace reads staged text.
//! The temp project holds a refused deep file that parses as a trace entry, a styled file, a streamed token file, and a styled
//! file that imports the tokens. The compile must refuse the deep file once, with one ATM-E-PARSE at its line and one located
//! STT-W-SKIPPED-FILE, emit its siblings' classes, and move `gate_runs` by exactly the file count: styletrace parses a staged
//! file from the verdict the compile already holds. The binary holds one test, so the process-wide counter has no concurrent
//! caller.

use std::path::{Path, PathBuf};

use atomic::{BaseSystem, CompileRequest, CompileResult, DiagnosticCode};
use shared::parse::gate_runs;

/// Parenthesis depth of the deep source, far past the 1,024-level nesting gate.
const DEEP_DEPTH: usize = 300_000;
/// A token file with no import, no styling needle and no string delimiter, so it streams.
const TOKENS: &str = "export const size = 4\n";
const RED: &str =
    "import { css } from '@reference-ui/react'\nexport const red = css({ color: 'red' })\n";
const SIZED: &str = "import { css } from '@reference-ui/react'\nimport { size } from './tokens'\nexport const sized = css({ margin: '2px', padding: size })\n";

/// A scratch project directory, removed on drop.
struct Project {
    root: PathBuf,
}

impl Project {
    fn new() -> Self {
        let root =
            std::env::temp_dir().join(format!("atomic-screen-once-rooted-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        Self { root }
    }

    fn write(&self, rel: &str, content: &str) {
        let path = self.root.join(rel);
        std::fs::create_dir_all(path.parent().expect("a file has a parent")).expect("create dir");
        std::fs::write(path, content).expect("write file");
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

/// The retained deep source: an import, then a `css()` value nested `DEEP_DEPTH` levels deep on line 2.
fn deep_source() -> String {
    format!(
        "import {{ css }} from '@reference-ui/react'\nexport const deep = css({{ color: {open}'green'{close} }})\n",
        open = "(".repeat(DEEP_DEPTH),
        close = ")".repeat(DEEP_DEPTH),
    )
}

/// Compiles the project from disk and returns the gate runs that compile made.
fn compile_rooted(root: &Path) -> (u64, CompileResult) {
    // The fixture builds once on first use; read the counter after it, so only the compile is counted.
    let base_system = BaseSystem::lib_fixture().clone();
    let before = gate_runs();
    let result = atomic::compile(&CompileRequest {
        root_dir: Some(root.to_string_lossy().into_owned()),
        base_system,
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    })
    .expect("compile succeeds");
    (gate_runs() - before, result)
}

/// The located diagnostics with `code`, each as `file:line` (`-` when absent), sorted.
fn sites(result: &CompileResult, code: DiagnosticCode) -> Vec<String> {
    let mut sites: Vec<String> = result
        .diagnostics
        .iter()
        .filter(|diag| diag.code == code)
        .map(|diag| {
            format!(
                "{}:{}",
                diag.file.as_deref().unwrap_or("-"),
                diag.line.unwrap_or(0)
            )
        })
        .collect();
    sites.sort();
    sites
}

#[test]
fn a_rooted_compile_gates_each_source_once() {
    let project = Project::new();
    let files = [
        ("src/tokens.ts", TOKENS.to_string()),
        ("src/red.ts", RED.to_string()),
        ("src/sized.ts", SIZED.to_string()),
        ("src/deep.ts", deep_source()),
    ];
    for (rel, content) in &files {
        project.write(rel, content);
    }
    let (gate_runs, result) = compile_rooted(&project.root);
    let root = project.root.to_string_lossy();
    let deep = format!("{root}/src/deep.ts");
    let classes: Vec<&String> = result
        .css
        .as_ref()
        .map_or_else(Vec::new, |css| css.classes.keys().collect());
    for class in ["color:red", "margin:2px"] {
        assert!(
            classes.iter().any(|key| key.as_str() == class),
            "class {class} missing; emitted {classes:?}"
        );
    }
    assert_eq!(
        sites(&result, DiagnosticCode::ParseError),
        [format!("{deep}:2")]
    );
    let skipped = sites(
        &result,
        DiagnosticCode::Styletrace(styletrace::StyletraceDiagnosticCode::SkippedFile),
    );
    assert_eq!(skipped, [format!("{deep}:0")], "{:?}", result.diagnostics);
    assert_eq!(
        gate_runs,
        files.len() as u64,
        "each source must be gated once, not once per reader"
    );
}
