# swarm-recipepath REPORT: recipe-layer selector escape-once diet

## Verdict

**BANK (proven-identical diet, near-bar: 9,057 redundant whole-string escapes +
10,484 String allocs eliminated per sync; 8-pair median Δ −13.05 ms/−1.30%,
7/8, ex-run-1 −13.38, paired-median −11.39 — all estimators agree but the
≥15 ms + ≥1.5% LAND bars miss on both prongs; byte-identical 4/4 scales +
20/20 determinism + 596+1 green + q 0 violations)**

## Base / artifacts

- Base commit: `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` (verified `git rev-parse HEAD` first command; wave-2 set-3 landing)
- Base `.node` sha256: `4c60332f012d7545cea6eb7e8c3032475cd06bc3205fa0ba135ffa44954a2b66`
- Candidate `.node` sha256: `57543f6a98ea3a7f020aab3c98e06cdf1efa263ebc7d6979d862ccbdcf714a0f`
- Count `.node` sha256: `46d3fbcc120a8f8b16b1e70e48882a45ef6bd46551aa67486602bf0f2a2f416a` (temporary instrumentation, fully reverted, never scored)
- All three binaries `cp`-saved aside (`/tmp/swarm-recipepath/*.node`, all three
  hashes distinct); arms selected via `REFERENCE_UI_NATIVE_PATH` (zero
  swap/rebuild interference, cascade INTEGRATE method). Override efficacy proven
  by the count runs themselves (census lines appear only under the count binary).
- Harness never rebuilt mid-set: asided `.node` sha256 verified at block start,
  after pairs, and after identity (all ok). No wrapper variants: the diet touches
  only `.rs` emitter internals, no NAPI seam change (sysprefix/selpush precedent —
  seam vitest not required; the 4-scale identity runs already exercise the full
  JS→native→JS path end to end).
- Base built via stash dance (2 diet files stashed, built, asided, popped; tree
  verified back to diet-only `+60/−5` after; the two pre-existing stashes
  `sim-quarantine-pipeline` + `Agent Playwright CT` untouched throughout).
- In-tree `reports/latest/*` (tracked, bench-regenerated) reverted after every block.
- Cand binary verified census-free (`grep -c SWARM_RECIPECENSUS` = 0) and fresh
  (mtime = build minute) — not a stale count binary.
- Fresh worktree lacked `node_modules`, `dist/*.mjs`, `.node` → `pnpm install` +
  `build:js` ran once each (gitignored/byproducts restored, not in diff).

```
git diff --stat
 .../stylesheet/emitter/emitter_ordering_tests.rs   | 45 ++++++++++++++++++++++
 .../modules/atomic/src/stylesheet/emitter/mod.rs   | 20 +++++++---
 2 files changed, 60 insertions(+), 5 deletions(-)
```

## 1. Mechanism (ONE): recipe class-name escape-once

SYSLEAD from swarm-sysprefix §5 (BANKED, pending set-4): ~4.4k
`bench-enterprise__`-carrying selectors in `@layer recipes` (e.g.
`.bench-enterprise__tabs105__…`) escape through `recipe_selector`'s whole-string
path — a different mechanism from sysprefix's utilities-layer format-once,
explicitly out of ITS scope, and it STACKS (no double-count with sysprefix's
423,090 utilities-only count).

What the census proved live (seed-7 enterprise, §2): `group_recipe_atoms` ran
`recipe_selector(&rule.class_name, atom)` **9,057× per sync**, and every call
re-escaped its rule's CONSTANT class name whole-string (`escape_css_selector` +
`format!(".{escaped}")`), then nested per-atom selector conditions. A second
whole-string escape of the same class name ran once per rule for the sort
buckets (`emitter/mod.rs:165`, 1,427×). Per-atom bytes differ only in the nest
loop — the escape input never varies within a rule.

Diet: `escaped_base_selector` escapes `.{class_name}` ONCE per rule (one alloc:
`'.'` + `push_escaped_selector` through a fresh cursor); each atom clones the
base and runs the UNTOUCHED nest loop (`recipe_selector_from_base`); the sort
buckets reuse the same base value. Exactness (sysprefix shape): the base is
byte-identical to the old per-atom pre-nest string by construction (same escape
function — `escape_css_selector` IS `push_escaped_selector` into a fresh String
— same input, same fresh cursor at index 0); clone-then-untouched-nest yields
identical per-atom bytes; the old line-165 expression was literally the same
value, now reused not recomputed. Empty-atom rules build the base exactly as
the old unconditional line-165 escape did — same work, no output change.

NO order changes anywhere (sortshape bar): sort comparator, grouping keys,
`group_bucket`, wrap logic untouched — only the pre-sort selector construction
changes, and per-rule bytes are identical by construction.

Deliberately untouched: `nest()` internals (selpush's LANDED ground — the nest
loop call shape is unchanged, one `&str`→`String` call per selector condition
as before); `EscapeCursor` run-scan internals (selpush fence — the diet calls
the public `push_escaped_selector`, never reaches inside); sysprefix's PENDING
set-4 ground (`SelectorPrefix` in `name/mod.rs` + `position`/`advance` in
`escape.rs` — banked, unlanded; this diet is on disjoint lines in
`emitter/mod.rs` and composes underneath); marshal's `wire.rs`/`native.rs`
seam; `extract_at_rules` per-atom vecs (vary per atom, not hoistable — left for
a future crew, see §6 lead).

## 2. Mechanism counts (seed-7 enterprise load)

Temporary `AtomicUsize` census (1 file, `emitter/mod.rs` only — `escape.rs`
untouched per fence; env-gated `eprintln` dump, `stderr` inherited through the
bench child so `stdout` JSON stays pure). Fully reverted before the cand build
(`grep -c SWARM_RECIPECENSUS` = 0 in tree and cand binary). Both runs
byte-identical across all 7 counters + first-3 shape samples:

| count | value |
| --- | --- |
| `group_recipe_atoms` calls (rules) | **1,427** |
| `recipe_selector` calls (recipe atoms) | **9,057** |
| atoms with selector conditions / nest steps | 2,233 / **2,859** (= selpush's filed recipe nest count, exact ✓) |
| class_name bytes total / mean len | 304,100 / **33.6 chars** |
| non-ident bytes (escape takes) | **0** (100% ident-body — zero slow-path takes; all run-memcpy) |
| emitted recipe selectors | 4,394 lines; 23,505 + 4,394 = **27,899** whole-file occurrences (closes exactly with sysprefix's 23,505 ✓) |
| class_name shape samples | `bench-enterprise__dialog0__base` (31), `bench-enterprise__dialog0_t_accent` (34) |
| `append_recipes_layer` emissions per sync | 1 (single `shared_layers` dual build) |

Eliminated work per enterprise sync: **9,057 whole-string escape scans**
(9,057 per-atom + 1,427 rule-dup → 1,427 once-per-rule) and **10,484 String
allocs** (old 2×9,057 + 2×1,427 = 20,968 → new 1,427 bases + 9,057 clones =
10,484). Replacement per atom: one ~34 B clone-memcpy.

Ceiling math: `build_stylesheets_with` 40/37wt incl − `write_utilities` 29/29wt
(filed repro1/2 callers) ⇒ recipe path ≈ 8–11wt incl (grouping sort + at-rules +
declarations + nest + escapes). The measured −13.05 exceeds the naive frame
share — expected, not alarming: ~10k eliminated malloc/free pairs lived in
allocator self-time (`nanov2_malloc`/`free` ≈ 160wt combined in repro1), not
under the recipe frames, so the diet's reach exceeds the recipe-frame weight.
The 8-pair below measures the whole-sync delta of exactly this change (trees
differ only by the diet, identical build flags).

## 3. Correctness

- (a) `pnpm agentrs c atomic`: **596 + 1 passed, 0 failed** (delta vs the
  set-3 594+1 base is exactly the 2 new pin tests, both green first run:
  hoisted-base end-to-end on a system-prefixed class incl. merged base rule +
  hover nesting + bucket order; `escaped_base_selector` literals incl. the
  leading-digit `.\32 xl\:card__base` and scoped `.\@scope\/pkg__card` cases +
  unconditioned passthrough). `pnpm agentrs q` on the 2 touched files:
  **0 code violations, 0 warnings**. Release build emits the same 18
  pre-existing warnings as set-3 (none on diet lines). Wrappers untouched →
  seam vitest not required (sysprefix/selpush precedent); styletrace not run
  (single-diet BANK, same precedent).
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (full 64-char sha256)
  base-vs-candidate on all four scales**:

| scale | styles.css (both arms) | runtime-data.mjs (both arms) | cssCalls |
| --- | --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` | `718d19e4…378918` | 7527 |
| small | `ecdec1e8…bda2973` | `ad9194f4…e994d41` | 171 |
| medium | `37f2ef5b…04819fe` | `54735e4d…08cfe7ce` | 635 |
| churn | `1aad4978…deb10ec05` | `e1349305…f70103f18cdb` | 43956 |

Full hashes match the wave-1 filed pins character-for-character (same seed,
same bytes; no `--seed` flag passed per the cloneplasma stream correction —
the pin stream is the default enterprise config).
- (c) Determinism: all 20 in-protocol enterprise kept outputs (4 warmups + 16
  pair runs, both arms) hash to exactly 2 distinct full hashes (1 css + 1
  data), both == sealed pins — plus the 2 count runs, 22/22 enterprise outputs
  at pins across all three binaries.

## 4. Enterprise A/B: 8 interleaved pairs, `.node` per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm, then pairs
alternating start arm (B/C, C/B, …). One lock hold for q+cargo+both
builds+A/B+identity (~25 min), released immediately after the last identity run.

Warmups (unscored): base 1249.22, 993.90; cand 1215.00, 1003.56. (First-run
warmup outliers on BOTH arms, absorbed by the 2-warmup discipline.)

| pair | base syncMs | cand syncMs | Δ ms (cand−base) |
| ---- | ----------- | ----------- | ---------------- |
| 1 (B,C) | 996.94 | 1008.93 | +11.99 |
| 2 (C,B) | 997.22 | 991.33 | −5.89 |
| 3 (B,C) | 1015.86 | 991.37 | −24.49 |
| 4 (C,B) | 1004.31 | 988.22 | −16.09 |
| 5 (B,C) | 995.98 | 991.59 | −4.39 |
| 6 (C,B) | 1010.52 | 1003.83 | −6.69 |
| 7 (B,C) | 1004.74 | 986.67 | −18.08 |
| 8 (C,B) | 1014.07 | 992.70 | −21.37 |

- base median: **1004.53 ms**; cand median: **991.48 ms**
- median Δ: **−13.05 ms (−1.30%)**, 7/8 pairs favor cand
- Excluding run 1: base median 1004.74, cand median 991.37, median Δ **−13.38 ms** — stands
- Median of per-pair deltas: **−11.39 ms** (all three estimators agree: −11…−13)
- No outliers on either arm (base tight at 996–1016, cand at 987–1009); box
  quiet, no foreign-spike signature (cf. intset2's screensharingd discards —
  zero discards here)

LAND bars (≥15 ms + ≥1.5%) miss on BOTH prongs (−13.05 < 15, −1.30% < 1.5%) →
BANK, not LAND. More pairs were considered and rejected: the verdict cannot
change (a second set either confirms BANK or, were it to clear 15 ms, would
still need its own fresh LAND proof — cascade precedent against lock-hogging
on a settled verdict).

Other scales, single samples each (directional only — identity hashes above are
the claim, times are not): small 89.51→90.03, medium 154.83→157.86, churn
2061.55→2078.07 (all within small-sample noise — explicitly disclaimed,
scalarjson-style; churn's single-sample direction against cand is noise, not a
signal — the enterprise 8-pair with 7/8 agreement is the timing evidence).

## 5. Caveats (honest)

- The −13.05 effect exceeds the naive per-escape mechanism guess (~1 ms from
  scan cost alone) — the bulk is allocator second-order effects (~10k
  malloc/free pairs eliminated, whose cost sits in allocator self-time, §2).
  The count it rests on is exact (9,057/10,484 eliminated, ×2 identical), and
  the 8-pair measures exactly this change — but the split between scan savings
  and allocator relief is unproven. Stated so no future wave over-attributes.
- Pair 1 favors base (+11.99) while pairs 2–8 all favor cand. No regime cause
  found (warmups were absorbed on both arms; no box event logged); ex-run-1
  stands stronger (−13.38), so the lone contrarian does not threaten the verdict.
- Two lock holds: census block (install + build:js + count build + 2 count
  runs) and verify block (q + cargo + base/cand builds + 4 warmups + 16 pairs
  + 6 cross-scale). No foreign-process interaction of any kind.
- `WARM-B1` (1249.2) / `WARM-C1` (1215.0) are first-run warmup outliers on
  fresh `.node` files, confined to unscored warmups, disclosed not discarded.

## 6. Collision (for the captain)

- TEXTUAL: diet touches `stylesheet/emitter/mod.rs` (hoist + 2 fns, one hunk
  region each) and `stylesheet/emitter/emitter_ordering_tests.rs` (+2 tests).
  NO overlap with sysprefix's PENDING set-4 patch (`name/mod.rs`,
  `name/escape.rs`, `cascade/mod.rs` — emitter not in its diff, verified from
  the filed report §6) — sequence-independent, composes cleanly. NO overlap
  with cloneplasma/authcss live grounds (resolve/builder/extract — this diet
  stays on the emitter side of the fence). `group_recipe_atoms`'s IndexMap
  entry shape and the sort comparator are byte-untouched — a future
  at-rules-key diet would compose underneath.
- BEHAVIORAL: output bytes identical by construction (same escape fn, same
  input, clone-then-untouched-nest); 4-scale byte-identity + 20/20
  determinism are the proof. No order/grouping/comparator changes (sortshape
  bar honored). STACKS with sysprefix's pending diet (disjoint layers —
  recipes vs utilities — no double-count, sysprefix §5 caveat honored).
- LEAD filed (not taken): `extract_at_rules` still allocates a `Vec<String>`
  per recipe atom (9,057×/sync, at-rule strings vary per atom so not hoistable
  by rule — needs a key-shape diet, e.g. borrowed-key grouping; IndexMap
  insertion order must be preserved). Out of this brief's selector scope.

## Verdict

**BANK (proven-identical recipe escape-once diet: 9,057 redundant whole-string
escapes + 10,484 String allocs/sync eliminated, ×2-identical census; 8-pair
median Δ −13.05 ms/−1.30%, 7/8, ex-run-1 −13.38, paired-median −11.39 — misses
both LAND prongs; byte-identical 4/4 scales + 20/20 determinism + 596+1 green
+ q 0 violations; stacks with sysprefix's pending set-4, zero order changes)**
