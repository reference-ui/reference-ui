STATUS: (answer begins with exactly `STATUS: DONE` or `STATUS: REFUSED`)

# Oracle review — PLAN.oracle — font-weight-runtime-1008

## Read-only review of a proposed plan (no code writing)

## Question

Review the shape of this plan before work starts. Specifically:

1. Is the chosen fix site correct? Confirm the runtime resolution path that the
   docs actually exercises, and whether the family-scope pass belongs in
   `reference-neo`'s `collectEntries` (sibling props visible) versus the JS
   namer `lower.ts` (per-prop, no siblings). If both must change, say so and
   why.
2. What is the minimal correct decomposition? What can run in parallel vs. must
   be sequenced (give `files` and `depends_on`).
3. Which interfaces should be reviewed before other work builds on them, and
   which tasks deserve their own Oracle review and why.
4. Name validation gaps: tests that must exist to prove the objective, and any
   existing seam specs that should be reused or extended.

## Objective

Bare `weight` names must resolve against the active sibling family in the
**runtime** resolver, matching the already-shipped Rust **static** resolver.

Acceptance (observable):
- docs `/typography` `font="sans" weight="thin"` computes **200**;
- docs `/fonts` `font="serif" weight="normal"` → **373**, `font="mono"
  weight="normal"` → **393**, `font="sans" weight="thin"` → **200**, family-less
  `weight="thin"` → **100**;
- no regression for dynamic `weight={expr}` (keyword semantics), explicit
  `weight="sans.thin"`, numeric/unknown values, or conflicting-family decline.

## Context (captain recon at pinned HEAD `1bdcfd05a`; verify in code)

Two resolvers implement the same weight algorithm; the 2026-10-07 pass fixed
only the Rust static one.

- **Rust static — fixed.** `packages/reference-rs/modules/atomic/src/resolve/font/scope.rs`
  rewrites bare keyword weights to `family.name` per style root, called from
  `extract/jsx/mod.rs` (`apply_to_wants`), `extract/css/mod.rs`,
  `recipes/spec.rs`, and `stylesheet/global/walker.rs`. Weight lowering:
  `resolve/font/weight.rs` (`scoped_weight ?? css_weight_keyword ?? raw`).
  Tests: `scope.rs` `#[cfg(test)]` (nine cases) and
  `extract/jsx/mod.rs::jsx_bare_weight_resolves_against_element_font`.
- **TS runtime — the docs path, not fixed.**
  - `packages/reference-rs/modules/atomic/js/namer/lower.ts`:
    `weightPairs` = `scopedWeight(raw) ?? keywordWeight(raw) ?? raw`
    (lines ~155-175); `scopedWeight` needs a dotted key only.
  - `packages/reference-neo/src/runtime/css/css.ts`: `collectEntries` /
    `collectStyle` build `NamerRequest[]{when, prop, value, important}` per
    prop, then `css()` calls `name(query, tables, system)`. No sibling context.
  - The docs generated `react.mjs` bundles these (minified `weightPairs` /
    `scopedWeight` / `keywordWeight` are present and family-blind). Docs
    `ui.config.ts` extends `@reference-ui/lib/baseSystem`; families with
    per-family `weights` are in `packages/reference-lib/src/core/theme/fonts.ts`
    (`sans.thin=200`, `serif.normal=373`, `mono.normal=393`).
- The recent bug note `docs/bugs/FONT_WEIGHT_RESOLUTION.md` records the static
  fix and explicitly scopes dynamic/runtime out.

## Proposed decomposition (review this)

- **Arc 1 — runtime scoping.** Add a family-scope pass to
  `packages/reference-neo/src/runtime/css/css.ts` that, per style object and per
  `when` scope, rewrites bare keyword weight values to `family.weight` when the
  scope names exactly one family — mirroring `scope.rs` (same-`when` wins, base
  covers nested, conflicts decline, six keywords only, stacks don't seed,
  `fontFamily` seeds). Files: `css.ts`, `css.test.ts` (or new
  `runtime/css/scope.test.ts`). `depends_on: none`.
- **Arc 2 — parity + seam.** Search for any second family-blind weight site in
  the JS namer/build path; if one exists, fix or document; add a seam test
  asserting runtime and Rust agree on the three shipped families. Files: TBD by
  Arc 1 findings. `depends_on: Arc 1`.
- **Arc 3 — docs proof.** Re-sync docs, assert computed weights on
  `/typography` and `/fonts`, run `pnpm agentdocs q`, capture evidence. Files:
  read-only + evidence. `depends_on: Arc 1` (verify after sync).

Oracle review points proposed: `PLAN.oracle` (this), `ARC1.review` (after Arc 1
lands). Say if a third is warranted.

## What I want back

- Corrected fix site + decomposition (or confirmation), with `files` /
  `depends_on`.
- Findings in the skill's format: ID, severity, file:line at the pinned commit,
  evidence, recommendation, validation gap. P4 for non-repair observations.
- A verdict: clear / findings / refuse, and whether any slice can merge while
  gaps become the next tasks.
- Do not ask the owner to choose; the objective is the direction.
