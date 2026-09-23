//! Ordered commit of the parallel phase: facts, errors, and extract products.
//!
//! Every shard commits in input order after the final rendezvous, so the
//! parallel sheet matches the serial walk byte for byte. Harvest mints from
//! the retained pools next, then recipe selections resolve and the unpanicked
//! index rebuilds from the slots. Nothing here spawns or waits; the lanes are
//! already joined when the coordinator calls in.

use crate::extract::identity::IdentityGraph;
use crate::hosts::ResolvedHosts;
use crate::phase_lane;
use crate::phase_parallel::{load_published, vacant_hosts, Shared};
use crate::stream::{self, SourceSlot};
use crate::string_skip;

/// Commit shards in input order, then harvest and recipe selections.
pub(crate) fn settle(
    shared: &Shared<'_>,
    slots: &mut [SourceSlot],
    sinks: &mut super::CompileSinks<'_>,
) -> (Vec<usize>, ResolvedHosts) {
    let published = match load_published(shared) {
        Some(published) => published,
        None => return (Vec::new(), vacant_hosts(shared.request)),
    };
    commit_outputs(shared, sinks);
    let pool = harvest_pool(shared);
    crate::extract::harvest::mint(crate::extract::harvest::MintCtx {
        pool: &pool,
        sinks: sinks.sinks,
        system: &shared.request.base_system,
        wants: sinks.wants,
        authored: sinks.authored,
        diagnostics: sinks.diagnostics,
        sink: sinks.session,
    });
    let identity = IdentityGraph::from_shared(shared.sources, &published.maps);
    let resolved = crate::extract::recipes::selection::resolve_all(
        sinks.tentative,
        sinks.recipe_bindings,
        &identity,
    );
    sinks.selections.extend(resolved);
    for (slot, file) in slots.iter_mut().zip(shared.files.iter()) {
        slot.panicked = phase_lane::lock(file).panicked;
    }
    (stream::unpanicked_index(slots), published.hosts.clone())
}

/// Analysis facts, parse errors, then extract products, each in source order.
fn commit_outputs(shared: &Shared<'_>, sinks: &mut super::CompileSinks<'_>) {
    for file in shared.files {
        let mut file = phase_lane::lock(file);
        sinks
            .session
            .extend_facts(std::mem::take(&mut file.analysis));
    }
    let errors: Vec<Vec<(String, Option<u32>)>> = shared
        .files
        .iter()
        .map(|file| phase_lane::lock(file).errors.clone())
        .collect();
    stream::report_parse_errors(shared.sources, &errors, sinks.diagnostics);
    for file in shared.files {
        if let Some(extracted) = phase_lane::lock(file).extracted.take() {
            extracted.commit(sinks);
        }
    }
}

/// Retained pools, in input order. Streamed files hold no harvestable literals.
fn harvest_pool(shared: &Shared<'_>) -> crate::extract::harvest::HarvestPool {
    let mut pool = crate::extract::harvest::HarvestPool::default();
    for (index, file) in shared.files.iter().enumerate() {
        if shared.streamed[index] || string_skip(&shared.sources[index].1) {
            continue;
        }
        let mut file = phase_lane::lock(file);
        if file.panicked {
            continue;
        }
        pool.merge(std::mem::take(&mut file.harvest));
    }
    pool
}
