# REPORT-backfill: kill the 17ms backfill readdir inside compile (CORES §3.6 / S2.3)

Mission backfill-slice, lever 1 (scan-completeness contract). Base pin
`a9db6f16f7210dc2e4add4f6f945ab6df599846a`, verified in-worktree before any
edit. Worktree `/tmp/cores-backfill` (detached, uncommitted diet). No pushes,
commits, merges, or stashes. Perf index: 0 entries for backfill (104 entries,
built 2026-09-22) — clean ground.

**Verdict: LAND.** Enterprise sync −17.6ms (−2.12%) median over a locked
interleaved 8-pair A/B, standing ex-run-1 (−15.8ms/−1.90%), 8/8 wins in both
arm orders, bundle bytes exact at all scales plus churn, all gates green or
proven pre-existing.

## 1. Design

### The walk

On the retention-token path, `collect_drained` (`sources.rs`) runs
`backfill_dir` over the whole root — a second full readdir walk *inside
compile* (~17ms: `__getdirentries64`, path joins, per-directory sorts) that
reads zero files when retention is complete. The walk exists to union-fill
files the scan's enumeration "missed".

### The contract (lever 1)

The scan now reports walk-completeness, and compile skips the backfill **by
contract** only when all three hold:

1. **Flag.** The enumerator asserts it walked every in-scope path
   (`walkComplete`, stored with the retention). Asserted only by the
   agreed-subset check below; direct N-API callers default to false and keep
   the walk.
2. **Scope.** The stored include list equals the compile request's include
   list element-for-element (`None` normalizes to `[]`). A scope the scan
   did not cover keeps the walk.
3. **Root.** The stored scan cwd equals the compile root under the scope's
   own candidate normalization (slashes, `./` prefixes, trailing slashes).
   A root the scan did not cover keeps the walk (union semantics preserved).

Skip or walk, sources are path-sorted after collection, so order is identical
when the walk would have found nothing — and when it would have found
something, the contract does not fire.

### The agreed subset (TS check `isCompleteWalkInclude`)

fg enumeration covers every natively scope-matched file iff the include
avoids every probed divergence between fast-glob/micromatch and the native
matcher. Pattern body after stripping one leading `!` must satisfy:

- G1 no `(` or `)` (extglob/groups: native-literal vs fg-operator)
- G2 no `|` (bare alternation splits in fg, literal natively)
- G3 no `\` (escape-vs-separator, unprobed on Windows → fallback)
- G4 no `[:` (POSIX `[[:name:]]` classes; plain classes agree)
- G5 no `***`, and every `**` a full `/`-delimited segment (adjacent stars
  cross directories natively, read as plain stars by fg)
- G6 no `..` at brace depth ≥ 1 (`{1..3}` ranges expand in fg only)
- G7 every `{` has a later `}` (lone `{` matches nothing in fg)
- G8 `!` only as the first char, never doubled (`!!` double-negates in fg)
- G9 no trailing `/` (fg returns dirs-only/nothing, native trims)
- G10 no leading `/` (absolute patterns, conservatively rejected)

List level: ≥1 pattern, ≥1 positive (negation-only has no fg base and mints
no token anyway), and exclude empty or exactly `RETENTION_EXCLUDE`
(node_modules prune ≡ native skip; anything else falls back).

Safe-by-over-enumeration (no rule needed, probed): dot segments (`src/./a`,
`src/../src/a` — fg normalizes, native matches nothing) and case-variant
roots on insensitive filesystems (fg over-matches, native matches nothing).
Rejection is always correct (status-quo walk); assertion is what the
differential battery proves.

### Observability (the counter)

- `BackfillOutcome::{Skipped, Walked, Legacy}` per token-path compile, pinned
  by tests (the per-compile walk counter reads 0 on skip). No wire change:
  the slim result is untouched, goldens unaffected.
- `BACKFILL_WALKS` process counter (`AtomicU64`, one op per completed walk),
  asserted monotone (`>= 1`) on the walk arm. The zero direction pins via
  the outcome (deterministic under parallel harnesses; a global exact-zero
  assert would flake).
- End-to-end firing is pinned behaviorally: a file created after a complete
  scan stays invisible on the skip arm and appears on the walk control.

### Snapshot doctrine (the one behavior change)

Today the snapshot is incoherent: listed files compile at scan-time bytes
(X3 pins rewrite/deletion invisible) while unlisted files compile at
compile-time (backfill finds post-scan creations). The diet makes it
coherent: **compile sees the tree as of scan.** Post-scan creation joins
rewrite/deletion invisibility — pinned by test, disclosed here. Impact:
one-shot builds (static tree) unaffected; watch mode self-heals on the next
sync; only a file created mid-sync in a settled single build resolves one
sync later. Same race class as the lane-c d_type ruling.

### Files (9 modified + 3 new, worktree only)

- `reference-rs/modules/atomic/src/scan/mod.rs`: `ScanRequest` +=
  `walk_complete`, `include`; mint takes the request.
- `reference-rs/modules/atomic/src/scan/store.rs`: `Retention` carries the
  contract; `drain` returns `DrainedRetention` (bytes + flag + cwd + scope).
- `reference-rs/modules/atomic/src/sources.rs`: contract check, skip branch,
  `BackfillOutcome`, `BACKFILL_WALKS`, 12 unit tests.
- `reference-rs/modules/atomic/src/lib.rs`: destructure (wire unchanged).
- `reference-rs/modules/atomic/src/includes/mod.rs`: `normalize_candidate`
  shared with the root check (1 word).
- `reference-rs/modules/atomic/js/types.ts`: `ScanRequest` +=
  `walkComplete?`, `include?` (types only).
- `reference-neo/src/fragments/lib/scanner-native.ts`: agreed-subset check,
  passed to native scan with the include list.
- `reference-neo/src/fragments/base/scan-native-helpers.ts`: test-seam
  fields (`walkComplete?`, `include?`, want `file?`).
- `reference-rs/modules/atomic/tests/scan_retention.rs`: shape updates only
  (still pins the kept-walk arm).
- NEW `reference-rs/modules/atomic/tests/backfill_skip.rs`: cargo skip parity.
- NEW `reference-neo/.../lib/scanner-native.test.ts`: check units (43 accept
  / 21 reject) + committed fg⊇native differential over all 43 asserts.
- NEW `reference-neo/.../base/scan-native-completeness.test.ts`: 8
  end-to-end tests (identity, race, exotic, scope/root mismatch, edges).

## 2. Breakage table (what could break, why it does not)

| Threat | Disposition | Proof |
| --- | --- | --- |
| Extglob scope (`a+(b)`, `@(a\|b)`) — the voyage lane-c kill | Check rejects (G1); walk kept | Probe FAIL→reject; e2e test: literal file found, fg-hit dropped |
| Negation-only include (fg `[]`, native all-minus-neg) | Check rejects (no positive); empty retention → legacy disk scan anyway | Probe FAIL→reject; unit test |
| `!!` double negation | Check rejects (G8) | Probe FAIL→reject; unit test |
| Adjacent `**` (`**.ts`, `a**b`, `**a`, `a**`) | Check rejects (G5) | Probe FAIL→reject; unit tests |
| Tripled+ stars (`***/`) | Check rejects (G5) | Probe FAIL→reject; unit test |
| Brace ranges (`{1..3}`) vs literal file | Check rejects (G6) | Probe FAIL→reject; unit test |
| Lone `{` (native-literal vs fg-nothing) | Check rejects (G7) | Probe FAIL→reject; unit test |
| Bare `|` alternation | Check rejects (G2) | Probe FAIL→reject; unit test |
| POSIX `[[:alpha:]]` classes | Check rejects (G4); plain classes agree and assert | Probe PASS-over + reject rule; unit + differential |
| Trailing `/`, leading `/`, backslash | Check rejects (G9/G10/G3) | Probe FAIL→reject; unit tests |
| Negative with exotic body (`!src/a+(b)`) | Same body rules on negatives | Probe FAIL→reject; unit test |
| Custom `exclude` prune | Check rejects (default-or-empty only) | Unit test |
| Compile scope ≠ scan scope | Scope equality check → walk | Rust + e2e mismatch tests (blue found) |
| Compile root ≠ scan root | Root equality check → walk, union preserved | Rust + e2e mismatch tests (both colors) |
| Root spelling (`/x` vs `/x/`, `C:\` vs `C:/`) | Scope's own normalization | Rust normalization unit + trailing-slash skip test |
| Post-scan creation (race) | Coherent snapshot: invisible on skip, by doctrine | Pinned e2e (absent skip / present walk); §1 doctrine |
| Post-scan rewrite/deletion | Retained bytes win (X3, unchanged) | Existing X3 + new Rust dropped-file test |
| Unreadable path (symmetric drop) | Scan read fails, walk finds nothing; identical | Rust dir-as-`.ts` differential (skip≡walk) |
| Unreadable dir (EACCES) | fg throws loud in both arms (only ENOENT suppresses) | fast-glob 3.3.3 source: error filter + reader |
| ENOENT mid-enumeration | Suppressed by fg; file gone for backfill too | Symmetric outcome, argued §1 |
| Empty retention | Mints no token → legacy disk scan (unchanged) | Rust + e2e empty-root tests |
| `files` path (TS fallback, hand lists) | Untouched: always walks (no signal exists) | Existing union tests green |
| Direct N-API callers | `walkComplete` defaults false → walk | Existing X3 partial control green |
| Symlinked dirs/files/dangling | Lexical IGNORE ≡ stat IGNORE argued; traversal agrees | Existing symlink parity tests green (both suites) |
| Symlink cycles | Pathological hang in base; skip completes (fix) | Unpinned (cannot test a hang); named §5 |
| Dotfiles / d.ts / traps / spaces / unicode | Same gates verbatim (shared fns) | Tricky-tree differentials green |
| Sortshape / determinism | Skip sorts the same way; walk-finds-nothing ≡ skip | Byte-identity tests (Vec + artifact equality) |
| Case-insensitive filesystems | fg over-matches, native under-matches (safe direction) | `SRC/**` differential PASS; `SRC` analysis in probes |

## 3. Gates (all green or proven pre-existing)

| Gate | Result |
| --- | --- |
| `pnpm agentrs c atomic` (cargo) | PASS, incl. 12 new `sources::` tests + new `backfill_skip` target |
| `pnpm agentrs v atomic` (seam vitest) | 300/301; sole red SITE-54 reproduced on sha-verified BASE binary → pre-existing flake, unrelated (files-path specifier case; token path untouched) |
| `pnpm agentrs q` touched (8 RS files) | 0 violations; 4 warnings, all pre-existing at base (sources length, lib length, run_parse_serial length, reuse_programs args) |
| `pnpm agentneo q` touched (4 neo files) | 0 errors, 0 warnings |
| rustc warnings | 19 = base (one introduced `backfill_walks` dead-code warning fixed via `cfg(test)`) |
| Neo scan battery (9 files) | 49/49, incl. 12 new (4 check/differential + 8 e2e) |
| Neo full unit suite | 272/273; sole red `bundle.test.ts` proven import-independent of all 12 touched files (esbuild realpath env issue) |
| `pnpm agentneo run` (cases) | 173/173 |
| Goldens | `scan-goldens` (small/med/ent/churn) green; atomic seam goldens green (except pre-existing SITE-54) |
| `bench:neo` bundle bytes | EXACT base-vs-diet raw+gzip all default scales + churn (below) |
| A/B protocol | Binaries asided + sha-verified pre/post every run, no mid-set rebuild, lock two-step released, `env -u MallocNanoZone` throughout |

Bundle bytes (base = diet, every run incl. all 20 A/B runs):

| Scale | styles.css raw/gzip | runtime-data raw/gzip | css() calls |
| --- | --- | --- | --- |
| small | 92651 / 12566 | 91030 / 18736 | 171 |
| medium | 348780 / 40672 | 110241 / 19674 | 635 |
| enterprise | 2867925 / 270510 | 214466 / 22110 | 7527 |
| churn | 8289806 / 745661 | 103709 / 19339 | 43956 |

Churn diet bytes additionally match the independent wave-4 pin exactly.

## 4. Proof: locked interleaved 8-pair enterprise A/B

- Binaries: base `5fdf4c14…b9d1`, diet `4d085c31…e50b25`
  (`/tmp/backfill-{base,diet}.node`), sha-verified before AND after every
  timed run; harness aborts on mismatch; never rebuilt mid-set.
- `pnpm agent run env -u MallocNanoZone pnpm bench:neo -- --scale
  enterprise --runs 1`, pinned stream (seed 7, no `--seed`).
- 2 unscored warmups per arm, then 8 pairs alternating arm order (odd pairs
  base-first, even pairs diet-first). Lock `/tmp/swarm-bench-lock` held for
  the timed block only, released in two steps (`rm owner && rmdir`).
- Box load ~3.6 (shared); interleaving cancels drift. No foreign PIDs
  touched; no cherry-picks.

Warmups (unscored): base 823.9 / 827.3; diet 808.9 / 813.4.

| Pair | Base sync | Diet sync | Δ | Base RSS | Diet RSS |
| --- | --- | --- | --- | --- | --- |
| 1 (B→D) | 836.6 | 809.9 | −26.7 | 376.6 | 384.8 |
| 2 (D→B) | 832.3 | 814.2 | −18.1 | 385.9 | 387.1 |
| 3 (B→D) | 827.3 | 822.2 | −5.1 | 385.4 | 384.7 |
| 4 (D→B) | 828.6 | 816.4 | −12.2 | 383.5 | 389.2 |
| 5 (B→D) | 824.4 | 811.9 | −12.5 | 374.0 | 382.1 |
| 6 (D→B) | 832.2 | 826.8 | −5.4 | 385.2 | 398.3 |
| 7 (B→D) | 840.2 | 812.7 | −27.5 | 389.2 | 395.2 |
| 8 (D→B) | 830.0 | 812.2 | −17.8 | 382.3 | 384.4 |
| **Median** | **831.1** | **813.5** | **−17.6 (−2.12%)** | 384.4 | 386.0 |

Ex-run-1 medians: base 830.0 vs diet 814.2 → **−15.8ms (−1.90%)** — stands.

- Diet wins 8/8 pairs, 4/4 in each arm order: no order confound.
- Solo bar (≥15ms AND ≥1.5%) clears on the full set and ex-run-1.
- RSS: medians +1.6 MiB (+0.4%) with fully overlapping spreads (base
  374–389, diet 382–398) — inside GC noise, no regression signal; the
  mechanism removes work and retains nothing new. HELD.
- Bytes identical on all 20 A/B runs (16 scored + 4 warmups) plus both
  full-suite enterprise legs: css 2867925 / data 214466 every time.

Claims (also `/tmp/backfill-claims.txt`):

```text
CLAIM backfill-slice ent sync -17.6ms (-2.12%): base med 831.1 vs diet med 813.5, locked interleaved 8-pair, diet wins 8/8, stands ex-run-1 (-15.8ms/-1.90%)
CLAIM backfill-slice bytes exact: small/med/ent/churn raw+gzip identical base-vs-diet every run (ent 2867925/270510 + 214466/22110)
CLAIM backfill-slice suites: cargo atomic green (incl 13 new), v atomic 300/301 (SITE-54 pre-existing on base binary), neo scan 49/49 (incl 12 new), neo unit 272/273 (bundle.test pre-existing, import-independent), agentneo 173/173
CLAIM backfill-slice quality: agentrs q 0 violations zero-new-warnings; agentneo q 0 errors 0 warnings; rustc 19 warnings = base
CLAIM backfill-slice mechanism: walk-completeness contract skips the 17ms backfill readdir; BackfillOutcome::Skipped pinned, race snapshot coherent (creation joins X3 rewrite/deletion invisibility)
VERDICT backfill-slice LAND (clears solo bar full + ex-run-1, all gates green-or-proven-pre-existing)
```

## 5. Verdict: LAND

Lever 1 exists and clears the solo bar alone, as CORES §3.6 predicted. The
17ms serial readdir is skipped by contract on the retention-token path with
byte-identical output, a committed 43-pattern differential guarding the
agreed subset, and every fallback (exotic scope, scope/root drift, partial
retention, legacy paths) keeping the walk.

Unresolved (named, never dropped):

- Permission-flip mid-sync (unreadable→readable between scan and compile):
  resolves by snapshot doctrine (scan-time readability wins), unpinned —
  chmod tests are root-fragile by construction.
- Symlink cycles: base hangs, diet completes; untestable as a pin (cannot
  assert against a hang), pathological either way.
- Windows coverage: separator normalization implemented and unit-tested,
  but no Windows box ran the suite; absolute/backslash patterns are
  conservatively rejected regardless.
- Gate generality: unprobed-but-accepted shapes (e.g. `}…{` brace orders)
  rest on rule reasoning; the committed differential guards regressions and
  rejects any future divergence by falling back (rejection is always safe).

DX appendix: `ls --time-style` is a GNU-ism (macOS `ls` rejects it; use
`stat -f`); case-insensitive tmpfs silently merges `Upper.ts`/`upper.TS`
probe fixtures (bit twice — case-fold your fixture names); the neo quality
gate counts `describe` blocks as functions (keep them under 80 lines like
the existing files). ~10 minutes total across the three.

Evidence preserved: `/tmp/backfill-base.node`, `/tmp/backfill-diet.node`
(+`.sha`), `/tmp/backfill-{base,diet}-bytes.json`,
`/tmp/backfill-probe/agree{,2,3}.mjs` + `ab.sh` + `ab.log` +
`ab-results.txt`, `/tmp/backfill-claims.txt`; diet tree at
`/tmp/cores-backfill` (9 modified + 3 new, `reports/latest` restored).
