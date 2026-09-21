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
/// `combinations` and `responsive_variant_map` stay fully built in memory as
/// the canonical derivation (unit-tested), but are never serialized: both are
/// mechanical re-derivations of `base` + `variant_map` + `compound_variants`,
/// so the bridge and the artifacts ship the inputs only. The runtime composes
/// plain selections from those inputs and derives each responsive class as
/// `{breakpoint}:{variant_map[axis][value]}`, gated on
/// `responsive_breakpoints` (the width breakpoints with matching `@container`
/// rules in `@layer recipes`). `base` selections read `variant_map` directly.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeRuntimeTable {
    pub qualified_name: String,
    pub class_name: String,
    pub base: String,
    pub variant_keys: Vec<String>,
    pub variant_map: IndexMap<String, IndexMap<String, String>>,
    pub default_variants: IndexMap<String, String>,
    pub compound_variants: Vec<RecipeCompoundRecord>,
    #[serde(skip_serializing, default)]
    pub combinations: IndexMap<String, String>,
    #[serde(skip_serializing, default)]
    pub responsive_variant_map: IndexMap<String, IndexMap<String, IndexMap<String, String>>>,
    #[serde(default)]
    pub responsive_breakpoints: Vec<String>,
}

/// Versioned NativeRuntimeArtifact returned to host build tools and runtime loaders.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeRuntimeArtifact {
    pub schema_version: u32,
    pub namer: NamerTables,
    pub recipes: BTreeMap<String, RecipeRuntimeTable>,
    pub style_prop_names: Vec<String>,
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
