//! Assembly of the compile's filled sinks into the artifact bundle.
//! Takes the wants, recipes, diagnostics, and authored declarations that
//! extraction filled, appends static CSS, then builds the atom set, runtime
//! plans, stylesheets, and runtime map. The portable sheet shares the printed
//! suffix and sinks its own system-layer diagnostics so warnings surface once.

use std::collections::HashSet;

use crate::{
    atom::{AtomSet, When},
    diagnostics::DiagnosticsSession,
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
        } = self;
        let mut atom_set = build_atom_set(&wants, system, &mut diagnostics, Some(&mut *sink));
        resolve::conditions::check_container_root(
            system,
            &atom_set,
            &mut diagnostics,
            Some(&mut *sink),
        );
        let compiled_recipes = compile_recipes(
            &extracted_recipes,
            system,
            &mut diagnostics,
            Some(&mut *sink),
        );
        let mut plan_builder =
            runtime::PlanBuilder::new(&system.name, system, &mut atom_set, &mut diagnostics);
        let style_plans = plan_builder.build(&authored);
        let runtime_recipes = runtime::build_recipe_runtime_tables(&compiled_recipes);
        let runtime = NativeRuntimeArtifact {
            schema_version: 2,
            namer: runtime::NamerTables::for_system(system),
            recipes: runtime_recipes,
            style_prop_names: runtime::get_style_prop_names(),
        };

        let atom_count = atom_set.len();
        let css = build_css_runtime(&atom_set, &system.name);
        // Dual-sheet build shares one recipes+utilities suffix; the portable
        // diagnostics sink here so global warnings surface once, as before.
        let mut portable_sink = Vec::new();
        let (stylesheet, portable_stylesheet) = stylesheet::build_stylesheets_with(
            &atom_set,
            system,
            &compiled_recipes,
            stylesheet::StylesheetSinks {
                primary: &mut diagnostics,
                portable: &mut portable_sink,
            },
        );
        let recipe_tables = compiled_recipes
            .into_iter()
            .map(|recipe| recipe.table)
            .collect();

        // Final-plan proof (S4): join the session's analysis expectations
        // against the emitted plans and render the verdicts in place.
        crate::diagnostics::proof::render::render_session(
            sink.facts(),
            &style_plans,
            &system.name,
            &mut diagnostics,
        );

        CompileResult {
            stylesheet,
            portable_stylesheet,
            runtime,
            style_plans,
            css: Some(css),
            diagnostics,
            wants,
            recipes: recipe_tables,
            atom_count,
            traced_jsx_hosts: traced,
            compiler_diagnostics: None,
        }
    }
}

/// Resolve every want into the compile's atom set, reporting resolve facts.
fn build_atom_set(
    wants: &[crate::atom::Want],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: Option<&mut DiagnosticsSession>,
) -> AtomSet {
    let mut atom_set = AtomSet::new();
    let mut session = resolve::ResolveSession {
        system,
        diagnostics,
        location: DiagnosticLocation::default(),
        sink,
        want: None,
    };
    for want in wants {
        for atom in resolve::resolve_want_with(want, &mut session) {
            atom_set.insert(atom);
        }
    }
    atom_set
}

/// Deduplicate spec and extracted recipes, then compile them to rules.
fn compile_recipes(
    extracted: &[recipes::Recipe],
    system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
    sink: Option<&mut DiagnosticsSession>,
) -> Vec<recipes::CompiledRecipe> {
    let spec_recipes = recipes::from_spec(&system.recipes, diagnostics);
    let mut seen = HashSet::new();
    let mut valid = Vec::new();
    for recipe in spec_recipes.iter().chain(extracted.iter()) {
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
    recipes::compile(&valid, &system.name, &mut session)
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
