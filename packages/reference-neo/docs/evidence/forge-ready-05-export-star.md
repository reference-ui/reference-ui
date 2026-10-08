Star fan-out is load-bearing: 6 star edges sit on live style-import paths (2 matrix stations pin the semantics), while the css-value path itself is star-free.

## Counts (export-star lines)

| Area | `export * from` | `export type *` | `export * as` | Files |
|---|---|---|---|---|
| lib/src (authored) | 58 | 0 | 0 | 29 |
| core/src (authored, tracked) | 12 | 6 | 0 | 8 |
| core/src/system/styled (generated, git-ignored) | 47 (.js) + 54 (.d.ts) | 0 | 0 | 8 |
| neo src/tests/playground (authored) | 0 | 0 | 0 | 0 |
| neo world `.reference-ui` (generated, per world) | 0 | 2 | 0 | 2 |
| matrix: icons / mcp / rs-testing / canon-overlay | 1 / 1 / 6 / 8 | 0 | 0 | 4 |
| matrix stations (atomic / styletrace / tasty / atlas) | 1 / 2 / 0 | 0 | 0 / 0 / 2 / 0 | 5 |
| reference-docs (authored) | 0 | 0 | 0 | 0 |

Lib breakdown of the 58: `src/index.ts` 26; 25 component indexes 26 (Toast ×2); `Overlay/shared/index.ts` 3; `core/theme/index.ts` 2; `forms.ts` 1.

## YES: style sites import through these

| # | Barrel | Chain (site → … → def) |
|---|---|---|
| 1 | `packages/reference-core/src/entry/react.ts:5` (`export * from '../system/primitives'`) | `packages/reference-lib/src/components/Tabs/Tabs.tsx:2` imports `Div`/`Button` from `@reference-ui/react` → tsconfig maps to generated `.reference-ui/react`, copied from this entry (packager resolves stars through the copied graph, `packages/reference-core/src/packager/ts/README.md:59`) → star → `packages/reference-core/src/system/primitives/index.tsx` (primitive defs) |
| 2 | `entry/react.ts:8` → `packages/reference-core/src/types/index.ts:1` (type-star chain) | `packages/reference-lib/src/components/Reference/components/shared/MonoText.tsx:3` imports `StyleProps` → react.ts:8 → types/index.ts:1 → `packages/reference-core/src/types/public/index.ts:62` (`export type { StyleProps }`) |
| 3 | `packages/reference-core/src/system/primitives/shared/index.ts:1-5` | The css() site `system/primitives/index.tsx` imports `splitPrimitiveProps` et al from `./shared` (`index.tsx:6-13`) through these stars, then calls `css()` at `index.tsx:32` (css itself arrives via named import at `:4`, star-free) |
| 4 | `packages/reference-rs/modules/atomic/tests/cases/ATM-SITE-55/input/src/star.ts:1` | `Star.tsx:1` imports `css` from `./star` → `Star.tsx:4` css() site; companion `MissDefaultStar.tsx` pins that stars never carry `default` |
| 5 | `packages/reference-rs/modules/styletrace/tests/cases/export_star_package/input/packages/fixture-style-barrel/index.ts:6` | `input/index.tsx:7` imports style-bearing `PackageCard` through the star; behind it `card.tsx:6` is the `Div`/`StyleProps` site |
| 6 | `packages/reference-rs/modules/styletrace/tests/cases/export_star_barrel/input/index.ts:7` | Outward fan-out: entry-side barrel re-exporting `Card` (a `Div`/`StyleProps` site at `components.tsx:7`); spec expects `['Card']` (`spec.ts:12`), so the tracer must enumerate star members |

Scope note: ~94 neo-world files import `{ css }` from `@reference-ui/react` (e.g. `packages/reference-neo/tests/cases/css/NEO-CSS-01/world/src/app.ts`), but `css` is a named export (`entry/react.ts:6`) over a flat generated bundle — the value path never touches a star. Only primitive (row 1) and type (row 2) paths do.

## NO: stars with no style-site traversal

| Barrel | Verdict |
|---|---|
| lib `src/index.ts` (26 stars) | Public API surface; no in-tree style import resolves through it. Books import style symbols direct and only components via barrels (`Tabs.book.tsx:2-3`) |
| lib 25 component indexes (26 stars) | Carry component bindings only, never `css`/`StyleProps` |
| lib `Overlay/shared/index.ts:1-3` | Orphaned: sole consumer `FocusLock.tsx:2` imports the leaf (`../Overlay/shared/events`) directly |
| lib `core/theme/index.ts:6-7`, `forms.ts:10` | No in-tree importers; `src/index.ts:8-15` imports theme leaves directly |
| core `extensions/index.ts:1-2`, `shorthands/index.ts:4-7` | Config-plane. Only in-tree barrel import (`rhythm/utilities.ts:8`) takes the named const at `shorthands/index.ts:9`, not a star member; extensions barrel has no import edge (`bundle.ts:20` is a copy-path string) |
| core `entry/system.ts:20`, `entry/types.ts:26`, `reference/browser/*.ts` type-stars | No `StyleProps`-site traversal found; `Reference.tsx:8-12` crosses the browser type-star with `ReferenceComponentProps`, not `StyleProps`, and makes no `css()` call |
| generated `system/styled` (47 js + 54 d.ts stars) | Live importers use leaf paths (`primitives/index.tsx:5` imports `patterns/box`); no barrel-root importer in-tree |
| world `.reference-ui/styled/{index,tokens}.d.ts:2` | Typecheck-only, emitted by `packages/reference-neo/src/sync/publish/types-bundle.ts:21-24`; value output is flat |
| icons / mcp / rs-testing / canon-overlay / docs barrels | Plain components, pipeline types, test utils, config data; zero `css(`/`StyleProps` traversal (icons src has none at all; docs generated old-shape barrels have no in-tree importer) |
| tasty `TST-RXP-02` (`export * as` ×2), atlas `tests.rs:150` | Namespace-only / synthetic non-style graph; no style content |

Slice note: Slice 3 (module graph) must implement star fan-out for value (rows 1,3,4,5) and type (row 2) edges plus entry-side member enumeration (row 6); the star-free css-value path is the control case.
