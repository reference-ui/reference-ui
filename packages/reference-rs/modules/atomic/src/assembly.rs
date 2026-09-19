//! Assembly of the compile's filled sinks into the artifact bundle.
//! Takes the wants, recipes, diagnostics, and authored declarations that
//! extraction filled, appends static CSS, then builds the atom set, runtime
//! plans, stylesheets, and runtime map. The portable build re-walks the same
//! fragments into its own diagnostic sink so global warnings surface once.

use crate::{
    build_atom_set, build_css_runtime, compile_recipes, recipes, resolve, runtime, static_css,
    stylesheet, BaseSystem, CompileResult, Diagnostic, NativeRuntimeArtifact,
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
    pub(crate) fn finish(self, system: &BaseSystem) -> CompileResult {
        let Self {
            wants,
            extracted_recipes,
            mut diagnostics,
            authored,
            traced,
        } = self;
        let mut atom_set = build_atom_set(&wants, system, &mut diagnostics);
        resolve::conditions::check_container_root(system, &atom_set, &mut diagnostics);
        let compiled_recipes = compile_recipes(&extracted_recipes, system, &mut diagnostics);
        let mut plan_builder =
            runtime::PlanBuilder::new(&system.name, system, &mut atom_set, &mut diagnostics);
        let style_plans = plan_builder.build(&authored);
        let runtime_recipes = runtime::build_recipe_runtime_tables(&compiled_recipes);
        let runtime = NativeRuntimeArtifact {
            schema_version: 1,
            style_plans,
            recipes: runtime_recipes,
            style_prop_names: runtime::get_style_prop_names(),
        };

        let atom_count = atom_set.len();
        let css = build_css_runtime(&atom_set, &system.name);
        let stylesheet = stylesheet::build_stylesheet_with(
            &atom_set,
            system,
            &compiled_recipes,
            &mut diagnostics,
        );
        // Portable build re-walks the same fragments; its diagnostics sink here
        // so global warnings surface once from the primary build above.
        let mut portable_sink = Vec::new();
        let portable_stylesheet = stylesheet::build_portable_stylesheet_with(
            &atom_set,
            system,
            &compiled_recipes,
            &mut portable_sink,
        );
        let recipe_tables = compiled_recipes
            .into_iter()
            .map(|recipe| recipe.table)
            .collect();

        CompileResult {
            stylesheet,
            portable_stylesheet,
            runtime,
            css: Some(css),
            diagnostics,
            wants,
            recipes: recipe_tables,
            atom_count,
            traced_jsx_hosts: traced,
        }
    }
}
