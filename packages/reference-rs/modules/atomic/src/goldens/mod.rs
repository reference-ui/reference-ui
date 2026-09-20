//! Namer golden writer and freshness guard.
//!
//! Generates one `input → output` JSON file per lexical function and per
//! procedure plus the composed `name` probes, regenerates every file in
//! memory during `cargo test`, and diffs against the committed bytes.
//! `NAMER_UPDATE_GOLDENS=1` is the only rewrite path. A diff fails until
//! re-blessed, and the failure names the rules-version bump for intentional
//! naming-rule changes; unintentional drift must be fixed, not re-blessed.

mod composed;
mod suites;

use std::path::PathBuf;

use serde_json::{json, Value};

use crate::runtime::NAMER_RULES_VERSION;

/// Committed golden directory, relative to the crate manifest.
const GOLDEN_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/tests/namer-goldens");
/// The only rewrite path: set to `1` to re-bless the committed files.
const UPDATE_ENV: &str = "NAMER_UPDATE_GOLDENS";

/// One committed golden file: the function it pins plus input-output cases.
pub(crate) struct Suite {
    /// File name under the golden directory.
    pub(crate) file: &'static str,
    /// Function under test, as the runner resolves it.
    pub(crate) function: &'static str,
    /// Curated inputs with computed outputs.
    pub(crate) cases: Vec<(Value, Value)>,
}

impl Suite {
    /// The committed document: function, rules version, and cases.
    fn document(&self) -> Value {
        json!({
            "function": self.function,
            "rulesVersion": NAMER_RULES_VERSION,
            "cases": self.cases.iter().map(|(input, output)| {
                json!({"input": input, "output": output})
            }).collect::<Vec<_>>(),
        })
    }

    /// Committed bytes: pretty JSON plus a trailing newline.
    fn text(&self) -> String {
        let mut text = serde_json::to_string_pretty(&self.document()).expect("golden serializes");
        text.push('\n');
        text
    }
}

/// All sixteen suites: six lexical, nine procedures, the composed probes.
fn all() -> Vec<Suite> {
    let system = spec_system();
    let name = system.name.clone();
    vec![
        suites::whitespace_suite(),
        suites::trim_suite(),
        suites::parse_suite(),
        suites::render_suite(),
        suites::fold_suite(),
        suites::sanitize_suite(),
        suites::collapse_suite(),
        suites::numeric_suite(),
        suites::important_suite(),
        suites::tokens_suite(),
        suites::classify_suite(),
        suites::expand_suite(),
        composed::condition_suite(&system),
        composed::slot_suite(),
        composed::shape_suite(&system, &name),
        composed::name_suite(&system, &name),
    ]
}

/// The system the case harness compiles with, for table-identical goldens:
/// the lib spec plus authored non-bare breakpoint widths. Order is
/// load-bearing (tablet, padded, hex, pxname, then empty last);
/// ATM-SEAM-08 carries the identical `baseSystem.json`.
fn spec_system() -> base_system::BaseSystem {
    let path = format!(
        "{}/tests/fixtures/lib-system-spec.json",
        env!("CARGO_MANIFEST_DIR")
    );
    let text = std::fs::read_to_string(&path).expect("spec fixture reads");
    let mut spec: Value = serde_json::from_str(&text).expect("spec fixture parses");
    spec["breakpoints"] = json!({
        "tablet": "48rem",
        "padded": "640 ",
        "hex": "0x280",
        "pxname": "640px",
        "empty": "",
    });
    let text = serde_json::to_string(&spec).expect("range spec serializes");
    base_system::BaseSystem::from_json(&text).expect("range system parses")
}

/// Regenerate every golden in memory and diff against the committed files.
#[test]
fn namer_goldens_are_fresh() {
    let suites = all();
    let dir = PathBuf::from(GOLDEN_DIR);
    let update = std::env::var(UPDATE_ENV).is_ok_and(|value| value == "1");
    let mut stale = Vec::new();
    for suite in &suites {
        if let Some(file) = check_suite(suite, &dir, update) {
            stale.push(file);
        }
    }
    let unknown = unknown_files(&dir, &suites);
    assert!(
        stale.is_empty() && unknown.is_empty(),
        "namer goldens stale: files=[{}] unknown=[{}]. If a naming rule intentionally \
         changed a class, bump NAMER_RULES_VERSION in runtime/tables.rs (now {}) then \
         re-run with NAMER_UPDATE_GOLDENS=1. Unknown files are removed suites: delete \
         them. Unintentional drift must be fixed, not re-blessed.",
        stale.join(", "),
        unknown.join(", "),
        NAMER_RULES_VERSION
    );
}

/// Diff one suite, rewriting only on the update path. Returns the file when stale.
fn check_suite(suite: &Suite, dir: &PathBuf, update: bool) -> Option<&'static str> {
    let fresh = suite.text();
    let committed = std::fs::read_to_string(dir.join(suite.file)).unwrap_or_default();
    if committed == fresh {
        return None;
    }
    if update {
        std::fs::create_dir_all(dir).expect("create golden dir");
        std::fs::write(dir.join(suite.file), &fresh).expect("write golden");
        return None;
    }
    Some(suite.file)
}

/// Committed JSON files no suite generates: removed suites left behind.
fn unknown_files(dir: &PathBuf, suites: &[Suite]) -> Vec<String> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    entries
        .flatten()
        .map(|entry| entry.file_name().to_string_lossy().into_owned())
        .filter(|name| name.ends_with(".json") && !suites.iter().any(|suite| suite.file == *name))
        .collect()
}
