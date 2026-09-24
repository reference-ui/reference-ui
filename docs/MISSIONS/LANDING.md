# LANDING — lib hardening voyage (split from VOYAGE 2026-09-23)

> **PARKED 2026-09-24 (HQ order): Neo/systems day — W4 + polish. No crews, no action. Resume on HQ call.**

HQ split the lib work out of VOYAGE: once hardening begins, that is a
landing sequence, not exploration. VOYAGE signs off reference-rs and
reference-neo; LANDING productionizes reference-lib on top of the
landed engine.

Logs: [LOG-4.md](./LOG-4.md) (tooltip preset) and [LOG-5.md](./LOG-5.md)
(lib productization), adopted from the voyage. Landing law: one commit
per component (Objective B); single checklist commit (Objective A).

## Objective A — tooltip focus preset (interaction contract)

Land the tooltip focus-preset conformance fix — and only that. The
baselines this objective used to own are frozen by the 2026-09-22
suite-wide repin instead; this objective is the one known interaction
contract, executed blind from its doc.

Work: [docs/MISSIONS/TOOLTIP_FOCUS_PRESET.md](./docs/MISSIONS/TOOLTIP_FOCUS_PRESET.md)
— gate Tooltip focus-open on focus-visible, migrate the 4 CT tests
from programmatic `.focus()` to real Tab, add the TT-FOCUS-03
regression test (mouse-opened dialog must not pop the tip), mark
TT-FOCUS-01/03 proven in SPEC. Touch nothing else: no FocusLock, no
Overlay, no new props, no snapshot re-pins (visuals must not move —
the repinned baselines are the proof).

Swarm shape: single small crew — implementers land the checklist,
reviewers verify via `test-component` (`pnpm agentct Tooltip`).
Every agent loads its governing skill first.

Done when: the checklist is complete, Tooltip CT is green on
unmodified baselines, and the regression test pins the mouse-open
behavior.

## Objective B — reference lib productization (final)

Ship the productionized reference lib — every component tested,
hardened, and landed as clean, engine-grade source. The quarantine
corpus (`components-quarantine`, recon filed) is the primary raw
material: tests and hardening patterns to re-target, not to copy.
The frozen repin baselines are the oracle, but the two gates differ:

- **Visuals: frozen.** Components must match the frozen snapshot
  baselines. Any paint/motion/chrome drift fails — no exceptions.
- **Interactions: reviewable.** Productionization may have enhanced
  interactions (especially accessibility). Each change goes to the
  `ux-designer` skill, which weighs it: genuine enhancement →
  approved with rationale; behavior loss → fail.

The `ux-designer` skill is the sign-off authority, briefed per
component with this voyage's frozen-visuals constraint. It spins
components up through `view-story`, watches CT videos, reads snapshot
diffs, plays with the component, and rules per component. A component
lands only on UX sign-off plus green tests. Snapshot re-pins still
need the human yes per `test-component` rules — UX recommends, the
human confirms.

Shape bar: the output must read like an engine. Files stay small
(150 LOC max, aim 80), concerns separated, big container components
composing neatly abstracted parts. No automated lib quality CLI exists
(verified 2026-09-22 — RS and Neo have gates, lib has typecheck +
tests only), so reviewer crews enforce the bar by hand; standing up a
lib gate is flagged follow-up, not tonight's machinery.

Depends on: quarantine recon report (filed at
[docs/MISSIONS/QUARANTINE_RECON.md](./docs/MISSIONS/QUARANTINE_RECON.md))
+ frozen repin baselines and Objective A (tooltip preset). Per component: apply, run the frozen
baseline suite, diff snapshots/videos/interactions, pass UX review,
then land.

Execution: one shared tree, no worktrees. Each crew owns its
component's files strictly and lands **one commit per component**.
Order root-first: Overlay first, then widen parallelism wave by wave
as components become independent. The captain sequences the waves.

Done when: quarantine productionization applied across lib, every
component UX-signed, baselines green, one commit each.
