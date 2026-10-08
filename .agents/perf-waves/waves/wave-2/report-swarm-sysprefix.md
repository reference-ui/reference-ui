# swarm-sysprefix REPORT: system-prefix format-once

## Verdict

**BANK (proven-identical diet, sub-bar by construction: 423,090 redundant char-escapes
eliminated, 1.04 ms/sync measured in release probe; 8-pair median Δ −0.31 ms/−0.03%
full, −2.03/−0.19% ex-run-1 — effect below the pair-noise floor, mechanism counts
prove the eliminated work)**

## Base / artifacts

- Base commit: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (verified `git rev-parse HEAD` first command; wave-2 set-1 landing)
- Base `.node` sha256: `56a98d1413bb9bd108f3ab2ec36c5d419d41766a1559a1b755697a151502968e`
- Candidate `.node` sha256: `9f9912aa6b70f5168c23b03bf35573b71505a6725491d0231a619f2ad8142440`
- Both binaries `cp`-saved aside (`/tmp/swarm-sysprefix/base.node`, `/tmp/swarm-sysprefix/cand.node`); arms selected via `REFERENCE_UI_NATIVE_PATH` (zero swap/rebuild interference, cascade INTEGRATE method)
- Harness never rebuilt mid-set: both `.node` sha256 verified after every one of the 27 timed runs (1 smoke + 4 warmups + 16 pairs + 6 cross-scale), all ok
- Base built via stash dance (3 diet files stashed, built, asided, popped; tree verified back to diet-only after)
- Temp timing probe (release microbench, fully reverted — `grep -c temp_sysprefix` = 0 after): separate compile, never scored
- Fresh worktree lacked `node_modules`, `dist/*.mjs`, `.node` → `pnpm install` + `build:js` ran once each (gitignored/byproducts restored, not in diff)

```
git diff --stat
 .../modules/atomic/src/stylesheet/cascade/mod.rs   |  24 +++--
 .../modules/atomic/src/stylesheet/name/escape.rs   |  11 +++
 .../modules/atomic/src/stylesheet/name/mod.rs      | 110 +++++++++++++++++++--
 3 files changed, 129 insertions(+), 16 deletions(-)
```

## 1. Mechanism (ONE): system-prefix format-once

D2 lead filed by swarm-selpush §Collision (BANKED, pending set-3): ~423k redundant
system-prefix chars (`bench-enterprise__`) escape identically every atom. `system` is
constant across every atom in a `write_utilities` call (one call per sync — single
`build_stylesheets_with` → `shared_layers` chain — one `system.name`) and the
`EscapeCursor` always starts at index 0 there, so the escaped `{system}__` bytes are
identical for every atom — but `push_selector_base` re-escaped them per atom (fresh
cursor + 18 char pushes × 23,505 atoms).

Diet: `SelectorPrefix::for_system` escapes `{system}__` ONCE per `write_utilities`
call through a fresh cursor (recording bytes + cursor position); the prefix threads
`write_groups` → `write_group` → `write_rule` → `push_selector_with_prefix` →
`push_selector_base`, where each atom replays it via one `push_str` + `cursor.advance`.
`push_selector_with_system` keeps its signature as a one-shot-prefix wrapper (its sole
caller was `write_rule`; tests + any external path unchanged). `EscapeCursor::
{position,advance}` are the only `escape.rs` additions; `append_escaped`,
`push_char`, `push_hex_escape`, `is_ident_body` untouched — EscapeCursor rules
preserved exactly. Exactness note: the cursor index counts identifier *chars* and is
only ever tested for `== 0`; the replay restores the exact post-prefix index, so all
downstream escape decisions are identical bit-for-bit (empty system replays nothing,
cursor stays 0, leading rule keys off the first subsequent char exactly as before).

NO order changes anywhere (sortshape bar): sort, comparator, `CascadeKey`,
`scan_conditions`, `group_end`/`same_wraps`, grouping untouched — only the post-sort
emission argument changes from `&str` to `&SelectorPrefix`, and per-rule bytes are
identical by construction.

Deliberately untouched: recipe path (`recipe_selector` escapes per-rule `class_name`
whole-string — a different key shape, not per-system-constant work); runtime
`class_name_with_system` (unescaped plan path); `class_prefix_for_prop` canon lookups
(callermemo ground); `nest()` internals (selpush's BANKED ground).

## 2. Mechanism counts (seed-7 enterprise load)

| count | value |
| --- | --- |
| atoms N (utility rules) | **23,505** (counted from my own kept output: `.bench-enterprise__` occurrences in `@layer utilities`; zero `:is(`-wrapped; matches selpush census on this base exactly) |
| distinct systems per sync | 1 (`write_utilities` ×1 per sync, one `system.name`) |
| system string | `bench-enterprise` (16 chars; bench config `name: 'bench-${plan.scale}'`) |
| prefix identifier chars per atom | 18 (`system` + `__`, all ident-body — zero escapes needed, but all 18 re-decoded + re-branched per atom) |
| redundant char-escapes per sync | 18 × 23,505 = **423,090** |
| eliminated per sync | N × (`EscapeCursor::new` + 18× char-decode + 18× escape branch chain) → N × (`push_str` 18 B + index add) + 1× prefix format |
| per-char escape cost | **2.46 ns** (release probe, median of 11 alternating batches; see below) |
| expected effect | **≈ 1.04 ms/sync** (probe-measured, standalone base) |

Release timing probe (temporary `cargo test --release -p atomic` test, reverted after;
batch = 23,505 ops = one sync-equivalent of prefix work, 11 alternating batches/arm):

| arm | batch ns (sorted ×11) | median |
| --- | --- | --- |
| inline (today's per-atom pushes) | 1009031 … 1132454 | 1,076,356 ns |
| prefix replay | 32077 … 39980 | 34,248 ns |

Median Δ = 1,042,108 ns ≈ **1.04 ms/sync**; per-char = 1,042,108 / 423,090 ≈ **2.46 ns**.
Tight batches, complete arm separation. Consistent with selpush's filed ~0.7 ms
incremental-over-D1 estimate (this base has no D1, so standalone gross is larger).

Ceiling math: `push_selector_with_system` 12wt incl (filed `--inspect`, both repros);
system-prefix pushes are ~49% of utilities cursor chars but cursor work is only the
`push_selector_base` fraction (nest takes ~8wt). Realistic capture ~1 ms vs solo bar
≥15 ms + ≥1.5% (~16 ms of ~1073) — unreachable by construction → MICRO-BANK track.
The BANK rests on exact eliminated-work counts + the release probe + 4-scale
byte-identity + green suites, not the stopwatch (8-pair noise is ±16 ms).

## 3. Correctness

- (a) `pnpm agentrs c atomic`: **572 + 1 passed, 0 failed** (includes 2 new pin tests:
  prefix-vs-inline bytes+position agreement across 6 systems incl. empty / scoped /
  leading-digit / leading-dash / non-ASCII; with_prefix-vs-system full-path agreement
  + literal pins incl. the leading-digit-system `.\32 xl__mt_2r` case). `pnpm agentrs q`
  on the 3 touched files: **0 code violations**, 1 pre-existing warning
  (`scan_conditions` cognitive-22 — landed with cascade's diet, untouched by me; LOG
  records it as a BANK CONDITION). My files rustfmt-clean (hand-verified stable:
  single-line signatures ≤100 cols, canonical multi-line breaks; no `cargo fmt` run
  needed). Wrappers untouched → seam vitest not required (emit precedent).
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (full sha256)
  base-vs-candidate on all four scales**:

| scale | styles.css (both arms) | runtime-data.mjs (both arms) | cssCalls |
| --- | --- | --- | --- |
| enterprise | `7ec827fb…10dcea` | `718d19e4…8918` | 7527 |
| small | `ecdec1e8…a2973` | `ad9194f4…4d41` | 171 |
| medium | `37f2ef5b…19fe` | `54735e4d…fe7ce` | 635 |
| churn | `1aad4978…ec05` | `e1349305…8cdb` | 43956 |

Full hashes match the wave-1 filed values exactly (same seed, same bytes).
Enterprise cssCalls observed in run JSON (7527); churn observed in result.json
(43956); small/medium are filed load constants (generator-deterministic on seed 7).
- (c) Determinism: all 20 in-protocol enterprise kept outputs (4 warmups + 16 pair
  runs, both arms) hash-identical — plus the base smoke, 21/21 total.

## 4. Enterprise A/B: 8 interleaved pairs, `.node` per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then pairs alternating
start arm (B/C, C/B, …). One lock hold for install+builds+suites+probe+A/B+identity
(~8 min), released immediately after the last identity run.

Warmups (unscored): base 1075.41, 1069.23; cand 1230.38, 1077.47. (One base smoke,
1435.97 cold first run, unscored, disclosed — used for harness validation: outputs
matched wave-1 sealed hashes before any pair ran.)

| pair | base syncMs | cand syncMs | Δ ms (cand−base) |
| ---- | ----------- | ----------- | ---------------- |
| 1 (B,C) | 1068.05 | 1075.56 | +7.51 |
| 2 (C,B) | 1079.17 | 1069.25 | −9.92 |
| 3 (B,C) | 1071.53 | 1055.44 | −16.10 |
| 4 (C,B) | 1071.28 | 1083.09 | +11.82 |
| 5 (B,C) | 1056.88 | 1069.46 | +12.59 |
| 6 (C,B) | 1066.53 | 1074.84 | +8.31 |
| 7 (B,C) | 1056.22 | 1063.71 | +7.49 |
| 8 (C,B) | 1071.39 | 1061.80 | −9.59 |

- base median: **1069.66 ms**; cand median: **1069.36 ms**
- median Δ: **−0.31 ms (−0.03%)**, 3/8 pairs favor cand
- Excluding run 1: base median 1071.28, cand median 1069.25, median Δ **−2.03 ms (−0.19%)**
- Median of per-pair deltas: +7.50 ms (reported for completeness; arm medians are the verdict metric)

Pair noise is ±16 ms; the ~1 ms probe-measured effect is unresolvable in 8 pairs, and
the estimators disagree in sign — a textbook below-noise-floor diet. More pairs were
considered and rejected: 16+ pairs would hog the shared lock chasing a sub-bar signal
(cascade precedent).

Other scales, single samples each (directional only — identity hashes above are the
claim, times are not): small 87.76→89.01, medium 161.49→165.08, churn 2212.92→2244.01
(all within small-sample noise — explicitly disclaimed, scalarjson-style).

## 5. Caveats (honest)

- The stopwatch does not resolve the diet (medians −0.3/−2.0 vs ±16 noise;
  median-of-deltas +7.5). The BANK rests on mechanism counts (423,090 char-escapes
  dieted, 1.04 ms/sync probe-measured in release) + 4-scale byte-identity + green
  suites — the cascade/keys2/parse/selpush BANK shape, not a timing claim.
- `cascade/mod.rs` sits at 364 lines, 1 under the 365 soft-warning limit (no warning
  fired; the one q warning is the pre-existing `scan_conditions` cognitive-22). An
  integrator composing this with selpush's `name/mod.rs` D3 hunk does not touch this
  file's count — noted, no action.
- One lock hold (~8 min, 01:49→01:57): install + cand/base builds + build:js + q +
  cargo + release probe + 27 timed runs. No foreign-process interaction of any kind;
  box otherwise quiet (no contention to disclose).
- `WARM-C1` (1230.4) and the base smoke (1436.0) are first-run warmup outliers,
  absorbed by the 2-warmup discipline.
- Recipe-layer selectors (~4.4k `bench-enterprise__`-carrying selectors in `@layer
  recipes`, e.g. `.bench-enterprise__tabs105__…`) escape through `recipe_selector`'s
  whole-string path — a different mechanism, deliberately out of scope. If a future
  crew diets that path, it stacks; no double-count with this report's 423,090
  (utilities-layer only).

## 6. Collision (for the captain)

- TEXTUAL: diet touches `stylesheet/name/escape.rs` (+11: `position`/`advance`),
  `stylesheet/name/mod.rs` (`SelectorPrefix` + `push_selector_with_prefix` + signature
  rewire of `push_selector_base`/`push_nested_selector` + 2 pin tests),
  `stylesheet/cascade/mod.rs` (thread `&SelectorPrefix` through `write_groups`/
  `write_group`/`write_rule`; sort/group/key code untouched). Same-file adjacency
  with the LANDED cascade diet (different functions: cascade's is
  `from_atom_cached`/`scan_conditions`/rank memo; mine is post-sort emission only —
  cite, don't relitigate; coherent by construction). NO overlap with set-2
  `hashers.patch` (60 files; its only stylesheet hunk is `emitter/mod.rs`, not in my
  diff — verified by grep).
- OVERLAP with swarm-selpush's BANKED `selpush.patch` (pending set-3): same two files
  (`name/escape.rs`, `name/mod.rs`). Hunk-level: (1) `escape.rs` — selpush D1 hunk
  `@@ -53,10 +53,85 @@` expands the `impl EscapeCursor` block exactly where my
  `position`/`advance` methods land → certain textual conflict, mechanical fix (keep
  both: their `push_inner`/`push_first`/`push_runs`/`push_take`/`push_ident_run` + my
  two accessors). Verified from their patch that D1 preserves byte semantics AND
  index accounting (`index += 1` per take/space, `+= end-pos` per ASCII run,
  `push_char` for first) — so my `for_system` (built via `push`) yields identical
  bytes+index under composition. (2) `name/mod.rs` — selpush D3 hunk
  `@@ -105,9 +105,18 @@` (nested-base pre-size) vs my `push_nested_selector`
  signature rewire → certain textual conflict, one-line composition (their capacity +
  my `&SelectorPrefix` param). Integrator re-verifies byte-identity + suites after
  composing. RACE RULE: different mechanisms (their per-char run diet vs my
  per-system format-once); first sound LAND wins — neither claims LAND (both
  BANK-track), so no race to call; flag for set-3 integration order.
- BEHAVIORAL: output bytes identical by construction (prefix = same cursor, same
  start index, same pushes); 4-scale byte-identity + 20/20 determinism are the proof.
  No order/grouping/comparator changes (sortshape bar honored — 67/67 divergent-tie
  finding respected by changing no ordering code at all).
- Untouched by design: recipe `recipe_selector`, runtime `class_name_with_system`,
  `class_prefix_for_prop` (callermemo ground), `nest()` (selpush ground).

## Verdict

**BANK (proven-identical system-prefix diet: 423,090 redundant char-escapes/sync
eliminated, 1.04 ms/sync release-probe-measured @ 2.46 ns/char; 8-pair median Δ
−0.31 ms/−0.03% full, −2.03/−0.19% ex-run-1, below the noise floor; byte-identical
4/4 scales + 20/20 determinism + 572+1 green + q 0 violations; mechanism counts prove
the eliminated work)**
