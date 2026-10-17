# Collapsible features (need design)

Design-gated follow-ups. Each entry needs a product or UX call before TESTS.md cases can be written.

## 1. hiddenUntilFound / beforematch find-in-page reveal

What it does: closed panels stay Ctrl+F-discoverable by rendering
`hidden="until-found"` instead of unmounting, and a `beforematch` event
opens the disclosure while skipping author motion once.

API:

```tsx
<Collapsible hiddenUntilFound>
  <Collapsible.Content hiddenUntilFound>
    {children}
  </Collapsible.Content>
</Collapsible>
// Content prop wins over root. Closed Content renders
// hidden="until-found"; beforematch opens + zeroes
// transition/animation durations for one frame, then restores.
```

Open design calls: root-only vs root + Content override; what `aria-controls` points at while closed-hidden; whether skip-motion-once also zeroes GSAP duration; SSR story for `hidden="until-found"`.

Recommendation: Good to add once the prop shape is settled. It is the only path to findable closed panels.

**Implemented (CO-MOUNT-01–05, 08, 10).** Root + Content override (Content wins); `aria-controls` keeps pointing at the
mounted-hidden panel while closed-hidden; skip-motion-once zeroes the GSAP
path (no finite enter tween — stronger than zeroing durations, so no
style-restore frame); SSR renders `hidden=""` declaratively with the
`until-found` upgrade in a layout effect (no hydration mismatch — attribute
presence matches, value upgrades pre-paint). Cancel (`preventDefault`)
evaluated after dispatch so a later-registered canceler still wins; a
rejected reveal arms the skip consumed by the next committed open
(CO-MOUNT-08).

## 2. forceMount (always-mounted Content)

What it does: lets closed content stay in the DOM for measurement,
print, or SEO instead of always unmounting through Presence, matching
Radix `Collapsible.Content` parity.

API:

```tsx
<Collapsible.Content forceMount>
  {children}
</Collapsible.Content>
// Skips Presence unmount; stays rendered with data-state="closed"
// (visibility left to author CSS); trigger linkage and aria-expanded
// follow open as today.
```

Open design calls: closed mounted content `hidden`, `inert`, or pure author CSS; whether focus evacuation runs when nothing unmounts; how it composes with a future `hiddenUntilFound` (two props or one). Vendor parity reference: Radix collapsible, with Presence and measure.

Recommendation: Good to add only on real consumer demand, not for parity alone.

**Implemented (CO-MOUNT-06–07).** Pure author CSS — closed `forceMount` Content carries no `hidden`, no
inert, no `aria-hidden`, no pointer-events kill, and no collapse inline
styles (the collapse engine is bypassed entirely in both states); focus
evacuation does not run when nothing unmounts (CO-PRES-07 preserved for the
default path via CO-MOUNT-09); composes with `hiddenUntilFound` as two
props with untilFound winning (CO-MOUNT-07).
