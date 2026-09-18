//! Prebuilt style surfaces and the entry-listed trace over them.
//! A surface names which prop spellings are style props and which imported
//! names are primitives; it is built from disk declarations
//! (`from_declaration_root`) or from the engine (atomic, no file read).
//! Entry-listed tracing parses explicit entries against a surface and
//! returns bindings plus per-file diagnostics, so one unparsable file
//! never fails its siblings. The root-based wrappers keep the historical
//! disk path for the N-API names seam and the round-trip canaries.

use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};

use crate::resolver::{
    collect_reference_style_prop_names, normalize_path, resolve_sync_root, StyleTraceError,
};

use super::analyzer::StyleTraceAnalyzer;
use super::model::{TraceModule, TracedBinding};
use super::parser::parse_trace_module;
use super::primitive_metadata::collect_reference_primitive_jsx_names;
use super::source_files::discover_source_files;

/// Which prop names are style props and which imported names are primitives.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StyleSurface {
    pub style_props: BTreeSet<String>,
    pub primitives: BTreeSet<String>,
    trust_style_props_name: bool,
}

impl StyleSurface {
    pub fn new(style_props: BTreeSet<String>, primitives: BTreeSet<String>) -> Self {
        Self {
            style_props,
            primitives,
            trust_style_props_name: false,
        }
    }

    /// Mark the surface engine-built: a `StyleProps` type reference the
    /// declaration graph cannot resolve denotes this surface instead of
    /// failing. Disk surfaces keep graph resolution.
    pub fn trust_style_props_name(mut self) -> Self {
        self.trust_style_props_name = true;
        self
    }

    pub(crate) fn trusts_style_props_name(&self) -> bool {
        self.trust_style_props_name
    }

    /// Build the surface from a declaration root (disk path).
    pub fn from_declaration_root(root: &Path) -> Result<Self, StyleTraceError> {
        let style_props = collect_reference_style_prop_names(root)?
            .into_iter()
            .collect::<BTreeSet<_>>();
        let primitives = collect_reference_primitive_jsx_names(root)?;
        Ok(Self::new(style_props, primitives))
    }
}

/// One skipped file or trace-level note; the caller renders it as a warning.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TraceDiagnostic {
    pub file: Option<PathBuf>,
    pub message: String,
}

impl TraceDiagnostic {
    pub fn new(message: String) -> Self {
        Self {
            file: None,
            message,
        }
    }

    pub fn for_file(file: PathBuf, message: String) -> Self {
        Self {
            file: Some(file),
            message,
        }
    }
}

/// Bindings plus per-file diagnostics from one entry-listed trace.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TraceOutcome {
    pub bindings: Vec<TracedBinding>,
    pub diagnostics: Vec<TraceDiagnostic>,
}

pub fn trace_style_jsx_names(root_dir: &Path) -> Result<Vec<String>, StyleTraceError> {
    trace_style_jsx_names_with_hint(root_dir, None)
}

pub fn trace_style_jsx_names_with_hint(
    root_dir: &Path,
    sync_root_hint: Option<&Path>,
) -> Result<Vec<String>, StyleTraceError> {
    let bindings = trace_style_bindings_with_hint(root_dir, sync_root_hint)?;
    Ok(bindings
        .into_iter()
        .map(|b| b.name)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect())
}

pub fn trace_style_bindings(
    source_root: &Path,
    declaration_root: &Path,
) -> Result<Vec<TracedBinding>, StyleTraceError> {
    trace_style_bindings_with_hint(source_root, Some(declaration_root))
}

pub fn trace_style_bindings_with_hint(
    source_root: &Path,
    declaration_root: Option<&Path>,
) -> Result<Vec<TracedBinding>, StyleTraceError> {
    let normalized_source = normalize_path(source_root);
    let resolved_decl_root = match declaration_root {
        Some(hint) => normalize_path(hint),
        None => resolve_sync_root(&normalized_source, None)?,
    };

    let surface = StyleSurface::from_declaration_root(&resolved_decl_root)?;
    let entries = discover_source_files(&normalized_source)?;
    let outcome = trace_style_bindings_with_surface(
        &entries,
        &normalized_source,
        &resolved_decl_root,
        &surface,
    );
    // The names seam has no diagnostics channel; per-file skips stay silent
    // here by shape. compile() is the diagnosed path (ATM-SITE-57).
    Ok(outcome.bindings)
}

/// Trace explicit entries against a prebuilt surface. Entries that fail to
/// parse yield one diagnostic each and contribute no hosts; edge targets
/// that fail to parse are recorded by the walker; siblings still trace.
/// `package_root` anchors import resolution.
pub fn trace_style_bindings_with_surface(
    entries: &[PathBuf],
    source_root: &Path,
    package_root: &Path,
    surface: &StyleSurface,
) -> TraceOutcome {
    SurfaceTraceSession {
        source_root,
        package_root,
        surface,
    }
    .trace(entries)
}

/// Session threading surface sets through entry parsing and the walk.
struct SurfaceTraceSession<'a> {
    source_root: &'a Path,
    package_root: &'a Path,
    surface: &'a StyleSurface,
}

impl SurfaceTraceSession<'_> {
    fn trace(&self, entries: &[PathBuf]) -> TraceOutcome {
        let mut diagnostics = Vec::new();
        let modules = self.parse_entries(entries, &mut diagnostics);
        let bindings = self.walk(modules, &mut diagnostics);
        TraceOutcome {
            bindings,
            diagnostics,
        }
    }

    /// Parse entries, recording one diagnostic per unparsable file.
    fn parse_entries(
        &self,
        entries: &[PathBuf],
        diagnostics: &mut Vec<TraceDiagnostic>,
    ) -> BTreeMap<PathBuf, TraceModule> {
        let mut modules = BTreeMap::new();
        for entry in entries {
            match parse_trace_module(entry, self.package_root, self.surface) {
                Ok(module) => {
                    modules.insert(entry.clone(), module);
                }
                Err(error) => {
                    diagnostics.push(TraceDiagnostic::for_file(entry.clone(), error.to_string()))
                }
            }
        }
        modules
    }

    /// Walk parsed entries, folding edge diagnostics behind entry ones.
    fn walk(
        &self,
        modules: BTreeMap<PathBuf, TraceModule>,
        diagnostics: &mut Vec<TraceDiagnostic>,
    ) -> Vec<TracedBinding> {
        let mut analyzer = StyleTraceAnalyzer::new(
            modules,
            self.surface.clone(),
            self.package_root.to_path_buf(),
        );
        // Resolution is infallible in practice; a residual walker error
        // becomes one diagnostic rather than failing resolved siblings.
        let bindings = match analyzer.collect_exported_bindings(self.source_root) {
            Ok(bindings) => bindings,
            Err(error) => {
                diagnostics.push(TraceDiagnostic::new(error.to_string()));
                Vec::new()
            }
        };
        diagnostics.extend(analyzer.take_diagnostics());
        bindings
    }
}
