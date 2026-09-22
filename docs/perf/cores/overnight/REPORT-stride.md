# REPORT-stride: stride-squeeze — recover 787ms pace WITH stability

- Mission: strided shard assignment on the stabilized tree (`stabilize/cores-p0`).
- Base verified first: `/tmp/cores-int` on `stabilize/cores-p0 @ 494a35d65`,
  `git status` shows the uncommitted stabilization merge (10 M + 6 ??, same set
  at start and end), `grep Barrier phase_parallel.rs phase_walk.rs` empty.
- Verdict: **RECOVERED** — C median **762ms ≤ 787ms**, and C beats same-tick
  spike A (795.5ms) by 33.5ms with unanimous 8/8 round agreement.

## 1. Design: stride-1 shards, input-order commit

Contiguous ranges cluster heavy adjacent files on one lane; the three
rendezvous rounds per phase then force every lane to wait for that straggler
three times. Stride-1 spreads heavies evenly, minimizing the per-round max.
Commit order stays input-order at every site, so the assignment balances work
without moving output. `lanes.rs` caps/thresholds untouched; no new
`unsafe`, no `#[allow]` (grep clean); all work in `/tmp` worktrees.

`extract_parallel.rs`: `shard_ranges(len, w) -> Vec<(usize, usize)>` replaced
by `shard_strides(len, w) -> Vec<Vec<usize>>` — lane `k` owns `k, k+w, ...`;
empty lanes dropped; `workers == 0` returns empty (total, no panic).
`phase_parallel.rs`: `orchestrate`/`run_lane`/`stage_streamed` take
`&[usize]` shards; per-file slots still commit in input order
(`phase_commit::settle` untouched). `resolve_pool.rs`: shards resolve to
`(index, ResolvedWant)` pairs placed back by index (`debug_assert` exact
cover + `flatten`, no unwrap) so `assembly` still consumes input order.
`runtime/plan_pool.rs`: strided positions mapped through `work[]` into owned
per-lane index vecs; commit already by-index, order-safe unchanged.
`tests/parallel_panic.rs`: lane-map doc updated to strided ownership
(9 over 4 → `[0,4,8],[1,5],[2,6],[3,7]`); refs marker moved styling 4 → 5 so
it still names lane 1 (styling 4 is lane 0 under stride).

Determinism proof (in-tree): new `strided_widths_match_serial_bytes` sweeps
forced widths 1/2/3/8/16 over a 70-file fixture asserting byte-identical
stylesheet, portable sheet, atom count, and diagnostics vs the one-lane
baseline; `shard_strides_cover_edges` asserts exact cover plus `i % w == k`
membership. (The sweep lives in `parallel_panic.rs`, which pins lanes
per-thread via `compile_guarded`, keeping `extract_parallel.rs` at 356 lines
so `q` stays warning-free.)

## 2. Arms and binaries (all `/tmp`, never rebuilt mid-set)

| arm | worktree | tree | `.node` sha256 |
| --- | --- | --- | --- |
| A (spike) | `/tmp/cores-base` (detached `spike/cores-lanes`, pristine) | 787ms reference | `9dba06c3…b17b3e` |
| B (stabilized) | `/tmp/cores-b` (detached `494a35d65` + B binary) | stabilization as-is | `b90a7ec9…c6b6a` |
| C (stride) | `/tmp/cores-int` (`stabilize/cores-p0` + stride) | stabilization + stride | `eb3206e2…d5d7e0` |

A/B/C shas all differ. B ran from a pristine-JS worktree: stabilization and
stride are Rust-only (tracked non-`.rs` diff vs `494a35d65` is empty), so
pristine JS + B binary ≡ stabilized tree + B binary for bench behavior.
Asides + shas in `/tmp/asides/{A,B,C}.{node,sha256}`. Pre-set and post-set
in-worktree shas match the asides exactly. C rebuilt once after a test-only
move and reproduced its sha byte-identically (`eb3206e2…`), confirming
`#[cfg(test)]` code is absent from the release binary.

## 3. GATES (all in `/tmp/cores-int`, all via `pnpm agentrs`)

- `c atomic`: **656 passed, 0 failed** (643 + 1 + 7 + 5). Baseline 655; +1 is
  the new determinism sweep. GREEN.
- `v atomic`: **300/301**, sole red = pre-existing ATM-SITE-54
  (`expected false to be true`), byte-identical on pristine spike after its
  JS dist is built. (Fresh worktrees also show a harvest-census suite import
  error — `Cannot find package '@reference-ui/rust/namer'` — caused purely
  by missing `dist/*.mjs`; `build:js` resolves it identically pre/post, so
  the comparison is 300/301 vs 300/301.) Zero delta. GREEN.
- `q` on the 5 touched files: **0 violations, 0 warnings**. GREEN.
- rustc: 19 lib warnings = baseline 19, all in untouched `extract/`/`recipes/`
  files; none in touched files. GREEN.
- Goldens byte-identical: no golden files touched (`git status` clean for
  `goldens/` and `tests/` fixtures); `namer_goldens_are_fresh` green. GREEN.

## 4. Locked interleaved bench (seed 7, `pnpm agent run`, `MallocNanoZone` unset)

Lock `/tmp/swarm-bench-lock` (`mkdir` + `owner` + 3 `claims` lines), acquired
before warmups, two-step release after post-set sha verification
(1. claims removed, 2. owner removed + `rmdir`). 2 unscored warmups per arm,
then 8 rounds of A,B,C enterprise single-runs (`--scale enterprise --runs 1`,
3000 style + 12000 dead files, 7527 calls). Report collateral removed after
(`reports/494a35d65586/` in A/B worktrees, `latest/*` restored in C worktree).

Unscored warmups: A1 831/417.5, A2 808/422.0, B1 1230/354.9 (cold),
B2 857/357.6, C1 796/401.0, C2 828/390.0 (sync ms / peak HW MiB).

### Scored run table (sync ms / peak HW MiB)

| round | A sync | A HW | B sync | B HW | C sync | C HW | order |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 798 | 428.3 | 835 | 372.6 | 771 | 383.7 | C<A<B |
| 2 | 800 | 417.8 | 846 | 375.7 | 759 | 393.9 | C<A<B |
| 3 | 801 | 426.2 | 840 | 368.6 | 761 | 386.4 | C<A<B |
| 4 | 802 | 426.4 | 827 | 351.8 | 772 | 388.0 | C<A<B |
| 5 | 788 | 415.2 | 815 | 364.3 | 765 | 391.0 | C<A<B |
| 6 | 792 | 420.6 | 826 | 368.4 | 762 | 385.2 | C<A<B |
| 7 | 793 | 428.8 | 823 | 352.9 | 759 | 390.6 | C<A<B |
| 8 | 787 | 423.9 | 830 | 367.0 | 762 | 384.4 | C<A<B |

Medians (n=8): **A 795.5ms / 425.1 MiB, B 828.5ms / 367.7 MiB,
C 762.0ms / 387.2 MiB.** Ranges: A [787,802], B [815,846], C [759,772] —
no overlap between any pair; C's slowest (772) beats A's fastest (787).
Agreement: per-round order C<A<B in **8/8 rounds**. Min-win: C min 759 vs
A min 787 (Δ −28) and B min 815 (Δ −56).

## 5. Verdict: RECOVERED

C median 762ms ≤ 787ms. Same-tick control reframes the history: the spike
reference reproduces at 795.5ms (+1.1% over its 787 pin — machine/tick drift,
not regression), stabilization costs +33.0ms (+4.1% B/A), and striding swings
−66.5ms (C/B −8.0%) to land −33.5ms (−4.2%) ahead of the spike itself, at the
same 8-lane cap. Assignment, not lane count, was the gap: rendezvous
amplifies the slowest lane ×3 rounds, and stride-1 minimizes that max.

Memory: C 387.2 MiB sits between B 367.7 and A 425.1 — striding overlaps lane
peaks more than contiguous (+19.5 MiB vs B), but stays 37.9 MiB under spike.
The time/HW trade overwhelmingly favors C. No confounders left standing:
identical seeded repos, interleaved order, locked box, shas pinned pre/post.

## 6. What was NOT done

No `lanes.rs` cap/threshold retuning (untouched per mission), no pulled-chunk
cursor (stride-1 won outright; shared cursor state unjustified), no second
bench set, no push/commit/merge/stash. Shared-checkout footprint is this file
only; `/tmp/cores-int` still holds the uncommitted stabilization + stride
merge (10 M + 6 ??, same paths as received).
