//! Process-side retention store behind the C3-in-reverse scan token.
//! Takes retained file bytes and emits a monotonic token; compile drains the
//! bytes (moves, never clones) while drain tombstones fail loud on reuse.
//! Released tokens leave no trace; unknown tokens never fall back to disk.

use std::collections::{HashMap, HashSet};
use std::sync::{
    atomic::{AtomicU64, Ordering},
    Mutex, OnceLock,
};

use super::{RetainedFile, TokenError};

/// Live retentions plus drain tombstones (released tokens leave no trace).
#[derive(Default)]
struct ScanStore {
    live: HashMap<u64, Vec<(String, String)>>,
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

/// Mint a token for a non-empty retention (moves the bytes into the store);
/// empty retentions omit the token so compile falls back to the disk scan.
pub(super) fn mint(retain: bool, retained: Vec<RetainedFile>) -> Option<u64> {
    if !retain || retained.is_empty() {
        return None;
    }
    let token = NEXT_TOKEN.fetch_add(1, Ordering::SeqCst);
    let owned = retained
        .into_iter()
        .map(|file| (file.path, file.content))
        .collect();
    lock_store().live.insert(token, owned);
    Some(token)
}

/// Drain a live retention (moves the bytes out, leaves a tombstone); unknown
/// or already-drained tokens fail loud, never a silent disk fallback.
pub fn drain(token: u64) -> Result<Vec<(String, String)>, TokenError> {
    let mut store = lock_store();
    if let Some(retained) = store.live.remove(&token) {
        store.drained.insert(token);
        return Ok(retained);
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
