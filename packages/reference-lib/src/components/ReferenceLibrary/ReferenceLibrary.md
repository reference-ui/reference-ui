# ReferenceLibrary

Proof: [TESTS.md](./TESTS.md).

Mounts Reference UI's application-level runtime systems.

Not a React context provider. Does not require descendants. Provides a stable
React-level mount for Toast, `announce()`, and the Tooltip skip-delay group —
document-scoped Zustand stores, not a context tree. See
[hooks.md](../../core/hooks/hooks.md).

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

## Proposed API

```ts
interface ReferenceLibraryProps {
  children?: React.ReactNode
  toaster?: {
    defaultPosition?: ToastPosition
    defaultDuration?: number | false
    limit?: number
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

**Vendor.** Sonner’s app-level `<Toaster />`. Spectrum OverlayProvider / live announcer — **leave** as a required wrapper for overlays. Our Overlay does not need this node.

### Tooltip skip-delay group

After one tooltip shows, neighbours open instantly for a short window. Vendors implement this as `Tooltip.Provider` / `FloatingDelayGroup` / a module `tooltips` map.

**Vendor.** Radix `skipDelayDuration` on Provider. Aria `globalWarmedUp`. Zag `setGlobalId`. Floating UI `FloatingDelayGroup`.

**Lift** the algorithm. **Leave** the public Provider. The group is a
document-scoped Zustand store mounted here (`components.md`,
[hooks.md](../../core/hooks/hooks.md)).

### What does not live here

Layer stack, FocusLock, scroll lock, inert — Overlay owns those per instance. Do not turn ReferenceLibrary into Radix’s Dialog.Root + Provider soup.

---

## Convergence

A mount point for document-scoped Zustand stores, not a context tree. Closest vendor analogue is Sonner’s `<Toaster />` plus Aria’s global tooltip warmup — without making either a descendant contract.
