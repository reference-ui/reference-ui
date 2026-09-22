# VOYAGE — rolling perf swarm to 700 ms

## Destination

Enterprise `sync()` ≈ **700 ms** on the frozen seed-7 app load (3,000
files, 7,527 `css()` calls), from ~1186 ms. Panda v2 holds 645 ms on the
same load — that is the goalpost, never the architecture: do not copy
Panda's output, do not weaken diagnostics or harvest doctrine to win
milliseconds. Scoreboard, history, rooms, and dead ends live in LOG.md.

## Model

Rolling continuous swarm. The captain keeps **7 crew slots** filled:
**6 implementors** plus **1 captain's reserve**, spent at the captain's
discretion (integrators, emergency probes, re-verifications, overflow
implementor). Runtime cap is 8 agents including the captain, so a full
board is 7 children + captain — further spawns reject until something
finishes. There are no waves to wait for — but every landing is followed
by a re-profile, and the LOG batches history into waves for the record.

- Each crew = one hypothesis, one isolated worktree, one REPORT.md. Crews
  are disconnected: no chat, no shared branches. Shared state is exactly
  three things: LOG.md (read-only for crews), the claims file (append),
  the bench lock.
- An implementor that cannot prove a benefit is **decommissioned**: CUT,
  one-line cause, release the worktree. The captain immediately respawns
  a replacement on the next backlog topic.
- On a LAND claim, the captain spawns that crew's **integrator**
  (short-lived): it applies the diff in its own worktree, checks
  collisions against the integration branch, checks LOG.md for prior
  art, and confirms the number. Verdicts: LAND / YIELD / HOLD.

## Roles

- **Captain**: keep all 7 slots filled (6 implementors + reserve);
  spawn integrators on LAND claims; land green sets to
  `reference-system`; curate LOG.md (only the captain writes it);
  re-seed topics from the fresh burndown after every landing.
- **Implementor**: one mechanism; prove it with tests + byte-identical
  output + paired A/B, or CUT fast. No pivot to a second hypothesis.
- **Integrator**: collisions (textual first, then behavioral), race
  calls, confirm runs. No new work — judgment plus proof.

## Land rule (HQ)

No collisions, decent code quality, no new test reds, no possible
regressions → land. Wall-clock size decides pick order, never blocks a
clean set.

## Race rule

First sound LAND wins. A second crew reaching the same hypothesis reads
the winner's diff and numbers in LOG.md, then either YIELDs ("they got
there first and handled it better") or proves superiority on the same
protocol — faster *and* cleaner *and* sound. Superiority without
same-protocol evidence is a HOLD, not a LAND.

Landed work stays fair game: a later wave may improve on an earlier
landing (10% more on top of 10% compounds). Follow-ups measure against
the then-current base, cite the prior attempt from LOG.md, and must beat
it cleanly — same bar, same proof, no credit for re-landing.

## Standing protocol (in every dispatch brief)

- **Base-pin**: `git rev-parse HEAD` must equal the brief's base or stop.
  Integration branch: `reference-system`.
- **Claims**: append `name: topic (time)` to `/tmp/swarm-claims.md`
  (captain truncates it each seeding round). Duplicates allowed but
  visible; a third duplicate takes a neighboring topic.
- **Bench lock**: one box, one stopwatch.
  `while ! mkdir /tmp/swarm-bench-lock 2>/dev/null; do sleep 20; done`
  then write the owner file. While anyone holds it: hands off CPU
  (edit/read only). Release in two steps —
  `rm -f /tmp/swarm-bench-lock/owner && rmdir /tmp/swarm-bench-lock`.
  Stale-steal only past 45 minutes.
- **LAND bar (solo)**: ≥15 ms + ≥1.5% enterprise, suites green,
  4-scale byte-identity, determinism ×2. Sub-bar proven-identical diet
  BANKs into a combined set instead of CUTting.
- **Confirm discipline**: 1–2 unscored warmup runs per arm, 8
  interleaved pairs swapping the `.node` file between arms, verdict
  stands with run 1 excluded. Disappointing sums bisect per-component;
  never ship a bundle on faith.

## Heavy tracks

Single-thread diet cannot finish 700 alone (plausible ceiling ≈ 340 ms
even if dead-file avoidance lands). Two structural tracks run alongside
the swarm: the dead-file information question (a sound pre-open
deadness signal on arbitrary repos) and the parallel-compile architect
memo (deterministic merge, assembly is the 296 wt serial bulk). A wave
that kills either must say what replaces its milliseconds. Background:
`docs/archive/VOYAGE-WARPDRIVE.md`.

## Dispatch skeletons

Implementor brief = base-pin + hypothesis (numbers, entry files, first
`flame --inspect` commands) + 15-minute grounding list + claims line +
the five standing-protocol rules + REPORT.md format (base hash, both
`.node` sha256s, diff stat, mechanism counts, pair table + medians,
output hashes, determinism, verdict line). Integrator brief = base-pin +
the patch paths + one paragraph per change + collision checklist
(same-function-twice, shared-state/ordering, regen/tests, soundness
re-verification in the combined tree) + correctness + confirm protocol
+ INTEGRATE.md format. No commits, no pushes, ever — the captain lands.
