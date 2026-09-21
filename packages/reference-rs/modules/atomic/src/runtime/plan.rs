//! Authored-declaration runtime style plans and public runtime artifact contracts.
//! Defines data models for browser-facing style plans, cascade slots, and recipe tables.
//! Replaces legacy class-name dictionaries with structured plans for slot-based merge.
//! Delivers canonical style property name inventories excluding variant and colorMode.

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use super::tables::NamerTables;

/// Cascade slot and compiled class name for one lowered atomic declaration.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeDeclaration {
    pub slot: String,
    pub class_name: String,
}

/// Browser-facing plan describing how an authored style declaration expands and resolves.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStylePlan {
    pub system: String,
    pub when: Vec<String>,
    pub prop: String,
    pub value: serde_json::Value,
    pub important: bool,
    pub declarations: Vec<RuntimeDeclaration>,
}

/// One compiled compound variant: unexpanded axis predicates plus its closed class.
/// The wire ships the predicates only; the runtime derives the class with the
/// same spelling as `compound_class` (a lone `["true"]` collapses to the axis
/// key). The class stays in memory as the canonical derivation (unit-tested).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeCompoundRecord {
    pub predicates: IndexMap<String, Vec<String>>,
    #[serde(skip_serializing)]
    pub class_name: String,
}

/// Runtime recipe table carrying the inputs a `recipe()` call resolves from.
///
/// Ships derivation inputs only: per-axis value-name lists, defaults as
/// indices into those lists, and unexpanded compound predicates. The
/// runtime derives the stem from the artifact map key, the axis order
/// from the variant map keys, every value class
/// (`{stem}_{axis[0]}_{value}`), every compound class (same spelling as
/// `compound_class`), and every default from its index — so the wire
/// omits stems, keys, classes, and value strings; the width breakpoint
/// list rides hoisted on the artifact instead of per table. The stem,
/// keys, and full class strings stay in memory as the canonical
/// derivation (unit-tested); Deserialize reads that canonical shape,
/// only the serializer's 3-field view ships.
#[derive(Debug, Clone, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeRuntimeTable {
    pub qualified_name: String,
    pub class_name: String,
    pub base: String,
    pub variant_keys: Vec<String>,
    pub variant_map: IndexMap<String, IndexMap<String, String>>,
    pub default_variants: IndexMap<String, String>,
    pub compound_variants: Vec<RecipeCompoundRecord>,
    #[serde(default)]
    pub combinations: IndexMap<String, String>,
    #[serde(default)]
    pub responsive_variant_map: IndexMap<String, IndexMap<String, IndexMap<String, String>>>,
    #[serde(default)]
    pub responsive_breakpoints: Vec<String>,
}

impl Serialize for RecipeRuntimeTable {
    /// Serialize the wire view: value-name lists, index defaults, and
    /// unexpanded predicates. Map orders are authored orders (IndexMap
    /// iteration), so the runtime's `Object.keys` derivation matches the
    /// omitted `variant_keys` exactly. A default whose value is absent
    /// from its axis ships as the value string (same data, no loss).
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("RecipeRuntimeTable", 3)?;
        state.serialize_field("variantMap", &VariantNames(&self.variant_map))?;
        state.serialize_field(
            "defaultVariants",
            &DefaultIndices {
                defaults: &self.default_variants,
                variants: &self.variant_map,
            },
        )?;
        state.serialize_field("compoundVariants", &self.compound_variants)?;
        state.end()
    }
}

/// Per-axis value-name lists in authored order: the class strings are a
/// pure function of stem + axis + value, so the wire carries names only.
struct VariantNames<'a>(&'a IndexMap<String, IndexMap<String, String>>);

impl Serialize for VariantNames<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let mut out = serializer.serialize_map(Some(self.0.len()))?;
        for (axis, values) in self.0 {
            let names: Vec<&str> = values.keys().map(String::as_str).collect();
            out.serialize_entry(axis, &names)?;
        }
        out.end()
    }
}

/// Defaults as indices into their axis value list (authored
/// which-is-default, re-encoded). Unresolvable values ship verbatim.
struct DefaultIndices<'a> {
    defaults: &'a IndexMap<String, String>,
    variants: &'a IndexMap<String, IndexMap<String, String>>,
}

impl Serialize for DefaultIndices<'_> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let mut out = serializer.serialize_map(Some(self.defaults.len()))?;
        for (axis, value) in self.defaults {
            let index = self
                .variants
                .get(axis)
                .and_then(|options| options.keys().position(|name| name == value));
            match index {
                Some(position) => out.serialize_entry(axis, &position)?,
                None => out.serialize_entry(axis, value)?,
            }
        }
        out.end()
    }
}

/// Versioned NativeRuntimeArtifact returned to host build tools and runtime loaders.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeRuntimeArtifact {
    pub schema_version: u32,
    pub namer: NamerTables,
    pub recipes: BTreeMap<String, RecipeRuntimeTable>,
    pub style_prop_names: Vec<String>,
}

impl Serialize for NativeRuntimeArtifact {
    /// Serialize the artifact with the width-breakpoint list hoisted to the
    /// top level: every table carries the identical scale-derived list
    /// (440/440 censused), so the wire ships it once. Derived from the
    /// tables at the boundary so the shared assembly site stays untouched;
    /// empty recipe sets emit an empty list.
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("NativeRuntimeArtifact", 5)?;
        state.serialize_field("schemaVersion", &self.schema_version)?;
        state.serialize_field("namer", &self.namer)?;
        state.serialize_field("recipes", &self.recipes)?;
        state.serialize_field("stylePropNames", &self.style_prop_names)?;
        let breakpoints = self
            .recipes
            .values()
            .next()
            .map(|table| table.responsive_breakpoints.as_slice())
            .unwrap_or(&[]);
        state.serialize_field("responsiveBreakpoints", breakpoints)?;
        state.end()
    }
}

impl Default for NativeRuntimeArtifact {
    fn default() -> Self {
        Self {
            schema_version: 2,
            namer: NamerTables::default(),
            recipes: BTreeMap::new(),
            style_prop_names: get_style_prop_names(),
        }
    }
}

/// Returns the complete canon plus Reference dialect style property names.
/// Excludes primitive metadata keys `variant` and `colorMode`. The set is
/// constant per binary, so it builds once and clones on later calls.
pub fn get_style_prop_names() -> Vec<String> {
    static NAMES: std::sync::OnceLock<Vec<String>> = std::sync::OnceLock::new();
    NAMES.get_or_init(build_style_prop_names).clone()
}

fn build_style_prop_names() -> Vec<String> {
    let mut names = std::collections::BTreeSet::new();
    for prop in canon::CANONICAL_PROPERTIES {
        names.insert(prop.name.to_string());
    }
    for alias in canon::ALIASES {
        names.insert(alias.alias.to_string());
    }
    for &ref_prop in canon::REFERENCE_PROPS {
        if ref_prop != "variant" && ref_prop != "colorMode" {
            names.insert(ref_prop.to_string());
        }
    }
    names.into_iter().collect()
}
