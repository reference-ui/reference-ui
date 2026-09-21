//! Rootless macOS counter bindings for the `counters-trace` instrument build.
//! It snapshots four sources the span reads: the libproc rusage info word
//! table (instructions, cycles, pageins, disk bytes, footprint), the task
//! events counters (unix/mach syscalls, faults, messages, switches), the
//! plain rusage words (fault and switch splits), and the per-thread CPU table.
//! Buffers are plain word arrays indexed by header-verified constants (every
//! offset confirmed by a C probe: rusage 144 bytes, rusage_info_v4 296 bytes
//! with instructions at byte 248 and cycles at 256, eight event words); only
//! macOS implements the queries, other platforms snapshot all-`None`.

/// Query flavors and word-table indices for the macOS fetchers below. Event
/// words follow mach/task_info.h (unix syscalls at byte 24); rusage_info_v4
/// words 0-1 are the uuid, then the u64 counters in sys/resource.h order
/// (user at byte 16, pageins at 48, instructions at 248); rusage words are two
/// timevals plus the long counters in sys/resource.h order (minor faults at
/// byte 64, switches at 128/136). Gated as one module so other platforms keep
/// zero dead-code warnings.
#[cfg(target_os = "macos")]
mod words {
    pub const TASK_EVENTS_INFO: u32 = 2;
    pub const THREAD_BASIC_INFO: u32 = 3;
    pub const THREAD_IDENTIFIER_INFO: u32 = 4;
    pub const RUSAGE_INFO_V4: i32 = 4;
    pub const RUSAGE_SELF: i32 = 0;
    pub const KERN_SUCCESS: i32 = 0;
    pub const E_FAULTS: usize = 0;
    pub const E_PAGEINS: usize = 1;
    pub const E_COW_FAULTS: usize = 2;
    pub const E_MESSAGES_SENT: usize = 3;
    pub const E_MESSAGES_RECEIVED: usize = 4;
    pub const E_SYSCALLS_MACH: usize = 5;
    pub const E_SYSCALLS_UNIX: usize = 6;
    pub const E_CSW: usize = 7;
    pub const I_USER_TIME: usize = 2;
    pub const I_SYSTEM_TIME: usize = 3;
    pub const I_INTERRUPT_WKUPS: usize = 5;
    pub const I_PAGEINS: usize = 6;
    pub const I_RESIDENT_SIZE: usize = 8;
    pub const I_PHYS_FOOTPRINT: usize = 9;
    pub const I_DISKIO_READ: usize = 18;
    pub const I_DISKIO_WRITTEN: usize = 19;
    pub const I_LIFETIME_MAX_FOOTPRINT: usize = 30;
    pub const I_INSTRUCTIONS: usize = 31;
    pub const I_CYCLES: usize = 32;
    pub const I_RUNNABLE_TIME: usize = 36;
    pub const R_UTIME_SEC: usize = 0;
    pub const R_UTIME_USEC: usize = 1;
    pub const R_STIME_SEC: usize = 2;
    pub const R_STIME_USEC: usize = 3;
    pub const R_MAXRSS: usize = 4;
    pub const R_MINFLT: usize = 8;
    pub const R_MAJFLT: usize = 9;
    pub const R_INBLOCK: usize = 11;
    pub const R_OUTBLOCK: usize = 12;
    pub const R_NVCSW: usize = 16;
    pub const R_NIVCSW: usize = 17;
}

#[cfg(target_os = "macos")]
use words::*;

#[cfg(target_os = "macos")]
extern "C" {
    static mach_task_self_: u32;
    fn task_info(task: u32, flavor: u32, out: *mut i32, count: *mut u32) -> i32;
    fn task_threads(task: u32, list: *mut *mut u32, count: *mut u32) -> i32;
    fn thread_info(thread: u32, flavor: u32, out: *mut i32, count: *mut u32) -> i32;
    fn mach_port_deallocate(task: u32, name: u32) -> i32;
    fn vm_deallocate(task: u32, address: u64, size: u64) -> i32;
    fn proc_pid_rusage(pid: i32, flavor: i32, buffer: *mut u64) -> i32;
    fn getrusage(who: i32, usage: *mut i64) -> i32;
}

/// Whole-task event counters in report shape.
#[derive(Clone, Copy, Default)]
pub struct TaskEvents {
    pub faults: i32,
    pub pageins: i32,
    pub cow_faults: i32,
    pub messages_sent: i32,
    pub messages_received: i32,
    pub syscalls_mach: i32,
    pub syscalls_unix: i32,
    pub csw: i32,
}

/// Libproc rusage fields the report reads, in report shape.
#[derive(Clone, Copy, Default)]
pub struct RusageInfo {
    pub user_ns: u64,
    pub system_ns: u64,
    pub interrupt_wkups: u64,
    pub pageins: u64,
    pub resident_size: u64,
    pub phys_footprint: u64,
    pub diskio_read: u64,
    pub diskio_written: u64,
    pub lifetime_max_footprint: u64,
    pub instructions: u64,
    pub cycles: u64,
    pub runnable_ns: u64,
}

/// Plain rusage fields the report reads, in report shape.
#[derive(Clone, Copy, Default)]
pub struct Rusage {
    pub user_usec: i64,
    pub system_usec: i64,
    pub maxrss: i64,
    pub minor_faults: i64,
    pub major_faults: i64,
    pub inblock: i64,
    pub outblock: i64,
    pub voluntary_csw: i64,
    pub involuntary_csw: i64,
}

/// One per-thread CPU row: the system-wide thread id plus user/system
/// microseconds from `thread_basic_info`. The id lets the harness match enter
/// rows to exit rows, so the top-thread share measures the window, not the
/// process lifetime.
#[derive(Clone, Copy, Default)]
pub struct ThreadRow {
    pub thread_id: u64,
    pub user_usec: u64,
    pub sys_usec: u64,
}

/// Whole-task thread digest: count plus the CPU table, hottest first.
#[derive(Clone, Default)]
pub struct ThreadDigest {
    pub count: u32,
    pub rows: Vec<ThreadRow>,
}

/// One raw reading across the snapshot sources; each leg is optional so a
/// failed query degrades to JSON null instead of failing the capture.
#[derive(Clone, Default)]
pub struct Snapshot {
    pub events: Option<TaskEvents>,
    pub info: Option<RusageInfo>,
    pub rusage: Option<Rusage>,
    pub threads: Option<ThreadDigest>,
}

/// Current task port via the libSystem `mach_task_self_` global.
#[cfg(target_os = "macos")]
fn task_port() -> u32 {
    unsafe { mach_task_self_ }
}

#[cfg(target_os = "macos")]
fn events_of(words: &[i32; 8]) -> TaskEvents {
    TaskEvents {
        faults: words[E_FAULTS],
        pageins: words[E_PAGEINS],
        cow_faults: words[E_COW_FAULTS],
        messages_sent: words[E_MESSAGES_SENT],
        messages_received: words[E_MESSAGES_RECEIVED],
        syscalls_mach: words[E_SYSCALLS_MACH],
        syscalls_unix: words[E_SYSCALLS_UNIX],
        csw: words[E_CSW],
    }
}

/// Whole-task event counters; `None` when the `task_info` call fails.
#[cfg(target_os = "macos")]
fn fetch_task_events() -> Option<TaskEvents> {
    let mut words = [0i32; 8];
    let mut count: u32 = 8;
    let result = unsafe { task_info(task_port(), TASK_EVENTS_INFO, words.as_mut_ptr(), &mut count) };
    (result == KERN_SUCCESS).then(|| events_of(&words))
}

#[cfg(target_os = "macos")]
fn info_of(words: &[u64; 37]) -> RusageInfo {
    RusageInfo {
        user_ns: words[I_USER_TIME],
        system_ns: words[I_SYSTEM_TIME],
        interrupt_wkups: words[I_INTERRUPT_WKUPS],
        pageins: words[I_PAGEINS],
        resident_size: words[I_RESIDENT_SIZE],
        phys_footprint: words[I_PHYS_FOOTPRINT],
        diskio_read: words[I_DISKIO_READ],
        diskio_written: words[I_DISKIO_WRITTEN],
        lifetime_max_footprint: words[I_LIFETIME_MAX_FOOTPRINT],
        instructions: words[I_INSTRUCTIONS],
        cycles: words[I_CYCLES],
        runnable_ns: words[I_RUNNABLE_TIME],
    }
}

/// Libproc rusage snapshot; zero return means success, like the C API.
#[cfg(target_os = "macos")]
fn fetch_rusage_info() -> Option<RusageInfo> {
    let mut words = [0u64; 37];
    let result = unsafe { proc_pid_rusage(std::process::id() as i32, RUSAGE_INFO_V4, words.as_mut_ptr()) };
    (result == 0).then(|| info_of(&words))
}

#[cfg(target_os = "macos")]
fn rusage_of(words: &[i64; 18]) -> Rusage {
    Rusage {
        user_usec: words[R_UTIME_SEC] * 1_000_000 + words[R_UTIME_USEC],
        system_usec: words[R_STIME_SEC] * 1_000_000 + words[R_STIME_USEC],
        maxrss: words[R_MAXRSS],
        minor_faults: words[R_MINFLT],
        major_faults: words[R_MAJFLT],
        inblock: words[R_INBLOCK],
        outblock: words[R_OUTBLOCK],
        voluntary_csw: words[R_NVCSW],
        involuntary_csw: words[R_NIVCSW],
    }
}

/// Plain rusage snapshot; zero return means success.
#[cfg(target_os = "macos")]
fn fetch_rusage() -> Option<Rusage> {
    let mut words = [0i64; 18];
    let result = unsafe { getrusage(RUSAGE_SELF, words.as_mut_ptr()) };
    (result == 0).then(|| rusage_of(&words))
}

/// System-wide id for one thread port via `thread_identifier_info` (three
/// u64 words; the count is six naturals). `None` when the query fails.
#[cfg(target_os = "macos")]
fn fetch_thread_id(port: u32) -> Option<u64> {
    let mut out = [0u64; 3];
    let mut count: u32 = 6;
    let result = unsafe {
        thread_info(
            port,
            THREAD_IDENTIFIER_INFO,
            out.as_mut_ptr() as *mut i32,
            &mut count,
        )
    };
    (result == KERN_SUCCESS).then_some(out[0])
}

/// CPU row for one thread port; the out buffer holds `thread_basic_info`
/// (user/sec/usec, system/sec/usec, then six status words).
#[cfg(target_os = "macos")]
fn fetch_thread_row(port: u32) -> Option<ThreadRow> {
    let mut out = [0i32; 10];
    let mut count: u32 = 10;
    let result = unsafe { thread_info(port, THREAD_BASIC_INFO, out.as_mut_ptr(), &mut count) };
    if result != KERN_SUCCESS {
        return None;
    }
    Some(ThreadRow {
        thread_id: fetch_thread_id(port).unwrap_or(0),
        user_usec: out[0] as u64 * 1_000_000 + out[1] as u64,
        sys_usec: out[2] as u64 * 1_000_000 + out[3] as u64,
    })
}

/// Thread digest: enumerate the task's threads, read each CPU row, then
/// release every port and the kernel-allocated list. Rows come out hottest
/// first so the report can read the top share straight off.
#[cfg(target_os = "macos")]
fn fetch_threads() -> Option<ThreadDigest> {
    let port = task_port();
    let mut list: *mut u32 = std::ptr::null_mut();
    let mut count: u32 = 0;
    if unsafe { task_threads(port, &mut list, &mut count) } != KERN_SUCCESS {
        return None;
    }
    let mut rows = Vec::new();
    if !list.is_null() {
        for index in 0..count {
            let thread = unsafe { *list.add(index as usize) };
            if let Some(row) = fetch_thread_row(thread) {
                rows.push(row);
            }
            unsafe { mach_port_deallocate(port, thread) };
        }
        unsafe { vm_deallocate(port, list as u64, count as u64 * 4) };
    }
    rows.sort_by(|a, b| (b.user_usec + b.sys_usec).cmp(&(a.user_usec + a.sys_usec)));
    Some(ThreadDigest { count, rows })
}

/// One raw reading across every source; non-macOS snapshots all-`None`.
pub fn snapshot_all() -> Snapshot {
    #[cfg(target_os = "macos")]
    {
        Snapshot {
            events: fetch_task_events(),
            info: fetch_rusage_info(),
            rusage: fetch_rusage(),
            threads: fetch_threads(),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Snapshot::default()
    }
}
