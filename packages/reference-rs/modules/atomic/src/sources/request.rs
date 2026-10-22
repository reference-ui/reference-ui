//! Request-level source contract: the exactly-one-of rule between `files` and `retentionToken`, the
//! drained-retention path that skips the union backfill when the scan's completeness contract covers
//! the request, and the outcome that reports how backfill settled. Takes a `CompileRequest` and emits
//! sorted sources with a `BackfillOutcome`, or a diagnostic code for a rejected token. Roots compare
//! through the scope's candidate normalization so one directory never splits in two.

use std::path::Path;

use crate::includes::IncludeScope;
use crate::CompileRequest;

use super::backfill::walk_root;
use super::gather::gather;

/// How one token-path compile settled the union backfill question: the
/// completeness contract fired, the walk ran, or neither walk applied.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BackfillOutcome {
    Skipped,
    Walked,
    Legacy,
}

/// The checked gather: sorted sources with how backfill settled, or the contract rejection.
pub(crate) type CheckedSources =
    Result<(Vec<(String, String)>, BackfillOutcome), (crate::DiagnosticCode, String)>;

/// Gather in-scope sources, sorted by path for deterministic extraction.
pub(crate) fn collect(request: &CompileRequest) -> Vec<(String, String)> {
    let mut sources = gather(request);
    sources.sort_unstable_by(|a, b| a.0.cmp(&b.0));
    sources
}

/// Gather with the scan/compile contract enforced: exactly-one-of `files` vs
/// `retentionToken` (an empty list counts as absent, the gather precedent),
/// neither keeps the legacy disk scan, both rejects, and unknown or drained
/// tokens fail loud (never a silent disk fallback). The outcome reports how
/// the token path settled backfill; the legacy path always reports `Legacy`.
pub(crate) fn collect_checked(request: &CompileRequest) -> CheckedSources {
    let Some(token) = request.retention_token else {
        return Ok((collect(request), BackfillOutcome::Legacy));
    };
    if request.files.as_ref().is_some_and(|files| !files.is_empty()) {
        return Err((
            crate::DiagnosticCode::ConflictingScanInputs,
            "request carries both `files` and `retentionToken`: \
             the scan/compile contract is exactly-one-of"
                .to_string(),
        ));
    }
    match crate::scan::drain(token) {
        Ok(drained) => Ok(collect_drained(request, drained)),
        Err(crate::scan::TokenError::Unknown(inner)) => Err((
            crate::DiagnosticCode::UnknownRetentionToken,
            format!(
                "unknown retention token {inner}: the scan retention is missing \
                 (never minted or already released); refusing the silent disk fallback"
            ),
        )),
        Err(crate::scan::TokenError::Drained(inner)) => Err((
            crate::DiagnosticCode::DrainedRetentionToken,
            format!(
                "retention token {inner} was already drained: \
                 retention moves once per scan"
            ),
        )),
    }
}

/// Drained retention with the backfill skipped by contract when the scan's
/// walk was complete over the same scope and root: scope-hit retained pairs
/// move in (no clone) and the sort below keeps deterministic order. Any
/// contract miss (flag, scope, root) keeps the unchanged union walk, which
/// reads only what the list misses.
fn collect_drained(
    request: &CompileRequest,
    drained: crate::scan::DrainedRetention,
) -> (Vec<(String, String)>, BackfillOutcome) {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    let matcher = scope.matcher(request.root_dir.as_deref());
    let skip = request
        .root_dir
        .as_deref()
        .is_some_and(|root| backfill_contract_holds(request, root, &drained));
    let mut provided: Vec<(String, String)> = drained
        .files
        .into_iter()
        .filter(|(path, _)| matcher.matches_file(path))
        .collect();
    let Some(root_dir) = request.root_dir.as_deref() else {
        provided.sort_unstable_by(|a, b| a.0.cmp(&b.0));
        return (provided, BackfillOutcome::Legacy);
    };
    if skip {
        provided.sort_unstable_by(|a, b| a.0.cmp(&b.0));
        return (provided, BackfillOutcome::Skipped);
    }
    walk_root(Path::new(root_dir), &matcher, &mut provided);
    provided.sort_unstable_by(|a, b| a.0.cmp(&b.0));
    (provided, BackfillOutcome::Walked)
}

/// True when the stored walk-completeness contract covers this request: the
/// enumerator asserted a complete walk over the same scope (element-wise)
/// and the same root (normalized), so every union path is already listed.
fn backfill_contract_holds(
    request: &CompileRequest,
    root_dir: &str,
    drained: &crate::scan::DrainedRetention,
) -> bool {
    drained.walk_complete
        && drained.include.as_slice() == request.include.as_deref().unwrap_or(&[])
        && same_root(&drained.cwd, root_dir)
}

/// True when two roots name one directory: forward slashes, no `./` prefix
/// or trailing slash, exactly the candidate normalization the scope uses.
pub(super) fn same_root(left: &str, right: &str) -> bool {
    crate::includes::normalize_candidate(left) == crate::includes::normalize_candidate(right)
}
