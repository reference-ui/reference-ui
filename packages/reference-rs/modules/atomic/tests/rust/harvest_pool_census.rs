//! Census JSON writer for the harvest census: the kind names in `KIND_ORDER`, the deterministic
//! `pool-census.json` document, and the write-only-when-it-moved guard. Takes the pool sets by kind,
//! the per-sink outcomes and the gross count, and emits the JSON text the TypeScript census joins
//! against. The write guard keeps mtimes quiet on green runs.

use std::collections::BTreeMap;
use std::path::Path;

use super::harvest_pool_sinks::SinkOutcome;

/// Lowercase kind names for the census JSON, in `KIND_ORDER`.
const KIND_NAMES: [(canon::ValueKind, &str); 6] = [
    (canon::ValueKind::Color, "color"),
    (canon::ValueKind::Length, "length"),
    (canon::ValueKind::Transform, "transform"),
    (canon::ValueKind::Math, "math"),
    (canon::ValueKind::Url, "url"),
    (canon::ValueKind::Keyword, "keyword"),
];

/// Lowercase kind name for the census JSON.
pub(crate) fn kind_name(kind: canon::ValueKind) -> &'static str {
    KIND_NAMES
        .iter()
        .find(|(candidate, _)| *candidate == kind)
        .map(|(_, name)| *name)
        .expect("exhaustive kind table")
}

/// Deterministic census JSON: pool sets, sink rows, gross.
pub(crate) fn census_json(
    sets: &BTreeMap<&'static str, Vec<String>>,
    outcomes: &[SinkOutcome],
    gross: usize,
) -> String {
    let sinks: Vec<BTreeMap<&str, serde_json::Value>> = outcomes
        .iter()
        .map(|o| {
            BTreeMap::from([
                ("prop", serde_json::Value::String(o.prop.clone())),
                (
                    "when",
                    serde_json::Value::Array(
                        o.when.iter().cloned().map(serde_json::Value::String).collect(),
                    ),
                ),
                ("kind", serde_json::Value::String(o.kind.clone())),
                (
                    "offered",
                    serde_json::Value::Number(serde_json::Number::from(o.offered)),
                ),
            ])
        })
        .collect();
    let doc = serde_json::json!({
        "pool": sets,
        "sinks": sinks,
        "gross": gross,
    });
    format!("{}\n", serde_json::to_string_pretty(&doc).expect("census serializes"))
}

/// Write the census only when it moved, to keep mtimes quiet on green runs.
pub(crate) fn write_if_differs(path: &Path, content: &str) {
    let current = std::fs::read_to_string(path).unwrap_or_default();
    if current != content {
        std::fs::write(path, content).expect("census json writes");
    }
}
