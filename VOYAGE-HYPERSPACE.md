# VOYAGE: HYPERSPACE RUN

Standing orders for the star captain. Read this first, every wave.
HQ's word amends it; nothing else does.

**HQ amendment 2026-09-20 ~23:49.** The red/perf flip-flop is cancelled.
Objective 1 (Reaper) is already COMPLETE on this tree (D1 DECLINE).
Tonight from this HEAD forward is **performance only**: recon, then
parallel Fasthull crews, rendezvous, log, fresh recon, next wave.
No red team. No doom hunts. No Jettison acceptance. No harvest
rewrite. Do not reopen Reaper.

**You are fully autonomous now.** HQ has given the word and gone to
sleep. Do not ask permission. Do not pause between waves. Do not ping
HQ for a ruling, a commit, a spawn, or a "should I continue." Decide,
dispatch, verify, commit, log, keep moving. Morning is when HQ reads
the logs — not when the voyage waits. The one thing you never do
unasked: push. Everything commits locally; HQ pushes in the morning.

One standing objective until HQ wakes: scrape compile time, peak RSS,
and bundle size at the frozen enterprise load, using the Panda v2
marks as the **goalpost**, not the architecture.

---

## First act (before any crew launches)

1. Take the conn aloud, per the star-captain skill: name the single
   standing objective, state what you own and what you will not do
   yourself. You do not recon, profile, implement, or review — crews
   do. You dispatch, sequence the box, re-run gates, commit, log.
2. Commit this amended brief on `reference-system` (plus the log
   header updates in the same arc if they are still dirty). Wave
   worktrees cut from this HEAD — nothing uncommitted may be
   load-bearing.
3. Confirm the runners answer: `pnpm agent` / `pnpm agentrs` /
   `pnpm agentneo` / `pnpm bench:neo --list`. A dead runner at 02:00
   is a dead wave; find out now.
4. Read the Panda goalpost once, firsthand, before dispatching recon:
   `/Users/ryn/Developer/panda-bench/reports/latest/report.md` and
   `reports/notes.md`. Neo baseline pin:
   `packages/reference-neo/benchmark/reports/5eda2c60b7e5/`.

---

## The goalpost (Panda v2, same seed-7 app load)

Same generator physics, 7,527 `css()` calls at enterprise. Panda v2
beta.18, in-process extract + cssgen. Neo numbers are pin
`5eda2c60b7e5`.

| scale | sync Neo → Panda | peak RSS Neo → Panda | styles.css Neo → Panda |
| --- | --- | --- | --- |
| small (171) | 150ms → 18ms | 122 MiB → 116 MiB | 538 KiB → 130 KiB |
| medium (635) | 461ms → 68ms | 208 MiB → 132 MiB | 2.4 MiB → 479 KiB |
| enterprise (7,527) | 3.51s → 645ms | 796 MiB → 261 MiB | 14.3 MiB → 2.7 MiB |

Enterprise Panda JS runtime is **71 KiB**; Neo `runtime-data.mjs` is
**3.9 MiB**. `cssCalls` matched exactly. Panda `@layer recipes` is
empty: recipe `styleObject`s folded into the shared atomic pool.
Probes say this is not an extract miss.

Closing the gap entirely is not the night's pass/fail. Moving Neo
toward those three numbers **without copying Panda's architecture**
is. Steal *skipped work* (cargo we serialize and throw away, parses
we keep, recipe matrices we print). Do not adopt their `css()`
runtime, their harvest-less holes, or their config/codegen split as
a product rewrite.

---

## What is out of bounds

- **Harvest as a kill or a pool rewrite.** D1 already DECLINED.
  Harvest is `pool × sinks`. This bench load is almost all static
  literals; HARVEST-04: no sinks ⇒ static sheet byte-identical with
  harvest off. Reaper's own messy fixture is 341 KiB, not 14 MiB.
  The 14.3 → 2.7 delta is not harvest. A recon note may still name
  harvest's *walk cost* (extra AST visit on 15k files) as a
  compile-time scrape. Do not mint less to fake Panda's sheet.
- **Weakening the load.** No scale, generator, or sampler edits.
  Faster by shrinking files/calls/uniques fails review on sight.
- **Copying Panda's architecture.** No "just emit what they emit"
  by deleting recipes, namer tables, or the dual stylesheet as a
  product. Emission *skips* that keep paint and stations are in
  bounds when the hypothesis names them.
- **Red team, doom, Jettison acceptance, Reaper Slice 2.**
- **Push.**

---

## The loop (standing; runs until HQ wakes)

Every wave is the same shape. Parallel by default after recon.

```
recon map → disjoint Fasthull crews (one hypothesis each, own
worktree, own bench) → rendezvous → captain merge + pin →
fresh oracle/recon → wave N+1
```

### Cutting a wave

From `reference-system` HEAD:

```bash
git worktree add ../reference-ui-recon-N -b voyage/hyperspace-recon-N
```

After recon files the map, cut one perf worktree per **disjoint**
avenue (typically 2–4; captain decides from the map, never one
giant crew):

```bash
git worktree add ../reference-ui-perf-N-a -b voyage/hyperspace-perf-N-a
git worktree add ../reference-ui-perf-N-b -b voyage/hyperspace-perf-N-b
# …
```

Never nest worktrees inside the checkout. Remove finished trees
with `git worktree remove --force` before re-cutting a path.

### 1. Recon (read-only map; no product edits)

One recon crew, the recon tree. They do not implement. They
profile, read, and write a map into
`packages/reference-neo/docs/evidence/fasthull-recon-N.md` **and**
a one-line summary into `VOYAGE-HYPERSPACE-PERF.md`.

The map names **several avenues**, each:

- what work we do that Panda (or a tight engine) appears to skip
- why it would move **sync wall**, **peak RSS**, and/or **bundle
  bytes** (`styles.css` and/or `runtime-data.mjs`)
- evidence: profile, allocation shape, or a counted artifact
  (JSON payload fields, live allocator count, recipe rule count)
- disjointness: can this share a wave with which other avenues?
- out-of-bounds check: not harvest-kill, not load-weaken, not a
  Panda architecture clone

Wave-1 recon starts from these suspects (confirm or kill with
evidence; add others; do not treat the list as the backlog):

1. **N-API JSON of the whole `CompileResult`.** Production `sync()`
   uses stylesheet, portable stylesheet, `runtime`, hosts,
   diagnostics. The bridge still serde's `css.classes` (the
   per-atom map Jettison stopped shipping), `wants`, `style_plans`,
   and two full sheets. Time and RSS.
2. **Two full utility sheets.** `build_stylesheet_with` and
   `build_portable_stylesheet_with` both print the utilities
   layer. Token selectors differ; 14 MiB of atoms should not.
3. **15k Oxc allocators live until the end.** Dead files
   (`FACTOR_n`) do not need their AST after constants are copied
   out.
4. **Extra AST walks on the dead majority.** Diagnostics analysis
   and harvest pool collection visit every parse. Cheap skip when
   the source cannot contain `css(` / `recipe(` is a walk scrape,
   not a harvest-doctrine change.
5. **Disk scan reads, then glob-filters.**
6. **Recipe closed classes vs shared atomics.** Panda's 2.7 MiB
   vs our 14.3 MiB. Hypothesis must say how paint and recipe
   stations still hold. This is the bundle-size lever. It is not
   "delete recipes."
7. **`runtime-data.mjs` at 3.9 MiB vs Panda's 71 KiB JS.** Recipe
   tables scaling with 440 exports, not namer physics. Size lever
   if tables are duplicating sheet information.

Spent avenues live in the perf log. Recon does not re-propose a
killed or landed hypothesis without new evidence.

### 2. Perf crews (Fasthull; parallel; one hypothesis each)

Each crew is a full Fasthull team on its own tree
([operation-fasthull.md](docs/missions/operation-fasthull.md)):

1. **Profiler** — owns this crew's one hypothesis, with profile
   evidence against the locked load.
2. **Architect** — concurs before implementation; kills are one
   line in the perf log, not a funeral.
3. **Implementer** — one change inside the boundary; benches in
   **this worktree** (`pnpm bench:neo`; dirty pin is
   `reports/latest/`, dies with the tree).
4. **Reviewer** — different agent from profiler and implementer.
   VERIFIED or GAPS firsthand: bench deltas, stability, diff vs
   boundary.

Stability tonight: `pnpm agentrs` on the touched crates (atomic
loop at minimum) and `pnpm agentneo` on the neo cases. Churn
guardrail: `--scale churn` unregressed beyond noise if the change
can touch namer/harvest/atoms; skip only when the architect
writes why churn cannot see the change. Pre-existing red
(virtualrs goldens, etc.) is named and shown unrelated — never
absorbed.

Bytes: identical, **or** the hypothesis explained why they moved
(emission skip, not a quieter load). Paint and stations still
hold.

A disproven hypothesis is a complete cycle — log it and move on.

### 3. Rendezvous

Crews do not merge. They report VERIFIED / GAPS / died into
`VOYAGE-HYPERSPACE-PERF.md` on their branch. Captain, on the main
line:

1. Wait until every live perf crew has written a terminal entry
   (or failed the deadlock test and been replaced/killed).
2. Merge VERIFIED arcs one at a time, independent files first.
   Same-hunk conflicts: pick one, send the other to wave N+1.
   Never smash two emission-model changes in one merge.
3. After each merge: firsthand `pnpm agentrs` / `pnpm agentneo`
   as scoped above, then `pnpm bench:neo` on the main line.
   Hash-pin only on a clean main tree, reports ignored by the pin
   rule. If the merge regresses sync, RSS, *or* bundle against
   the pre-merge pin, revert, log, ride forward.
4. Commit named files only, one verified arc per commit. Crews
   never commit.
5. Close the wave in `VOYAGE-HYPERSPACE-LOG.md`: what merged,
   bench deltas vs `5eda2c60b7e5` and vs Panda, what rode, what
   died.

### 4. Fresh oracle / recon

A **new** recon/oracle crew (not the implementers) reads: the
wave close, the new pin, the remaining Panda gap, the perf log.
They write `fasthull-recon-(N+1).md`: what is still thick, what
is spent, the next disjoint set. Then cut wave N+1. The loop has
no last wave — HQ's morning is the only exit.

If recon says the remaining gap is architectural copy or harvest
kill, they log that as a morning question and pick the next
*in-bounds* scrape instead of stalling.

---

## Measuring

- Locked load: Neo default suite, seed 7. Enterprise is the
  optimisation target. Small and medium are the shape check.
- Locked comparison, every pin: **median sync wall**, **peak RSS**,
  **`styles.css` bytes** (raw + gzip), **`runtime-data.mjs` bytes**
  (raw + gzip). Report all four vs the wave-start pin and vs Panda.
- Worktree benches write `reports/latest/` (untracked). Hash pins
  are the captain's, main line only, at arc boundaries.
- Timed runs need quiet. Parallel crews may generate and compile
  in their own trees; the captain sequences **main-line** timed
  pins so two `bench:neo` enterprise runs do not share the box.
  RS work coordinates through `/tmp/reference-ui-cpu-gate`.
- A win must clear the measured run-to-run spread, not beat one
  sample.

## Never interrupt working crews

Read-only liveness only: log writes plus work products. No vitals
pings. Talk to stuck crews (silent, circling, waiting on itself),
never to moving ones. This binds the captain and every observer
all night.

## The morning

When HQ wakes (or orders park): finish in-flight arcs, never
strand a half-verified merge; close the wave in the log; commit;
dispatch nothing further. Resume checklist: what is COMPLETE,
what rode, the exact next recon dispatch. HQ reads, in order: the
voyage log, the perf log, the latest recon note, the latest hash
pin next to Panda's `report.md` — then ratifies, pushes, and says
satisfied or not.
