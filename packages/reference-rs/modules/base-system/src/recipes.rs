//! Static `recipe()` schema for one design-system utterance.
//! Stores base styles, variant axes, default variants, and compound variant condition
//! maps. There is no slot-recipe type: multi-part components are authored React.
//! This crate does not select variants or concatenate class names; atomic and typegen
//! read the tables.

use crate::StyleMap;
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

/// One declared `recipe()`: base, variants, defaults, and compound rules.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeDefinition {
    #[serde(default)]
    pub base: StyleMap,
    #[serde(default)]
    pub variants: IndexMap<String, IndexMap<String, StyleMap>>,
    #[serde(default)]
    pub default_variants: IndexMap<String, String>,
    #[serde(default)]
    pub compound_variants: Vec<CompoundVariant>,
}

/// Compound rule: extra keys are the condition map; `css` is the result map.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct CompoundVariant {
    #[serde(default)]
    pub css: StyleMap,
    #[serde(flatten)]
    pub when: IndexMap<String, String>,
}

impl crate::BaseSystem {
    /// Declared recipe schema for `name`, if present.
    pub fn get_recipe(&self, name: &str) -> Option<&RecipeDefinition> {
        self.recipes.get(name)
    }

    /// Insertion-order walk of recipe name + schema.
    pub fn list_recipes(&self) -> impl Iterator<Item = (&str, &RecipeDefinition)> {
        self.recipes
            .iter()
            .map(|(name, recipe)| (name.as_str(), recipe))
    }
}

#[cfg(test)]
mod tests {
    use crate::BaseSystem;

    const CARD: &str = r#"{
        "recipes":{
            "card":{
                "base":{"p":"4r","rounded":"md"},
                "variants":{"tone":{"quiet":{"bg":"n100"},"loud":{"bg":"n300"}}},
                "defaultVariants":{"tone":"quiet"}
            }
        }
    }"#;

    const CARD_COMPOUND: &str = r#"{
        "recipes":{
            "card":{
                "base":{"p":"4r"},
                "variants":{
                    "tone":{"loud":{"bg":"n300"}},
                    "size":{"lg":{"p":"6r"}}
                },
                "compoundVariants":[{"tone":"loud","size":"lg","css":{"border":"2px solid"}}]
            }
        }
    }"#;

    #[test]
    fn bas_recipe_01_stores_base_variants_and_defaults() {
        let system = BaseSystem::from_json(CARD).unwrap();
        let card = system.get_recipe("card").unwrap();
        assert_eq!(card.base.get("p").map(String::as_str), Some("4r"));
        assert_eq!(card.base.get("rounded").map(String::as_str), Some("md"));
        assert_eq!(
            card.variants["tone"]["quiet"].get("bg").map(String::as_str),
            Some("n100")
        );
        assert_eq!(
            card.variants["tone"]["loud"].get("bg").map(String::as_str),
            Some("n300")
        );
        assert_eq!(
            card.default_variants.get("tone").map(String::as_str),
            Some("quiet")
        );
        assert!(card.compound_variants.is_empty());
    }

    #[test]
    fn bas_recipe_02_preserves_compound_variants() {
        let system = BaseSystem::from_json(CARD_COMPOUND).unwrap();
        let card = system.get_recipe("card").unwrap();
        assert_eq!(card.compound_variants.len(), 1);
        let rule = &card.compound_variants[0];
        assert_eq!(rule.when.get("tone").map(String::as_str), Some("loud"));
        assert_eq!(rule.when.get("size").map(String::as_str), Some("lg"));
        assert_eq!(
            rule.css.get("border").map(String::as_str),
            Some("2px solid")
        );
    }

    #[test]
    fn bas_recipe_03_has_no_slot_recipe_schema() {
        let system = BaseSystem::from_json(
            r#"{"recipes":{"card":{"base":{"p":"4r"},"slots":{"root":{"p":"2"}}}}}"#,
        )
        .unwrap();
        let card = system.get_recipe("card").unwrap();
        assert_eq!(card.base.get("p").map(String::as_str), Some("4r"));
        assert!(card.variants.is_empty());
        assert!(system.get_recipe("slot").is_none());
    }

    #[test]
    fn bas_recipe_04_static_schema_only() {
        let system = BaseSystem::from_json(CARD).unwrap();
        let card = system.get_recipe("card").unwrap();
        assert_eq!(
            card.variants["tone"]["loud"].get("bg").map(String::as_str),
            Some("n300")
        );
        let names: Vec<&str> = system.list_recipes().map(|(name, _)| name).collect();
        assert_eq!(names, ["card"]);
    }

    #[test]
    fn indexed_empty_recipes_deserialize() {
        let system: BaseSystem = serde_json::from_str(r#"{"recipes":{}}"#).unwrap();
        assert!(system.recipes.is_empty());
        assert!(system.get_recipe("card").is_none());
    }
}
