//! Include-scoped trace entries that exist on disk, in extraction order.
//! Takes the request's collected sources and keeps only real files for the
//! import-graph walk. Matches the entry set extraction compiles so traced
//! hosts and extracted styles never disagree on scope.

use std::path::PathBuf;

use crate::CompileRequest;

/// Include-scoped entries that exist on disk, in extraction order.
/// Virtual-only sources carry no import graph and are skipped silently.
pub(crate) fn entry_paths(request: &CompileRequest) -> Vec<PathBuf> {
    crate::sources::collect(request)
        .into_iter()
        .map(|(path, _)| PathBuf::from(path))
        // Trace walks the disk import graph, so virtual-only sources skip here, silently.
        .filter(|path| path.is_file())
        .collect()
}
