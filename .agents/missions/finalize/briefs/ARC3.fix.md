# Brief — ARC3.fix (crew: general, DeepSeek V4.1 Flash, `#high`)

You are the **fix line** for the Oracle's Arc 3 plan review. Arc 3 did **not**
land code (feasibility STOP); the Oracle reviewed its plan and returned
**APPROVED WITH CHANGES**. Your job is to revise the plan so a future mission
can execute it without re-deriving the Oracle's corrections.

Read first:
- `.agents/missions/finalize/reports/ARC3.impl.md` (the filed plan)
- `.agents/missions/finalize/reports/ARC3.review.md` (the Oracle ruling)
- `.agents/missions/finalize/ARC3.md` (the log)

Work in `/Users/ryn/Developer/reference-ui`, branch `reference-system`. This is
**docs-only**: do not change any source file, do not add a dependency, do not
run `pnpm install`. Do not commit, push, or `git stash`. A parallel crew owns
`packages/reference-rs/**`; leave it alone.

## Deliverable

Write a durable, **tracked** revised plan at
`.agents/missions/finalize/PLAN-mdx.md` (the `reports/` dir is gitignored, so
the plan must live outside it). It must fold in every Oracle demand:

- **R1 (adopt):** drop the `mdx?: boolean` option. Register the
  `onLoad({ filter: /\.mdx$/ })` plugin **unconditionally** in
  `plugins/index.ts` (it is inert without `.mdx` input). Name all three bundle
  sites it covers: `bundleFragments`, `runSingle`, `runPlanner`
  (`src/collect/lib/runner.ts`).
- **R2 (adopt):** replace the async, global "compile-before-match" design with
  an **MDX-scoped sync pre-pass**: for `.mdx` candidates only, strip frontmatter
  and fenced code blocks from the raw text, then apply an **MDX-only anchored
  import-line matcher** on the raw source. Keep `splitScan` sync, keep the
  global `createImportPatterns` frozen (no churn to `.ts/.tsx` goldens). MDX
  compilation stays in the bundle path only.
- **R3 (conditional):** state that no `splitScan → async` change is needed under
  R2; if a future implementer keeps compile-before-match, they must make that
  signature change and update every caller/test — list them.
- **R4 (adopt):** strengthen `NEO-MDX-01` with a **decoy-only** `decoy.mdx`
  (fence-embedded needle, no real top-level import) and assert it is never
  collected and contributes no fragment; keep the real-import MDX file that
  fails before / passes after. Fix the mirror citation: the font-content mirror
  is `NEO-PARITY-01` / `NEO-GLOBAL-08`, not `NEO-SYNC-01`.
- **R5 (captain ruling — record it):** on MDX compile failure, **abort with
  attribution** (a diagnostic naming the file + parse error), not the legacy
  silent `export {}` warn-and-empty. The repo bans silent failure; a broken doc
  must surface. Note this as a deliberate divergence from legacy parity.
- **R6 (captain ruling — record it):** platform coverage is via pnpm
  `optionalDependencies`; the future land must verify install on darwin-arm64
  and linux-x64 (incl. Dagger), not just name `-darwin-x64`.
- **R7/R8 (notes):** `@mdx-js/react@3.1.1` is already in the root lock via
  `reference-docs`; widening `react-stub` remains the right route (pnpm
  isolation, not store absence). Scope stays `.mdx`-only (`.md` excluded),
  matching legacy.

Keep the exact entry points, the ordered phases (Phase 1 remains the
captain-gated dependency install), the `NEO-MDX-01` sketch, and the
before/after target. Make the plan self-contained enough that a future crew can
execute it without reading the Oracle transcript.

Then update `.agents/missions/finalize/ARC3.md`: set STATUS to
`NOT LANDED — plan approved with changes (Oracle); Arc 3 deferred to a follow-up
mission`, record the Oracle verdict + the R5/R6 captain rulings, and point to
`PLAN-mdx.md`.

## Output

Write `.agents/missions/finalize/reports/ARC3.fix.md` (what changed vs the filed
plan) and reply with a short summary. Do not edit any file under
`packages/`.