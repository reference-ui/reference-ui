//! Lane policy: how many workers a phase may spawn, and single-flight entry.
//!
//! Every pool site plans through [`Lanes`], then enters through [`LanePlan::enter`].
//! Small compiles stay on the caller with no spawn; large ones shard over at most
//! [`MAX_AUTO_LANES`] lanes. The [`PoolGuard`] a spawning phase holds is `!Send + !Sync`,
//! so worker closures cannot capture it and pool-inside-pool fails to compile; same-thread
//! re-entry panics on the in-flight flag instead of oversubscribing.

use std::cell::Cell;
use std::num::NonZeroUsize;
use std::rc::Rc;

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
mod tests {
    use super::*;

    /// Auto plan over `work` units on a 16-lane box.
    fn auto(kind: WorkKind, work: usize) -> LanePlan {
        Lanes::Auto.plan_with(kind, work, 16)
    }

    #[test]
    fn front_threshold_boundary() {
        assert_eq!(auto(WorkKind::FrontFiles, 63).workers().get(), 1);
        assert!(auto(WorkKind::FrontFiles, 63).enter().is_none());
        assert_eq!(auto(WorkKind::FrontFiles, 64).workers().get(), 8);
    }

    #[test]
    fn tail_threshold_boundary() {
        assert_eq!(auto(WorkKind::TailWants, 3999).workers().get(), 1);
        assert!(auto(WorkKind::TailWants, 3999).enter().is_none());
        assert_eq!(auto(WorkKind::TailWants, 4000).workers().get(), 8);
    }

    #[test]
    fn one_core_box_never_spawns() {
        for kind in [WorkKind::FrontFiles, WorkKind::TailWants] {
            let plan = Lanes::Auto.plan_with(kind, 100_000, 1);
            assert_eq!(plan.workers().get(), 1);
            assert!(plan.enter().is_none());
        }
    }

    #[test]
    fn missing_parallelism_plans_inline() {
        let plan = Lanes::Auto.plan_with(WorkKind::TailWants, 100_000, 0);
        assert_eq!(plan.workers().get(), 1);
    }

    #[test]
    fn oversubscription_caps_at_eight() {
        for available in [8, 16, 64, 128] {
            let plan = Lanes::Auto.plan_with(WorkKind::TailWants, 100_000, available);
            assert_eq!(plan.workers().get(), available.min(8));
        }
        let plan = Lanes::Auto.plan_with(WorkKind::FrontFiles, 100_000, 4);
        assert_eq!(plan.workers().get(), 4);
    }

    #[test]
    fn fixed_pins_and_clamps_to_work() {
        let small = Lanes::fixed(8).plan_with(WorkKind::FrontFiles, 3, 16);
        assert_eq!(small.workers().get(), 3);
        let big = Lanes::fixed(8).plan_with(WorkKind::TailWants, 100_000, 1);
        assert_eq!(big.workers().get(), 8);
        let one = Lanes::fixed(1).plan_with(WorkKind::TailWants, 100_000, 16);
        assert!(one.enter().is_none());
        let zero_pin = Lanes::fixed(0).plan_with(WorkKind::FrontFiles, 100, 16);
        assert_eq!(zero_pin.workers().get(), 1);
        let zero_work = Lanes::fixed(8).plan_with(WorkKind::FrontFiles, 0, 16);
        assert!(zero_work.enter().is_none());
    }

    #[test]
    fn zero_work_is_inline() {
        for kind in [WorkKind::FrontFiles, WorkKind::TailWants] {
            assert!(Lanes::Auto.plan_with(kind, 0, 16).enter().is_none());
        }
    }

    #[test]
    fn force_serial_collapses_auto() {
        let _hold = hold_force_serial();
        let plan = Lanes::Auto.plan_with(WorkKind::TailWants, 100_000, 16);
        assert_eq!(plan.workers().get(), 1);
    }

    #[test]
    fn forced_count_pins_and_bypasses_threshold() {
        force_lane_count(Some(4));
        let plan = Lanes::Auto.plan_with(WorkKind::FrontFiles, 8, 16);
        assert_eq!(plan.workers().get(), 4);
        assert!(plan.enter().is_some());
        force_lane_count(Some(8));
        let clamped = Lanes::Auto.plan_with(WorkKind::FrontFiles, 3, 16);
        assert_eq!(clamped.workers().get(), 3);
        force_lane_count(None);
        let plan = Lanes::Auto.plan_with(WorkKind::FrontFiles, 8, 16);
        assert_eq!(plan.workers().get(), 1);
    }

    #[test]
    fn forced_serial_wins_over_forced_count() {
        force_lane_count(Some(4));
        let _hold = hold_force_serial();
        let plan = Lanes::Auto.plan_with(WorkKind::FrontFiles, 100, 16);
        assert_eq!(plan.workers().get(), 1);
        assert!(plan.enter().is_none());
        force_lane_count(None);
    }

    #[test]
    fn sequential_pools_reenter() {
        let plan = Lanes::fixed(8).plan_with(WorkKind::FrontFiles, 100, 16);
        drop(plan.enter());
        assert!(plan.enter().is_some());
    }

    #[test]
    #[should_panic(expected = "single-flight")]
    fn nested_entry_panics() {
        let plan = Lanes::fixed(8).plan_with(WorkKind::FrontFiles, 100, 16);
        let _outer = plan.enter();
        let _ = plan.enter();
    }

    #[test]
    fn workers_need_no_guard_capture() {
        let plan = Lanes::fixed(2).plan_with(WorkKind::FrontFiles, 4, 16);
        let guard = plan.enter().expect("two lanes spawn");
        let workers = guard.workers().get();
        std::thread::scope(|scope| {
            let handle = scope.spawn(|| workers * 2);
            assert_eq!(handle.join().expect("worker joins"), workers * 2);
        });
    }
}
