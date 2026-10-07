# Mission brief — font-weight-runtime-1008

## Owner instructions (verbatim intent, recorded 2026-10-08)

> Send out an Oracle agent to fix this. Mark these instructions and go for it.

Interpretation: run the fix as a captain-led mission with the Oracle in the
loop at its planned points. The Oracle is **read-only** (`.opencode/agents/oracle.md`,
`oracle` skill): it reviews the plan and the landed arc; a **crew implements**.
Owner wants this fixed autonomously ("go for it").

## Objective (single, ordered)

Bare `weight` names must resolve against the active sibling family in the
**runtime** resolver, matching the already-shipped Rust **static** resolver
(`packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`).

Observable acceptance:

- `/typography` "Weight ramp": `font="sans" weight="thin"` computes **200**.
- `/fonts` "Family weights": `font="serif" weight="normal"` → **373**,
  `font="mono" weight="normal"` → **393**, `font="sans" weight="thin"` → **200**,
  and family-less `weight="thin"` stays **100**.
- No regression to dynamic `weight={expr}` (keyword semantics), explicit
  `weight="sans.thin"`, numeric/unknown values, or conflicting-family decline.

## Root cause (captain's recon, HEAD 1bdcfd05a)

Two resolvers implement the same weight algorithm; the Oct 7 pass fixed one.

- **Rust static:** `resolve/font/scope.rs` rewrites bare keyword weights to
  `family.name` per style root before `lower_weight`. Fixed.
- **TS runtime (the docs path):** generated `react.mjs` bundles
  `packages/reference-rs/modules/atomic/js/namer/lower.ts`
  (`weightPairs` → `scopedWeight ?? keywordWeight ?? raw`), driven by
  `packages/reference-neo/src/runtime/css/css.ts` (`collectEntries` builds
  per-prop `NamerRequest`s). It has **no sibling-family context**, so
  `weight="thin"` beside `font="sans"` hits `keywordWeight` → 100.

Live evidence (dev server :5174): `/typography` ramp computes
100/300/400/600/700/900; `/fonts` computes serif-normal 400, mono-normal 400,
sans-thin 100. Labels claim 200/373/393.

## Constraints

- Match `scope.rs` semantics exactly (same-`when` family wins, base family
  covers nested conditions, conflicting families decline, only the six CSS
  keyword names rewrite, `font` stacks do not seed, `fontFamily` seeds too).
- Only static string values rewrite; dynamic expressions keep keyword
  semantics.
- Do not touch the unrelated dirty working-tree files
  (`packages/reference-neo/src/config/*`, `packages/reference-lib/scripts/*`).
- Crews never commit; the captain commits verified arcs, named files only.

## Decomposition (proposed; Oracle to review at PLAN.oracle)

- **Arc 1 — runtime scoping.** Add the family-scope pass to the runtime collect
  step (`reference-neo/src/runtime/css/css.ts`), with unit tests mirroring
  `scope.rs`'s nine scope cases.
- **Arc 2 — parity + seam.** Confirm the JS namer path has no second
  family-blind weight site; document the static/runtime split; add a seam test
  if a second site exists.
- **Arc 3 — docs proof.** Re-sync the docs, verify computed weights on
  `/typography` and `/fonts`, run `pnpm agentdocs q`, capture evidence.

Oracle review points: `PLAN.oracle` (before work), `ARC1.review` (after Arc 1).
