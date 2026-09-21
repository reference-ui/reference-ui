# Fasthull 2b implementer note — "dead product" (B3+B5)

Implementer log. Branch `voyage/hyperspace-perf-2-b`. Profiler baseline:
ent 2.46s/627.4MiB (spread 70ms/46MiB), css 15,007,762 B, data 530,606 B.
Box shared with 3 siblings throughout; loads noted per run.

## B3 — gate proof-row materialization (REDUCED: plan-gating KILLED)

Shipped: `types.rs` `wants_proof()` + `AssembleCtx.proof` (`lib.rs`
one line) + `assembly.rs` gates on css map, top-level recipe tables, and
wants retention. `native.rs` untouched, `atom_count` ungated,
`builder.rs` inversion skipped (collect-gate drops the copy).
Collateral: 12 cargo helpers + `seed.rs`→`css.is_none()`; zero
diagnostics-assertion touches.

TRIPWIRE KILL: full plan-gating showed 12/243 sweep deltas, all the
`render_session` plan-join prefix (`has no compiled style plan...`).
Per architect §1: plans unconditional + render always runs; B3 landed
css/recipes/wants only.

Proof (reduced): sweep 243/243 ZERO deltas; bench bytes cmp-clean all
4 scales (css+data+diagnostics+traced; baseSystem clean modulo probe
tmpdir); cargo 511+1 green.
Bench: ent median 2432ms/638.1MiB vs 2460/627.4 — inside spread, no
claim. Small 128/116.5, medium 355/190.4, churn 4.08s/620.1.

## B5 — derive recipe classes + stop dead-map builds + hoist

1. `build_shipped()` (skips combinations + responsive_variant_map) +
   `mod.rs:98` one-liner; `:348` map assert→emptiness pin,
   `spec_recipe_tests`→variant_map literals. Cargo green; serialized
   bytes identical by construction (both already skipped).
2. Reshape: `variantMap`→per-axis value lists (`serialize_with`),
   `base`/`className` dropped from wire (in-memory kept);
   `recipe.ts` derivation port (first-char axis prefix, astral-safe)
   + `registerRecipeData` 3rd param; type mirrors
   (contracts/js-types/system.ts + artifact line); 7 NEO specs +
   10 engine stations renegotiated to literals (architect lists
   undercounted: +RECIPE-05/06/08, SITE-10/55 found via red runs);
   fixtures hoisted/reshaped; `recipe.test.ts` new-table fixture +
   tone/tint collision unit + hoist-precedence unit; docs.
   Engine station finds use `qualifiedName` now.
3. Hoist LAST: per-table bps skipped; artifact `responsiveBreakpoints`
   via custom `Serialize` (first table's list — 440/440 censused
   uniform, assembly.rs untouched per architect NEVER);
   `react.ts:35` header + spec call-sites pass it through.
   `harvest-census` react pins re-pinned twice, both per-hypothesis
   (148601→148830 derivation, →148880 header).

Proof: E2E recompute base 528/528 (88+440), variant 4752/4752
(792+3960), responsive-vs-sheet 3960 + 19800 — all exact.
Data ent 530,606 → 341,516 (reshape) → 318,688 (hoist −22.3 KiB
own step-proof) = 518.2 → 311.2 KiB (−40%). styles.css
byte-identical all scales + churn; churn data 143.2 → 110.3 KiB.
Paint + stations hold (NEO 173/173).

## Stability (final tree)

cargo atomic 511+1 ✓; vitest atomic 299/300 (SITE-54 stash-proven
pre-existing on HEAD) ✓; contracts 13/13 ✓; agentneo 173/173 ✓;
recipe units 19/19 ✓; agentrs q 0 violations (3 soft warns, 1
pre-existing); agentneo q 0 errors (2 pre-existing fn-length warns).
No scale/generator/sampler edits (GOODHART clean).

## Bench (final, box shared load ~3.3-5.2)

| scale | base → post | css | data |
| small | 126/115.0 → 125/113.0 | 538.0 KiB = | 102.5 → 93.7 KiB |
| medium | 344/190.6 → 339/191.1 | 2.4 MiB = | 164.3 → 127.0 KiB |
| ent | 2.46s/627.4 → 2.37s/607.4 (med; 2368/2380/2370, 602.8/607.4/621.2) | 14.3 MiB = | 518.2 → 311.2 KiB |
| churn | —/— → 4.05s/647.8 (B3: 4.08/620.1) | 8.3 MiB = | 143.2 → 110.3 KiB |

Sync −90ms clears the 70ms spread (thin — reviewer judges);
RSS −20MiB inside 46 spread, no claim. Data −40% is the win.

## Incidents / flags

- STASH RACE (repaired, captain-verified, voyage rule now bans bare
  stash): my prove-cycle popped lane C's stash; restored via
  `stash store`, foreigners reverted, my bytes recovered from
  dangling bad081eb. No contamination either way.
- Merge flags: `system.ts` mirror (table :94-105 + artifact :131-136)
  vs lane C logic (~:222-230); `harvest-census` EXPECTED_BYTES;
  `mod.rs:98` one-liner for lane A rebase; `dist/` JS rebuilt
  (tsup, gitignored — reviewer rebuilds the same way).
- RS warns: table.rs 392 + finish 88 (mine, soft) + lib.rs 383
  (pre-existing). Neo warns: 2 pre-existing spec fn-length.
