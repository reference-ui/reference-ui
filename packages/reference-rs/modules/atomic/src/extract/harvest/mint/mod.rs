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

mod allowlist;
mod twins;
mod validity;

use base_system::BaseSystem;
use rustc_hash::FxHashSet;

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
    seen: FxHashSet<TwinKey>,
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
    // Empty sinks means the loop below runs zero iterations, so the seed
    // set would be built and dropped with zero observable effects: skip it.
    // (Pool-empty + sinks>0 still runs: zero-offer reports are bytes.)
    if sinks.is_empty() {
        return;
    }
    let mut state = MintState {
        seen: wants.iter().map(twin_key_for).collect(),
        wants,
        authored,
    };
    for sink in ordered_unique(sinks) {
        if !when_lowers(&sink.when, system) {
            continue;
        }
        let minted = mint_sink(pool, sink, &mut state, system);
        let report = HarvestReport {
            location: DiagnosticLocation {
                file: Some(sink.file.to_string()),
                line: sink.line,
                column: sink.column,
                span: sink.span,
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
    let mut seen = FxHashSet::default();
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
fn mint_sink(
    pool: &HarvestPool,
    sink: &Sink,
    state: &mut MintState<'_>,
    system: &BaseSystem,
) -> SinkMint {
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
            if !harvest_accepts(&sink.prop, kind, value, system) {
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
mod tests;
