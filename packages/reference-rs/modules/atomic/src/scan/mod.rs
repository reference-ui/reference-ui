//! Native single-read scan with C3-in-reverse retention for fragment discovery.
//! Takes enumerated paths plus needle bytes and emits needle-hit contents while
//! retaining the full compile set process-side behind a monotonic token. Each
//! file reads once (portable open plus 64KB short-rule reads, lossy UTF-8),
//! retention applies the verbatim IGNORE-dir plus extension gates, and compile
//! drains the retained bytes (moves, never clones) behind exactly-one-of.

use std::io::Read;

use serde::{Deserialize, Serialize};

mod store;

pub use store::{DrainedRetention, drain, release};

/// One read covers every file under 64KB (the M4 census: 100% of enterprise).
const SCAN_CHUNK: usize = 65536;

/// Native scan request: verbatim paths, the needle union, the gate cwd.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanRequest {
    pub paths: Vec<String>,
    #[serde(default)]
    pub needles: Vec<String>,
    pub cwd: String,
    /// Caller platform separator (`/` on posix, `\` on Windows).
    #[serde(default = "default_sep")]
    pub sep: String,
    /// False runs reads plus gates with no retention and no token.
    #[serde(default = "default_true")]
    pub retain: bool,
    /// True adds the retention manifest. Test-only; production omits it.
    #[serde(default)]
    pub manifest: bool,
    /// True when the enumerator walked every in-scope path, so compile may
    /// skip its union backfill walk. Set only by the agreed-subset glob gate
    /// (same IGNORE set, extension gate, scope); a false claim silently drops
    /// files the enumeration missed, so direct callers leave this false.
    #[serde(default)]
    pub walk_complete: bool,
    /// Include scope the enumeration covered; compile skips its backfill only
    /// when its own scope matches this list element-for-element.
    #[serde(default)]
    pub include: Vec<String>,
}

fn default_sep() -> String {
    "/".to_string()
}

fn default_true() -> bool {
    true
}

impl ScanRequest {
    fn sep_byte(&self) -> u8 {
        self.sep.bytes().next().unwrap_or(b'/')
    }
}

/// One needle-hit: the verbatim path plus the bytes for the TS confirm.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanHit {
    pub path: String,
    pub content: String,
}

/// One retained entry's manifest row: gate-relative path plus FNV-1a hash.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestEntry {
    pub path: String,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResponse {
    pub hits: Vec<ScanHit>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retention_token: Option<u64>,
    pub retained_count: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manifest: Option<Vec<ManifestEntry>>,
}

/// Drain failure: never minted (or released) vs already drained.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenError {
    Unknown(u64),
    Drained(u64),
}

/// Scan every path once: read, needle-gate, retain. Hits return in input
/// order; retention keeps the IGNORE-dir plus extension subset with verbatim
/// path strings and drains behind the minted token.
pub fn scan(request: &ScanRequest) -> ScanResponse {
    let gates = ScanGates::new(&request.cwd, request.sep_byte());
    let mut chunk = vec![0u8; SCAN_CHUNK];
    let mut sinks = ScanSinks::default();
    for path in &request.paths {
        let rel = gates.relative(path);
        let keep = request.retain && retainable(&rel);
        let Some(content) = read_lossy(path, &mut chunk) else {
            continue;
        };
        let is_hit = hit(&content, &request.needles);
        sinks.push(ScannedFile {
            path: path.clone(),
            rel,
            content,
            is_hit,
            keep,
        });
    }
    let ScanSinks { hits, retained } = sinks;
    let retained_count = retained.len();
    let manifest = request.manifest.then(|| manifest_of(&retained));
    let retention_token = store::mint(request, retained);
    ScanResponse {
        hits,
        retention_token,
        retained_count,
        manifest,
    }
}

/// One read file plus its gate verdicts, routed to the ordered sinks.
struct ScannedFile {
    path: String,
    rel: String,
    content: String,
    is_hit: bool,
    keep: bool,
}

/// Ordered scan sinks: needle-hits for the TS confirm plus retained files.
#[derive(Default)]
struct ScanSinks {
    hits: Vec<ScanHit>,
    retained: Vec<RetainedFile>,
}

impl ScanSinks {
    /// Route one file: hits clone the bytes only when also retained (response
    /// plus store both own), otherwise the bytes move exactly once.
    fn push(&mut self, file: ScannedFile) {
        match (file.is_hit, file.keep) {
            (true, true) => {
                let path = file.path.clone();
                let content = file.content.clone();
                self.hits.push(ScanHit { path, content });
                self.retained.push(file.kept());
            }
            (true, false) => self.hits.push(file.hit()),
            (false, true) => self.retained.push(file.kept()),
            (false, false) => {}
        }
    }
}

impl ScannedFile {
    fn hit(self) -> ScanHit {
        ScanHit { path: self.path, content: self.content }
    }

    fn kept(self) -> RetainedFile {
        RetainedFile { path: self.path, rel: self.rel, content: self.content }
    }
}

/// One retained file: the verbatim path, the gate-relative form, the bytes.
struct RetainedFile {
    path: String,
    rel: String,
    content: String,
}

/// True when any needle byte-string occurs (the regex-confirm pre-gate: every
/// discovery regex contains its needle, so misses never match).
fn hit(content: &str, needles: &[String]) -> bool {
    needles.iter().any(|needle| content.contains(needle))
}

/// Portable single-read: open plus 64KB reads until a short read or EOF, lossy
/// UTF-8 exactly as `readFileSync(utf-8)`. Unreadable files drop (None, never
/// an error); a short read ends the file with no confirm read.
fn read_lossy(path: &str, chunk: &mut [u8]) -> Option<String> {
    let mut file = std::fs::File::open(path).ok()?;
    let mut out = Vec::new();
    loop {
        let count = file.read(chunk).ok()?;
        out.extend_from_slice(&chunk[..count]);
        if count < chunk.len() {
            break;
        }
    }
    Some(String::from_utf8_lossy(&out).into_owned())
}

/// Lexical gate context: the resolved cwd plus the process cwd, once per scan.
struct ScanGates {
    cwd: Vec<String>,
    here: Vec<String>,
    sep: u8,
}

impl ScanGates {
    fn new(cwd: &str, sep: u8) -> Self {
        let here = std::env::current_dir()
            .map(|dir| resolve_segments(&[], &dir.to_string_lossy(), sep))
            .unwrap_or_default();
        let resolved = resolve_segments(&here, cwd, sep);
        Self {
            cwd: resolved,
            here,
            sep,
        }
    }

    /// The gate-relative form: the verbatim suffix under cwd, else the
    /// `..`-climb node `relative()` emits (opaque segments, never resolved).
    fn relative(&self, path: &str) -> String {
        let target = resolve_segments(&self.here, path, self.sep);
        if let Some(tail) = strip_prefix(&self.cwd, &target) {
            return tail.join("/");
        }
        if self.sep != b'/' && drive_roots_differ(&self.cwd, &target) {
            return target.join("/");
        }
        let shared = shared_prefix(&self.cwd, &target);
        let mut parts = vec![".."; self.cwd.len() - shared];
        parts.extend(target[shared..].iter().map(String::as_str));
        parts.join("/")
    }
}

/// Split on both separators into raw segments plus the absolute mark. Unix
/// backslashes stay literal (they are legal filename bytes, not separators).
fn split_raw(text: &str, sep: u8) -> (bool, Vec<String>) {
    let win = sep != b'/';
    let absolute = text.starts_with('/') || (win && text.starts_with(sep as char));
    let segments = text
        .split(|cell| cell == '/' || (win && cell == sep as char))
        .filter(|segment| !segment.is_empty() && *segment != ".")
        .map(str::to_string)
        .collect();
    (absolute, segments)
}

/// Resolve against the base when relative, then collapse `..` lexically
/// (clamped at the root: absolute forms never climb past it).
fn resolve_segments(base: &[String], text: &str, sep: u8) -> Vec<String> {
    let (absolute, raw) = split_raw(text, sep);
    let mut out: Vec<String> = if absolute { Vec::new() } else { base.to_vec() };
    for segment in raw {
        if segment == ".." {
            out.pop();
        } else {
            out.push(segment);
        }
    }
    out
}

/// The target minus the cwd prefix, or None when the target escapes it.
fn strip_prefix(cwd: &[String], target: &[String]) -> Option<Vec<String>> {
    if target.len() < cwd.len() || target[..cwd.len()] != cwd[..] {
        return None;
    }
    Some(target[cwd.len()..].to_vec())
}

/// True when both roots are drive letters that differ (node returns the
/// absolute target then, since no relative form crosses drives).
fn drive_roots_differ(cwd: &[String], target: &[String]) -> bool {
    let drive = |segment: &str| segment.len() == 2 && segment.ends_with(':');
    match (cwd.first(), target.first()) {
        (Some(left), Some(right)) => drive(left) && drive(right) && left != right,
        _ => false,
    }
}

fn shared_prefix(left: &[String], right: &[String]) -> usize {
    left.iter()
        .zip(right.iter())
        .take_while(|(a, b)| a == b)
        .count()
}

/// True when the gate-relative form keeps its bytes: no IGNORE-dir ancestor
/// and an engine-parsed final extension (both gates shared verbatim with
/// `sources.rs`, so the sets cannot drift).
fn retainable(rel: &str) -> bool {
    let segments: Vec<&str> = rel.split('/').collect();
    let (dirs, file) = segments.split_at(segments.len() - 1);
    !dirs
        .iter()
        .any(|dir| crate::sources::is_ignored_dir_name(dir))
        && crate::sources::is_supported_extension(std::path::Path::new(file[0]))
}

/// Sorted path-plus-content hashes for the differential (test-only).
fn manifest_of(retained: &[RetainedFile]) -> Vec<ManifestEntry> {
    let mut entries: Vec<ManifestEntry> = retained
        .iter()
        .map(|file| ManifestEntry {
            path: file.rel.clone(),
            hash: entry_hash(&file.rel, &file.content),
        })
        .collect();
    entries.sort_by(|a, b| a.path.as_bytes().cmp(b.path.as_bytes()));
    entries
}

/// FNV-1a 64 over the path bytes, one zero byte, and the content bytes.
fn entry_hash(rel: &str, content: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    let bytes = rel.bytes().chain(std::iter::once(0)).chain(content.bytes());
    for byte in bytes {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}
