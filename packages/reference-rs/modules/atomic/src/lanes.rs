//! Lane policy: how many workers a phase may spawn, and single-flight entry.
//!
//! Every pool site plans through [`Lanes`], then enters through [`LanePlan::enter`].
//! Small compiles stay on the caller with no spawn; large ones shard over at most
//! [`MAX_AUTO_LANES`] lanes. The [`PoolGuard`] a spawning phase holds is `!Send + !Sync`,
//! so worker closures cannot capture it and pool-inside-pool fails to compile; same-thread
//! re-entry panics on the in-flight flag instead of oversubscribing. Lane threads come from [`spawn_lane`],
//! which gives each one [`LANE_STACK`], so a deep program has room inside its lane. A lane start the OS
//! refuses (strict overcommit or a tight ulimit) retries at half that stack, down to [`LANE_STACK_FLOOR`].

use std::any::Any;
use std::cell::Cell;
use std::io;
use std::num::NonZeroUsize;
use std::rc::Rc;
use std::sync::{Arc, Mutex, PoisonError};
use std::thread::{Builder, Scope, ScopedJoinHandle};

/// Stack for each spawned lane: deep input recursion stays inside its lane instead of overflowing the 2 MiB default.
pub(crate) const LANE_STACK: usize = 64 << 20;

/// Smallest stack a refused lane start retries at. Halving stops here, so a start refused at this size panics. It is 16 MiB
/// because the nesting gate's backstops allow 8,192 levels, which Oxc needs up to 16 MiB to recurse through.
const LANE_STACK_FLOOR: usize = 16 << 20;

/// Styling files below this count never leave the caller (front phase).
pub(crate) const FRONT_SERIAL_BELOW: usize = 64;
/// Wants or declarations below this count never leave the caller (tail phases).
pub(crate) const TAIL_SERIAL_BELOW: usize = 4000;
/// The most lanes [`Lanes::Auto`] plans: the measured knee on the bench box.
pub(crate) const MAX_AUTO_LANES: usize = 8;

/// What a phase shards, selecting the serial threshold.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum WorkKind {
    /// Styling files through the parse/extract front phase.
    FrontFiles,
    /// Wants or declarations through a tail pool.
    TailWants,
}

impl WorkKind {
    /// Work below this count stays on the caller.
    fn serial_below(self) -> usize {
        match self {
            WorkKind::FrontFiles => FRONT_SERIAL_BELOW,
            WorkKind::TailWants => TAIL_SERIAL_BELOW,
        }
    }
}

/// Requested lane count. Production plans [`Lanes::Auto`]; tests pin [`Lanes::Fixed`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum Lanes {
    /// At most [`MAX_AUTO_LANES`] lanes, serial below the work threshold.
    Auto,
    /// Exactly this many lanes, clamped to the work. Bypasses the serial
    /// threshold so tests pin the lane path on small fixtures. Test-only
    /// until the request knob lands.
    #[cfg(test)]
    Fixed(NonZeroUsize),
}

impl Lanes {
    /// An explicit pin; zero clamps to one lane.
    #[cfg(test)]
    pub(crate) fn fixed(lanes: usize) -> Self {
        Self::Fixed(at_least_one(lanes))
    }

    /// Plan one phase over `work` units on this machine.
    pub(crate) fn plan(self, kind: WorkKind, work: usize) -> LanePlan {
        self.plan_with(kind, work, hardware_parallelism())
    }

    /// Plan one phase and enter when it spawns. `None` runs the serial path.
    pub(crate) fn guard(self, kind: WorkKind, work: usize) -> Option<PoolGuard> {
        self.plan(kind, work).enter()
    }

    /// Deterministic core: `available` is the hardware parallelism the
    /// production plan reads. One worker means inline on the caller.
    pub(crate) fn plan_with(self, kind: WorkKind, work: usize, available: usize) -> LanePlan {
        match self {
            Lanes::Auto => plan_auto(kind, work, available),
            #[cfg(test)]
            Lanes::Fixed(lanes) => plan_fixed(lanes, work),
        }
    }
}

/// The decided worker count for one phase: 1 runs inline with no spawn.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct LanePlan {
    workers: NonZeroUsize,
}

impl LanePlan {
    /// Workers this phase may use; 1 is the spawn-free inline path.
    #[cfg(test)]
    pub(crate) fn workers(self) -> NonZeroUsize {
        self.workers
    }

    /// Enter a spawning phase. `None` runs the serial path on the caller;
    /// `Some` holds the single-flight guard. Panics on nested entry.
    pub(crate) fn enter(&self) -> Option<PoolGuard> {
        if self.workers.get() == 1 {
            return None;
        }
        if IN_FLIGHT.with(|flag| flag.replace(true)) {
            panic!("cores: nested pool entry; phases are single-flight");
        }
        count_entry();
        Some(PoolGuard {
            workers: self.workers,
            _unsend: std::marker::PhantomData::<Rc<()>>,
        })
    }
}

/// Entry permit for a spawning phase. The marker makes it `!Send + !Sync`,
/// so no worker closure can capture it: a nested pool needs this guard and
/// cannot name it off-thread. Dropping releases the single-flight flag.
#[derive(Debug)]
pub(crate) struct PoolGuard {
    workers: NonZeroUsize,
    _unsend: std::marker::PhantomData<Rc<()>>,
}

impl PoolGuard {
    /// Workers the plan granted; always at least two.
    pub(crate) fn workers(&self) -> NonZeroUsize {
        self.workers
    }
}

impl Drop for PoolGuard {
    fn drop(&mut self) {
        IN_FLIGHT.with(|flag| flag.set(false));
    }
}

std::thread_local! {
    /// True while this thread runs inside a spawning phase.
    static IN_FLIGHT: Cell<bool> = const { Cell::new(false) };
}

/// Spawn one lane inside `scope` on a thread with [`LANE_STACK`]. A refused start retries at half the stack,
/// down to [`LANE_STACK_FLOOR`]; a start refused at the floor panics, naming the last stack tried, and the
/// native containment turns that panic into a JS error.
pub(crate) fn spawn_lane<'scope, 'env, T: Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    body: impl FnOnce() -> T + Send + 'scope,
) -> ScopedJoinHandle<'scope, T> {
    spawn_with_fallback(scope, LANE_STACK, Builder::new, body)
        .unwrap_or_else(|err| panic!("cores: lane thread did not start: {err}"))
}

/// Spawns `body` inside `scope` with `stack` bytes, retrying each refusal at half the size until the floor.
/// The body is parked in a shared slot, because a refused start drops its closure unrun.
fn spawn_with_fallback<'scope, 'env, T: Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    stack: usize,
    builder: impl Fn() -> Builder,
    body: impl FnOnce() -> T + Send + 'scope,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    let parked = Arc::new(Mutex::new(Some(body)));
    let mut size = stack;
    loop {
        let source = match start_parked(scope, &builder, size, &parked) {
            Ok(handle) => return Ok(handle),
            Err(source) => source,
        };
        size = next_size(size).ok_or_else(|| named(source, size))?;
    }
}

/// Half of `size` while that stays at or above [`LANE_STACK_FLOOR`]; `None` once the floor was tried.
fn next_size(size: usize) -> Option<usize> {
    (size / 2 >= LANE_STACK_FLOOR).then_some(size / 2)
}

/// One start at `size`. Its closure takes the parked body on the new thread, so a refused start leaves
/// the body in the slot for the next size.
fn start_parked<'scope, 'env, T: Send + 'scope, F: FnOnce() -> T + Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    builder: &impl Fn() -> Builder,
    size: usize,
    parked: &Arc<Mutex<Option<F>>>,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    let slot = Arc::clone(parked);
    start_thread(scope, builder, size, move || take_and_run(&slot))
}

/// Takes the parked body and runs it on the thread whose start succeeded. Only that thread ever takes it,
/// so the slot is still full when the closure runs.
fn take_and_run<F: FnOnce() -> T, T>(slot: &Mutex<Option<F>>) -> T {
    let parked = slot.lock().unwrap_or_else(PoisonError::into_inner).take();
    match parked {
        Some(body) => body(),
        None => unreachable!("a parked body is taken once, by the thread that started"),
    }
}

/// One OS spawn at `stack` bytes. Under test a switch can refuse it before the OS is asked.
fn start_thread<'scope, 'env, T: Send + 'scope>(
    scope: &'scope Scope<'scope, 'env>,
    builder: &impl Fn() -> Builder,
    stack: usize,
    body: impl FnOnce() -> T + Send + 'scope,
) -> io::Result<ScopedJoinHandle<'scope, T>> {
    #[cfg(test)]
    if tests::test_refusal(stack) {
        return Err(io::Error::new(
            io::ErrorKind::OutOfMemory,
            "injected refusal",
        ));
    }
    builder().stack_size(stack).spawn_scoped(scope, body)
}

/// Keeps the refusal's kind and says which stack was the last one tried.
fn named(source: io::Error, stack: usize) -> io::Error {
    io::Error::new(
        source.kind(),
        format!("{source} (last stack tried: {} MiB)", stack >> 20),
    )
}

/// The text of a panic payload: `panic!` yields a `&str` or a `String`, anything else a placeholder.
pub(crate) fn panic_text(payload: &(dyn Any + Send)) -> &str {
    payload
        .downcast_ref::<&str>()
        .copied()
        .or_else(|| payload.downcast_ref::<String>().map(String::as_str))
        .unwrap_or("unknown panic payload")
}

/// The compile error a panicked lane becomes, named by the phase it served.
pub(crate) fn lane_panic(phase: &str, payload: &(dyn Any + Send)) -> String {
    format!(
        "{phase} phase: lane panicked ({}); compile aborted",
        panic_text(payload)
    )
}

/// This machine's parallelism, at least one.
fn hardware_parallelism() -> usize {
    std::thread::available_parallelism()
        .map(|count| count.get())
        .unwrap_or(1)
        .max(1)
}

/// At least one lane: zero work or zero hardware still plans the inline path.
fn at_least_one(workers: usize) -> NonZeroUsize {
    NonZeroUsize::new(workers).unwrap_or(NonZeroUsize::MIN)
}

/// Auto: serial below the threshold, else the hardware capped at eight lanes.
/// Tests may pin an exact count through [`force_lane_count`]; forced-serial
/// still wins, so a held serial guard always collapses to one lane.
fn plan_auto(kind: WorkKind, work: usize, available: usize) -> LanePlan {
    #[cfg(test)]
    if forced_serial() {
        return LanePlan {
            workers: NonZeroUsize::MIN,
        };
    }
    #[cfg(test)]
    if let Some(forced) = FORCE_LANES.with(|flag| flag.get()) {
        return LanePlan {
            workers: at_least_one(forced.min(work)),
        };
    }
    if work < kind.serial_below() {
        return LanePlan {
            workers: NonZeroUsize::MIN,
        };
    }
    LanePlan {
        workers: at_least_one(available.min(MAX_AUTO_LANES).min(work)),
    }
}

/// Fixed: the pin clamped to the work, so no lane idles.
#[cfg(test)]
fn plan_fixed(lanes: NonZeroUsize, work: usize) -> LanePlan {
    LanePlan {
        workers: at_least_one(lanes.get().min(work)),
    }
}

fn count_entry() {
    #[cfg(test)]
    ENTERED.with(|count| count.set(count.get() + 1));
}

#[cfg(test)]
std::thread_local! {
    /// Test switch forcing [`Lanes::Auto`] to plan one lane. Dies with the
    /// request knob; until then the lane/serial differential needs it.
    static FORCE_SERIAL: Cell<bool> = const { Cell::new(false) };
    /// Spawning entries on this thread: proves a test took the lane path.
    static ENTERED: Cell<u64> = const { Cell::new(0) };
    /// Test-only lane-count override: force [`Lanes::Auto`] onto `Some(count)`
    /// lanes, clamped to the work. Port of p0a's `force_worker_count`; serial wins.
    static FORCE_LANES: Cell<Option<usize>> = const { Cell::new(None) };
}

#[cfg(test)]
fn forced_serial() -> bool {
    FORCE_SERIAL.with(|flag| flag.get())
}

/// Test-only lane-count override (see `FORCE_LANES`).
#[cfg(test)]
pub(crate) fn force_lane_count(count: Option<usize>) {
    FORCE_LANES.with(|flag| flag.set(count));
}

/// Holds forced-serial until dropped, so a panicking test cannot leak the
/// flag to the next test on this thread.
#[cfg(test)]
pub(crate) struct SerialHold;

#[cfg(test)]
pub(crate) fn hold_force_serial() -> SerialHold {
    FORCE_SERIAL.with(|flag| flag.set(true));
    SerialHold
}

#[cfg(test)]
impl Drop for SerialHold {
    fn drop(&mut self) {
        FORCE_SERIAL.with(|flag| flag.set(false));
    }
}

/// Spawning entries on this thread (tests only).
#[cfg(test)]
pub(crate) fn entered_spawns() -> u64 {
    ENTERED.with(|count| count.get())
}

#[cfg(test)]
#[path = "lanes_tests.rs"]
mod tests;
