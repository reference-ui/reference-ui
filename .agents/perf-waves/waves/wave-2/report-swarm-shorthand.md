# swarm-shorthand REPORT: `expand_shorthand` dispatch diet (single resolve + trio pre-filter)

## Mechanism (one)

`atomic::resolve::shorthands::expand_shorthand` runs per want (89,904 calls on
the seed-7 enterprise load, 100% full miss — census below) and every call paid
**5× `resolve_alias` + 1× `find_property`**: each of the four arms (pair, flex,
border, dimensional gate) re-resolved the same prop, and the border arm
additionally probed `native_longhands_for_prop` (itself a re-resolve plus a
~37 ns binary search). Flame: `expand_shorthand` 7wt r1 / 10wt r2 incl, self 0
— the cluster is pure dispatch-probe cost, and shorthand is 43% of all
`resolve_alias` calls and 98.7% of all longhands probes.

Fix, two halves of one dispatch diet (all inside `shorthands/*`, zero
`@generated` changes):

- **D1 — single-resolve hoist + shared longhands probe.** `expand_shorthand`
  resolves once; arms become `*_with_canon` / `*_with_parts` bodies off the
  resolved name. The one `find_property` probe is shared between the border
  and dimensional arms via `longhands_for_canon` (direct `find_property` plus
  the non-empty rule — sound because alias resolution is single-step: no
  alias target is itself an alias, pinned by contract test). Arm order and
  fall-through (flex-miss → border, border-body-None → dimensional) preserved
  exactly, including drift-robust fall-through where the old code fell through.
- **D2 — trio-owner pre-filter gating the probe** (wave-1 `maybe_alias`
  method). The border gate only needs the Width/Style/Color trio test, so
  `maybe_border_family` rejects provable non-members by name shape
  (`border*`/`outline*` prefixes, `columnRule`/`rowRule` exact) before any
  table probe. Members always pass, pinned by a table-derived contract test
  (12 trio owners enumerated live from `CANONICAL_PROPERTIES`); everything
  else falls through to the real probe, so no decision can change.

Deliberately untouched (dead on this load, filed as leads): border hit-path
allocs (`is_whole_value` lowercase, token double-lower, build clones —
0 tokenized expansions), trbl token-count pre-pass (3,964 single-token splits
stand), dimensional double-split threading (0 gate passes). Hit-path diet
would move 0 ms on seed-7; the live mechanism is the miss dispatch.

## Diff

Base: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (`git rev-parse HEAD`
verified at start; detached worktree, no commits).

```
.../atomic/src/resolve/shorthands/border.rs        | 28 ++++-
.../atomic/src/resolve/shorthands/dimensional.rs   | 11 +-
.../modules/atomic/src/resolve/shorthands/flex.rs  |  5 +
.../modules/atomic/src/resolve/shorthands/mod.rs   | 85 ++++++++++----
.../modules/atomic/src/resolve/shorthands/pair.rs  | 11 +-
.../modules/atomic/src/resolve/shorthands/tests.rs | 54 +++++++++
6 files changed, 175 insertions(+), 19 deletions(-)
```

Notes:

- All six files are hand-written (no `@generated` marker): the predicate
  lives atomic-side with table-derived contract tests instead of emitter
  derivation, so no emitter change and no regen-drift question arise. A regen
  that adds a trio owner or an alias chain fails loudly at `cargo test` time.
- Public arm signatures kept (`expand_border_shorthand` still serves the
  golden suite; flex/pair/dimensional wrappers thin over the new bodies).
- `dist/*.mjs` wrappers were missing in the fresh worktree; ran `build:js`
  once (gitignored, not in diff). Temp census (AtomicUsize hooks, fully
  reverted) and temp differential test (removed after its run) leave no
  trace — final tree diff is the six files above plus this REPORT.
- `runtime/lowerings::shape_steps` uses the same gates but runs once per
  prop at startup table-build, not per call — untouched, no sync cost.

## Artifacts

- base `.node`: `78af19b168dbc76d497db5e89793930e696c87ee6a998d1635e8f7225d92fc08`
- cand `.node`: `f9651af91b47243f91d71a285e54de5dc3942444c997c5595b02f48fad9e512d`
- Base built from the stashed (clean HEAD + untracked cfg(test)-only temp
  file, excluded from lib bytes) tree; stash round-trip verified
  byte-identical against a pre-stash `git diff` backup, pre-existing
  stashes untouched. Arm selection via `REFERENCE_UI_NATIVE_PATH` (loader's
  sole-candidate override, no rebuild interference).
- Harness never rebuilt mid-set: both `.node` sha256 verified identical
  before warmups and after determinism (asides + dist copy all match).

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: **573 passed, 0 failed** (570 pre-existing +
  3 new contract tests; temp differential removed after its green run —
  576 with it); `pnpm agentrs c canon` (untouched): 58 passed, 0 failed.
  `pnpm agentrs q` on the touched dir: **ALL 7 FILES PASSED**, zero code
  violations, zero warnings (one interim cognitive-21 warning on the first
  draft of `expand_scalar_shorthand` was fixed by splitting into
  `shared_longhands` / `expand_border_arm` / `expand_dimensional_arm`).
- (b) Byte-identical outputs base vs cand on all four scales (full sha256
  match; byte counts match the landed base exactly):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb0c0cf685…` (2,867,925 B) | `718d19e470176b97…` (214,466 B)   |
| small      | `ecdec1e80f8e71a8…` (92,651 B)    | `ad9194f41181aaee…` (91,030 B)    |
| medium     | `37f2ef5b43f8b7cb…` (348,780 B)   | `54735e4d5a51c567…` (110,241 B)   |
| churn      | `1aad4978ffdc1ba1…` (8,289,806 B) | `e134930586eb56a5…` (103,709 B)   |

  Hash prefixes match the wave-1 canon record on all four scales.

- (c) Determinism: candidate enterprise run twice → identical css+rtm hashes.

## Shorthand equivalence (table coverage, differential corpus, member contracts)

- **Differential corpus** (temporary test, since removed): **155,650 calls —
  every one of the 1,073 `CANONICAL_PROPERTIES` entries plus all 315 alias
  keys plus 27 unknown-name adversaries** (empties, `--custom`, vendors,
  padding/case variants), crossed with **110 authored values** (zero
  spellings, none/case, CSS-wide keywords × case, `var()` × case/shape,
  `borders.`/`outlines.` prefixes, border token orders/extras/repeats,
  dimensional 1–5 token counts incl. tab/newline separators, flex
  keywords/near-misses, NBSP/CR non-separators, unicode, paren adversaries,
  empty/whitespace-only, plus Number/Bool/Null/Token values) — **2,058 hit
  shapes, zero divergences old vs new.** Protocol: the embedded old copy
  first ran against the PRE-diet tree (155,650/0 — transcription check),
  then re-ran post-diet (155,650/0 — diet proof).
- **Allocation count** over the same corpus (counting global allocator,
  exact-name-filtered single-test run): old = **19,372**, new = **19,372**.
  The diet is a probe diet, honestly alloc-neutral: hit-path bodies are
  shared verbatim, dispatch probes allocate nothing either way.
- **Pre-filter static coverage**: 92 pass / **981 reject of 1,073 (91.4%)**
  skip the `find_property` probe; the 3 trbl props keep probing via the
  dimensional gate as designed.
- **Member-contract tests** (permanent, in `tests.rs`): `no_alias_chain_contract`
  (no alias target is itself an alias — the hoist's soundness invariant),
  `trio_prefilter_table_contract` (all 12 live-enumerated trio owners pass
  the filter; count pinned at 12 so regen drift fails loudly),
  `longhands_for_canon_matches_native_lookup` (shared probe agrees with
  `native_longhands_for_prop` on all 1,073 names + all 315 aliases).

## Mechanism counts (not just ms)

Temporary `AtomicUsize` census (fully reverted before the cand build),
bit-identical across 2 enterprise runs:

| count | value |
| --- | --- |
| `expand_shorthand` calls per sync | 89,904 (sole caller: `resolve_want_with`) |
| value shapes | 89,904 String / 0 Number / 0 other |
| pair hits / flex-canon / flex hits | **0 / 0 / 0** |
| border-family hits (any shape) | **0** (zero/tokenized/whole/none all 0) |
| dimensional trbl reached / tokens | 3,964 / 3,964 (= 1 token each, all) |
| dimensional gate passes (2–4 tok) | **0** |
| full-miss rate | **100%** — every call probes and returns None |
| shorthand `resolve_alias` calls | 449,520 = **43.0%** of canon-wide 1,044,624 |
| shorthand longhands probes | 89,904 = **98.7%** of canon-wide 91,063 |

Per-miss probes today: 5× `resolve_alias` + 1× `find_property` (≈78–111 ns
implied by the 7–10wt cluster over 89,904 calls — flame cross-checks). Diet:
1× `resolve_alias` + cheap gates + probe only for border*/outline*/*Rule/trbl
shapes (~8.6% statically). Eliminated per sync: 359,616 redundant resolves +
~82k of 89,904 binary-search probes.

Ceiling math: cluster is 7wt r1 / 10wt r2; realistic capture ≈ 6–8 ms —
below the ≥15 ms + ≥1.5% (≈16 ms) solo bar on both prongs → BANK-track, as
briefed. CUT was never in play: the mechanism is live (89,904 calls,
flame-attributed, census-quantified), not evaporated.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm first (base
1291.62, 1056.32; cand 1240.83, 1062.19 — first-run effect, then settled),
then 8 pairs alternating lead order. One hold for build+verify+pairs+identity,
released immediately after.

| pair | order | base syncMs | cand syncMs | Δ ms   | Δ %   |
| ---- | ----- | ----------- | ----------- | ------ | ----- |
| 1    | B,C   | 1111.67     | 1056.85     | −54.82 | −4.9% |
| 2    | C,B   | 1065.13     | 1059.14     | −5.99  | −0.6% |
| 3    | B,C   | 1059.24     | 1043.55     | −15.69 | −1.5% |
| 4    | C,B   | 1053.07     | 1046.65     | −6.42  | −0.6% |
| 5    | B,C   | 1060.99     | 1055.45     | −5.53  | −0.5% |
| 6    | C,B   | 1059.39     | 1049.06     | −10.33 | −1.0% |
| 7    | B,C   | 1055.65     | 1057.07     | +1.42  | +0.1% |
| 8    | C,B   | 1102.82     | 1052.93     | −49.89 | −4.5% |

- base median: **1060.19 ms**; cand median: **1054.19 ms**
- median Δ: **−6.00 ms (−0.57%)**, 7/8 pairs favor candidate.
- Excluding run 1: base 1059.39, cand 1052.93 → **−6.46 ms (−0.61%)** —
  verdict stands.
- Magnitude matches the mechanism: −6.0/−6.5 ms against the 7–10wt
  dispatch cluster at realistic capture.

Honest noise notes: the base arm is noisier (pairs 1 and 8 read 1111.7 and
1102.8 against a ~1053–1065 band; canon2 reported the same base-arm noise),
pair 7 inverts (+1.4). No lead/lag pattern (B-first vs C-first splits show no
ordering effect), direction consistent across medians, ex-run-1, and 7/8
pairs, and every mechanism count (359k resolves + ~82k probes eliminated,
91.4% static rejection, 0-div differential) points the same way.

Process notes: one claims timestamp ((02:05)) was hand-estimated; real clock
per `date` was ~01:45 — all timed runs themselves are machine-timestamped
and unaffected. No foreign processes touched; no lock contention (single
continuous hold, verified free before grab).

## §Collision (for the captain)

- **swarm-extend (resolve path, LIVE):** no textual overlap — my diff is
  `shorthands/*` only; I never touch `resolve_want_with`,
  `expand_or_passthrough`, or the `is_known_style_prop` pre-check. RACE RULE
  respected: stayed on the expansion side. Integration note: if extend ever
  threads an already-resolved canon down from the caller, my internal
  resolve becomes redundant-but-harmless (still correct); a follow-up could
  wire it through — not mine to do.
- **canon2's LANDED value-classify:** different functions (`values/*`,
  untouched) — cited, not relitigated. My canon contact is read-only use of
  `find_property` / `resolve_canonical_prop` / tables.
- **swarm-hashers' banked conversions:** different mechanism, no file
  overlap (theirs: recipe groups IndexMap etc.).
- **Filed leads (not pursued — one mechanism, no pivot):** D3 token-count
  pre-pass for the trbl gate (3,964 wasted 1-token splits); dimensional
  double-split threading for 2–4-token values (0 on this load); border
  hit-path alloc diet (all shapes 0 on this load).

## Verdict

**BANK (delta −6.0 ms / −0.57% full, −6.5 ms / −0.61% run-1-excluded, 7/8 favor; sub-bar proven-identical diet: 155,650-call 0-divergence differential + 4/4 byte-identity + 2/2 determinism + 573 green + q clean)**
