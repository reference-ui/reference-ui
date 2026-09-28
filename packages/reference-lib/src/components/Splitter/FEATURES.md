# Splitter features

Design-gated follow-ups: each needs a product, UX, or API call before
implementation. Provenance in DECISIONS.md.

## Required controlled `value` + v2 Root contract

**What it does:** Replaces the shipped dual-mode prop contract with a
single controlled contract: `value` is required, uncontrolled state is
gone, and the Root sheds props that belong to Handles.

**API:**

```tsx
<Splitter.Root value={sizes} onChange={setSizes} onChangeEnd={commitSizes}>
  {/* no defaultValue, no Root disabled/display/flexDirection */}
</Splitter.Root>
```

`value` is a required percentage array summing to 100; `onChange`
requests each changed complete array; `onChangeEnd` fires the last
requested layout once per interaction.

**Maintainer take:** Right direction for a v2 major, but only together
with the `min`/`max` rename as one breaking release with a codemod.

## Panel `min`/`max` + DOM-order registration

**What it does:** Renames constraint props to short `min`/`max`
(supporting measured strings), drops the `index` prop in favor of DOM
registration order, and removes flex overrides from the Panel/Handle
style surface so apps cannot fight the kernel.

**API:**

```tsx
<Splitter.Panel min={10} max="320px">…</Splitter.Panel>
{/* no index prop; order = DOM order; no flex/flexGrow/flexBasis */}
```

Numbers are percentage points; strings are measured lengths resolved
against available Panel-axis size.

**Maintainer take:** The rename is worth doing exactly once, in the
same breaking release as required `value`.

## Measured CSS-length constraints

**What it does:** Lets `min`/`max` take CSS lengths (`"120px"`,
`"10rem"`, `"12r"`, `"20%"`) resolved against available group size
(Panel-axis sum, Handles excluded), converted at pointerdown capture
and on idle resize, never per move.

**API:**

```tsx
<Splitter.Panel min="240px" max="10rem">…</Splitter.Panel>
```

`%` strings are of available size; `r` resolves through the spacing
root. Math helpers (`parseCssLengthToPx`,
`resolveConstraintToPercentage`) are already in the tree, unwired.

**Maintainer take:** Worth adding when the first fixed-sidebar consumer
appears; needs the SSR story and the parse-failure diagnostic decided
first.

## CSS-variable geometry contract

**What it does:** Switches the layout write target from inline
`flex-basis` React-state writes to custom properties: each Panel
publishes `--reference-splitter-panel-size` and sizes via
`flex: 1 1 var(--reference-splitter-panel-size)`; the Root publishes
`--reference-splitter-1..N` in Panel order for consumer CSS to read.

**API:**

```css
/* consumer CSS can now read per-panel sizes */
.my-chrome { width: var(--reference-splitter-1); }
```

Splitter never writes inline `flex-basis`/`width` or
`grid-template-*` as a competing signal.

**Maintainer take:** Good as the hot-path write target for the frame
budget, but it is an observable-DOM change that needs HQ sign-off.

## Pointer-session frame budget

**What it does:** Replaces commit-per-move dragging with a session
architecture: one layout read at pointerdown, per-move origin-plus-delta
solve with CSS-var ref writes and a single `onChange`, zero React
commits, layout reads, length conversions, ARIA writes, rAF schedules,
or listener churn until pointerup.

**API:** No new props — a performance contract proven by
`SP-PERF-01`–`SP-PERF-07` (origin-relative math already landed; the
session around it did not).

**Maintainer take:** The highest-leverage perf investment here, but it
is a rewrite-class drag loop that must land with measured constraints
and the CSS-variable contract.

## Collapse restore memory + dynamic panels

**What it does:** Keys remembered expanded sizes by stable Panel id
(React key), never array position, so reorder/insert/remove keep,
isolate, and never cross-inherit memory; programmatic value changes
crossing the collapse boundary update collapsed hooks silently; invalid
transient trees fail locally with a diagnostic.

**API:** No new props — a state-model contract over the existing
`value` array (positional, atomic value/order updates).

**Maintainer take:** Needed for any dynamic-panel consumer, but the
reinsert-recovery semantics (may vs. must) and the invalid-tree
diagnostic wording need HQ answers first.

## Disabled/blocked Handle determinism

**What it does:** Makes `aria-disabled="true"` mean "cannot act":
explicit `disabled` and computed infeasibility (both adjacent Panels
pinned at bounds) both surface as disabled with no resize on any key or
drag, with deterministic focus behavior and pinned multi-Handle tab
order.

**API:** No new props — every feasible Handle is a `tabIndex=0`
separator in DOM order; blocked Handles report `aria-disabled`.

**Maintainer take:** Good a11y hardening, blocked on one UX call:
focusable-but-inert vs. leaving the tab order.

## Drag denominator is the Panel-axis sum

**What it does:** Divides measured-constraint conversion and
pointer-delta mapping by available group size (Panel-axis sum, Handles
excluded) on both axes, so percentages describe Panel space and flex
recipes agree with the solver.

**API:** No new props — e.g. `min="100px"` in a 516px Root with a 16px
Handle resolves to 20, not ~19.4.

**Maintainer take:** Correct by definition once measured constraints
exist, but it changes shipped drag feel on thick Handles, so it ships
only as part of that reviewed delta.

## Strict structural anatomy errors

**What it does:** Turns malformed trees (bad Handle/Panel alternation,
one-Panel tree, `value` length ≠ Panel count) from lenient renders
into loud, descriptive failures naming the defect before any separator
ARIA, pointer capture, or listeners are installed.

**API:** No new props — same validation already in
`splitter-math.ts`, escalated in severity.

**Maintainer take:** Fail-fast is the right instinct, but throwing
turns today's silently odd trees into crashes, so HQ must pick throw
vs. dev-only error vs. render-nothing-with-diagnostic first.

## Default min floor 0 vs shipped 5%

**What it does:** Decides the implicit minimum Panel size when no
`min` is given: 0 (an unconstrained Panel may shrink to nothing under
drag) or the shipped 5% clamp.

**API:** No new props — a single default plus solver re-proof.

**Maintainer take:** Keep 5% unless HQ explicitly wants
disappearing-by-drag, which also needs a screen-reader story to
distinguish it from `collapsible` collapse.

## 9px Handle vs 24px pointer target

**What it does:** Closes the gap between the visible 9px Handle bar
and the 24px target minimum, either with a wider invisible hit area
(visual stays 9px, neighboring content loses a click strip) or by
growing the visible bar, with a touch-target story for coarse pointers.

**API:** Most likely no new props (pure CSS/geometry), or a `hitSize` /
StyleProps-documented target convention.

**Maintainer take:** The invisible-hit-area option preserves the
signed visuals and is probably right, but HQ must accept the click-strip
trade-off first.

**Status (2026-09-28): LANDED per HQ FULL-BLAST order on the maintainer
recommendation — WITHOUT explicit HQ acceptance of the click-strip
trade-off.** Transparent `::before` strip on the Handle (±8px into each
neighbor, 25px total); 9px visuals and all 7 baselines unchanged. Clicks
within 8px of the Handle now land on the separator instead of neighboring
content. Pinned by the `FEATURES #11` CT test (`elementFromPoint` both
axes).

## Root-level `disabled` freeze or removal

**What it does:** Resolves the undocumented root `disabled` prop:
either freeze it (`data-disabled`, inert Handles, no callbacks, with
new `SP-*` cases) or remove it and let products disable per-Handle.

**API:** Either a specified `disabled?: boolean` on Root with group
announce semantics, or no such prop.

**Maintainer take:** Per-Handle disable plus host `aria-disabled`
likely covers every real need; keep root `disabled` only if a product
shows a whole-group case distinct from "every Handle disabled".
