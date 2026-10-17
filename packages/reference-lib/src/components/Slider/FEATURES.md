# Slider features — needs design

Each item below needs a product, UX, or API decision before anyone writes code. Once a direction is picked, the item becomes implementable.

## Status

- #1 controlled-only value: implemented. `value` is required, and `defaultValue` and internal state are stripped. All in-repo consumers are migrated.
- #2 thumb identity: assigned automatically by mount order (implemented). The `index` prop is stripped, and the old silent `index = 0` default is gone.
- #3 modified-key policy: Shift+Arrow paging is stripped (implemented). All modified arrows pass through; Page keys own large steps.
- #4 dragging data hooks: implemented. Root and the active Thumb carry `data-dragging`, with `data-active` coexisting.
- #5 single-thumb default name: not implemented. It waits on a catalog-wide unlabeled-control policy.
- #6 thumb target size: implemented as an invisible hit area. The `::before` pseudo-element grows the cross axis to 24px; the painted fader cap is untouched.

## 1. Controlled-only `value`

**What it does:** Removes uncontrolled mode entirely — every interaction
becomes a request the parent must accept, matching the freeze and all 58 e2e fixtures.

**API:**
```tsx
// Before (today): uncontrolled allowed
<Slider.Root value={v} onChange={setV} />  // controlled
<Slider.Root defaultValue={[50]} />        // uncontrolled — deleted by this change
// After: value required; SD-CTRL-02 rejection semantics become the only path
<Slider.Root value={v} onChange={setV} />  // the only way
```

**Recommendation:** Good to add — all four Book stories are already controlled, so the strip cost looks near-zero; confirm no out-of-Book consumer relies on `defaultValue` first.

## 2. Thumb identity: auto mount-order index vs explicit `index`

**What it does:** Decides how `Thumb` binds to a value slot — automatic
mount-order identity (no `index` prop, matching the Proposed API) or an
explicit required-per-thumb `index` — and kills the `index = 0` silent
default either way.

**API:**
```tsx
// Direction (a) auto: identity is mount-order positional
<Slider.Thumb aria-label="Minimum" /> // no index; survives cardinality change per SD-DYNAMIC-01
// Direction (b) explicit: index required for multi-thumb
<Slider.Thumb index={0} aria-label="Minimum" />
<Slider.Thumb index={1} aria-label="Maximum" />
```

**Recommendation:** Good to add in either direction, but decide before the matrix re-target — every range fixture must be written auto or explicit, and the silent `index = 0` default must go regardless.

## 3. Modified-key policy: strip Shift+Arrow paging to match the freeze

**What it does:** Picks whether all modified arrows pass through to the
application untouched (Page keys own large steps, per SD-KEY-07) or
Shift+Arrow paging stays as a documented Reference UI extension with a
named freeze exception.

**API:**
```tsx
// Direction (a) strip: no API surface — all modified keys ignored, no preventDefault, no onChange
// Direction (b) bless: Shift+Arrow/Down = Page step (today's behavior), SD-KEY-07 amended with the exception
```

**Recommendation:** Good to resolve now. It is small and self-contained, and it gates SD-KEY-07 re-targeting. Lean toward stripping, unless a modifier-based large step is wanted.

## 4. Documented `dragging` data hooks on Root/parts

**What it does:** Publishes the "dragging data state" the TESTS.md geometry
contract already promises, so apps can style the drag session (today only
the thumb carries `data-active`).

**API:**
```css
/* Proposed: data-dragging on Root + active Thumb for the session duration, cleared on release/cancel */
[data-reference-ui-slider][data-dragging] {
  /* session-active root styles */
}
```
Open: Root + active Thumb, or all parts (Track/Range too)? Does shipped
`data-active` get renamed to match, or do both hooks coexist?

**Recommendation:** Good to add once the parts coverage and naming are pinned — the contract already promises it, so this closes a spec gap rather than inventing surface.

## 5. Single-thumb default accessible name

**What it does:** Gives unnamed single thumbs (which today publish
`aria-label={undefined}`) either a default name, a dev-only warning, or an
explicit documented consumer-owns-naming stance.

**API:**
```tsx
// Direction (a) default name: <Slider.Thumb /> announces e.g. "Value" (the string is a product choice)
// Direction (b) dev warning: single thumb without aria-label/aria-labelledby warns in dev
// Direction (c) documented stance: naming is consumer-owned; docs say so
```

**Recommendation:** Worth deciding, but not per-component. Wait for a catalog-wide unlabeled-control policy so Slider does not diverge from its siblings.

## 6. Pointer target size below WCAG 2.5.8 minimum

**What it does:** Brings the 24×16 thumb token up to the 24×24 WCAG
target-size minimum — by growing the token, expanding the invisible hit
area while keeping the painted DSP fader-cap chrome, or documenting a
conformance exception.

**API:** No API change — token sizing and/or hit-area styling, or a docs exception.
```css
/* Direction (b) sketch: keep the painted cap, grow the hit area */
[data-reference-ui-slider-thumb]::before {
  content: "";
  position: absolute;
  inset: -4px 0;
}
```

**Recommendation:** Good to fix in an a11y-hardening pass with a design eye. Prefer the invisible hit area so the fader-cap aesthetic survives, unless an exception is granted.
