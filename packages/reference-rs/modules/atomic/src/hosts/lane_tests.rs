//! Lane trace folds agree with serial on virtual sources and failed traces.
//! Serial traces on-disk files only: entries must exist on disk, and an
//! import edge never resolves to a virtual source. A virtual source therefore
//! contributes no hosts, silently, and an on-disk failure warns once from the
//! host re-parse. Each fixture compiles serially with fewer than 64 styling
//! files and on forced lanes past that threshold, then requires the same
//! hosts, diagnostics, wants, and stylesheet from both paths.

use std::fs;
use std::path::PathBuf;

use crate::lanes::{entered_spawns, force_lane_count, hold_force_serial};
use crate::{
    compile, BaseSystem, CompileRequest, CompileResult, Diagnostic, DiagnosticCode, VirtualSource,
};

/// Scratch tree on disk under a canonical root, removed on drop.
struct Tree {
    root: PathBuf,
}

impl Tree {
    fn new(name: &str) -> Self {
        let root =
            std::env::temp_dir().join(format!("atm-lane-trace-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).expect("scratch src dir");
        let root = fs::canonicalize(&root).expect("canonical scratch root");
        Self { root }
    }

    fn write(&self, relative: &str, content: &str) {
        fs::write(self.root.join(relative), content).expect("write fixture file");
    }

    fn path(&self, relative: &str) -> String {
        self.root.join(relative).to_string_lossy().into_owned()
    }

    /// A source that is not on disk. Its path is absolute so relative imports
    /// resolve under the root instead of against the test working directory.
    fn virtual_source(&self, relative: &str, content: &str) -> VirtualSource {
        VirtualSource {
            path: self.path(relative),
            content: content.to_string(),
        }
    }
}

impl Drop for Tree {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

/// Props type that does not parse, so any style trace that imports it fails.
const TYPES_BROKEN: &str = "import type { StyleProps } from '@reference-ui/react'\nexport type CardProps = StyleProps & {\n  title?: string\n";
/// The on-disk entry that opens the trace; it renders only a primitive.
const ENTRY: &str =
    "import { Div } from '@reference-ui/react'\nexport const Entry = () => <Div mt=\"2r\" />\n";
/// Virtual page consuming both wrappers with a style prop each.
const PAGE: &str = "import { Card } from './Card'\nimport { Badge } from './Badge'\nexport function Page() {\n  return <div><Card mt=\"4r\" /><Badge mt=\"4r\" /></div>\n}\n";
/// On-disk page whose style-exposing props forward into the wrapper `Card`.
const STYLED_APP: &str = "import { Card } from './Card'\nimport type { StyleProps } from '@reference-ui/react'\nexport function App(props: StyleProps) {\n  return <Card {...props} />\n}\n";
/// On-disk page consuming the wrapper `Card`, which warns through its own props.
const APP: &str =
    "import { Card } from './Card'\nexport function App() {\n  return <Card mt=\"4r\" />\n}\n";

/// A wrapper that forwards its style props to Div, typed by `./<module>`.
fn wrapper(name: &str, module: &str) -> String {
    format!(
        "import {{ Div }} from '@reference-ui/react'\nimport type {{ {name}Props }} from './{module}'\nexport function {name}(props: {name}Props) {{\n  return <Div {{...props}} />\n}}\n"
    )
}

/// A wrapper whose props are an inline literal, so its fold reads no sibling
/// file and succeeds wherever it is folded.
fn inline_wrapper(name: &str) -> String {
    format!(
        "import {{ Div }} from '@reference-ui/react'\nexport function {name}(props: {{ mt?: string; label?: string }}) {{\n  return <Div {{...props}} />\n}}\n"
    )
}

/// Styling files past the 64-file front threshold: imports, no JSX, no wants.
fn fillers(tree: &Tree) -> Vec<VirtualSource> {
    (0..70)
        .map(|index| {
            let content = format!(
                "import type {{ StyleProps }} from '@reference-ui/react'\nexport const F{index} = 'f{index}'\n"
            );
            tree.virtual_source(&format!("src/fill/F{index}.ts"), &content)
        })
        .collect()
}

fn request(tree: &Tree, files: Vec<VirtualSource>) -> CompileRequest {
    CompileRequest {
        root_dir: Some(tree.root.to_string_lossy().into_owned()),
        files: Some(files),
        base_system: BaseSystem::lib_fixture().clone(),
        ..CompileRequest::default()
    }
}

/// The serial side: forced serial, so no lane may spawn.
fn compile_serial(request: &CompileRequest) -> CompileResult {
    let before = entered_spawns();
    let result = {
        let _serial = hold_force_serial();
        compile(request).expect("serial compile")
    };
    assert_eq!(entered_spawns(), before, "serial side spawned lanes");
    result
}

/// The lane side: four lanes forced on, and at least one must spawn.
fn compile_lanes(request: &CompileRequest) -> CompileResult {
    let before = entered_spawns();
    force_lane_count(Some(4));
    let result = compile(request);
    force_lane_count(None);
    assert!(entered_spawns() > before, "lane side never spawned");
    result.expect("lane compile")
}

fn assert_same_verdict(serial: &CompileResult, lanes: &CompileResult) {
    assert_eq!(
        lanes.traced_jsx_hosts, serial.traced_jsx_hosts,
        "traced hosts differ"
    );
    assert_eq!(lanes.diagnostics, serial.diagnostics, "diagnostics differ");
    assert_eq!(lanes.wants, serial.wants, "wants differ");
    assert_eq!(lanes.stylesheet, serial.stylesheet, "stylesheet differs");
}

/// Trace warnings whose file ends with `suffix`.
fn trace_warnings<'a>(result: &'a CompileResult, suffix: &str) -> Vec<&'a Diagnostic> {
    result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.code == DiagnosticCode::TraceSkipped)
        .filter(|diagnostic| {
            diagnostic
                .file
                .as_deref()
                .is_some_and(|file| file.ends_with(suffix))
        })
        .collect()
}

/// Virtual wrappers, one with a failing named props type and one with an
/// inline props type, consumed by a virtual page. Serial traces neither, so
/// the lane side must add no hosts and keep the same diagnostics.
#[test]
fn virtual_wrappers_get_the_serial_verdict_on_lanes() {
    let tree = Tree::new("virtual");
    tree.write("src/types.ts", TYPES_BROKEN);
    tree.write("src/Entry.tsx", ENTRY);
    let core = vec![
        tree.virtual_source("src/Card.tsx", &wrapper("Card", "types")),
        tree.virtual_source("src/Badge.tsx", &inline_wrapper("Badge")),
        tree.virtual_source("src/Page.tsx", PAGE),
    ];
    let serial = compile_serial(&request(&tree, core.clone()));
    assert!(
        serial.traced_jsx_hosts.is_empty(),
        "serial traces no virtual wrapper"
    );
    let mut crowded = core;
    crowded.extend(fillers(&tree));
    let lanes = compile_lanes(&request(&tree, crowded));
    assert_same_verdict(&serial, &lanes);
}

/// An on-disk wrapper whose props type fails warns once, naming its file,
/// on both paths: the host re-parse reports it and the lane fold stays silent.
#[test]
fn on_disk_trace_failure_warns_once_on_lanes() {
    let tree = Tree::new("disk");
    tree.write("src/types.ts", TYPES_BROKEN);
    tree.write("src/Card.tsx", &wrapper("Card", "types"));
    tree.write("src/App.tsx", APP);
    let serial = compile_serial(&request(&tree, Vec::new()));
    let lanes = compile_lanes(&request(&tree, fillers(&tree)));
    assert_same_verdict(&serial, &lanes);
    assert_eq!(
        trace_warnings(&lanes, "/src/Card.tsx").len(),
        1,
        "one warning for Card.tsx"
    );
}

/// An on-disk page importing a virtual inline-props wrapper gets no host
/// through that import on either path, so the virtual file adds no hosts.
#[test]
fn virtual_wrapper_imported_from_disk_gets_the_serial_verdict_on_lanes() {
    let tree = Tree::new("imported");
    tree.write("src/types.ts", TYPES_BROKEN);
    tree.write("src/App.tsx", STYLED_APP);
    let card = tree.virtual_source("src/Card.tsx", &inline_wrapper("Card"));
    let serial = compile_serial(&request(&tree, vec![card.clone()]));
    assert!(!serial.traced_jsx_hosts.iter().any(|host| host == "Card"));
    let mut crowded = fillers(&tree);
    crowded.push(card);
    let lanes = compile_lanes(&request(&tree, crowded));
    assert_same_verdict(&serial, &lanes);
}
