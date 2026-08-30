# Presence tests

Playwright: `matrix/lib/tests/e2e/presence.spec.ts`  
Page: `/presence`

Overlay/Popover/Drawer prove the product contract (`data-state`, restore after exit). This spec proves **detection**: stay mounted for animation **and** transition; unmount when duration is `0s` / `none`.

## Unique to Presence

| Our case | Vendor |
| --- | --- |
| CSS **transition** holds unmount until `transitionend` | Headless UI `getAnimations()` / `CSSTransition` — Radix Presence does **not** listen to transitions; we must |
| CSS **animation** holds unmount until `animationend` | radix `packages/react/presence`; Zag presence machine |
| `animation-name` / duration unchanged or `0s` → immediate unmount | Radix name-unchanged → UNMOUNT; Zag `animationDuration === "0s"` |
| Hidden tab (`visibilityState === hidden`) skips exit | Zag |
| `present` flipped back during exit does not unmount | Zag raf re-check |
| No extra node; `data-state` is on the child Overlay sets, not a Presence wrapper | our API |
| Unstable ref must not infinite-loop | radix Presence #3664 |

## Combined

Drawer slide-out lives on Overlay (transition). Do not re-test Overlay chrome here. Nested Presence wait (Headless NestingContext) is **not** required unless Overlay Backdrop+Content prove they need it.

## Vitest

Optional: zero-duration / `none` without a browser if the helper is pure. Prefer Playwright so computed style is real.

## Not here

Headless enter/leave **class** API. Radix `forceMount` render-prop.
