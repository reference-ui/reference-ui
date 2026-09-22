//! Ordered merge of owned lane records into project constants.
//!
//! The coordinator folds every file's constants, record, and trace module in
//! input order, then resolves the hosts and publishes one bundle for the walk.
//! The value graph builds over the merged records without storing any program.
//! Panicked files contribute their maps and traces only, never their constants.

use std::collections::BTreeMap;
use std::path::PathBuf;
use std::sync::Arc;

use crate::extract::constants::LocalConstants;
use crate::extract::identity_map::ExportMap;
use crate::extract::resolver::{StreamedSource, ValueGraph};
use crate::hosts::{self, PreparedTrace};
use crate::phase_lane;
use crate::phase_parallel::{lock_published, Published, Shared};

use module_graph::ModuleKey;

/// Merge owned records in source order and publish the hosts and maps.
pub(crate) fn publish(
    shared: &Shared<'_>,
    sinks: &mut super::CompileSinks<'_>,
) -> (Arc<LocalConstants>, Vec<StreamedSource>) {
    #[cfg(test)]
    for (_, content) in shared.sources {
        crate::phase_gate::panic_marker(content, "p0a-panic-publish");
    }
    let mut project = LocalConstants::new();
    let mut staged = Vec::new();
    let mut maps = Vec::with_capacity(shared.sources.len());
    let mut source_ids = vec![None; shared.sources.len()];
    let mut failed = vec![false; shared.sources.len()];
    let mut modules = BTreeMap::new();
    let mut next = 0u32;
    for index in 0..shared.sources.len() {
        let folded = fold_index(shared, index, &mut project);
        if let Some(module) = folded.trace {
            modules.insert(PathBuf::from(&shared.sources[index].0), module);
        }
        failed[index] = folded.failed;
        if !folded.panicked {
            source_ids[index] = Some(next);
            next += 1;
        }
        if let Some(source) = folded.staged {
            staged.push(source);
        }
        maps.push(folded.map);
    }
    let constants = Arc::new(project);
    let (hosts, host_diagnostics) = hosts::resolve_prepared(
        PreparedTrace {
            request: shared.request,
            sources: shared.sources,
            failed: &failed,
            surface: shared.surface,
            modules,
        },
        sinks.session,
    );
    sinks.diagnostics.extend(host_diagnostics);
    let traced = hosts.hosts();
    *lock_published(shared.published) = Some(Arc::new(Published {
        constants: Arc::clone(&constants),
        hosts,
        traced,
        source_ids,
        maps,
    }));
    (constants, staged)
}

/// One file's contribution to the ordered merge.
struct Folded {
    panicked: bool,
    failed: bool,
    map: Option<Arc<ExportMap>>,
    staged: Option<StreamedSource>,
    trace: Option<styletrace::TraceModule>,
}

/// Move one file's constants and record into the ordered merge.
fn fold_index(shared: &Shared<'_>, index: usize, project: &mut LocalConstants) -> Folded {
    let mut file = phase_lane::lock(&shared.files[index]);
    debug_assert!(!file.recovered() || !file.is_mergeable(), "recovered guard must refuse");
    file.ensure_mergeable();
    let panicked = file.panicked;
    let failed = panicked || !file.errors.is_empty();
    let map = file.export_map.clone();
    let trace = file.trace.take();
    if panicked {
        return Folded {
            panicked,
            failed,
            map,
            staged: None,
            trace,
        };
    }
    project.merge(&file.constants);
    let staged = file.record.take().map(|record| StreamedSource {
        key: ModuleKey::new(&shared.sources[index].0),
        record,
        bag: std::mem::take(&mut file.constants),
    });
    Folded {
        panicked,
        failed,
        map,
        staged,
        trace,
    }
}

/// Value graph over owned records. Origins refine by re-parse; no program is stored.
pub(crate) fn build_graph<'a>(
    sources: &'a [(String, String)],
    streamed: Vec<StreamedSource>,
    constants: &'a LocalConstants,
) -> ValueGraph<'a> {
    let retained: &[crate::extract::resolver::RetainedSource<'a>] = &[];
    ValueGraph::new(sources, retained, streamed, constants)
}
