# Wave 2 lane C review — publish once (B2) + burndown ride-along

Reviewer: independent lane-C reviewer (subagent). Worktree
`/Users/ryn/Developer/reference-ui-perf-2-c`, branch `voyage/hyperspace-perf-2-c`.
All numbers below were run firsthand in-tree; lead's numbers are cited only for comparison.

Verdict: **VERIFIED** (one caveat: hairline enterprise edge-touch, see §2).

## 1. Boundary — PASS

`git diff --stat`: exactly 5 product files changed, all in bounds:

- `src/sync/publish/system.ts` (stage + `baseSystemMjsSource`/`stage`/`take`)
- `src/sync/publish/styled.ts` (finalize-once, patch fn deleted)
- `src/sync/publish/react-shell.ts` (`copyFileSync` css)
- `src/sync/publish.ts` (order comment only, +2)
- `benchmark/deepsee/burndown.ts` (fenced `waitReady` hunk only)

Also dirty but out of scope per brief: `VOYAGE-HYPERSPACE-PERF.md`,
`benchmark/reports/latest/*` (rewritten by my own bench runs),
`tests/.artifacts/*`. Verified: `sync/index.ts` untouched (empty diff),
`worker-phases.ts` untouched, zero `.rs` files changed (`RS-CLEAN`),
`portableTypesSource` absent from the system.ts diff (lane-b mirror intact),
burndown hunk confined to `waitReady` (`waitDone` untouched).

## 2. Bench — bytes EXACT; win corroborated (caveat noted)

Full suite firsthand (seed 7): bundle objects in `result.json` **byte-exact vs
baseline at all scales** — small css 550910/34599 data 104921/20377, medium
css 2554607/146093 data 168278/24248, enterprise css 15007762/844849 data
530606/43639.

Same-box back-to-back A/B (new code vs stash-restored baseline, minutes apart):

| scale | new (sync ms) | base (sync ms) | Δ median |
|---|---|---|---|
| small ×3 | 125.2, 125.3, 123.5 | 125.5, 127.6, 128.9 | ≈ −2.6 |
| medium ×3 | 335.9, 337.7, 336.7 | 349.9, 349.4, 348.3 | ≈ −12.4, spreads disjoint (10 ms daylight) |
| enterprise | 2373.8, 2389.5, 2389.9, 2467.5 (+2.62s keep) | ~2510, ~2460, ~2450 (+2.64s keep, table precision) | ≈ −70 (−2.8%) |

Caveat: enterprise spreads edge-touch — new max 2467.5 vs base min ~2450
(≤18 ms overlap, one sample; box shared/noisy, both groups have one slow
outlier). Against that: medium is cleanly disjoint; my deltas (−2.6/−12.4/−70)
replicate the lead's independently measured (−3/−11/−77); the win grows with
scale as the byte-proportional mechanism predicts (one fewer 16 MB
`JSON.stringify` + two fewer ~15 MB writes). RSS unregressed (ent 527–581 vs
621–659 MiB; medium 175–186 vs 192–206).

## 3. Output identity — PASS (22/22)

Enterprise `--keep` pre/post folders (my runs both sides): **19/22 files
raw-identical; 22/22 identical after normalizing only the `neo-bench-*` leaf**
(the 3 raw-differing files are exactly the tmpdir-embedding ones:
`baseSystem.mjs`, `compile-request.json`, `react.mjs.map`).
`baseSystem.mjs` 16258161 B both sides. Against the lead's
`/tmp/lanec-prefix-hashes.txt`: 19/19 direct hashes match (incl.
`react/styles.css` = `styled/styles.css` = `0725ad03…`); the 3 normalized
prefix hashes use an unrecorded token (~60 candidates tried, incl. the
implementer's `b3dbddb7` form — none reproduce), so the decisive proof is my
own 22/22 pre/post diff, which is stronger (full content, both sides fresh).

## 4. Stability — PASS

- `pnpm agentneo run`: **173/173 ok** (`last-run.json`, mtime = my run).
- `pnpm agentneo q` on the 5 files: **0 errors**, 2 warns, both pre-existing
  in untouched burndown regions (file-lines 422; `isWorkerResult` cyclomatic).
- `pnpm agent vt …/sync/sync.test.ts`: **18/18 passed**.
- No `.rs` changed → no `agentrs` needed (confirmed via diff).

## 5. Ride-along — PASS

`node benchmark/deepsee/cli.ts burndown --scale small`: **exit 0**, bundle
550910/104921 B, residuals 0/0, sane stage table (cross-checks close, shares
sum 100%). Success-path reading of the hunk: on READY the only addition vs
old code is a `settled = true` assignment — same resolve, same timer clear,
same 25 ms poll cadence; `fail()` (cancel poll + `worker.kill()` + reject)
executes only on timeout/error paths that previously leaked the poll and the
worker. The 120 s negative test is lead-proved (not re-run per brief).

## 6. Design soundness — PASS

- Both sequences (`src/sync/index.ts:118-131`,
  `benchmark/deepsee/worker-phases.ts:116-125`, both unchanged) pair
  `publishSyncFolder` → `publishRuntimeBundle` for the same `outDir` with no
  `baseSystem.mjs` reader between (only a `compile-request.json` write); grep
  confirms no other callers of the changed/stage functions.
- Byte identity: same builder output object flows stage → take; `runtime` key
  always present (placeholder or `input.runtime`) so overwrite keeps key
  position; same template + same `JSON.stringify(obj, null, 2)` call factored
  into `baseSystemMjsSource`. Old intermediate write+parse was a key-
  and value-preserving round trip for this JSON-native content.
  `react/styles.css` is a bit-copy of `styled/styles.css`, which holds exactly
  `input.stylesheet` (styled leg runs first; order comment added).
- Observations (not gaps): a throw between stage and take leaks one Map entry
  until process exit/same-outDir overwrite (old code left a half-written dir
  instead); unpaired `publishRuntimeBundle` now writes no `baseSystem.mjs`
  rather than patching — unreachable, both call sites always pair.

## 7. Incident during review (resolved, action needed for lane D)

To get a same-box baseline I used `git stash push -- <5 files>`; linked
worktrees share one `refs/stash`, and a concurrent lane-D agent's push
interleaved, so my `pop` consumed **lane D's stash** (`WIP on
voyage/hyperspace-perf-2-d`) into this tree and dropped it from the ref.
Recovered fully: foreign RS dirt reverted; my changes restored from dangling
commit `034f049f` with diff fingerprint `cf51311a…` **matching pre-stash
exactly**; shared stash list left as found (2 foreign entries); lane-D tree
verified uncontaminated (no `stageBaseSystem`).

**Lane D's stashed work survives only as dangling commit
`0566fae4a7f13c6c501128c255d246dc51de48ca`** ("WIP on
voyage/hyperspace-perf-2-d": `atomic/src/hosts/entries.rs` +87,
`styletrace/src/tests/mod.rs` `mod trace_gate;`) **and backup copy
`/tmp/lanec-foreign-rs.diff` (113 lines). Lane-D agent: `git stash apply
0566fae4a7f13c6c501128c255d246dc51de48ca` in your tree to recover — do NOT
`pop` blindly on the shared stash ref.**
