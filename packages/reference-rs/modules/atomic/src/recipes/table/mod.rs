//! Shipped variant lookup table for runtime `recipe()`: the derivation inputs the serializer emits.
//! `build_shipped` carries the variant map, default selections, breakpoint names, and collapsed compound predicates.
//! Compound predicates ship unexpanded (one record per authored compound, exact duplicates collapsed); the runtime derives each closed class.
//! The canonical Cartesian derivation lives in `canonical`, compiled for unit tests only.

use base_system::BreakpointScale;
use indexmap::IndexMap;
use rustc_hash::FxHashSet;

use super::name;
use super::CompiledCompound;
use crate::runtime::{RecipeCompoundRecord, RecipeRuntimeTable};

#[cfg(test)]
mod canonical;
#[cfg(test)]
mod tests;

/// Inputs required to assemble a RecipeRuntimeTable.
pub struct RecipeTableInput<'a> {
    pub qualified_name: &'a str,
    pub class_name: &'a str,
    pub variant_map: &'a IndexMap<String, IndexMap<String, String>>,
    pub default_variants: &'a IndexMap<String, String>,
    pub compounds: &'a [CompiledCompound],
    pub breakpoints: &'a BreakpointScale,
}

/// Assemble the shipped runtime recipe table from compiled variants.
/// Skips the canonical in-memory maps (`combinations`,
/// `responsive_variant_map`) the serializer never emits; unit tests keep
/// `build()` for the full canonical derivation.
pub fn build_shipped(input: &RecipeTableInput<'_>) -> RecipeRuntimeTable {
    let base = name::base_class(input.qualified_name);
    let variant_keys: Vec<String> = input.variant_map.keys().cloned().collect();
    let compound_variants = build_compound_variants(input.compounds);
    let responsive_breakpoints = container_breakpoints(input.breakpoints);

    RecipeRuntimeTable {
        qualified_name: input.qualified_name.to_string(),
        class_name: input.class_name.to_string(),
        base,
        variant_keys,
        variant_map: input.variant_map.clone(),
        default_variants: input.default_variants.clone(),
        compound_variants,
        combinations: IndexMap::new(),
        responsive_variant_map: IndexMap::new(),
        responsive_breakpoints,
    }
}

/// Breakpoint names that emit `@container` rules, in scale order.
///
/// Shared by the runtime map and the rule emitter so every table class has a
/// matching wrapped rule. `base` and widthless names never qualify.
pub fn container_breakpoints(scale: &BreakpointScale) -> Vec<String> {
    scale
        .names()
        .iter()
        .filter(|bp| bp.as_str() != "base" && scale.width_px(bp).is_some())
        .cloned()
        .collect()
}

fn build_compound_variants(compounds: &[CompiledCompound]) -> Vec<RecipeCompoundRecord> {
    let mut out = Vec::new();
    let mut seen = FxHashSet::default();
    for compound in compounds {
        if seen.insert(predicates_key(&compound.predicates)) {
            out.push(RecipeCompoundRecord {
                predicates: compound.predicates.clone(),
                class_name: compound.class_name.clone(),
            });
        }
    }
    out
}

/// Order-sensitive identity for one compound's predicates: same axes in
/// the same order with the same values match identically and derive the
/// same class, so later copies ship nothing new. Reordered predicates
/// derive different classes and are never collapsed.
fn predicates_key(predicates: &IndexMap<String, Vec<String>>) -> String {
    format!("{predicates:?}")
}
