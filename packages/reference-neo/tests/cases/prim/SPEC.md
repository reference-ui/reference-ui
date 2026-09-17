# PRIM — native primitives

The PRIM group proves the generated `@reference-ui/react` entry: the 101
tag components, the `css`/`recipe` bindings over compiled plans, and the
DOM contract (`data-layer`, `data-variant`, `data-color-mode`). Style
values lower in the engine; this group proves they paint through a
primitive and that metadata and DOM props land where they should. Owns
`src/primitives/**` and `src/sync/react.ts`.

## Dialect

Authors render `<Div p="4" _hover={{ color: "brand" }} css={{ m: "2" }}>`
plus plain DOM props (`id`, `aria-*`, `data-*`, handlers, `ref`) and two
metadata props: `variant` (stamps `data-variant`, selects a recipe class)
and `colorMode` (stamps `data-color-mode`). There is no polymorphic `as`,
no `Box`/`Flex`/`Grid` component (Panda patterns, never primitives), and
`variant`/`colorMode` are never style props. Generated filenames follow
D5 (`react/react.mjs`, `react/react.d.mts`, `react/styles.css`); SYNC-05
lands the names, PRIM-10 pins the surface (cross-ref).

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-SITE-14 (`css`
prop extracts like `css()`), ATM-COND-02 (`_hover` → `:is()` twin),
ATM-COND-03/08 (`_dark`/`_light` → `[data-color-mode=…]`), ATM-LEAF-05
(array values onto the breakpoint scale, `null` holes skip). RS-7 is
done: goldens emit `data-color-mode` (verified in ATM-COND-08
`output/styles.css`), so PRIM-07 is unblocked. No row needs a new RS
slice. Atomic-claims §6: only P0 #1 (colour-mode islands) lands here;
P0 #2–#7 and the rest of P1 belong to COND/RESP/CSS/MERGE (see those
SPECs). Coverage-map rows 18/20 (react entry names + decls) land in
PRIM-10 alongside SYNC-05/TYPE-01.

## Decisions

D1 (colour-mode attribute `data-color-mode`; RS-7 done, proven by
PRIM-07 alongside COND-04/TOKEN-05). D5 (generated filenames; SYNC-05
lands, PRIM-01's `index.mjs` assert flips in that slice).

## Approved absences

- `Box`/`Flex`/`Grid` as components: Panda pattern pack, not lib
  primitives (generated-folder-shape §7 item 2; PLAN host-build Step 6).
- Polymorphic `as`: core never had it; each tag renders its own element.
- Panda `cx` / `splitCssProps`: replaced by `joinClassName` /
  `createPropSplitter` over compiled names (core-api-parity §2.3).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| `styled()` / jsx-factory components | No factory in the dialect; primitives only |
| `Box`/`Flex`/`Stack` pattern fns | Pattern pack, not shipped |
| `data-panda-theme` / `data-theme` colour mode | D1: single `data-color-mode` stamp |
| Liquid `primitives.liquid`, `forwardRef` codegen | Dropped; string gen + React 19 ref-as-prop |
| `slot` recipes (`sva`) on primitives | Refused author API; multi-part is authored React |
