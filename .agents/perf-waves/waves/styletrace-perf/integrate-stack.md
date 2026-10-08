# INTEGRATE — STYLETRACE-PERF full stack (rc + alloc + cow)

One line: rc LAND + alloc LAND + cow reserve land as one arc: whole-sync −777.0 ms (−42.1%) 8/8; LOO −627.0 rc / −127.0 alloc / +5.0 cow; counts 4970 / 2037+126 / 892; 580/580 identity; pins e9387f5ec / 84faa918f / ec4f6f725.

Effect: base median 1847 → cand 1066, Δ −777.0 ms (−42.1%), 8/8 favor.

Integrator worktree: `/tmp/stperf-integrate` (fresh, detached).
Base pin: `488bcfd7a6607f122533d9f21ecfc4ff7c9ce587` (verified `git rev-parse HEAD` at creation; tree was clean).

## Members (stack order)

1. **rc** (LAND): `/tmp/stperf-rc-context.diff` — `module_cache` values `ParsedModule` → `Rc<ParsedModule>`, `load_module` returns `Rc` (context.rs).
2. **alloc** (LAND): `/tmp/stperf-diet-alloc-resolve.diff` — `resolve_*` rewritten to `*_into` accumulator form + `DeclTarget` + `take_or_extend[_owned]` (resolve.rs).
3. **cow** (reserve): `/tmp/styletrace-diet-resolve-env-cow.diff` — `bind_type_params` returns `Cow` (borrow when `params.is_empty()`) (resolve.rs).

## Rebase record (to reproduce)

```
git worktree add --detach /tmp/stperf-integrate 488bcfd7a
cd /tmp/stperf-integrate
git apply /tmp/stperf-rc-context.diff        # clean
git apply /tmp/stperf-diet-alloc-resolve.diff # clean
git apply /tmp/styletrace-diet-resolve-env-cow.diff  # clean — see below
```

The cow bind-hunk needed **zero manual edits**: its two hunks (import line 6; `bind_type_params`
at resolve.rs:348-368) are textually disjoint from alloc's hunks, and alloc's 4 rewritten call
sites keep the `&next_env` reference form, so cow's `Cow` return flows through unchanged.
Byte-proof: `git apply -R` of the cow diff on the stacked file reproduces the alloc-alone
reconstruction **byte-for-byte** (`cmp` clean); stacked context.rs is exactly tip + rc hunk.
Integrator authored **zero lines** — the stack is the exact member sum (tracked diff: 2 files,
200+/92-, `/tmp/stperf-full-stack.diff`, 460 lines).

## Collision analysis (file:line)

- rc ∩ alloc = ∅. rc touches only `tracer/context.rs` (import :10, cache type :26,
  `load_module` :67-83). alloc touches only `tracer/resolve.rs`. Their boundary,
  `resolve_declaration` (context.rs:230-234, signature untouched by all three), is unchanged.
- rc ∩ cow = ∅ (same file split; cow touches only resolve.rs :6 and :348-368).
- alloc ∩ cow: same file, disjoint hunks. Semantic joint: alloc's call sites
  `ctx.branch(target.module_path, &next_env)` (resolve.rs:276,289,309,322) now pass
  `&Cow<FxHashMap>` where `branch` takes `&FxHashMap` (context.rs:54-58) — carried by
  `Deref` coercion (`Cow: Deref<Target=B>`), identical to the base call-site form
  `ctx.branch(decl_module_path, &next_env)` the cow diet was banked against.
  Proven by clean release builds of full + all three LOO arms (no new warnings
  attributable to the joint; the pre-existing 19 `atomic` crate warnings reproduce).
- rc downstream: `resolve_declaration` reads `module.declarations / reexports /
  export_all_sources / imports` (context.rs:236,240,249,258) through `Rc` auto-deref —
  no edits required, verified by build.

## What was NOT done

No new diets, no rewrites, no file split (the one stacking-emergent soft WARN below is
disclosed, not fixed — fixing it is new work). No re-proof of member solo numbers (prior
sets used as discovery only; this report's evidence is integrator-firsthand). No
enterprise-bench regression run, no flame refresh, no LOG.md — those are the captain's
per-landing closeout. The 18 cargo + 27 vitest failures reproduce identically at tip
(fixture-environment `STT-E-UNRESOLVED-SURFACE`, missing StyleProps entrypoint in worktree
fixtures) — enumerated below, not fixed (not integrator ground).

## Suites vs clean tip (aside-compared, never stash)

cargo `styletrace` (`pnpm agentrs c styletrace`): tip 60 passed / 18 failed ≡
full 60 passed / 18 failed; failure-name sets byte-identical (`diff` clean,
`/tmp/stperf-cargo-tip-failures.txt` vs `-full-`). The 18 (all pre-existing at tip):
`hermetic_roots::{committed_sync_root_discovers_primitives_and_style_props,
separate_source_and_declaration_roots_in_scratch_dir,
traces_module_qualified_bindings_on_committed_fixture}`,
`tracing::{fixture_extend_library_has_no_reference_style_bearing_exports,
ignores_node_builtin_helper_imports_while_tracing_local_wrappers,
station_named_barrel_exports_wrapped_reference_component,
station_named_barrel_package_traces_reexported_and_wrapped_components,
station_plain_react_library_has_no_style_bearing_exports,
station_plain_react_wrappers_have_no_style_bearing_exports,
traces_body_destructured_direct_forwarding, traces_body_destructured_rest_forwarding,
traces_default_export_wrappers_from_packages, traces_export_star_package_barrels,
traces_jsx_fallback_forwarding_but_not_test_only_reads,
traces_local_exports_that_forward_into_node_modules_wrappers,
traces_pipeline_fallback_args_but_not_rebound_fallbacks,
traces_pipeline_object_and_array_literal_args, traces_subpath_package_wrappers}`.
Delta: **none** (no test files in the stack; carried-over set = ∅).

vitest `styletrace` (`pnpm agentrs v styletrace`, 32 tests; native staged per arm since the
stack is .rs-only): tip 5 passed / 27 failed ≡ full 5 passed / 27 failed; failed-name sets
identical after timing-strip, passed-name sets identical (5/5 same).
Delta: **none**. Full logs: `/tmp/stperf-cargo-{tip,full}.log`, `/tmp/stperf-vitest-{tip,full}.log`.

## Quality (`pnpm agentrs q`)

0 violations on every file (tip, each single-member reconstruction, full stack).
Warning ledger: tip-resolve 4 (cyclomatic 12×2 + cognitive 30×2) → alloc-alone 2
(cognitive 26×2; cyclomatic fixed, cognitive 30→26) → full 3 (cognitive 26×2 banked +
**file-length 369>365, stacking-emergent**: alloc-alone sits exactly at the 365 soft limit,
cow's +4 net lines trip it). tip-context and rc-context both clean (0).
Net tip→full: 4→3 warnings, 0 violations. The emergent WARN is soft ("Can you split this
up, please?"), disclosed for captain/HQ — splitting is new work, forbidden here.

## 8-pair sum + per-member LOO (bench lock, `pnpm agent run`, sha before+after every run, pin stream, warmups unscored)

World: lib-shaped scratch (`/tmp/styletrace-scratch`), probe `/tmp/styletrace-probe/sync-probe-wt.mts`,
rig `/tmp/stperf-ab-int.mjs`. All sets: warnings=3 on all 40 rows, lock grabbed/released cleanly
(two-step), no lock loss, no foreign-proc contact. Binaries sha-pinned:
base `5cbffe78…`, full `f9c6af85…`, loorc `bec9d585…`, looalloc `0b8335df…`, loocow `d5f4d2d9…`.

| set (base→cand) | base med | cand med | Δwall med (mean) | Δcompile med | agree |
|---|---|---|---|---|---|
| sum (base→full) | 1847 | 1066 | **−777** (−783), −42.1% | −773 | 8/8 |
| loo-rc (alloc+cow→full) | 1695 | 1067 | **−627** (−628) | −629 | 8/8 |
| loo-alloc (rc+cow→full) | 1193 | 1069 | **−127** (−126) | −126 | 8/8 |
| loo-cow (rc+alloc→full) | 1068 | 1071 | **+5** (+4), range [−17,+28] | +8 | 4/8 straddle |

Logs: `/tmp/stperf-ab-int-{sum,loo-rc,loo_alloc,loo_cow}.jsonl` (+ per-run `.phases.json`).
LOO composition (−627 −127 +5 = −749) reconciles with the sum (−777) within 4% across
denominators. rc and alloc each clear the solo LAND bar in-stack; cow straddles zero.

## Counted work removed (replicated instrumented counts, run1≡run2 exact, sha-pinned)

Filed probe `/tmp/styletrace-probe/counts3-*` (499 sessions, deterministic; diets change
per-call cost, never call counts, so base counts are stack counts):
rc: LM_HIT **4970** cache-hit deep clones of `ParsedModule` eliminated (257,814 decls,
59,546,961 module bytes no longer deep-copied per sync). alloc: OBJECT_CLONE **2037**
temp sets (**696,443** element clones) + IFACE_PROPS_CLONE 126 eliminated via in-place
accumulation. cow: BTP_CALLS 3904, BTP_NONEMPTY 3012 → **892** empty-params binds (22.8%)
skip the env clone via `Cow::Borrowed` (avg inherited map <1 entry — tiny room, hence
sub-noise). Reserve 3-part for cow: (1) the full artifact contains the Cow path
(resolve.rs:354-356, full binary `f9c6af85…` built from these sources); (2) the sum clears
with headroom (−777 vs the ≥15 ms / ≥1.5% bar); (3) 892 avoided env clones per sync, counted.

## Byte-identity + determinism + sortshape

Snapshots `/tmp/stperf-int-ident-{base,full,full2,loorc,looalloc,loocow}` (rig
`/tmp/stperf-int-ident.mjs`, sha-verified each run): **580/580 files byte-identical** vs
base on all five arms (`diff -r -q` clean); determinism full≡full2 exact.
Sortshape (zero emission-order changes): emission accumulates in `BTreeSet<String>`
(sorted iteration = order); rc swaps the module container to `Rc` (same data, auto-deref
reads); alloc replaces temp-set union with in-place `extend` (BTreeSet union is
result-identical under `Ord`; empty-fast-path reproduces single-source sets exactly);
cow swaps a lookup-map clone for a borrow (value-identical, map iteration never emitted).
The 580/580 bytes are the empirical backstop to the argument.

## Verdict

SUM-CONFIRMED: full stack (rc LAND + alloc LAND + cow reserve) lands as one arc —
−777 ms / −42.1% whole-sync on the lib-shaped world, 8/8, suites delta ∅, q 0 violations,
580/580 identity, determinism ×2, LOO attributes −627 rc / −127 alloc / cow sub-noise reserve.
