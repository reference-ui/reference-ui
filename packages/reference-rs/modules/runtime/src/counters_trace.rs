//! Compile-span guard for the `counters-trace` instrument build.
//! It snapshots the rootless Mach/rusage counters at compile entry and exit,
//! then dumps the raw before/after pair as one JSON report on drop when
//! `COUNTERS_TRACE_OUT` names a file. Without the env var it snapshots
//! silently. The harness derives deltas, ratios, and verdicts from the dump.
//! This module only exists with the feature enabled, so the shipped `.node`
//! never pays for the snapshots.

use std::fs;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::Instant;

use super::counters_abi::{Rusage, RusageInfo, Snapshot, TaskEvents, ThreadDigest, snapshot_all};

/// Env var naming the JSON file the span guard dumps at compile end.
pub const TRACE_OUT_ENV: &str = "COUNTERS_TRACE_OUT";

static SPAN_CALLS: AtomicU64 = AtomicU64::new(0);
static SPAN_ACTIVE: AtomicBool = AtomicBool::new(false);

/// RAII span around one blocking compile call. Nested enters degrade to no-ops
/// so only the outermost call dumps; the call count still records every enter.
pub struct CountersSpan {
    started: Instant,
    start_unix_ms: u64,
    before: Snapshot,
    active: bool,
}

/// Wall-clock milliseconds for placing the span against harness-side logs.
/// Falls back to zero when the system clock predates the epoch.
fn unix_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|elapsed| elapsed.as_millis() as u64)
        .unwrap_or(0)
}

impl CountersSpan {
    pub fn enter() -> Self {
        let active = !SPAN_ACTIVE.swap(true, Ordering::Relaxed);
        if active {
            SPAN_CALLS.fetch_add(1, Ordering::Relaxed);
        }
        Self {
            started: Instant::now(),
            start_unix_ms: unix_ms(),
            before: snapshot_all(),
            active,
        }
    }
}

impl Drop for CountersSpan {
    fn drop(&mut self) {
        if !self.active {
            return;
        }
        SPAN_ACTIVE.store(false, Ordering::Relaxed);
        finish_span(self);
    }
}

fn events_value(events: &Option<TaskEvents>) -> serde_json::Value {
    match events {
        Some(counts) => serde_json::json!({
            "faults": counts.faults,
            "pageins": counts.pageins,
            "cowFaults": counts.cow_faults,
            "messagesSent": counts.messages_sent,
            "messagesReceived": counts.messages_received,
            "syscallsMach": counts.syscalls_mach,
            "syscallsUnix": counts.syscalls_unix,
            "csw": counts.csw,
        }),
        None => serde_json::Value::Null,
    }
}

fn info_value(info: &Option<RusageInfo>) -> serde_json::Value {
    match info {
        Some(usage) => serde_json::json!({
            "userNs": usage.user_ns,
            "systemNs": usage.system_ns,
            "interruptWkups": usage.interrupt_wkups,
            "pageins": usage.pageins,
            "residentSize": usage.resident_size,
            "physFootprint": usage.phys_footprint,
            "diskioBytesRead": usage.diskio_read,
            "diskioBytesWritten": usage.diskio_written,
            "lifetimeMaxPhysFootprint": usage.lifetime_max_footprint,
            "instructions": usage.instructions,
            "cycles": usage.cycles,
            "runnableNs": usage.runnable_ns,
        }),
        None => serde_json::Value::Null,
    }
}

fn rusage_value(usage: &Option<Rusage>) -> serde_json::Value {
    match usage {
        Some(usage) => serde_json::json!({
            "userUsec": usage.user_usec,
            "systemUsec": usage.system_usec,
            "maxRss": usage.maxrss,
            "minorFaults": usage.minor_faults,
            "majorFaults": usage.major_faults,
            "inBlock": usage.inblock,
            "outBlock": usage.outblock,
            "voluntaryCsw": usage.voluntary_csw,
            "involuntaryCsw": usage.involuntary_csw,
        }),
        None => serde_json::Value::Null,
    }
}

fn thread_rows(digest: &ThreadDigest) -> Vec<serde_json::Value> {
    digest
        .rows
        .iter()
        .map(|row| {
            serde_json::json!({ "threadId": row.thread_id, "userUsec": row.user_usec, "sysUsec": row.sys_usec })
        })
        .collect()
}

fn threads_value(digest: &Option<ThreadDigest>) -> serde_json::Value {
    match digest {
        Some(digest) => serde_json::json!({ "count": digest.count, "rows": thread_rows(digest) }),
        None => serde_json::Value::Null,
    }
}

fn snapshot_value(snapshot: &Snapshot) -> serde_json::Value {
    serde_json::json!({
        "taskEvents": events_value(&snapshot.events),
        "rusageInfo": info_value(&snapshot.info),
        "rusage": rusage_value(&snapshot.rusage),
        "threads": threads_value(&snapshot.threads),
    })
}

fn trace_out_path() -> Option<String> {
    match std::env::var(TRACE_OUT_ENV) {
        Ok(path) if !path.is_empty() => Some(path),
        _ => None,
    }
}

fn write_report(path: &str, report: &serde_json::Value) {
    let text = match serde_json::to_string_pretty(report) {
        Ok(text) => text,
        Err(err) => {
            eprintln!("[counters-trace] failed to serialize report: {err}");
            return;
        }
    };
    if let Err(err) = fs::write(path, text) {
        eprintln!("[counters-trace] failed to write {path}: {err}");
    }
}

fn finish_span(span: &CountersSpan) {
    let after = snapshot_all();
    let report = serde_json::json!({
        "schema": 1,
        "supported": cfg!(target_os = "macos"),
        "spans": SPAN_CALLS.load(Ordering::Relaxed),
        "span": {
            "wallMs": span.started.elapsed().as_secs_f64() * 1000.0,
            "startUnixMs": span.start_unix_ms,
            "endUnixMs": unix_ms(),
            "before": snapshot_value(&span.before),
            "after": snapshot_value(&after),
        },
    });
    if let Some(path) = trace_out_path() {
        write_report(&path, &report);
    }
}
