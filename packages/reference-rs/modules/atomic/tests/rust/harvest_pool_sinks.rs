//! Closed-world sinks for the harvest census: builds the designed hole sinks from the pinned
//! `(prop, when)` list, asserts that the owned and runtime props record nothing, and runs the real
//! `mint()` over an empty seed to read offered counts per sink. Takes the pinned sink list and the
//! lib system spec, and emits one `SinkOutcome` per harvest fact. Every fact must match a designed
//! sink, so an unexpected sink fails the census loudly.

use std::collections::BTreeMap;

use atomic::diagnostics::{DiagnosticFact, DiagnosticsSession};
use atomic::extract::harvest::{MintCtx, Sink, SinkSite};
use atomic::runtime::AuthoredDeclaration;
use atomic::{BaseSystem, Diagnostic, Want};
use smallvec::SmallVec;

use super::harvest_pool_census::kind_name;
use super::{EXPECTED_SINKS, LIB_SPEC};

/// One sink's measured census row: identity, kind, and offered count.
pub(crate) struct SinkOutcome {
    pub(crate) prop: String,
    pub(crate) when: Vec<String>,
    pub(crate) kind: String,
    pub(crate) offered: usize,
}

/// Build the closed-world sinks; owned and runtime props must not record.
pub(crate) fn build_sinks() -> Vec<Sink> {
    for prop in ["gap", "offset"] {
        let site = SinkSite {
            prop,
            when: &SmallVec::new(),
            file: "negative.ts",
            line: None,
            column: None,
            span: None,
            backing: &atomic::atom::backing::OWN,
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
                span: None,
                backing: &atomic::atom::backing::OWN,
            };
            Sink::for_site(site).expect("designed hole records a sink")
        })
        .collect()
}

/// Run the real `mint()` over an empty seed and read offered per sink from
/// the reported facts. The seed is empty, so minted equals offered: any
/// cross-sink alias twin would fail that equality loud.
pub(crate) fn mint_outcomes(
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
