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

/// One compiled compound variant mapping its selection predicate to a class name.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeCompoundRecord {
    pub selection: IndexMap<String, String>,
    pub class_name: String,
}

/// Runtime recipe table carrying the inputs a `recipe()` call resolves from.
///
/// Ships derivation inputs only: the qualified stem, per-axis value-name
/// lists, defaults, and compounds. The runtime derives `base`
/// (`{stem}__base`) and every value class
/// (`{stem}_{axis[0]}_{value}`, first-char axis prefix) exactly, so the
/// wire omits them; the width breakpoint list rides hoisted on the
/// artifact instead of per table. `class_name`, `base`, and the full
/// class strings stay in memory as the canonical derivation
/// (unit-tested); Deserialize still reads the pre-reshape JSON, but only
/// the serializer's view ships.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeRuntimeTable {
    pub qualified_name: String,
    #[serde(skip_serializing)]
    pub class_name: String,
    #[serde(skip_serializing)]
    pub base: String,
    pub variant_keys: Vec<String>,
    #[serde(serialize_with = "serialize_variant_values")]
    pub variant_map: IndexMap<String, IndexMap<String, String>>,
    pub default_variants: IndexMap<String, String>,
    pub compound_variants: Vec<RecipeCompoundRecord>,
    #[serde(skip_serializing, default)]
    pub combinations: IndexMap<String, String>,
    #[serde(skip_serializing, default)]
    pub responsive_variant_map: IndexMap<String, IndexMap<String, IndexMap<String, String>>>,
    #[serde(skip_serializing, default)]
    pub responsive_breakpoints: Vec<String>,
}

/// Serialize the variant map as per-axis value-name lists: the class
/// strings are a pure function of stem + axis + value, so the wire
/// carries the names only and the runtime re-derives each class.
fn serialize_variant_values<S>(
    map: &IndexMap<String, IndexMap<String, String>>,
    serializer: S,
) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    use serde::ser::SerializeMap;
    let mut out = serializer.serialize_map(Some(map.len()))?;
    for (axis, values) in map {
        let names: Vec<&str> = values.keys().map(String::as_str).collect();
        out.serialize_entry(axis, &names)?;
    }
    out.end()
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
/// Excludes primitive metadata keys `variant` and `colorMode`.
pub fn get_style_prop_names() -> Vec<String> {
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
