//! Public request and result types for the atomic compiler.
//!
//! `CompileRequest` carries the sources, system, and options for one compile;
//! `CompileResult` bundles the stylesheets, runtime artifact, surfaced plans,
//! and diagnostics. Both cross the N-API boundary as JSON, so every field
//! serde-renames to camelCase and defaults additively.

use std::collections::BTreeMap;

use base_system::BaseSystem;
use serde::{Deserialize, Serialize};

use crate::atom::Want;
use crate::diagnostics::Diagnostic;
use crate::recipes::RecipeTable;
use crate::runtime::{CssRuntime, NativeRuntimeArtifact, RuntimeStylePlan};
use crate::stylesheet::StylesheetStreams;

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
    /// Native retention ref (C3-in-reverse): exactly-one-of with `files`.
    /// `compile` drains the retained bytes (moves, never clones), then runs
    /// the unchanged union backfill walk. Neither means the legacy disk scan;
    /// both is a schema rejection; unknown or drained tokens fail loud, never
    /// a silent disk fallback. Resolved by `sources::collect_checked` only.
    #[serde(default, alias = "retention_token")]
    pub retention_token: Option<u64>,
    pub base_system: BaseSystem,
    /// True when an extends/layers upstream's published global CSS already
    /// establishes a container root (`:root`/`html`/`body` carrying
    /// `container-type`/`container`). Upstream global CSS ships via the
    /// streams merge, invisible to this compile, so the container-root
    /// check trusts this signal and stays silent. Absent means standalone:
    /// the check reads local global CSS only.
    #[serde(default, alias = "upstream_container_root")]
    pub upstream_container_root: bool,
    /// Names of the upstream systems this compile consumes (extends/layers),
    /// in authored order. Empty means standalone. The compiler builds the
    /// qualifier list as `[own, …deduped-minus-own]` from these names;
    /// absent from the wire when empty so the standalone request stays
    /// byte-identical. No alias: the struct-level camelCase yields
    /// `upstreamSystems`.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub upstream_systems: Vec<String>,
    /// Component names each extended upstream system publishes, keyed by
    /// system name. They are never own hosts: an upstream's component
    /// renders through that package's runtime. A name here leaves the
    /// `jsx_hosts` roster, so only an own import or this compile's trace
    /// admits a tag that spells it. Absent from the wire when empty.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub upstream_hosts: BTreeMap<String, Vec<String>>,
    /// The own host roster: the generated primitives plus configured names.
    #[serde(default)]
    pub jsx_hosts: Option<Vec<String>>,
    #[serde(default)]
    pub declaration_root: Option<String>,
    /// Glob scope: only matching sources compile; absent or empty scans all.
    #[serde(default)]
    pub include: Option<Vec<String>>,
    /// Opt-in diagnostic channels (backchannel): `compiler` renders
    /// `compiler_diagnostics`. Unknown channels are ignored.
    #[serde(default)]
    pub logs: Option<Vec<String>>,
}

impl CompileRequest {
    /// True when the caller requested the opt-in compiler backchannel.
    /// Unknown channel names are ignored so channels evolve additively.
    pub fn wants_compiler_logs(&self) -> bool {
        self.logs
            .as_ref()
            .is_some_and(|logs| logs.iter().any(|name| name == "compiler"))
    }

    /// True when the caller requested the proof backchannel: `logs`
    /// containing `proof` materializes the compile-internal rows the slim
    /// default omits. Unknown channel names are ignored.
    pub fn wants_proof(&self) -> bool {
        self.logs
            .as_ref()
            .is_some_and(|logs| logs.iter().any(|name| name == "proof"))
    }
}

/// Compilation artifact bundle containing stylesheet, runtime metadata, and diagnostics.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompileResult {
    pub stylesheet: String,
    #[serde(default)]
    pub portable_stylesheet: String,
    /// The own system's per-layer streams (oracle channel): the 10-key
    /// object with both token variants, shipped verbatim next to the joined
    /// sheets. Required on schema 2; fail-closed artifacts carry preamble-only.
    pub streams: StylesheetStreams,
    pub runtime: NativeRuntimeArtifact,
    /// Compile-internal plans: the compiler rows, surfaced for proof,
    /// cases, and the differential gate. The artifact carries no
    /// per-atom rows.
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
    /// unique). Core publishes configured ∪ traced downstream.
    #[serde(default)]
    pub traced_jsx_hosts: Vec<String>,
    /// Prop names each component keeps for itself (never forwarded to a
    /// style primitive), keyed by component name and sorted, unique: the
    /// map the extraction gate read, so the request's `jsxOwned` seeds ride
    /// beside what StyleTrace found. Absent from the wire when empty, so
    /// results without owned props stay byte-identical. Core publishes it
    /// beside the host roster.
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub traced_jsx_owned: BTreeMap<String, Vec<String>>,
    /// Opt-in compiler backchannel: present only when requested.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub compiler_diagnostics: Option<Vec<Diagnostic>>,
}
