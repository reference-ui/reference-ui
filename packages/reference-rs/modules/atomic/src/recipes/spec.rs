//! Lowering of evaluated-spec theme recipes into closed recipe IR.
//! The spec carries one `RecipeDefinition` per explicit `className` key (Core
//! assembles and validates the `className === key` contract); this pass turns
//! those string style maps into `Want` IR so spec recipes compile through the
//! same qualified tables, cartesian combinations, and `@layer recipes` rules
//! as TSX `recipe()` calls. Empty keys are refused with a diagnostic.

use indexmap::IndexMap;

use base_system::{CompoundVariant, RecipeDefinition, StyleMap};

use super::{Recipe, RecipeCompound};
use crate::atom::{AtomValue, Want};
use crate::diagnostics::Diagnostic;
use crate::extract::expressions::literal::split_important_flag;

/// Lower every spec recipe into `Recipe` IR keyed by its explicit className.
pub fn from_spec(
    recipes: &IndexMap<String, RecipeDefinition>,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Recipe> {
    let mut out = Vec::with_capacity(recipes.len());
    for (name, definition) in recipes {
        if name.is_empty() {
            diagnostics.push(Diagnostic::error(
                "spec recipe requires a non-empty className key",
            ));
            continue;
        }
        out.push(from_definition(name, definition));
    }
    out
}

fn from_definition(name: &str, definition: &RecipeDefinition) -> Recipe {
    Recipe {
        class_name: name.to_string(),
        base: style_map_to_wants(&definition.base),
        variants: variants_to_wants(&definition.variants),
        default_variants: definition.default_variants.clone(),
        compounds: compounds_to_ir(&definition.compound_variants),
    }
}

fn style_map_to_wants(map: &StyleMap) -> Vec<Want> {
    map.iter()
        .map(|(prop, value)| {
            let (clean, important) = split_important_flag(value);
            Want::new(prop.as_str(), AtomValue::String(clean.into()))
                .with_important(important)
        })
        .collect()
}

fn variants_to_wants(
    variants: &IndexMap<String, IndexMap<String, StyleMap>>,
) -> IndexMap<String, IndexMap<String, Vec<Want>>> {
    variants
        .iter()
        .map(|(axis, options)| {
            let items = options
                .iter()
                .map(|(value, styles)| (value.clone(), style_map_to_wants(styles)))
                .collect();
            (axis.clone(), items)
        })
        .collect()
}

fn compounds_to_ir(compounds: &[CompoundVariant]) -> Vec<RecipeCompound> {
    compounds.iter().filter_map(compound_to_ir).collect()
}

fn compound_to_ir(compound: &CompoundVariant) -> Option<RecipeCompound> {
    let wants = style_map_to_wants(&compound.css);
    if wants.is_empty() || compound.when.is_empty() {
        return None;
    }
    let mut predicates = IndexMap::with_capacity(compound.when.len());
    for (axis, selection) in &compound.when {
        predicates.insert(axis.clone(), vec![selection.clone()]);
    }
    Some(RecipeCompound { predicates, wants })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn style_map(pairs: &[(&str, &str)]) -> StyleMap {
        pairs
            .iter()
            .map(|(prop, value)| ((*prop).to_string(), (*value).to_string()))
            .collect()
    }

    fn button_definition() -> RecipeDefinition {
        let mut variants = IndexMap::new();
        let mut variant_axis = IndexMap::new();
        variant_axis.insert(
            "solid".to_string(),
            style_map(&[("backgroundColor", "blue.500")]),
        );
        variant_axis.insert(
            "outline".to_string(),
            style_map(&[("borderWidth", "1px")]),
        );
        variants.insert("variant".to_string(), variant_axis);
        let mut defaults = IndexMap::new();
        defaults.insert("variant".to_string(), "solid".to_string());
        let mut when = IndexMap::new();
        when.insert("variant".to_string(), "solid".to_string());
        RecipeDefinition {
            base: style_map(&[("display", "inline-flex")]),
            variants,
            default_variants: defaults,
            compound_variants: vec![CompoundVariant {
                css: style_map(&[("fontWeight", "700")]),
                when,
            }],
        }
    }

    #[test]
    fn spec_key_becomes_explicit_class_name() {
        let mut recipes = IndexMap::new();
        recipes.insert("button".to_string(), button_definition());
        let lowered = from_spec(&recipes, &mut Vec::new());
        assert_eq!(lowered.len(), 1);
        let recipe = &lowered[0];
        assert_eq!(recipe.class_name, "button");
        assert_eq!(recipe.base.len(), 1);
        assert_eq!(recipe.base[0].prop.as_ref(), "display");
        assert_eq!(
            recipe.default_variants.get("variant").map(String::as_str),
            Some("solid")
        );
        let solid = &recipe.variants["variant"]["solid"];
        assert_eq!(solid.len(), 1);
        assert_eq!(solid[0].prop.as_ref(), "backgroundColor");
        assert_eq!(recipe.compounds.len(), 1);
        assert_eq!(
            recipe.compounds[0].predicates.get("variant"),
            Some(&vec!["solid".to_string()])
        );
    }

    #[test]
    fn important_suffix_marks_want() {
        let mut recipes = IndexMap::new();
        recipes.insert(
            "button".to_string(),
            RecipeDefinition {
                base: style_map(&[("display", "inline-flex!")]),
                ..RecipeDefinition::default()
            },
        );
        let lowered = from_spec(&recipes, &mut Vec::new());
        assert!(lowered[0].base[0].important);
        assert_eq!(
            lowered[0].base[0].value,
            AtomValue::String("inline-flex".into())
        );
    }

    #[test]
    fn empty_compounds_are_skipped() {
        let mut when = IndexMap::new();
        when.insert("variant".to_string(), "solid".to_string());
        let definition = RecipeDefinition {
            compound_variants: vec![
                CompoundVariant {
                    css: StyleMap::new(),
                    when: when.clone(),
                },
                CompoundVariant {
                    css: style_map(&[("fontWeight", "700")]),
                    when: IndexMap::new(),
                },
            ],
            ..RecipeDefinition::default()
        };
        let mut recipes = IndexMap::new();
        recipes.insert("button".to_string(), definition);
        let lowered = from_spec(&recipes, &mut Vec::new());
        assert!(lowered[0].compounds.is_empty());
    }

    #[test]
    fn empty_key_is_refused_with_diagnostic() {
        let mut recipes = IndexMap::new();
        recipes.insert(String::new(), button_definition());
        let mut diagnostics = Vec::new();
        let lowered = from_spec(&recipes, &mut diagnostics);
        assert!(lowered.is_empty());
        assert_eq!(diagnostics.len(), 1);
        assert!(diagnostics[0].message.contains("non-empty className"));
    }

    #[test]
    fn empty_spec_yields_no_recipes() {
        let lowered = from_spec(&IndexMap::new(), &mut Vec::new());
        assert!(lowered.is_empty());
    }
}
