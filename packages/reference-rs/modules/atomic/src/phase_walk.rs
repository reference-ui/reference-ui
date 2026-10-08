//! The walk that follows the publish round.
//!
//! Import refs are collected once project constants exist. The coordinator
//! resolves them in source order. Each lane then walks the programs it still
//! holds and stores owned extract products plus analysis facts. The three
//! steps run as rendezvous rounds, never as barrier waits, so a dead lane
//! aborts the phase instead of hanging it.

use oxc_parser::ParserReturn;

use crate::diagnostics::analysis::{self, AnalyzedSource};
use crate::diagnostics::SourceId;
use crate::extract::identity::IdentityGraph;
use crate::extract::resolver::ValueGraph;
use crate::extract::scope;
use crate::extract_parallel::{self, ExtractIn};
use crate::phase_lane;
use crate::phase_parallel::{self, Published, Shared};
use crate::styling_skip;

/// Scope-collect import refs now that project constants exist.
pub(crate) fn store_refs(shared: &Shared<'_>, indices: &[usize], parsed: &[ParserReturn<'_>]) {
    let Some(published) = phase_parallel::load_published(shared) else {
        return;
    };
    for (&index, parsed) in indices.iter().zip(parsed.iter()) {
        let content = &shared.sources[index].1;
        if parsed.panicked || styling_skip(content) || phase_lane::lock(&shared.files[index]).panicked {
            continue;
        }
        #[cfg(test)]
        crate::phase_gate::panic_marker(content, "p0a-panic-refs");
        let table = scope::collect(&parsed.program, published.constants.as_ref());
        phase_lane::lock(&shared.files[index]).import_refs = table.import_refs();
    }
}

/// Resolve every styling file's imports in source order, on the coordinator only.
/// `ValueGraph` holds `Rc`, so it is `!Send`; only the coordinator builds and borrows it.
pub(crate) fn resolve_all(shared: &Shared<'_>, graph: &mut ValueGraph<'_>) {
    for index in 0..shared.sources.len() {
        let (path, content) = &shared.sources[index];
        if shared.streamed[index] || styling_skip(content) {
            continue;
        }
        let (panicked, refs) = {
            let file = phase_lane::lock(&shared.files[index]);
            (file.panicked, file.import_refs.clone())
        };
        if panicked {
            continue;
        }
        let values = graph.resolve_file_imports(path, &refs);
        phase_lane::lock(&shared.files[index]).values = values;
    }
}

/// Walk styling files this lane parsed, and predict their analysis facts.
/// Each lane builds its own `IdentityGraph` (`RefCell`, `!Sync`); none is shared.
pub(crate) fn walk_retained(shared: &Shared<'_>, indices: &[usize], parsed: &[ParserReturn<'_>]) {
    let Some(published) = phase_parallel::load_published(shared) else {
        return;
    };
    let identity = IdentityGraph::from_shared(shared.sources, &published.maps);
    let ctx = analysis::context(
        &published.hosts,
        published.constants.as_ref(),
        shared.system,
    );
    let env = WalkEnv {
        shared,
        published: &published,
        identity: &identity,
        ctx: &ctx,
    };
    for (&index, parsed) in indices.iter().zip(parsed.iter()) {
        walk_one(&env, index, parsed);
    }
}

/// What one file's walk reads from the lane and the published bundle.
struct WalkEnv<'a> {
    shared: &'a Shared<'a>,
    published: &'a Published,
    identity: &'a IdentityGraph<'a>,
    ctx: &'a analysis::AnalysisCtx<'a>,
}

/// One retained file: extract when it styles, and record analysis under its source id.
fn walk_one(env: &WalkEnv<'_>, index: usize, parsed: &ParserReturn<'_>) {
    let shared = env.shared;
    let published = env.published;
    if parsed.panicked {
        return;
    }
    let (path, content) = &shared.sources[index];
    if styling_skip(content) {
        return;
    }
    if phase_lane::lock(&shared.files[index]).panicked {
        return;
    }
    #[cfg(test)]
    crate::phase_gate::panic_marker(content, "p0a-panic-walk");
    let values = phase_lane::lock(&shared.files[index]).values.clone();
    let bindings =
        crate::extract::collect_bindings_with_identity(&parsed.program, path, env.identity);
    let extracted = extract_parallel::extract_program(
        &parsed.program,
        &ExtractIn {
            path,
            content,
            constants: published.constants.as_ref(),
            values: &values,
            bindings: &bindings,
            breakpoints: shared.breakpoints,
            traced: &published.traced,
            owned_props: &published.hosts.owned_props,
        },
    );
    let analysis = match published.source_ids.get(index).copied().flatten() {
        Some(id) => {
            let source = AnalyzedSource {
                path,
                content,
                program: &parsed.program,
            };
            analysis::source_facts(env.ctx, SourceId(id), &source)
        }
        None => Vec::new(),
    };
    let mut file = phase_lane::lock(&shared.files[index]);
    file.extracted = Some(extracted);
    file.analysis = analysis;
}
