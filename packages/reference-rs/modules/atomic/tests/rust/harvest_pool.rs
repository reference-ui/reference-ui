//! Enterprise harvest pool census: the harvest pool over the committed
//! enterprise fixture, read with the compiler's own classifier and mint.
//! Takes the fixture dir plus the lib system spec, parses every source with
//! the same oxc options as `compile()`, and emits `pool-census.json` (pool
//! sets by kind, per-sink offered counts, gross) for the TypeScript census
//! join. Offered counts come from the real `mint()` over the closed-world
//! sink list with an empty seed, so gross is exact, never re-implemented.
//! The fixture reader, the sink builder and the census writer live in the `harvest_pool_*` sibling modules of this test target.

mod harvest_pool_census;
mod harvest_pool_sinks;
mod harvest_pool_source;

use std::collections::BTreeMap;
use std::path::Path;

use atomic::extract::harvest::KIND_ORDER;

use harvest_pool_census::{census_json, kind_name, write_if_differs};
use harvest_pool_sinks::{build_sinks, mint_outcomes};
use harvest_pool_source::{fixture_sources, pool_for_sources};

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
    ("backgroundColor", &[], "color", 7),
    ("backgroundImage", &[], "url", 13),
    ("bg", &[], "color", 15),
    ("borderBottomColor", &[], "color", 7),
    ("borderColor", &[], "color", 7),
    ("color", &[], "color", 7),
    ("color", &["_hover"], "color", 7),
    ("display", &[], "keyword", 6),
    ("fill", &[], "color", 8),
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
    ("outlineColor", &[], "color", 8),
    ("padding", &[], "length", 175),
    ("paddingBlock", &[], "length", 175),
    ("paddingBottom", &[], "length", 175),
    ("paddingInline", &[], "length", 175),
    ("paddingLeft", &[], "length", 175),
    ("paddingRight", &[], "length", 175),
    ("paddingTop", &[], "length", 175),
    ("stroke", &[], "color", 8),
    ("transform", &[], "transform", 12),
    ("width", &[], "length", 176),
    ("width", &["md"], "length", 176),
];

const EXPECTED_SINK_COUNT: usize = 32;
const EXPECTED_GROSS: usize = 3615;

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
