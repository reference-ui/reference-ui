# REPORT-STPERF-cow: borrow the inherited env when no type params bind

One line: `bind_type_params` cloned the inherited env on all 3904 calls/sync; 892 (22.9%) bind zero params, so those now borrow via `Cow`. Whole-sync −10.0 ms (−0.55%), 5/8 favor — a directional sub-noise straddle: BANK as a sum member.

Effect: base median 1823.5 → cand 1813.5, Δ −10.0 ms (−0.55%),
5/8 favor, ex-run-1 −8.0, paired-median −11.5. Below the solo LAND
bar (≥15 ms AND ≥1.5%); all three estimators agree on ~−10.

## Base / binaries

- Base commit: `488bcfd7a6607f122533d9f21ecfc4ff7c9ce587` (mission
  worktree `/tmp/styletrace-perf-mission`, detached HEAD).
- Base `.node` sha256:
  `5cbffe7898f2c2adc2aad2642e89ea01ea9f404a7a7fbb7fe2f6fac8a7ff7cd9`
  (`/tmp/stperf-base.node`).
- Cand `.node` sha256:
  `650b25d4ad11db252d08ac341e27b6ee60dab11a7522ffe96753761aeea991d2`
  (`/tmp/stperf-cow.node`, 0 styletrace-crate release warnings).
- Diet: `packages/reference-rs/modules/styletrace/src/resolver/tracer/resolve.rs`
  (+8/−4, `git diff` = `/tmp/styletrace-diet-resolve-env-cow.diff`
  exactly). Patch aside at
  `/tmp/styletrace-diet-resolve-env-cow.diff`.
- Binary discipline: sha-verified before AND after every run (rig
  aborts on mismatch); `REFERENCE_UI_NATIVE_PATH` swaps, never
  rebuilt mid-set.

## Mechanism counts (WAVE2-COUNTS, bit-identical ×4 syncs)

- `bind_type_params`: 3904 calls/sync, 3012 non-empty (77.1%) →
  892 empty-params calls borrow instead of cloning.
- Inherited entries cloned per sync: 3,286 (avg 0.84/call);
  params bound 284; result env len 3,564.
- Removed: 892 env-map clones + their entry clones per sync (the
  empty-params path). The 3012 non-empty calls are untouched
  (still clone+insert, now wrapped in `Cow::Owned`).
- Why small: empty-params calls carry the smallest envs, so the
  removed clones are the cheapest ones — the ~−10 ms whole-sync
  read matches the mechanism (no phase-local claim is made).

## 8-pair (lock-held, pin stream, warmups unscored)

Same harness/conditions as the rc set (`/tmp/stperf-ab.mjs`,
clean two-step hold/release, taskpolicy elevation, alternating
order, pin stream). Load 2.7–3.0, uptime 21 days. Foreign procs
observed, never touched (user `dev:lib`, playwright-mcp, Chrome).

Warmups (unscored): base 1835, 1829; cand 2031, 1825.

| pair | base syncMs | cand syncMs | Δ ms | order |
| --- | --- | --- | --- | --- |
| 1 | 1831 | 1808 | −23 | B,C |
| 2 | 1823 | 1791 | −32 | C,B |
| 3 | 1813 | 1815 | +2 | B,C |
| 4 | 1811 | 1789 | −22 | C,B |
| 5 | 1844 | 1858 | +14 | B,C |
| 6 | 1815 | 1844 | +29 | C,B |
| 7 | 1824 | 1812 | −12 | B,C |
| 8 | 1829 | 1818 | −11 | C,B |

Base median 1823.5; cand median 1813.5; median Δ −10.0 ms
(−0.55%), 5/8 favor. Ex-run-1: −8.0. Paired-median: −11.5.
Pair spread (−32…+29) straddles zero — honest sub-noise read, not
a LAND claim. Nothing discarded (no noisy pairs; spread is rig
noise, symmetric). Full log: `/tmp/stperf-ab-cow.jsonl`.

## Identity, determinism, order

- Scratch identity (580 files, base vs cand): `diff -r -q`
  exit 0. CSS `250fd623…` identical; warnings 3 = 3.
- Determinism: cand ×2 byte-identical (exit 0).
- 4-scale regression identity: 4/4 identical to base (same matrix
  as rc report; full shas `/tmp/stperf-scales.jsonl`). Vs 09-22
  pins: same uniform pre-existing +52/+130 drift on clean base.
- Order argument (sortshape): `Cow::Borrowed` vs `Cow::Owned`
  differ only in storage; `branch()` derefs to the identical map
  contents, so every downstream read is unchanged. Zero
  emission-order changes by construction; 580/580 confirms.

## Suites, quality

- `pnpm agentrs c styletrace`: 78/78 (base 78/78; delta zero).
- `pnpm agentrs v styletrace`: 32/32 (base 32/32; delta zero).
- `pnpm agentrs q` on `resolve.rs`: 0 violations, 4 warnings —
  the SAME 4 pre-existing HEAD warnings
  (`resolve_prop_names`/`resolve_literal_names` complexity, lines
  shifted by the diet); zero new.
- Release rustc warnings (styletrace crate): 0 base, 0 cand.

## Verdict

**BANK** (sub-noise straddle, −10 ms / 5/8; joins sums under the
reserve precedent: provably removes 892 counted clones/sync, sum
clears with headroom elsewhere, whole-sync resolves in the
sum-confirm). Fences: `resolve.rs::bind_type_params` only.
Disjoint from alloc (untouched `resolve_*` bodies) and rc
(`context.rs`) — same-file/different-hunk vs alloc; an integrator
must rebase (alloc's filed diff carries the old `bind`
signature as context).

Captain commit-tick extras (owed if/when landed, alone or in a
sum): timed bench:neo report, LOG.md scoreboard row, flame
refresh, `pnpm agentperf rebuild`.

## DX appendix

- No new breakage on this set (rig fix from the rc set held;
  clean hold/release). Minutes lost: 0.
- Note for integrators: `&Cow<FxHashMap<..>>` coerces to
  `&FxHashMap<..>` at the four `branch()` call sites via Deref —
  no call-site changes were needed, and none should be added.
