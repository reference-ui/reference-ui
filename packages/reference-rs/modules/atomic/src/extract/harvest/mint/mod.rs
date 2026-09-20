//! Harvest minting: pool × kind-compatible sinks into the compile's wants.
//!
//! After the site walk, every sink mints every pool value its prop accepts
//! (the kind gate in `validity`), carrying the sink's `when`, into the same
//! wants vector and the same authored declarations the site walk filled — one
//! `AtomSet`, one namer, one `runtime-data.mjs` at `schemaVersion: 1`.
//! Resolve runs unchanged: rhythm lowers, the §9 fence passes alphabet
//! values without consulting tokens, and `AtomSet` dedupes against site
//! atoms. One `ATM-I-HARVEST-SINK` info per sink carries the minted count;
//! harvest never emits a warning (A5). Pairs duplicating an existing want
//! (exact or alias twin, see `twins`) are skipped; infos count net-new.

mod twins;
mod validity;

use std::collections::HashSet;

use base_system::BaseSystem;

use super::literals::{HarvestPool, KIND_ORDER};
use super::sinks::Sink;
use crate::atom::{AtomValue, Want};
use crate::diagnostics::adapters::harvest::HarvestReport;
use crate::diagnostics::{
    Diagnostic, DiagnosticFact, DiagnosticLocation, DiagnosticSink, DiagnosticsSession, Policy,
};
use crate::resolve::conditions::{lower_when, LoweredWhen};
use crate::runtime::AuthoredDeclaration;
use twins::{twin_key_for, TwinKey};
use validity::harvest_accepts;

/// The harvest marker on minted wants: `Want::origin` is the site-name
/// string, so harvest signs its wants with its own name.
pub const HARVEST_ORIGIN: &str = "harvest";

/// Context for minting harvested atoms (see the module docs).
pub struct MintCtx<'a> {
    pub pool: &'a HarvestPool,
    pub sinks: &'a [Sink],
    pub system: &'a BaseSystem,
    pub wants: &'a mut Vec<Want>,
    pub authored: &'a mut Vec<AuthoredDeclaration>,
    pub diagnostics: &'a mut Vec<Diagnostic>,
    pub sink: &'a mut DiagnosticsSession,
}

/// The mutable mint state threaded through sinks.
struct MintState<'a> {
    seen: HashSet<TwinKey>,
    wants: &'a mut Vec<Want>,
    authored: &'a mut Vec<AuthoredDeclaration>,
}

/// Mint pool × kind-compatible sinks; one info per sink with its count.
/// Sinks whose `when` cannot lower (an unknown responsive key rode along)
/// are skipped silently: minting them would warn at resolve, against A5.
/// Pairs duplicating an existing want (exact or alias twin) are skipped:
/// exact dupes would dedupe downstream anyway, and alias twins (`mt` vs
/// `marginTop`) would take one class name for two atoms, against GHOST-04.
/// Infos count net-new pairs.
pub fn mint(ctx: MintCtx<'_>) {
    let MintCtx {
        pool,
        sinks,
        system,
        wants,
        authored,
        diagnostics,
        sink: session,
    } = ctx;
    let mut state = MintState {
        seen: wants.iter().map(twin_key_for).collect(),
        wants,
        authored,
    };
    for sink in ordered_unique(sinks) {
        if !when_lowers(&sink.when, system) {
            continue;
        }
        let minted = mint_sink(pool, sink, &mut state);
        let report = HarvestReport {
            location: DiagnosticLocation {
                file: Some(sink.file.to_string()),
                line: sink.line,
                column: sink.column,
            },
            prop: sink.prop.clone(),
            when: sink.when.iter().cloned().collect(),
            minted: minted.count,
            offered: minted.offered,
        };
        let diagnostic = Policy::render_harvest(&report);
        session.report(DiagnosticFact::from(report));
        diagnostics.push(diagnostic);
    }
}

/// Deduped sinks in deterministic `(prop, when)` order, first site kept.
fn ordered_unique(sinks: &[Sink]) -> Vec<&Sink> {
    let mut seen = HashSet::new();
    let mut ordered: Vec<&Sink> = sinks
        .iter()
        .filter(|sink| seen.insert((sink.prop.clone(), sink.when.clone())))
        .collect();
    ordered.sort_by(|a, b| (&a.prop, &a.when).cmp(&(&b.prop, &b.when)));
    ordered
}

/// What one sink accepted from the pool: the net-new minted count plus
/// every kind-accepted value (pre-twin-skip), so proof can tell a covered
/// sink (all offered values already planned) from a vacuous one (the pool
/// offered nothing). Acceptance order is deterministic: kind order, then
/// pool order within each kind.
struct SinkMint {
    count: usize,
    offered: Vec<Box<str>>,
}

/// Mint one sink's compatible pool values; the net-new count plus the
/// kind-accepted offering. Twin-skipped values stay in the offering: they
/// are what the pool contributed, even when a site want already held them.
fn mint_sink(pool: &HarvestPool, sink: &Sink, state: &mut MintState<'_>) -> SinkMint {
    let canonical = canon::resolve_canonical_prop(&sink.prop);
    let mut minted = SinkMint {
        count: 0,
        offered: Vec::new(),
    };
    for kind in KIND_ORDER {
        let Some(values) = pool.values(kind) else {
            continue;
        };
        for value in values {
            if !harvest_accepts(&sink.prop, canonical, kind, value) {
                continue;
            }
            minted.offered.push(value.clone());
            let twin = (canonical.into(), value.clone(), sink.when.clone(), false);
            if !state.seen.insert(twin) {
                continue;
            }
            push_harvested(state.wants, state.authored, sink, value);
            minted.count += 1;
        }
    }
    minted
}

/// One harvested pair into the compile's wants and authored declarations:
/// the want feeds the sheet and `css.json`, the authored declaration feeds
/// the runtime plan — both resolve through the unchanged pipeline.
fn push_harvested(
    wants: &mut Vec<Want>,
    authored: &mut Vec<AuthoredDeclaration>,
    sink: &Sink,
    value: &str,
) {
    wants.push(
        Want::new(sink.prop.clone(), AtomValue::String(value.into()))
            .with_when(sink.when.clone())
            .with_origin(Some(HARVEST_ORIGIN)),
    );
    authored.push(AuthoredDeclaration {
        when: sink.when.iter().map(|w| w.to_string()).collect(),
        prop: sink.prop.to_string(),
        value: serde_json::Value::String(value.to_string()),
        important: false,
    });
}

/// True when every `when` entry lowers (or skips, like `base`).
fn when_lowers(when: &[Box<str>], system: &BaseSystem) -> bool {
    when.iter()
        .all(|entry| !matches!(lower_when(entry, system), LoweredWhen::Unknown))
}

#[cfg(test)]
mod tests {
    use smallvec::SmallVec;

    use super::super::sinks::SinkSite;
    use super::*;

    /// A bare `(prop, when)` sink for gate assertions.
    fn sink_for(prop: &str) -> Sink {
        Sink::for_site(SinkSite {
            prop,
            when: &SmallVec::new(),
            file: "t.ts",
            line: None,
            column: None,
        })
        .expect("known style prop sinks")
    }

    /// Mint the pool values onto one sink over the given wants; the count.
    fn mint_count(pool_values: &[&str], sink: &Sink, wants: &mut Vec<Want>) -> usize {
        let mut pool = HarvestPool::default();
        for value in pool_values {
            pool.insert(value);
        }
        let mut authored = Vec::new();
        let mut state = MintState {
            seen: wants.iter().map(twin_key_for).collect(),
            wants,
            authored: &mut authored,
        };
        mint_sink(&pool, sink, &mut state).count
    }

    #[test]
    fn auto_none_gate_on_validity_tables() {
        let order = sink_for("order");
        let margin_top = sink_for("marginTop");
        let mut wants = Vec::new();
        assert_eq!(mint_count(&["auto"], &order, &mut wants), 0);
        assert_eq!(mint_count(&["auto"], &margin_top, &mut wants), 1);
        let display = sink_for("display");
        let color = sink_for("color");
        assert_eq!(mint_count(&["none"], &display, &mut wants), 1);
        assert_eq!(mint_count(&["none"], &color, &mut wants), 0);
    }

    #[test]
    fn css_wide_keywords_ride_everywhere() {
        let order = sink_for("order");
        let mut wants = Vec::new();
        assert_eq!(mint_count(&["inherit"], &order, &mut wants), 1);
        assert_eq!(mint_count(&["var(--x)"], &order, &mut wants), 1);
    }

    /// Mint the pool values onto one sink; the kind-accepted offering.
    fn mint_offered(pool_values: &[&str], sink: &Sink, wants: &mut Vec<Want>) -> Vec<Box<str>> {
        let mut pool = HarvestPool::default();
        for value in pool_values {
            pool.insert(value);
        }
        let mut authored = Vec::new();
        let mut state = MintState {
            seen: wants.iter().map(twin_key_for).collect(),
            wants,
            authored: &mut authored,
        };
        mint_sink(&pool, sink, &mut state).offered
    }

    #[test]
    fn offering_keeps_twin_skipped_values() {
        let color = sink_for("color");
        let mut wants = vec![Want::new("color", AtomValue::String("red".into()))];
        assert_eq!(mint_offered(&["red"], &color, &mut wants), vec!["red".into()]);
        assert_eq!(
            mint_offered(&["red"], &color, &mut Vec::new()),
            vec!["red".into()]
        );
        let width = sink_for("width");
        assert!(mint_offered(&["red"], &width, &mut Vec::new()).is_empty());
    }

    #[test]
    fn alias_twins_and_exact_dupes_skip() {
        let mt = sink_for("mt");
        let mut wants = vec![Want::new("marginTop", AtomValue::String("1px".into()))];
        assert_eq!(mint_count(&["1px", "2px"], &mt, &mut wants), 1);
        let color = sink_for("color");
        let mut wants = vec![Want::new("color", AtomValue::String("red".into()))];
        assert_eq!(mint_count(&["red"], &color, &mut wants), 0);
    }

    #[test]
    fn mint_reports_fact_and_legacy_info() {
        let mut pool = HarvestPool::default();
        pool.insert("red");
        let sink = sink_for("color");
        let system = BaseSystem::default();
        let mut wants = Vec::new();
        let mut authored = Vec::new();
        let mut diagnostics = Vec::new();
        let mut session = DiagnosticsSession::new();
        mint(MintCtx {
            pool: &pool,
            sinks: std::slice::from_ref(&sink),
            system: &system,
            wants: &mut wants,
            authored: &mut authored,
            diagnostics: &mut diagnostics,
            sink: &mut session,
        });
        assert!(matches!(
            session.facts(),
            [DiagnosticFact::HarvestOutcome { minted: 1, .. }]
        ));
        assert_eq!(diagnostics.len(), 1);
        assert_eq!(
            diagnostics[0].message,
            "color under []: 1 harvested value minted"
        );
        assert_eq!(diagnostics[0].file.as_deref(), Some("t.ts"));
    }
}
