# LOG — perf swarm record

Target: enterprise sync ≈ **700 ms** (Panda-adjacent). Panda v2: 645 ms /
261 MiB / 2.8 MiB on the same seed-7 app load (3,000 files, 7,527 css()
calls; `panda-bench/reports/latest/`, 2026-09-20, darwin x64). Wave-4
base: ~1186 ms / ~349 MiB / bundle home. Program gap ≈ 486 ms (41%).

Consequence, recorded so no wave forgets it: ~700 ms cannot be reached
on single-thread diet alone (plausible ceiling ≈ 340 ms even if
dead-file avoidance lands). Parallel compile — or deeper architectural
work, currently out of bounds — is MANDATORY to finish, not a hedge.
Order stays single-thread first (cheap before expensive).

## Scoreboard (enterprise medians, seed 7)

| point | sync | peak RSS | styles.css + data | vs Panda sync |
| --- | --- | --- | --- | --- |
| S1–S4 pin `5eda2c60b` | 3.51 s | 796 MiB | 14.3 MiB + 3.9 MiB | 5.4x |
| Hyperspace W1 | 2.46 s | 671 MiB | — | 3.8x |
| Hyperspace W2 | 1.66 s | 308 MiB | 2.7 MiB + ~310 KiB | 2.6x |
| Hyperspace W3 | 1.31 s | ~345 MiB | — | 2.0x |
| Hyperspace W4 (= swarm base `1a57b1e80`) | 1.19 s | 349 MiB | 2.87 MiB + 214 KiB | 1.84x |
| Swarm wave 1 (`0a7330c76`) | ≈ 1.16 s (provisional) | ~345 MiB | exact | ~1.8x |
| Target | ≈ 700 ms | guardrail | guardrail | ~1.1x |

RSS and bundle are at Panda parity and are guardrails now, not targets:
no wave may regress them to buy sync.

## History (Hyperspace, archived)

Full record: `docs/archive/VOYAGE-HYPERSPACE.md`,
`VOYAGE-HYPERSPACE-PERF.md`, `VOYAGE-HYPERSPACE-LOG.md`.

- W1 (3.51 → 2.46): dead-file fast path (byte gates, −620 ms), slim
  N-API result, single sheet print, recipe grouping + runtime tables,
  deepsee burndown tooling.
- W2 (2.46 → 1.66): recipe sheet collapse (css → 2.7 MiB), recipe data
  derivation (−40%), bundle parity reached.
- W3 (1.66 → 1.31): trace wall redux (parse-failure keep-alive, −116),
  resolver staging, ladder + caching lanes.
- W4 (1.31 → 1.19): four diet lanes landed on the sum (−120);
  lane claims 116–142 ms, honest additivity.
- Flamegraph Correct (6/6): weighted aggregation, same-run phases,
  stall/throttle fixes, dual RSS, per-phase alloc counts. Recon v2
  sealed the instruments; Warpdrive's three shots were specified but
  never crewed — superseded by this swarm (`docs/archive/`).

## Wave log

### Wave 1 — 2026-09-21, base `1a57b1e80` → landed `0a7330c76`

6-pair enterprise A/B per crew, LAND bar ≥15 ms + ≥1.5% + green suites
+ 4-scale byte-identity + determinism ×2. Full reports:
`docs/perf/waves/wave-1/` (filed at close; worktrees are ephemeral).

| agent | topic | verdict | delta |
| --- | --- | --- | --- |
| swarm-keys | lookup-key serialization diet | CUT | n/a (pre-measurement kill) |
| swarm-canon | canon lookup memo/PHF | LAND | −39.6 ms / −3.15% |
| swarm-islen | `is_length` no-alloc | BANK → landed | −16.0 / −1.26% (sub-bar solo) |
| swarm-reserve | reserve-once at growth sites | BANK → landed | +16.5 / +1.31% (sub-bar solo) |
| swarm-emit | stylesheet emission diet | CONDITIONAL → landed | −24.6/−1.95% (−15.3/−1.22% ex-outlier) |
| wave1-integrate | combine + collide + confirm | LAND | combined −65.9 / −5.36% (8-pair, run 1 excluded) |

Attempt specificity (so no future wave retries these blind):

- **keys (CUT, zero diff):** counted, never built. decl 35,426/19,187
  unique, exact 70,852/19,187, identical key sets, 5.54x duplication,
  85% scalar-only — but addressable subtree 19 wt < bar at 100%
  capture. Revives only under a per-phase bar. Report:
  `docs/perf/waves/wave-1/report-swarm-keys.md`.
- **canon (LANDED in `0a7330c76`):** `maybe_alias` pre-filter in
  `canon::dialect::resolve_alias` (`modules/canon/src/dialect.rs`):
  initial-byte + length gate, misses skip the 315-entry binary search,
  members fall through unchanged. 315/315 table members verified
  passing (agent contract test + independent re-verification). Arms are
  emitter-derived (`generate/emit/dialect.ts`); full canon regen drifts
  on unrelated files (pre-existing) so generated hunks were
  hand-applied and diff-verified. Follow-ups welcome on the remaining
  lookup shape (match/PHF dispatch, caller-side memo).
- **islen (LANDED in `0a7330c76`):** `is_length`
  (`canon/src/css/values/lengths.rs` +19/−3): parse trimmed `&str`
  directly, `eq_ignore_ascii_case` suffix match; `to_ascii_lowercase()`
  alloc gone (32,696 → 0), zero divergences over 32.7k differential
  corpus. Nothing left here without changing the f64 grammar path.
- **reserve (LANDED in `0a7330c76`):** exact-capacity joins
  (`join_with`/`concat2`, `module-graph/src/ladder/*`), `key.rs`
  `with_capacity`, includes needle pre-size, `builder.rs` `decls.len()`
  reserves. reallocs 1,117,428 → 722,561 (−35.3%), transient −24.4 MiB,
  every moving phase green-or-zero. Deliberately untouched and still
  open: `format_entry` + emit `format!`s (keys/emit ground), wants vecs
  + `sorted_entries` (cardinality unknowable), one-shot lib.rs collects.
- **emit (LANDED in `0a7330c76`):** direct-push rule emission
  (`atomic/stylesheet/{cascade,emitter,name}` + `resolve/lexical.rs`
  decimal fast path): per-atom heap allocs ~6–11 → 0, format! collapse,
  pre-sized buffers, `EscapeCursor` preserving positional escape rules.
  Deliberately untouched and still open: sort comparator,
  `CascadeKey::from_atom`, per-declaration canon lookups (≈ 21 wt).
- **integrate:** 4 patches DISJOINT (16 files) verified mechanically;
  behavioral hunt (canon×islen prop-vs-value split, reserve×emit
  capacity-vs-buffer independence, EscapeCursor hostile read) found no
  collisions; emitter-vs-checked-in diffed identical via the real
  `emitDialectRs`; islen differential re-proven (0/6916 in combined
  tree); 8-pair confirm −65.9/−5.36% ex-run-1, all green. No bisect
  needed. Post-land spot check on `0a7330c76`: enterprise 1164 ms
  median (n=3, provisional), cssCalls/bytes EXACT.

## Rooms (sized, sourced)

From `enterprise-flame3` + recon v2 (`docs/missions/completed/`):

- Dead-file opens ~190 ms — needs a SOUND pre-open deadness signal on
  arbitrary repos. The only concentrated signal in the profile (250/251
  via `uv__fs_work`); per-op is floor. Heavy track #1.
- Parallel compile ~100–250 ms — file-level ≈ 100–140; `AssembleCtx`
  (296 wt) is the serial bulk needing its own partition design.
  Heavy track #2. Deterministic merge, bit-identical output.
- Realloc/alloc volume ~25–50 ms — 1.12 M reallocs; wave 1 banked −35%.
- Canon lookups ~83 wt cluster (memo/cmp/alloc shape); ~37 banked.
- Serializer/module-graph allocs ~40–60 wt; ladder joins partly banked.
- Diagnostics/proof 76 wt incl — unworked.
- Parse/oxc ~110 wt (export-heavy) — unworked; moves only with less input.
- Stylesheet emission remainder ~20 wt (sort, keys) — unworked.

## Dead ends (no retry without new filed evidence)

From Warpdrive §13 + Hyperspace graveyard + wave 1:

- GC scheduling / forced collection (zero in-window full GCs).
- Pure-JS micro-work (2.3% self).
- Per-open optimization (15.87 µs is floor; only count matters).
- Parallel scan reads (async + 64-worker both regressed).
- Single-function spikes as lanes (long-tail flat).
- `memmove`/`memcmp` standalone (effects, die with parents).
- Ship-one-sheet, harvest kill/rewrite, B3 plan gating, insert-skip
  (LEAF-11), eager refinement, C4 memo as built — rule-proven deaths.
- Keys memo at whole-sync bar (19 wt ceiling; needs per-phase bar).
- RSS hunters / bundle lanes (guardrails, not targets).
- Warm second-sync, churn profiling, new profiling infra as objectives.

## Backlog (seed from here + fresh burndown after every landing)

Module-graph remainder; diagnostics/proof diet; parse/oxc diet (visit
less, not faster); canon cluster remainder; cascade sort + keys;
keys memo (per-phase bar); Shot 2 information question; Shot 3 memo.

## Process lessons (standing)

- Warmup discipline: 1–2 unscored runs per arm; verdicts must stand
  with run 1 excluded (both wave-1 LANDs had pair-1 outliers).
- Bench-lock release is two steps (`rm -f owner && rmdir`); bare
  `rmdir` fails and wedges the lock until stale-steal.
- Bank sub-bar proven-identical diet into combined sets; CUT only when
  the ceiling itself is the bar.
- Crews read LOG.md; only the captain writes it. At wave close the
  captain files every crew REPORT plus INTEGRATE.md under
  `docs/perf/waves/wave-N/` (worktrees are ephemeral) and writes
  function-level attempt entries here — exact functions, exact
  transformation, numbers, verdict — so no future wave retries landed
  or killed work blind. Landed work stays improvable (cite the prior
  attempt, beat it cleanly on the new base).
- Respawn infra deaths without deliberation; overlap is replication,
  cleanest wins ties; first sound LAND wins races.

## Wave 2 — IN PROGRESS (seeded 2026-09-21, perf base `0a7330c76`)

Mission-records filing commit (VOYAGE.md, LOG.md, `docs/perf/waves/wave-1/`,
archive moves) lands before dispatch; briefs pin that hash. `packages/`
tree identical to `0a7330c76` (docs-only). Claims truncated at seeding;
bench free; no live crews at seed time.

Topics: modgraph remainder (swarm-modgraph), diagnostics/proof diet
(swarm-diag), parse/oxc visit-less (swarm-parse), canon remainder
(swarm-canon2), cascade sort+keys (swarm-cascade), keys memo per-phase bar
(swarm-keys2); reserve → Shot 3 parallel-compile architect memo
(swarm-memo). Held for first respawn: Shot 2 information question.

Infra note: stale worktrees observed at seed (wave-1
`.muse/worktrees/*` at `1a57b1e80`, hyperspace/warpdrive trees) — left
untouched; release only if disk blocks builds.
`packages/reference-neo/benchmark/reports/latest/*` mods left uncommitted
(live/regenerable, possibly another session's).

### Landings / verdicts

(none yet)
