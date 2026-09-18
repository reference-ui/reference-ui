# SITE — extraction shapes through Neo

SITE proves the extract boundary end to end: which call sites and JSX
shapes become utilities in a synced world, and which fail closed with a
diagnostic and no ghost class. The engine (Atomic extract + styletrace)
decides what is a site; Neo proves the decision paints — or provably
paints nothing — in a browser. Host surface is small:
`src/sync/compile-files.ts` (what gets scanned) and
`src/sync/jsx-elements.ts` (which tag names are hosts).

## Dialect

Authors write `css()` / `css.object()` calls (single- and multi-arg),
local `const` style objects, identifier spreads, literal ternaries and
`&&` spreads, import aliases (`css as c`) and namespaces (`ui.css`), and
StyleProps on primitives or configured `jsxElements` hosts — including
`css={{}}`, `_hover={{}}`, and boolean attrs (`<Div border />`). A local
function named `css` is not a site; dynamic call values (`color:
pick()`) warn and skip without erasing static siblings.

## Engine stations

All confirmed present 2026-09-17 (`ls` + README in
`packages/reference-rs/modules/atomic/tests/cases/`): ATM-SITE-01..18
(13 landed with RS-5, 17 with the RS-14 station, 18 with RS-19),
ATM-LEAF-07, ATM-FORBID-02, ATM-COND-11. Key leans:
SITE-05 (both ternary arms), SITE-06/11/16 (const / spreads /
cross-file), SITE-08 (styletrace + imports, never PascalCase),
SITE-10/15 (import-bound identity), SITE-14 (css prop), LEAF-07 +
FORBID-02 (dynamic warn-and-skip), COND-11 (string `@media` is an
at-rule). ATM-SITE-13 is the empty-host-set fail-closed diagnostic
(RS-5 landed), proven by NEO-SITE-14; ATM-SITE-18 is the boolean
`border` macro (RS-19 landed), proven by NEO-SITE-13. ATM-SITE-53 is
scope-aware identifier resolution (SPEC-V2-75 landed), proven by
NEO-SITE-27.

## Decisions

D11 (literal ternary arms both compile, runtime picks; dynamic values
diagnose, never ghost; hosts from imports + `jsxElements`, never
PascalCase) governs SITE-01/06/12. D12 / RS-1 (frozen
`NativeCompileRequest` carries `jsxHosts`) governs SITE-11: the host
list travels on the frozen request, not a private shape.

## Approved absences

- **Tagged templates** (`` css`…` ``): engine station only (ATM-SITE-12
  refuses: no wants, no diagnostic); no browser case — the object form
  is the only author API.
- **Vue/Svelte**: Panda extracts SFCs; Neo worlds are source TSX for
  React 19 only.
- **Compiled JSX runtimes** (automatic-runtime helpers): worlds are
  source TSX, not bundled output.
- **`importMap`**: Panda remaps `@pandacss/dev` outdir imports; Neo
  scans Reference runtime imports only (no config field, deliberate).
- **`matchTag` / PascalCase guessing**: anti-goal; NEO-SITE-12 proves
  the opposite (unlisted `<Random>` is not a host).
- **`token()` inlining**: Panda parse-time hex eval; Reference authors
  write `{path}` refs (TOKEN group).
- **`css.raw`**: Panda composition API; Neo has `css.object()` plus
  plain objects.
- **Whole-object `css(styles)`**: passing an entire const object as the
  call argument emits nothing (N0 2026-09-17; RS-14 covers arms/member/
  spread only). Authors inline, spread, or select members (SITE-01/02/03).
  The silent 0/0/0/0 is documented, not diagnosed — a future RS row may
  claim it.
- **Element-access refusal**: reads (`map['k']`, `map[key]`, computed map
  keys) refuse with a `Dynamic non-literal expression` diagnostic (S1
  probes O1/O2/O3); member access is the only indirection (SITE-02).
- **Computed-key refusal**: computed keys in style objects and
  template-literal values refuse with diagnostics (O4 `Dynamic computed
  property key…`, O8 `Dynamic non-literal template expression…`).

## Out of scope (Panda, not Reference)

| Feature | Reason |
| --- | --- |
| `styled()` factory / `styled.div` | Neo primitives, not Panda factory |
| Patterns pack (`stack`, `box`, `cq`) | Not shipped |
| `cva` / `sva` as author APIs | Neo `recipe()` (RECIPE group) |
| `syntax: 'template-literal'` | Refused by ATM-SITE-12 |
| `jsxFramework` / `jsxStyleProps` modes | One React; explicit `jsxElements` list |
| `strictTokens` / `strictPropertyValues` | Type-level, no browser case |
| `staticCss` config | No Neo field (STATIC group covers pre-generated atoms) |
