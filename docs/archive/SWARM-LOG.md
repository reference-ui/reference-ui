# Swarm master log

Running record of every perf-swarm wave. Future waves: read this file first
for prior topics, verdicts, and dead ends — then work your own hypothesis in
isolation. Do not coordinate with past agents; do not relitigate their
verdicts. Standing protocol (base-pin, claims file, bench lock, LAND bar)
lives in the dispatch brief, not here; this log records outcomes and lessons.

## Program target: enterprise sync ≈ 700 ms (Panda-adjacent)

Set 2026-09-21 by HQ. Panda v2 goalpost is 645 ms on the same seed-7 app
load (3,000 files, 7,527 css() calls, verified firsthand in
`panda-bench/reports/latest/report.md`); our Wave 4 base is ~1186 ms, so
the program gap is ~486 ms (41%). The old 1000 ms line stands only as the
wave-1 milestone. Consequence, recorded so no wave forgets it: ~700 ms
cannot be reached on single-thread diet alone (plausible ceiling ≈ 340 ms
even if dead-file avoidance lands). Parallel compile — or deeper
architectural work (IR redesign, harvest-doctrine change, currently out of
bounds) — is MANDATORY to finish, not a hedge. Order stays single-thread
first (cheap before expensive), but Shot 2's information question and
Shot 3's architect memo run as heavy tracks alongside the swarm, and a
wave that kills either must say what replaces its milliseconds.

## Wave 1 — 2026-09-21, base `1a57b1e80`

Five disconnected engineers, one hypothesis each, 6-pair enterprise A/B,
LAND bar ≥15 ms + ≥1.5% with tests + byte-identical output + determinism.

| agent | topic | verdict | delta (enterprise medians) | mechanism in one line |
| --- | --- | --- | --- | --- |
| swarm-keys | lookup-key serialization diet | CUT | n/a (killed pre-measurement) | 5.54x duplication real (106,278/19,187 keys) but 19 wt ceiling < bar even at 100% capture |
| swarm-canon | canon lookup memo/PHF | LAND (accepted, confirm set needed) | −39.6 ms / −3.15% | `maybe_alias` rejection pre-filter: misses skip the 315-entry binary search after 1–2 byte ops; 315/315 table members verified passing |
| swarm-emit | stylesheet emission diet | CONDITIONAL (confirm set needed) | −24.6 ms / −1.95% protocol; −15.3 / −1.22% ex-outlier | direct-push rule emission: per-atom heap allocs ~6–11 → 0, format! collapse, pre-sized buffers |
| swarm-islen | `is_length` no-alloc | CUT (standalone) / BANK (combine) | −16.0 ms / −1.26% median, 5/6 pairs negative | +19/−3, allocs 32,696 → 0 over 32.7k calls, zero divergences; misses 1.5% prong alone but proven-identical — combine with canon, confirm the sum |
| swarm-reserve | reserve-once at growth sites | CUT (standalone) / BANK (combine) | +16.5 ms / +1.31% medians (ms ✓, pct ✗, ±71 noise) | reallocs −394,867 (−35.3%), transient −24.4 MiB, all phases green-or-zero; 6 files +56/−21 exact-capacity math, zero soundness surface |

Reports: `REPORT.md` in each retained worktree
(`.muse/worktrees/subagent-v2-01a0c512-*/`). Keys left zero diff;
canon touched `canon/{src/dialect.rs,src/tests.rs,generate/emit/dialect.ts,
generate/emit/tests/join.ts}` (101+/1−); emit touched 5 atomic files,
164+/36−.

Residue worth keeping:

- Keys' exact counts (decl 35,426/19,187, exact 70,852/19,187, identical
  sets, 85% scalar-only) are the design input if the bar ever goes
  per-phase (compile ≈ 780 ms → ~12 ms revives the lane).
- Canon's filter arms are emitter-derived with a generator throw + table
  contract test; any new alias initial fails loudly. Note: full canon
  regen drifts on unrelated files (pre-existing emitter/data drift) —
  generated hunks were hand-applied and diff-verified.
- Emit deliberately left the sort comparator, `CascadeKey`, and canon
  lookups untouched (~14 wt + 7 wt remain for a follow-up with its own
  byte-identity proof). Its 3-line buffer pre-size overlaps reserve's
  topic; cleanest wins ties.

Process lessons for wave 2 briefs:

- **Warmup discipline is mandatory.** Both LAND claims had pair-1 outliers
  (canon −120.78, emit base 1464.3 cold start). Future briefs: 1–2 unscored
  warmup runs per arm before the scored pairs, and the verdict median must
  stand with run 1 excluded.
- Keys showed the ideal fast CUT: mechanism counts first, no bench lock
  burned on a below-ceiling hypothesis. Keep rewarding that shape.
- Reserve died on model-service network failure with zero product — respawn,
  don't deliberate. Claims file + stale-steal rule covered the fallout.
- **Bench-lock release needs `rm -f owner` before `rmdir`** (bare `rmdir`
  fails on the non-empty dir — islen found this). Wave 2 briefs must spell
  the two-step release or the lock wedges until stale-steal.
- Sub-bar proven-identical diet (islen: +19/−3, 32k allocs → 0, zero
  divergences) should BANK into the landing set and confirm as a sum
  rather than CUT outright — the bar screens solo wins, not combined
  diet. Distinct from keys' CUT, where the ceiling itself was the bar.
- Reserve is the same shape at larger scale (−35% reallocs, wall lost in
  ±71 ms noise, +56/−21 zero-risk diff): BANK, don't CUT. Also fixed its
  own rmdir lock bug mid-run without leaking — the stale-steal rule held.

## Wave 1 close — pick round (all five reported)

- **LAND set (combined candidate, one confirming protocol): canon +
  islen + reserve + emit.** All four are individually correctness-proven
  (tests green, 4-scale byte-identity, determinism) and touch disjoint
  files — zero merge risk. Expected combined ≈ 60–90 ms (canon ~37,
  emit ~15–25, islen ~10–16, reserve ~12–24, minus interaction losses).
- **CUT:** keys (19 wt ceiling < bar; residue kept for a per-phase bar).
- **Confirm discipline (new, from wave-1 warmup lessons):** 1–2 unscored
  warmup runs per arm, 8 interleaved pairs, verdict must stand with run 1
  excluded. If the sum disappoints, bisect per-component; do not ship the
  bundle on faith.
- Wave 2 seeds from the post-landing burndown (re-profile after wave 1
  lands — the modules shift). Unworked rooms: module-graph remainder,
  diagnostics/proof, parse/oxc diet, canon cluster remainder.
- Integration model (HQ directive, wave 1 on): after each wave, combine the
  LAND-set diffs and dispatch ONE integrator with per-change descriptions
  to examine them together for behavioral collisions — textual disjointness
  is checked mechanically first (`/tmp/wave1-*.patch`, DISJOINT verified).
  Wave-1 integrator (`wave1-integrate/7`) dispatched with warmup-discipline
  confirm protocol + bisect instructions.
- **Standing land rule (HQ):** no collisions, decent code quality, no new
  test reds, no possible regressions → land. The integrator's verdict is
  final on these four; wall-clock size only decides pick order, never
  blocks a clean combined set.
