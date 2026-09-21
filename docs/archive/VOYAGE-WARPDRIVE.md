# VOYAGE WARPDRIVE — final speed run

Standing orders for the Star Captain. This is an executable mission brief,
not another recon report. Read it after
`.agents/skills/star-captain/SKILL.md`; HQ's word may amend it, but no older
voyage, report, or crew may silently widen it.

**Status: READY FOR CAPTAIN.**

## 0. Authority and destination

This voyage starts after product HEAD
`ea63f3a1a685a7415543cad108aca834af94f3af`. It supersedes the standing loop
in `VOYAGE-HYPERSPACE.md`.

> **Sync wall is the only target. Peak HW and bundle bytes are
> non-regression guards.**

Warpdrive is self-contained. It inherits only Fasthull's one-hypothesis cycle,
architect concurrence, independent review, and logged negative results. It
replaces Fasthull's targets, baseline, scorer/memory series, run counts,
orchestration, and HQ-only close rule. Uncommitted Fasthull edits are foreign
and non-authoritative. RSS and bundle size are already home; improving either
without moving sync wall is not progress in this mission.

### The shot

At the locked enterprise load, move fresh-child `sync()` from the sealed
mission baseline (expected near the Wave 4 median of **1186.5 ms**) to:

- **at most 1000 ms median across at least 7 scored runs**, and
- **at least 10% faster than the sealed mission baseline**.

Both conditions must hold. Panda's 645 ms remains a direction marker, not an
architecture to copy and not this voyage's acceptance line.

### Two terminal outcomes

1. **HIT** — the speed target and every guard pass. The Captain closes the
   voyage.
2. **NO-SHOT** — all three authorized shots have reached their written
   terminal verdicts, no qualified structural lane remains, and the final
   report names the unresolved product-architecture decision. This completes
   the mission but is **not** a performance victory and must not claim the
   remaining wall is a proven floor.

There is no standing overnight loop and no requirement to wait for HQ to wake.
The Captain may close autonomously on either terminal outcome. Do not invent a
fourth shot.

`BLOCKED — PARKED` is not a third outcome. A wrong base, branch/worktree
ownership collision, unresolved runner/build failure, or locked-load/scorer
mismatch causes a safe park: file the evidence and exact resume command,
dispatch nothing further, and never relabel infrastructure failure NO-SHOT.

## 1. Why this attacks speed

The corrected same-run record is:

```text
sync 1230.1 ms =
  config 30.6 + scan 364.3 + evaluate 6.2
  + compile 780.3 + publish 48.7
```

Scan plus compile is **1144.6 ms, 93% of sync**. Warpdrive spends its effort
there:

- **Shot 1 — realloc volume:** remove measured compile waste, expected
  ~25–50 ms.
- **Shot 2 — dead-file opens:** remove scan work, with a direct measured open
  prize of ~190 ms if deadness is knowable before content is opened.
- **Shot 3 — parallel compile:** attack the 740 ms, 100%-top-thread native
  window; this is the only authorized whole-window bet.

Warm-loader studies, RSS attribution, bundle work, and profile reconciliation
may be useful research, but none moves this score. They are not objectives.

## 2. Ground truth — do not mix these records

- **Score reference:** Wave 4's quiet, uninstrumented enterprise runs were
  1188.8 / 1185.7 / 1186.5 ms, median **1186.5 ms**. This is orientation only;
  Objective 0 seals the actual baseline.
- **Attribution reference:** corrected canonical instrumentation is
  **1230.1 ms** with the phase split above. Instrumented wall is not the score.
- **Native window:** 740.0 ms, 9.539B instructions, IPC 2.36, 11/11 threads
  matched, 0 born, 0 died, top-thread share 100%, 1 µs unattributed.
- **Open census:** scan performs 15,122 opens for 239.42 ms; 12,000 of 15,122
  source files are dead under the locked load. Whole-worker net is 15,409
  opens at 15.87 µs and includes unrelated opens.
- **Allocation census:** 946.6 MiB allocated, 938.6 MiB freed, 8.26M blocks,
  1,117,430 reallocs, 152.2 MiB span peak, zero in-window full GCs.
- **Current enterprise output:** `styles.css` 2,867,925 bytes and
  `runtime-data.mjs` 214,466 bytes. Objective 0 re-hashes all scored outputs.

`packages/reference-neo/benchmark/reports/latest/` and pin
`5eda2c60b7e5` describe the pre-Fasthull 3.5 s world. They are historical
comparisons, never the launch baseline. The corrected profile explains the
current wall; a clean uninstrumented benchmark decides wins.

Primary evidence:

- `docs/missions/completed/operation-flamegraph-recon-v2.md`
- `docs/evidence/phases/enterprise-phases1b/`
- `docs/evidence/counters/enterprise-counters3/`
- `docs/evidence/alloc/enterprise-alloc3/`
- `VOYAGE-HYPERSPACE-LOG.md`, Wave 4 close

The v1 recon is superseded. Its compute ceiling, stop rule, mixed-window
decomposition, and “hottest has nine” claim are forbidden citations.

## 3. Boundaries

### In bounds

- Internal scan/compiler architecture that preserves the existing `sync(cwd)`
  contract.
- Data-structure capacity, arena, ownership, and deterministic work
  partitioning changes.
- A bounded instrument addition that is required by a shot's kill gate and
  cannot become its own mission.
- Tests and fixtures that prove arbitrary-repository correctness,
  determinism, diagnostics, and output identity.

### Out of bounds

- Changing benchmark plans, generators, seed, file counts, call counts,
  samplers, or scorer.
- Special-casing benchmark paths, `FACTOR_*` names, generated content, or the
  locked fixture's shape.
- A new public manifest/watch API, a persistent cache, or requiring callers to
  provide truth that today's cold `sync(cwd)` does not have. File such a need
  as a product decision; do not smuggle it into this voyage.
- Copying Panda's architecture, dropping output, changing harvest doctrine,
  weakening diagnostics, or changing file/glob semantics.
- A warm-only win presented as a fresh-child benchmark win.
- Any RSS-only, bundle-only, instrumentation-only, or “better IPC” arc.
- Pushes.

The product base, output contract, and locked load do not move while the
torpedo is in flight.

## 4. Captain's first act

Take the conn aloud exactly as the Star Captain skill requires:

1. Name Objectives 0–4 below in order.
2. State that you own whole-mission context, autonomy through HIT, NO-SHOT, or
   a safe park, crew dispatch, health checks, objective logs, firsthand gates,
   and captain-only commits.
3. State that you will not hunt, map, profile, implement, fortify, or serve as
   peer reviewer. You may inspect named diffs and rerun decisive gates only to
   verify an oracle-reviewed arc before committing it.

Then establish a clean mission line without touching foreign dirt:

1. Before committing this brief, verify `git rev-parse HEAD` is exactly
   `ea63f3a1a685a7415543cad108aca834af94f3af`. If the brief is already
   committed, verify its first parent is that exact product base. Otherwise
   park BLOCKED; do not guess a new base.
2. Read `git status`. At handoff,
   `docs/missions/operation-fasthull.md` may contain pre-existing edits. Do
   not stage, stash, revert, format, or “clean up” any file you did not create.
3. If this brief is uncommitted, commit **this named file only** as the
   mission-open arc:

   ```bash
   git add -- VOYAGE-WARPDRIVE.md
   git commit --only -m "docs(voyage): open Warpdrive final speed run" -- VOYAGE-WARPDRIVE.md
   ```

   Verify the commit changed exactly this path. Never use `git add -A`.

4. Create a clean integration worktree and branch from that commit:

   ```bash
   git worktree add ../reference-ui-warpdrive -b voyage/warpdrive HEAD
   ```

   Reuse an existing canonical branch/worktree only when it descends from the
   mission-open commit and its logs identify this mission. Otherwise park
   BLOCKED; never reset, delete, force, or create a duplicate canonical
   mission.

5. In every new worktree, install before dispatch:

   ```bash
   pnpm install --frozen-lockfile
   ```

6. Run runner smoke in the integration tree:

   ```bash
   pnpm agent status
   pnpm agentrs s
   pnpm agentneo list
   pnpm bench:neo -- --list
   ```

7. Create an objective log only when that objective starts. Its first line is
   `IN PROGRESS`; change it to `COMPLETE` only at the objective's terminal
   verdict:

   ```text
   docs/missions/warpdrive/00-baseline.md
   docs/missions/warpdrive/01-realloc.md
   docs/missions/warpdrive/02-dead-file.md
   docs/missions/warpdrive/03-parallel.md
   docs/missions/warpdrive/04-terminal.md
   ```

The Captain is the sole writer of the canonical objective log, preventing
cross-worktree append conflicts. Each crew writes a uniquely named evidence
file containing its proposed start/terminal entry; the Captain records the
entry, verdict, and link on integration. During Objective 0 scoring, all crew
evidence stays external until the set ends. If it is not filed and linked, it
did not happen.

## 5. Box, branch, and crew discipline

- Objectives run in order. Clear one before opening the next.
- Within an objective, map/architecture and adversarial proof may run in
  parallel. Implementation starts only after the architect records
  concurrence.
- One hypothesis per implementation worktree. Crews never commit; the Captain
  commits named files after firsthand verification.
- Use unique paths such as `../reference-ui-warpdrive-o1`; do not reuse or
  remove Hyperspace worktrees.
- Never use repository-wide `git stash` from a worktree. Stash refs are shared
  and already caused cross-crew contamination. Use a dedicated control
  worktree or `/tmp` evidence.
- Never run repo-wide `pnpm agentrs f` in a lane tree. It previously rewrote
  hundreds of unrelated files.
- `pnpm agentrs` owns the CPU/build gate. Timed benchmarks are stricter: only
  one scored benchmark may run, and no crew may build, test, profile, or bench
  while it runs.
- Never ping a working crew for status. Health checks use objective logs,
  roster state, and work products. Rebrief or replace only after the
  read-only deadlock test fails.
- A disproven hypothesis is a valid terminal result. Preserve the reason,
  remove product residue, close the objective, and advance.

## 6. Measurement contract

### Objective 0 seals B0

Use a clean integration tree and the shipped release `.node`.

1. Commit the Objective 0 `IN PROGRESS` log header so the integration tree is
   clean.
2. Build once with `pnpm agentrs b`.
3. Run one **unscored** enterprise warm-up after the build. First-run-after-
   rebuild wall is poison.
4. With the box quiet, record all four scales in one invocation:

   ```bash
   pnpm bench:neo -- --scale small,medium,enterprise,churn --runs 7 --keep --json
   ```

5. File `result.json`, `report.md`, captured stdout/stderr, every sample,
   scorer version, load identity, raw/gzip bytes, the exact source commit,
   shipped `.node` SHA-256, and SHA-256 for each kept repo's
   `.reference-ui/styled/{styles.css,runtime-data.mjs}`.
6. If enterprise median differs from 1186.5 ms by more than 10%, make the box
   quiet, warm once, and repeat the whole set. If the second set remains more
   than 10% away, dispatch a measurement-diagnosis crew. Unless it files a
   concrete environmental mechanism, park BLOCKED; do not silently redefine
   B0.

The current scorer is `bench-worker/2`:

- sync median is the target;
- `peak HW` is the memory guard;
- v1 `peak RSS` is reported only for history.

Every sample is the first `sync()` in a fresh child; module startup sits
outside `syncMs`, while `peak HW` is lifetime-process high-water and includes
startup. The warm-up primes OS/page caches, not an in-process second sync.
Never compare a new HW value with an old RSS value or an unmatched procedure.

Objective 0 also seals two non-regression bands from its 7 samples:

```text
HW tolerance = max(15 MiB, 3 × median absolute deviation of peak HW)
scale wall tolerance = max(5%, 3 × median absolute deviation / median)
```

The HIT line and these B0 guards never move. Later B1/B2 baselines explain an
incremental arc; they cannot compound speed, memory, or shape regressions.
A “sealed” B1/B2 means committed source plus an archived post-commit build,
warm-up, and clean measurement. Dirty candidate evidence is never a baseline.

### Evidence preservation

The benchmark runner replaces `reports/<pin>/` on every invocation. Dirty
candidates write `reports/latest/`, and `--json` is mixed with human output.
Therefore:

- every scored invocation uses `--keep`;
- during a scored set, archive `result.json`, `report.md`, stdout/stderr,
  hashes, and manifests under
  `/tmp/warpdrive-evidence/<objective>/<set>/<attempt>/`; do not modify tracked
  files between invocations;
- hash the two shipped bundle files in every kept synthetic repo, then remove
  only that crew's kept repo after the archive is verified;
- identify a dirty candidate with a synthetic Git tree hash made from a
  private temporary index containing HEAD plus **all** declared candidate
  paths, including staged, unstaged, deleted, and untracked files; exclude
  reports, logs, and evidence, and verify the hash before every sample;
- after the whole set terminates, verify its manifest, copy it once to
  `docs/evidence/warpdrive/bench/<objective>/<set>/`, then commit it by named
  path;
- score exact values from `result.json`, never rounded `report.md` text;
- never use the pin name alone as candidate provenance.

### Candidate proof

Microbenchmarks, allocation rows, counters, and profiles decide whether a shot
earns an end-to-end run. They never veto a matched end-to-end win. If a
candidate clears this section or makes the cumulative tree pass the fixed HIT
line, a missed proxy target is an explained instrument result, not a kill.

Let A be the immediate integration parent and C the candidate. Build them in
equal-length worktree paths, warm each once, then run eight quiet one-sample
pairs. Source paths can alter native binary layout, so record both build roots
and native hashes:

```text
AC CA CA AC AC CA CA AC
```

Each invocation is:

```bash
pnpm bench:neo -- --scale enterprise --runs 1 --keep --json
```

Archive every attempt before the next. A normal landing must improve
enterprise sync by both **at least 25 ms** and **at least 2%**, win at least
6/8 pairs, and have:

```text
paired delta = median(A sync ms − C sync ms)
paired delta ≥ max(25 ms, 0.02 × median(A sync ms))
```

The floor is waived only when an independent confirming set makes the
cumulative tree pass the fixed HIT line. Any smaller result is
`KILLED — VERIFIED`, not an unclassified “small win.”

After enterprise passes, compare sealed B0 and C in equal-length build roots
using the same eight-pair order and one-sample invocations over
`small,medium,enterprise,churn`. A landing must satisfy, for every scale:

```text
median(wall_C) ≤ median(wall_B0) × (1 + B0 wall tolerance)
median(HW_C) ≤ median(HW_B0) + B0 HW tolerance
```

It must also:

- keep generated output byte-identical at all four scales, including raw and
  gzip sizes and file hashes;
- keep diagnostics and their order identical;
- preserve the same candidate tree hash for every sample.

If peak HW breaches, repeat the **entire paired B0/candidate evidence**, not
only the candidate arm. Two repeated cumulative breaches fail the guard.
Mechanism reads explain the result; trivial reachable capacity is not an
automatic failure when measured HW remains inside the sealed band.

### Stability proof

Scope first, then full:

```bash
pnpm agentrs q <changed-rs-paths>
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentneo run
pnpm agentneo q <changed-neo-paths>
```

Before a product commit, run the complete relevant loops:

```bash
pnpm agentrs
pnpm agentneo run
```

No golden update, output change, pre-existing red, or ignored warning may be
absorbed without an explicit, firsthand mechanism proof.

## 7. Objective 0 — seal the range

Log: `docs/missions/warpdrive/00-baseline.md`

Dispatch one benchmark keeper and one read-only oracle. The keeper may run
only an unscored rehearsal. The Captain's first archived 7-run set is the
official B0 attempt; if the drift rule triggers, the mandatory second set
becomes B0. Sets are never selected by result. The oracle independently checks
the load, scorer, clean commit, report pin, sample set, and output hashes. The
Captain runs the official decisive commands firsthand.

**Complete when:** B0 is committed, the oracle writes `VERIFIED`, and the
mission log records the numeric HIT line derived from B0:

```text
required final median = min(1000 ms, 0.90 × B0 enterprise median)
```

At the expected 1186.5 ms B0, HIT requires 1000 ms: a 186.5 ms / 15.72%
reduction. Record the computed value rather than relying on this example.

If the load or scorer differs from this brief, dispatch a tooling crew. If
correction would change the locked load or scorer, park BLOCKED before any
optimization crew launches.

## 8. Objective 1 — Shot 1: kill realloc waste

Log: `docs/missions/warpdrive/01-realloc.md`

This is the cheap primer, not the structural bet. One Fasthull crew gets one
attribution pass and one implementation candidate.

### Questions that must be answered before product code

1. Which compiler phase and concrete collection own the reallocs?
2. What exact cardinality is already known early enough to reserve once?
3. Is the proposal reducing growth/copy work, or merely moving allocation?
4. Which criterion bench or exact call/count proves the mechanism before the
   full benchmark?

The crew may add per-phase realloc counts to the existing alloc trace if
needed. Phase rows must sum exactly to the span, apart from a fully accounted
self-observation delta such as the existing +2 rows. The addition must
bump/file its procedure, remain zero-cost in the shipped binary, and stay a
small instrument arc. It does not earn a benchmark or a mission objective by
itself.

### Kill and pass gates

- The pre-bench promotion target is a reduction of at least 50%:
  1,117,430 to **558,715 or fewer**.
- The target bench must clear its floor: at least 2% for
  plan/census benches, at least 5% for µs-scale benches on an idle box.
- If either proxy misses but the architect can explain why it undercounts the
  mechanism, one Candidate-proof adjudication is allowed. A matched
  end-to-end win overrides the proxy miss; otherwise kill.
- **Kill** if output changes, allocation is merely shifted, or a second
  unrelated reserve design would be needed.
- **Land** only if the candidate also clears the end-to-end Candidate proof
  in §6.

If it lands, seal a new integration baseline B1 for later A/B work while
retaining B0 as the mission target reference. If it dies, revert all product
code and carry only verified instrument/evidence files. End the objective
`LANDED — VERIFIED` or `KILLED — VERIFIED`.

If Shot 1 unexpectedly reaches the HIT line by itself, skip Objectives 2–3
only after a second independent confirming set passes. Mark both
`SKIPPED — HIT VERIFIED` and open Objective 4 only for final proof and close.

## 9. Objective 2 — Shot 2: avoid dead-file opens

Log: `docs/missions/warpdrive/02-dead-file.md`

This objective asks an information question before it asks for an
optimization:

> Under today's cold `sync(cwd)` contract, what sound fact identifies a file
> as irrelevant **before its content is opened**?

Dispatch a scan architect and an adversarial soundness oracle first. They must
cover arbitrary repositories, not the benchmark generator:

- constants imported by live files;
- importers and re-exports;
- diagnostics and parse failures;
- include/extglob behavior;
- dotfiles and declaration files;
- symlinked files/directories and permission failures;
- create/change/delete races during sync;
- deterministic path and diagnostic order.

Reading content to discover that content is dead does not pass. A prior-run
cache or caller manifest is warm/incremental product work and is out of scope.
Filename conventions and benchmark-only metadata fail on sight.

### Kill and promotion gates

- **Kill immediately** if no sound pre-open signal exists under the current
  public contract. File the smallest counterexample and stop.
- A prototype should first reduce scan-phase opens from 15,122 to **below
  12,000** with byte-identical output; missing this proxy requires an
  end-to-end Candidate-proof win to stay alive.
- **6,500 scan opens or fewer** is the structural target: it removes about
  8,600 opens and ~136 ms gross before overhead. It is evidence, not automatic
  qualification.
- `QUALIFIED` requires the sound pre-open fact plus a Candidate-proof
  end-to-end win. A measured **100 ms or more** earns first priority in
  Objective 4; a smaller verified win may still combine with another shot.
- Any unproved invalidation, glob, symlink, race, constant, or diagnostic case
  kills the lane. “Works on the locked generator” is not a soundness proof.

The objective may leave a reviewed prototype branch for Objective 4, but no
speculative product code lands here. End `QUALIFIED — VERIFIED` or
`KILLED — VERIFIED`.

## 10. Objective 3 — Shot 3: parallel compile

Log: `docs/missions/warpdrive/03-parallel.md`

This is the main whole-window shot. Dispatch a concurrency architect and a
determinism oracle before an implementer. They must choose one explicit unit
of parallelism and map every dependency:

- Oxc allocator and AST lifetimes;
- constants and source-order precedence;
- import/value/identity graphs;
- shared wants, recipes, diagnostics, facts, harvest sinks, and selections;
- class naming, map/set iteration, and diagnostics order;
- assembly and serialization ordering;
- worker startup, handoff, and reduction overhead.

“Use Rayon” is not an architecture. The memo must name the parallel work unit,
the immutable input, the per-worker output type, and the deterministic merge.
No `unsafe`, process-global mutable state, or nondeterministic collection order
may be introduced to force a pass.

### Kill and promotion gates

- Output, diagnostics, and their ordering must hash-identically over at least
  20 repeated compiles.
- On at least 4 workers, corrected counters should show:
  - top-thread share **below 80%**;
  - unattributed CPU **below 1%**, with born/died thread counts stated;
  - native-window speedup **at least 1.5×** as the full-scope target.
- A 1.5× 740 ms window saves ~247 ms; the expected B0 needs only ~1.34× if
  that saving reaches end to end. `QUALIFIED` therefore requires a
  Candidate-proof end-to-end win, not the 1.5× proxy. A measured **100 ms or
  more** earns priority in Objective 4.
- Failure of `Send`/`Sync`, deterministic reduction, or failure to produce
  any end-to-end win after one coherent prototype kills the lane. Do not pivot
  into a second compiler rewrite inside this objective.

The objective may preserve a reviewed prototype branch for Objective 4. It
does not land broad concurrency code on a counters-only claim. End
`QUALIFIED — VERIFIED` or `KILLED — VERIFIED`.

## 11. Objective 4 — burn the qualified shot

Log: `docs/missions/warpdrive/04-terminal.md`

At this point Shot 1 is `LANDED` or `KILLED`, and Shots 2–3 are `QUALIFIED`,
`KILLED`, or already `SKIPPED — HIT VERIFIED` on the early-HIT path. The only
additional productization verdict is `FAILED-END-TO-END — VERIFIED`. The
Captain writes the decision table into the log before dispatching product
work.

Selection is deterministic:

1. Order qualified shots by descending qualification paired delta. On an exact
   numeric tie, prefer Shot 2 only when it uses an existing production truth
   source; otherwise prefer Shot 3.
2. Attempt each qualified structural shot once, in that order.
3. A failed productization is reverted, marked
   `FAILED-END-TO-END — VERIFIED`, and leaves the integration baseline
   unchanged.
4. A successful productization is marked `LANDED — VERIFIED` and advances a
   newly sealed integration baseline, while the HIT line and cumulative
   guards remain fixed to B0.
5. After each landing, run an independent final set: repeat the §6 eight-pair
   protocol with A at the sealed B0 source commit and C at the committed final
   tree, over all four scales. Close HIT only if that set passes. Mark every
   still-qualified unconsumed shot `SKIPPED — HIT VERIFIED`; otherwise consume
   the next qualified shot.
6. After every qualified shot is consumed, close HIT if the fixed line and
   all guards pass; otherwise close NO-SHOT. This applies whether zero, one,
   or two structural shots qualified or partially landed. Do not reopen killed
   lanes or start a micro-optimization wave.

Each productization gets one implementer and a different reviewer. The reviewer
reproduces mechanism, correctness, determinism, benchmark samples, HW guard,
and output hashes firsthand. The Captain then repeats decisive gates and
commits one verified arc at a time.

### HIT close

The terminal log must contain:

- B0 commit, samples, median, scorer, and load;
- final commit and balanced base/final sample sets;
- final enterprise median and percentage delta from B0;
- small/medium/churn guard results;
- peak-HW repeated medians;
- output hashes and exact raw/gzip bytes;
- full test/quality results;
- every shot's exact terminal verdict;
- `HIT — VERIFIED` as the final verdict.

### NO-SHOT close

The terminal log must contain:

- the same sealed B0 record;
- the exact terminal evidence for all three shots, including any partial
  landing or promoted prototype that later failed end to end;
- any landed partial speedup and its final measured wall;
- why no qualified lane remains inside this brief;
- the smallest next product decision for HQ, such as a public incremental
  manifest/cache contract or a deeper deterministic compiler-IR redesign;
- an explicit statement that the compute room remains unbounded and the
  remaining wall is **not** proven minimal;
- `NO-SHOT — VERIFIED` as the final verdict.

Finish in-flight review/commit arcs, write the final verdict, change the
objective log's first line to `COMPLETE`, commit the terminal log and evidence
by named path, then verify the integration worktree is clean. Dispatch nothing
further; report the branch plus exact resume point. Never push.

## 12. Questions every crew must answer

No architect may concur and no reviewer may verify until the active log
answers all of these in plain language:

1. Which current phase and measured milliseconds does this change remove?
2. Does it improve the scored fresh-child sync, or only an instrument/warm
   path?
3. What fact is available **before** the work being skipped?
4. What arbitrary-repository case could make that fact false?
5. What exact cheap measurement kills the idea before a full benchmark?
6. What are the before/after counts, not just percentages?
7. How are output, diagnostics, and ordering proven identical?
8. What CPU, memory, and bundle guard can this change threaten?
9. What is the rollback boundary and which other crew owns every shared file?
10. Is the cited baseline B0/B1 from this voyage, or a stale historical pin?

An unanswered question is a gap, not permission to implement.

## 13. Do-not-fire list

No crew reopens these without new contradictory evidence filed before code:

- GC scheduling, chunked handoff, or forced collection: zero in-window full
  GCs; R1 already died.
- Pure-JS micro-work: 2.3% JS self-share.
- Per-open optimization: 15.87 µs warm open is the floor; only count matters.
- Parallel scan reads: async and 64-worker versions already regressed.
- Single-function native spikes: the profile is long-tail flat.
- `memmove`/`memcmp` as standalone lanes: they are effects of allocation and
  lookup volume.
- Ship-one-sheet, harvest kill/rewrite, files-complete, B3 plan gating,
  insert-skip, eager refinement, C4 memo as built, and other rule-proven
  Hyperspace deaths.
- RSS hunters and bundle lanes: guardrails only.
- Warm second-sync, churn profiling, deepsee/flame reconciliation, LLC
  speculation, or new profiling infrastructure as standalone objectives.
- Any v1 ceiling, stop rule, first-run-after-rebuild wall, single-sample RSS
  verdict, or HW-versus-old-RSS comparison.

Warpdrive is finite: seal, fire three shots, burn the qualified structural
shot, prove HIT or NO-SHOT, and stop.
