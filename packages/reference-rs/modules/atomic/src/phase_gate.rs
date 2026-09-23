//! Join-based rendezvous between the parallel-phase coordinator and its lanes.
//!
//! Each lane reports completion over its own channel and then waits for the
//! coordinator's verdict; the coordinator awaits one report per lane per round
//! and then broadcasts. A dead lane fails its receive instead of hanging the
//! round, and lanes only ever wait on coordinator-owned senders, so a dead
//! coordinator releases them by dropping those senders during unwind.

use std::sync::mpsc::{self, Receiver, Sender};

/// Coordinator verdict at each rendezvous: run the next stage, or stop.
/// Lanes exit quietly on [`PhaseCmd::Abort`]; the coordinator sends it after a
/// sibling dies, then joins every lane instead of awaiting more reports.
#[derive(Clone, Copy)]
pub(crate) enum PhaseCmd {
    Proceed,
    Abort,
}

/// Which stage report a dead lane never sent. Names the round the coordinator
/// was awaiting, so the compile error says where the lane died.
pub(crate) enum Stage {
    Record,
    Refs,
    Walk,
}

impl Stage {
    /// Short stage name for the failure message.
    pub(crate) fn name(&self) -> &'static str {
        match self {
            Stage::Record => "record",
            Stage::Refs => "refs",
            Stage::Walk => "walk",
        }
    }
}

/// A lane that died mid-phase: its index plus the stage it never reported.
/// The coordinator returns this as the compile error; it never resumes the
/// lane's panic onto the caller.
pub(crate) struct LaneFailure {
    lane: usize,
    stage: Stage,
}

impl LaneFailure {
    /// The dead lane's index and the stage it died in.
    pub(crate) fn new(lane: usize, stage: Stage) -> Self {
        Self { lane, stage }
    }

    /// Compile error for the aborted phase. No partial output is committed: a
    /// dead lane means an invariant broke, so the compile fails loudly.
    pub(crate) fn message(&self) -> String {
        format!(
            "parallel phase: lane {} panicked during {}; compile aborted",
            self.lane,
            self.stage.name()
        )
    }
}

/// Lane-owned half of one rendezvous link, moved into the lane thread. The
/// lane sends exactly one report per round, then blocks for the verdict;
/// disconnect means the coordinator died, which also reads as exit.
pub(crate) struct LaneGate {
    report: Sender<()>,
    cmd: Receiver<PhaseCmd>,
}

impl LaneGate {
    /// Report this round complete and wait for the coordinator's verdict.
    /// Returns false when the lane must exit: abort broadcast, or the
    /// coordinator died and its senders dropped.
    pub(crate) fn rendezvous(&self) -> bool {
        let _ = self.report.send(());
        matches!(self.cmd.recv(), Ok(PhaseCmd::Proceed))
    }

    /// Report the final round complete. The lane exits without waiting; the
    /// coordinator joins it after collecting every final report.
    pub(crate) fn finish(&self) {
        let _ = self.report.send(());
    }
}

/// Coordinator-owned half of one rendezvous link, kept on the caller. The
/// coordinator receives exactly one report per lane per round; a failed
/// receive means that lane panicked, never that it is merely slow.
pub(crate) struct CoordGate {
    report: Receiver<()>,
    cmd: Sender<PhaseCmd>,
}

impl CoordGate {
    /// Wait for this lane's round report. `Err` iff the lane died mid-round.
    pub(crate) fn await_report(&self) -> Result<(), ()> {
        self.report.recv().map_err(|_| ())
    }

    /// Send one verdict. A failed send means the lane already died, which the
    /// coordinator already recorded via its report channel; not an error.
    pub(crate) fn command(&self, cmd: PhaseCmd) {
        let _ = self.cmd.send(cmd);
    }
}

/// The rendezvous links for a whole phase: one lane half per lane thread,
/// plus the coordinator halves in the same lane order.
pub(crate) struct Links {
    pub lanes: Vec<LaneGate>,
    pub coord: Vec<CoordGate>,
}

/// One rendezvous link per lane. Lane halves move into the lane threads;
/// coordinator halves stay on the caller.
pub(crate) fn links(count: usize) -> Links {
    let mut lanes = Vec::with_capacity(count);
    let mut coord = Vec::with_capacity(count);
    for _ in 0..count {
        let (report_tx, report_rx) = mpsc::channel();
        let (cmd_tx, cmd_rx) = mpsc::channel();
        lanes.push(LaneGate {
            report: report_tx,
            cmd: cmd_rx,
        });
        coord.push(CoordGate {
            report: report_rx,
            cmd: cmd_tx,
        });
    }
    Links { lanes, coord }
}

/// Test-only panic injection (p0a): when one file's content carries `marker`,
/// panic the calling thread. Workers die mid-phase so the rendezvous must
/// abort; the coordinator dies in `publish` so the unwind path must release
/// the lanes. Production builds compile every call site away entirely.
#[cfg(test)]
pub(crate) fn panic_marker(content: &str, marker: &str) {
    if content.contains(marker) {
        panic!("p0a injected panic for marker {marker}");
    }
}
