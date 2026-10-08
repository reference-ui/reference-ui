//! Source discovery for the atomic compile pipeline.
//! Takes the request's virtual `files` list or `root_dir` and emits sorted
//! `(path, content)` pairs for extraction. The disk scan skips fixed build and
//! metadata directories plus non-source extensions; the include scope then
//! filters both paths to matching files, silently dropping the rest.

use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use rustc_hash::FxHashSet;

use crate::includes::{FileMatcher, IncludeScope};
use crate::{CompileRequest, VirtualSource};

/// Union backfill walks completed this process (token path plus the legacy
/// `files` union). Skipped walks never increment: a complete retention
/// compiles with a zero delta.
static BACKFILL_WALKS: AtomicU64 = AtomicU64::new(0);

/// Backfill walks completed this process. Test-only telemetry: tests read
/// deltas around one compile, and the walk direction only grows, so a
/// `>= 1` assertion never flakes under parallel harnesses.
#[cfg(test)]
pub(crate) fn backfill_walks() -> u64 {
    BACKFILL_WALKS.load(Ordering::SeqCst)
}

/// How one token-path compile settled the union backfill question: the
/// completeness contract fired, the walk ran, or neither walk applied.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum BackfillOutcome {
    Skipped,
    Walked,
    Legacy,
}

/// Directories the disk walk never descends into (build + metadata).
const IGNORE_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    "build",
    ".turbo",
    "target",
    ".reference-ui",
    ".reference",
    ".pipeline",
];

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
pub(crate) fn collect_checked(
    request: &CompileRequest,
) -> Result<
    (Vec<(String, String)>, BackfillOutcome),
    (crate::DiagnosticCode, String),
> {
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
    let mut known: FxHashSet<String> = provided.iter().map(|(path, _)| path.clone()).collect();
    let mut backfill = Backfill {
        matcher: &matcher,
        known: &mut known,
        acc: &mut provided,
    };
    BACKFILL_WALKS.fetch_add(1, Ordering::SeqCst);
    backfill_dir(Path::new(root_dir), &mut backfill);
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
fn same_root(left: &str, right: &str) -> bool {
    crate::includes::normalize_candidate(left) == crate::includes::normalize_candidate(right)
}

/// One walk entry: the readdir type plus the path it was read for.
struct WalkEntry {
    file_type: Option<std::fs::FileType>,
    path: std::path::PathBuf,
}

/// `(d_type, path)` pairs of one directory, sorted by path for determinism.
/// The type rides free with the readdir on typed filesystems; `None` keeps
/// the stat fallback for entries the OS refused to type. Entries share one
/// parent, so file-name order equals full-path order while comparing bytes
/// instead of walking components; names are unique, so the unstable sort
/// emits the same sequence the stable full-path sort did, minus its scratch.
fn sorted_entries(dir: &Path) -> Vec<WalkEntry> {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return Vec::new();
    };
    let dir_bytes = dir.as_os_str().len();
    let mut listed: Vec<WalkEntry> = entries
        .flatten()
        .map(|entry| {
            // entry.path() joins dir and name through a growing buffer
            // (one realloc per entry); pushing both parts into an
            // exactly-sized buffer joins the identical bytes with none.
            let name = entry.file_name();
            let mut path = PathBuf::with_capacity(dir_bytes + 1 + name.len());
            path.push(dir);
            path.push(&name);
            WalkEntry {
                file_type: entry.file_type().ok(),
                path,
            }
        })
        .collect();
    listed.sort_unstable_by(|a, b| a.path.file_name().cmp(&b.path.file_name()));
    listed
}

/// True when the entry is a directory: the free d_type decides for plain
/// files and dirs; symlinks, unknown types, and refused stats fall through
/// to `is_dir()`, so every verdict matches the old stat-everything walk.
fn entry_is_dir(file_type: Option<&std::fs::FileType>, path: &Path) -> bool {
    match file_type {
        Some(known) if known.is_dir() => true,
        Some(known) if known.is_file() => false,
        _ => path.is_dir(),
    }
}

/// Provided `files` union-filled from disk when present, otherwise the
/// filtered `root_dir` scan. An empty list scans: absence and emptiness
/// both mean "the caller handed nothing over".
fn gather(request: &CompileRequest) -> Vec<(String, String)> {
    let patterns = request.include.as_deref().unwrap_or(&[]);
    let scope = IncludeScope::compile(patterns);
    let matcher = scope.matcher(request.root_dir.as_deref());
    if let Some(files) = &request.files {
        if !files.is_empty() {
            return union_sources(files, request.root_dir.as_deref(), &matcher);
        }
    }

    let mut sources = Vec::new();
    if let Some(root_dir) = &request.root_dir {
        scan_dir(Path::new(root_dir), &matcher, &mut sources);
    }
    sources
}

/// Virtual sources inside the include scope; an open scope keeps every file.
fn filter_virtual_sources(files: &[VirtualSource], matcher: &FileMatcher) -> Vec<(String, String)> {
    files
        .iter()
        .filter(|file| matcher.matches_file(&file.path))
        .map(|file| (file.path.clone(), file.content.clone()))
        .collect()
}

/// Provided sources plus the scope-hit disk paths the list misses: provided
/// bytes win on collision and only missing paths read from disk, so set
/// equality holds by construction whatever glob engine built the list. With
/// no root the walk has nowhere to go and this is exactly the legacy
/// provided filter, so files-only callers keep byte-identical semantics.
/// The known-check runs inside the walk, so already-listed paths cost a
/// hash probe and never a transient path string; missing paths still read
/// from disk in walk order exactly as the two-phase walk did.
fn union_sources(
    files: &[VirtualSource],
    root: Option<&str>,
    matcher: &FileMatcher,
) -> Vec<(String, String)> {
    let mut provided = filter_virtual_sources(files, matcher);
    let Some(root_dir) = root else {
        return provided;
    };
    let mut known: FxHashSet<String> = provided.iter().map(|(path, _)| path.clone()).collect();
    let mut backfill = Backfill {
        matcher,
        known: &mut known,
        acc: &mut provided,
    };
    BACKFILL_WALKS.fetch_add(1, Ordering::SeqCst);
    backfill_dir(Path::new(root_dir), &mut backfill);
    provided
}

/// Union-fill state: the scope matcher, the listed-path set, and the output.
struct Backfill<'a> {
    matcher: &'a FileMatcher<'a>,
    known: &'a mut FxHashSet<String>,
    acc: &'a mut Vec<(String, String)>,
}

/// Backfill walk over `dir`: same traversal, IGNORE set, extension gate,
/// and scope predicate as the collecting scan, so every path the scan
/// would read is visited, and only unlisted ones read from disk.
fn backfill_dir(dir: &Path, backfill: &mut Backfill) {
    for entry in sorted_entries(dir) {
        handle_backfill_entry(&entry, backfill);
    }
}

/// Descend into kept directories; read supported in-scope files the
/// provided list misses, skipping listed paths before any string is built.
fn handle_backfill_entry(entry: &WalkEntry, backfill: &mut Backfill) {
    let path = &entry.path;
    if entry_is_dir(entry.file_type.as_ref(), path) {
        if is_kept_dir(path) {
            backfill_dir(path, backfill);
        }
        return;
    }
    if !is_supported_extension(path) {
        return;
    }
    let path_str = path.to_string_lossy();
    if !backfill.matcher.matches_file(&path_str) {
        return;
    }
    let known_key: &str = &path_str;
    if backfill.known.contains(known_key) {
        return;
    }
    if let Ok(content) = std::fs::read_to_string(path) {
        backfill.known.insert(path_str.to_string());
        backfill.acc.push((path_str.to_string(), content));
    }
}

/// Recursively collect supported sources under `dir`, skipping fixed ignores.
/// The include scope is a pure path predicate, so it runs before the read:
/// out-of-scope files cost a match, never I/O.
fn scan_dir(dir: &Path, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    for entry in sorted_entries(dir) {
        handle_dir_entry(&entry, matcher, acc);
    }
}

/// Descend into kept directories, read supported in-scope source files.
fn handle_dir_entry(entry: &WalkEntry, matcher: &FileMatcher, acc: &mut Vec<(String, String)>) {
    let path = &entry.path;
    if entry_is_dir(entry.file_type.as_ref(), path) {
        if is_kept_dir(path) {
            scan_dir(path, matcher, acc);
        }
    } else if is_supported_extension(path) {
        let path_str = path.to_string_lossy();
        if matcher.matches_file(&path_str) {
            if let Ok(content) = std::fs::read_to_string(path) {
                acc.push((path_str.to_string(), content));
            }
        }
    }
}

/// True when a directory (already stat-checked by the caller) sits outside
/// the IGNORE set. The name check alone decides; no second stat.
fn is_kept_dir(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
    !is_ignored_dir_name(name)
}

/// True when a directory name is engine-ignored; shared verbatim with the
/// native scan gate so the set cannot drift between the two paths.
pub(crate) fn is_ignored_dir_name(name: &str) -> bool {
    IGNORE_DIRS.contains(&name)
}

/// True for the extensions the extractor parses.
pub(crate) fn is_supported_extension(path: &Path) -> bool {
    let Some(ext) = path.extension().and_then(|e| e.to_str()) else {
        return false;
    };
    matches!(ext, "tsx" | "ts" | "jsx" | "js")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    /// Process-wide counter so parallel tests never share a temp root.
    static TEMP_COUNTER: AtomicU64 = AtomicU64::new(0);

    /// Unique temp root for one test: pid plus a monotonic counter.
    fn temp_root(name: &str) -> std::path::PathBuf {
        let id = TEMP_COUNTER.fetch_add(1, Ordering::SeqCst);
        std::env::temp_dir().join(format!(
            "lanea-union-{}-{id}-{name}",
            std::process::id()
        ))
    }

    /// Tricky tree: live, dotfile, and d.ts sources plus dist-, ignored-,
    /// and extension-excluded decoys. Returns the root string.
    fn write_tricky_tree(name: &str) -> (std::path::PathBuf, String) {
        let root = temp_root(name);
        let live = "export const a = 1;\n";
        for (rel, content) in [
            ("src/a.ts", live),
            ("src/.hidden.ts", live),
            ("src/t.d.ts", live),
            ("dist/skip.ts", live),
            ("node_modules/pkg/x.ts", live),
            ("src/data.json", "{}\n"),
        ] {
            let path = root.join(rel);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, content).unwrap();
        }
        let root_str = root.to_string_lossy().to_string();
        (root, root_str)
    }

    /// Sorted gathered pairs for comparisons (gather itself is unordered).
    fn sorted(mut sources: Vec<(String, String)>) -> Vec<(String, String)> {
        sources.sort_unstable();
        sources
    }

    /// The disk scan keeps live sources, dotfiles, and d.ts files while
    /// dropping IGNORE dirs and non-source extensions.
    #[test]
    fn disk_scan_pins_the_tricky_set() {
        let (root, root_str) = write_tricky_tree("scan");
        let request = CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        };
        let paths: Vec<String> = sorted(gather(&request))
            .into_iter()
            .map(|(path, _)| path)
            .collect();
        assert_eq!(
            paths,
            [
                format!("{root_str}/src/.hidden.ts"),
                format!("{root_str}/src/a.ts"),
                format!("{root_str}/src/t.d.ts"),
            ]
        );
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Provided-everything plus a root equals the bare disk scan, and a
    /// provided subset backfills the missing disk paths to the same set.
    #[test]
    fn provided_union_matches_the_disk_scan() {
        let (root, root_str) = write_tricky_tree("union");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let all = scanned
            .iter()
            .map(|(path, content)| VirtualSource {
                path: path.clone(),
                content: content.clone(),
            })
            .collect::<Vec<_>>();
        let full = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all.clone()),
            ..Default::default()
        }));
        assert_eq!(full, scanned);
        let subset = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all[..1].to_vec()),
            ..Default::default()
        }));
        assert_eq!(subset, scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Symlink tree: a real dir plus a linked dir, a linked file carrying
    /// the target's bytes, and a dangling link. Unix-only: links need
    /// symlink privileges the portable suite cannot assume.
    #[cfg(unix)]
    fn write_symlink_tree(name: &str) -> (std::path::PathBuf, String) {
        let root = temp_root(name);
        std::fs::create_dir_all(root.join("src/real")).unwrap();
        std::fs::write(root.join("src/real/a.ts"), "export const a = 1;\n").unwrap();
        std::os::unix::fs::symlink(root.join("src/real"), root.join("src/linkdir")).unwrap();
        std::os::unix::fs::symlink(root.join("src/real/a.ts"), root.join("src/linkfile.ts"))
            .unwrap();
        std::os::unix::fs::symlink(root.join("src/missing.ts"), root.join("src/dangling.ts"))
            .unwrap();
        let root_str = root.to_string_lossy().to_string();
        (root, root_str)
    }

    /// Links keep stat-everything verdicts on both walks: linked dirs
    /// descend, linked files carry target bytes, dangling links drop, and
    /// the union backfill completes a provided subset to the same set.
    #[cfg(unix)]
    #[test]
    fn symlinks_keep_stat_verdicts_on_both_walks() {
        let (root, root_str) = write_symlink_tree("symlinks");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let paths: Vec<String> = scanned
            .iter()
            .map(|(path, _)| path.clone())
            .collect();
        assert_eq!(
            paths,
            [
                format!("{root_str}/src/linkdir/a.ts"),
                format!("{root_str}/src/linkfile.ts"),
                format!("{root_str}/src/real/a.ts"),
            ]
        );
        let linked = scanned
            .iter()
            .find(|(path, _)| path.ends_with("linkfile.ts"))
            .unwrap();
        assert_eq!(linked.1, "export const a = 1;\n");
        let all = scanned
            .iter()
            .map(|(path, content)| VirtualSource {
                path: path.clone(),
                content: content.clone(),
            })
            .collect::<Vec<_>>();
        let subset = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            files: Some(all[..1].to_vec()),
            ..Default::default()
        }));
        assert_eq!(subset, scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Native scan request over explicit paths with the completeness flag
    /// and covered scope the TS glob gate asserted for this enumeration.
    fn scan_request(
        paths: Vec<String>,
        cwd: &str,
        include: Vec<String>,
        walk_complete: bool,
    ) -> crate::scan::ScanRequest {
        crate::scan::ScanRequest {
            paths,
            needles: Vec::new(),
            cwd: cwd.to_string(),
            sep: "/".to_string(),
            retain: true,
            manifest: false,
            walk_complete,
            include,
        }
    }

    /// Absolute paths of every file under the tricky tree (live plus decoys):
    /// the complete enumeration the glob gate would hand the scan.
    fn tricky_paths(root: &std::path::Path) -> Vec<String> {
        [
            "src/a.ts",
            "src/.hidden.ts",
            "src/t.d.ts",
            "dist/skip.ts",
            "node_modules/pkg/x.ts",
            "src/data.json",
        ]
        .into_iter()
        .map(|rel| root.join(rel).to_string_lossy().to_string())
        .collect()
    }

    /// Token-path compile over one root with no `files` (the exactly-one-of
    /// happy path): drains the token and settles backfill by contract.
    fn token_request(root: &str, token: u64, include: Option<Vec<String>>) -> CompileRequest {
        CompileRequest {
            root_dir: Some(root.to_string()),
            retention_token: Some(token),
            include,
            ..Default::default()
        }
    }

    /// A complete retention over the same scope and root skips the union
    /// backfill walk: zero walks, and the sources equal the disk scan set.
    #[test]
    fn complete_retention_skips_the_backfill_walk() {
        let (root, root_str) = write_tricky_tree("skip");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let response = crate::scan::scan(&scan_request(
            tricky_paths(&root),
            &root_str,
            Vec::new(),
            true,
        ));
        let token = response.retention_token.unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&root_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Skipped);
        assert_eq!(sorted(sources), scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// An incomplete flag keeps the walk: the counter grows and the union
    /// still completes the listed paths to the disk scan set.
    #[test]
    fn incomplete_flag_keeps_the_walk_and_matches() {
        let (root, root_str) = write_tricky_tree("walk");
        let scanned = sorted(gather(&CompileRequest {
            root_dir: Some(root_str.clone()),
            ..Default::default()
        }));
        let before = backfill_walks();
        let response = crate::scan::scan(&scan_request(
            tricky_paths(&root),
            &root_str,
            Vec::new(),
            false,
        ));
        let token = response.retention_token.unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&root_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Walked);
        assert!(backfill_walks() - before >= 1);
        assert_eq!(sorted(sources), scanned);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Skip and walk arms agree byte-for-byte on one complete fixture: same
    /// paths in the same order with identical contents.
    #[test]
    fn skip_matches_walk_byte_for_byte() {
        let (root, root_str) = write_tricky_tree("identical");
        let request = |complete: bool| {
            let response = crate::scan::scan(&scan_request(
                tricky_paths(&root),
                &root_str,
                Vec::new(),
                complete,
            ));
            token_request(&root_str, response.retention_token.unwrap(), None)
        };
        let (skipped, skip_outcome) = collect_checked(&request(true)).unwrap();
        let (walked, walk_outcome) = collect_checked(&request(false)).unwrap();
        assert_eq!(skip_outcome, BackfillOutcome::Skipped);
        assert_eq!(walk_outcome, BackfillOutcome::Walked);
        assert_eq!(skipped, walked);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// A scope the scan did not cover keeps the walk: the drained list filters
    /// to the compile scope and the walk union-fills the rest of it.
    #[test]
    fn scope_mismatch_keeps_the_walk() {
        let root = temp_root("scope");
        for rel in ["src/a.ts", "theme/t.ts"] {
            let path = root.join(rel);
            std::fs::create_dir_all(path.parent().unwrap()).unwrap();
            std::fs::write(&path, "export const a = 1;\n").unwrap();
        }
        let root_str = root.to_string_lossy().to_string();
        let paths = ["src/a.ts", "theme/t.ts"]
            .into_iter()
            .map(|rel| root.join(rel).to_string_lossy().to_string())
            .collect();
        let response = crate::scan::scan(&scan_request(
            paths,
            &root_str,
            vec!["src/**".to_string()],
            true,
        ));
        let token = response.retention_token.unwrap();
        let (sources, outcome) = collect_checked(&token_request(
            &root_str,
            token,
            Some(vec!["theme/**".to_string()]),
        ))
        .unwrap();
        assert_eq!(outcome, BackfillOutcome::Walked);
        assert_eq!(sources, [(format!("{root_str}/theme/t.ts"), "export const a = 1;\n".to_string())]);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// A root the scan did not cover keeps the walk: drained bytes union with
    /// the walked root exactly as the unskipped path always combined them.
    #[test]
    fn root_mismatch_keeps_the_walk() {
        let first = temp_root("root-a");
        let second = temp_root("root-b");
        std::fs::create_dir_all(first.join("src")).unwrap();
        std::fs::write(first.join("src/a.ts"), "export const a = 1;\n").unwrap();
        std::fs::create_dir_all(second.join("src")).unwrap();
        std::fs::write(second.join("src/b.ts"), "export const b = 2;\n").unwrap();
        let first_str = first.to_string_lossy().to_string();
        let second_str = second.to_string_lossy().to_string();
        let response = crate::scan::scan(&scan_request(
            vec![first.join("src/a.ts").to_string_lossy().to_string()],
            &first_str,
            Vec::new(),
            true,
        ));
        let token = response.retention_token.unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&second_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Walked);
        assert_eq!(
            sorted(sources),
            sorted(vec![
                (
                    format!("{first_str}/src/a.ts"),
                    "export const a = 1;\n".to_string(),
                ),
                (
                    format!("{second_str}/src/b.ts"),
                    "export const b = 2;\n".to_string(),
                ),
            ])
        );
        std::fs::remove_dir_all(&first).unwrap();
        std::fs::remove_dir_all(&second).unwrap();
    }

    /// A trailing-slash root still names the scanned root: normalization
    /// keeps the skip instead of paying a walk for punctuation.
    #[test]
    fn trailing_slash_root_still_skips() {
        let (root, root_str) = write_tricky_tree("slash");
        let response = crate::scan::scan(&scan_request(
            tricky_paths(&root),
            &root_str,
            Vec::new(),
            true,
        ));
        let token = response.retention_token.unwrap();
        let request = token_request(&format!("{root_str}/"), token, None);
        let (sources, outcome) = collect_checked(&request).unwrap();
        assert_eq!(outcome, BackfillOutcome::Skipped);
        assert_eq!(sources.len(), 3);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// A file deleted after a complete scan still serves its retained bytes
    /// on the skip: the snapshot holds, exactly as the walk arm holds it.
    #[test]
    fn dropped_file_serves_retained_bytes_on_skip() {
        let (root, root_str) = write_tricky_tree("dropped");
        let response = crate::scan::scan(&scan_request(
            tricky_paths(&root),
            &root_str,
            Vec::new(),
            true,
        ));
        let token = response.retention_token.unwrap();
        std::fs::remove_file(root.join("src/a.ts")).unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&root_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Skipped);
        let held = sources
            .iter()
            .find(|(path, _)| path.ends_with("src/a.ts"))
            .unwrap();
        assert_eq!(held.1, "export const a = 1;\n");
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// An unreadable path (a directory wearing a source extension) drops on
    /// both arms: the scan read fails and the walk descends into nothing.
    #[test]
    fn unreadable_path_stays_dropped_on_skip() {
        let (root, root_str) = write_tricky_tree("unreadable");
        std::fs::create_dir_all(root.join("src/dir.ts")).unwrap();
        let mut paths = tricky_paths(&root);
        paths.push(root.join("src/dir.ts").to_string_lossy().to_string());
        let request = |complete: bool| {
            let response = crate::scan::scan(&scan_request(
                paths.clone(),
                &root_str,
                Vec::new(),
                complete,
            ));
            token_request(&root_str, response.retention_token.unwrap(), None)
        };
        let (skipped, skip_outcome) = collect_checked(&request(true)).unwrap();
        let (walked, walk_outcome) = collect_checked(&request(false)).unwrap();
        assert_eq!(skip_outcome, BackfillOutcome::Skipped);
        assert_eq!(walk_outcome, BackfillOutcome::Walked);
        assert_eq!(skipped, walked);
        assert!(!skipped.iter().any(|(path, _)| path.ends_with("dir.ts")));
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// An empty root mints no token, so compile takes the legacy disk scan
    /// (no backfill question arises) and finds nothing either way.
    #[test]
    fn empty_root_takes_the_legacy_scan() {
        let root = temp_root("empty");
        std::fs::create_dir_all(&root).unwrap();
        let root_str = root.to_string_lossy().to_string();
        let response = crate::scan::scan(&scan_request(Vec::new(), &root_str, Vec::new(), true));
        assert_eq!(response.retention_token, None);
        let request = CompileRequest {
            root_dir: Some(root_str),
            ..Default::default()
        };
        let (sources, outcome) = collect_checked(&request).unwrap();
        assert_eq!(outcome, BackfillOutcome::Legacy);
        assert!(sources.is_empty());
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// One live file skips: the single-file root pays no walk for one read.
    #[test]
    fn single_file_skips() {
        let root = temp_root("single");
        std::fs::create_dir_all(root.join("src")).unwrap();
        std::fs::write(root.join("src/a.ts"), "export const a = 1;\n").unwrap();
        let root_str = root.to_string_lossy().to_string();
        let response = crate::scan::scan(&scan_request(
            vec![root.join("src/a.ts").to_string_lossy().to_string()],
            &root_str,
            Vec::new(),
            true,
        ));
        let token = response.retention_token.unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&root_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Skipped);
        assert_eq!(sources.len(), 1);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Sources without style calls still list (collection never parses), and
    /// an all-dead tree skips like any complete retention.
    #[test]
    fn all_dead_sources_still_skip() {
        let root = temp_root("dead");
        for name in ["a.ts", "b.ts"] {
            std::fs::create_dir_all(root.join("src")).unwrap();
            std::fs::write(root.join("src").join(name), "export const x = 1;\n").unwrap();
        }
        let root_str = root.to_string_lossy().to_string();
        let paths = ["src/a.ts", "src/b.ts"]
            .into_iter()
            .map(|rel| root.join(rel).to_string_lossy().to_string())
            .collect();
        let response = crate::scan::scan(&scan_request(paths, &root_str, Vec::new(), true));
        let token = response.retention_token.unwrap();
        let (sources, outcome) =
            collect_checked(&token_request(&root_str, token, None)).unwrap();
        assert_eq!(outcome, BackfillOutcome::Skipped);
        assert_eq!(sources.len(), 2);
        std::fs::remove_dir_all(&root).unwrap();
    }

    /// Roots compare by the scope's candidate normalization: separators,
    /// prefixes, and trailing slashes never split one directory in two.
    #[test]
    fn same_root_normalizes_before_comparing() {
        assert!(same_root("/tmp/x", "/tmp/x/"));
        assert!(same_root("C:\\r", "C:/r"));
        assert!(same_root("./r", "r"));
        assert!(!same_root("/tmp/x", "/tmp/y"));
    }

    /// Provided files without a root keep legacy filter semantics exactly:
    /// no walk, no backfill, scope-filtered handoff only.
    #[test]
    fn files_without_root_keep_legacy_semantics() {
        let provided = vec![
            VirtualSource {
                path: "/elsewhere/a.ts".to_string(),
                content: "export const a = 1;\n".to_string(),
            },
            VirtualSource {
                path: "/elsewhere/b.ts".to_string(),
                content: "export const b = 2;\n".to_string(),
            },
        ];
        let request = CompileRequest {
            files: Some(provided.clone()),
            ..Default::default()
        };
        let gathered = sorted(gather(&request));
        let expected = sorted(
            provided
                .into_iter()
                .map(|file| (file.path, file.content))
                .collect(),
        );
        assert_eq!(gathered, expected);
    }
}
