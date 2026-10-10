//! Assembly of the compile's filled sinks into the artifact bundle.
//! Takes the wants, recipes, diagnostics, and authored declarations that
//! extraction filled, appends static CSS, then builds the atom set, runtime
//! plans, stylesheets, and runtime map. Wants partition into own and external
//! sets by the external marker, both resolved with the consumer `BaseSystem`;
//! the proof map stays own-only while the utilities layer emits the own group
//! plus one appended group per foreign qualifier. The portable sheet shares the
//! printed suffix and sinks its own system-layer diagnostics so warnings
//! surface once.

use std::collections::BTreeSet;

use rustc_hash::FxHashSet;

use crate::{
    atom::{AtomSet, When},
    diagnostics::DiagnosticsSession,
    lanes::{Lanes, WorkKind},
    recipes, resolve, runtime, static_css, stylesheet, BaseSystem, CompileResult, Diagnostic,
    DiagnosticCode, DiagnosticLocation, NativeRuntimeArtifact,
};

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
    ) -> CompileResult {
        let Self {
            wants,
            extracted_recipes,
            mut diagnostics,
            authored,
            traced,
            proof,
            selections,
            upstream_container_root,
            upstream_systems,
        } = self;
        let qualifiers = qualifiers_for(&system.name, &upstream_systems);
        let (mut atom_set, mut external_atom_set) =
            build_atom_sets(&wants, system, &mut diagnostics, Some(&mut *sink));
        let root_input = resolve::conditions::ContainerRootInput {
            system,
            atoms: &atom_set,
            upstream_root: upstream_container_root,
        };
        resolve::conditions::check_container_root(&root_input, &mut diagnostics, Some(&mut *sink));
        let compiled_recipes = compile_recipes(
            &RecipeInputs::new(&extracted_recipes, &selections),
            system,
            &mut diagnostics,
            Some(&mut *sink),
        );
        // Plans stay unconditional: the S4 render joins verdicts against
        // them, and the diagnostics sweep killed proof-gating here (the
        // "no compiled style plan" prefix rides render_session output).
        // On `!proof` the diet path carries placeholder declarations (slim
        // drops plans) plus the canonical keys, skipping render's second
        // serialization; proof restores full plans and the legacy join.
        let mut plan_builder = runtime::PlanBuilder::new(
            &system.name,
            system,
            &mut atom_set,
            &mut external_atom_set,
            &qualifiers,
            &mut diagnostics,
        );
        let (style_plans, carried_keys) = build_plans(&mut plan_builder, &authored, proof);
        let runtime_recipes = runtime::build_recipe_runtime_tables(&compiled_recipes);
        let runtime = NativeRuntimeArtifact {
            schema_version: 2,
            namer: runtime::NamerTables::for_system(system),
            recipes: runtime_recipes,
            style_prop_names: runtime::get_style_prop_names(),
        };

        // Own + external atoms both count (G0 D6/§J); the proof css map stays
        // own-only while the sheets group foreign rules per qualifier (T04).
        let atom_count = atom_set.len() + external_atom_set.len();
        let css = proof.then(|| build_css_runtime(&atom_set, &system.name));
        // Dual-sheet build shares one recipes+utilities suffix; the portable
        // diagnostics sink here so global warnings surface once, as before.
        let mut portable_sink = Vec::new();
        let (streams, stylesheet, portable_stylesheet) = stylesheet::build_stylesheets_with(
            &atom_set,
            &external_atom_set,
            &qualifiers,
            system,
            &compiled_recipes,
            stylesheet::StylesheetSinks {
                primary: &mut diagnostics,
                portable: &mut portable_sink,
            },
        );
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

        // Final-plan proof (S4): join the session's analysis expectations
        // against the emitted plans and render the verdicts in place.
        match carried_keys {
            Some(emitted) => crate::diagnostics::proof::render::render_session_with_keys(
                sink.facts(),
                emitted,
                &qualifiers,
                &system.name,
                &mut diagnostics,
            ),
            None => crate::diagnostics::proof::render::render_session(
                sink.facts(),
                &style_plans,
                &qualifiers,
                &system.name,
                &mut diagnostics,
            ),
        };

        CompileResult {
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
            compiler_diagnostics: None,
        }
    }
}

/// Build plans plus the carried emitted-key set. Proof builds full plans
/// and no keys (render re-serializes as today); `!proof` builds diet plans
/// whose carried keys become the render join set, serialization-free.
fn build_plans(
    builder: &mut runtime::PlanBuilder<'_>,
    authored: &[runtime::AuthoredDeclaration],
    proof: bool,
) -> (Vec<runtime::RuntimeStylePlan>, Option<BTreeSet<String>>) {
    if proof {
        (builder.build(authored), None)
    } else {
        let (plans, keys) = builder.build_diet(authored);
        let emitted: BTreeSet<String> = keys.into_iter().collect();
        (plans, Some(emitted))
    }
}

/// Partition wants by the external marker, then resolve each partition into
/// its own atom set with the consumer `BaseSystem`. Every want resolves with
/// the same system; the partition only decides which set an atom lands in.
/// The pooled guard runs per partition, so an empty external partition makes
/// the own decision byte-identical to the pre-partition single-set call.
fn build_atom_sets(
    wants: &[crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    mut sink: Option<&mut DiagnosticsSession>,
) -> (AtomSet, AtomSet) {
    let (own_wants, external_wants): (Vec<&crate::atom::Want>, Vec<&crate::atom::Want>) =
        wants.iter().partition(|want| !want.external);
    let own = build_atom_set(&own_wants, system, diagnostics, sink.as_deref_mut());
    let external = build_atom_set(&external_wants, system, diagnostics, sink.as_deref_mut());
    (own, external)
}

/// Resolve one partition's wants into an atom set, reporting resolve facts.
fn build_atom_set(
    wants: &[&crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    mut sink: Option<&mut DiagnosticsSession>,
) -> AtomSet {
    if let Some(pooled) = build_atom_set_pooled(wants, system, diagnostics, &mut sink) {
        return pooled;
    }
    let mut atom_set = AtomSet::new();
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink,
        want: None,
    };
    for &want in wants {
        for atom in resolve::resolve_want_with(want, &mut session) {
            atom_set.insert(atom);
        }
    }
    atom_set
}

/// Resolve one partition's wants on the tail pool, committing atoms in input
/// order. Returns `None` when the lane guard declines so the caller runs serial.
fn build_atom_set_pooled(
    wants: &[&crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: &mut Option<&mut DiagnosticsSession>,
) -> Option<AtomSet> {
    let guard = Lanes::Auto.guard(WorkKind::TailWants, wants.len())?;
    let mut atom_set = AtomSet::new();
    for item in crate::resolve_pool::resolve_wants(wants, system, &guard) {
        if let Some(slot) = sink.as_deref_mut() {
            slot.extend_facts(item.facts);
        }
        diagnostics.extend(item.diagnostics);
        for atom in item.atoms {
            atom_set.insert(atom);
        }
    }
    Some(atom_set)
}

/// Recipe definitions plus the observed selections gating their emission.
struct RecipeInputs<'a> {
    extracted: &'a [recipes::Recipe],
    selections: &'a [crate::extract::recipes::selection::RecipeSelection],
}

impl<'a> RecipeInputs<'a> {
    fn new(
        extracted: &'a [recipes::Recipe],
        selections: &'a [crate::extract::recipes::selection::RecipeSelection],
    ) -> Self {
        Self {
            extracted,
            selections,
        }
    }
}

/// Deduplicate spec and extracted recipes, then compile them to rules.
/// Selections join by className; spec recipes stay open by construction.
fn compile_recipes(
    inputs: &RecipeInputs<'_>,
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: Option<&mut DiagnosticsSession>,
) -> Vec<recipes::CompiledRecipe> {
    let spec_recipes = recipes::from_spec(&system.recipes, diagnostics);
    let mut seen = FxHashSet::default();
    let mut valid = Vec::new();
    for recipe in spec_recipes.iter().chain(inputs.extracted.iter()) {
        if !seen.insert(&recipe.class_name) {
            diagnostics.push(recipe.location.error(
                DiagnosticCode::DuplicateRecipe,
                format!(
                    "Duplicate recipe className '{}' within system '{}'",
                    recipe.class_name, system.name
                ),
            ));
        } else {
            valid.push(recipe.clone());
        }
    }
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink,
        want: None,
    };
    let index =
        crate::extract::recipes::selection::SelectionIndex::new(inputs.selections, &spec_recipes);
    recipes::compile(&valid, &system.name, &mut session, &index)
}

/// Index the atom set's class names by their runtime lookup shape.
fn build_css_runtime(atom_set: &AtomSet, system: &str) -> runtime::CssRuntime {
    let mut runtime = runtime::CssRuntime::new();
    for atom in atom_set {
        let c_name = stylesheet::name::class_name_with_system(atom, system);
        let val_key = atom.value.class_name_str();
        let key = if atom.conditions.is_empty() {
            format!("{}:{}", atom.prop, val_key)
        } else {
            let conds: Vec<&str> = atom.conditions.iter().map(When::authored).collect();
            format!("{}:{}:{}", conds.join(":"), atom.prop, val_key)
        };
        runtime.insert(key, c_name);
    }
    runtime
}

#[cfg(test)]
mod tests {
    use super::qualifiers_for;
    use crate::diagnostics::DiagnosticCode;
    use crate::{compile, BaseSystem, CompileRequest, VirtualSource};

    #[test]
    fn qualifiers_are_own_first_deduped_and_minus_own() {
        let upstream = vec![
            "@reference-ui/lib".to_string(),
            "bench".to_string(),
            "@reference-ui/lib".to_string(),
            "own".to_string(),
        ];
        assert_eq!(
            qualifiers_for("own", &upstream),
            vec!["own", "@reference-ui/lib", "bench"]
        );
    }

    #[test]
    fn qualifiers_solo_own_when_standalone() {
        assert_eq!(qualifiers_for("own", &[]), vec!["own"]);
    }

    fn compile_props(upstream: Vec<String>) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource {
                path: "test.tsx".into(),
                content: "import { Div } from '@reference-ui/react';\
                          export const a = <Div mt=\"2r\" />;\
                          export const b = <BoltIcon color=\"red\" />;"
                    .into(),
            }]),
            base_system: BaseSystem::lib_fixture().clone(),
            upstream_systems: upstream,
            logs: Some(vec!["proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    fn compile_code(code: &str, upstream: Vec<String>) -> crate::CompileResult {
        let req = CompileRequest {
            files: Some(vec![VirtualSource {
                path: "test.tsx".into(),
                content: code.into(),
            }]),
            base_system: BaseSystem::lib_fixture().clone(),
            upstream_systems: upstream,
            logs: Some(vec!["proof".to_string()]),
            ..Default::default()
        };
        compile(&req).expect("compile succeeds")
    }

    #[test]
    fn external_decl_expands_one_plan_per_foreign_qualifier() {
        let res = compile_props(vec!["@reference-ui/icons".to_string()]);
        // Own declaration keeps exactly one plan on the own system.
        let own: Vec<_> = res.style_plans.iter().filter(|plan| plan.prop == "mt").collect();
        assert_eq!(own.len(), 1, "{:?}", res.style_plans);
        assert_eq!(own[0].system, "@reference-ui/lib");
        // External declaration takes one plan on the foreign qualifier.
        let external: Vec<_> = res
            .style_plans
            .iter()
            .filter(|plan| plan.prop == "color")
            .collect();
        assert_eq!(external.len(), 1, "{:?}", res.style_plans);
        assert_eq!(external[0].system, "@reference-ui/icons");
        assert_eq!(
            external[0].declarations[0].class_name,
            "@reference-ui/icons__c_red"
        );
        // The proof css map stays own-only: the external class is not indexed.
        let css = res.css.expect("proof css map");
        assert_eq!(
            css.classes.get("color:red"),
            None,
            "external atom stays out of the own css map"
        );
        // atom_count counts both partitions.
        assert_eq!(res.atom_count, 2);
    }

    #[test]
    fn external_decl_needs_a_foreign_qualifier_to_plan() {
        let res = compile_props(Vec::new());
        assert!(
            res.style_plans.iter().all(|plan| plan.prop != "color"),
            "no foreign qualifier means no external plan: {:?}",
            res.style_plans
        );
        // The external atom still resolves and counts.
        assert_eq!(res.atom_count, 2);
    }

    /// A covered external expectation is silent: analysis predicts the
    /// foreign-qualified key and the foreign plan backs it, so the S4 join
    /// proves nothing absent.
    #[test]
    fn covered_external_expectation_is_silent() {
        let res = compile_props(vec!["@reference-ui/icons".to_string()]);
        assert!(
            res.diagnostics.is_empty(),
            "covered external key stays silent: {:?}",
            res.diagnostics
        );
        assert!(
            res.style_plans
                .iter()
                .any(|plan| plan.prop == "color" && plan.system == "@reference-ui/icons"),
            "the foreign plan is present: {:?}",
            res.style_plans
        );
    }

    /// A missing external key warns once: the external rejection joins the
    /// foreign-qualified expectation (no double-warn from a causeless miss).
    #[test]
    fn missing_external_key_warns_once() {
        let res = compile_code(
            "import { Div } from '@reference-ui/react';\
             export const el = <BoltIcon _nope={{ color: 'red' }} />;",
            vec!["@reference-ui/icons".to_string()],
        );
        let misses: Vec<_> = res
            .diagnostics
            .iter()
            .filter(|diag| {
                matches!(
                    diag.code,
                    DiagnosticCode::UnknownCondition | DiagnosticCode::MissingStylePlan
                )
            })
            .collect();
        assert_eq!(
            misses.len(),
            1,
            "exactly one miss warning, not a double-warn: {:?}",
            res.diagnostics
        );
        assert_eq!(misses[0].code, DiagnosticCode::UnknownCondition);
    }
}
