# REPORT-STPERF-alloc: thread one accumulator through resolve_*

One line: every `resolve_prop_names`/`resolve_literal_names` level built a temp `BTreeSet` and `extend`ed it upward (2037 `Object` clones = 696,443 elems, 126 iface-prop clones, plus per-level temps); the diet threads a single `&mut BTreeSet` accumulator with move-when-empty merges. Whole-sync −111.5 ms (−6.13%), 8/8, stands ex-run-1.

Effect: base median 1818.5 → cand 1707, Δ −111.5 ms (−6.13%),
8/8 favor, ex-run-1 −109.0, paired-median −119.0. Compile-phase
Δ −112 (accounts for the whole wall Δ).

## Base / binaries

- Base commit: `488bcfd7a6607f122533d9f21ecfc4ff7c9ce587` (mission
  worktree `/tmp/styletrace-perf-mission`, detached HEAD).
- Base `.node` sha256:
  `5cbffe7898f2c2adc2aad2642e89ea01ea9f404a7a7fbb7fe2f6fac8a7ff7cd9`
  (`/tmp/stperf-base.node`).
- Cand `.node` sha256:
  `1cbb16ffc9cb07f50c7ef784fbd07bc7ad352acd66cc788f036dfcacf3572ffa`
  (`/tmp/stperf-alloc.node`, 0 styletrace-crate release warnings).
- Diet: `packages/reference-rs/modules/styletrace/src/resolver/tracer/resolve.rs`
  (+186/−83, `git diff` = `/tmp/stperf-diet-alloc-resolve.diff`
  exactly; filed against clean base — does NOT include cow).
  Patch aside at `/tmp/stperf-diet-alloc-resolve.diff`.
- Binary discipline: sha-verified before AND after every run;
  `REFERENCE_UI_NATIVE_PATH` swaps, never rebuilt mid-set.

## Mechanism counts (WAVE2-COUNTS, bit-identical ×4 syncs)

- `TypeExpr::Object` set clones (`resolve.rs:53`): 2037/sync,
  696,443 elems — every one now merges into the accumulator
  (`take_or_extend`: structural move-when-empty, per-element
  inserts otherwise; no temp set either way).
- Interface-prop clones (`:202`): 126/sync, 1,026 elems — same
  treatment. Interface literals (`:228`): 0 (dead on this load).
- Builtin owned results: `take_or_extend_owned` moves (zero
  element clones on either path).
- Union/intersection/conditional/combined levels: no more
  per-level temp sets — one accumulator per top-level call.
- `DeclTarget` struct keeps the `_into` helpers at ≤3 args (no
  parameter soup; the struct is the pass bundle).

## 8-pair (lock-held, pin stream, warmups unscored)

Same harness/conditions as the rc set (`/tmp/stperf-ab.mjs`,
clean two-step hold/release, taskpolicy elevation, alternating
order, pin stream). Load 2.3–2.7, uptime 21 days. Foreign procs
observed, never touched (user `dev:lib`, playwright-mcp, Chrome).

Warmups (unscored): base 1802, 1821; cand 1955, 1702.

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1850 | 1716 | −134 | B,C |
| 2 | 1805 | 1707 | −98 | C,B |
| 3 | 1821 | 1684 | −137 | B,C |
| 4 | 1816 | 1696 | −120 | C,B |
| 5 | 1829 | 1707 | −122 | B,C |
| 6 | 1824 | 1721 | −103 | C,B |
| 7 | 1814 | 1696 | −118 | B,C |
| 8 | 1800 | 1714 | −86 | C,B |

Base median 1818.5; cand median 1707; median Δ −111.5 ms
(−6.13%), 8/8 favor. Ex-run-1: −109.0 — stands.
Paired-median: −119.0. All three estimators agree. Nothing
discarded. Full log: `/tmp/stperf-ab-alloc.jsonl`.

## Identity, determinism, order

- Scratch identity (580 files, base vs cand): `diff -r -q`
  exit 0. CSS `250fd623…` identical; warnings 3 = 3.
- Determinism: cand ×2 byte-identical (exit 0).
- 4-scale regression identity: 4/4 identical to base (same matrix
  as rc report; full shas `/tmp/stperf-scales.jsonl`). Vs 09-22
  pins: same uniform pre-existing +52/+130 drift on clean base.
- Order argument (sortshape): every merge is set union and every
  result is a `BTreeSet` (iteration order = key order), so the
  final member order is independent of accumulation order; the
  accumulator holds exactly the members the temp-sets union held
  (membership-preserving by construction at each level:
  empty→move, non-empty→extend). The one behavioral seam,
  `resolve_indexed_access_literals`'s `let _ =` probe of `index`,
  is unchanged (still returns a fresh set, still discarded).
  Zero emission-order changes; 580/580 confirms.

## Suites, quality

- `pnpm agentrs c styletrace`: 78/78 (base 78/78; delta zero).
- `pnpm agentrs v styletrace`: 32/32 (base 32/32; delta zero).
- `pnpm agentrs q` on `resolve.rs`: 0 violations, 2 warnings
  (cognitive 26 on the two `_into` fns — the restructured halves
  of the 4 pre-existing HEAD warnings on the same functions;
  cyclomatic now ≤10, count reduced 4→2, zero new shapes).
  File 364 lines (limit 500; soft 365 — at, not over).
  No `#[allow]`, max 3 args (`DeclTarget` bundle).
- Release rustc warnings (styletrace crate): 0 base, 0 cand.

## Verdict

**LAND** (solo: −111.5 ms and −6.13% whole-sync; bar is ≥15 ms
AND ≥1.5% — clears by 7×/4×). Fences: `resolve.rs` resolve_*
bodies only (`bind_type_params` untouched — cow's ground).
Disjoint from rc (`context.rs`); same-file/different-hunk vs cow
(an integrator stacking cow+alloc must rebase cow's `bind`
hunk onto this diet's old-signature context — mechanical).

Captain commit-tick extras (owed at landing): committed timed
bench:neo report on the landing tree, LOG.md scoreboard row,
flame refresh on the new tip, `pnpm agentperf rebuild` after
filing to `docs/PERF/waves/`. Suggested scoreboard text:
`alloc −111.5 ms (−6.13%) 8/8 | base 1818.5 → 1707 | 580/580 + 4-scale ✓`.

## DX appendix

- No new breakage on this set. Minutes lost: 0.
- Review note: `take_or_extend`'s empty→`*names = props.clone()`
  arm keeps single-path cost identical to before (one structural
  clone); the win is entirely the multi-path arms (no temps) plus
  the owned-builtin moves. A reader auditing "did it just move
  the clone" should check the multi-parent `extends` and
  union/conditional fan-ins — those are where temps died.
