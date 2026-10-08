# swarm-proof REPORT: live proof-render diet

## Mechanism (one)

Diag's landed partition skip killed only DEAD renders (analysis facts rendered
for an unrequested backchannel, then dropped). The LIVE proof join —
`Proof::collect` + `render_with` in `diagnostics/proof/render.rs` — still pays
per-exact serialization, per-exact dictionary lookups, per-exact tree probes,
and an expectation set nothing consults on quiet loads. This diet removes
exactly that waste, preserving every proof byte:

1. **Conditional expectation set.** `exact_set` is consulted only inside
   `render_rejects`, which iterates rejections. With zero rejections the loop
   is vacuous, so `collect` now builds the set (from the collected serials,
   same membership) only when rejections exist. On the seed-7 load: 35,426
   inserts + 35,426 clones + a 19,187-entry table gone.
2. **Distinct-key serialization memo** (new `proof/memo.rs`, ~100 lines +
   tests). 35,426 expectations over 19,187 distinct keys: duplicates reuse
   the earlier duplicate's stored bytes via canonical five-tuple equality
   (`SerialMemo` probe; hit clones the short stored string instead of
   re-serializing). Equality is the soundness load-bearing relation: equal
   memo keys MUST serialize to identical bytes — objects compare
   order-insensitively (the serializer sorts keys; `preserve_order` is on so
   insertion order varies), integers compare by value, floats by bits (the
   shortest-roundtrip printer maps bit patterns one-to-one onto spellings;
   int/float split first because `as_*` converts across it while spellings
   differ). Hash consistency is performance-only (a miss re-serializes the
   same bytes). 8 memo unit tests pin `memo_eq ⟺ byte-equal` on adversaries
   (reordered objects, 1 vs 1.0 vs "1" vs true vs null, -0.0, u64::MAX,
   nested/empty/unicode).
3. **Per-prop dictionary memo.** `is_known_style_prop` ran 35,426× over 46
   distinct props (5 wt). Memoized per session (`FxHashMap<&str, bool>`).
4. **Borrowed hash view over the emitted set.** Same membership answers as
   the `BTreeSet`, one hash per probe instead of a string-compare walk
   (the ~3 wt memcmp under `render_with`).

Slow path (rejections present) keeps today's exact behavior: the set builds
from the same serials, `render_rejects`/`is_explained`/`warned` are
untouched, decisions iterate in the same order over byte-identical strings.
No diagnostic content, wording, rule, order, or count changes on ANY input.

## Diff

Base: `810b8b5b47448b4b99b688d9c2fda94c3ec9658e` (`git rev-parse HEAD`
verified at start; tree clean).

```
.../modules/atomic/src/diagnostics/proof/memo.rs    | NEW (369 lines: ~120 code + tests/docs)
.../modules/atomic/src/diagnostics/proof/mod.rs     | 1 +
.../modules/atomic/src/diagnostics/proof/render.rs  | 122 +++++++++++++++----
2 tracked files + 1 new file + REPORT.md, no commits
```

`memo.rs` is untracked-new (`git diff` counts tracked only). Tree at close:
these + REPORT.md only; benchmark `reports/latest/*` side effects restored
to HEAD; aside `.node` files live in gitignored `dist/`.

Notes:

- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `build:js` once for harness resolution (gitignored, not in diff).
- Arm selection by copying aside `.node` files over the in-tree
  `dist` `.node` per run, sha256-verified before each run.
- Fully qualified `rustc_hash` paths in `render_causeless` keep this diff
  off the import block the pending hashers conversion touches (§Collision).
- `HashSet` (not `FxHashSet`) kept for `exact_set`/`warned` deliberately:
  the hasher choice is hashers' mechanism; this diet composes with it.

## Artifacts

- base `.node`: `02ac40a4be7e65016c5bf02d75f9964facb2352e9b37c65c66bfd786140b3445`
- cand `.node`: `9821ad2107ea7a429bb75a92ed269142fc663d08438746595c02e54ba61f2550`
- Harness never rebuilt mid-set: aside sha256s re-verified identical
  post-block (base `02ac40a4…`, cand `9821ad21…`); 20 pair/warmup runs +
  2 seam suites + 8 identity runs + 2 determinism runs in between, all via
  per-run `.node` swap with sha check before every run.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: PASS (580 + 1; incl. 8 new memo tests +
  2 new render tests: `duplicate_exact_with_reordered_object_keys_warns_once`,
  `duplicate_expected_keys_still_join_rejections`).
  `pnpm agentrs q` on the three touched files: 0 code violations,
  2 pre-existing-shape soft warnings (file length only: render.rs was
  already >365 at base; memo.rs tests push it 5 lines over).
- (b) Byte-identical outputs base vs cand on all four scales
  (cssCalls exact: 7527/171/635/43956; sha256 equality implies
  identical bytes/sizes):

| scale      | styles.css (sha256, both arms)                 | runtime-data.mjs (sha256, both arms)           |
| ---------- | ---------------------------------------------- | ---------------------------------------------- |
| enterprise | `7ec827fb…10dcea`                              | `718d19e4…8918`                                |
| small      | `ecdec1e8…a2973`                               | `ad9194f4…4d41`                                |
| medium     | `37f2ef5b…19fe`                               | `54735e4d…fe7ce`                               |
| churn      | `1aad4978…ec05`                               | `e1349305…8cdb`                                |

Full hashes: enterprise `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` /
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small `ecdec1e80f8e71a80402987c6d0e7eb06096c576da6a456ba2cd9b8b5bda2973` /
`ad9194f41181aaee96ab7105e17f707b64fd354cd61d4041b9f40972de994d41`;
medium `37f2ef5b43f8b7cb8f5646b7a6e92a66792919f9f627eb43374d0840d94819fe` /
`54735e4d5a51c56707bfd364523b8090e770fe471abd3d590f51b8a108cfe7ce`;
churn `1aad4978ffdc1ba1ee00dc159f860d1498ca97dcf4038e7bd6efa80deb10ec05` /
`e134930586eb56a5e284637a507f21084733c11a548c7412f9b1f70103f18cdb`.
(Cross-check: all 8 match diag's filed hashes exactly — the harness and
the load reproduce; the diet changes no output byte on any scale.)
- (c) Determinism: two further candidate enterprise runs produced
  hashes identical to each other and to the byte-identity pair
  (`7ec827fb…` / `718d19e4…`, cssCalls 7527 ×2).

## Proof preservation (beyond the quiet bench load)

The seed-7 bench load is diagnostics-quiet (census: 0 rejections,
0 pushed lines, 0 warnings), so preservation must be proven beyond it:

1. **Unit backstop through the new code.** All 11 proof render tests run
   through the diet (single code path — no fast/slow fork): rejection
   replacement, incidental-coverage drops, expectation-less keeps,
   causeless warn-once, spelling-divergence warn-once, hole/unknown
   silences, true/false refusals, plus the 2 new duplicate-exact tests.
   All green.
2. **Memo soundness pinned directly.** 8 `memo.rs` tests assert
   `memo_eq ⟺ lookup_key bytes equal` over adversarial pairs (object key
   order permutations incl. nested, scalar spelling splits, float bits,
   int/float split, tuple positions, 14-value all-pairs with hash
   agreement). The `1` vs `1.0` over-equality was caught by these tests
   during development and fixed (int/float split first).
3. **Full-corpus arm-swapped differential.** `cases.test.ts` compiles every
   ATM-* fixture with `logs: ['proof']` and diffs committed goldens
   including full `diagnostics.json` bytes. Ran `pnpm agentrs v atomic`
   once per arm (in-tree `.node` swapped, sha-verified): both arms
   300/301 pass with the SAME single failure, ATM-SITE-54 — the
   documented pre-existing failure (diag reproduced it on base too),
   with a byte-identical assertion block (`hasWant` wants assertion,
   `spec.ts:43`; only wall timestamps differ). 245 case tests incl. all
   diagnostics-bearing fixtures (ATM-DIAG-*, COND, SITE-57, …) pass
   identically on both arms, goldens byte-compared. No diagnostic fact,
   warning, or line altered on any input in the corpus.

## Mechanism counts (not just ms)

Enterprise proof census (kept seed-7 repo, real `sync()`, temporary
env-gated instrumentation, reverted before the diet):

- entry = `render_session_with_keys` (carried keys; `emitted_keys` never
  runs on this path — 0 flame samples confirmed)
- facts = 35,426, ALL `ExactLookupExpected` (0 resolve-keyed, 0 harvest,
  0 extract, 0 other); rejects = 0; emitted = 19,187
- diagnostics 0 → 0 → 0 → 0 across rejects/causeless/covered renders
- exacts = 35,426 over 19,187 distinct keys (45.8% duplicates),
  46 distinct props; adjacent-duplicate 11, adjacent-same-prop 835
  (run-caches useless — memo required)
- hole = 0, unknown = 0, covered = 35,426 (100% — zero warns)
- avg serialized key length 58 B
- sinks: 0 harvests, 0 funnels (collect builds two empty vecs)

Filed-flame cross-check (`enterprise-repro1`, compile scope):
`Proof::collect` 13 incl = `serialize_lookup_key` 10 + `String::clone` 2 +
hashbrown insert 1; `render_with` 12 incl = `is_known_style_prop` 5 +
memcmp-under-probe ~3 + `drop Proof` 3 + self 1. `Sinks::collect`,
`render_covered`, `emitted_keys`: 0 samples. `serialize_lookup_key` total
16 = proof 10 + `build_keyed` 6 (keys2's landed ground, untouched).

Ceiling math (fantasy 25 wt clears both prongs → build, no fast CUT):
conditional set ~2.5–3, memo ~3–3.5, prop memo ~4.5, hash view ~1,
drop/alloc tail ~1–2 (+ malloc self per the diag precedent) ≈ 12–15 ms
realistic — at the bar edge, must measure.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --json` per run (no
`--keep` for pairs). Sample = `scales[0].samples[0].syncMs` from
`reports/latest/result.json`. 2 unscored warmups per arm, then 8 pairs
alternating order (B/C, C/B, …) under one bench-lock hold, `.node`
sha-verified before each run.

Warmups (unscored): base 1127.48, 1135.32; cand 1119.21, 1125.93.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %    |
| ---- | ----------- | ----------- | ------ | ------ |
| 1    | 1135.08     | 1137.68     | +2.59  | +0.23% |
| 2    | 1123.31     | 1117.14     | −6.17  | −0.55% |
| 3    | 1127.78     | 1120.87     | −6.91  | −0.61% |
| 4    | 1132.71     | 1133.52     | +0.81  | +0.07% |
| 5    | 1127.83     | 1132.25     | +4.42  | +0.39% |
| 6    | 1137.14     | 1127.89     | −9.25  | −0.81% |
| 7    | 1133.48     | 1119.79     | −13.69 | −1.21% |
| 8    | 1127.52     | 1128.97     | +1.45  | +0.13% |

- base median: **1130.27 ms**; cand median: **1128.43 ms**
- median Δ: **−1.84 ms (−0.16%)**, 4 of 8 pairs favor candidate.
- Excluding pair 1: base med 1127.83, cand med 1127.89, Δ **+0.05 ms
  (+0.00%)** — the signal does not resolve outside run noise either way.
- Median per-pair delta: −2.68 ms.

Reading: the diet provably removes work (16,239 serialization calls,
35,426 set inserts + clones, 35,380 dictionary lookups per enterprise
sync by census), but the wall-clock delta sits below the noise floor on
this load (per-pair spread −13.7…+4.4; fresh-repo FS variance dominates).
The 25 wt flame ceiling overstated the addressable room at this sample
depth. No LAND signal; no regression signal either.

## Collision (§Collision)

- **hashers (banked, pending set-2, SAME FILE `render.rs`).** Their hunk is
  a pure hasher swap (`HashSet` → `FxHashSet` for `exact_set` + `warned` +
  import line); this diet removes/reduces WORK (conditional set, memo,
  prop memo, hash view). Different mechanisms — no race on the hypothesis.
  Textual overlap if both land: at most the `render_causeless` hunk window
  (their `warned` line vs this diet's surrounding lines) — semantically
  trivially composable (Fx `warned` + diet; Fx `exact_set` + conditional
  build). RECOMMENDED COMPOSITION: take both (fewer ops × faster ops).
  This patch deliberately keeps `HashSet` and off-import-block paths so
  each hunk applies with minimal conflict. No coordination occurred;
  first sound LAND wins per the race rule.
- **keys2 (LANDED).** Proof bytes flow through `serialize_lookup_key`,
  whose `build_keyed` share (6 wt) is keys2's landed ground — untouched.
  `serialize_lookup_key` itself untouched (scalarjson's banked fast path
  is adjacent, pending — this diet calls it FEWER times, never differently).
- **diag (LANDED, `channels/mod.rs` partition skip).** Different mechanism
  (dead-render skip at partition); this diet starts where it ends (live
  join). Cited, untouched.
- **Fences respected:** no touch of `analysis/` (re-seed #6, separate
  topic); no touch of `render_fact`/`render_expected` (gone, 0 samples).

## Verdict

**BANK (proven-identical diet, sub-bar solo: median Δ −1.8 ms / −0.16%, ex-run-1 +0.1 ms, 4/8 favor)**

Rules 1–3 for LAND are not met on size (≥15 ms + ≥1.5% required; measured
−1.8/−0.16% full, +0.1 ex-run-1). CUT is wrong: the diet provably removes
real work (census-counted) with byte-identical outputs on 4 scales,
determinism ×2, 580+1 cargo green, q zero violations, and full-corpus
arm-swapped parity (300/300 + 1 pre-existing identical). Per the standing
rule, sub-bar proven-identical diet BANKs into a combined set — this is
that shape: real removed work, zero behavior change, signal below the
enterprise noise floor solo. Recommended next: stack with hashers/set-2 in
a combined confirm, where the reduced op counts compound.
