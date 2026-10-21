//! Closed `recipe()` compilation, readable class names, and runtime tables.
//! Extracts and lowers component variant matrices into scoped `@layer recipes` rules.
//! Constructs authoritative RecipeRuntimeTable entries addressing pre-composed combinations.
//! Preserves strict layer isolation preventing recipe atoms from polluting utility want sets.

pub mod name;
mod rules;
mod spec;
mod table;
mod variants;

#[cfg(test)]
mod tests;

use indexmap::IndexMap;

use self::rules::push_rule;
use self::variants::{
    compile_compounds, compile_responsive_variants, compile_variants, compound_names,
    variant_class_map, ResponsiveFilter,
};
use crate::atom::{Atom, Want};
use crate::diagnostics::DiagnosticLocation;
use crate::extract::recipes::selection::SelectionIndex;
use crate::resolve::ResolveSession;
use crate::runtime::RecipeRuntimeTable;

pub use crate::runtime::RecipeRuntimeTable as RecipeTable;
pub use crate::runtime::{RecipeCompoundRecord, RecipeCompoundRecord as RecipeMatch};
pub use spec::from_spec;

/// The slotted `recipe()` call one slot recipe lowers from (a recipe slot, not a cascade slot).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeSlot {
    /// Authored `className` of the slotted recipe, such as `card`.
    pub recipe: String,
    /// The slot's name from its `slots` list, such as `root`.
    pub name: String,
}

/// Extracted recipe definition. Style wants stay here, never entering utility AtomSet.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Recipe {
    /// Class stem identity: the authored className, or `{className}__{slot}` for a slot recipe.
    pub class_name: String,
    /// Set when this recipe is one slot of a slotted `recipe()` call.
    pub slot: Option<RecipeSlot>,
    pub base: Vec<Want>,
    pub variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    pub default_variants: IndexMap<String, String>,
    pub compounds: Vec<RecipeCompound>,
    /// Source call site for refusal diagnostics. Empty for spec-owned recipes.
    pub location: DiagnosticLocation,
}

impl Recipe {
    /// The authored className call-site selections key on: the slotted call's for a slot recipe.
    pub fn selection_name(&self) -> &str {
        match &self.slot {
            Some(slot) => &slot.recipe,
            None => &self.class_name,
        }
    }
}

/// One compound variant definition matching variant predicates to style wants.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeCompound {
    pub predicates: IndexMap<String, Vec<String>>,
    pub wants: Vec<Want>,
}

/// One compiled compound variant with its resolved class name.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledCompound {
    pub predicates: IndexMap<String, Vec<String>>,
    pub class_name: String,
}

/// Resolved recipe ready to print and serialize as a runtime table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRecipe {
    pub table: RecipeRuntimeTable,
    pub rules: Vec<RecipeRule>,
}

/// One closed class and the atoms that fill its declaration block.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeRule {
    pub class_name: String,
    pub atoms: Vec<Atom>,
}

/// Resolve every recipe into closed classes and a RecipeRuntimeTable.
/// Selections gate responsive rules per recipe; tables always build whole.
pub(crate) fn compile(
    recipes: &[Recipe],
    system_name: &str,
    session: &mut ResolveSession<'_, '_>,
    selections: &SelectionIndex,
) -> Vec<CompiledRecipe> {
    recipes
        .iter()
        .map(|recipe| compile_one(recipe, system_name, session, selections))
        .collect()
}

fn compile_one(
    recipe: &Recipe,
    system_name: &str,
    session: &mut ResolveSession<'_, '_>,
    selections: &SelectionIndex,
) -> CompiledRecipe {
    let qualified_name = name::qualified_stem(system_name, &recipe.class_name);
    let base_class = name::base_class(&qualified_name);
    let mut rules = Vec::new();

    // Open and dynamic recipes print the full matrix; observed recipes print
    // plain rules plus exactly the observed responsive triples; unobserved
    // recipes print nothing while their runtime table still builds below.
    let (variant_map, compounds) =
        match ResponsiveFilter::for_gate(&qualified_name, selections.get(recipe.selection_name())) {
            None => (
                variant_class_map(&qualified_name, &recipe.variants),
                compound_names(&qualified_name, &recipe.compounds),
            ),
            Some(filter) => {
                push_rule(&mut rules, &base_class, &recipe.base, session);
                let variant_map =
                    compile_variants(&mut rules, &qualified_name, &recipe.variants, session);
                let compounds =
                    compile_compounds(&mut rules, &qualified_name, &recipe.compounds, session);
                compile_responsive_variants(&mut rules, &recipe.variants, session, &filter);
                (variant_map, compounds)
            }
        };

    let input = table::RecipeTableInput {
        qualified_name: &qualified_name,
        class_name: &recipe.class_name,
        variant_map: &variant_map,
        default_variants: &recipe.default_variants,
        compounds: &compounds,
        breakpoints: session.system.breakpoints(),
    };

    CompiledRecipe {
        table: table::build_shipped(&input),
        rules,
    }
}
