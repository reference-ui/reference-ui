# Collapsible features (need design)

Design-gated follow-ups split from DECISIONS.md. Each entry needs a
product/UX call before TESTS.md cases can be written.

## 1. hiddenUntilFound / beforematch find-in-page reveal (from DECISIONS candidate #1, DEFERRED)

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

Open design calls: root-only vs root + Content override; what
`aria-controls` points at while closed-hidden; whether skip-motion-once
also zeroes GSAP duration; SSR story for `hidden="until-found"`.
Source: quarantine `43f0b03cc`, `Collapsible.tsx` (root + Content
`hiddenUntilFound`, `beforematch` listener, `skipMotionOnceRef`); SPEC.md
freeze Surface table, Gaps list, work-order item 4 (no TESTS.md case ID).

Maintainer take: good to add once HQ settles the prop shape — it is the only path to findable closed panels.

## 2. forceMount (always-mounted Content) (from DECISIONS gap #1, OPEN)

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

Open design calls: closed mounted content `hidden`, `inert`, or pure
author CSS; whether focus evacuation runs when nothing unmounts; how it
composes with a future `hiddenUntilFound` (two props or one).
Source: no quarantine source — vendor parity vs Radix collapsible +
Presence/measure cited in SPEC.md Vendor section; no consumer pain filed.

Maintainer take: good to add only on real consumer demand, not for parity alone.
