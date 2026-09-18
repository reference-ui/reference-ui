//! Explicit and traced JSX host resolution for StyleProps gating.
//! Unions caller-supplied `jsxHosts` with engine-traced component names so
//! configured hosts and discovered wrappers extract without a file-local
//! import. Tracing runs against the engine-owned surface over the same
//! include-scoped entries extraction compiles; per-file failures become
//! located warnings, never silent empty sets.

use std::collections::{BTreeSet, HashSet};
use std::path::Path;

use styletrace::trace_style_bindings_with_surface;

use crate::{CompileRequest, Diagnostic};

mod diagnostics;
mod entries;
mod surface;
#[cfg(test)]
mod tests;

use diagnostics::render_trace_diagnostic;
use entries::entry_paths;
pub use surface::engine_surface;

/// Traced vs caller-configured host names for one compile.
pub struct ResolvedHosts {
    pub traced: Vec<String>,
    pub configured: Vec<String>,
}

impl ResolvedHosts {
    /// Sorted union gating extraction.
    pub fn hosts(&self) -> HashSet<String> {
        let mut hosts = HashSet::new();
        hosts.extend(self.traced.iter().cloned());
        hosts.extend(self.configured.iter().cloned());
        hosts
    }
}

/// Caller hosts plus traced names for one compile.
pub fn collect_hosts(request: &CompileRequest) -> HashSet<String> {
    resolve(request).0.hosts()
}

/// Trace the include-scoped entry set against the engine surface.
/// Returns traced and configured names plus trace warnings for the
/// compile diagnostics. Empty entry sets trace nothing, silently.
pub fn resolve(request: &CompileRequest) -> (ResolvedHosts, Vec<Diagnostic>) {
    let configured = request.jsx_hosts.clone().unwrap_or_default();
    let vacant = || {
        (
            ResolvedHosts {
                traced: Vec::new(),
                configured: configured.clone(),
            },
            Vec::new(),
        )
    };
    let Some(root_dir) = request.root_dir.as_ref() else {
        return vacant();
    };
    let entries = entry_paths(request);
    if entries.is_empty() {
        return vacant();
    }
    let package_root = request.declaration_root.as_deref().unwrap_or(root_dir);
    let surface = engine_surface(&request.base_system);
    let outcome = trace_style_bindings_with_surface(
        &entries,
        Path::new(root_dir),
        Path::new(package_root),
        &surface,
    );
    let traced = outcome
        .bindings
        .into_iter()
        .map(|binding| binding.name)
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    let diagnostics = outcome
        .diagnostics
        .into_iter()
        .map(render_trace_diagnostic)
        .collect();
    (ResolvedHosts { traced, configured }, diagnostics)
}
