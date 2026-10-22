//! One nesting-gate run per source per compile, pinned on two rootless virtual-file compiles.
//! Takes two fixed shapes: a serial compile where a styling file uses a streamed token file and another imports a refused
//! deep file, and a lane compile where 70 styling files import one token file. Each shape must refuse exactly the deep
//! file (none in the lane shape) and emit its siblings' classes, then `gate_runs` must move by exactly its file count.
//! The binary holds one test, so the process-wide counter has no concurrent caller.

use atomic::{BaseSystem, CompileRequest, CompileResult, DiagnosticCode, VirtualSource};
use shared::parse::gate_runs;

/// Styling files in the lane shape: above the 64-file serial threshold, so the front phase shards over lanes.
const LANE_FILES: usize = 70;
/// Parenthesis depth of the deep source, the ATM-BOUND-02 shape: far past the 1,024-level nesting gate.
const DEEP_DEPTH: usize = 300_000;
/// A token file with no import, no styling needle and no string delimiter, so it streams.
const TOKENS: &str = "export const size = 4\n";

/// One compile's measurement: its file count, the gate runs it made, and its result.
struct Shape {
    name: &'static str,
    files: usize,
    gate_runs: u64,
    result: CompileResult,
}

fn virtual_file(path: &str, content: String) -> VirtualSource {
    VirtualSource {
        path: path.to_string(),
        content,
    }
}

/// Compiles the files with no root and returns the gate runs that compile made.
fn measure(name: &'static str, files: Vec<VirtualSource>) -> Shape {
    let file_count = files.len();
    // The fixture builds once on first use; read the counter after it, so only the compile is counted.
    let base_system = BaseSystem::lib_fixture().clone();
    let before = gate_runs();
    // `css.classes` is built only when proof is requested, as the sibling tests request it.
    let result = atomic::compile(&CompileRequest {
        files: Some(files),
        base_system,
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    })
    .expect("compile succeeds");
    Shape {
        name,
        files: file_count,
        gate_runs: gate_runs() - before,
        result,
    }
}

/// Serial shape: `style.ts` uses `size` from the streamed token file, so the resolver refines it, and `use.ts` imports
/// `deep.ts`, which the gate refuses.
fn serial_shape() -> Shape {
    let deep = format!(
        "import {{ css }} from '@reference-ui/react'\nexport const deep = css({{ color: {open}'green'{close} }})\n",
        open = "(".repeat(DEEP_DEPTH),
        close = ")".repeat(DEEP_DEPTH),
    );
    let style = "import { css } from '@reference-ui/react'\nimport { size } from './tokens'\nexport const a = css({ color: 'red', padding: size })\n";
    let user = "import { css } from '@reference-ui/react'\nimport { deep } from './deep'\nexport const b = css({ color: 'blue' })\n";
    measure(
        "serial",
        vec![
            virtual_file("/v/src/tokens.ts", TOKENS.to_string()),
            virtual_file("/v/src/style.ts", style.to_string()),
            virtual_file("/v/src/deep.ts", deep),
            virtual_file("/v/src/use.ts", user.to_string()),
        ],
    )
}

/// Lane shape: `LANE_FILES` styling files that each import the same token file and style their own margin.
fn lane_shape() -> Shape {
    let mut files = vec![virtual_file("/v/src/tokens.ts", TOKENS.to_string())];
    for index in 1..=LANE_FILES {
        let content = format!(
            "import {{ css }} from '@reference-ui/react'\nimport {{ size }} from './tokens'\nexport const c{index} = css({{ margin: '{index}px', padding: size }})\n"
        );
        files.push(virtual_file(&format!("/v/src/lane{index}.ts"), content));
    }
    measure("lanes", files)
}

/// The margin class each lane file must emit.
fn lane_classes() -> Vec<String> {
    (1..=LANE_FILES)
        .map(|index| format!("margin:{index}px"))
        .collect()
}

/// Class keys the compile emitted.
fn class_keys(result: &CompileResult) -> Vec<String> {
    result
        .css
        .as_ref()
        .map_or_else(Vec::new, |css| css.classes.keys().cloned().collect())
}

/// Pins what must hold before and after the fix: the ATM-E-PARSE count and every expected sibling class.
fn assert_refusals_and_classes(shape: &Shape, refusals: usize, expected: &[String]) {
    let parse_errors = shape
        .result
        .diagnostics
        .iter()
        .filter(|diag| diag.code == DiagnosticCode::ParseError)
        .count();
    assert_eq!(parse_errors, refusals, "{}: ATM-E-PARSE count", shape.name);
    let classes = class_keys(&shape.result);
    for class in expected {
        assert!(
            classes.contains(class),
            "{}: class {class} missing; emitted {classes:?}",
            shape.name
        );
    }
}

/// Shapes whose gate-run delta is not their file count, each with its delta. Empty once every source is screened once.
fn gate_run_misses(shapes: &[&Shape]) -> Vec<String> {
    shapes
        .iter()
        .filter(|shape| shape.gate_runs != shape.files as u64)
        .map(|shape| {
            format!(
                "{}: gate_runs moved by {} for {} files",
                shape.name, shape.gate_runs, shape.files
            )
        })
        .collect()
}

#[test]
fn each_source_runs_the_nesting_gate_once_per_compile() {
    let serial = serial_shape();
    let lanes = lane_shape();
    let serial_classes = vec!["color:red".to_string(), "color:blue".to_string()];
    assert_refusals_and_classes(&serial, 1, &serial_classes);
    assert_refusals_and_classes(&lanes, 0, &lane_classes());
    let misses = gate_run_misses(&[&serial, &lanes]);
    assert!(
        misses.is_empty(),
        "the nesting gate must run once per source, not once per read: {}",
        misses.join("; ")
    );
}
