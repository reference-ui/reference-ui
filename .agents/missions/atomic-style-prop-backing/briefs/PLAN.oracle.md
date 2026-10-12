# PLAN.oracle — mission `atomic-style-prop-backing`

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line. Then review the
shape of the plan below: the direction, the arc decomposition, sequencing and
parallelism (`files`, `depends_on`), which interfaces must be reviewed before
others build on them, and whether the conformity tests land on the right seams.
Name anything the plan misses. Do not edit product code.

## Objective

Decide and land the correct resolution for the confirmed **cross-scope style-value
faint** — a consumer-authored style-prop value on a **prebuilt** component is
minted into a **frozen foreign scope**, so it never has a backing rule — and pin
the class with conformity tests. It is one class, not several.

## Confirmed (two prior consults on this mission — read them)

- `reports/CONSULT.oracle.md` — the icon case is **documented contract, not an
  engine defect**; correct fix is consumer-side. Two product defects surround it:
  **F1** (icon prop surface invites the impossible call) and **F2** (miss
  diagnostic omits the constructed class/system and misattributes the site).
- `reports/CONSULT.generalize.md` — **one general class** spanning icons, **all 26
  lib `PrimitiveProps` passthrough parts**, and every `forwardRef`/aliased shell.
  Closable by neither `jsxElements` nor `staticCss` (both mint into the compiling
  scope only). Per-package bound runtime is the mechanism
  (`reference-icons/dist/createIcon.mjs:3`; `reference-lib/scripts/materialize-runtime.mjs`
  `bundleRewrites`); `Want` carries no target-system (`reference-rs/.../atom/want.rs:14`).
- Existing conformity test is blind: `matrix/tests/chain/T16/src/index.tsx:28-31`
  renders its consumer shells with **zero style values**, so only package-compiled
  atoms are exercised.

## Tension the plan must resolve

`packages/reference-lib/AGENTS.md` **Law 5** says every style-bearing part inherits
StyleProps; the architecture makes consumer style values on prebuilt parts
impossible. So either the type surface is made honest (BAN) or the engine gains
cross-system values (FIX). The sibling consult recorded F3 (cross-system wants do
not exist; "no repair") but that judgment predates the lib-wide blast radius.

## Direction proposed (this is the thing to review)

**Staged, two arcs, decision gate after Arc A.**

- **Arc A — land now, shippable.** Icons surface honesty (F1), the diagnostic fix
  (F2), and the conformity tests that pin the class. Small; does not touch lib's
  24-component surface.
- **Arc B — decide, then land separately.** The lib-wide model. Recommend making
  the type surface honest (BAN: passthrough parts accept `className`/`style`/native
  + a restricted, package-compilable token surface, not the full StyleProps), with
  FIX (target-system wants) recorded as a deliberate, larger alternative requiring
  its own plan. Law 5 is amended in the same arc.

## Arcs, tasks, sequencing

- **A1 · icons surface (F1)** — `packages/reference-icons/src/types.ts`,
  `createIcon.tsx`. Route consumer-controllable values off the package `css()`
  channel: either narrow `MaterialSymbolIconProps` to the paintable surface
  (`size`/`variant`/`style`/`className`/native) or apply `color` via inline
  `style` so it is system-agnostic like `size` already is. Depends on: nothing.
- **A2 · diagnostic (F2)** — `packages/reference-neo/src/runtime/css/css.ts:125`
  (+ `miss.ts` formatting). Include the constructed class, system-qualified;
  treat site capture as best-effort. Depends on: nothing. Parallel with A1.
- **A3 · conformity tests** — `matrix/tests/chain/T16` (extend) or new `T17`, plus
  a `packages/reference-neo` fast-loop twin. Depends on: A1 **for the polarity of
  the assertion** (paint vs refuse). Sequence after A1.
- **A4 · docs consumer fix** — `packages/reference-docs/src/content/diagrams/specimen-tones.tsx`
  stop passing `color` to icons; docs-scoped class on a wrapping `Span` (SVG is
  `fill="currentColor"`). Independent of A1–A3; can land with the diagram work.
- **B1 · lib model decision (Arc B)** — advisory: a focused consult to rule
  BAN vs FIX for the 24 components, then land. `review: oracle`.

## Conformity tests (assertion shape)

A consumer passing a token style-prop value to a prebuilt component must either
**paint that value with zero miss warnings** (FIX polarity) or **be rejected**
(BAN polarity). Venues:
1. `matrix/tests/chain/T16` extension / `T17` — hermetic, required: add
   `<ContentCopyIcon color="<token>">`, a styled fixture badge, and a lib
   passthrough part (`<Field …>`), assert computed paint + existing zero-miss and
   every-class-backed gates. Red today by construction.
2. `packages/reference-neo` NEO-CHAIN-style case — fast inner loop, genuine
   upstream package + downstream consumer.
3. `packages/reference-rs/modules/atomic` — optional one-line namer pin: a want
   compiled under system A never backs a class minted under B.

## Verification

`pnpm agent verify <Component>` / `pnpm agent playwright …` (test-core) for matrix;
`pnpm agentneo run <case>` for the neo twin; `pnpm agentrs q` + `pnpm agentrs c`
for the extractor; `pnpm agentdocs q` for the docs consumer fix.

## Commits (hygiene)

Engine only, separate commits: (1) A2 diagnostic — `reference-neo`; (2) A1 icons
surface — `reference-icons`; (3) A3 conformity tests — `matrix` (+ neo case);
(4) A4 docs consumer — `reference-docs`, kept apart from the engine commits.

## Questions for you (PLAN.oracle)

1. Is the staged direction right, or should the whole class be one engine arc?
2. Arc B: BAN or FIX for the 24 lib parts? Does F3 ("no cross-system wants")
   still hold given Law 5, or is a target-system `Want` the correct repair?
3. Are the conformity-test seams right; anything missing or mis-scoped?
4. Sequencing/parallelism: is A1→A3 the only hard dependency?
