PASS — a dynamic `css({ color })` site paints `red` from a hand-added atom while the string lives only in an array, with zero runtime edits.

| Item | Value |
|---|---|
| Verdict | PASS (pre-station for `NEO-CSS-14`) |
| World root (`/tmp` only) | `/tmp/forge-ready-06/world/` |
| Driver | `/tmp/forge-ready-06/probe.mjs` (repo `sync` + repo `runCase`, sync flag off) |
| Spec | `/tmp/forge-ready-06/specs/paint.spec.ts` (headless, served over ephemeral HTTP) |
| Control | `pnpm agentneo run NEO-MERGE-06` → PASS (dynamic-miss baseline still green) |
| Runtime edits | None — `git status` shows only siblings' untracked evidence files |

## World files

| File | Role |
|---|---|
| `world/ui.config.ts` | `defineConfig({ name: 'ready-06', include: ['src/**/*.{js,ts,tsx}'] })` |
| `world/index.html` | `#probe` div, styled sheet link, `@reference-ui/react` importmap, `dist/src/app.js` entry |
| `world/src/app.ts` | `const palette = ['red', 'blue']`; `paint(shade: string) { return css({ color: shade }) }`; `el('probe').className = paint(palette[pick()])` where `pick()` reads `location.search` |
| `world/src/global.ts` | `body { color: #111111 }` resting ink |
| `case.json` | `{"id": "READY-06", ...}` with no `sync` flag, so the runner serves without re-syncing |

`'red'` occurs in exactly one source position: the `palette` array literal. It is in no static `css()` position, no token leaf, no stylesheet.

## Observed evidence (in run order)

| # | Observation |
|---|---|
| 1 | Repo `sync` emits `Dynamic non-literal identifier 'shade' ... for prop 'color' (app.ts:24:23)` — the site is refused, same code as the MERGE-06 control |
| 2 | Pre-edit: `stylePlans: 0`, `ready-06__` utilities in sheet: `0`, `c_red` in `react.mjs`: `0` — the extractor minted nothing |
| 3 | Hand-edit (the emulated harvest): +1 plan `{"system":"ready-06","when":[],"prop":"color","value":"red","important":false,"declarations":[{"slot":"color","className":"ready-06__c_red"}]}` in `styled/runtime-data.mjs` **and** its inlined copy in `react/react.mjs`, +1 rule `.ready-06__c_red { color: red; }` in a `@layer utilities` block. Shape copied from the NEO-CSS-07 freestyle plan (`rgba(...)` → `neo-css7__c_rgba...`) |
| 4 | Headless spec PASS: `#probe` class is exactly `ready-06__c_red`; `getComputedStyle(el).color` is `rgb(255, 0, 0)`; zero console diagnostics on load (hit warns nothing) |
| 5 | Negative arms: `__cssProbe('blue')` → `''`, `__cssProbe('hotpink')` → `''`, one dev diagnostic each naming the value — the unharvested twin and the unwritten color paint nothing |
| 6 | Artifacts: `/tmp/forge-ready-06/.artifacts/READY-06/screenshot.png`, `a11y.yml` |

## Why no runtime change was needed (line-cited)

| Claim | Cite |
|---|---|
| `css()` looks up the authored string as the five-tuple `[system, when, prop, canonicalValue, important]` | `packages/reference-neo/src/runtime/css/plans.ts:56-72` |
| A hit returns the precomputed class; a miss returns nothing plus one dev warn | `packages/reference-neo/src/runtime/css/css.ts:72-91`, `css.ts:193-202` |
| Sync fans the compile result out to both `styled/runtime-data.mjs` and `react/react.mjs` (which inlines the styled artifact and calls `registerRuntimeData`) | `packages/reference-neo/src/sync/index.ts:111-116`; observed `// .../styled/runtime-data.mjs` + `var runtimeData = {...}` + `registerRuntimeData(systemName, runtimeData)` in `react.mjs` |
| The browser reads the `react.mjs` copy, so the probe hand-adds the plan there too — both are generated artifacts, not runtime source | observed: first run edited only `styled/`, spec got class `''`; after the fan-out edit, PASS |
| Mission contract under test ("runtime paints any `(prop, value, when)` the sheet holds and nothing else") | `docs/missions/operation-forge.md:449-454`; stations `docs/missions/operation-forge.md:461-463`; ask `docs/missions/operation-forge.md:1195-1198` |

Slice note: Slice 4's harvest must land the atom in the compile result so publish fans it to both `styled/` and `react/` — a harvest that only reaches one copy leaves the other path dark.
