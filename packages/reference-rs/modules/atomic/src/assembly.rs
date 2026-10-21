//! Assembly of the compile's filled sinks into the artifact bundle.
//! Takes the wants, recipes, diagnostics, and authored declarations that
//! extraction filled, appends static CSS, then builds the atom set, runtime
//! plans, stylesheets, and runtime map. Wants partition by backing into the own
//! set and the foreign groups each want's backing names, all resolved with the
//! consumer `BaseSystem`; the proof map stays own-only while the utilities layer
//! emits the own group plus one appended group per system the foreign atoms
//! name, and the token layer claims the stamps of every extended qualifier. The
//! portable sheet shares the printed suffix and sinks its own system-layer
//! diagnostics so warnings surface once. A pooled lane that panics in the resolve or plan stage
//! returns as an error from `finish`, so `compile` reports it instead of unwinding.

use std::collections::{BTreeMap, BTreeSet};

use rustc_hash::FxHashSet;

use crate::{
    atom::{AtomSet, When},
    diagnostics::DiagnosticsSession,
    lanes::{Lanes, WorkKind},
    recipes, resolve, runtime, static_css, stylesheet, BaseSystem, CompileResult, Diagnostic,
    DiagnosticCode, DiagnosticLocation, NativeRuntimeArtifact,
};

mod build;
use crate::diagnostics::proof::render::RenderScope;
use build::{build_atom_sets, build_css_runtime, build_plans, compile_recipes, RecipeInputs};

/// The compile's filled sinks, assembled into the artifact bundle.
pub(crate) struct AssembleCtx {
    /// Style wants from extraction, plus static CSS.
    pub(crate) wants: Vec<crate::atom::Want>,
    /// Recipes extracted from sources.
    pub(crate) extracted_recipes: Vec<recipes::Recipe>,
    /// Diagnostics from every phase.
    pub(crate) diagnostics: Vec<Diagnostic>,
    /// Authored declarations for runtime plans.
    pub(crate) authored: Vec<runtime::AuthoredDeclaration>,
    /// Component names StyleTrace discovered (sorted, unique).
    pub(crate) traced: Vec<String>,
    /// Owned prop names per component as the gate read them: the system's
    /// declared seeds unioned with what the trace found.
    pub(crate) owned: BTreeMap<String, BTreeSet<String>>,
    /// True when the proof channel is requested: materialize the
    /// compile-internal rows (plans, css map, wants, top-level tables)
    /// the slim serde drops on the default path.
    pub(crate) proof: bool,
    /// Resolved recipe call-site selections gating responsive emission.
    pub(crate) selections: Vec<crate::extract::recipes::selection::RecipeSelection>,
    /// True when an extends/layers upstream's published global CSS already
    /// roots the page: the container-root check stays silent (Addendum B).
    pub(crate) upstream_container_root: bool,
    /// Upstream system names this compile consumes (extends/layers), in
    /// authored order; empty for standalone. `finish` turns these into the
    /// qualifier list `[own, …deduped-minus-own]`.
    pub(crate) upstream_systems: Vec<String>,
    /// The upstreams among those whose tokens this compile's vocabulary
    /// carries (the extends closure); `finish` keeps the qualified ones.
    pub(crate) extended_systems: Vec<String>,
}

/// Build the composed-system qualifier list: the compiling system first, then
/// each upstream name in request order, deduped and with the compiling system
/// removed. Own-first keeps the standalone path's qualifier `[own]`, so the
/// zero-upstream compile takes the untouched old path.
pub(crate) fn qualifiers_for(own: &str, upstream: &[String]) -> Vec<String> {
    let mut qualifiers = Vec::with_capacity(1 + upstream.len());
    qualifiers.push(own.to_string());
    for name in upstream {
        if name != own && !qualifiers.iter().any(|seen| seen == name) {
            qualifiers.push(name.clone());
        }
    }
    qualifiers
}

/// The extended systems the token layer claims stamps for: the foreign qualifiers
/// the request names as extended, in qualifier order. A name that is not a foreign
/// qualifier (the own system, or an upstream with no streams) is dropped, so a
/// standalone compile never claims a stamp.
pub(crate) fn extended_for(qualifiers: &[String], extended: &[String]) -> Vec<String> {
    qualifiers
        .iter()
        .skip(1)
        .filter(|name| extended.contains(name))
        .cloned()
        .collect()
}

impl AssembleCtx {
    /// Append static CSS wants before the atom set builds.
    pub(crate) fn append_static(&mut self, system: &BaseSystem) {
        let mut static_ctx = static_css::StaticCssContext {
            system,
            wants: &mut self.wants,
            authored: &mut self.authored,
            diagnostics: &mut self.diagnostics,
        };
        static_css::append_static_css(&mut static_ctx);
    }

    /// Build the atom set, plans, sheets, and runtime map into the result.
    pub(crate) fn finish(
        self,
        system: &BaseSystem,
        sink: &mut DiagnosticsSession,
    ) -> Result<CompileResult, String> {
        let Self {
            wants,
            extracted_recipes,
            mut diagnostics,
            authored,
            traced,
            owned,
            proof,
            selections,
            upstream_container_root,
            upstream_systems,
            extended_systems,
        } = self;
        let qualifiers = qualifiers_for(&system.name, &upstream_systems);
        let extended = extended_for(&qualifiers, &extended_systems);
        let scope = FinishScope {
            system,
            qualifiers: &qualifiers,
            extended: &extended,
            proof,
            upstream_container_root,
        };
        let mut atoms = build_atoms(&wants, system, &mut diagnostics, sink)?;
        check_root(&scope, &atoms, &mut diagnostics, sink);
        let compiled_recipes = compile_recipes(
            &RecipeInputs::new(&extracted_recipes, &selections),
            system,
            &mut diagnostics,
            Some(&mut *sink),
        );
        let plans = build_plan_stage(&scope, &mut atoms, &authored, &mut diagnostics)?;
        let runtime = runtime_artifact(system, &compiled_recipes);

        // Own + foreign atoms both count (G0 D6/§J); the proof css map stays
        // own-only while the sheets group foreign rules per backing system (T04).
        let atom_count = atoms.own.len() + atoms.foreign.len();
        let css = proof.then(|| build_css_runtime(&atoms.own, &system.name));
        let (streams, stylesheet, portable_stylesheet) =
            build_sheets(&scope, &atoms, &compiled_recipes, &mut diagnostics);
        // The top-level tables duplicate the shipped runtime map; slim drops
        // them, so the default path drops the second in-memory copy too.
        let recipe_tables: Vec<recipes::RecipeTable> = if proof {
            compiled_recipes
                .into_iter()
                .map(|recipe| recipe.table)
                .collect()
        } else {
            Vec::new()
        };
        let style_plans = plans.render_into(&scope, sink, &mut diagnostics);

        Ok(CompileResult {
            stylesheet,
            portable_stylesheet,
            streams,
            runtime,
            style_plans,
            css,
            diagnostics,
            wants: if proof { wants } else { Vec::new() },
            recipes: recipe_tables,
            atom_count,
            traced_jsx_hosts: traced,
            traced_jsx_owned: crate::hosts::owned_wire(owned),
            compiler_diagnostics: None,
        })
    }
}

/// The borrowed inputs every finish stage reads: the consumer system, the composed
/// qualifier list (token scope and group order) and its extended subset, the proof
/// switch, and whether an upstream already roots the page.
struct FinishScope<'a> {
    system: &'a BaseSystem,
    qualifiers: &'a [String],
    extended: &'a [String],
    proof: bool,
    upstream_container_root: bool,
}

/// The own atom set and the foreign groups one compile builds, kept together for the
/// stages that read both.
struct AtomSets {
    own: AtomSet,
    foreign: crate::atom::ForeignAtoms,
}

/// The plans the authored declarations produce, plus the emitted-key set a diet build
/// carries into the render join.
struct PlanStage {
    style_plans: Vec<runtime::RuntimeStylePlan>,
    carried_keys: Option<BTreeSet<String>>,
}

impl PlanStage {
    /// Join the session's analysis expectations against the emitted plans, then hand
    /// the plans back for the result. Proof renders against the plans themselves; the
    /// diet path renders against the carried keys.
    fn render_into(
        self,
        scope: &FinishScope<'_>,
        sink: &mut DiagnosticsSession,
        diagnostics: &mut Vec<Diagnostic>,
    ) -> Vec<runtime::RuntimeStylePlan> {
        let Self {
            style_plans,
            carried_keys,
        } = self;
        match carried_keys {
            Some(emitted) => crate::diagnostics::proof::render::render_session_with_keys(
                sink.facts(),
                emitted,
                RenderScope::new(&scope.system.name),
                diagnostics,
            ),
            None => crate::diagnostics::proof::render::render_session(
                sink.facts(),
                &style_plans,
                RenderScope::new(&scope.system.name),
                diagnostics,
            ),
        };
        style_plans
    }
}

/// The own set and foreign groups from the filled wants. The resolve facts go to the
/// diagnostics and the sink, in the order the stages always reported them.
fn build_atoms(
    wants: &[crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: &mut DiagnosticsSession,
) -> Result<AtomSets, String> {
    let (own, foreign) = build_atom_sets(wants, system, diagnostics, Some(&mut *sink))?;
    Ok(AtomSets { own, foreign })
}

/// Container-root check over the own group. The upstream signal arrives through the scope.
fn check_root(
    scope: &FinishScope<'_>,
    atoms: &AtomSets,
    diagnostics: &mut Vec<Diagnostic>,
    sink: &mut DiagnosticsSession,
) {
    let root_input = resolve::conditions::ContainerRootInput {
        system: scope.system,
        atoms: &atoms.own,
        upstream_root: scope.upstream_container_root,
    };
    resolve::conditions::check_container_root(&root_input, diagnostics, Some(&mut *sink));
}

/// Build the plans for the authored declarations. The plan builder borrows the own set,
/// the foreign groups and the diagnostics only for its own run, so the sheets read them
/// after it.
/// Plans stay unconditional: the render joins verdicts against them, and the
/// diagnostics sweep killed proof-gating here (the "no compiled style plan" prefix rides
/// render_session output). On `!proof` the diet path carries placeholder declarations
/// (slim drops plans) plus the canonical keys, skipping render's second serialization;
/// proof restores full plans and the legacy join.
fn build_plan_stage(
    scope: &FinishScope<'_>,
    atoms: &mut AtomSets,
    authored: &[runtime::AuthoredDeclaration],
    diagnostics: &mut Vec<Diagnostic>,
) -> Result<PlanStage, String> {
    let mut plan_builder = runtime::PlanBuilder::new(
        &scope.system.name,
        scope.system,
        runtime::PlanSinks {
            atom_set: &mut atoms.own,
            foreign: &mut atoms.foreign,
            diagnostics,
        },
    );
    let (style_plans, carried_keys) = build_plans(&mut plan_builder, authored, scope.proof)?;
    Ok(PlanStage {
        style_plans,
        carried_keys,
    })
}

/// The runtime artifact: recipe tables from the compiled recipes, the namer, and the
/// style prop names.
fn runtime_artifact(
    system: &BaseSystem,
    compiled_recipes: &[recipes::CompiledRecipe],
) -> NativeRuntimeArtifact {
    let runtime_recipes = runtime::build_recipe_runtime_tables(compiled_recipes);
    NativeRuntimeArtifact {
        schema_version: 2,
        namer: runtime::NamerTables::for_system(system),
        recipes: runtime_recipes,
        style_prop_names: runtime::get_style_prop_names(),
    }
}

/// Build the served and portable stylesheets. The portable diagnostics sink here so global
/// warnings surface once, as before.
fn build_sheets(
    scope: &FinishScope<'_>,
    atoms: &AtomSets,
    compiled_recipes: &[recipes::CompiledRecipe],
    diagnostics: &mut Vec<Diagnostic>,
) -> (stylesheet::StylesheetStreams, String, String) {
    let mut portable_sink = Vec::new();
    let input = stylesheet::SheetInput {
        own: &atoms.own,
        foreign: &atoms.foreign,
        qualifiers: scope.qualifiers,
        extended: scope.extended,
        system: scope.system,
        recipes: compiled_recipes,
    };
    stylesheet::build_stylesheets_with(
        &input,
        stylesheet::StylesheetSinks {
            primary: diagnostics,
            portable: &mut portable_sink,
        },
    )
}

#[cfg(test)]
#[path = "assembly_tests.rs"]
mod tests;

#[cfg(test)]
#[path = "assembly_token_scope_tests.rs"]
mod token_scope_tests;
