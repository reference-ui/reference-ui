# VOYAGE — rolling perf swarm to 700 ms

## Destination

Enterprise `sync()` ≈ **700 ms** on the frozen seed-7 app load (3,000
files, 7,527 `css()` calls), from 1198 ms (wave-2 closed at ≈938 ms:
−260 across 24 diets, 6 arcs). Panda v2 holds 645 ms on the same load —
that is the goalpost, never the architecture: do not copy Panda's
output, do not weaken diagnostics or harvest doctrine to win
milliseconds. Scoreboard, history, and dead ends live in LOG.md; every
verdict ever filed lives in the perf index (`pnpm agentperf search`).

Honest arithmetic (repro2, filed): known ranked ceilings sum to ≈910
even stacking everything — 700 stays unreachable single-threaded by
≈200+. Each wave re-measures this on fresh flames instead of assuming.

## Model

Rolling continuous swarm. The captain keeps **up to 7 crew slots**
filled — and **holds slots when the backlog is exhausted**, because a
thin crew costs lock rotations that landing-confirms need. Runtime cap
is 8 agents including the captain. There are no waves to wait for, but
every landing is followed by a re-profile, and the LOG batches history
into waves for the record.

- Each crew = one hypothesis, one isolated worktree, one REPORT.md.
  Crews are disconnected: no chat, no shared branches. Shared state is
  exactly three things: LOG.md (read-only for crews), the claims file
  (append), the bench lock.
- Counts first, always: exact census (≥2 identical runs) before any
  diet. A falsification bar in every brief; a fast, well-counted CUT is
  first-class. An implementor that cannot prove a benefit is
  **decommissioned**: CUT, cause, release the worktree. The captain
  respawns on the next backlog topic (or holds the slot).
- Sequenced work uses **verdict-gating** (wantctx pattern): census +
  design now, diet only after the gating verdict posts. Watch the
  claims file, never poll the crew.
- On a LAND claim the captain spawns that crew's **integrator**
  (short-lived, own worktree, INTEGRATE.md verdict LAND/YIELD/HOLD).
  Banked sets of 3–7 go to a set integrator the same way.

## Roles

- **Captain**: fill/hold slots; spawn integrators on LAND claims and
  bank sets; re-run decisive suites + quality firsthand on the exact
  tree before every commit; land green sets to `reference-system`
  (named files only, one verified arc per commit); curate LOG.md (only
  the captain writes it); re-seed from fresh flames after landings;
  rebuild the perf index + archive the log at wave closeout.
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

## Dispatch skeletons

Implementor brief = base-pin + hypothesis (numbers, entry files) +
grounding list (index search first) + fences by FUNCTION (never by
directory) + falsification bar + lock protocol + REPORT.md format
(counts, pair table, identity pins, suites, quality, verdict +
mechanism proof). Integrator brief = base-pin + member patches +
reproduce-per-record + collision checklist (same-function-twice,
shared-state/ordering, regen/tests, soundness re-verification) +
correctness + confirm protocol + INTEGRATE.md format (final line
authoritative). No commits, no pushes, ever — the captain lands.

## Closeout

Land or HOLD every open member; `pnpm agentperf rebuild`; archive the
wave log under `docs/perf/waves/<wave>/`; clear the live LOG.md wave
section to a stub. Next wave opens with fresh flames on the new tip.
