# Landing C1: lib → core consumption map

Recon, read-only, 2026-09-18. Question: everything `packages/reference-lib`
consumes from `packages/reference-core`, sized against what
`packages/reference-neo` already provides. Starting points
`generated-folder-shape.md` and `coverage-map.md` verified against the live
lib tree; all counts below are live (`rg`/file reads this session) unless
cited to evidence.

Verdict key: **(a)** Neo already provides it · **(b)** gap needing prep
work · **(c)** unknown, needs orbit/proof. Non-touchpoints (verified zero
use) are listed once and dropped.

## 1. Package dependency

`packages/reference-lib/package.json:49`: `"@reference-ui/core": "workspace:*"`
(direct dep). Consumed surfaces:

| Entry | Lib consumer | Neo status |
| :--- | :--- | :--- |
| `defineConfig` (`core/src/public.ts`) | `ui.config.ts:8` — keys used: `name`, `include`, `extends: []`, `debug` | (a) — Neo author surface + generated `system.mjs` both export it; all four keys in Neo's `ReferenceUIConfig` |
| `referenceVite()` (`core/src/vite/plugin.ts`) | `book/vite.config.ts:6,32`; CT inherits via `playwright/vite.config.ts` | (b) — no Neo bundler plugin; see B6 |
| `ref` bin (`core/bin/ref.mjs`) | `sync`, `typecheck`, `build`, `dev` scripts (`ref sync`, `ref sync --watch`) | (b) — `neo sync\|clean` only, no `--watch`; see B6 |
| `core/src/entry/system.ts` | vite alias target for `@reference-ui/system` (bypasses generated `system.mjs`!) | (b) — latent trap F6/F7, must be repointed; see B5 |
| `core/tools/copy-reference-api-component.mjs` | **reverse dep**: core's `prepare`/`prebuild` mirrors lib's `src/components/Reference` into core | (b/c) — ownership unclear after switch; see B1 |

## 2. Generated folder (live verification)

Live `.reference-ui/` matches the evidence census: `react/` (incl.
`react.mjs` 2781 lines, `styles.css` 27k lines), `styled/` (Panda
`css/jsx/patterns/recipes/helpers.js` + `runtime-data.mjs` + `styles.css`),
`system/` (`system.mjs`, `baseSystem.*`, `evaluated-system.json`,
`compile-request.json` with `jsxHosts: ["MonoText"]`, `jsx-elements.json`
101/0/53/154, `font-registry.json`), `types/` (`@reference-ui/types`),
`panda.config.ts`, `virtual/` (336 files, sync-internal — **no lib reader**,
verified), `tmp/`, `book-perf.jsonl`.

## 3. Touchpoint inventory

### (a) Neo already provides

- **A1 — Authoring APIs.** 31 lib-src files import `tokens`/`font`/`keyframes`/
  `globalCss` from `@reference-ui/system` (+`getRhythm`/`extendPattern`
  exported but unused by lib). Neo `writeSystemDir` emits all five with
  matching `__ref*Collector` keys (`src/sync/publish/system.ts`).
- **A2 — 101 primitives.** Tag parity verified 101/101 (Neo `tags.ts` vs
  core bundle export block). `data-layer` first-stamp + inherit, `css` /
  `colorMode` / `variant` props all in Neo's factory.
- **A3 — `recipe()` value.** Lib's only recipe call is `SummaryChip`
  (`base` + `variants` + `defaultVariants`, no compounds); Neo runtime +
  extraction support all four. (`css` value: zero lib imports.)
- **A4 — Contexts.** `LayerScopeContext` + `DocumentContext` (`Portal.tsx`),
  `ColorModeContext` (`Portal.test.tsx`); Neo exports all three plus
  `useColorMode`, `Symbol.for`-shared (cross-copy safe).
- **A5 — Type graph.** `StyleProps` (18×), `PrimitiveProps` (77×),
  `PrimitiveElement` (7×), `PrimitiveTag`, `RecipeVariantProps`,
  `SystemStyleObject`, `CssStyles` — all present in Neo's `react.d.mts`
  (wide→narrowed via typegen `styled/types/index.d.ts`, wired in
  `publishTypesBundle`). Unused-by-lib names (`FontRegistry`,
  `FontName`, `BaseSystem`, `HTML_TAGS`, `ResponsiveProps`, …) verified
  zero hits in src+book: not touchpoints.
- **A6 — Stylesheet specifier.** `import '@reference-ui/react/styles.css'`
  (`BookDecorator`, `playwright/main.tsx`, `global.d.ts`); Neo writes
  `react/styles.css` + `./styles.css` export (D5 landed).
- **A7 — JSON artifacts.** `evaluated-system.json`, `jsx-elements.json`,
  `compile-request.json`, `runtime-data.mjs` (+`.d.mts`): Neo writes all.
- **A8 — `baseSystem` value + paths.** `src/index.ts:7` re-exports
  `../.reference-ui/system/baseSystem.mjs`; `files[]` + `build-package.mjs`
  pin the same two paths; Neo writes both + `./baseSystem` export.
  (Shape differs — see B4. Lib reads no fields, only re-exports.)
- **A9 — Package names + links.** `@reference-ui/{react,system,styled}`
  specifiers; Neo `linkGeneratedPackages` replaces Panda symlinks.

### (b) Gaps needing prep work

- **B1 — `@reference-ui/types` (D19, largest blocker).** 11 lib-src files
  under `src/components/Reference/` import runtime
  (`ReferenceRuntimeProvider`, `createDefaultReferenceRuntime`,
  `useReferenceDocumentFromContext`) + document types
  (`ReferenceDocument`, `ReferenceMemberDocument`, `ReferenceSymbolRef`,
  `ReferenceJsDoc`, …). Neo has no `types/` emitter; `book/vite.config.ts`
  + `tsconfig.json` also alias it. 13 files cannot build under Neo until
  the Reference-browser leg ships (coverage-map note b).
- **B2 — Color-mode attr rename.** Lib pins `data-panda-theme` in 4 owned
  files: `book/decorator/BookDecorator.tsx:19`,
  `playwright/main.tsx`, `src/components/Portal/Portal.test.tsx`,
  `Portal/__e2e__/Portal.ct.spec.ts`. Neo stamps `data-color-mode` (D1,
  human override; `data-theme` belongs to Toast chrome). Mechanical
  lib-side edits, must land atomically with regeneration.
- **B3 — `ref`-as-prop vs `forwardRef` × React 17/18 CT.** Neo factory is
  ref-as-prop (React 19 only). Lib forwards refs into primitives in 10+
  components (`Slider.tsx:566`, `Tabs`, `Tree`, `Field`, …) and CT runs
  React 17/18/19 (`playwright/runtimes/`). Under 17/18, `ref` arrives as a
  dead prop: CT failures + broken consumer refs. Needs a compat decision
  (forwardRef shim for old React vs dropping 17/18 from CT) before landing.
- **B4 — `baseSystem` shape change.** Core emits `{name, fragment-string,
  css, jsxElements}`; Neo emits JSON `PortableBaseSystem`
  (`schemaVersion`, `fragments[]`, `cssChunks[]`, `runtime`,
  `jsxElements[]`). Lib only re-exports, but downstream `extends[]`
  consumers take the object. Verify matrix/apps readers before cutover.
- **B5 — Build + resolver rewiring (one flag day).**
  `scripts/materialize-runtime.mjs` copies `react/`+`styled/` and rewrites
  `styled/css|jsx|patterns/*` specifiers that will not exist;
  `build-package.mjs` asserts `styled/css/index.js` in dist; `tsup.config.ts`
  externals the styled regex (harmless once dead); `tsconfig.json` paths
  pin `styled`, `styled/jsx`, `types`; `book/vite.config.ts` pins literal
  `react.mjs`, styled/types dirs, and `system → core src` (F6/F7 trap).
  All must change in lockstep with the first Neo regeneration.
- **B6 — Sync CLI + watch + Vite plugin.** `ref sync` in 4 npm scripts,
  `ref sync --watch` in `dev`, `referenceVite()` in book+CT. Neo has
  `neo sync|clean` only. Dev loop and CT harness need a Neo hook (or a
  prebuilt-folder workflow) before lib can point at Neo daily.
- **B7 — `jsxElements` declaration.** Lib's `ui.config.ts` declares no
  `jsxElements`; core auto-discovered `MonoText` (+53 local). Neo takes
  `config.jsxElements` explicitly (`resolveJsxElements`; `primitives: []`
  by design). One-line prep (`jsxElements: ["MonoText", …]`) + proof that
  `MonoText`'s `css`-prop extraction still fires.

### (c) Unknowns (orbit/proof decides)

- **C1 — Sheet byte-parity.** 27k-line `styles.css`: layer order,
  preflight, var names, `color-mix` output, `_file`/`_dark` lowering.
  Nothing in recon predicts the diff size — orbit diffing decides whether
  snapshots avalanche.
- **C2 — Full typecheck.** Lib `tsc --noEmit` covers src+book+playwright
  against core's deep decl dirs (`react/{entry,system,types}`,
  `system/{entry,lib,system,types}` 41 files). Neo's flatter decls *should*
  satisfy it (C2 owns this verdict).
- **C3 — Tasty behavior inside `types/`.** `manifest`/`runtime` semantics
  ride with D19; uncaptured here.
- **C4 — CT pixel parity.** Snapshots are the final gate (C3 + landing);
  `css`-prop heavy components (`Tree`, `Listbox`, `Reference*`) are the
  likeliest drift sites.

## 4. D17 strictTokens verdict: NOT load-bearing for lib

`strictTokens` is **not consumed by lib and safe to leave absent**:

- Zero hits for `strictTokens`, `WithEscapeHatch`, or `strict:` across
  `src/`, `book/`, `playwright/`, `ui.config.ts` (case-insensitive `rg`).
- `ui.config.ts` sets no `strict` key; lib never imports strict
  color/radii narrowing types.
- The only strict pins in range are **matrix** contracts
  (`matrix/typescript/src/strict-tokens.assertions.ts`), which test core's
  pipeline, not lib consumption. They stay green on core and are out of
  scope for the lib switch; matrix owners need a later strict leg if they
  ever move off core.

The D17 approved absence stands. No prep work required.

## 5. Top-5 switch risks

1. **D19 `types/` leg kills 11 Reference files on day one.** Only hard
   blocker: real files fail to build, not edge cases. Nothing else in
   this report is in its league.
2. **Sheet parity → snapshot avalanche.** If Neo's assembled sheet differs
   in layer order/preflight/var naming, every CT snapshot and Book story
   shifts at once. Mitigation: orbit diff *before* landing, not after.
3. **Ref-as-prop vs React 17/18 CT.** Silent ref breakage under old React
   (B3) — a compat decision, not a bugfix, and it must precede the switch.
4. **Flag-day surface.** Attr rename (B2) + build/resolver rewiring (B5) +
   `jsxElements` (B7) must land atomically with the first Neo-generated
   `.reference-ui/`; any half-state is a red tree. Small individually,
   risky in combination — sequence it as one landing commit.
5. **`baseSystem` shape + downstream `extends[]`.** The one contract change
   that escapes the lib tree (B4). Lib itself is immune (re-export only);
   unknown downstream readers are the risk — enumerate them before cutover.
