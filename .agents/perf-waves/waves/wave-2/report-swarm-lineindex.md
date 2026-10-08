# REPORT: swarm-lineindex — LineIndex query diet (ASCII-tail SWAR)

## Verdict

**BANK (whole-sync sub-bar but mechanism-proven: pooled-16 median Δ −2.90 ms, 10/16 favor, paired-median −6.61 bracketing the −4.42 ms function-A/B prediction; 4-scale sealed-pin byte-identity; all suites green; q 0 violations)**

One line: censused 82,582 per-want `LineIndex::line_col` queries ×3 byte-identical (all-ASCII tails, mean 149.2 B, zero order violations), resolving the true weight at ≈5.3 ms inside the flame's 2..9 band; killed 83% of it with a word-scanned ASCII-tail fast path in one function, zero build change, zero order change.

## Base / binaries

- Base commit: `3dd32a659715aeb17d5d04167d756fb7f5ce30c8` (verified `git rev-parse HEAD` before any work; post set-3 tip — all 12 landed diets cited, never redone: set-1 diag/canon2/cascade/parse/keys2, set-2 hashers/extract, set-3 collect/proof/selpush/shorthand/marshal).
- Base `.node` sha256: `daa64ba9224ba5457ab1eda9ec83c381f86e01348c4fe36e1963714f44046af8` (clean tip, asided `/tmp/swarm-lineindex-base.node`).
- Census `.node` sha256: `2b3a82970f3ad24459cccb5e12a687692746474ff0a0efcca9ac3a2507254d71` (counts only, never timed).
- Candidate `.node` sha256: `065b2bfe0376dda13b7b6316b93d7ee7e2f8fdb25a24c87fc4973d468c952b5e` (SWAR diet, verdict arm). A superseded flag-diet binary (`f2cb8a5d…`) timed set 1 only — disclosed below, not verdict.
- All three arm builds emit the same 18 pre-existing warnings; zero mention `site.rs` (recompile grep clean).
- `git diff --stat`: 1 diet file only (`diagnostics/site.rs`, +65/−1); untracked: this REPORT.md. Bench-report byproducts reverted.

## Census (pin stream, no --seed — counts-first gate)

Temporary env-gated dump (`SWARM_LINEINDEX_DUMP`, per-event stderr lines, 12 hunks across 4 files, fully reverted — `TEMP-CENSUS` greps zero). Raw dumps `/tmp/swarm-lineindex-count{1,2,3}.err`: **173,571 lines ×3, byte-identical** (sha `461632be…`).

| site | count | split |
| --- | --- | --- |
| indexed queries (`LineIndex::line_col`) | 82,582 | 100% from `push_want` (W); warn/info `span_position` (D) = **0** |
| synthesized wants (span NONE) | 0 | every push carries a span on this load |
| builds (`for_source`) | 7,967 | 8.44 MB source, 101,220 lines; **all 7,967 ASCII** |
| query tails | 82,582 | **all ASCII**; 12.32 MB total, mean **149.2 B**, max 844 B |
| monotonic order | 0 violations | first-after-build 7,967 (= B exactly), in-order 74,615 |
| rejects (past-end/non-boundary) | 0 | — |
| free `line_col` scans (O(offset)) | 440 | diagnostic paths only; flame-silent, surveyed-not-taken |
| join check (W/D→Q sequence) | 0 mismatches | census sound |

True-weight resolution: the flame read 9/5 self with 3a-oversample uncertainty (2..9 band). Count × unit = 82,582 × 64.30 ns = **5.31 ms** (hot-cache criterion at the censused tail shape) — inside the band, upper-middle. The census resolves the true weight; the diet is sized by this mechanism, not the delta.

Load sanity: cssCalls 7527, bundle bytes 2867925/214466 = sealed pins on all 3 census runs (instrumentation perturbed nothing).

## Shape audit (follow the census)

- **Lazy line/col — DEAD on audit.** `resolve_want_with` (`resolve/mod.rs:128`) reads `want.location()` for *every* want, and `line`/`column` are serialized Want wire fields. Deferral needs source text at resolve time + a contract break — out of scope for a BANK diet.
- **Monotonic-span resume — filler, not built.** Census confirms perfect order (0 violations), but resume saves only the `partition_point` (~13-line tables ≈ 3 ns of a 64 ns query ≈ 0.25 ms). Needs `&self`→cursor API surgery for sub-floor gain; the implemented diet leaves that residue honestly on the floor.
- **Per-file ASCII flag — BUILT, MEASURED, KILLED.** Folded `ascii &= …` into the build loop: +74% build cost (criterion `for_source` 13.23→23.06 µs — loop-carried dependency). Separate `is_ascii()` pass: +89% (24.99 µs — scalar here, no vectorization). Both eat ~1.5 ms of the win. Set 1 below timed the taxed shape (−2.89 med ≈ −4.85+1.46 predicted) and is disclosed filler.
- **ASCII-tail SWAR (SHIPPED).** Per-query word scan over the tail only: no build change, no struct change, ~10 ns/query all-in.

## The diet (1 file, +65/−1: 1 function + 1 helper + 2 tests)

`packages/reference-rs/modules/atomic/src/diagnostics/site.rs` (+61/−3):

- `LineIndex::line_col`: after the (unchanged) bounds/boundary checks and binary search, scan the tail bytes with `tail_is_ascii`; ASCII → `column = tail_bytes + 1` by arithmetic. High bit anywhere → the original `chars().len_utf16().sum()` walk, byte-identical code path.
- New `tail_is_ascii(&[u8])`: one `u64` AND per 8-byte word (early-exit), scalar remainder; alignment-safe copy (no unsafe, no unwrap).
- `for_source`: **byte-identical to tip** (extract crew's build ground untouched — queries only, per fence).
- Equivalence: ASCII tail ⟹ every byte is one char ⟹ one UTF-16 unit ⟹ column = len+1; boundary pre-check retained. Pinned by 2 new tests (every word position 0..24 + lengths 0..40; 8 ASCII edges + mixed fallthrough, offset-for-offset vs the `line_col` scan oracle) plus the pre-existing edge-shape/generated-text fuzz, which pass unchanged.

## Function-A/B (criterion, QoS-elevated, representative tail≈149 B instrument)

| arm | tail150 unit | checked-in short-tail | `for_source` (57 KB) |
| --- | --- | --- | --- |
| base | 64.30 ns | 11.19–11.56 ns | 13.23 µs |
| cand (SWAR) | **10.75 ns** | — | byte-identical code, no re-run needed |

Predicted whole-sync: (64.30 − 10.75) ns × 82,582 = **−4.42 ms**, zero added build work. (The temp tail150 bench + Cargo registration were created, run per arm, and deleted; tree holds only the diet.)

## Whole-sync A/B (verdict: SWAR diet, pin stream, interleaved, alternating order)

Warmups unscored (set 2: base 988.25/997.43, cand 1058.68 first-touch spike + 998.04; set 2b: base 1040.40 first-touch + 998.65, cand 1010.22/994.73 — spikes confined to warmups, disclosed).

Set 2 (final diet):

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1008.20 | 995.05 | −13.15 | B,C |
| 2 | 1009.52 | 994.13 | −15.39 | C,B |
| 3 | 1001.29 | 1007.05 | +5.76 | B,C |
| 4 | 997.16 | 1003.78 | +6.62 | C,B |
| 5 | 1010.31 | 1022.02 | +11.71 | B,C |
| 6 | 995.04 | 988.08 | −6.97 | C,B |
| 7 | 1001.56 | 987.14 | −14.42 | B,C |
| 8 | 1016.82 | 999.01 | −17.80 | C,B |

Med Δ **−7.85 ms, 5/8 favor**; paired-median −10.06; ex-run-1 −2.55. P5c (+11.71) slow-cand outlier.

Set 2b (same binaries, pooled to 16):

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1030.45 | 996.16 | −34.29 | B,C |
| 2 | 1016.23 | 1001.50 | −14.74 | C,B |
| 3 | 1016.26 | 1002.90 | −13.36 | B,C |
| 4 | 1000.65 | 1000.23 | −0.42 | C,B |
| 5 | 1003.45 | 1011.70 | +8.25 | B,C |
| 6 | 1003.99 | 1005.22 | +1.23 | C,B |
| 7 | 996.62 | 1002.85 | +6.23 | B,C |
| 8 | 1003.54 | 997.28 | −6.26 | C,B |

Med Δ −1.59, 5/8; paired-median −3.34; ex-run-1 −0.68. P1b (1030.45) slow-base outlier.

Pooled 16: base med 1003.76, cand med 1000.86, **med Δ −2.90 ms, 10/16 favor**; paired-median **−6.61**; ex-firsts −1.32 / paired −3.34. cssCalls 7527 + bundle bytes pin-exact on all 40 runs. Every estimator favorable; pooled median (−2.90) and pooled paired-median (−6.61) bracket the −4.42 mechanism prediction — box noise (±10–34 outliers) dominates any single read, the function-A/B is the precise measure.

Set 1 (superseded flag diet WITH +1.5 ms build tax — disclosed, non-verdict): med −2.89, 4/8, paired −1.09, ex1 −2.86, mirror outliers P3c +30.80 / P7b −58.19. Matches its taxed prediction (−4.85+1.46≈−3.4); the tax diagnosis is why set 1 does not pool.

## Identity, determinism, suites, quality

4-scale byte-identity, base vs cand, both arms vs sealed pins (full 64-char verified):

| scale | styles.css (both arms) | runtime-data.mjs (both arms) |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) ✓ pin | `718d19e4…378918` (214,466 B) ✓ pin |
| small | `ecdec1e8…bda2973` (92,651 B) ✓ pin | `ad9194f4…e994d41` (91,030 B) ✓ pin |
| medium | `37f2ef5b…04819fe` (348,780 B) ✓ pin | `54735e4d…08cfe7ce` (110,241 B) ✓ pin |
| churn | `1aad4978…deb10ec05` (8,289,806 B) ✓ pin | `e1349305…f70103f18cdb` (103,709 B) ✓ pin |

Determinism: **73/73** pin-consistent (8 full-sha identity + 65 bundle-byte-exact: 60 A/B + probe + keep + 3 census-output-exact).

- Suites: `cargo test -p atomic` **596 lib + 1 integration, 0 failed** (tip 594+1; delta exactly the 2 new tests, green by name). Vitest seam 300/301 — the 1 failure (ATM-SITE-54, a specifier-resolution case with zero position involvement) **fails identically on base, census, and cand binaries** (triple-proven pre-existing worktree-environmental). Styletrace **31/18 with failset byte-identical** to clean tip (`cmp` clean; all 18 the filed hermetic_roots/tracing env failures).
- Quality: `pnpm agentrs q` on the diet file — **0 violations, 1 warning** (file length 392 > 365 soft limit). Banked with justification: +65 lines are 41 test pins (every-position sweep + 8-edge equivalence) + 24 production (call-site fast path + 13-line helper + docs); splitting the cohesive 327-line site module for a soft limit is churn with zero functional gain (set-3 banked 6 length warnings on the same rationale).

## Euclid-style mechanism proof

Removed per query: UTF-8 char decode + `len_utf16` + sum over 149.2 mean tail bytes (12.32 MB total across 82,582 queries) → one AND per 8-byte word + arithmetic. Added: nothing (zero build change, zero allocs, zero new branches on the slow path). Counted ceiling: 82,582 × (64.30 − 10
...[truncated 1446 chars]