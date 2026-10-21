//! Lane policy tests: work thresholds, planning arithmetic, and single-flight entry.
//! The forced-lane switches here are the ones the differential suites use to pin a lane count.

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
