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
| Swarm wave 2, set 1 (`810b8b5b4`) | ≈ 1.07 s | ~345 MiB | exact | ~1.66x |
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

## Rooms (sized, sourced — post wave-2 set-1 re-profile)

From `enterprise-repro1/2` (base `810b8b5b4`, sync ≈1098) +
`enterprise-flame3` (pre-wave-1) + recon v2:

- Dead-file opens ~190 ms — KILLED (Shot 2: no sound pre-open
  signal). Scan wall flat 364→368. Heavy track #1 dead.
- Parallel compile — BANNED by HQ directive (slice1b CUT). Heavy
  track #2 shelved. AssembleCtx 296 wt serial bulk remains the
  shape serial diet works inside.
- Diagnostics/proof 76 → 49/51 (diag cluster dead: render_fact +
  render_expected GONE ×2 captures). REMAINDER ≈ 47: analysis
  22 + proof 25 (collect 13 + render_with 12) — unworked.
- Parse/oxc: Parser::parse 58 → 34/34 (re-parse callers GONE ×2,
  −24 ≈ mechanism). Remainder: main 25 + streamed ~9–14 (floor).
  Retained parsing DRY (one parse per file); streamed DRY-as-floor.
- Canon cluster: resolve_alias 33→10, is_length 25→9/12 (malloc
  ancestor GONE), classify 32→16/8, is_named_color 11→6/3.
  Remainder: find_property 28/29 + is_known 22/29 (noise-jittered;
  findprop census 13.1 stands — whole-sync CUT, per-phase only).
- Cascade/emission: write 51→29/29 (rock solid), sort closure
  13→5, rank frame GONE (memo verified), from_atom 6→3.
  Remainder 29: selector-push 12 (wave-1 emit's fn, unworked) +
  driftsort 10 + keys 3. Shape changes BARRED (sortshape).
- Serializer/module-graph: ladder 37→21/22, walk 36→24/28,
  build_keyed 83→71, serialize 19→16 (matches keys2 phase
  bench to the unit). Keys2 diet tail → scalarjson bank.
- Realloc/alloc: do_reserve 63→29, finish_grow 69→33,
  format_inner 42→8 (remainder: format_entry 5 + lower_when 2),
  memmove 70→53, memcmp 52→32. Remainder shape: String::clone
  26 + Box<str>::clone 25 (clone plasma ≈ 42 malloc-caller).
- Resolve: resolve_want_with 137→113, resolve_token_value 43→26,
  expand_shorthand 23→7/10 (unclaimed canon dividend).
  Remainder bundle ≈ 28 (authored_key 10 + css_value 11 +
  shorthand 7–10).
- Harvest: classify 24→8, collect_pool 32→18, mint flat 13→12.
- Marshal: to_napi_value 2→3 (flat, tiny — NO marshal room).
  Compile_system edge carries the win through, adds none.
- Scan: collect 37→36, sorted_entries flat. Untouched as designed.

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

## Backlog (re-seeded post set-1 from enterprise-repro1/2)

Ranked by addressable size (wt≈ms post-land); dry rooms excluded:

1. Proof-render diet (collect 13 + render_with 12 = 25, unworked
   diag remainder) — DISPATCHED swarm-proof.
2. Selector-push diet (12, wave-1 emit's fn, unworked; shape
   changes barred by sortshape).
3. Clone-plasma census→diet (String 26 + Box 25 incl, 42
   malloc-caller; must SUM to live — per-site sub-bar) —
   DISPATCHED swarm-cloneplasma (post set-2, tip 0a57316).
4. Resolve remainder bundle (≈28: authored_key 10 +
   css_value_from_authored 11 + expand_shorthand 7–10) —
   expand_shorthand DISPATCHED swarm-shorthand; authored_key +
   css_value_from_authored DISPATCHED swarm-authcss (post set-2,
   tip 0a57316).
5. Identity-extend remainder (34; SEQUENCE AFTER hashers bank
   lands, then re-profile).
6. Analysis expectations walk (22, css::expectations 16;
   unworked).
7. find_property PER-PHASE-BANK framing only (whole-sync CUT
   stands at 13.1).

Set-2 integration (scalarjson + hashers + extract, new base) —
DISPATCHED swarm-intset2. Dry: diag render cluster, parse
re-parse, streamed floor, cascade rank/shape, resolve_alias
miss path, is_length alloc, keys memo, all 11 whole-sync CUTs,
both heavy tracks (shot2 KILL, slice1b ban).

## Backlog (re-seeded post set-3 from enterprise-repro3a/b)

Ranked by addressable size (wt≈ms on the ≈1000 tip); dry rooms excluded.
Full fences/tracks/bars in `report-swarm-repro2.md` ranked list:

1. LineIndex query diet (line_col 9/5 + for_source 3/6,
   mech ≈ 5–9; monotonic resume / ASCII tail / lazy line-col;
   BANK-track, realistic 3–5) — DISPATCHED swarm-lineindex.
2. push_string_want non-positional remainder (≈8–11 minus T1;
   site-tagged alloc census excl. line_col; BANK-track,
   realistic 2–4; SUM < 8 → CUT) — DISPATCHED swarm-pushstring
   (post cloneplasma LAND, tip ddce131e7).
3. Record-collect BTree audit (≈6–8 true; insert census ×
   unit microbench FIRST; RECON-with-bar, realistic 2–4;
   fantasy < 8 → CUT) — swarm-recordaudit CUT (see tail).
4. ValueGraph construction audit (22/23 setup: drops + maps +
   Fs; RECON-with-bar bundle-track, realistic 3–5;
   SUM < 8 → CUT) — swarm-valgraph CUT (see tail).
5. Scope/import-record remainder (≈6–8; borrowed-keys shape
   only if String-heavy; BANK-track, realistic 2–3;
   SUM < 6 → CUT) — swarm-scoperec CUT (T5 DRY, see tail).
6. Staged-file processing audit (13/17 + staging census;
   RECON-with-bar; WORK diet only, shot2 KILL bars skip
   logic; realistic 2–4 iff non-gating work ≥ 8 else CUT) —
   swarm-stageaudit BANK (T6 closes the re-seed; see tail).
7. Extract visit-dispatch audit (likely-CUT; SUM < 8 → CUT,
   no build unless visit-less traversal shape revives) —
   swarm-visitrec CUT (T7 DRY, see tail).
8. format_entry + token remainder (7–9; PER-PHASE-bank only,
   keys2 precedent; whole-sync CUT stands) — swarm-tokenphase
   CUT (T8 closes the re-seed; see tail).

Honest arithmetic (repro2): gap ≈ 300 vs ranked ≈70 fantasy
(≈20–35 realistic) + in-flight ≈45–55 at filed magnitude →
≈910 even stacking everything; 700 unreachable single-threaded
by ≈200+; contradiction flagged for HQ, not solved. Count
correction accepted: 12 diets landed (not 13 — captain's brief
off-by-one, repro2's catch).

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
- NEVER `git stash` in worktrees — stash refs are shared across ALL
  worktrees of the repo; an unbalanced pop in one tree drops another
  crew's stash (programsfx/intset4 incident: intset4-diet dropped,
  recovered from the object store + in-tree merge; warning posted to
  claims). Crews use file asides (`/tmp/*.diff`, `/tmp/*.node`) only.

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

- 21:47 — swarm-memo DONE (reserve): Shot 3 memo PROCEED, filed
  `docs/perf/waves/wave-2/memo-shot3.md` (298 lines, captain-read
  verified, `?? MEMO.md` only touch). Design: parallel-compute /
  serial-commit, fixed 64 input-index shards, `std::thread::scope`, no
  new deps for slices 1–3; AssembleCtx → B1/B3/B4, file-level A1/A2;
  R1–R16 determinism controls; E0–E5 falsification protocol; realistic
  band 220–340 ms saved (sync ≈ 890–1010); joint kill trigger (E2
  order-dependent + E5 < 100 ms) with 330–490 replacement stack that
  still falls short of 700 → NO-SHOT-VERIFIED path named honestly.
  First implementable slice: A1 parallel parse/constants/staging
  (~30–40 est). No bench to re-run (design deliverable); verdict
  accepted on read. Freed slot → swarm-shot2.
- Board 21:47: 6/6 implementors running with substantive progress
  (modgraph/canon2/diag/parse/cascade all past grounding; diag has a
  ~22wt mechanism, canon2 differential 756/756 zero-divergence);
  keys2 claimed, no progress line yet (12 min in — normal, watch).

Infra note: crew HH:MM stamps run ahead of captain clock (env skew);
liveness is judged by new lines between ticks + roster states, not by
stamps.

- Tick 21:50: 7 running (6 implementors + shot2), memo filed. Fresh
  lines from diag (bench HELD→RELEASED cleanly, lock free), keys2
  (corpus analyzed, edit-only while sibling held lock — watch
  cleared), shot2 claimed. No deadlock, no LAND/CUT yet, nothing to
  respawn or integrate. No pings sent.
- swarm-modgraph CUT (fast, keys-precedent): module-graph remainder
  ceiling ≈ 11–12 ms at 100% fantasy capture clears neither prong
  (15 ms + ~17.5 ms). Filed
  `docs/perf/waves/wave-2/report-swarm-modgraph.md`. Counts
  (enterprise seed-7, env-gated dump, reverted, 3× identical):
  `format_entry` 45,326 (8 wt, only site above noise, ~7 ms ceiling);
  `lower_when` 79,431 (breakpoint arm ~1.8 ms); `nest` 17,087;
  `recipe_selector` 9,057; `sorted_entries` 35 dirs / 15,158 entries
  (~210 reallocs ≈ 0.05 ms — wave-1 reserve's "cardinality unknowable"
  now quantified negligible; the 8 wt driftsort is determinism, not
  diet); `strip_runtime_ext` 906; `class_name` 0 calls — dead on the
  `!proof` bench path (future emit crews: do not diet `class_name`
  for sync). Worktree verified clean (`?? REPORT.md` only, pin OK,
  diff empty). Bench never held. Process disclosure: untimed count
  run 3 overlapped diag's 21:47 lock via an ungated chain (syncMs
  discarded, counts reproduced exactly) — possible single-sample
  contention on diag's set, absorbed by 8-pair + ex-run-1 rule.
  Lesson for briefs: gate EVERY spawned run on the lock check, even
  untimed ones.
- Reseed observations (modgraph §Collision, not pursued — no pivot):
  `root_targets` parses the same manifest 3× per root resolve
  (redundant-work dedup, not diet); `lower_when` unmemoized over a
  tiny distinct-raw set (memo, not diet); resolve-path `format!`s
  (unit `px`, rhythm `calc`, negated wrap) unmeasured. Future topics.
- Freed slot → swarm-slice1 (Shot 3 slice 1 A1: memo PROCEED first
  slice, ~30–40 est, E0/E1-gated).
- swarm-diag LAND CLAIM (−35.2 ms / −3.00%): partition dead-render
  skip, `atomic/src/diagnostics/channels/mod.rs` +58/−12. Filed
  `docs/perf/waves/wave-2/report-swarm-diag.md` + `diag.patch` (102
  lines). 8-pair A/B, 2 warmups, ex-run-1 stands (−35.78/−3.05%);
  4-scale byte-identical (enterprise hashes match wave-1 canon
  prefixes — same seed-7 outputs); determinism ×2; 35,426 dead
  renders census + flame cross-check; 2 new partition tests, quality
  0 violations (1 pre-existing soft warning). Caveats for
  integrator: `ATM-SITE-54` vitest failure reproduced on base too
  (pre-existing claim to re-verify); pairs 1–2 noisy (modgraph's
  disclosed overlap + sibling builds — median robust). → swarm-intdiag
  dispatched (single-patch integrate + 8-pair confirm).
- swarm-shot2 KILL (heavy track #1 dead): no sound pre-open deadness
  signal exists under cold `sync(cwd)`. Filed
  `docs/perf/waves/wave-2/report-swarm-shot2.md` (341 lines,
  captain-read verified, `?? REPORT.md` only, lock never taken).
  Core proof: seed dead = 12,000 needle-free `src/util/util{i}.ts`
  = streaming candidates, and `streamed` is a CONTENT property
  (needle absence) undecidable pre-open — live/dead share every
  path/stat class; worse, needle-free ≠ dead (C1 keep-alive test
  pins a needle-free parse failure that must keep its warning).
  Nine liveness channels enumerated (parse-error diagnostics alone
  kills every content-blind skip); 17 candidates tried, all KILLed
  (sound-but-prizeless gate mirror 0/12,000; stat gate net-negative;
  basename/ext/dir/seed-shape unsound or OOB; manifest/import-graph
  unsound — scan-based engine has no entry concept, graph edges ARE
  content; cache/incremental OOB; discovery-match falsified by seed
  itself; d.ts/dotfile pinned live). Resurrection criteria R1–R3
  filed (R1: zero-false-dead proof over all 9 channels + measured
  count; standing falsifiers: `export function Broken( {` and the
  69-byte live file). Replacement ms (heavy-track rule): parallel
  file-level 100–140 + diag/proof room 76 = 176–216 ⊇ lost ~190,
  canon/parse/serializer/emission as backstop — room sizes, not
  promised captures. CONSEQUENCE: single-thread diet now carries
  +190 more weight; parallel compile (slice1 in flight) is MANDATORY
  to finish. Freed slot → swarm-manifest.
- swarm-cascade BANK (captain override of crew CUT): cascade sort+keys
  diet, `stylesheet/cascade/mod.rs` +59/−44. Filed
  `docs/perf/waves/wave-2/report-swarm-cascade.md` + `cascade.patch`
  (diet file only, 159 lines; bench-report byproducts excluded).
  Fused `from_atom` 3-pass→1, rank memo 23,505→46 (511×), lazy
  tiebreak 362,743→1,399 `cmp_whens` (259×); 4-scale identical
  (sealed hashes), determinism 16/16, atomic 567+1 green, q 0
  violations. 8-pair median +3.4 / ex-run-1 −0.6 vs ±20 noise —
  effect ~3–5 ms unresolvable alone. OVERRIDE REASON: brief +
  VOYAGE order BANK for sub-bar proven-identical diet, and wave-1
  reserve (noisy +16.5 ±71) banked on mechanism exactly like this;
  "nothing to BANK" contradicts the rule — the sum-confirm +
  per-component bisect exists precisely to resolve it. Joins the
  pending combined set (diag + canon2 if both land). BANK CONDITION
  for integrator: `scan_conditions` carries a NEW cognitive-22
  warning (q green, warning not violation) — confirm q exit +
  assess a cheap split. Future-work note (crew §Verdict): remaining
  sort cost is 362k compares + memcmps with no further redundancy;
  a future LAND here needs a different sort shape (prefix bucketing
  / unstable + tiebreaker), not a bigger memo.
- Infra lesson: lock check-then-act TOCTOU is inherent (cascade's
  test run overlapped a sibling hold) — disclosure suffices, medians
  absorb; builds-during-holds are normal swarm parallelism.
- Freed slot → swarm-lowermemo.
- swarm-manifest CUT (fastest yet — zero builds, zero tests, read-only
  probes while cascade held the lock): `root_targets` 3× manifest
  parse is real in code (`ladder/package.rs:59-64`, 3×
  `serde_json::from_str` per root resolve) but structurally
  unreachable on seed-7: 0 calls, ceiling 0.00 ms. Filed
  `docs/perf/waves/wave-2/report-swarm-manifest.md`. Proof chain:
  sole entry `manifest_hit` requires `package_hit`'s `is_dir`
  gate; staged paths are absolute under `$TMPDIR`; generator writes
  no `node_modules`; live probe of every `ancestors()` level to `/`
  misses — gate fails everywhere for every bare specifier. Flame
  corroboration (no serde parse frames on resolve path). REVIVAL
  CONDITION: bench load gains `node_modules` or cwd-relative staged
  paths — else dead code, not diet, do not re-crew for syncMs.
  Real-repo caveat filed (`ProbeMemo` caches manifest text, never
  parsed `Value`s — robustness win only, scores 0.00 on frozen
  load). Correct CUT, not BANK (no diet exists). Worktree verified
  clean, pin OK. Freed slot → swarm-resolvefmt.
- swarm-lowermemo CUT (counts-only, reused modgraph's 3×-identical
  volume, never re-ran; didn't even run flame `--inspect` to spare
  the sibling's bench CPU): `lower_when` memo fantasy ceiling ≈ 4.3
  ms, realistic ≈ 1.2 ms — clears neither prong, survives 3×
  cost-model error. Filed
  `docs/perf/waves/wave-2/report-swarm-lowermemo.md`. The memo would
  "work" (≤10 distinct raws from frozen generator vocab, ~99.99%
  hit) but both firing arms are already lookup-cheap (borrow-only
  FxHash probe) and every `Known` hit must still construct an owned
  `When` (2–3 allocs, both bench callers take ownership) — alloc
  floor unreachable without an `Atom` ownership redesign (others'
  ground). std-HashMap memo would ADD SipHash per call, likely
  net-negative. Correct CUT, not BANK (1.2 ms unresolvable, nothing
  built). Re-examination bar: shared/interned `When` redesign only,
  with cascade/emit/name collisions to clear. Reseed crumb:
  `BreakpointScale.widths` is a SipHash `IndexMap` — FxHash-ing is
  a ~0.4 ms diet on adjacent ground. Freed slot → swarm-realloc
  (realloc remainder census + diet, memo §5 sizes ~15–25).
- swarm-slice1 INFRA DEATH (no verdict): model-stream idle timeout
  (180s) at ~22:1x, worktree cleaned, nothing to salvage. Last
  progress 22:09 (grounded, implementing edit-only). No deliberation
  per standing rule → respawned same topic as swarm-slice1b, fresh
  tree, same E0/E1/E5-gated brief.
- Tick 22:23: 7 running, lock free. Fresh: parse 8-pair done, verdict
  BANK (+1.6/ex1 +0.2 noise, 4-scale identical, formal result
  pending); keys2 split verdict forming (memo CUT, diet BANK 3.3ms,
  binaries built, scripting A/B); canon2 LAND report filed 22:00,
  formal delivery pending; resolvefmt instrumented (7 files),
  awaiting lock-free build+count; realloc trace built, hunting
  sites. WATCH (no action): intdiag silent ~30 min since claim —
  under the 60-min bar, lock was held by others most of the window;
  slice1b 8 min since claim, normal. No deadlock, no free slots,
  nothing to respawn or integrate yet. No pings sent.
- swarm-parse BANK (correct — ceiling ~21wt doesn't bar, stopwatch
  does): retained-program reuse kills styletrace + identity
  re-parses. 12 files +316/−41 (atomic identity/lib/hosts +
  styletrace analysis/tests). Filed
  `docs/perf/waves/wave-2/report-swarm-parse.md` + `parse.patch`.
  Mechanism counts: −3,585,622 bytes (−45.1%), −3,242
  `Parser::parse` calls, 0 fallbacks on load. 4-scale identical
  (sealed hashes), determinism 39+6 runs, atomic 568 green (new
  fallback-pinning test), styletrace 30 pass / 18 fail with
  byte-identical failure set on pristine HEAD (gitignored fixture
  absence — zero-new-reds claim for integrator to re-verify), q 0
  violations. 8-pair +1.6 / ex1 +0.2 — zero under extreme box noise
  (spread −65..+57, screensharingd 145%, browsers). BANK
  CONDITIONS: (1) combined-set bisect mandatory per-component
  (styletrace-reuse vs identity-reuse) — noisy zero with a 21wt
  ceiling must resolve honestly; (2) re-confirm on a quieter box if
  the sum disappoints; (3) COLLISION FLAG: bank touches
  `run_parse_phase` in lib.rs — slice1b's parallel-region ground.
  Same-function-twice expected; sequence bank-first, slice1 adapts
  (its integrator fits to tip).
- INCIDENT + standing rule: parse crew TERMINATED two foreign `find
  /` PIDs (~68% CPU) mid-session and discarded the contaminated
  session. Killing processes you didn't start is FORBIDDEN — no
  matter the contention. Standing rule from here: disclose box
  contention in PROGRESS lines, discard contaminated sessions,
  never `kill` foreign PIDs. Briefs carry this line.
- Freed slot → swarm-sortshape (cascade sort-shape redesign,
  stacks on cascade bank).
- swarm-canon2 LAND CLAIM (−23.4 ms / −2.04%; ex-run-1 −20.3 /
  −1.77%): no-alloc case-insensitive matching in value classify,
  4 canon files +105/−13 (is_named_color binary_search_by +
  cmp_lower_probe, is_css_keyword eq_ignore_ascii_case,
  function_kind raw-name tables). Filed
  `docs/perf/waves/wave-2/report-swarm-canon2.md` + `canon2.patch`.
  Follow-up on wave-1 islen shape, cited + measured on new base.
  Criterion −52% mixed, 756/756 differential zero-divergence,
  allocs →0; 4-scale identical (sealed hashes); determinism ×2;
  canon 58 + atomic 567+1 green; q green zero violations;
  hand-written files (no regen question); bench byproducts
  restored, tree = 4 files exactly. Caveats for integrator: base
  arm noisier than cand (range 141 vs 22), pair 5 inverts (+18.5),
  pair-1 outlier −140 — verdict stands ex-run-1 on both prongs;
  one smoke run overlapped a sibling hold via ungated chain
  (disclosed, not the verdict session). "Runaway find" delivery
  note: no foreign kills in REPORT (crew disclosed lesser things)
  — own-process cleanup, no incident. → swarm-intcanon2 dispatched
  (single-patch integrate + 8-pair confirm).
- swarm-resolvefmt CUT (counts-only, 15 tags, bit-identical ×3,
  reverted clean, lock never held, one count run self-aborted at a
  freshly-taken gate): resolve-path `format!` ceiling ≈ 2.9 ms
  fantasy / ~0.5–1.0 realistic. Filed
  `docs/perf/waves/wave-2/report-swarm-resolvefmt.md`. Rhythm
  `calc` ×4 + negated calc-wrap ×2 + font/pseudo/bp_media/r_query:
  ALL 0 calls on seed-7. Only live site: `unit_px` 16,276 calls
  over 44 distinct 1–3-char spellings (exact set filed). Correct
  CUT, not BANK (nothing implemented; ceiling bars). FILLER (exact
  code filed, ~0.5–1.0 ms, bank only in a sum): unit.rs:116 →
  with_capacity(len+2) + 2 pushes. Reseed: `resolve_rhythm` scans
  EVERY value containing 'r' ("red", "border"…) through fresh Vec
  + FragmentScan with ZERO rhythm values in load (scan-elision,
  not diet); assembly.rs:252,255 key `format!`s sit in the 296 wt
  bulk (deliberately uncounted, not resolve path). SEED-LOAD
  FACT: bench exercises no rhythm/negated/&-at-rule/font/r-keys
  values — future crews on those paths must re-census (zeros are
  load facts, not code facts). Freed slot → swarm-hashers.
- swarm-keys2 SPLIT (memo CUT, diet BANK): keys memo under
  per-phase bar. Filed `docs/perf/waves/wave-2/report-swarm-keys2.md`
  + `keys2.patch` (diet files only; bench byproducts excluded).
  MEMO (CUT, built + measured, fully reverted without residue):
  unified cross-site KeyMemo (FxHash, bitwise numbers,
  order-independent objects), byte-identical over all 106,278
  tuples — LOSES 5–15 ms on phase (hit 101 ns vs serialize 159
  ns; miss +400 ns; 82% max hits insufficient; even optimistic
  nets +5.1). Per-phase bar defined/defended (≥5 ms + ≥25%,
  method reproduces flame 19 wt within 6%). Keys-memo question
  now CLOSED at both bars (wave-1 whole-sync CUT + wave-2
  per-phase CUT with a losing build). DIET (BANK): scalar borrow
  through serialize + borrowed `when` (`LookupKey<W>` generic),
  −3.3 ms phase (3.29/3.37 two runs), byte-identical 4-scale
  (sealed hashes), determinism 20/20, atomic 567+1 green, q
  green. Whole-sync A/B explicitly NOT claimed (full-median −23.5
  is 7× the mechanism — noise; ex-run-1 −14.65/−1.18% misses both
  prongs; no-regression read only). Overlap: proof/render.rs
  touched-then-reverted; shared `OwnedLookupKey::lookup_key` with
  diag's subsystem (facts.rs 3-line hunk vs diag channels — files
  disjoint, pipeline-adjacent; bisect resolves). Leads filed:
  positional exact→decl reuse (needs producer cooperation, diag
  territory); scalar fast-path JSON writer (~6 ms, needs fuzzing).
  Freed slot → swarm-rhythm.
- swarm-canon2 BANK (captain override of integrator LAND):
  intcanon2's proof is exemplary (patch clean, 4-patch file sets
  mechanically disjoint, order-equivalence re-proven from code, own
  848-input differential 0 divergences incl. non-ASCII adversaries,
  regen n/a confirmed, canon 58 + atomic 567+1 + q green re-run,
  sealed hashes, determinism ×2) — but its independent 8-pair
  confirm measures −15.34/−1.36% full, −12.80/−1.14% ex-run-1:
  full clears only the ms prong, ex-run-1 clears NEITHER, so the
  solo bar (≥15 ms AND ≥1.5%, standing ex-run-1) is missed.
  OVERRIDE REASON: wave-1 islen (−16.0/−1.26%, ms✓/pct✗) banked on
  exactly this shape; 8/8 pairs + mechanism counts + differential
  prove a real ~13–15 ms effect that is proven-identical → BANK
  into the combined set, sum-confirm decides. (Crew's −23.4 was
  inflated by its −140 pair-1 base outlier; integrator's cleaner
  number governs.) Filed
  `docs/perf/waves/wave-2/integrate-canon2.md`. Combined set now:
  canon2 + cascade + parse + keys2 (+ diag if intdiag confirms).
  Freed slot → swarm-asmfmt.
- swarm-sortshape CUT (two independent triggers, one untimed count
  run, no candidate built): sort-shape redesign dead. Filed
  `docs/perf/waves/wave-2/report-swarm-sortshape.md`. Trigger #1:
  100% sort elimination ≈ 14 ms clears neither prong (realistic
  unstable ≈ 3–4 ms, bucketing ≈ 1–2 ms — largest of 84 groups
  holds 4,496/23,505 atoms). Trigger #2: tie census (memo E4
  method, replicates cascade's N/cmp/ties exactly) finds 67/67
  full ties DIVERGE in selector bytes (Token{11,11px} vs
  String(11px) — same css_value_str, different class_name_str),
  so any order-changing sort shifts output unsalvageably. BONUS:
  answers memo E4 for Shot 3 slice 5 (B4 keeps serial stable
  sort, render-parallel only). Sort topic now CLOSED (diet
  banked, redesign killed). Freed slot → swarm-scalarjson
  (scalar fast-path JSON writer, ~6 ms BANK-track).
- swarm-rhythm CUT (counts-only, bit-identical ×3, reverted clean,
  lock held once for untimed count block only): rhythm-scan
  elision fantasy ≈ 3.2 ms / realistic net ≈ 1.4 ms. Filed
  `docs/perf/waves/wave-2/report-swarm-rhythm.md`. 89,944 calls,
  20,736 scanned (23.1%), 18,368 elidable, 0 changed — confirms
  resolvefmt's zero-rhythm-values finding on this base. Gate
  designed + census-validated (proof sketch filed; adversarial
  corpus deferred as verdict-irrelevant). Correct CUT, not BANK
  (nothing implemented; ceiling bars). FILLER (exact predicate
  filed, ~1.4 ms net, bank only in a sum AND only after the
  adversarial differential proves 0 divergences). Collision-clean
  (would have touched only resolve/rhythm/mod.rs). Freed slot →
  panda-scout (HQ-directed research: Panda v2 compile threading;
  swarm-marshal queued for next free slot).
- HQ DIRECTIVE (serial-first): squeeze single-threaded perf dry
  before going heavily parallel. POLICY: parallel implementation
  capped at the one in-flight E0-gated slice1b probe (bounded,
  verdict soon — its evidence stands whatever it returns); no
  further parallel crews (no slice 2+, no parallel heavy tracks)
  until the serial backlog is exhausted. All freed slots go to
  serial topics (marshal next, then serial reseeds). Bank set
  (all serial diet) lands first regardless. NOTE: if "keep
  scanning" meant literal scan-phase work — that phase's ~190 ms
  prize died with Shot 2 (KILL filed); only a cache/manifest
  product decision (R2) reopens it.
- swarm-asmfmt CUT (zero builds, zero spawned runs of any kind,
  lock never held — pure read-only chain proof): all 5
  assembly/plan key-`format!` sites gate-dead on sync, 0.00 ms
  fantasy. Filed `docs/perf/waves/wave-2/report-swarm-asmfmt.md`.
  assembly.rs:252,255 live in proof-gated `build_css_runtime`
  (bench `proof` unconditionally false — no `logs` key, and
  `LogChannel` forbids 'proof' on sync entirely, so unreachable
  on EVERY sync); builder.rs:54,58 skipped on the `!proof` diet
  path; dup_recipe is an aborting error that never fires on a
  completing load. Flame corroboration (key sites absent,
  build_keyed live 83wt). CONFIRMATION: only LIVE key
  construction on `!proof` is keys2's banked diet ground (19 wt)
  — bank value re-verified. SEED-LOAD FACT (extends resolvefmt):
  bench exercises `!proof` exclusively — proof-gated/non-diet
  code never executes; future crews there must re-census.
  Freed slot → swarm-marshal.
- Tick 22:50: 6 running (intdiag HOLDS lock for integrate block:
  builds + ATM + 8-pair confirm — the diag verdict approaches;
  realloc sub-census done; slice1b E0-narrowed, counts gate next;
  hashers static census ~400k ops fantasy 18–20 clears bar → must
  measure, iteration audit next; scalarjson grounding;
  panda-scout in vendor). No deadlock, no pings sent.
- swarm-diag LAND ACCEPTED (−19.9/−1.68%; ex-run-1 −18.3/−1.54%
  clears BOTH prongs, pct margin 0.04pp): intdiag proof
  thorough (patch clean; verbatim extraction + vacuity re-proven
  with file:line traces; regen n/a; atomic green + 10/10
  channels + q 0v/1pre-warn; ATM-SITE-54 re-proven pre-existing
  on BOTH arms — caveat closed; sealed hashes; determinism ×2;
  bisect honestly inconclusive with E≡cand path-equivalence
  noise-floor analysis). Two independent sets both 6/8 same
  direction, both stand ex-run-1; pure dead-work elimination
  (cannot regress). Filed
  `docs/perf/waves/wave-2/integrate-diag.md`. SEQUENCING (not an
  override — wave-1 canon precedent): solo LAND accepted but
  rides the COMBINED set for one landing + one re-profile; the
  thin pct margin wants sum-confirm + bisect measuring diag's
  contribution in situ. → swarm-intbank dispatched (5-patch
  set: diag + canon2 + cascade + parse + keys2).
- HQ DIRECTIVE (ABSOLUTE BAN): multithreading is OFF LIMITS —
  never attempted, on any track. Supersedes the serial-first cap
  and SUSPENDS the VOYAGE consequence clause (parallel MANDATORY
  to finish); the 700 path now rides on serial diet stacking
  toward Panda-level, and Panda's 645 ms serial number proves the
  headroom exists. Shot 3 shelved as an implementation track
  (memo stays filed; E4 tie census + slice1b E0 findings
  absorbed as serial intel). slice1b stood down by genuine
  intervention (interrupt + rebrief): stop implementation, file
  CUT REPORT with E0 evidence, exit — slot respawns serial on
  delivery. No parallel crews will be dispatched under this ban;
  any brief mentioning threads gets refused at dispatch.
- HQ POSTURE (sustained): small incremental serial tweaks for
  now; parallel/cache/incremental re-enter only near Panda v2
  levels of speed. IDENTITY: we are Reference, not Panda v2 —
  our compiler is its own, more substantial thing; Panda is a
  goalpost number, never the architecture. (Panda's 645 stays
  the direction marker under these rules.)
- swarm-slice1b CUT (ban close-out, honest): E0 findings filed as
  evidence (registry-source proof, never measured — zero cargo/
  pnpm/node commands all session, lock never taken). Filed
  `docs/perf/waves/wave-2/report-swarm-slice1b.md`. E0.1:
  `ParserReturn` !Send (arena Vec stores &Bump, Bump !Sync) —
  kills retained-parse-in-workers; E0.2: `Program` !Sync
  (pervasive Cell<NodeId>) — kills program-sharing-to-workers;
  both directions closed, unsafe banned. E0.3/E0.4 PASS (owned
  types Send+Sync, BTree-only iteration, R9 vacuous). E0.5
  surviving scope designed-but-unproven (main-thread retained +
  parallel streamed staging — moot under ban). Track
  implication filed: any slice needing &AST on workers was dead
  under E0.1/E0.2. WIP driver (~260 lines a1.rs + hookups)
  reverted unbuilt; tree verified clean. Ban now total: zero
  parallel crews remain. Freed slot → swarm-harvest (serial).
- swarm-posreuse CUT (zero-diff, zero-build, no lock hold — pure
  analysis): positional exact→decl reuse dead on prize AND
  soundness. Filed
  `docs/perf/waves/wave-2/report-swarm-posreuse.md`. STRUCTURAL
  CORRECTION: 106,278 = 3×35,426 (decl + collect_exact +
  partition→render_expected re-serializing every exact fact) —
  corrects wave-1's "render_expected does not run in bench"
  (lines dropped, work burns). Prize ~4.8 marginal / ~5.9
  standalone — ceiling-barred 2.6–3.1×. Soundness: positional
  lockstep is seed-coincidence, broken by construction (const
  axis pinned by committed tests: 0 exacts vs 2 decls;
  dynamic/mint axis code-level) with VERIFICATION-SILENT failure
  mode (corrupts proof joins/diagnostics while css/data stay
  green — cannot BANK). Specified differential probe filed for
  the record. LEAD #1 (partition dead-render kill) = DIAG'S
  MECHANISM, already won — diag got there first and is in
  integration; no race (posreuse implemented nothing). Cross-
  validation: posreuse independently attributes the partition
  loop ~5.7 ms serialize + locate/format — consistent with
  diag's −19.9 measured with allocator self. Freed slot →
  swarm-extend.
- swarm-scalarjson BANK (second set — intbank's 5-patch set is
  mid-flight without it): scalar fast-path JSON writer,
  serializer.rs +230/−9 + new parity test (128 lines). Filed
  `docs/perf/waves/wave-2/report-swarm-scalarjson.md` +
  `scalarjson.patch` (389 lines, both hunks, `git apply --check`
  clean against base).
  Phase −2.1 vs legacy (25/25 ×2 runs + 6 replications),
  +0.28 marginal vs diet-shape (7/8 runs, 13 SEs); prize smaller
  than the ~6 est (serde already table-driven) with dead-end
  filed (closure-monomorphized frame reverted). Fuzzing bar met:
  106,278 corpus parity 8/8 + 2,048 byte-value + 25 adversarial
  + 35,000 seeded = ~37.1k checks, 0 divergences. Whole-sync
  −14.59/−1.21% (8/8) with explicit no-LAND disclaimer (7×
  mechanism — noise); 4-scale sealed hashes; determinism 20/20;
  atomic 569+1+2 green; q green zero warnings. STACKING (crew-
  disclosed, exemplary): same serializer.rs region as keys2's
  banked diet — merged shape = generic signature + fast frame
  for scalars + keys2's borrowed-when tuple for containers;
  ~1.8 ms double-claimed, stacking marginal +0.28, combined
  expectation ≈1.9 ms NOT the sum — set-2 integrator bisects
  per-component (crew's `diet_like` harness arm makes it
  cheap). Freed slot → swarm-btreeset.
- swarm-btreeset CUT (zero builds, zero spawned runs, lock never
  held — filed profile + code proof): assembly keys collect
  fantasy ~6–9 ms clears neither prong. Filed
  `docs/perf/waves/wave-2/report-swarm-btreeset.md`. Gate check
  PASSED (live on `!proof`, exactly once per sync) but input
  unique by construction (seen_keys gate, 0% dups), zero data
  reallocs (moved strings), consumers membership-only (order
  unobserved; missing_keys test-only). Two independent bounds
  agree (profile-share ~6, op-count ~8.9); realistic 30–60%
  → ~2–5 ms. Even a type-changing HashSet diet nets ~1–3 ms
  with a larger soundness surface. Closes wave-1 reserve's
  one-shot-collect note with counts. Reseed: per-object-value
  `canonical_json_value` BTreeMap rebuilds (thousands of inserts
  across 15,699 objects — serializer ground, different
  mechanism); plan.rs:204 names-set. Standing facts: one native
  compile per sync (once-per-compile collects fire once);
  `emitted` membership-only proof stands. Freed slot →
  swarm-collect.
- Tick 23:20: 7 running (hashers HOLDS lock for compile-check +
  suites + builds; realloc site census done; harvest staged,
  queued behind hashers; marshal/extend grounding; collect just
  launched). WATCH (no action): intbank silent ~30 min since
  dispatch — under the 60-min bar, lock held by others most of
  its window (same shape as intdiag's early silence, which
  resolved). No deadlock, no pings sent.
- swarm-findprop CUT (counted, never built, no timed bench — lock
  held once for count block + criterion): `find_property`
  dispatch fantasy ≈ 13.1 ms total addressable < 15 ms ms-prong
  at 100% elimination. Filed
  `docs/perf/waves/wave-2/report-swarm-findprop.md`. Exact census
  353,517 calls, 100% hits (structural — host gates + valid-props
  load), 9.29 probes/call; criterion ~37 ns/call mixed. Three
  ceiling legs all bar with ~2× margin (micro 13.1, flame
  realistic 11–12, heroic 9.5). Per-call already near-floor
  (first-byte-early-out compares, L2-resident table); hashing
  trades 9 cheap compares for a full scan + verify. Correct CUT,
  not BANK. Reseed: caller fusion (resolve_alias +
  find_property at is_known_style_prop/class_prefix_for_prop) →
  extend's resolve ground or canon2 caller-side-memo future,
  with this census (353,517, all hits) as starting count. Freed
  slot → swarm-nameset.
- swarm-hashers BANK (second set — overlaps parse.patch, so
  sequenced AFTER set 1 lands + rebase): full-stack hasher diet,
  60 files +330/−283 (SipHash→Fx, no memos added, iteration
  audited per site). Filed
  `docs/perf/waves/wave-2/report-swarm-hashers.md` +
  `hashers.patch` (2,428 lines, `git apply --check` clean
  against base). Static census ~400k ops, fantasy ~17.6 clears
  bar (refused fast CUT, built + measured); 8-pair −6.34/−0.54%
  full, −8.57/−0.73% ex-run-1, 6/8 pairs (below static ~12–14
  est — cost model generous, disclosed); 4-scale sealed hashes;
  determinism 20/20; atomic 567+1 + base_system 81 +
  module_graph 16 green; styletrace 30/18 with ±1 scratch
  collision (passes isolated both arms — set-2 integrator
  re-verifies); q 0 violations. `model.exports` deliberately
  excluded (diagnostics-order iteration — follow-ups must NOT
  "complete" without a determinism audit). OVERLAP (crew-
  disclosed + captain-verified): same files as parse.patch
  (identity.rs, hosts/mod.rs, lib.rs, styletrace
  analyzer/parser/surface + tests — crew lists 5, captain
  counts ~8; small type-swap hunks, rebaseable) — set-2
  integrator re-verifies mechanically post-landing and
  re-measures in situ. No overlap with the other four set-1
  patches. Freed slot → swarm-findprop.
- swarm-nameset CUT (zero builds, zero spawned runs, lock never
  held — source census + code proof): names-set build fantasy
  ~0.35 ms misses both prongs ~40–50×. Filed
  `docs/perf/waves/wave-2/report-swarm-nameset.md`. Live on
  `!proof` (3 unconditional call sites) but OnceLock'd to 1
  build per sync; inputs pre-sorted + pre-unique (2 dups by
  construction); wire array pins sorted order. Consumer-side
  adjacent mechanisms also ceiling-barred (clones ~0.1,
  surface rebuild ~0.35, whole-mechanism ~0.9). Correct CUT.
  Standing facts: names output now 1389 (filed 873 stale);
  canon ∩ alias = ∅, dups exactly {r, size}; wire order
  load-bearing, downstream rebuilds membership-only. Freed
  slot → swarm-extract.
- swarm-intbank LAND (whole 5-patch set, captain-read verified
  306 lines): sum −62.64/−5.51%, 8/8 pairs, ex-run-1
  −56.55/−4.99% — beats the 40–60 band. Filed
  `docs/perf/waves/wave-2/integrate-bank.md`. Combination proof:
  5 patches clean (20 files +556/−124), 5-way file disjointness
  mechanical, 6 behavioral pairs independent (diag×keys2
  sub-additivity predicted + confirmed). Parse sub-bisect
  resolves the solo-zero honestly (≈20.3 in situ ≈ ceiling:
  styletrace +11.96 4/4, identity +8.38 3/4); diag marginal
  +13.20 5/6 in situ (sub-additive as predicted — thin solo
  margin superseded). Attribution 53–59 vs 62.6 measured,
  consistent. Suites re-run (atomic 570+1, canon 58, styletrace
  31/18 byte-identical set, new tests explicit); q 0 violations
  both arms (cascade-22 accepted with rationale); ATM-SITE-54
  pre-existing ×3; sealed hashes 4-scale; determinism ×2.
  FLAKE (not held): trace_gate barrel 2/~22 parallel runs —
  coarse-clock scratch collision, environmental, serial green;
  fix (atomic counter in `new_in`) is new work, filed as
  follow-up. → LANDING SEQUENCE STARTED (captain's firsthand
  gates, then commit).
- Post-land spot n=3 (landed `810b8b5b4`, captain's own hold):
  1048.5 / 1079.4 / 1096.8, median ≈ 1079 — confirms intbank's
  1073.4 combined median. Scoreboard ≈1.07 s stands. (Output
  hashes not re-checked in spot; 4-scale identity already proven
  4× on this exact tree, incl. intbank's sealed-hash run.)
- swarm-repro REPROFILE-COMPLETE (captain-read verified 278
  lines): 2 flame captures on landed `810b8b5b4`
  (procedure agentrs-flame/3, locked load, RECONCILED ×2,
  dirty:false — cleaner than flame3). Filed
  `docs/perf/waves/wave-2/report-swarm-repro.md` + bundles
  `docs/evidence/flamegraph/enterprise-repro{1,2}/`. Sync
  −130/−134 vs expected −128.5 (wave-1 + set-1) — reconciles;
  all wins in compile; scan/publish flat. Mechanism-level
  attribution per room (render_fact/render_expected GONE ×2,
  re-parse callers 0, rank frame gone, serialize −3 to the
  unit). Attribution caveat verified via nm
  (merge_constants_ordered inlined into compile — streamed
  residue re-attributed, still performed). Rooms rewritten +
  backlog re-seeded from this burndown (7 topics, dry rooms
  named). Honest arithmetic filed: gap 398 vs ranked diet
  ceilings ~150wt fantasy (≈50–80 realistic); 700-vs-ban
  contradiction flagged for HQ, not solved. Worktree clean,
  pin NEW base ✓. Freed slot → swarm-intset2.
- swarm-extract BANK (third set-2 member): JSX-host merge →
  borrowed union view, 4 files +80/−11. Filed
  `docs/perf/waves/wave-2/report-swarm-extract.md` +
  `extract.patch`. 315,423 dead clones + 3,123 set builds +
  ~19k regrows eliminated, zero added work; 8-pair
  −13.34/−1.12% (ex-run-1 −13.08/−1.10%), 6/8 pairs; 4-scale
  sealed hashes; 19/19 determinism; atomic 568 green; q 0
  violations. Measured on OLD base — set-2 sum re-measures on
  new. Census YIELDs respected (wants→realloc, hashers,
  fences). Freed slot → swarm-proof.
- Tick 00:20: 7 running (5 old-base: realloc/marshal/extend/
  collect/callermemo; 2 new-base: intset2/proof). Collect BANK
  posted (−14.5/−1.22%, ex1 −17.0/−1.44%, 6/8, identity 4/4 —
  formal delivery pending, handle on arrival; joins SET 3,
  intset2 already mid-flight without it). Callermemo HOLDS lock
  for count block; marshal Diet1 implemented, awaiting Hold 2;
  extend census collected; realloc queued; proof/intset2 fresh
  claims. No deadlock, no pings sent. Standing note: old-base
  crews' patches get rebase assessment at integration time
  (integrators fit to tip).
- swarm-collect BANK (first set-3 member): collect-path serial
  diet D1+D2+D4, 3 files +180/−112 (sources.rs +
  includes/{mod,glob}.rs). Filed
  `docs/perf/waves/wave-2/report-swarm-collect.md` +
  `collect.patch` (498 lines, applies to old base; set-1
  untouched scan → clean rebase expected). D1 file_name
  dir-sort + unstable (proven same-sequence: shared parent,
  unique names — "unstable" flag retired with proof); D2
  zero-alloc scope matching (root-bound FileMatcher, char-exact
  glob + unicode pins); D4 fused union walk (no open skipped/
  added/reordered — explicitly NOT Shot 2 territory). 8-pair
  −14.45/−1.22% (ex-run-1 −17.02/−1.44%: ms✓/pct✗ — islen
  shape, correct BANK), 6/8 pairs; 4-scale sealed hashes; 20/20
  determinism; atomic 569+1 green; q 0 violations (file net
  −5 lines). Census YIELDs respected (known→hashers,
  content-clones→marshal lead filed). RACE with realloc on
  glob/normalize allocs (D2 subsumes exact-capacity — first
  LAND wins; realloc still running). No sub-bisect ran
  (queued) — set-3 integrator may bisect D1/D2/D4. Measured
  on OLD base — set-3 sum re-measures on new. Freed slot →
  swarm-selpush (re-seed #2, NEW base).
- swarm-callermemo CUT (exact census, counted never built, no
  timed bench): caller-side canon memo fantasy 8.0 ms combined
  vs ≈17.4 effective bar. Filed
  `docs/perf/waves/wave-2/report-swarm-callermemo.md`. Census:
  K 185,700 (163,070 find-leg + 22,630 alias, 0 custom/ref) /
  C 589,514 (79,258 alias + 510,256 non-alias) over 12 live
  sites (17 dead on this load); repeats 99.9% (~46 names/site)
  — hit rate is NOT the constraint. K fantasy 6.83/0.59% (2×
  margin); C memo NET-NEGATIVE by construction (−3.2 fantasy,
  −6.2 realistic: 10 ns probe on a 1.4 ns path — the
  reverse-keys2 asymmetry); prefilter-gating caps C at 1.19.
  No memo shape survives (Fx/no-hash/small-vec/last-N all
  dominated by the fantasy bound). Canon remainder now:
  caller-fusion count filed for extend (449,520 calls ≈ 2.0
  ms — sub-bar alone). Correct CUT. Freed slot →
  swarm-analysis (re-seed #6, NEW base).
- swarm-proof BANK (set 3, NEW base): live proof-render diet —
  conditional exact_set + distinct-key serialization memo (new
  memo.rs) + per-prop dict memo (35,426→46) + borrowed hash
  view. 2 tracked + 1 new file. Filed
  `docs/perf/waves/wave-2/report-swarm-proof.md` +
  `proof.patch` (563 lines, 3 hunks, applies to landed base).
  Memo scrutiny PASSED: memo_eq ⟺ byte-equal pinned by 8
  adversarial tests (+1 vs 1.0 over-equality caught in dev);
  full-corpus arm-swapped differential 300/301 both arms (same
  ATM-SITE-54 pre-existing, byte-identical assertion); single
  code path; 4-scale sealed hashes; determinism ×2; atomic
  580+1 green; q 0 violations. 8-pair −1.84/−0.16% (ex-run-1
  +0.05 — no signal either way, below noise floor); provably
  removed work (16,239 serializations, 35,426 inserts+clones,
  35,380 lookups) → correct BANK. Hashers-composition
  deliberate (off-import-block paths, HashSet kept). Collision:
  SAME FILE as hashers' set-2 hunk (render.rs) — different
  mechanisms, crew-specified composition (fewer ops × faster
  ops); set-3 integrator sequences after set-2 lands. Freed
  slot → swarm-canonjson.
- swarm-canonjson CUT (zero builds, zero spawned runs, no lock —
  dump census + filed profile + code proof): per-object BTreeMap
  diet fantasy ≈ 6 ms whole-function / ~9.4 absurd-generous
  op-count, realistic ~1–2. Filed
  `docs/perf/waves/wave-2/report-swarm-canonjson.md`. Census:
  10,466 flat 2/4-key objects, 31,332 inserts (2–4 B keys, zero
  nesting/numbers); whole `canonical_json_value` 6wt incl.
  Presized-maps third VOID by API (`BTreeMap` has no capacity);
  only shape is sortedness pre-check with ~1–2 ms realistic net.
  Fails whole-sync bar AND per-phase floor (5 ms). FILLER with
  exact code + full bank conditions filed (~1–2 ms, never solo).
  Doctrine hygiene: BANK rule mints banks from implemented diets,
  not sub-ceiling triage. Closes btreeset's reseed loop. Freed
  slot → swarm-sysprefix (D2 lead, micro-BANK-track).
- swarm-analysis INFRA DEATH (no verdict): native child run
  failed ~11 min after claim (00:26), no progress lines,
  worktree cleaned, nothing to salvage. No deliberation per
  standing rule → respawned same topic as swarm-analysisb,
  fresh tree, same brief.
- swarm-selpush BANK (set 3, NEW base): selector-push string
  diet — EscapeCursor run scans + nest() comma-free fast path
  + push-direct members + `::` reorder gate + nested pre-size.
  3 files +202/−32. Filed
  `docs/perf/waves/wave-2/report-swarm-selpush.md` +
  `selpush.patch` (applies to landed base). Census exact
  (23,505 atoms, all-1×1 nests, 1.21M chars); 12wt ceiling
  bars LAND by construction; 8-pair −1.76/−0.16% (ex-run-1
  −4.13/−0.39%, 3/8 — below noise, estimators disagree);
  4-scale sealed hashes; 20/20 determinism; atomic 572+1
  green (2 new pins); q 0 violations (1 file-length warning,
  accepted rationale). Zero order changes (sortshape bar
  honored); race respected (class_prefix untouched —
  callermemo's ground); D2 lead filed (~0.7 ms system-prefix
  format-once, needs SelectorPrefix threading). No file
  overlap with set-1/set-2 patches (mechanical grep).
  Correct BANK. Freed slot → swarm-shorthand.
- Tick 00:50: 7 running (3 old-base: realloc/marshal/extend;
  4 new-base: intset2/proof/selpush/analysisb). Proof HOLDS
  lock for pairs phase (diet built+green, binaries asided).
  Selpush census complete (12wt ceiling → BANK track,
  implementing). Analysisb grounded (D1 content gates + D2 Cow
  keys, prepping census). Extend diet written, awaiting lock.
  Marshal queued Hold 2. intset2: merges done (extract
  bit-exact, hashers 50 bulk + 10 hand + 1 fallout = 61
  files); scalarjson HELD on generic-W blocker — merge
  judgment in progress, formal verdict will tell
  (LAND-SUBSET vs HOLD). WATCH (no action): realloc ~47 min
  since last line (queued count4, documented wait — not
  self-stuck). No deadlock, no pings sent.
- swarm-harvest CUT (counts-only, ×3 identical, reverted clean,
  lock held once for untimed count block): harvest-chain diet
  fantasy ~12.5/1.08% bars both prongs. Filed
  `docs/perf/waves/wave-2/report-swarm-harvest.md`. Census:
  95,894 literals visited, 17,693 per-file values → 657 pool,
  sinks 0/0 (static load — seeder emits static literals only,
  proven), 48,566 seed wants built+ dropped unused, mint loop
  vacuous. D1 (skip seed when sinks empty) 11.5 ms is the bulk;
  D4 ~1.0; D2 0.00; mask-scan measured 0.07 (floor — removal
  would REGRESS string-free inputs). Doctrine section files
  D1/D2/D4 identity arguments for per-phase revival (D1 dies on
  dynamic-heavy inputs). Correct CUT, not BANK (nothing built).
  Leads: t_visit 23.3 split for parse/canon2 follow-ups;
  is_css_keyword alloc "still live in base" = canon2's banked
  (unlanded) ground, no action. Freed slot → swarm-callermemo.
- Tick 23:50: 7 running, intbank HOLDS lock mid-block. HEADLINE:
  intbank 8-pair SUM done — 8/8 favor, med −62.6/−5.5% (ex1
  −56.6/−5.0%), band beaten; identity + sub-bisect next, formal
  INTEGRATE pending (landing trigger armed, nothing to land
  yet). Harvest CUT posted (fantasy ~12.5/1.08% bars both;
  sinks=0; counts ×3 identical) — formal delivery pending,
  handle on arrival. Collect implemented edit-only (D1+D2+D4:
  file_name sort+unstable, zero-alloc matcher, fused union walk
  — "unstable" flagged for byte-proof review at delivery);
  extend grounded (42wt = 38 resolve_binding + 4 value_of),
  census wired; realloc queued count4; marshal queued with
  Hold-1 plan; extract grounding. Intbank early-silence watch
  CLEARED (broke silence with substance). Possible findprop/
  intbank lock overlap 23:38–23:45 by skewed stamps —
  unresolvable from claims; sum margin robust regardless, judge
  pair table at formal delivery. No deadlock, no pings sent.
- panda-scout DONE (HQ-directed, read-only): verdict NO — Panda v2
  does not multithread compile. Filed
  `docs/perf/waves/wave-2/panda-v2-threading.md` (captain-read
  verified). Load-bearing: both batch-ingest entries are serial
  `for` loops (files.rs:258-275, compile.rs:163-165, ordered
  sessions); all NAPI sync (zero AsyncTask/spawn); no
  rayon/tokio/threadpool/crossbeam in any Cargo.toml (rayon only
  transitive via oxc_index, zero par_iter/spawn call sites); no
  JS-side workers; Mutexes are same-thread interior mutability.
  Panda's own docs: "Single-threaded for now", "Per-file
  parallelism: Not yet done... via rayon", "not built; tied to a
  deferred bulk-file API". Serial-bulk analog of AssembleCtx:
  `stylesheet_snapshots_inner` + project-wide atom sort + global
  atoms_cache registry. IMPLICATION: Panda's 645 ms is a SERIAL
  number — the race is serial efficiency, which validates the HQ
  serial-first directive. Freed slot → swarm-posreuse.
- Tick 01:20: 7 running (3 old-base: realloc/marshal/extend;
  4 new-base: intset2/analysisb/shorthand/sysprefix). intset2
  HOLDS lock since 01:05 for build+suites+quality block (~15
  min — normal for that block, intbank's took ~20+). All other
  crews fresh (latest lines 01:05–01:15): realloc diet written,
  queued cand-count; marshal queued Hold 2; extend diet written,
  queued suites; analysisb census staged, queued; shorthand
  staging census edit-only; sysprefix diet written, queued. All
  3 finished verdicts since 00:50 already curated (proof BANK,
  selpush BANK, canonjson CUT) with patches filed
  (proof/selpush/scalarjson/collect/extract/hashers all present);
  all freed slots already respawned — board full, nothing to
  dispatch. No LAND claims pending (intset2 verdict awaited:
  LAND-SUBSET vs HOLD on scalarjson generic-W). No deadlock
  (no crew silent 60+ min, no self-waits), no pings sent.
- swarm-intset2 DONE → LAND-SUBSET (hashers + extract) / HOLD
  (scalarjson). Filed `docs/perf/waves/wave-2/integrate-set2.md`
  (282 lines). Extract bit-exact via git apply (zero set-1
  collisions); hashers 50 bulk byte-identical + 8 hand-rebased
  vs LANDED parse (same 1–3-line swaps, shifted context; parse's
  new `programs` maps deliberately left HashMap — new work,
  future wave) + 2 within-set hand merges with extract
  (forced Fx-typing of borrowed refs). Captain's catch
  (hashers×keys2 facts.rs) discharged as false alarm three
  ways. Scalarjson HELD: landed keys2 generalized
  `LookupKey<'a, W: ?Sized>` with THREE live instantiations
  (`Vec<String>` hot path — silently re-instantiated by deref
  coercion — plus `[Box<str>]` in facts.rs, plus `[String]`
  tests); banked writer is concrete over `[String]` and the
  merge needs a newly designed step-iteration abstraction =
  rewriting the change. serializer.rs zero diff verified.
  Sum: FULL −27.41/−2.42% med (8/8, ex1 −29.16, paired-med
  −30.16 — all three estimators agree); LOO bisect additive
  (−14.53 extract-only 6/8 + −14.49 hashers-only 7/8 = −29.02
  vs FULL −27.41, ~1.6 noise). Hashers re-measures stronger
  than banked −6.3 (quieter box + new-base composition
  candidates, cause unproven, sign solid). 2 sets discarded
  pre-verdict (screensharingd 358% foreign spikes — observed,
  never touched; box idled, probe clean). 4-scale byte-identity
  vs sealed pins; determinism 60/60; atomic 571+1 (delta =
  union test); styletrace failure sets byte-identical both
  arms (18 pre-existing env); q 0v/63w (60+3 banked, zero new).
  Captain firsthand: atomic 571+1 green in parent, q 0v/63w on
  58 files, 61 files byte-identical to worktree. LANDED
  `0a5731681` perf(rs): wave-2 set-2 diet (hashers+extract),
  61 files +397/−283, named files only. Enterprise sync now
  ≈1107 med (was 1135 pre-set-2, 1198 pre-set-1). Scalarjson
  re-proof spec filed (native fast frame over all live W +
  per-instantiation differential fuzz + phase-bench marginal;
  expectation ≈ +0.3ms, unresolvable whole-sync). Freed slot →
  swarm-cloneplasma.
- swarm-marshal BANK (old base, joins set-3/4 queue): slim-wire
  sheet-suffix codec — portable sheet refolded as 1,162 B head
  + shared-tail UTF-16 length (99.96% of 2.87 MB was a
  byte-identical suffix of the primary). 3 files + new wire.rs
  (113 lines, 6 tests). Filed
  `docs/perf/waves/wave-2/report-swarm-marshal.md` +
  `marshal.patch` (captain-verified: applies CLEAN to tip
  0a57316, zero rebase needed — lib.rs 1-line `mod wire;`
  additive in untouched region). Census exact (6.15 MB req =
  load, spec 19 KB dropped at ~0.1ms ceiling, diet −2.93 MB /
  −48.2% wire, parse −2.95ms measured); 8-pair −1.21/−0.10%
  (ex1 +1.07, 4/8 — noise, V8-rope flattening mutes downstream
  per filed mechanism note); 4-scale identity == wave-1 bytes;
  determinism 22/22; cargo 573+1 (delta = 6 wire tests);
  vitest 300/301 both arms same ATM-SITE-54 red; q 0v (2
  pre-existing lib.rs warnings, untouched code). Correct BANK
  (wave-1 reserve precedent: real positive mechanism, sum
  resolves). Request-leg statically rejected (240ms disk cost
  vs 28.5ms delta). Freed slot → swarm-authcss.
- swarm-shorthand BANK (pre-set-2 base, joins set-3): single-
  resolve hoist + trio-owner pre-filter inside `shorthands/*`
  (6 files +175/−19, 3 permanent contract tests). Every one
  of 89,904 calls/sync (100% miss) paid 5×resolve_alias +
  1×find_property; diet kills 359,616 redundant resolves +
  ~82k probes (91.4% static pre-filter rejection). Filed
  `docs/perf/waves/wave-2/report-swarm-shorthand.md` +
  `shorthand.patch` (captain-verified: applies CLEAN to tip
  0a57316). 155,650-call differential 0 div (transcription
  checked pre-diet, proof post); alloc-neutral 19,372=19,372;
  8-pair −6.0/−0.57% (ex1 −6.5, 7/8, magnitude matches 7–10wt
  cluster); identity 4/4; determinism 2/2; atomic 573 green;
  q 0v/0w (interim cognitive-21 fixed by split). Timestamp
  skew admitted (hand-estimated 02:05, real ~01:45 — timed
  runs machine-stamped, unaffected). RACE respected (stayed
  expansion-side of extend; re-resolve redundant-but-harmless
  if extend threads canon down — follow-up lead). Freed slot
  → swarm-intset3 (set-3 bank integration).
- Tick 01:50: 7 running (2 old-base: realloc/extend; 5 new:
  analysisb/sysprefix/cloneplasma/authcss/intset3). Sysprefix
  HOLDS lock since 01:49 (hold 1: builds+q+timing-probe).
  Realloc cand-count done (−170k/−31.0% span; s:glob 0,
  s:normpath 0 — clean kills) with honest reversal: D-rbox
  wall-negative (+0.8ms, into 23.5ns beats Box::from 38ns) →
  REVERTED; D6 no-op → revert; final diet D1+D2+D7 (~113k),
  queued final-count. Intset3 grounded (pin OK, reading
  protocol + 5 reports edit-only). Cloneplasma census staged,
  diet drafted (7 hypotheses, fenced ground avoided); authcss
  count build green, awaiting window; extend queued suites
  (diet complete). WATCH (no action): analysisb ~24 min since
  last line (01:26, queued with census staged + diet
  designed) — under the 60-min bar, lock has rotated twice
  since; recheck next tick. No deadlock, no pings sent. Board
  full, nothing to dispatch.
- swarm-sysprefix BANK (micro-bank, pre-set-2 base, joins
  set-4): system-prefix format-once — `{system}__` escaped
  once per write_utilities via SelectorPrefix, replayed per
  atom (push_str + cursor.advance). 3 files +129/−16, 2 pin
  tests. Filed `docs/perf/waves/wave-2/report-swarm-sysprefix.md`
  + `sysprefix.patch` (captain-verified: applies CLEAN to tip
  0a57316). 423,090 char-escapes/sync eliminated, 1.04ms
  release-probe-measured @2.46ns/char; 8-pair −0.31/−0.03%
  (ex1 −2.03, 3/8, estimators disagree — honestly below
  noise, more pairs rejected per cascade precedent); identity
  4/4 == wave-1 bytes; 20/20 determinism; 572+1 green; q 0v
  (1 pre-existing cascade warning, untouched code). Zero
  order changes. OVERLAP with banked selpush (same 2 files,
  certain textual conflict, mechanical fixes specified +
  composition soundness verified from their patch) — flagged
  for integration order; sysprefix sequences AFTER selpush
  lands (set-4, not intset3's flight). Recipe whole-string
  path lead filed (~4.4k selectors, stacks, no double-count).
  Freed slot → swarm-scalarreproof.
- Tick 02:20: 7 running (2 old-base: realloc/extend; 5 new:
  analysisb/cloneplasma/authcss/intset3/scalarreproof).
  HEADLINE: intset3 mega-block done, lock RELEASED — FULL
  −41.75/−4.01% 8/8 (ex1 −48.45, pairmed −43.33, all
  estimators agree), identity 4/4 == wave-1 pins,
  determinism 122/122, 0 discards, suites 594+1, q 0v.
  LOO: collect −8.69 / proof −13.85 / selpush +1.78 /
  shorthand −8.48 / marshal −6.71. FLAG for formal verdict:
  selpush bisects +1.78 (contra-member — LAND-SUBSET vs
  full-LAND judgment awaited in INTEGRATE.md, no DONE yet,
  nothing to land). Merge was clean (17 files + memo.rs +
  wire.rs; collect+proof hand-rebased on Fx, rest bit-exact;
  zero HOLD triggers static). Realloc HOLDS lock since 02:19
  (final-count D1+D2+D7). Extend queued suites; analysisb
  D1 soundness proven, queued; scalarreproof diet staged
  edit-only (WhenSteps trait + ~235k per-W fuzz matrix, q
  0v/0w), queued; cloneplasma diet drafted to /tmp, queued.
  WATCH (no action): authcss ~30 min since last line
  (count build green, awaiting window — intset3's mega-block
  + realloc hold explain the silence; under 60-min bar).
  No deadlock, no pings sent. Board full, nothing to dispatch.
- swarm-intset3 DONE → LAND whole set (collect + proof +
  selpush + shorthand + marshal). Filed
  `docs/perf/waves/wave-2/integrate-set3.md` (313 lines).
  selpush/shorthand/marshal bit-exact; collect + proof
  hand-rebased mechanically onto LANDED set-2 Fx (same
  change + retained Fx types; proof's briefed SAME-FILE
  render.rs collision composed diet-onto-Fx exactly as the
  crew specified). Sum: FULL −41.75/−4.01% (8/8, ex1
  −48.45, pairmed −43.33, all estimators agree, no
  outliers); LOO collect −8.69 (6/8) / proof −13.85 (7/8,
  far above banked −1.8 — predicted fewer-ops × faster-ops
  composition) / selpush +1.78 (3/8) / shorthand −8.48
  (7/8) / marshal −6.71 (8/8, above banked); additivity
  super-additive by ~5.8 (no interaction penalty). Selpush
  judgment: two independent 8-pair sets straddle zero at
  ±2ms vs ±8 spread (p≈0.36, not a regression signal);
  wave-1 reserve precedent VERIFIED by captain
  (reserve soloed +16.5, landed in wave-1 set) — sum clears
  with headroom, member provably removes work, merge
  bit-exact → LANDS with the set; dropping it would void
  the measured sum. 0 discards; identity 4/4; 128/128
  determinism; atomic 594+1 (delta exactly 23 new tests);
  q 0v/7w (6 banked-shape + 1 tip-pre-existing, zero new);
  styletrace 31/18 byte-identical both arms. Captain
  firsthand: 594+1 green, q 0v/7w on 18 files, 19 files
  byte-identical to worktree. LANDED `3dd32a6` perf(rs):
  wave-2 set-3 diet, 19 files +1179/−184 (incl. new memo.rs
  + wire.rs), named files only. Enterprise sync now ≈1000
  med (was 1042 pre-set-3, 1135 pre-set-2, 1198 pre-set-1;
  −198 total, 1.55× Panda). Freed slot → swarm-recipepath.
- swarm-authcss BANK (pre-set-3 base, joins set-4): resolve
  happy-path alloc diet — lazy refusal key (89,904 speculative
  keys built, ZERO consumed → build at 2 emit sites) + collapse
  gate (100% of 89,904 collapses no-op → needs_collapse byte
  gate reuses authored box) + resolvefmt D-px filler. 3 files
  +130/−16, no public signature changes, 1 contract test.
  Filed `docs/perf/waves/wave-2/report-swarm-authcss.md` +
  `authcss.patch` (captain-verified: applies CLEAN to tip
  3dd32a6). Census ×2 byte-identical (429k lines); 8-pair
  −11.60/−1.12% (ex1 −12.26, 8/8 unanimous — sub-bar both
  prongs → correct BANK, biggest bank since collect);
  identity 4/4; determinism 2/2; 572+1 green; q 0v/0w.
  ~270k allocs/sync removed from cloneplasma's pool
  (compose-don't-double-count flagged). Extend adjacency
  noted (key_for_want/lower_conditions — mechanical
  integrate order filed). Ceiling credit to resolvefmt for
  D-px (~0.5–1ms). Freed slot → swarm-programsfx.
- swarm-extend BANK (old base, joins set-4): ladder-alloc
  diet — ModuleKey::new fast path + zero-alloc ancestor
  cursor (exact old sequence incl. root quirk + 32-cap,
  table-tested) + ladder scratch buffers (roots/pkg-dir/
  @types/tsconfig regrow). 2 files +232/−38, 4 new key
  tests. Filed `docs/perf/waves/wave-2/report-swarm-extend.md`
  + `extend.patch` (captain-verified: applies CLEAN to tip
  3dd32a6 — hashers never touched key.rs/ladder/mod.rs).
  ~290k alloc-ops + 67k path walks removed per sync (exact
  census, 3,562 bare × 9 levels all-miss); 8-pair +8.63/
  +0.73% crew-sign (ex1 +6.46, 6/8 — sub-bar → correct
  BANK, robust to pair-8 cut); identity 4/4; 28/28
  determinism; module_graph 16/16 + atomic 567 green;
  q/clippy/fmt clean. 5 non-builds killed by exact counts
  (incl. both CUT grounds reproduced). Memo/traversal/
  refusal semantics untouched, differential corpus green.
  (Captain's path typo created then deleted an empty
  extend.patch — final patch verified 356 lines, check-clean.)
  Freed slot → swarm-repro2 (post-set-3 re-profile).
- Tick 02:50: 7 running (1 old-base: realloc; 6 new:
  analysisb/cloneplasma/scalarreproof/recipepath/
  programsfx/repro2). Cloneplasma HOLDS lock since 02:44
  (verify+A/B block, diet implemented lock-free: 5 files
  R1/R2/R3/U1/B1/E1). Recipepath census complete ×2
  (recipe selectors 4,394, closes 27,899, outputs sealed;
  diet implemented lock-free, queued verify). Programsfx
  conversion implemented + staged (q 0v, atomic 594+1 =
  tip count, styletrace failset identical, queued
  census+verify). Repro2 static mapping done (residuals +
  set-4 fences absorbed, baseline tables in /tmp, queued
  captures). Realloc queued (suites+q green). Analysisb
  queued 3h total, vocal, ready on grab — longest waiter
  but lock-dependent, not stuck. WATCH (no action):
  scalarreproof ~25-30 min since last line (staged diet +
  harness, queued through 3 rotations) — under 60-min bar.
  No deadlock, no pings sent. Board full, nothing to dispatch.
- swarm-cloneplasma LAND CLAIM (pre-set-3 base, pending
  integrator): 6-site combined clone diet (R1 lazy key + R2
  move-first + R3 unit_px + U1 collapse-Cow + B1
  probe-then-decide + E1 move-last). 5 files +121/−32, 1
  differential test. Filed
  `docs/perf/waves/wave-2/report-swarm-cloneplasma.md` +
  `cloneplasma.patch` (captain-verified: applies CLEAN to
  tip 3dd32a6; set-3 disjoint confirmed). Census ×3
  byte-identical (356k lines); 8-pair −23.07/−2.09% (6/8,
  ex1 −24.85, pairmed −24.92 — clears BOTH prongs, all
  estimators agree); Euclid proof predicts 20–30ms band,
  measures inside it; identity 4/4; 29/29 determinism;
  572+1 green; q 0v/1 pre-existing warning. Stream
  subtlety disclosed (census on --seed-7 custom stream,
  timing/identity on pin stream; counts transfer proven by
  4-crew cross-validation). RACE FLAG: authcss's 3 banked
  files are a STRICT SUBSET of these 5 (verified from
  patch headers); cloneplasma asserts subsumption (same
  R1/R3/U1 + adds R2/B1/E1, −23.07 vs −11.60) and claims
  first-sound-LAND-wins. Authcss does NOT drop on assertion
  — intclone adjudicates hunk-by-hunk (subsumed → authcss
  YIELDS; distinct residuum → authcss rebases onto landed
  cloneplasma or joins set-4). Follow-up filed: WantContext
  borrow diet (~3–5ms, needs pub-API lifetime). Freed slot
  → swarm-intclone (LAND-claim integrator).
- swarm-recipepath BANK (near-bar, on tip, joins set-4):
  recipe class-name escape-once — `.{class_name}` escaped
  once per rule (fresh cursor), cloned per atom through the
  untouched nest loop, base reused for sort buckets. 2 files
  +60/−5, 2 pin tests. Filed
  `docs/perf/waves/wave-2/report-swarm-recipepath.md` +
  `recipepath.patch` (base == tip, check-clean). 9,057
  redundant escapes + 10,484 String allocs/sync eliminated
  (census ×2 identical, closes 27,899 with sysprefix's
  count); 8-pair −13.05/−1.30% (7/8, ex1 −13.38, pairmed
  −11.39 — misses both prongs → correct BANK); identity
  4/4; 20/20 determinism; 596+1 green (delta = 2 pins);
  q 0v/0w. Effect exceeds scan-cost guess (allocator
  second-order, honestly unproven split). Zero order
  changes; disjoint from sysprefix pending (stacks) and
  resolve grounds. LEAD filed: extract_at_rules per-atom
  Vecs (9,057×/sync, needs borrowed-key grouping,
  IndexMap order preserved). Freed slot → swarm-wantctx.
- swarm-realloc BANK (LAST old-base crew — old base empty):
  reserve-once diet D1+D2+D7 (glob char-vec + normpath parts
  + entry-path join). 3 files +25/−6. Filed
  `docs/perf/waves/wave-2/report-swarm-realloc.md` +
  `realloc.patch` (captain-verified: FAILS vs tip on
  glob.rs + sources.rs — set-3 collect landed there;
  identity.rs hunk clean. Set-4 integrator rebases; D1/D7
  re-apply onto collect's landed matcher/walk as same-change
  per wave-1 reserve method). −113,402 reallocs/−20.7%
  (deterministic 4-round census, span Δ ≤14; D1 60.5k + D2
  37.7k zeroed outright); wall −8.0/−0.70% over 16 pairs
  (TWO full sets tabled — both drew proven Firefox/video
  machine spikes on base arm, no selection, honestly
  sub-noise); per-slice probes all win (no poison); identity
  4/4; determinism ×16; 567+1 green; q 0v/2 pre-existing
  warns. D-rbox + D6 killed by own probes (wall-negative /
  no-op) before shipping. 5 CPU edge-overlaps disclosed
  (9–30s hold-head races, none mid-set). YIELD map + 2
  CPU-lane leads filed (line_col O(offset) index,
  f64-Display dtoa). Freed slot → swarm-atrules.
- swarm-repro2 DONE (REPROFILE-COMPLETE, no code): 2
  reconciled flames on tip 3dd32a6 (1030.9/1031.1 sync,
  579/576 compile; warm unscored 997.4/999.7 = ≈1000 tip
  confirmed; sync delta −68.8/−65.0 vs −69.2 expected
  reconciles). Filed `docs/perf/waves/wave-2/report-swarm-repro2.md`
  (493 lines) + `docs/evidence/flamegraph/enterprise-repro3{a,b}/`.
  Mechanism verdicts: selpush VINDICATED at flame grain
  (−5..−7 real, stopwatches were sub-noise); SipHash EXTINCT
  (zero samples ×2); proof tradeoff visible (serialize saved
  vs memo-probe cost); marshal publish growth = disclosed
  rope cost (+4 SlowFlatten new); collect/scan/shorthand/
  extract all mechanism-verified. 8-topic re-seed T1–T8
  filed with ceilings/fences/bars (backlog section above);
  13 CUTs + dry rooms reaffirmed; count correction (12 not
  13 landed) accepted. Honest arithmetic: ≈910 ceiling
  stacking everything; 700 unreachable single-threaded by
  ≈200+; contradiction flagged for HQ. Freed slot →
  swarm-lineindex (T1).
- Tick 03:20: 7 running (analysisb/scalarreproof/
  programsfx/intclone/wantctx/atrules/lineindex — all
  new-base). HEADLINE: intclone confirm block COMPLETE,
  lock RELEASED (free at tick) — tip confirmation −26.65/
  −2.50% (7/8, ex1 −26.42, pairmed −19.12, clears both
  prongs, stronger than the crew's −23.07); identity 4/4
  sealed; determinism 29/29; collapse count probe done
  (502k vals, all-Cow, gateonly=0 all scales); static
  gates green (q 0v, 595+1 vs 594+1 delta=Cow test,
  styletrace 31/18 identical). Formal INTEGRATE verdict
  (LAND + authcss race adjudication) pending — no DONE
  yet, nothing to land. Scalarreproof WATCH CLEARED
  (fresh line, polling tight). Analysisb still queued,
  vocal; wantctx census staged, verdict-gated; atrules +
  lineindex grounding. Housekeeping: restored LOG order
  (02:50 tick had stranded after 4 later entries via
  captain's anchor edits — moved to chronological slot).
  No deadlock, no pings sent. Board full, nothing to dispatch.
- swarm-intclone DONE → LAND (cloneplasma 6-site diet) /
  authcss YIELDS. Filed
  `docs/perf/waves/wave-2/integrate-cloneplasma.md` (252 lines).
  Rebase bit-exact (landed diff EMPTY on all 5 files — set-3
  disjoint proven). Tip confirmation: −26.65/−2.50% (7/8,
  ex1 −26.42, pairmed −19.12, all estimators agree, clears
  both prongs with headroom — stronger than the crew's
  −23.07); 0 discards (P6c slow-cand outlier disclosed,
  conservative direction); Euclid band holds; identity 4/4;
  29/29 determinism; atomic 595+1 (delta exactly Cow test);
  q 0v/1 pre-existing; styletrace 31/18 identical; release
  warnings 22==22 byte-identical. RACE ADJUDICATION (the
  model case): all 6 authcss hunks ruled hunk-by-hunk with
  a dedicated 502,127-value count probe (gateonly=0 on ALL
  4 scales, positive control proves the probe can see the
  class) + static subset proof (cow-plain ⟹ gate-clears) —
  all SUBSUMED-or-superseded on measured evidence. Off-load
  distinction disclosed (gate strictly more general: lone
  spaces + non-NEL/NBSP multibyte clear gate, slow-path Cow
  — zero counts, unmeasured follow-up, not residuum).
  Authcss YIELDS with full hunk map filed — nothing dropped
  on assertion. Captain firsthand: 595+1 green, q 0v/1w,
  5 files byte-identical. LANDED `ddce131e7` perf(rs):
  wave-2 cloneplasma diet, 5 files +121/−32. Enterprise
  sync now ≈974 med (was ≈1000 pre-land, 1198 pre-wave-2;
  −224 total, 1.51× Panda). Diet count: 13 landed (repro2's
  12 + this one). Freed slot → swarm-pushstring (T2).
- swarm-scalarreproof BANK (HELD member RE-PROVEN, pre-set-3
  base, joins set-4): WhenSteps step-iteration trait
  composes the five-tuple fast frame with the generic
  `LookupKey<'a, W>` (3 impls: [String]/Vec<String>/
  [Box<str>]; landed diet body verbatim in fallback;
  byte-helpers shared, banked monomorphization dead-end
  structurally avoided). 1 file +228/−12 + new 247-line
  parity suite (6 tests). Filed
  `docs/perf/waves/wave-2/report-swarm-scalarreproof.md` +
  `scalarreproof.patch` (captain-verified: applies CLEAN to
  tip ddce131e7). Census re-verified on base (FINDING: exact
  loop halved 70,852→35,426 by landed diag — live prize
  ≈+0.16ms, filed not hidden); ≈1.09M differential checks
  0 div (Box<str> escape edges now covered — the banked
  gap closed); phase marginal +0.24ms mean (6/7 runs,
  paired +0.25, wins both live W — abstraction costs
  nothing vs banked concrete +0.25); base-tree control
  files ±0.1 instrument floor; identity 4/4; 572+1+5
  green; q 0v/0w. Whole-sync A/B not run per brief (phase
  bar for ≈0.2ms effect). Correct BANK. Freed slot →
  swarm-recordaudit (T3).
- Tick 03:50: 7 running (analysisb/programsfx/wantctx/
  atrules/lineindex/pushstring/recordaudit). Lineindex
  HOLDS lock and is moving fast: census RESOLVED wt ~5.3ms
  hot (82,582 queries ×3 identical, all-ASCII — clears the
  5ms falsification bar, lazy shape dead on audit), SWAR
  diet set-2 8-pair done, pooling + identity next. Wantctx
  observed the LAND verdict + captain's landing (all 5
  files bit-identical to its snapshot) and finalized its
  stacked rebase plan (count on old pin, implement on
  landed ddce131e7). Recordaudit order audit COMPLETE
  (membership-only live path, styletrace map excluded),
  census staged, queued. Pushstring/atrules staged,
  queued. Analysisb vocal, still queued (~4h total —
  lock-dependent, not stuck). WATCH (no action):
  programsfx ~35 min since last line (staged diet +
  scripts, queued through 2 rotations) — under 60-min bar.
  No deadlock, no pings sent. Board full, nothing to dispatch.
- swarm-lineindex BANK (pre-cloneplasma base, joins set-4):
  ASCII-tail SWAR fast path in LineIndex::line_col (word
  scan + arithmetic, slow path byte-identical). 1 file
  +65/−1, 2 pin tests. Filed
  `docs/perf/waves/wave-2/report-swarm-lineindex.md` +
  `lineindex.patch` (captain-verified: applies CLEAN to tip
  ddce131e7). Census ×3 identical (82,582 queries, all
  push_want, 0 diagnostic-site; true wt 5.31ms — cleared
  the 5ms bar, diet proceeded); lazy shape dead on audit,
  ASCII-flag shape BUILT+MEASURED+KILLED (+74% build cost);
  function-A/B predicts −4.42ms; pooled 16-pair −2.90 med
  / −6.61 paired-med brackets prediction (sub-bar →
  correct BANK); identity 4/4; 73/73 determinism; 596+1
  green; q 0v/1 length warning (banked with rationale).
  Set-1 disclosed non-verdict (taxed shape). Freed slot →
  swarm-valgraph (T4).
- swarm-pushstring CUT (ceiling, zero builds, T2): site-tagged
  census ×3 identical (82,582 push_wants, line_col excluded
  by construction — T1/T2 split exact and disjoint). ALL
  wants from the single literal.rs:23 string site (other 15
  sites 0 calls); every non-positional box necessary under
  Want's repr (proof-observable or resolve-read); growth =
  realloc fenced ground; important-scans already minimal.
  Diet-addressable SUM ≈0.1–0.3ms « 8ms bar « 5ms floor.
  Filler filed: interned-Want repr (Rc<str>/IDs, 245k
  mallocs ≈5–8.5 fantasy, realistic 3–5 after probe tax —
  fenced vs wantctx LIVE, resolve readers, proof-mode).
  Filed `docs/perf/waves/wave-2/report-swarm-pushstring.md`
  (no patch — nothing built). Correct fast CUT per the
  explicit falsification bar. Freed slot → swarm-scoperec (T5).
- swarm-analysisb BANK (pre-set-2 base, joins set-4 — the
  4-hour crew delivers): D1–D5 expectations diet (content
  gates kill all 3,122 JSX walks + 2 css walks; Cow static
  keys; borrowed import spellings; shared import scan;
  member-tag CSE). 9 files +200/−53, 5 gate pin tests.
  Filed `docs/perf/waves/wave-2/report-swarm-analysisb.md` +
  `analysisb.patch` (captain-verified: FAILS vs tip on 4
  files — conditions/css/jsx/mod, hashers' landed Fx
  conversions; crew pre-analyzed as orthogonal-line
  mechanical compose; set-4 integrator rebases). ~52k
  allocs + 3,122 walks + 3,122 scans removed (exact
  census); 8-pair −0.64 (ex1 −2.75, ±16 noise — fantasy
  model honestly corrected 8–11 → ~2–3 true); identity
  4/4; determinism ×2; 42-fixture adversarial differential
  DIFF-CLEAN (~40 looks + ~23 slots preserved); 575+1
  green; q 14/14 clean 0v/0w. Correct BANK (cascade
  precedent). Freed slot → swarm-stageaudit (T6).
- swarm-scoperec CUT (ceiling, zero builds, T5 DRY): exact
  string census ×3 order-identical (47,343 lines): 43,516
  allocs SUM ≈0.9–1.5ms fantasy « 6ms bar (maximal bound
  incl. walks-side + fenced ground 1.6–2.6ms still fails);
  attach 0 pushes, clear 0 deps, 4,266 named / 0 other
  imports. Flame remainder is BTree/compute, not strings.
  Borrowed-keys soundness designed anyway (AST-borrow
  unsound — local-Allocator dangle; content-borrow invasive
  + specifier unborrowable). Filler honest: room dry,
  revisit only on import-dense loads. Filed
  `docs/perf/waves/wave-2/report-swarm-scoperec.md` (no
  patch). Correct fast CUT. Freed slot → swarm-intset4
  (set-4 bank integration — 7 members).
- swarm-recordaudit CUT (ceiling, zero builds, T3): exact
  insert census ×3 identical (15,122 collects, 54,880
  inserts into ≤4-elem tables, 10.85 B keys, names 0
  live) × criterion unit (466ns/4 = 116.5ns/insert,
  allocs inside) → fantasy 6.4ms < 8ms bar. Order audit
  PASSED-but-moot (membership-only live path — filed as
  ground, not a build license); excluded families named
  with evidence (PathBuf compares, serde rebuilds, test-only
  star names); filler: double-clone value strings, dead Hop
  machinery, record_copy clones. Flame upper readings
  confirmed as 3a oversample + family-sharing. Filed
  `docs/perf/waves/wave-2/report-swarm-recordaudit.md` (no
  patch). Correct fast CUT. Freed slot → swarm-visitrec (T7).
- Tick 04:20: 7 running (programsfx/wantctx/atrules/
  valgraph/stageaudit/intset4/visitrec). Atrules HOLDS lock
  (census block). Intset4 static merge progressing edit-only
  (4 bit-exact + realloc D2/D7 + analysisb 9-file Fx-compose
  + sysprefix/selpush compose w/ escaped_len fallout; D1
  adjudication pending collect-report evidence — working,
  no action). Valgraph/stageaudit/visitrec queued fresh;
  wantctx queued (~30 min, verdict-gated + staged).
  DEADLOCK TEST on programsfx (~65+ min no claims line):
  RULED NOT DEADLOCKED — read-only worktree inspection
  shows a complete staged state (REPORT skeleton with
  PENDING lock-block sections, 8-site audit table, 7-file
  conversion implemented, suites+q green lock-free, last
  build 02:36) waiting on the named external lock through
  7 consecutive rotations, not on itself. Interrupting
  would destroy 2h of good staged work for a queueing
  phenomenon. No ping sent, no action — recheck next tick;
  starvation noted as retrospective evidence (HQ-requested
  orchestration review). No deadlock, board full, nothing
  to dispatch.
- swarm-atrules CUT (ceiling, zero builds, recipepath lead):
  at-rules census ×4 (10,485 lines ×2 per binary): 9,057
  atoms = 6,629 zero-alloc w0 + 2,428 w1 over 3 container
  queries; 4,394 groups; 393 dietable w1-hits = 786 allocs
  ≈1ms optimistic — bars the 5ms floor AND 15ms bar with
  3× margin (lead's implied volume overstated 23×). Richer
  borrowed-keys variant also barred (~3.5ms, invasive
  lifetime refactor, order-bar risk). Exact filler filed
  (borrowed-key linear probe + Equivalent alternative +
  2 pin tests + bank conditions + recipepath-pending
  composition note for intset4). Outputs 4/4 pins;
  reverted tree 594+1 green. Filed
  `docs/perf/waves/wave-2/report-swarm-atrules.md` (no
  patch). Correct fast CUT. STARVATION OVER: programsfx
  holds the lock for its census+verify block. Freed slot
  → swarm-tokenphase (T8).
- swarm-programsfx BANK (micro, first set-5 member): parse-new
  programs maps std→Fx (7 files +24/−25, pure type swaps +
  1 extra site from repo-wide grep; parser/mod.rs no-edit;
  exports exclusion stands). Filed
  `docs/perf/waves/wave-2/report-swarm-programsfx.md` +
  `programsfx.patch` (captain-verified: applies CLEAN to tip
  ddce131e7 — cloneplasma disjoint as crew claimed; intset4's
  realloc D2 lines disjoint too). Census ×2 identical
  (9,485 SipHash ops, 0 iters, fantasy 0.33ms); 8-pair
  −2.48 (5/8, ex1 −0.18 — honest sub-noise); identity 8/8
  byte-identical; 26/26 determinism; 594+1 green;
  styletrace failset identical; q 0v. STASH INCIDENT (see
  process lessons): recovered intset4's dropped stash from
  the object store; captain verified intset4's merge alive
  in-tree (20 files) + progressing post-incident — no
  action, lesson filed. Correct micro-BANK. Freed slot →
  swarm-recordcopy (recordaudit filler #3, off-backlog).
- swarm-valgraph CUT (ceiling, zero builds, T4): piece census
  ×3 identical (15,122 pairs = 3,122 retained ALL staged +
  12,000 streamed ALL dropped in from_plan; records tiny
  both classes; Fs dupes 0) × criterion units (record-drop
  s1 156ns ceiling, Fs-growth 249µs measured, set-growth
  98µs) → bundle fantasy ≈3.5ms < 8ms bar (2.3× margin,
  also under 5ms floor). Forget-delta design BUILT+
  MEASURED+KILLED (2.3× slower — measures distress, not
  cost). Fillers F1–F6 filed (F1 retained-bag deferral
  ~1.3ms needs home outside T4 + sequence after stageaudit;
  F6 arena revival condition ≥3× richer records). Flame
  residual honestly reconciled (CUT doesn't depend on it).
  Filed `docs/perf/waves/wave-2/report-swarm-valgraph.md`
  (no patch). Correct fast CUT. Freed slot → swarm-trbl
  (shorthand D3 lead, off-backlog micro).
- swarm-recordcopy CUT (ceiling, zero builds, recordaudit
  filler #3): copy census ×3 identical (906 clones ALL
  shape_of, 3.67 entries/1.0 imports per copy — copies
  concentrate on popular targets vs 1.81 global mean) ×
  criterion unit (596ns interpolated, drop-included,
  overstated-conservative) → fantasy 0.54ms < 8ms bar
  (15×) < 5ms floor (9×). Cross-checks exact vs
  recordaudit/extend/valgraph counts. Order audit filed
  (names_of order-path EXCLUDED with test-only readers
  named). Filler: 4 borrowed-view one-liners + Forge
  Slice-3 origin note + structural cap (1 copy/hit-walk;
  needs 10× volume + bigger tables to threaten the floor)
  + re-census recipe. Filed
  `docs/perf/waves/wave-2/report-swarm-recordcopy.md` (no
  patch). Correct fast CUT. Freed slot → swarm-harvestphase
  (harvest per-phase revival, off-backlog).
- Tick 04:50: 7 running (wantctx/stageaudit/intset4/
  visitrec/tokenphase/trbl/harvestphase). Visitrec HOLDS
  lock (count block). Wantctx census COMPLETE ×3 (79,431
  Box steps — exact match to filed count) and DIET
  IMPLEMENTED edit-only on landed lines (7 files, R1 emit
  sites untouched underneath); queued for verify hold.
  Intset4 prep 100% (merges+suites+q+7 LOO diffs+harness+
  draft), queued for the ~170-run timed block. Tokenphase
  staged (keys2-corpus phase method); trbl census staged;
  harvestphase staging; stageaudit staged (double-collect
  fusion spotted, gated on N2 unit — ~30 min quiet,
  under bar). No crew silent 60+ min, no self-waits. No
  deadlock, no pings sent. Board full, nothing to dispatch.
- swarm-visitrec CUT (ceiling, zero builds, T7 DRY): exact
  dispatch census ×3 identical (11,875 dispatches, 31,437
  slice allocs, ~70k probes, boundary-proven static) × 15
  criterion units → fantasy 2.10ms < 8ms bar (3.8×) < 5ms
  floor (2.4×). Extract crew's ≈2ms survey CONFIRMED exact
  (their ~16k order now 19,564 counted); visit_call 46–48wt
  is ~96% walks, dispatch slice was always ~2. Visit-less
  revival designed-then-FENCED (call-presence + binding-
  absence signals need a pre-walk ≈ the walk, or shot2-
  barred pre-scan — CUT twice over). Filler honest: room
  dry, revisit only on call-dense loads. Filed
  `docs/perf/waves/wave-2/report-swarm-visitrec.md` (no
  patch). Correct fast CUT. Freed slot → swarm-bagdefer
  (valgraph F1, verdict-gated on stageaudit).
- swarm-tokenphase CUT (per-phase, zero builds, T8 — re-seed
  CLOSED: T1 BANK, T2/T3/T4/T5/T7/T8 CUT, T6 running):
  isolated phase 9.0–9.1ms (reproduces 7–9wt band, keys2
  method mirrored with fidelity proofs); census ×3
  byte-identical (402k lines, FE split exactly modgraph's
  43,870/1,456); two-mechanism stack MEASURED 3.49–3.52/
  38.5% — share prong passes, absolute prong FAILS by
  1.5ms/30% (F1 exact-push 3.39 + L1b dead-probe gate
  0.36; third mechanism sketches to only ≈4.7 predicted —
  slot-justification stacking refused). Bank-grade filler
  (exact F1/L1b shapes, parity-proven over full corpus,
  bank conditions + pin tests specified). Filed
  `docs/perf/waves/wave-2/report-swarm-tokenphase.md` (no
  patch). Correct measured CUT. Freed slot → swarm-modmap
  (PathBuf modules-map recon, off-backlog).
- swarm-intset4 DONE → captain rules SUBSET-CONFIRM (6),
  recipepath HELD pending (OVERRULE on one member — read
  carefully). Filed `docs/perf/waves/wave-2/integrate-set4.md`
  (481 lines; exemplary honesty — every number disclosed).
  Merge: extend/recipepath/scalarreproof/lineindex bit-exact;
  realloc D7 + analysisb 4-file rebases mechanical (Fx
  retained); sysprefix/selpush compose per crew spec (+1
  trivial escaped_len accessor); realloc D1 YIELDS to landed
  collect on the collect crew's own filed race note + static
  zero-alloc audit + count agreement (ACCEPTED — nothing
  lost, nothing double-claimed). Suites 607+1+5 (delta
  exactly 21 named tests) + module_graph +4; q 0v/5w
  (4 pre-existing/banked + 1 merge-tripped jsx_attrs
  365→366 soft length — ACCEPTED, cohesive module, 1 line);
  styletrace 31/18 identical; identity 4/4; 186/186
  determinism. Sum: FULL −14.07/−1.43% (6/8, ex1 −13.16,
  pairmed −26.92 — all agree SIGN, magnitudes spread
  −13…−27). Bisect: extend −15.35 / sysprefix −5.96 /
  lineindex −3.90 / realloc −1.18 (straddle) / analysisb
  −1.54 (straddle) / scalarreproof +0.62 (disclaimed null)
  / recipepath +5.42 (2/8) + REPLICATED +7.80 (1/8), all
  estimators positive BOTH sets. THE RULING: the integrator
  invoked the wave-1 reserve precedent for recipepath, but
  its load-bearing condition ("sum clears with headroom")
  FAILS (−14.07 clears neither prong), and recipepath is
  NOT a straddle like selpush (±2, p≈0.36) — it is a
  replicated directional contra (3/16 favor, p≈0.01) that
  FAILED its own banked replication (−13.05 7/8 → twice
  contra). It differs in KIND from the set's other weak
  cells (realloc/analysisb straddle as banked;
  scalarreproof's whole-sync null was disclaimed) — the
  only member whose whole-sync effect failed to replicate.
  Dropping it is not cherry-picking; landing it would
  stretch the precedent past its justification and risk
  baking ~+6 of harm into the tree. ADDITIVITY supports
  the concern (LOO-sum −21.89 vs FULL −14.07, gap +7.8 ≈
  recipepath's measured harm — diffuse-loss is the rival
  hypothesis, unproven). DOCTRINE (stated, not stretched):
  the 15ms filter governs SOLO claims and member-level
  regression signals; bank SETS land on sign-resolved sums
  + identity + suites — and a replicated-contra member
  earns a subset-confirm, not a free ride. ACTION:
  swarm-intset4b confirms FULL-minus-recipepath (fresh
  8-pair + identity + determinism + suites); recipepath
  HELD with re-proof spec (isolate the cloneplasma ×
  allocator interaction; re-present with in-composition
  evidence). If subset ≈ −14 too → diffuse-loss wins,
  land subset anyway (cleaner, no red cells); if subset
  ≈ −20+ → recipepath was harmful, subset lands bigger;
  if subset disappoints → reassess with data. Nothing
  landed yet. Freed slot → swarm-intset4b.
- Tick 05:21: 7 running (wantctx/stageaudit/trbl/
  harvestphase/bagdefer/modmap/intset4b). Trbl HOLDS lock
  (count+unit block). Bagdefer census RESOLVED ×3
  (3,003 unread bags of 3,122 — F1 shape alive; load-time
  variant void, first-read shape gated on stageaudit
  verdict). Stageaudit diet BUILT (with_bag fusion, q 0v,
  suites == tip), queued verify. Wantctx diet implemented,
  queued (~20 min, under bar). Intset4b grounding (subset
  rebase per filed record). Modmap/harvestphase staged,
  queued. Housekeeping: moved the intset4 ruling to the
  true tail (third anchor-stranding — fix is now scripted,
  not hand-edited). No deadlock, no pings sent. Board
  full, nothing further to dispatch (intset4b covers the
  freed slot).
- swarm-trbl CUT (ceiling, zero builds, D3 micro): split-site
  census ×3 byte-identical (3,964 reaches ALL 1-token, 0
  gate passes — shorthand's lead reproduced byte-exact;
  92% 1–4 chars, 0 parens, 104 distinct values) × criterion
  unit (49.7ns weighted) → fantasy 0.20ms < 1ms micro-bar
  (5×) < 5ms floor (25×). The split is already cheap
  (~50ns floor, 1 short scan + 2 tiny allocs). Exact
  paste-ready filler (count_tokens byte scan + gate
  insertion + differential test + bank conditions N≥20k).
  Scope closed (public wrapper 0 callers; border site dead,
  fenced). Filed `docs/perf/waves/wave-2/report-swarm-trbl.md`
  (no patch). Correct fast CUT. BACKLOG EXHAUSTED (T1–T8
  closed, all leads dispatched or dead — remaining scraps
  refused: SmallVec wash, FactoryWait barred, Cow→gate
  dead, F3/F4/F5 sub-slot, f64 disproportionate): slot
  HELD at 6 crews to cut lock contention for intset4b's
  landing-confirm + wantctx/stageaudit verifies. Triggers
  to refill: intset4b verdict (land + set-5 integrator),
  wantctx/stageaudit verdicts (set-5 members). Standby
  topic if HQ wants the board full: line_col free scans.
- swarm-wantctx BANK (verdict-gated sequencing vindicated,
  joins set-5): WantContext borrow diet — `WantContext<'w>`
  borrows the live want's condition stack through a
  per-want-short inner session (the naive long-session
  borrow was ATTEMPTED and provably fails borrowck on the
  recipes scoped-local path — E0597 filed; inner session
  is the sound fix, same borrow, correctly scoped slot).
  7 files +69/−44 (crew fast-forwarded its own tree to the
  landed ddce131e7 and diffed against it — verified by
  captain: worktree HEAD == tip, patch CHECK-PASS vs tip).
  Filed `docs/perf/waves/wave-2/report-swarm-wantctx.md` +
  `wantctx.patch`. Census ×3 identical (79,431 Box steps
  exact match to filed count); 8-pair −5.39/−0.52% (6/8,
  ex1 −5.46, pairmed −4.92 — all inside the counted 5–7ms
  band, sub-bar → correct BANK); identity 4/4 full-sha;
  determinism 2/2; 595+1 green (delta 0 — borrow-correctness
  compiler-proven); vitest same-red; styletrace 31/18
  identical; q 0v/2 pre-existing; warnings 2/18==2/18.
  R1 emit sites byte-untouched underneath. Second slot
  HELD (5 crews live) — backlog still exhausted; set-5
  integrator stages when stageaudit/harvestphase/bagdefer/
  modmap verdicts land.
- swarm-stageaudit BANK (T6 — RE-SEED FULLY CLOSED: T1+T6
  BANK, T2/T3/T4/T5/T7/T8 CUT; joins set-5): streamed
  double-collect fusion (collect once in stage_streamed,
  merge by ref, move bag into staged source). 2 files
  +15/−4, delta 0 tests (pure refactor). Filed
  `docs/perf/waves/wave-2/report-swarm-stageaudit.md` +
  `stageaudit.patch` (base == tip, check-clean). Work
  census split gating 6.8 vs non-gating 8.64/8.72 (cleared
  the 8ms bar → built); 8-pair −7.11/−0.72% (5/8, ex1
  −6.51, pairmed −7.49 — all agree; p4b +370ms spike
  disclosed, verdict robust ex-p4); identity 4/4;
  determinism 26/26; 595+1+0 green; q 0v. Shot2 fence
  honored (fusion, zero skip shape). Bagdefer's gate OPENS
  (verdict posted — adjacent disjoint mechanisms per the
  collision note; bagdefer reads claims itself, no ping).
  Third slot HELD (4 crews live) — set-5 integrator stages
  when harvestphase/bagdefer/modmap verdicts land.
- Tick 05:50: 4 running (harvestphase/bagdefer/modmap/
  intset4b), 3 slots held. Modmap HOLDS lock and cleared
  its bar: census ×3 identical (3,122 inserts, 4,442 gets
  ALL hit, 0 lazy) × units → fantasy 9.74ms ≥ 8ms (cold-
  bracket 9.05; order gate passes live); diet (a)
  FxHashMap+sort-at-read selected, option-b killed on
  order-unreproducibility; implementing under held lock.
  Bagdefer observed stageaudit BANK, rebase clean-disjoint,
  DIET IMPLEMENTED edit-only (q 0v, suites green), queued
  verify. Intset4b static proof COMPLETE (atomic delta
  exactly 15 + modgraph +4 = 19 carried-over, q 0v/same-5,
  styletrace identical, restore 19/19), harness prepped,
  queued for timed block. Harvestphase staged, queued
  (~25 min, under bar). No deadlock, no pings sent.
  Nothing to dispatch (slots held per backlog-exhausted
  ruling; intset4b covers the landing path).
- swarm-modmap CUT (fantasy-cleared but measured-zero —
  built, proven, killed): PathBuf modules-map census ×3
  identical (3,122 inserts 86.7B/10-comp keys, 4,442 gets
  ALL hit, 0 lazy) × criterion units → fantasy 9.74 ≥ 8ms
  bar CLEARED, so the order-audit-passed diet (Fx + sort-
  at-read, option-b killed unsound, dual bounded <5ms
  floor) was BUILT, micro-predicted −6.1 — and measured
  +1.48/3/8 whole-sync (stands ex1, dip-corrected −0.7).
  Genuine non-confirmation (hashers −6.3/6/8 control rules
  out bad luck; warm≈cold kills temperature theory; diet
  binary verified live). Diet reverted, tree = REPORT
  only. Revival recipe filed (in-process trace replay
  discriminates misresolution vs in-situ penalty — do not
  re-run 8-pair hoping). Identity 4/4; failset-identical;
  q 0v. Filed `docs/perf/waves/wave-2/report-swarm-modmap.md`
  (no patch). Correct honest CUT — the bar system working
  at its best (counts said build, stopwatch said cut,
  crew obeyed the stopwatch). Fourth slot HELD (3 crews
  live: harvestphase/bagdefer/intset4b).
- swarm-bagdefer BANK (verdict-gated on stageaudit, joins
  set-5): retained-bag first-read deferral (stage lazies
  in from_plan, bag_mut collects on first R-read +
  memoizes; 3,003 unread bags skip collect AND drop). 2
  files +97/−18, 1 pin test. Filed
  `docs/perf/waves/wave-2/report-swarm-bagdefer.md` +
  `bagdefer.patch` (base == tip, check-clean). Read census
  ×3 order-identical (UNREAD 3,003 all-loaded; load-time
  variant VOID, literal sketch UNSOUND — first-read shape
  only); closed reader inventory (3 R-sites, general not
  corpus-gated); 8-pair +7.21/+0.74% crew-sign (6/8, ex1
  +5.63, pairmed +2.61 — honest: median 5× fantasy, paired
  1.8×, allocator-or-drift disclosed; sub-bar → correct
  BANK); identity 4/4; determinism 2/2; 596+1 (delta
  exactly pin test) + module_graph 105 green; vitest
  failsets 35==35 byte-identical (override artifact
  reproduced both arms); q 0v/2 pre-existing. Stageaudit
  outcome read fresh, clean-disjoint rebase. Fifth slot
  HELD (2 crews live: harvestphase/intset4b).
- swarm-intset4b DONE → LAND-SUBSET6 (the ≈−20 branch —
  the overrule is VINDICATED). Filed
  `docs/perf/waves/wave-2/integrate-set4b.md` (195 lines).
  Subset reproduced independently per the filed record
  (11 bit-exact + D7 + analysisb compose + sysprefix
  compose), then byte-verified 19/19 IDENTICAL to intset4's
  tree minus exactly recipepath's 2 files (one doc-comment
  line converged post-compare, disclosed). Sum: −19.25/
  −1.97% (8/8 UNANIMOUS, ex1 −21.76, pairmed −15.80 —
  beats FULL −14.07 on median + ex1 with tighter spread;
  recipepath WAS harmful in composition ≈ +5). Identity
  4/4; 28/28 determinism; atomic 605+1+5 (delta exactly 19
  named); module_graph +4; q 0v/same-5; styletrace
  identical. Recipepath HELD with the specified re-proof
  (in-composition evidence, not another member-alone LOO).
  Captain firsthand: 605+1+5 green, q 0v/5w, 19 files
  byte-identical. LANDED `e360915f` perf(rs): wave-2 set-4
  subset, 19 files +1126/−128 (incl. new parity suite).
  Enterprise sync now ≈955 med (was ≈974 pre-land, 1198
  pre-wave-2; −243 total, 1.48× Panda). 19 diets landed
  (12 + cloneplasma + 6). Sixth slot HELD (1 crew live:
  harvestphase) — set-5 integrator (programsfx + wantctx +
  stageaudit + bagdefer + harvestphase-verdict) stages on
  harvestphase's verdict.
- Tick 06:20: 1 running (harvestphase), 6 slots held, lock
  FREE (intset4b released on DONE). Harvestphase staged,
  last line queued on intset4b's now-released hold —
  expected to grab the free lock next; fresh, no concern.
  All verdicts curated (intset4b LANDED e360915f). Set-5
  bank: programsfx + wantctx + stageaudit + bagdefer (all
  tip-clean... note: tip moved to e360915f — set-5
  integrator re-verifies applies at stage time).
  No deadlock, no pings sent. Nothing to dispatch.
- swarm-harvestphase PER-PHASE-BANK D1 (last verdict; joins
  set-5): 6-line sinks-empty skip in mint (+23-line pin
  test), 1 file +29. Static/dynamic SPLIT census ×9 killed
  the dynamic-heavy death clause (sinks_raw = 0 ALL 4
  scales); tip drift re-measured (t_seed/t_merge/t_visit
  all shrank under landed diets — D1 survives, D4 doesn't).
  Phase-bench 6 pairs: −8.60ms median, 31.6% share, 6/6,
  every pair clears both prongs (D1 arm reads 0.000 ×8 —
  total skip); D2 CUT at exactly 0.00; D4 CUT at ≤0.26
  gross (+ churn-volume filler). Whole-sync directional
  −7.33 (no-regression read, never the verdict basis).
  REPORT FILE TRUNCATED mid-sentence (crew output cap —
  proof sections missing from the file); proof CARRIED by
  the VERIFY-COMPLETE + DONE claims lines (identity 4/4,
  determinism 3/3, 596+1 green, q green, styletrace 31/18)
  + captain's independent medians cross-check from the
  filed pair table (−7.33 ✓ exact). Filed
  `docs/perf/waves/wave-2/report-swarm-harvestphase.md`
  (verbatim, truncated) + `harvestphase.patch`
  (captain-verified: CLEAN vs new tip e360915f). Correct
  per-phase BANK (keys2 precedent). Set-5 STAGED: all 5
  members (programsfx/wantctx/stageaudit/bagdefer/
  harvestphase-D1) check-clean vs e360915f — zero rebases.
  Freed slot → swarm-intset5.
- Tick 06:50: 1 running (intset5), 6 slots held.
  Intset5 static proof COMPLETE (atomic delta exactly 2
  named pins, modgraph identical, q 0v, styletrace
  identical, restore 19/19) and HOLDS the lock since 06:49
  for the timed block (7 arm builds + 6×8-pair + identity).
  All verdicts curated. No deadlock (sole crew fresh and
  holding), no pings sent. Nothing to dispatch — the
  set-5 verdict is the next event.
- swarm-intset5 DONE → LAND whole set (clean — doctrine
  applied correctly). Filed
  `docs/perf/waves/wave-2/integrate-set5.md` (328 lines).
  All five bit-exact, zero rebases (19 files, exact union);
  stageaudit×bagdefer composition traced line-by-line
  (streamed collects exactly once, retained takes the
  disjoint Lazy arm — prizes preserved verbatim both
  ways); behavioral pairs grep-closed. Sum: −17.37/−1.82%
  (8/8 UNANIMOUS, ex1 −18.58, pairmed −15.91 — tight
  −15.9…−18.6 band, no spikes). Bisect: wantctx −2.34 /
  bagdefer −5.22 (6/8, replicates bank) / harvestphase
  −6.65 (8/8 — the per-phase bank resolves whole-sync in
  composition, keys2 precedent vindicated again) /
  programsfx +2.25 + stageaudit +1.88 straddles (paired-
  medians +0.03/−0.13 — essentially exactly zero, 4/8,
  single-set). Zero contra — the straddles differ in KIND
  from recipepath (replicated directional) and ride the
  reserve precedent with the full three-part justification;
  no subset-confirm warranted (cascade precedent bars
  second sets on sub-noise). Identity 4/4; 126/126
  determinism; atomic 607+1+5 (delta exactly 2 pins by
  name); module_graph identical; q 0v/same-11; styletrace
  identical. Captain firsthand: 607+1+5 green, q 0v/11w,
  19 files byte-identical. LANDED `6c3909506` perf(rs):
  wave-2 set-5 diet, 19 files +234/−91. Enterprise sync
  now ≈938 med (was ≈955 pre-land, 1198 pre-wave-2; −260
  total, 1.45× Panda). 24 diets landed. Board EMPTY (all
  crews delivered, backlog exhausted) — wave-2 COMPLETE
  pending HQ's morning review; held: recipepath (HELD,
  interaction re-proof spec filed), scalarjson-original
  (superseded by scalarreproof's landed frame).
- Tick 07:20: board EMPTY (roster zero, lock free, tip
  6c39095). All verdicts curated, all 24 diets landed
  across 6 arcs, enterprise ≈938 (−260, 1.45× Panda).
  Wave-2 COMPLETE — no crews to check, no deadlock
  possible, nothing to dispatch. Standing by for HQ's
  morning review (retrospective on bench-lock orchestration
  requested; next wave needs fresh flames on the ≈938 tip).
- Tick 07:50: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet since intset5 DONE). Nothing to dispatch.
- Tick 08:20: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet). Nothing to dispatch.
- Tick 08:50: board EMPTY (roster zero, lock free, tip 6c39095, claims quiet). Nothing to dispatch.
