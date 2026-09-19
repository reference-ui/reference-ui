//! Second-pass scope overlays for the binding walk (SPEC-V2-34, SPEC-V2-57).
//! Collects each source's scope table against the merged literal bags, then
//! overlays its root values — alias chains, identifier values, static spreads —
//! onto the file's graph entry and stores its lowered helper descriptors beside
//! the bag. Names the origin file mutated stay out, so the overlay never
//! restores a stale init. Externals keep literal bags with no descriptors.

use oxc_allocator::Allocator;
use oxc_parser::Parser;
use oxc_span::SourceType;

use super::super::constants::LocalConstants;
use super::super::scope::{self, BindingInit, ScopeTable};
use super::{specifier::normalize_key, FileValues, ProjectGraph};

/// Overlay scope-resolved top-level values and descriptors onto each source
/// file's values. Captures bake against the merged literal bags, the way the
/// merge era baked them, but every descriptor and overlay stays per-file, so
/// same-named helpers in two files never meet.
pub(super) fn overlay_scope_values(graph: &mut ProjectGraph, sources: &[(String, String)]) {
    let merged = merged_bags(graph);
    for (path, content) in sources {
        overlay_one_file(graph, &merged, path, content);
    }
}

/// Every per-file bag merged, for capture baking and stale stripping.
fn merged_bags(graph: &ProjectGraph) -> LocalConstants {
    let mut merged = LocalConstants::new();
    for values in graph.files.values() {
        merged.merge(&values.bag);
    }
    merged
}

/// Collect one source's scope table and overlay its root values plus its
/// descriptors onto the file's graph entry, skipping mutated names.
fn overlay_one_file(
    graph: &mut ProjectGraph,
    merged: &LocalConstants,
    path: &str,
    content: &str,
) {
    let allocator = Allocator::default();
    let source_type = SourceType::from_path(std::path::Path::new(path))
        .unwrap_or_default()
        .with_typescript(true);
    let ret = Parser::new(&allocator, content, source_type).parse();
    if ret.panicked {
        return;
    }
    let table = scope::collect(&ret.program, merged);
    let key = normalize_key(path);
    let Some(values) = graph.files.get_mut(&key) else {
        return;
    };
    overlay_root_values(values, &table);
    overlay_descriptors(values, &table);
}

/// Replace one file's top-level bag values with scope-resolved ones.
/// A name the origin file mutated keeps its dropped bag state.
fn overlay_root_values(values: &mut FileValues, table: &ScopeTable) {
    for (name, init) in table.root_values() {
        if values.bag.mutation(&name).is_none() {
            apply_root_value(values, name, init);
        }
    }
}

/// Apply one scope-resolved root value to its bag slot.
fn apply_root_value(values: &mut FileValues, name: String, init: BindingInit) {
    match init {
        BindingInit::Scalars(leaves) => values.bag.set_scalars(name, leaves),
        BindingInit::Object(map) => values.bag.set_object(name, map),
        BindingInit::Array(elements) => values.bag.set_array(name, elements),
        BindingInit::PureFn(_) => {}
    }
}

/// Store one file's root descriptors beside its bag (SPEC-V2-57).
/// A callee the origin file reassigned stays out, like any stale init.
fn overlay_descriptors(values: &mut FileValues, table: &ScopeTable) {
    for (name, func) in table.root_pure_fns() {
        if values.bag.mutation(&name).is_some() {
            continue;
        }
        values.pure_fns.insert(name, func);
    }
}
