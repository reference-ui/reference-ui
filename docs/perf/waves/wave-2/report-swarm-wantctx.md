# REPORT: swarm-wantctx — `WantContext` borrow diet (lifetime-threaded session)

## Verdict

**BANK (whole-sync: median Δ −5.39 ms / −0.52%, 6/8 pairs favor, ex-run-1 −5.46, paired-median −4.92 — sub-bar on both LAND prongs as expected for a ≈3–5 ms diet; all three estimators agree inside the counted band; proven-identical: 4-scale full-sha byte-identity vs sealed pins + determinism + suites green + quality 0 violations)**

One line: threaded a borrow lifetime through `WantContext`/`ResolveSession` so the per-want condition stack is borrowed from the live want instead of deep-cloned (79,431 Box clones + 3,154 spill allocs per sync → zero), via a per-want-short inner session that composes underneath cloneplasma's landed R1 emit sites untouched.

## Base / binaries

- Brief pin `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` verified at start
  (`git rev-parse HEAD` equal, tree clean).
- intclone verdict OBSERVED = LAND (cloneplasma −26.65/−2.50% 7/8, authcss
  YIELDS 6/6 — single shape); captain landed it as `ddce131e7`.
  All 5 landed files verified bit-identical intclone == cloneplasma ==
  landed commit before rebasing.
- Verify base: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (clean).
- Base `.node` sha256: `d36e157c89af82a74263fef75d9c76e2125a4ebcc3daf8deb132e491cf9005e8`
  (`/tmp/swarm-wantctx-base.node`, stash-free file-dance build).
- Candidate `.node` sha256: `e2c78de31c962525e428e55453236159ecb16f67b0cc37bfb800a53cd27d2fdb`
  (`/tmp/swarm-wantctx-cand.node`; forced rebuild reproduces hash exactly).
- Census `.node` sha256: `5096f59dbce8d0e1…` (counts only, never timed).
- Binary discipline: 12-char sha-verified swap before every one of 30 runs
  (ab.sh/ident.sh refuse on mismatch); distinct arms; warnings 2/18 == 2/18.
- `git diff --stat` (vs ddce131e7): 7 diet files, +69/−44, plus this REPORT.

## Mechanism counts (enterprise pin-stream load)

Temporary env-gated dump (`SWARM_WANTCTX_DUMP`, 4 site tags, fully reverted
before any diet/timed build). Raw dumps at
`/tmp/swarm-wantctx-count{1,2,3}.err`: **179,808 lines ×3, byte-identical**
(sha `ed0faab3…`). Output bytes pin-exact all 3 runs (cssBytes 2,867,925 /
dataBytes 214,466 — instrumentation output-clean).

| site | count | split |
| --- | --- | --- |
| S1 `session.want` assigns (MINE) | 89,904 | == wants |
| S1 when-len hist | 0: 29,577 / 1: 44,377 / 2: 12,796 / 3: 3,154 | conditioned 60,327 |
| S1 `Box<str>` steps (MINE) | **79,431** | + 3,154 SmallVec spill allocs (len 3 > inline 2) |
| S3 eager `authored_key` builds (R1 ground, context only) | 89,904 builds / 79,431 steps | removed by landed R1, never mine |
| S3b Unknown-arm `key.clone` | 0 | dead on bench |
| S2 values.rs `$r`-refusal when-build | 0 | dead on bench |

Transfer proof (census ran on 3dd32a65, diet verified on ddce131e7): the S1
site (`resolve_want_with` :129-132) is byte-identical between the two — the
whole landed `resolve/mod.rs` verified identical to the intclone snapshot,
itself bit-identical to the landed commit on all 5 files. Entry count and
when stacks are load-determined; R1/R2 change neither. Census transfers by
construction.

Cross-validation (independent, same load): S1 histogram == cloneplasma's
want when-len split exactly; assignments == authcss/shorthand 89,904;
S3 keybuild count == cloneplasma's 89,904-built-0-used.

## The lifetime design (inner session — why, exactly)

Naive design (store `&want.when` in the long-lived session with a second
lifetime `ResolveSession<'a,'w>`) FAILS to compile, proven by attempting
it: the recipes path synthesizes wants mid-tree (`compile_responsive_variants`
resolves loop-local `scoped` clones through a session created two frames up
in `compile_recipes`). A stored borrow must satisfy the session's fixed `'w`
for *all* instantiations; a loop-local can satisfy none. Short borrows
cannot live in long slots (invariance forbids shrinking through `&mut`).

The landed design keeps the briefed pub-API lifetime but scopes the slot:

- `WantContext<'w> { when: &'w [Box<str>], important: bool }` (was owned
  SmallVec); `ResolveSession<'a,'w>` gains the second lifetime.
- `resolve_want_with` builds a **per-want-short inner session**: system /
  diagnostics / sink are reborrows (all reports land in the outer targets
  exactly as before), `location: want.location()` (same single clone as
  today), `want: Some(borrow of want.when)`. The existing body then runs
  verbatim against the inner session; the outer location is written back
  (`mem::take`, zero heap) on all three returns.
- `authored_key`: zero source change (elision absorbs; slice `to_vec` ==
  SmallVec `to_vec`). values.rs (cold) and the unit test pass `.as_slice()`
  over their existing owned SmallVecs — identical allocs there.
- 27 mechanical `ResolveSession<'_, '_>` annotations stay fully elided
  (nothing in the tree stores want-borrows, so no named relationships are
  needed anywhere); `SegmentExpander` gains `'w`; two over-width sigs
  wrapped per rustfmt.
- R1 emit sites compose-underneath: the unknown-prop arm, the
  `lower_conditions` Unknown arm, and `refuse_unrealizable_extension` are
  byte-untouched; the diet only prepends setup and appends writebacks.
- Observable-state delta: outer `session.want` stays `None` instead of
  `Some(last want)`. Proven unobserved — the sole in-crate reader is
  `want_key` during the call (verified on landed lines), and a
  workspace-wide audit finds zero post-return readers (bench/tests/
  integration construct but never read). Refusal keys are byte-identical:
  same inputs, same `to_vec`, `want` immutable mid-resolve (`&Want`, no
  interior mutability). Any downstream breakage would have been a revert
  trigger — none occurred (bench + full suites compile and pass).

Kills per sync: 79,431 Box allocs (+79,431 frees) + 3,154 spill allocs +
60,327 inline SmallVec memcpy-clones. Added work: one stack session struct
(~6 words) + 1 location move per want; zero heap.

## 8-pair A/B (verdict set, pin stream, base = clean ddce131e7)

Warmups (unscored): base 1163.09, 1032.36; cand 1035.66, 1020.22.
Interleaved pairs, alternating lead order. Bytes pin-exact on all 20 runs
(cssCalls 7527 throughout).

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1025.46 | 1025.36 | −0.10 | B,C |
| 2 | 1030.91 | 1034.49 | +3.58 | C,B |
| 3 | 1031.53 | 1027.00 | −4.53 | B,C |
| 4 | 1033.94 | 1049.49 | +15.55 | C,B |
| 5 | 1045.55 | 1025.32 | −20.23 | B,C |
| 6 | 1033.15 | 1027.84 | −5.31 | C,B |
| 7 | 1034.08 | 1028.48 | −5.60 | B,C |
| 8 | 1039.86 | 1028.69 | −11.17 | C,B |

- Base median 1033.55; cand median 1028.16; median Δ **−5.39 ms (−0.52%)**,
  **6/8 favor**.
- Ex-run-1: Δ **−5.46 ms** — stands. Paired-median: **−4.92**. All three
  estimators agree ≈ −5 ms, inside the counted band.
- P4c (1049.49) is a cand-side box spike and P5b (1045.55) a base-side
  spike — opposite arms, both documented noise shapes; medians robust.
  No lead/lag pattern (both orders favor cand across the set).

## Identity, determinism, suites, quality

4-scale byte-identity, base vs cand, both arms vs sealed pins (full 64-char):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Determinism: cand enterprise ×2 → both full-sha identical to the identity
cand run (2/2 pin-consistent).

- Suites: `cargo test -p atomic` **595 lib + 1 integration, 0 failed**
  (== landed baseline exactly, delta 0 — no new tests; borrow-correctness
  is compiler-proven). `vitest atomic` **300/301** with the identical
  single red as every filed report (ATM-SITE-54 `hasWant`, pre-existing).
  `cargo test -p styletrace` **31/18, failset byte-identical** to the
  same-worktree HEAD baseline (`cmp` clean; matches set-3/intclone filed
  31/18 hermetic_roots+tracing worktree-env failures).
- Quality: `pnpm agentrs q` on all 7 diet files — **0 violations,
  2 warnings**, both proven pre-existing (tokens/mod.rs 371 and
  recipes/mod.rs 454 lines, HEAD-identical lengths, net-zero diffs).
  Diet lines fmt-clean (remaining `fmt --check` hunks all pre-existing,
  incl. the known tests.rs:341 const).
- Build warnings: base 2/18 == cand 2/18 (virtualrs/atomic), zero new,
  zero on diet lines.

## Euclid-style mechanism proof

Removed per sync: 79,431 Box allocs + 79,431 paired frees + 3,154 spill
alloc/pairs + 60,327 inline SmallVec memcpy-clones (≈381 KB of step bytes
per cloneplasma's audit, no longer copied twice) + 89,904 Option-discriminant
stores replaced by pointer-width borrows. Added: one stack session + one
location move per want (no heap). At the measured tiny-alloc all-in cost
(~30–40 ns), the counted ceiling predicts ≈ 5–7 ms; the 8-pair measures
**−5.39 / −5.46 / −4.92** with all estimators inside the predicted band.
Q.E.D.

## Collision / race notes (for the captain)

- **intclone LAND (cloneplasma): REBASED ONTO.** Diet implemented and
  verified directly on the landed commit ddce131e7 (no stacking games —
  tree diffs cleanly against it). R1 lazy-key emit sites, R2 helper, B1,
  E1, U1, R3 all composed-underneath, byte-untouched.
- **authcss YIELDS:** nothing to compose (6/6 hunks subsumed per the filed
  adjudication; correct call — verified single-shape world before
  implementing).
- **Fences respected:** realloc scan-side + when guards (their files
  untouched), extract JsxHosts union, hashers exports exclusion, proof
  render, marshal codec, sortshape (zero emission-order changes — 4-scale
  full-sha identity proves it).
- Sequencing complied: census-first (x3 identical before any diet line),
  diet held for the intclone verdict, bench lock held only for the count
  block and the verify block (two-step releases, never killed foreign
  PIDs), LOG.md never written.
- Design evolution (for the record): the naive store-borrow-in-long-session
  design was attempted and fails borrowck on the recipes `scoped`-local
  path (E0597, universal-quantification trap); the inner-session design
  above is the sound fix — same borrow, correctly scoped slot. No
  `unsafe`, no `Rc`, no API shape change (one added lifetime only).
