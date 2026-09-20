//! Public request and result types for the atomic compiler.
//!
//! `CompileRequest` carries the sources, system, and options for one compile;
//! `CompileResult` bundles the stylesheets, runtime artifact, surfaced plans,
//! and diagnostics. Both cross the N-API boundary as JSON, so every field
//! serde-renames to camelCase and defaults additively.

use base_system::BaseSystem;
use serde::{Deserialize, Serialize};

use crate::atom::Want;
use crate::diagnostics::Diagnostic;
use crate::recipes::RecipeTable;
use crate::runtime::{CssRuntime, NativeRuntimeArtifact, RuntimeStylePlan};

/// In-memory source file to compile.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VirtualSource {
    pub path: String,
    pub content: String,
}

/// Request to compile project or virtual sources into atomic CSS.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileRequest {
    #[serde(default, alias = "root_dir")]
    pub root_dir: Option<String>,
    #[serde(default)]
    pub files: Option<Vec<VirtualSource>>,
    pub base_system: BaseSystem,
    #[serde(default)]
    pub jsx_hosts: Option<Vec<String>>,
    #[serde(default)]
    pub declaration_root: Option<String>,
    /// Glob scope (RS-10): only matching sources compile; absent or empty scans all.
    #[serde(default)]
    pub include: Option<Vec<String>>,
    /// Opt-in diagnostic channels (S5 backchannel): `compiler` renders
    /// `compiler_diagnostics`. Unknown channels are ignored.
    #[serde(default)]
    pub logs: Option<Vec<String>>,
    /// TEMPORARY passthrough (deleted next slice): absent or true keeps the
    /// per-atom `stylePlans` rows in `runtime`; false ships schema 2 bare.
    #[serde(default)]
    pub style_plans_passthrough: Option<bool>,
}

impl CompileRequest {
    /// True when the artifact keeps the temporary per-atom rows.
    pub fn keeps_style_plans(&self) -> bool {
        self.style_plans_passthrough.unwrap_or(true)
    }

    /// True when the caller requested the opt-in compiler backchannel.
    /// Unknown channel names are ignored so channels evolve additively.
    pub fn wants_compiler_logs(&self) -> bool {
        self.logs
            .as_ref()
            .is_some_and(|logs| logs.iter().any(|name| name == "compiler"))
    }
}

/// Compilation artifact bundle containing stylesheet, runtime metadata, and diagnostics.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub stylesheet: String,
    #[serde(default)]
    pub portable_stylesheet: String,
    pub runtime: NativeRuntimeArtifact,
    /// Compile-internal plans: the same rows the artifact carries, surfaced
    /// for proof, stations, and the differential gate. Stays when the
    /// artifact copy ships no more per-atom rows.
    pub style_plans: Vec<RuntimeStylePlan>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub css: Option<CssRuntime>,
    pub diagnostics: Vec<Diagnostic>,
    #[serde(default)]
    pub wants: Vec<Want>,
    #[serde(default)]
    pub recipes: Vec<RecipeTable>,
    #[serde(default)]
    pub atom_count: usize,
    /// Component names StyleTrace discovered in this compile (sorted,
    /// unique). Neo publishes configured ∪ traced downstream.
    #[serde(default)]
    pub traced_jsx_hosts: Vec<String>,
    /// Opt-in compiler backchannel (S5): present only when requested.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compiler_diagnostics: Option<Vec<Diagnostic>>,
}
