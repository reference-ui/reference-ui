# Landing C3 — reference-lib test harness map (core→neo switch witnesses)

Recon-only survey of `packages/reference-lib` tests: which harnesses exercise the
styling layer underneath (sheet output, class names, runtime behavior) vs pure
component logic. Read-only; no suites were run (one `--help` probe only).

## 0. How lib consumes the styling layer (what the switch changes)

Lib source has **zero** direct imports of `@reference-ui/core`. It consumes the
pipeline's *generated* output instead:

| Artifact | Path | Size | Role |
|---|---|---|---|
| JSX runtime | `.reference-ui/react/react.mjs` (via `node_modules/@reference-ui/react` symlink) | 112 KB | `Div`/`Button`/… primitives, `css()`/`cva`, `LayerScopeContext`, `ColorModeContext`; bundled from `reference-core/src/system` + `@reference-ui/styled/css` |
| Compiled sheet | `.reference-ui/react/styles.css` | 597 KB | All utility + `ref-*` primitive CSS, loaded by the CT gallery |
| Downstream system | `.reference-ui/system/baseSystem.mjs` | — | Re-exported from `src/index.ts` for `extends[]` |
| Theme input (hand-authored) | `src/core/theme/primitives/*` | — | `ref-button`/`ref-input`/… style objects, `sliderThumb`/`sliderTrack` DSP constants, `focus-visible.ts` modality runtime |

CT gallery (`playwright/main.tsx`) loads `@reference-ui/react/styles.css` plus
`book/app/book.css` (a 15-line reset only) — so **every CT render paints through
the generated sheet**. Vitest resolves `@reference-ui/react` through the same
symlink, so vitest class-name assertions witness the generated `css()` runtime
with no browser.

## 1. Suite inventory

### 1a. Vitest — 29 colocated files (`src/**/*.test.{ts,tsx}`)

Config: `packages/reference-lib/vitest.config.ts` — `environment: 'node'`,
per-file `// @vitest-environment happy-dom` pragma where DOM is needed.

**Styling-layer witnesses (6 files):**

| File | What it asserts | Layer |
|---|---|---|
| `src/core/theme/primitives/forms/button-variants.test.ts` (73 lines) | Primitive style objects verbatim: `.ref-button:where(...)` selectors, token refs (`{colors.ui.button.background}`), `:focus:hover` ring parity, slider track/thumb single-source vs `shared.ts` | L0 theme input |
| `src/core/theme/primitives/forms/focus-visible.test.ts` (94 lines) | Modality runtime: `data-focus-visible` set/cleared on Tab vs pointer, field-parent propagation | L1 runtime behavior |
| `src/components/Tabs/Tabs.test.tsx` (96 lines) | Generated class names (`bg_ui.tab.track.background`, `bg_gray.200`, `c_ui.button.foreground`, `bg_transparent`, `c_design.text.light`) + CSS-var contract (`style.borderBottomColor === 'var(--colors-ui-table-border)'`) | L1 class names + vars |
| `src/components/Combobox/Combobox.test.tsx` (279 lines) | Generated class names on selected option (`bg_ui.button.background`, `c_ui.button.foreground`, `c_inherit`) alongside aria/state logic | L1 class names |
| `src/components/Portal/Portal.test.tsx` (117 lines) | `data-layer` + `data-panda-theme="dark"` attrs emitted through `LayerScopeContext`/`ColorModeContext` | L1 theme attrs |
| `src/components/Slider/Slider.test.tsx` (90 lines) | Inline-style DSP dims (track 6px, thumb 24×16 r4, swapped vertical) — mirrors `shared.ts` constants, weak witness | L1-adjacent |

**Pure logic (23 files, no styling dependence):** `core/measure/*` (3),
`Announcer`, `Tooltip/tooltipGroup`, `Toast/{toastRuntime,toastQueue,promise,ssr}`,
`FocusLock/{candidates,types,ssr}`, `Overlay/{dismiss/inside,geometry/*}` (6),
`Popover/{hover,safe-polygon,ssr}`, `Tooltip/ssr`, `Menu`, `use-measure*`.
(Grep over all 29 test files confirms only the 6 above touch
`className`/`ref-`/`data-focus-visible`/theme attrs.)

### 1b. Playwright CT — 30 specs in `src/components/*/__e2e__/`

Config: `playwright/playwright.config.ts` (`testMatch: **/__e2e__/**/*.ct.spec.ts`,
viewport 800×480, dark, video on, trace on-first-retry, `snap()` helper in
`playwright/ct.ts` wrapping `toHaveScreenshot`, maxDiffPixelRatio 0.02).

- **329 `snap()` calls → 360 PNG baselines** (`__snapshots__/`). Snapshots run on
  React 19 only (`snap()` no-ops off 19).
- Every spec is at minimum a **coarse visual witness** (renders through the
  generated sheet). Specs with *explicit* style assertions (ranked by density):

| Spec | `toHaveCSS` | `toHaveClass` | `getComputedStyle` | theme-attr | `snap()` | Notes |
|---|---|---|---|---|---|---|
| Toast | 7 | 7 | 14 | 0 | 26 | opacity/transform/bg, styled-vs-unstyled, action/cancel colors |
| Slider | 0 | 0 | 20 | 0 | 9 | focus-outline style across states |
| Overlay | 0 | 0 | 13 | 4 | 3 | bg colors, `body{overflow}` lock |
| NumberField | 0 | 0 | 7 | 0 | 12 | focus-ring parity |
| Portal | 0 | 0 | 4 | 21 | 13 | `data-layer`/`data-panda-theme`, light/dark token resolution |
| Tabs | 0 | 0 | 4 | 0 | 22 | indicator/track paint |
| Field | 0 | 0 | 3 | 0 | 9 | ring/border computed |
| Collapsible | 0 | 0 | 2 | 0 | 13 | — |
| Menu/Combobox/OverlayExotica | 0 | 0 | 1 each | 0 | 8/6/6 | — |
| All other 19 specs | 0 | 0 | 0 | 0 | 1–29 each | behavioral asserts + snapshots only |

Special cases: **Button has no lib source file** (`Button/` = story + `__e2e__`
only) — its CT is a pure end-to-end witness of generated `@reference-ui/react`
`Button` + `ref-button` primitive styles (14 snaps over variants/states).
**Primitives CT** (7 snaps: buttons/forms/disclosure/overview) is the visual
catalog of the same layer.

## 2. Layer-dependence ranking

- **L0 theme input** — breaks if token refs/selectors change: `button-variants.test.ts`.
- **L1 generated runtime** — breaks if `css()` class names, CSS vars, contexts, or
  stamped attrs change: `Tabs`/`Combobox`/`Portal` vitest, `focus-visible.test.ts`,
  `Slider` vitest (weak).
- **L2 computed styles** — breaks if the sheet computes differently in-browser:
  Toast/Slider/Overlay/NumberField/Portal/Tabs/Field CT (see table).
- **L3 visual snapshots** — breaks on any paint drift: all 30 CT specs / 360 PNGs.
- **L4 pure logic** — styling-blind: 23 vitest files; still valuable as
  regression guards that must stay green *through* the switch.

## 3. Run recipes (test-component skill / `pnpm agentct`)

From `.agents/skills/test-component/SKILL.md` + `AGENTS.md`; runner help verified
via probe (`pnpm agentct --help`, exit 0). Run from repo root. Never run raw
`vitest`/`playwright` in subshells (Darwin QoS clamp, port-3101 orphans).

```bash
pnpm agentct <Component>                  # unit (vitest) → e2e CT on React 19 + snapshots
pnpm agentct <Component> --unit           # colocated vitest only (always workspace React 19)
pnpm agentct <Component> --e2e            # Playwright CT only (React 19 + snapshots)
pnpm agentct <Component> --e2e --react 18 # CT on React 18 (behavioral, snapshots no-op)
pnpm agentct <Component> --e2e --react all# CT on 17, then 18, then 19
pnpm agentct <Component> --list           # list tests, no queue slot
pnpm agentct <Component> -g "escape"      # fuzzy name filter
pnpm agentct <Component> --line 509       # deterministic line targeting
pnpm agentct                              # FULL suite (all components, 3-slot daemon queue)
```

Notes: one shared Vite gallery on `:3101` (daemon owns it; `pnpm agentct stop` to
release). Videos (`.webm`) + `test-finished-1.png` per test under
`playwright/test-results/`. Snapshot mismatches print bbox + dominant-color
telemetry. **Baseline rewrites are human-gated**: `--update-snapshots --confirm`
only after showing expected/actual/diff and getting explicit yes; React 19 only.

Raw equivalents (policy-discouraged, for reference only):
`pnpm --filter @reference-ui/lib test` (vitest run),
`pnpm --filter @reference-ui/lib test:ct` (playwright `-c playwright/playwright.config.ts`).

## 4. Top-5 sharpest switch witnesses

1. **`button-variants.test.ts`** (vitest, L0) — asserts the theme-input objects
   themselves (selectors + `{colors.…}` token refs). Fastest tripwire (node env,
   milliseconds); recipe: `pnpm agentct` has no bare-unit path for `src/core`, run
   via `pnpm agent vitest lib -t "button variants"` or colocated file targeting.
2. **`Tabs.test.tsx`** (vitest, L1) — generated `bg_*`/`c_*` class names + the
   `var(--colors-ui-table-border)` contract. Direct `css()`-runtime witness, no
   browser. Recipe: `pnpm agentct Tabs --unit`.
3. **Portal theme contract** (`Portal.test.tsx` vitest + `Portal.ct.spec.ts` L1/L2) —
   `data-layer` / `data-panda-theme` stamping and light/dark token resolution
   across portal boundaries. The `panda` attr name is itself core-pipeline-flavored.
   Recipe: `pnpm agentct Portal`.
4. **`Toast.ct.spec.ts`** (CT, L2/L3) — densest computed-style coverage in lib
   (`toHaveCSS`/`toHaveClass`/`getComputedStyle` ×28: opacity, transforms,
   styled-vs-unstyled, action/cancel colors) + 26 snapshots. Recipe:
   `pnpm agentct Toast --e2e`.
5. **Button + Primitives CT** (`Button.ct.spec.ts`, `Primitives.ct.spec.ts`, L3) —
   Button is 100% generated runtime + sheet (no lib source), so its 14
   variant/state snapshots plus the 7 Primitives catalog snapshots are the purest
   end-to-end sheet witnesses. Recipe: `pnpm agentct Button`, `pnpm agentct Primitives`.

Honorable mentions: Slider CT (20 focus-outline computed checks), NumberField/Field
CT (focus-ring parity), Overlay CT (bg colors + scroll-lock), `focus-visible.test.ts`
(modality runtime), Combobox vitest (class names). L4 suites (measure, Toast
runtime/queue, geometry, safe-polygon, …) are the must-stay-green control group.

## 5. Method note

Inventory via `find`/`grep`/`wc` over `packages/reference-lib/src`,
`playwright/{ct,main}.tsx`, `vitest.config.ts`, generated `.reference-ui/react/`,
the `test-component` skill body, and root `package.json` scripts. Single probe:
`pnpm agentct --help` (exit 0). No test suites executed.
