# VOYAGE — rolling perf swarm to 700 ms

## Destination

Enterprise `sync()` ≈ **700 ms** on the frozen seed-7 app load (3,000
files, 7,527 `css()` calls), from 1198 ms (wave-2 closed at ≈938 ms:
−260 across 24 diets, 6 arcs). Wave-3 re-scores on `pnpm bench:neo`
enterprise (pinned latest 1.05s committing every landing's report).
Panda v2 beta.18 holds 645 ms on the same locked load — that is the
goalpost, never the architecture: do not copy Panda's output, do not
weaken diagnostics or harvest doctrine to win milliseconds.
Scoreboard, history, and dead ends live in LOG.md; every verdict
ever filed lives in the perf index (`pnpm agentperf search`).

Honest arithmetic (repro2, filed): known ranked ceilings sum to ≈910
even stacking everything — 700 stays unreachable single-threaded by
≈200+. Each wave re-measures this on fresh flames instead of assuming.

## Ground (ref sync only)

The voyage measures exactly one thing: enterprise serial `sync()`
through `packages/reference-rs` — the Rust compiler, the N-API
seam, and the atomic style-extraction/compilation path wherever it
runs (including the compile path through reference-neo). Flames
point at reference-rs; the seam is in scope and unexamined, not
assumed fine. MCP/TS surfaces — import latency, search latency,
bundle bytes — are out of scope unless HQ widens in writing. A diet
with 0 sync ms is not a voyage yield however large its local
number, and no swarm generation briefs off-scope ground on its own
authority.

## The one benchmark

Frozen seed-7 app load (bench:neo enterprise: 3,000 files, 7,527
`css()` calls, 120 recipe groups). Metric: enterprise `sync()` ms
from `pnpm bench:neo`, seed-7 medians per protocol. Target ≈700.
Panda v2 beta.18 on the same locked load is the goalpost —
enterprise 645 ms / 261 MiB (small 18 ms, medium 68 ms; full table
in `Developer/panda-bench/reports/latest/`). Every landing commits
its benchmark report: run bench:neo on the clean landing tree, pin
`packages/reference-neo/benchmark/reports/<hash>/` (`result.json` +
`report.md`), commit it with the arc. Dirty-tree `latest/` runs are
iteration only, never the record. Scoreboard rows in LOG.md are the
voyage timeline. Auxiliary numbers (import ms, per-query µs, index
bytes) are supporting evidence, never the headline. If it isn't
bench:neo enterprise sync() ms, it isn't the voyage score.

Scope ruling (this round): a 14-lever swarm drifted onto MCP
icons-search ground. One LAND kept opportunistically
(raw-index-load: MCP import −160 ms, 0 sync ms); six BANKs parked
out of scope, unfiled. Ground re-fenced to sync() after.

## Start (fresh context)

1. Read this file + the agent-perf skill. That is the whole mission.
2. Launch `.agents/skills/agent-perf/scripts/voyage-swarm.mjs` via
   the Workflow tool (scriptPath): captain recon, 14-lever swarm,
   split integration, DX retro. Resume with scriptPath +
   resumeFromRunId; never retype the script.
3. Captain owns the run from there per Roles. HQ does not approve
   between waves (see Review cadence).

## Model

Rolling continuous swarm at **full complement**. Runtime cap is 8
agents including the captain, so the captain keeps **all 7 worker
slots filled whenever the backlog is non-empty** — never a thin 1–2
crew while topics wait uncrewed. A thin dispatch followed by a park
is the failure mode this section forbids: crews scan the whole tree
in parallel, and the swarm stays full until the backlog is genuinely
exhausted. Slots are held ONLY on proven empty backlog (with the
proof in LOG.md), because a thin crew costs lock rotations that
landing-confirms need.

A **wave** is one full cycle: fresh flames + burndown + ranked
backlog → full-complement swarm generation(s) → integrate and land
everything landable → per-commit report + flame refresh after every
landing → index rebuild + archive. The captain runs wave after wave
until HQ parks. One wave then park while ground remains unexplored
is never correct.

- Each crew = one hypothesis, one isolated worktree, one REPORT.md.
  Crews are disconnected: no chat, no shared branches. Shared state is
  exactly three things: LOG.md (read-only for crews), the claims file
  (append), the bench lock.
- **Rolling replacement.** The tick a crew files its REPORT.md
  verdict, the captain adjudicates (LAND → integrator, BANK → bank,
  CUT → decommission + release the worktree) and respawns the freed
  slot on the next backlog topic in the same tick. No idle slots
  while backlog remains.
- Counts first, always: exact census (≥2 identical runs) before any
  diet. A falsification bar in every brief; a fast, well-counted CUT is
  first-class. An implementor that cannot prove a benefit is
  **decommissioned**: CUT, cause, release the worktree.
- Sequenced work uses **verdict-gating** (wantctx pattern): census +
  design now, diet only after the gating verdict posts. Watch the
  claims file, never poll the crew — and never ping a working crew
  for vitals at all (star-captain §4: liveness from log writes +
  work products only; talk to stuck crews, never to moving ones).
- **Review cadence, no babysitting.** HQ is never asked between
  waves — progress is reported, never proposed. Every returning
  swarm and every merge posts a compact result (verdicts, numbers,
  commit sha) to LOG.md and to the chat. Health ticks carry status
  (landed / banked / cut / next dispatch since last review), not
  just safety. Focused green commits compound all day; HQ reads,
  rarely replies.
- On a LAND claim the captain spawns that crew's **integrator**
  (short-lived, own worktree, INTEGRATE.md verdict LAND/YIELD/HOLD).
  Banked sets of 3–7 go to a set integrator the same way. BANKs file
  patches under `docs/perf/waves/<wave>/*.patch` while unlanded.
- **Per-commit report + flame refresh (the timeline chain).** Every
  landing commit is followed, same tick, by (1) a bench:neo run on
  the clean tree, pinned + committed as the landing's benchmark
  report, (2) an enterprise re-profile report on the new tip
  (seed-7 medians, vs Panda, sha) appended as a LOG.md scoreboard
  row, and (3) a flame refresh (2+ reconciled captures filed under
  `docs/evidence/flamegraph/enterprise-repro*/`). Flames, report,
  and benchmark move per commit, never batched to end-of-wave. The next dispatch
  seeds from these fresh flames. Pull-in order per generation: LAND
  claims → integrator now; BANKs accumulate toward 3–7 → set
  integrator; sum-confirm decides; captain verifies firsthand, lands
  one arc per commit, reports, re-profiles, reseeds.

## Roles

- **Captain**: keep all 7 worker slots filled (hold only on proven
  empty backlog); rolling respawn same-tick; spawn integrators on
  LAND claims and bank sets; re-run decisive suites + quality
  firsthand on the exact tree before every commit; land green sets
  to `reference-system` (named files only, one verified arc per
  commit); **bench report + scoreboard + flame-refresh after every
  landing commit** (pinned report committed with the arc, scoreboard
  row same tick — the timeline chain); curate LOG.md
  (only the captain writes it); re-seed from fresh flames after
  landings; rebuild the perf index + archive the log at wave
  closeout; open the next wave immediately unless HQ parks.
- **Implementor**: one mechanism; census-first; prove it with tests +
  byte-identical output + paired A/B, or CUT fast with exact filler +
  bank conditions. No pivot to a second hypothesis.
- **Integrator**: reproduce the merge per the filed record (never copy
  trees), collisions textual then behavioral with file:line evidence,
  race calls, sum-confirm + per-member LOO bisect. Judgment plus proof
  — no new work.
- **Repro**: fresh flames + burndown + ranked re-seed at every wave
  open. No diets, ever.

## Bars (doctrine — see agent-perf for the full table)

- Solo LAND: ≥15 ms **and** ≥1.5% (8-pair, warmups unscored, stands
  ex-run-1). A jitter filter: below it, solo claims are superstition.
- Bank sets land on **sign-resolved sums** + identity + suites — and a
  **replicated** directional contra earns a subset-confirm, never a
  free ride (recipepath: FULL −14.1 → subset −19.3).
- Straddles (≈0, mixed-sign, single-set) ride the wave-1 reserve
  precedent with the 3-part justification (artifact includes them, sum
  clears, each provably removes counted work).
- Per-phase bank (keys2 precedent): ≥5 ms phase + ≥25% share +
  differential + flame-reproducing method. Whole-sync resolves in the sum.
- Race: first sound LAND wins; overlap adjudicated hunk-by-hunk with a
  count probe — the weaker YIELDs on evidence, never on assertion.
- Sortshape: zero emission-order changes, always.

## Standing protocol (in every dispatch brief)

- **Base-pin**: `git rev-parse HEAD` must equal the brief's base or stop.
  Integration branch: `reference-system`.
- **Search first**: `pnpm agentperf search <ground>` before scoping —
  re-litigating a closed topic without new filed evidence is a
  protocol violation. Cite prior attempts by index id.
- **Claims**: append `PROGRESS <name>: ...` to `/tmp/swarm-claims.md`.
- **Bench lock**: one box, one stopwatch. `mkdir` to grab, owner file,
  hold only for timed blocks, two-step release. While held: edit/read
  only. Never kill foreign PIDs; disclose noise, discard whole sets,
  never cherry-pick pairs. Never `git stash` in worktrees (refs are
  global — file asides only).
- **Confirm discipline**: pin stream always (no `--seed` on verdict
  runs); 1–2 unscored warmups per arm; 8 interleaved pairs; binaries
  asided + sha-verified before AND after every run; verdict stands
  ex-run-1; disappointing sums bisect per-component; never ship a
  bundle on faith.
- **Proof**: 4-scale byte-identity vs sealed pins, determinism,
  stash-compared suites (delta = exactly the carried-over tests, by
  name), `agentrs q` 0 violations with zero NEW warnings.

## Heavy tracks

Dead-file avoidance (shot2) is KILLED and stays killed — no pre-open
signals, no skip logic, WORK diets only. Parallel/multithreaded compile
is BANNED by HQ — never attempted, never briefed, never a fallback.
Panda's 645 ms is a serial number; the race is serial efficiency. A
wave that needs milliseconds it cannot find says so in honest
arithmetic instead of reaching for banned tracks. Background:
`docs/archive/VOYAGE-WARPDRIVE.md`.

## Design tracks (HQ-commissioned, wave 4)

Filler graduates to active design ONLY on HQ order — never on crew
initiative. Commissioned: F1 single-read native path + F2 two-walk
merger (wave-4 recon §7; HQ call, design crews dispatched wave 4).
Pipeline per track: design crew (paper DESIGN.md + grounding
measurements, NO production-code changes, isolated worktree) →
captain + HQ acceptance (design must satisfy the recon's bank
conditions: proof obligations, mechanism sketch, cost accounting) →
implementer crew (one mechanism, full voyage proof) → integrator
(review + re-proof) → land. F1 borders seam ground (marshal-neutral
or fully costed vs PERF-W4-SEAMSCOUT); F2 must preserve C1 keep-alive
+ union-walk guarantees (shot2-KILL still bans all skip logic).
Uncommissioned filler stays unbriefable no matter how large its
fantasy.

## Dispatch skeletons

Implementor brief = base-pin + hypothesis (numbers, entry files) +
grounding list (index search first) + ground fence (sync() unless
HQ widened) + fences by FUNCTION (never by directory) +
falsification bar + lock protocol + REPORT.md format
(counts, pair table, identity pins, suites, quality, verdict +
mechanism proof). Integrator brief = base-pin + member patches +
reproduce-per-record + collision checklist (same-function-twice,
shared-state/ordering, regen/tests, soundness re-verification) +
correctness + confirm protocol + INTEGRATE.md format (final line
authoritative). No commits, no pushes, ever — the captain lands.

## Closeout

Per commit: committed bench:neo report + scoreboard row + flame
refresh, same tick (see Model). Per wave: land or HOLD every open
member; `pnpm agentperf rebuild`; archive the wave log under
`docs/perf/waves/<wave>/`;
clear the live LOG.md wave section to a stub (scoreboard rows are
never cleared — they are the voyage timeline). Next wave opens
immediately with fresh flames on the new tip unless HQ ordered a
park. Parking with a non-empty backlog, or after a single thin wave,
is a protocol violation — the park report must cite the empty
backlog + honest arithmetic.
