//! Style extraction orchestrator and AST visitor.
//!
//! Discovers `jsx` tags, `css()` calls, and `recipe()` calls, then hands their
//! expressions to the shared walker. `css()` fills utility wants; `recipe()`
//! fills Recipe IR (`ctx.recipes`) and must not pollute the utility list.
//! `ExtractContext` is the session those passes share. Call extract is
//! import-bound; JSX extract consults styletrace names plus Reference
//! component imports and fails closed when no host is known: an empty host
//! set plus style-bearing JSX is a missing-graph error, never a scan.

pub mod bindings;
pub mod constants;
pub mod context;
pub mod css;
pub mod expressions;
pub mod fold;
pub mod harvest;
pub mod identity;
pub mod identity_map;
pub mod jsx;
pub mod jsx_hosts;
pub mod recipes;
pub mod resolver;
pub mod scope;
pub mod visitor;
pub mod wrapper_thread;
pub(crate) mod suggest;

#[cfg(test)]
mod tests;

use std::collections::BTreeMap;

use oxc_ast::ast::Program;
use oxc_ast_visit::Visit as _;
use rustc_hash::FxHashSet;

use base_system::BreakpointScale;

pub use bindings::{collect_bindings, collect_bindings_with_identity, ExtractBindings};
pub use context::{ExtractConfig, ExtractContext, ExtractSinks};
pub use jsx_hosts::JsxHosts;
pub use visitor::ExtractVisitor;

/// Extract all style wants and diagnostics from a parsed AST program with provided context.
pub fn extract_with_context(program: &Program<'_>, ctx: &mut ExtractContext<'_>) {
    let config = ExtractConfig {
        chain: ctx.chain,
        breakpoints: ctx.breakpoints,
        bindings: ctx.bindings,
        jsx_hosts: ctx.jsx_hosts,
        owned_props: ctx.owned_props,
        shadowed: &[],
    };
    let mut visitor = ExtractVisitor::new(ctx.file, ctx.source, config);
    visitor.wrapper_threads = wrapper_thread::collect(program, ctx.jsx_hosts);
    visitor.visit_program(program);
    ctx.wants.extend(visitor.wants);
    ctx.recipes.extend(visitor.recipes);
    ctx.diagnostics.extend(visitor.diagnostics);
    ctx.authored.extend(visitor.authored);
    ctx.sinks.extend(visitor.sinks);
    ctx.recipe_bindings.extend(visitor.recipe_bindings);
    ctx.tentative.extend(visitor.tentative);
    let facts = visitor.session.take_facts();
    ctx.session.extend_facts(facts);
}

/// Extract all style wants and diagnostics from a parsed AST program.
/// Callers thread the system's breakpoint scale; no fixture is consulted here.
/// Wants carry file-only locations here; `compile()` threads source text for lines.
/// Without a project, the file's own collected constants back the import
/// stub: locals resolve through the chain, cross-file names stay dynamic,
/// and writes in the file poison through the usual mutation check.
pub fn extract(
    program: &Program<'_>,
    file: &str,
    breakpoints: &BreakpointScale,
    sinks: ExtractSinks<'_>,
) {
    let bag = constants::collect_local_constants(program, file, None);
    let table = scope::collect(program, &bag);
    let stub = scope::ImportLookup::ProjectBag(&bag);
    let chain = scope::ScopeChain::new(&table, stub);
    let bindings = collect_bindings(program);
    let no_global = FxHashSet::default();
    let jsx_hosts = JsxHosts {
        local: bindings.jsx_hosts_ref(),
        global: &no_global,
    };
    let owned_props = BTreeMap::new();
    let config = ExtractConfig {
        chain,
        breakpoints,
        bindings: &bindings,
        jsx_hosts,
        owned_props: &owned_props,
        shadowed: &[],
    };
    let mut ctx = ExtractContext::new(file, None, config, sinks);
    extract_with_context(program, &mut ctx);
}
