# swarm-recipeproof REPORT: T1 recipepath re-proof (wave-3, in-composition)

## Verdict

**CUT (HELD→CUT): the banked direction reproduces in-composition (−12.67/−1.34%
6/8, ex-run-1 −13.38, paired-median −15.82 — all estimators agree), but the
contra explanation disqualifies the diet: its whole-sync delta is
allocator-regime lottery with demonstrated sign flips across three tips
(−13.05 → +5.42/+7.80 replicated → −12.67), all 2–10× above the ~1–3 ms
first-order mechanism ceiling. First-order work removal is intact (census ×2
identical); the ±5–13 ms swings are unattributable allocator second-order, the
diet's own banked caveat in both directions. Exact filler + bank conditions
below. Byte-identical 4/4 scales (full 64-char) + 28/28 determinism + 609+1+5
green + q 0 violations.**

## Base / grounding / artifacts

- Base pin: `854317417e3e4eeb712e9778d84cd8edbbeb7368` (verified first command;
  detached worktree checkout at pin; parent branch reference-system). Tree was
  clean at start; ends as REPORT + 2 diet files only (+60/−5, bit-exact
  `git apply` of the filed member patch — `git apply --check` clean, diff stat
  identical to the filed patch).
- Grounding (protocol citations): PERF-W2-RECIPEPATH (banked −13.05/−1.30% 7/8);
  INT-W2-SET4B (re-proof spec + contra evidence — read in full, this report is
  the specified in-composition arm); `report-swarm-recipepath.md` (member-alone
  bank + §5 allocator caveat); `report-swarm-repro3.md` T1 row + dry rooms
  (room 12–17 intact; T1 is the entire backlog); INT-W2-SET4 (LOO contras
  +5.42 2/8 and +7.80 1/8, all estimators positive both sets); INT-W2-SET5
  (FULL −17.37 8/8, zero-contra LOO — the relieved allocator composes cleanly
  for every other diet).
- Fences honored: sysprefix shared-escape counts composed, never double-counted
  (recipe vs utilities layers disjoint — recipepath crew closed 23,505 + 4,394
  = 27,899); the `extract_at_rules` lead stays CUT per PERF-W2-ATRULES (dead,
  not revived); no second hypothesis; serial single-threaded only.
- Binaries (asided `/tmp/recipeproof/arms/`, never rebuilt mid-set):
  base `e7917b9d…` (8,889,408 B), cand `86df3e3f…` (8,886,632 B, −2,776 B —
  directionally consistent with removed escape/format machinery),
  count `3416c976…` (8,793,600 B). All three shas distinct.
- Stream discipline: **every run is pin-stream (no `--seed` flag)**; 2 unscored
  warmups per arm; 8 interleaved pairs alternating start arm. One lock hold
  (install + build:js + q + cargo + census + 3 builds + 20 timed + 6 identity),
  two-step release. No `git stash` anywhere (file asides only); reports/latest
  reverted after every block.

## 1. Mechanism counts (seed-7 enterprise load, THIS tip)

Temporary `AtomicUsize` census on the tip tree (emitter/mod.rs only, env-gated
`eprintln`; stderr inherited through the bench child, stdout JSON pure). Fully
reverted before the cand build (tree + cand binary `grep -c` = 0). Both runs
byte-identical across all 7 counters:

| count | run 1 | run 2 | banked (3dd32a6) |
| --- | --- | --- | --- |
| `group_recipe_atoms` calls (rules) | 1,427 | 1,427 | 1,427 ✓ |
| `recipe_selector` calls (recipe atoms) | 9,057 | 9,057 | 9,057 ✓ |
| atoms w/ selector conditions / nest steps | 2,233 / 2,859 | 2,233 / 2,859 | 2,233 / 2,859 ✓ |
| class_name bytes (per-rule sum / mean) | 47,941 / 33.6 | 47,941 / 33.6 | 304,100 / 33.6 (per-atom-weighted; same load, different counter seat — mean identical ✓) |
| non-ident bytes (escape slow-path takes) | 0 | 0 | 0 ✓ |
| `append_recipes_layer` emissions/sync | 1 | 1 | 1 ✓ |

Eliminated work per sync on this tip: **9,057 whole-string escape scans**
(9,057 per-atom + 1,427 rule-dup → 1,427 once-per-rule) and **10,484 String
allocs** (old 2×9,057 + 2×1,427 = 20,968 → new 1,427 + 9,057 = 10,484).
Replacement per atom: one ~34 B clone-memcpy. First-order removal INTACT —
the composition does NOT go contra at the work-removal site.

Mechanism ceiling (the isolation's hard number): 9,057 ident-body escapes over
~34 B strings ≈ 304 KB run-memcpy ≈ 0.02 ms at 20 GB/s, plus ~9k call/cursor
setups ≈ 0.2–0.5 ms; 10,484 allocs on the relieved allocator ≈ 1–2% of sync
malloc traffic ≈ ~1 ms (malloc self 60–73 per repro3 4a/b). **Total first-order
≈ 1–3 ms, below the noise floor.** Nothing above ~3 ms in EITHER direction is
attributable to this diet's mechanism — the crew's own §5 caveat ("the bulk is
allocator second-order") as a two-sided bound.

## 2. Correctness

- `pnpm agentrs c atomic`: diet **609 + 1 + 5, 0 failed** vs tip **607 + 1 + 5**
  (file-aside compared) — delta exactly the 2 carried-over pins, each green by
  name: `hoisted_base_matches_whole_string_path_on_system_prefixed_class`,
  `escaped_base_pins_leading_digit_and_scope_chars`. Zero other movement.
- styletrace (`cargo -p styletrace`, file-aside compared): **31 passed /
  18 failed on BOTH arms, per-test lists `cmp`-identical** (all 18 the
  pre-existing worktree-env failures in `hermetic_roots` + `tracing`, matching
  the filed 31/18). Zero new reds.
- `pnpm agentrs q` on both diet files: **0 violations, 0 warnings**. Release
  builds emit 19 warnings on BOTH arms (tip-pre-existing on 8543174 — set-5
  added one vs set-3's 18; the diet adds zero).
- No N-API seam change (emitter internals only) — one `build:js` for the block;
  seam vitest not required per the sysprefix/selpush precedent.

## 3. In-composition A/B: 8 interleaved pairs, `.node` per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. cssCalls 7527 and bundle bytes 2,867,925 /
214,466 on all 20 enterprise runs. sha256 of BOTH asides verified before AND
after every run (40/40 `ok`; harness aborts on mismatch; 3/3 asides re-verified
after the block). Arm selection via `REFERENCE_UI_NATIVE_PATH` sole-candidate
override; override+rebuild fidelity proven by the count binary (census lines
appeared only under it). Both builds printed `Compiling atomic` + `Finished
release` (genuine rebuilds — a stale reuse would skip compilation).

Warmups (unscored): base 1122.13, 942.59; cand 1114.76, 942.19 (first-touch
spikes on BOTH arms, absorbed by the 2-warmup discipline).

| pair | base syncMs | cand syncMs | Δ ms | Δ % | order |
| --- | --- | --- | --- | --- | --- |
| 1 | 945.95 | 944.34 | −1.61 | −0.17% | B,C |
| 2 | 950.71 | 933.99 | −16.72 | −1.76% | C,B |
| 3 | 941.68 | 922.83 | −18.84 | −2.00% | B,C |
| 4 | 946.91 | 931.99 | −14.92 | −1.58% | C,B |
| 5 | 945.37 | 913.36 | −32.01 | −3.39% | B,C |
| 6 | 923.98 | 936.92 | +12.94 | +1.40% | C,B |
| 7 | 924.98 | 935.41 | +10.43 | +1.13% | B,C |
| 8 | 948.19 | 928.15 | −20.05 | −2.11% | C,B |

- Base median 945.66; cand median 932.99; median Δ **−12.67 ms (−1.34%)**,
  **6/8 favor**. Both orders split 3/4 — no start-arm artifact.
- Ex-run-1: base 945.37, cand 931.99, Δ **−13.38 ms** — stands (exactly the
  banked ex-run-1, to the cent).
- Median of pair deltas: **−15.82**. All three estimators agree (−12.67 /
  −13.38 / −15.82), bracketing the banked triple (−13.05 / −13.38 / −11.39).
- LAND bars (≥15 ms + ≥1.5%) miss on BOTH prongs → BANK track at best, as
  briefed. No second set per protocol (verdict stands ex-run-1; §5 shows a
  second set cannot change the verdict — the effect is lottery either way).
- Zero sets discarded. Box disclosed quiet (lod ≈ 2, no hogs; empty worker
  stderrs; no foreign-PID contact of any kind).

## 4. Byte-identity + determinism

Full 64-char sha256 verified character-for-character on ALL four scales
(exceeding the crew protocol of full-on-enterprise + affix elsewhere), both
arms vs each other and vs the sealed wave-1 pins:

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…d94819fe` (348,780 B) ✓ pin | `54735e4d…8cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…b10ec05` (8,289,806 B) ✓ pin | `e1349305…03f18cdb` (103,709 B) ✓ pin |

Full strings: ent css
`7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` / data
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`;
small css `ecdec1e80f8e71a80402987c6d0e7eb06096c576da6a456ba2cd9b8b5bda2973` /
data `ad9194f41181aaee96ab7105e17f707b64fd354cd61d4041b9f40972de994d41`; medium
css `37f2ef5b43f8b7cb8f5646b7a6e92a66792919f9f627eb43374d0840d94819fe` / data
`54735e4d5a51c56707bfd364523b8090e770fe471abd3d590f51b8a108cfe7ce` (matches the
diag-filed full pin exactly — intset4's `…04819fe` suffix was a crew typo);
churn css `1aad4978ffdc1ba1ee00dc159f860d1498ca97dcf4038e7bd6efa80deb10ec05` /
data `e134930586eb56a5e284637a507f21084733c11a548c7412f9b1f70103f18cdb`.
Cross-scale single-sample syncMs (directional, disclaimed): small 87.3→86.2,
medium 148.2→149.6, churn 1818.7→1809.1.

Determinism: all 28 timed outputs (20 enterprise + 2 count + 6 cross-scale)
hash to exactly the sealed pins per scale — 28/28, zero non-ok. Sortshape bar
honored (comparator, grouping keys, buckets untouched — diet is pre-sort
construction only).

## 5. Contra explanation (the mechanism isolation)

The re-proof spec demanded in-composition evidence or a mechanism isolation of
where the composition goes contra. Both are filed: the 8-pair above, plus this
three-tip isolation. Whole-sync reads of the IDENTICAL diet patch:

| tip | composition | median Δ | pairs | estimators |
| --- | --- | --- | --- | --- |
| 3dd32a65 (bank) | pre-cloneplasma | −13.05 (−1.30%) | 7/8 | −13.05 / −13.38 / −11.39 |
| ddce131e7 (INT-W2-SET4 LOO ×2) | +cloneplasma | **+5.42**, **+7.80** | 2/8, 1/8 | all positive BOTH sets |
| 8543174 (this re-proof) | +set-4sub +set-5 | −12.67 (−1.34%) | 6/8 | −12.67 / −13.38 / −15.82 |

Plus INT-W2-SET4B: SUBSET6-without-recipepath −19.25/8/8 beat FULL-with-it
−14.07/6/8 on ddce131e7 — recipepath harmful in composition there.

The sign flips NON-monotonically across tips (− → + → −), with allocator-regime
changes at exactly the flip boundaries: cloneplasma's volume kills between the
bank and the LOO contras (malloc/free relieved), set-4sub + set-5 between the
contras and this read (malloc/free down further per repro3 4a/b, plus set-5's
+8/+10 diffuse memmove second-order offset). Against the §1 ceiling (~1–3 ms
first-order), NONE of the three stable reads is attributable to the mechanism —
all four 8-pair sets (2 each way) measure allocator second-order, i.e. the
diet's own banked caveat firing in both directions. INT-W2-SET5's zero-contra
LOO shows every OTHER diet composes stably on the relieved allocator;
recipepath's banked win WAS the relieved pool. Set-count symmetry (2 sets −13,
2 sets +5/+8) + ceiling violation in both directions + regime flips at every
boundary = allocator lottery, not a stable win. A second set here is moot:
−13 again would still be lottery (ddce131e7's replicated +5/+8 stands), and +8
again would only confirm it. An `alloc-trace` per-arm malloc census was
considered and refused as uninformative (the 10,484-alloc removal is
arithmetically certain from the census; a malloc total cannot separate
first-order from lottery — the intset4b refused-probe precedent).

## 6. Filler (exact) + bank conditions

- Filler: the counted first-order work — 9,057 redundant whole-string escapes
  (~304 KB ident-body memcpy + call overhead ≈ 0.3–0.6 ms) + 10,484 String
  allocs (≈ ~1 ms on the relieved allocator). Ceiling ≈ 1–3 ms, sub-noise,
  sign-unstable in composition. Carried as filler, not a diet.
- Bank conditions (falsifiable, for any future crew): (a) a load shape where
  recipe escapes are first-order expensive — non-ident class-name bytes forcing
  slow-path takes (this load: 0/47,941; all run-memcpy); or (b) an
  allocator-pressure regime where 10k-alloc removal is valuable AND the sign
  reproduces across ≥2 compositions on the same tip. Absent (a) or (b), the
  patch stays CUT — its member patch remains filed at
  `docs/perf/waves/wave-2/recipepath.patch` for exact re-application.

## 7. Caveats (honest)

- Box variance was higher than intset4's sets (cand 913–944, base 924–951;
  P5b 913.36 fast outlier, P6b/P7a fast-base mirrors). Medians are robust:
  dropping P5 entirely still reads −11.96; both orders split 3/4; ex-run-1
  stands; nothing was discarded or cherry-picked.
- One work process slip, disclosed: a styletrace rerun executed under the wrong
  workdir compared tip-vs-tip; caught immediately (cp errors in the same
  command), discarded, redone correctly — the filed 31/18 `cmp`-identical
  comparison is diet-vs-tip.
- This report reproduces the banked direction almost exactly (median within
  0.4 ms, ex-run-1 exact) yet cuts the diet. That is the correct shape of this
  outcome: the re-proof spec's second prong (explain the contras) is satisfied
  by proof that the effect is unattributable, and banking an unattributable
  ±13 ms swing would poison every future sum it entered.

## Verdict

**CUT (HELD→CUT: in-composition banked-direction reproduction −12.67/−1.34%
6/8, ex-run-1 −13.38, paired-median −15.82 with full proof — but the contra
explanation (three-tip sign lottery −13.05 → +5.42/+7.80 → −12.67 against a
~1–3 ms mechanism ceiling, allocator-regime flips at every boundary, 2-sets
each way) proves no stable attributable win exists; 4-scale byte-identity on
full hashes + 28/28 determinism + suites delta exactly the 2 pins + styletrace
31/18 identical + q 0v/0w; exact filler + bank conditions filed above; tree =
2 diet files + REPORT, pin OK, no commits)**
