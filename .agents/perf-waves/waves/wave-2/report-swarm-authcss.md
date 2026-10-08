# swarm-authcss REPORT: resolve happy-path alloc diet (lazy refusal key + collapse gate)

## Mechanism (one)

`authored_key` (≈10wt) and `css_value_from_authored` (≈11wt) share one cause:
per-want / per-pair allocations that the happy path drops or duplicates. The
census (below, ×2 byte-identical) shows the seed-7 enterprise load is 100%
happy-path — 89,904 wants, zero refusals of any kind — so every one of these
allocs is pure waste:

- **D-key — lazy refusal key** (`resolve/mod.rs`). `resolve_want_with` built
  `key_for_want` (key + `atom_value_to_json`) unconditionally per want but
  consumed it only on rejection (unknown prop / unknown condition). Census:
  89,904 builds, **zero** consumptions — 100% dropped. Now the key builds at
  the two emit sites; `lower_conditions` takes `&Want` and builds per unknown
  condition instead of cloning a speculative key. Fresh builds use identical
  inputs (`session.want`/`system`/`want` unchanged between the old build site
  and the emits), so refusal bytes are unchanged.
- **D-col — collapse gate** (`resolve/normalize.rs` + `resolve/unit.rs`).
  `from_string` ran every value through `collapse_whitespace` (alloc +
  char loop + rebox). Census: **100% of collapses are no-ops**. New
  `needs_collapse` byte gate (quotes / structural bytes / NEL-NBSP bytes /
  doubled spaces) clears identity strings to reuse the authored box as the
  collapsed form; `from_string` splits into gate + verbatim `from_collapsed`
  body. Soundness pinned by a 41-string differential contract test asserting
  both directions (cleared ⟺ collapse-identity), including NEL/NBSP,
  multibyte tails sharing their bytes (`ạ`), lone quotes, and every
  structural byte.
- **D-px — resolvefmt filler** (`resolve/unit.rs:116`, filed as actionable in
  `report-swarm-resolvefmt.md`): `{num_str}px` `format!` → exact-capacity
  push ×2. Inside this function's subtree; rides as sub-1ms filler, cited
  not claimed.

Deliberately untouched: `expand_shorthand` internals (swarm-shorthand's live
ground, fenced), `resolve_alias` miss path (dry), refusal-site `want_key`
calls (already emit-gated, zero on this load but live on others), rhythm /
token resolution (outside these two functions).

## Diff

Base: `0a5731681c2bca56578d80ed67934e3ea709593a` (verified at start and
close; no commits).

```
.../atomic/src/resolve/mod.rs       | 15 ++--
.../atomic/src/resolve/normalize.rs | 96 ++++++++++++++++++++++
.../atomic/src/resolve/unit.rs      | 32 ++++++--
3 files changed, 130 insertions(+), 13 deletions(-)
```

No public signature changes (`authored_key`, `want_key`,
`css_value_from_authored` untouched); `lower_conditions` (private) takes
`&Want`. Temp census (env-gated `eprintln`, fully reverted before the cand
build) leaves no trace — final tree is the three files above plus this
REPORT. Bench-report noise reverted.

## Artifacts

- base `.node`: `52b9db5a5f8323fb…` (clean-HEAD build, asided to
  `/tmp/swarm-authcss-base.node`)
- cand `.node`: `e76d0e8c7aa2d322…` (diet build, asided to
  `/tmp/swarm-authcss-cand.node`; in-tree rebuild after a whitespace-only
  fmt fix reproduces this hash exactly)
- count `.node` (instrumented, never timed): `36a89542791a73b1…`
- Arm selection via `REFERENCE_UI_NATIVE_PATH`; both asides + dist copy hash
  verified before warmups and after determinism.
- Census dumps: `/tmp/swarm-authcss-count{1,2}.err` (429,484 lines each,
  `cmp`-identical), aggregator `/tmp/swarm-authcss-agg.sh`.

## Mechanism counts (the whole case)

Env-gated per-call tags, bit-identical across 2 enterprise runs (7,527 css
calls; instrumentation output-clean: cssBytes 2,867,925 both runs):

| count | value |
| --- | --- |
| wants per sync | 89,904 (matches shorthand's 89,904 expansion calls) |
| want value shapes | 89,904 String / 0 Number / 0 other |
| want `when` lengths | 0: 29,577 / 1: 44,377 / 2: 12,796 / 3: 3,154 |
| `authored_key` builds | 89,904 — exactly == wants (line-133 site only) |
| key consumptions (all 10 use tags) | **0** — 100% built-then-dropped |
| `css_value_from_authored` pairs | 89,904 String / 0 Number / 0 Bool / 0 Null / 0 Token / 0 keyframe |
| collapse no-op rate | **100%** (89,904/89,904) |
| string outcomes | canonnum 20,036 / leg-pass 69,868 / all refusal arms **0** |
| legacy canon splits | N+bare 28,602 / N+color 41,266 (sums to leg-pass exactly) |

Eliminated per sync: 89,904 speculative keys (+ 89,904 JSON values),
89,904 collapse allocs + char loops, ~16k tiny `format!`s.

Ceiling math: ≈21wt fantasy for the pair; realistic capture is the happy-path
alloc volume minus the surviving byte scans. Measured −11.6 ms sits at ~55%
of fantasy — the scans and output allocs remain by design.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm first (base
1212.66, 1049.59; cand 1201.14, 1028.40 — first-run effect, then settled),
then 8 pairs alternating lead order. Bytes identical on all 20 runs
(2,867,925 / 214,466).

| pair | order | base syncMs | cand syncMs | Δ ms | Δ % |
| ---- | ----- | ----------- | ----------- | ---- | --- |
| 1 | B,C | 1032.45 | 1023.92 | −8.52 | −0.83% |
| 2 | C,B | 1052.81 | 1023.45 | −29.36 | −2.79% |
| 3 | B,C | 1037.74 | 1027.68 | −10.06 | −0.97% |
| 4 | C,B | 1034.00 | 1029.75 | −4.25 | −0.41% |
| 5 | B,C | 1033.53 | 1025.49 | −8.04 | −0.78% |
| 6 | C,B | 1043.06 | 1008.69 | −34.37 | −3.30% |
| 7 | B,C | 1034.86 | 1028.89 | −5.98 | −0.58% |
| 8 | C,B | 1042.10 | 1020.79 | −21.31 | −2.04% |

- base median: **1036.30 ms**; cand median: **1024.71 ms**
- median Δ: **−11.60 ms (−1.12%)**, **8/8** pairs favor candidate.
- Excluding run 1: base 1037.74, cand 1025.49 → **−12.26 ms (−1.18%)** —
  verdict stands.
- Median-of-deltas −9.29; no lead/lag pattern (B-first and C-first pairs
  both favor cand throughout).

Honest noise notes: pair deltas spread −4 to −34 (pairs 2/6 ride base-arm
peaks; shorthand reported the same base-arm noise). Direction is unanimous
(8/8) and both medians agree, but the point estimate sits below the ≥15 ms
LAND bar on the ms prong and below ≥1.5% on the pct prong → BANK, not LAND.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: **572 passed, 0 failed** (+1 harvest-pool;
  includes the new `needs_collapse_clears_only_identities` contract test).
  `pnpm agentrs v atomic`: **300/301** with the identical single red as both
  arms in every filed report (ATM-SITE-54 `hasWant`, pre-existing —
  marshal/diag/proof). `pnpm agentrs q` on the three diet files: **0 code
  violations, 0 warnings** (dir-wide: 2 pre-existing length warns in
  untouched `lexical.rs` / `tokens/mod.rs`). `rustfmt --check` clean on all
  touched code (one `tests.rs` reflow suggestion is pre-existing).
- (b) Byte-identity base vs cand on all four scales (full sha256 match;
  pins equal the filed wave-1/shorthand record exactly):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb0c0cf685…` (2,867,925 B) | `718d19e470176b97…` (214,466 B) |
| small | `ecdec1e80f8e71a8…` (92,651 B) | `ad9194f41181aaee…` (91,030 B) |
| medium | `37f2ef5b43f8b7cb…` (348,780 B) | `54735e4d5a51c567…` (110,241 B) |
| churn | `1aad4978ffdc1ba1…` (8,289,806 B) | `e134930586eb56a5…` (103,709 B) |

- (c) Determinism: cand enterprise ×2 → identical css+data hashes.

## Collision / scope notes (for the captain)

- **swarm-shorthand (BANKED, same bundle):** zero file overlap — my diff
  never enters `shorthands/*` or `expand_or_passthrough` dispatch. The two
  diets compose (theirs: miss-dispatch probes; mine: happy-path allocs).
  My census reproduces their load facts exactly (89,904 calls, all-String).
- **swarm-extend (resolve path, LIVE):** my `resolve_want_with` hunk is
  adjacent to their ground. Textual overlap risk is the `key_for_want` /
  `lower_conditions` region — integrate by keeping their flow change and
  re-applying lazy-key at the emit sites (mechanical).
- **swarm-resolvefmt (CUT, filler adopted):** D-px is their filed
  `unit_px` one-liner, taken verbatim in intent; ceiling credit stays
  theirs (~0.5–1 ms of my −11.6).
- **swarm-cloneplasma (LIVE, adjacent):** my diet removes ~270k allocs/sync
  (keys + JSON values + collapses) from their plasma pool — compose, don't
  double-count. No file overlap expected beyond `resolve/*` reads.
- Fences respected throughout: no emission-order change (keys/atoms
  untouched), no `expand_shorthand` contact, no marshal-seam contact.

## Verdict

**BANK (proven-identical combined diet: median Δ −11.60 ms / −1.12% full,
−12.26 ms / −1.18% run-1-excluded, 8/8 favor; sub-bar on both LAND prongs.
Mechanism: 89,904 speculative keys + 89,904 no-op collapses eliminated per
sync, census-quantified ×2 identical; 4/4 byte-identity + 2/2 determinism +
572+1 green + q 0v/0w)** — the sum-confirm resolves the contribution.
