STATUS: (answer begins with exactly `STATUS: DONE` or `STATUS: REFUSED`)

# Oracle review — ARC1.review — font-weight-runtime-1008

## Read-only arc review of a pinned commit

Pinned commit: **`977593fc6`** — "fix(neo): scope bare weight against the active
family in runtime css()". Judge the commit as frozen. You may read the working
tree only to understand context; the review target is the commit.

## Arc intent

Close the runtime half of the font-weight fix. `PLAN.oracle` established that
the docs render through the runtime resolver
(`packages/reference-neo/src/runtime/css/css.ts` → `name()` →
`interpretLowering` → `weightPairs` in
`packages/reference-rs/modules/atomic/js/namer/lower.ts`) and that the Oct 7 pass
fixed only the Rust static resolver (`resolve/font/scope.rs`). This arc ports
that scope pass into the runtime.

## Changed files (at the pinned commit)

- `packages/reference-neo/src/runtime/css/scope.ts` **(new)** — 1:1 TS port of
  `scope.rs` `apply_to_wants` over `NamerRequest[]`: `isFamilyKey`, six-keyword
  constant gate, `scopeWeightName`, same-`when` win / base fallback / conflict
  decline (`applyFamilyScope`).
- `packages/reference-neo/src/runtime/css/css.ts` — `applyFamilyScope(queries)`
  after all `collectStyle` calls, before the naming loop (per-`css()`-call; F1).
- `packages/reference-neo/src/runtime/css/css.test.ts` — extended TABLES (F5) +
  12 integration cases.
- `packages/reference-neo/src/runtime/css/scope.test.ts` **(new)** — 10 unit
  cases (8 runtime-applicable `scope.rs` cases + guards; the static-only
  global-block case is F9-excluded).
- Mission notes: `BRIEF.md`, `LOG.md`, `briefs/`.

`lower.ts` and the namer contract are deliberately unchanged (F7/F4).

## Prior verification (captain, firsthand)

- `pnpm exec vitest run src/runtime/css` → **76 passed (76)**, 5 files.
- `pnpm agentneo q` → 0 errors (26 warnings; two over the warn line only:
  `css.test.ts` 375 lines vs 365, one 83-line describe vs 80).
- Objective cells asserted: `css({font:'sans',weight:'thin'})` → `font-weight_200`;
  serif/mono normal → 373/393; lone thin → 100; cross-arg `css({fontFamily:'sans'},{weight:'thin'})`
  → 200; conflict declines to 100.

## Plan review corrections this arc must satisfy (from PLAN.oracle)

F1 per-`css()`-call granularity; F2 scope runtime dynamic strings; F3 string
queries only + responsive interim; F5 TABLES must make lowering observable; F6
port the six-keyword constant (do not read `tables.weightKeywords`); F7/F4 no
`lower.ts`/contract change.

## How it connects to neighbouring arcs

- Arc 2 (seam): extend `NEO-NAMER-02` world so runtime classes equal the static
  `ATM-COND-05` pins. This arc's behavior is what Arc 2 pins.
- Arc 3 (docs proof): rebuild the docs bundle (the fix ships in `react.mjs`,
  not CSS), assert computed `font-weight` on `/typography` and `/fonts`, update
  the `fonts.mdx` dynamic bullet.

## What I want back

- Architecture and system fit: is `scope.ts` a faithful port of `scope.rs`, and
  is the wire-in point correct for the per-call contract?
- Hidden assumptions: ordering (scope before naming), mutation safety, `when`
  grouping, importance handling, interactions with `mergeStylePlans`, eviction,
  responsive lowering, and the miss probe.
- Robustness and test adequacy: is anything under-tested? Do any tests pass
  vacuously?
- Seams with Arc 2/3: what must Arc 2 pin, and what must Arc 3 prove?
- Findings in the skill's format (ID, severity, file:line at `977593fc6`,
  evidence, recommendation, validation gap; P4 for non-repair observations).
- Verdict: clear / findings / refuse; and whether this slice can merge while any
  gaps become the next tasks.
- Do not ask the owner to choose.
