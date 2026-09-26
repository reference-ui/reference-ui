# PATCHES Combobox crew log

Status: IN PROGRESS

## Brief
Implement `packages/reference-lib/src/components/Combobox/PATCHES.md` exactly (2 items), nothing else.
Branch: reference-system. Touch ONLY Combobox dir + this log.

## Items
1. ShadowRoot contract + cross-engine parity (CB-ENV-03/04): portal into focus source's containing open ShadowRoot; composed paths; identical callback order.
2. Single layer + single dismissal sequence (CB-CLOSE-03): one layer registration, one granular-before-high-level dismissal, shared Popover positioning.

## Plan
- Item 2: pin with CT (layer accounting via overlayStackStore + ordered dismiss log); fix code only if a double-sequence shows.
- Item 1: resolve popover container to source ShadowRoot in ComboboxPopover (light-DOM path untouched); pin Chromium shadow behavior with CT; Firefox/WebKit matrix runs are harness-owned (flag).
- Prove: pnpm agentct Combobox green; snapshots unmodified.
- UX: nested ux-designer review of delta (or self-review by method, flagged).

## Work

- Item 2 (CB-CLOSE-03): no code change needed — verified single layer +
  single ordered dismissal already holds (Combobox input Escape
  preventDefaults, so Overlay's document listener skips; outside press
  flows through one Overlay dismiss). Pinned with 2 new CT tests
  (Escape + outside fixtures) against live layer accounting.
- Item 1 (CB-ENV-03): code change — `shadowContainerForSource` helper in
  `combobox-context.ts` + portal-container resolution effect in
  `ComboboxPopover` (`Combobox.tsx`). Light-DOM path untouched (no
  container set). Pinned with 1 unit test + 1 Chromium CT shadow test
  (destination, focus, scroll, composed paths, exact callback order).
- Test fixes during iteration (both mine, not code): controlled-input
  commit log has no `input:<label>` echo; shadow chrome-click needed
  inline popover padding (theme classes don't pierce shadow).
- Full gate: `pnpm agentct Combobox` → 28/28 e2e (react19), 42/42 unit,
  all pre-existing snapshots passed unmodified.
- Videos: `.webm` artifacts not viewable via read_file (binary); judged
  from test-finished screenshots + assertions instead.
- UX: nested ux-designer child verdict PASS — look unchanged (7
  snapshots green, zero paint-code touched), feel approved (light-DOM
  no-op; shadow in-root destination; single layer + ordered dismissal),
  a11y no findings (same-root activedescendant is an honesty
  improvement). Artifacts: CT finished-PNGs for the 3 new tests +
  combobox-open/resting baselines + live resting capture.

## Flag
- CB-ENV-04 (Firefox/WebKit identical callback order) and the matrix-CT
  half of CB-ENV-03 acceptance require the matrix harness (test-core,
  Dagger) — CT here is Desktop-Chromium-only and matrix/ is outside
  this crew's touch scope. The exact ordered log pinned in CT is the
  sequence those runs compare against.
- UX child flagged (out of scope, not gating): live Book open currently
  crashes with `Duplicate option value "react"` from Listbox
  registerRenderValue — attributed to the sibling uncommitted Listbox
  delta's guard change under Book StrictMode double-render. Combobox
  delta cannot cause it (light-DOM no-op proven by suite).

Status: COMPLETE
