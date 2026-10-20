# ReferenceLibrary

Proof: [TESTS.md](./TESTS.md).

Mounts Reference UI's application-level runtime systems.

Not a React context provider. Does not require descendants. Provides a stable
React-level mount for Toast, `announce()`, and the Tooltip skip-delay group —
document-scoped Zustand stores, not a context tree. See
[package README](../../../README.md).

```tsx
<ReferenceLibrary
  toaster={{
    defaultPosition: "bottom-end",
    defaultDuration: 5000,
    limit: 4,
  }}
>
  <App />
</ReferenceLibrary>
```

## Color mode

Runtime hosts (the Toast host) render where `ReferenceLibrary` is mounted, not
in a portal. Mount it inside the app's `colorMode` root so hosts inherit the
mode through React context and DOM ancestry, and follow live toggles:

```tsx
<Div colorMode={mode}>
  <ReferenceLibrary>
    <App />
  </ReferenceLibrary>
</Div>
```

That root must not create a containing block for fixed-position descendants:
no `transform`, `filter`, `contain`, or `container-type`, because toast stacks
are `position: fixed`. Mounted outside a `colorMode` root, a host reads
`data-color-mode` from `<html>` once at render and does not follow later
toggles. Toast chrome colors follow `toaster.theme` (`data-theme`), not color
mode.

## Proposed API

```ts
interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: {
    defaultPosition?: ToastPosition
    defaultDuration?: number | false
    limit?: number
    hotkey?: string[] | false
    expand?: boolean
    gap?: number
    offset?: number | string
    closeButton?: boolean
    theme?: ToastTheme
    richColors?: boolean
    invert?: boolean
    dir?: "rtl" | "ltr" | "auto"
    containerAriaLabel?: string
  }
  tooltip?: {
    skipDelay?: number
  }
}
```

Omitted toaster configuration uses Toast's 5000ms, `bottom-end`, global-limit-4
defaults. Omitted Tooltip configuration uses a 300ms document-level skip-delay
window.

---

## Problems we own

Agents need one place to mount cross-cutting runtimes without a Provider
contract. Overlay/Popover/Menu do **not** read from this through context. They
do not require being nested under it.

### Toast + announce mount

The toaster renders at the React root without a portal. `announce()` is the same live region without a visual toast. If `toast.show` runs before this mounts, the queue must replay (see `Toast.md`).

**Prior art.** Sonner’s app-level `<Toaster />`. Spectrum OverlayProvider / live announcer — **leave** as a required wrapper for overlays. Our Overlay does not need this node.

### Tooltip skip-delay group

After one tooltip shows, neighbours open instantly for a short window. Vendors implement this as `Tooltip.Provider` / `FloatingDelayGroup` / a module `tooltips` map.

**Prior art.** Radix `skipDelayDuration` on Provider. Aria `globalWarmedUp`. Zag `setGlobalId`. Floating UI `FloatingDelayGroup`.

**Lift** the algorithm. **Leave** the public Provider. The group is a
document-scoped Zustand store mounted here (the components README,
[package README](../../../README.md)).

### What does not live here

Layer stack, FocusLock, scroll lock, inert — Overlay owns those per instance. Do not turn ReferenceLibrary into Radix’s Dialog.Root + Provider soup.

---

## Convergence

A mount point for document-scoped Zustand stores, not a context tree. Closest vendor analogue is Sonner’s `<Toaster />` plus Aria’s global tooltip warmup — without making either a descendant contract.
