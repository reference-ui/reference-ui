//! Enterprise harvest pool census: the harvest pool over the committed
//! enterprise fixture, read with the compiler's own classifier and mint.
//! Takes the fixture dir plus the lib system spec, parses every source with
//! the same oxc options as `compile()`, and emits `pool-census.json` (pool
//! sets by kind, per-sink offered counts, gross) for the TypeScript census
//! join. Offered counts come from the real `mint()` over the closed-world
//! sink list with an empty seed, so gross is exact, never re-implemented.

use std::collections::BTreeMap;
use std::path::Path;

use atomic::diagnostics::{DiagnosticFact, DiagnosticsSession};
use atomic::extract::harvest::{
    MintCtx, Sink, SinkSite, KIND_ORDER, collect_pool,
};
use atomic::runtime::AuthoredDeclaration;
use atomic::{BaseSystem, Diagnostic, Want};
use oxc_allocator::Allocator;
use oxc_parser::{Parser, ParserReturn};
use oxc_span::SourceType;
use smallvec::SmallVec;

const FIXTURE_SRC: &str = "tests/fixtures/harvest-enterprise/src";
const CENSUS_JSON: &str = "tests/fixtures/harvest-enterprise/pool-census.json";
const LIB_SPEC: &str = "tests/fixtures/lib-system-spec.json";

/// Expected pool counts by kind: the evidence numbers, pinned.
const EXPECTED_POOL: &[(&str, usize)] = &[
    ("color", 149), ("keyword", 7),
    ("length", 170), ("math", 0),
    ("transform", 6), ("url", 8),
];

/// Closed-world sink list with the expected `(prop, when, kind, offered)`
/// per sink, `(prop, when)` sorted to match mint's deterministic order.
/// The `(prop, when)` pairs feed the real `mint()`; the TypeScript census
/// independently proves the real compile mints exactly these sinks.
/// The evidence numbers, pinned.
const EXPECTED_SINKS: &[(&str, &[&str], &str, usize)] = &[
    ("backgroundColor", &[], "color", 154),
    ("backgroundImage", &[], "url", 13),
    ("bg", &[], "color", 162),
    ("borderBottomColor", &[], "color", 154),
    ("borderColor", &[], "color", 154),
    ("color", &[], "color", 154),
    ("color", &["_hover"], "color", 154),
    ("display", &[], "keyword", 6),
    ("fill", &[], "color", 155),
    ("fontSize", &[], "length", 175),
    ("height", &[], "length", 176),
    ("margin", &[], "length", 176),
    ("marginBlock", &[], "length", 175),
    ("marginBottom", &[], "length", 176),
    ("marginInline", &[], "length", 175),
    ("marginLeft", &[], "length", 176),
    ("marginRight", &[], "length", 176),
    ("marginTop", &[], "length", 176),
    ("maxWidth", &[], "length", 176),
    ("minWidth", &[], "length", 176),
    ("outlineColor", &[], "color", 155),
    ("padding", &[], "length", 175),
    ("paddingBlock", &[], "length", 175),
    ("paddingBottom", &[], "length", 175),
    ("paddingInline", &[], "length", 175),
    ("paddingLeft", &[], "length", 175),
    ("paddingRight", &[], "length", 175),
    ("paddingTop", &[], "length", 175),
    ("stroke", &[], "color", 155),
    ("transform", &[], "transform", 12),
    ("width", &[], "length", 176),
    ("width", &["md"], "length", 176),
];

const EXPECTED_SINK_COUNT: usize = 32;
const EXPECTED_GROSS: usize = 4938;

#[test]
fn harvest_pool_census() {
    let sources = fixture_sources();
    assert!(!sources.is_empty(), "fixture dir has no sources");
    let pool = pool_for_sources(&sources);

    let mut counts = BTreeMap::new();
    let mut sets = BTreeMap::new();
    for kind in KIND_ORDER {
        let name = kind_name(kind);
        let values: Vec<String> = pool
            .values(kind)
            .map(|set| set.iter().map(ToString::to_string).collect())
            .unwrap_or_default();
        counts.insert(name, values.len());
        sets.insert(name, values);
    }

    let sinks = build_sinks();
    let outcomes = mint_outcomes(&pool, &sinks);
    let gross: usize = outcomes.iter().map(|o| o.offered).sum();
    let json = census_json(&sets, &outcomes, gross);
    write_if_differs(Path::new(CENSUS_JSON), &json);

    println!("harvest pool by kind: {counts:?}");
    println!("harvest sinks: {}", outcomes.len());
    println!("harvest gross offered: {gross}");
    for outcome in &outcomes {
        println!(
            "harvest sink {} [{}] kind={} offered={}",
            outcome.prop,
            outcome.when.join(","),
            outcome.kind,
            outcome.offered,
        );
    }

    for (kind, expected) in EXPECTED_POOL {
        assert_eq!(
            counts.get(kind).copied().unwrap_or(0),
            *expected,
            "pool kind {kind}"
        );
    }
    assert_eq!(outcomes.len(), EXPECTED_SINK_COUNT, "sink count");
    for (outcome, expected) in outcomes.iter().zip(EXPECTED_SINKS.iter()) {
        let actual = (
            outcome.prop.clone(),
            outcome.when.clone(),
            outcome.kind.clone(),
            outcome.offered,
        );
        let wanted = (
            expected.0.to_string(),
            expected.1.iter().map(ToString::to_string).collect::<Vec<_>>(),
            expected.2.to_string(),
            expected.3,
        );
        assert_eq!(actual, wanted, "sink census row");
    }
    assert_eq!(gross, EXPECTED_GROSS, "gross offered");
}

/// One sink's measured census row: identity, kind, and offered count.
struct SinkOutcome {
    prop: String,
    when: Vec<String>,
    kind: String,
    offered: usize,
}

/// Collect every compile-input source under the fixture dir, sorted.
fn fixture_sources() -> Vec<(String, String)> {
    let mut files = Vec::new();
    collect_dir(Path::new(FIXTURE_SRC), &mut files);
    files.sort();
    files
}

/// Recursively gather `.ts/.tsx/.js/.jsx` sources, mirroring the case helper.
fn collect_dir(dir: &Path, files: &mut Vec<(String, String)>) {
    let entries = std::fs::read_dir(dir).expect("fixture src dir reads");
    for entry in entries {
        let entry = entry.expect("fixture dir entry reads");
        let path = entry.path();
        if path.is_dir() {
            collect_dir(&path, files);
            continue;
        }
        let is_source = path
            .extension()
            .and_then(|ext| ext.to_str())
            .is_some_and(|ext| matches!(ext, "ts" | "tsx" | "js" | "jsx"));
        if is_source {
            let content = std::fs::read_to_string(&path).expect("fixture file reads");
            files.push((path_to_key(&path), content));
        }
    }
}

/// Stable source key: the fixture-relative path with forward slashes.
fn path_to_key(path: &Path) -> String {
    path.components()
        .map(|part| part.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

/// Parse every source with `compile()`'s options and collect the pool.
fn pool_for_sources(sources: &[(String, String)]) -> atomic::extract::harvest::HarvestPool {
    let allocators: Vec<Allocator> = sources.iter().map(|_| Allocator::default()).collect();
    let parsed: Vec<ParserReturn<'_>> = sources
        .iter()
        .zip(allocators.iter())
        .map(|((path, content), allocator)| parse_source(path, content, allocator))
        .collect();
    collect_pool(&parsed, &vec![false; parsed.len()])
}

/// One source parsed exactly as `compile()` parses it: JSX follows the
/// extension, TypeScript always on.
fn parse_source<'a>(
    path: &str,
    content: &'a str,
    allocator: &'a Allocator,
) -> ParserReturn<'a> {
    let source_type = SourceType::from_path(Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    Parser::new(allocator, content, source_type).parse()
}

/// Build the closed-world sinks; owned and runtime props must not record.
fn build_sinks() -> Vec<Sink> {
    for prop in ["gap", "offset"] {
        let site = SinkSite {
            prop,
            when: &SmallVec::new(),
            file: "negative.ts",
            line: None,
            column: None,
        };
        assert!(Sink::for_site(site).is_none(), "{prop} records no sink");
    }
    EXPECTED_SINKS
        .iter()
        .map(|(prop, when, _, _)| {
            let scope: SmallVec<[Box<str>; 2]> =
                when.iter().map(|entry| (*entry).into()).collect();
            let site = SinkSite {
                prop,
                when: &scope,
                file: "holes.ts",
                line: None,
                column: None,
            };
            Sink::for_site(site).expect("designed hole records a sink")
        })
        .collect()
}

/// Run the real `mint()` over an empty seed and read offered per sink from
/// the reported facts. The seed is empty, so minted equals offered: any
/// cross-sink alias twin would fail that equality loud.
fn mint_outcomes(
    pool: &atomic::extract::harvest::HarvestPool,
    sinks: &[Sink],
) -> Vec<SinkOutcome> {
    let spec = std::fs::read_to_string(LIB_SPEC).expect("lib spec reads");
    let system = BaseSystem::from_json(&spec).expect("lib spec lowers");
    let kinds: BTreeMap<(String, String), String> = sinks
        .iter()
        .map(|sink| {
            (
                (
                    sink.prop.to_string(),
                    sink.when.iter().map(ToString::to_string).collect::<Vec<_>>().join(","),
                ),
                kind_name(sink.kind).to_string(),
            )
        })
        .collect();
    let mut wants: Vec<Want> = Vec::new();
    let mut authored: Vec<AuthoredDeclaration> = Vec::new();
    let mut diagnostics: Vec<Diagnostic> = Vec::new();
    let mut session = DiagnosticsSession::new();
    atomic::extract::harvest::mint(MintCtx {
        pool,
        sinks,
        system: &system,
        wants: &mut wants,
        authored: &mut authored,
        diagnostics: &mut diagnostics,
        sink: &mut session,
    });
    let mut outcomes = Vec::new();
    for fact in session.facts() {
        let DiagnosticFact::HarvestOutcome {
            prop,
            when,
            minted,
            offered,
            ..
        } = fact
        else {
            continue;
        };
        assert_eq!(
            *minted,
            offered.len(),
            "empty seed mints every offered pair for {prop}"
        );
        let key = (
            prop.to_string(),
            when.iter().map(ToString::to_string).collect::<Vec<_>>().join(","),
        );
        let kind = kinds.get(&key).expect("fact matches a designed sink");
        outcomes.push(SinkOutcome {
            prop: prop.to_string(),
            when: when.iter().map(ToString::to_string).collect(),
            kind: kind.clone(),
            offered: offered.len(),
        });
    }
    outcomes
}

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
fn kind_name(kind: canon::ValueKind) -> &'static str {
    KIND_NAMES
        .iter()
        .find(|(candidate, _)| *candidate == kind)
        .map(|(_, name)| *name)
        .expect("exhaustive kind table")
}

/// Deterministic census JSON: pool sets, sink rows, gross.
fn census_json(
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
fn write_if_differs(path: &Path, content: &str) {
    let current = std::fs::read_to_string(path).unwrap_or_default();
    if current != content {
        std::fs::write(path, content).expect("census json writes");
    }
}
