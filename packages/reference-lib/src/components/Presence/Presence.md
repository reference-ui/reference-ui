# Presence

Proof: [TESTS.md](./TESTS.md).

Keeps unmounting elements in the DOM until CSS animations or transitions complete. Overlay and Popover use it internally for the `data-state` exit contract.

```tsx
<Presence present={open}>
  <Div data-state={open ? "open" : "closed"}>{children}</Div>
</Presence>
```

Applications style against `data-state`. They do not wrap Overlay in Presence, set `data-state` themselves, or delay `open={false}` in order to animate.

## Proposed API

```ts
interface PresenceProps {
  children?: React.ReactNode
  present: boolean
}
```

Presence renders no extra node.

---

## Problems we own

Overlay `open={false}` is a state change, not an immediate unmount. Focus restoration, inert teardown, and scroll unlock run **after** Presence reports exit complete. Drawer/sheet slide-out is CSS against `data-state`; it is not a Vaul primitive.

### Animation vs transition completion

Radix Presence listens `animationstart` / `animationend` / `animationcancel` only. Pure CSS **transitions** never hold the exit — drawers that `transform` with a transition would unmount immediately.

Headless UI `Transition` waits `element.getAnimations()` filtered to **`CSSTransition` only** — the inverse. It also forces a reflow so the first frame after mount actually transitions.

**Vendor.** `vendor/radix-primitives/packages/react/presence`. Zag presence machine (same animation-only family, plus `animationDuration === "0s"` instant unmount and hidden-tab skip). Headless `packages/@headlessui-react` Transition / NestingContext.

**Lift** Radix state machine (`mounted` → `unmountSuspended` → `unmounted`) and its flash/ref fixes (issue #1634 style-dirty, #3664 unstable composed refs, React 18 `animationFillMode` flash). **Extend** detection to **both** animation and transition end so Overlay’s `data-state` contract is honest. **Leave** Headless enter/leave class orchestration as a public API.

### Instant unmount when there is nothing to wait for

If `animation-name` / transition duration is `none` or `0s` (including `prefers-reduced-motion` CSS), unmount immediately. Do not invent a media-query branch unless freeze tests need it.

**Vendor.** Radix: name unchanged → `UNMOUNT`. Zag: `animationDuration === "0s"`. Headless: empty `getAnimations()` → `done()`.

### Hidden tab

Leaving present while `document.visibilityState === "hidden"` should skip the exit animation (Zag). Otherwise a background tab holds nodes forever.

### Nested Presence

Headless parent leave waits for child transitions. Radix/Zag do not. Overlay Backdrop + Content are siblings under one Overlay — one Presence owner, not nested Presence unless freeze proves we need it.

### `forceMount`

Radix render-prop always renders. We do not need that as a public prop: Overlay keeps children mounted through exit via Presence internally.

---

## Convergence

Primary: Radix Presence **lifecycle + bugfixes**, with Headless-style **transition** completion added so drawers work. Zag for zero-duration and hidden-tab. Do not copy animation-only blindly — `components.md` requires transitions.
