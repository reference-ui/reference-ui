//! One nesting-gate run per source per compile, pinned on two rootless virtual-file compiles.
//! The serial shape holds a styling file that uses a streamed token file, a file that imports a refused deep file, and a
//! streamed deep file that no file imports. The lane shape holds 70 styling files that import one token file, plus the same
//! two refused files. Each shape must refuse exactly those two files, one ATM-E-PARSE each at its line, emit its siblings'
//! classes, and move `gate_runs` by exactly its file count. The lane shape takes lanes only with two CPUs, so below that it
//! is skipped with a note instead of passing as lane coverage. The binary holds one test, so the process-wide counter has no
//! concurrent caller.

use atomic::{BaseSystem, CompileRequest, CompileResult, DiagnosticCode, VirtualSource};
use shared::parse::gate_runs;

/// Styling files in the lane shape: above the 64-file serial threshold, so the front phase shards over lanes.
const LANE_FILES: usize = 70;
/// Parenthesis depth of the deep sources, the ATM-BOUND-02 shape: far past the 1,024-level nesting gate.
const DEEP_DEPTH: usize = 300_000;
/// A token file with no import, no styling needle and no string delimiter, so it streams.
const TOKENS: &str = "export const size = 4\n";
/// Where each refused file's ATM-E-PARSE sits, as `path:line`: the retained deep file refuses on line 2, the streamed one on line 1.
const REFUSED_SITES: [&str; 2] = ["/v/src/deep.ts:2", "/v/src/flat.ts:1"];

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

/// The retained deep source: an import, then a `css()` value nested `DEEP_DEPTH` levels deep on line 2.
fn deep_source() -> String {
    format!(
        "import {{ css }} from '@reference-ui/react'\nexport const deep = css({{ color: {open}'green'{close} }})\n",
        open = "(".repeat(DEEP_DEPTH),
        close = ")".repeat(DEEP_DEPTH),
    )
}

/// The streamed deep source: no import, styling needle or string delimiter, so the pre-filter streams it, and nested
/// `DEEP_DEPTH` levels deep on line 1.
fn streamed_deep_source() -> String {
    format!(
        "export const flat = {open}1{close}\n",
        open = "(".repeat(DEEP_DEPTH),
        close = ")".repeat(DEEP_DEPTH),
    )
}

/// Serial shape: `style.ts` uses `size` from the streamed token file, so the resolver refines it; `use.ts` imports the
/// retained `deep.ts`; and `flat.ts` is a streamed deep file that nothing imports. The gate refuses both deep files.
fn serial_shape() -> Shape {
    let style = "import { css } from '@reference-ui/react'\nimport { size } from './tokens'\nexport const a = css({ color: 'red', padding: size })\n";
    let user = "import { css } from '@reference-ui/react'\nimport { deep } from './deep'\nexport const b = css({ color: 'blue' })\n";
    measure(
        "serial",
        vec![
            virtual_file("/v/src/tokens.ts", TOKENS.to_string()),
            virtual_file("/v/src/style.ts", style.to_string()),
            virtual_file("/v/src/deep.ts", deep_source()),
            virtual_file("/v/src/use.ts", user.to_string()),
            virtual_file("/v/src/flat.ts", streamed_deep_source()),
        ],
    )
}

/// Lane shape: `LANE_FILES` styling files that each import the same token file and style their own margin, beside the
/// retained and the streamed refused file, so each path refuses inside the lane compile.
fn lane_shape() -> Shape {
    let mut files = vec![virtual_file("/v/src/tokens.ts", TOKENS.to_string())];
    for index in 1..=LANE_FILES {
        let content = format!(
            "import {{ css }} from '@reference-ui/react'\nimport {{ size }} from './tokens'\nexport const c{index} = css({{ margin: '{index}px', padding: size }})\n"
        );
        files.push(virtual_file(&format!("/v/src/lane{index}.ts"), content));
    }
    files.push(virtual_file("/v/src/deep.ts", deep_source()));
    files.push(virtual_file("/v/src/flat.ts", streamed_deep_source()));
    measure("lanes", files)
}

/// The lane shape when this machine has two CPUs. Below two, `plan_auto` keeps one lane, so the shape would prove no lane
/// coverage: the test says so on stderr and checks the serial shape alone.
fn lane_shape_if_parallel() -> Option<Shape> {
    let cpus = std::thread::available_parallelism().map_or(1, |count| count.get());
    if cpus >= 2 {
        return Some(lane_shape());
    }
    eprintln!(
        "screen_once: skipping the lane shape: {cpus} CPU(s) keep the front phase on one lane, so no lane coverage is checked"
    );
    None
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

/// The ATM-E-PARSE diagnostics a compile emitted, each as `path:line` and sorted, so each refused file is pinned by where it
/// refuses and not only by how many refuse.
fn parse_error_sites(result: &CompileResult) -> Vec<String> {
    let mut sites: Vec<String> = result
        .diagnostics
        .iter()
        .filter(|diag| diag.code == DiagnosticCode::ParseError)
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

/// Pins what the compile must produce: exactly one ATM-E-PARSE per refused file, at its site, and every expected sibling
/// class.
fn assert_refusals_and_classes(shape: &Shape, expected: &[String]) {
    assert_eq!(
        parse_error_sites(&shape.result),
        REFUSED_SITES,
        "{}: ATM-E-PARSE sites",
        shape.name
    );
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
    let serial_classes = vec!["color:red".to_string(), "color:blue".to_string()];
    assert_refusals_and_classes(&serial, &serial_classes);
    let lanes = lane_shape_if_parallel();
    if let Some(lanes) = &lanes {
        assert_refusals_and_classes(lanes, &lane_classes());
    }
    let mut measured = vec![&serial];
    measured.extend(lanes.as_ref());
    let misses = gate_run_misses(&measured);
    assert!(
        misses.is_empty(),
        "the nesting gate must run once per source, not once per read: {}",
        misses.join("; ")
    );
}
