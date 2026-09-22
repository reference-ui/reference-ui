//! Process-side retention store behind the C3-in-reverse scan token.
//! Takes retained file bytes and emits a monotonic token; compile drains the
//! bytes (moves, never clones) while drain tombstones fail loud on reuse.
//! Released tokens leave no trace; unknown tokens never fall back to disk.

use std::collections::{HashMap, HashSet};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Mutex, OnceLock,
};

use super::{RetainedFile, ScanRequest, TokenError};

/// One live retention: the bytes plus the walk-completeness contract the
/// enumerator asserted (flag, gate cwd, covered scope). Compile skips its
/// union backfill only when all three still match its own request.
struct Retention {
    files: Vec<(String, String)>,
    walk_complete: bool,
    cwd: String,
    include: Vec<String>,
}

/// Drained retention: moved bytes plus the stored contract for the skip check.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DrainedRetention {
    pub files: Vec<(String, String)>,
    pub walk_complete: bool,
    pub cwd: String,
    pub include: Vec<String>,
}

/// Live retentions plus drain tombstones (released tokens leave no trace).
#[derive(Default)]
struct ScanStore {
    live: HashMap<u64, Retention>,
    drained: HashSet<u64>,
}

static NEXT_TOKEN: AtomicU64 = AtomicU64::new(1);
static STORE: OnceLock<Mutex<ScanStore>> = OnceLock::new();

fn store() -> &'static Mutex<ScanStore> {
    STORE.get_or_init(|| Mutex::new(ScanStore::default()))
}

fn lock_store() -> std::sync::MutexGuard<'static, ScanStore> {
    match store().lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    }
}

/// Mint a token for a non-empty retention (moves the bytes into the store
/// with the asserted contract); empty retentions omit the token so compile
/// falls back to the disk scan.
pub(super) fn mint(request: &ScanRequest, retained: Vec<RetainedFile>) -> Option<u64> {
    if !request.retain || retained.is_empty() {
        return None;
    }
    let token = NEXT_TOKEN.fetch_add(1, Ordering::SeqCst);
    let files = retained
        .into_iter()
        .map(|file| (file.path, file.content))
        .collect();
    lock_store().live.insert(
        token,
        Retention {
            files,
            walk_complete: request.walk_complete,
            cwd: request.cwd.clone(),
            include: request.include.clone(),
        },
    );
    Some(token)
}

/// Drain a live retention (moves the bytes plus the contract out, leaves a
/// tombstone); unknown or already-drained tokens fail loud, never a silent
/// disk fallback.
pub fn drain(token: u64) -> Result<DrainedRetention, TokenError> {
    let mut store = lock_store();
    if let Some(retained) = store.live.remove(&token) {
        store.drained.insert(token);
        return Ok(DrainedRetention {
            files: retained.files,
            walk_complete: retained.walk_complete,
            cwd: retained.cwd,
            include: retained.include,
        });
    }
    if store.drained.contains(&token) {
        return Err(TokenError::Drained(token));
    }
    Err(TokenError::Unknown(token))
}

/// Release a live retention without draining (the error-path-only `finally`);
/// idempotent: missing and drained tokens report false, never an error.
pub fn release(token: u64) -> bool {
    lock_store().live.remove(&token).is_some()
}
