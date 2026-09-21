# VOYAGE: HYPERSPACE RUN

Standing orders for the star captain. Read this first, every wave.
HQ's word amends it; nothing else does.

**You are fully autonomous now.** HQ has given the word and gone to
sleep. Do not ask permission. Do not pause between objectives. Do not
ping HQ for a ruling, a commit, a spawn, or a "should I continue."
Decide, dispatch, verify, commit, log, keep moving. Morning is when HQ
reads the logs — not when the voyage waits. The one thing you never do
unasked: push. Everything commits locally; HQ pushes in the morning.

Two objectives, in order. Then the loop runs until HQ wakes.

---

## First act (before any crew launches)

1. Take the conn aloud, per the star-captain skill: name the
   objectives, state what you own and what you will not do yourself.
2. Commit the voyage base on `reference-system`: this brief, the perf
   log stub, the voyage log stub, the Fasthull update, the missions
   README row. Wave worktrees cut from this HEAD — nothing uncommitted
   may be load-bearing.
3. Confirm the runners answer: `pnpm agent --help`-class smoke is
   enough (agentrs queue, agentneo CLI, bench list). A dead runner at
   02:00 is a dead wave; find out now.

## Objective 1 — Operation Reaper (main tree, one crew, sequential)

Reaper first. It is the only sequenced work tonight: size the harvest
sheet on a real compile, then decide the pool. Verification is bundle
shrinkage, measured by the bench.

1. **Jettison check.** Reaper sequences after Jettison (the shipped
   map must be gone). Verify the state of the tree firsthand: is the
   map gone on this checkout, and does Jettison acceptance still pend?
   Answer Reaper ask 7 first — it bounds what Slice 1 needs from
   Jettison. If Jettison blocks the sheet numbers (not just the
   `react.mjs` cell), say so in the voyage log and run what can run;
   do not re-litigate Jettison itself.
2. **READY asks, read-only.** Answer Reaper asks 1–7 into
   `packages/reference-neo/docs/evidence/`. Then flip Reaper line 1
   to `OPERATION: GO` — this brief is HQ's hand on that switch.
3. **Slice 1.** Fixture, real compile, census: classes, `styles.css`
   raw/gzip/brotli, `react.mjs` raw/gzip, sink census, pool census
   split leaf-only vs unbound, CSSOM parse times. Output
   `reaper-01-real-compile.md` beside the M-bounds. Commit the
   evidence as one arc.
4. **D1 overnight.** The pool question goes to architect consult
   against the Slice 1 numbers: material size win AND no authored
   pattern breakage beyond named cases signs it; anything else
   declines with written reasons. Either answer completes D1 —
   decline is a finished outcome, not a failure. Record the ruling
   and its reasons; HQ ratifies in the morning (Slice 2 is one
   revertible commit either way).
5. **Slice 2 only if D1 signs.** Walk-owned literals out of the pool,
   `ATM-HARVEST-06` green, harvest suites unchanged, gates green.
6. **Bench verification.** Pin the default suite immediately before
   Slice 2 changes land (baseline) and immediately after (candidate).
   The win is smaller bundle bytes at the same load, raw and gzip,
   with no sync/RSS blowup. Compare pin to pin, scale by scale, and
   put the deltas in the voyage log. Commit the post-slice pin as the
   new log head only if it wins or holds; a regression parks the
   slice, not the voyage.

Reaper's own requirements (R1–R6) and slices are the contract; this
brief only sequences and verifies. Captain re-runs the decisive
suites firsthand before every Reaper commit.

## Objective 2 — flip-flop waves (standing; runs until HQ wakes)

After Reaper, the night is an infinite loop: one red team and one
performance team per wave, in worktrees, merged at wave end, then the
next wave. Red hunts breaks; perf hunts speed. Neither waits for HQ.

### Cutting a wave

From `reference-system` HEAD, wave N gets two branches and two
sibling worktrees (never nested inside the checkout):

```bash
git worktree add ../reference-ui-red -b voyage/hyperspace-red-N
git worktree add ../reference-ui-perf -b voyage/hyperspace-perf-N
```

(Replace N per wave; remove finished worktrees with
`git worktree remove --force` before re-cutting a path.)

### Red crew (red tree) — five seats, all filled

A proper adversarial team, not one agent. Red-team cycles per the
red-team skill, doom-agent physics for compiler briefs:

1. **Hunter** — one brief, up to 3 theories, ships the blind repro
   (in `/tmp`, runnable via the repo's own runners) or reports a
   clean hunt. Finds only.
2. **Reproducer** — a separate crew that replays the repro blind.
   Unreproducible finds die here.
3. **Architect** — onboard all wave. Rules BREAK vs CURIO with
   severity honesty, draws the exact fortify boundary (what may
   change, what moves together, sweep obligations, what stays
   untouched), and takes consults on anything needing shape changes.
4. **Fortify engineer** — closes ruled BREAKs inside the boundary,
   with pins plus a regression station/case. No weakened tests, no
   blanket repins.
5. **Chain-review oracle** — re-verifies the whole arc firsthand
   (repro, pins, suites, diff against the ruling) to VERIFIED or
   GAPS with particulars.

Reports go to the doom log (`.agents/doom/logs/`, one atomic report
per hunt) **on the red branch** — the merge carries them home, and the
next wave inherits them. Consult the log before hunting; thin coverage
is scheduling signal. Satisfaction is HQ's word only — until then,
keep cycling.

### Perf crew (perf tree) — four seats, all filled

A proper optimisation team mirroring red's discipline. Performance
cycles per Operation Fasthull:

1. **Profiler** — finds the slow spot and writes the hypothesis with
   profile evidence. One hypothesis per cycle.
2. **Architect** — onboard all wave. Concurs with the hypothesis
   before implementation starts (a killed hypothesis is logged in one
   line, not mourned), consults on risky changes, and rules when
   reviewer and implementer disagree.
3. **Implementer** — builds the change inside the hypothesis boundary
   and measures it: bench at locked load against the wave-start pin
   plus the stability check.
4. **Reviewer** — a different agent from finder and implementer.
   Re-verifies firsthand (bench comparison, stability claim, diff
   against the boundary) to VERIFIED or GAPS with particulars.

A disproven hypothesis is a complete cycle — log it and move on.
Entries append to `VOYAGE-HYPERSPACE-PERF.md` **on the perf
branch** — the merge carries them home. The load stays frozen all
night: no scale, generator, or sampler edits while optimising. Faster
by weakening the load fails review on sight.

### Measuring inside waves

- Crews measure in-tree and commit nothing measured: worktree benches
  pin `reports/latest/` (untracked, dies with the worktree). Hash pins
  from a wave branch are meaningless for the log — only the captain
  commits pins, and only on the main line at arc boundaries.
- The box is shared between the two crews. Timed bench runs need
  relative quiet: the captain sequences compute — perf owns the box
  during its timed runs, red yields heavy suites on the captain's
  signal. Perf reports medians across the default runs; a win must
  clear the measured run-to-run spread, not just beat one sample.
- RS work anywhere coordinates through `/tmp/reference-ui-cpu-gate`
  per standing rule.

### Closing a wave

1. Crews report VERIFIED arcs only. Anything GAPS, unreviewed, or
   unverified stays on its branch and rides the next wave — it never
   merges.
2. Captain merges red first (correctness lands before speed),
   re-running the decisive suites firsthand; then perf, re-running
   bench (same load) plus acceptance firsthand.
3. Same-hunk conflicts resolve for red; perf re-proposes next wave.
   If a perf merge regresses the bench against the pre-merge pin, the
   perf merge is reverted and the revert is recorded in the perf log.
4. Record the wave close in `VOYAGE-HYPERSPACE-LOG.md`: what merged,
   bench deltas, what rode forward, what died.
5. Remove the worktrees, cut wave N+1. The loop has no last wave —
   HQ's morning is the only exit.

### Never interrupt working crews

Read-only liveness only: log writes plus work products. No vitals
pings — the ping-exit pattern killed five crews in one voyage. Talk
to stuck crews (silent, circling, waiting on itself), never to moving
ones. This binds the captain and every observer all night.

## The morning

When HQ wakes (or orders park): finish in-flight arcs, never strand a
half-verified merge; close the wave in the log; commit; dispatch
nothing further. The resume checklist names what is COMPLETE, what
rode forward, and the exact next cut. HQ reads, in order: the voyage
log, the perf log, the doom log, the Reaper evidence and D1 ruling —
then ratifies, pushes, and says satisfied or not.
