Status: PLANNED — handoff-ready, no crew dispatched. Receiving agent owns execution.

# STYLETRACE-PERF plan

Cut styletrace-dominated `sync()` wall on the reference-lib-shaped world.
HQ law: absolutes from agent envs are noise (deprioritized Darwin QoS,
sick-box load swings) — optimize the share and the structure. Every diet
removes counted work and proves it by counts plus byte-identity plus
determinism, never by a single stopwatch reading.

## 1. Grounding evidence (measured 2026-09-30, base `488bcfd7a`)

The target world is `packages/reference-lib` itself: 387 dense `src`
files plus 12 `book` files, full design-system components with barrel
re-exports. Config at `packages/reference-lib/ui.config.ts:12-22`
documents ~330 ms of StyleTrace edge resolution for the `src/index.ts`
barrel alone (Obj-3, LOG-3) with a `!src/index.ts` negation guarded by
`packages/reference-neo/src/sync/lib-barrel-negation.test.ts`.

Phase split of one `sync()` on that world (loaded box, phases file via
`REFERENCE_UI_PHASES_OUT`): sync 1914 ms = compile 1758 + scan 79 +
config 17 + publish 49 + residual 2. Compile is 92% of sync, and the
compile leg on this world is styletrace edge resolution over the dense
re-export graph. Same world on a quiet box boots `ready in ~900 ms`
with byte-identical output (261.8 KB CSS, 12 warnings) — the share is
the structural fact, the absolute follows box load (observed 1.4–3.3,
21-day uptime, agent subshells at background QoS).

Contrast: bench enterprise synthetic (3000 sparse files, 7.5k calls)
runs ~975 ms loaded-box with compile ~514. The synth world has no
barrel graphs and does not reproduce the lib shape. The lib world is
the pathological case and the mission target; enterprise bench is the
regression guard, not the goal.

Watch-boot wall for context (same world, loaded box): sync ~1900 +
parcel subscribe ~900 + tasty ~800 backgrounded out of `ready` since
`488bcfd7a`. Subscribe attach is boot-only, awaited per root at
`packages/reference-neo/src/lib/watch/index.ts:417` — a separate
topic, not this mission's ground (see §4).

## 2. Protocol (mandatory, no exceptions)

This mission runs under the `agent-perf` skill
(`.agents/skills/agent-perf/SKILL.md`): rolling swarm, verdict bars,
bench lock, perf index. The receiving agent reads it first.

- Index before scoping: `pnpm agentperf search` across styletrace,
  compile, barrel, edge synonyms. Re-litigating closed ground without
  new filed evidence is a protocol violation; zero-coverage ground
  files one line (`index: 0/N`) and proceeds.
- Fresh flames before any wave: 2+ reconciled captures on current tip
  under `docs/EVIDENCE/flamegraph/`, never stale. Landed diets move
  every room.
- Timed blocks hold `/tmp/swarm-bench-lock` (two-step release) and run
  through `pnpm agent` QoS elevation or the terminal daemon — never raw
  subshell commands. Record load + uptime with every set. Warmups
  unscored, pin stream always, binaries sha-verified before and after.
- Bars: solo LAND ≥15 ms and ≥1.5% whole-sync (8-pair); per-phase floor
  5 ms; BANK needs 8-pair + 4-scale byte-identity + determinism +
  suites green + `agentrs q` 0 violations. Byte-identity is 4/4 with an
  explicit order argument (sortshape bar).
- Never `git stash` in worktrees (stash refs are global); file asides
  only. Never touch foreign processes; name noise and discard whole sets.
- Closeout per landing: committed bench report + scoreboard row + flame
  refresh, same tick; `pnpm agentperf rebuild` absorbs the wave.

## 3. Engagement shape

Worktree from tip (`488bcfd7a` or later). The live `dev:lib` session is
the user's and holds the sync lock — a second sync inside
`packages/reference-lib` contends or fails, so crews never run there.

Target-world recipe (proven 2026-09-30, byte-identical outputs):
copy `src`, `book`, `ui.config.ts` from `packages/reference-lib` to a
scratch dir and symlink its `node_modules` in. Drive it through the
public interface only: `node packages/reference-neo/bin/ref.ts sync
[--watch] <dir>`, or `sync()` + `writePhasesFile()` from
`packages/reference-neo/src/sync/phases.ts` for phase splits — the CLI
never flushes the phases file (the bench worker owns the write), so a
raw-`sync()` probe is the accepted attribution harness.

Flame capture goes through the established samply/bench path on the
lib-shaped world (see §2); count probes first, diets second. No crew
briefs a hypothesis the flames have not named.

## 4. Fences

Ground: the styletrace module (`packages/reference-rs/modules/styletrace`)
plus its call path down from the sync compile leg. Fences vs landed or
worked ground come from the perf index, by function, never by directory.

Off-scope unless HQ widens: tasty/reference-types (backgrounded, owned,
`~800 ms` off the hot path); parcel subscribe attach (`~900 ms`,
boot-only — file as its own BANK with the surface denominator under the
off-scope proof rule if briefed); CLI display (landed in `488bcfd7a`,
pinned by NEO-CLI-02). Drift without a ruling is a protocol violation.

## 5. Unranked threads (flames rank these; nothing here is briefed as fact)

- Barrel re-export edge resolution (`~330 ms` documented for one file;
  exclusion precedent + guard test exist — the general case is open).
- Per-file edge fan-out across 387 dense files vs the sparse synth shape.
- Alloc/copy shape inside the compile leg, flame-directed.
- Subscribe-attach cost (separate boot-only topic; see §4).

Dry rooms get named, never re-seeded. Fast CUT is first-class.

## 6. Acceptance and handoff back

Landed diet(s) with REPORT.md verdicts (INTEGRATE.md for sets), each
landing committing its bench report, scoreboard row, and flame refresh
per §2. Report to HQ: before/after on the lib-shaped world (shares
plus absolutes with load notes), enterprise bench delta, index entries
filed, wave archived. The mission is done when the compile share on
the pathological world drops with all bars cleared — not when one
stopwatch reading looks nice.

## 7. Receiving-agent checklist

1. Read `.agents/skills/agent-perf/SKILL.md` in full.
2. `pnpm agentperf search` the §2 synonyms; file the coverage line.
3. Read `packages/reference-lib/ui.config.ts:1-30` and the barrel guard test.
4. Reproduce the §1 phase split on a scratch copy (recipe in §3).
5. Fresh flames on tip, 2+ reconciled, under `docs/EVIDENCE/flamegraph/`.
6. Rank the §5 threads from the flames, brief crews, run the swarm.
