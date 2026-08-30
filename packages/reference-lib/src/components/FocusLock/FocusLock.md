# FocusLock

Proof: [TESTS.md](./TESTS.md).

Contains keyboard focus inside a subtree: Tab cycles, programmatic focus is reclaimed, focus is restored when the lock deactivates. Overlay uses this internally. Distinct from `RovingFocus`, which moves `tabindex` among items inside a composite widget.

Does not add a wrapper node. Slots onto a single child. Overlay.Content is the lock container for dialogs; this primitive exists so that containment is not Overlay-only.

```tsx
<FocusLock>
  <Div role="dialog" aria-modal="true">
    {children}
  </Div>
</FocusLock>
```

`initialFocus` matches Overlay.Content: omitted focuses the first tabbable descendant; a ref focuses that element; `false` skips the move.

`shards` are elements that belong to the lock but live outside the child's DOM (a nested portalled popover). Focus may enter a shard without being pulled back.

```tsx
<FocusLock
  initialFocus={confirmRef}
  shards={[popoverContent]}
>
  <Div role="dialog" aria-modal="true">
    {children}
  </Div>
</FocusLock>
```

Disabled while the overlay is closed but still mounted for Presence exit. Restoration runs after Presence reports the exit complete.

## Proposed API

```ts
interface FocusLockProps {
  children?: React.ReactNode
  disabled?: boolean
  restoreFocus?: boolean
  initialFocus?: React.RefObject<HTMLElement | null> | false
  shards?: Array<HTMLElement | React.RefObject<HTMLElement | null>>
}
```

FocusLock renders no extra node.

Used by Overlay. Not used by Popover, Tooltip, or Toast (those are not isolated).

---

## Problems we own

One solver in production. Pairing two focus libraries causes recursive `focus()` (focus-lock `moveFocusInside.ts` `guardCount`). Overlay owns the lock; nested modal layers pause the lower lock. Non-modal portalled children of the same lock are `shards`, not a second trap.

### Tabbable catalog

“What Tab lands on” is not `querySelector('[tabindex]')`. Radio groups are one tab stop (checked, or all if none). Disabled fieldsets, closed `<details>`, `contenteditable="false"`, `inert` ancestors, and zero-area nodes all lie.

**Vendor.** `vendor/tabbable/src` is the strictest catalog (`isTabbableRadio`, `CSS.escape`, fieldset+legend, `details:not([open])`). focus-lock `focusables.ts` / `correctFocus.ts` is simpler (no fieldset-disabled, no closed-details). Ariakit’s radio rule is coupled to `activeElement` and disagrees with the browser — **leave**. Radix `getTabbableCandidates` ignores positive `tabindex` (document order only).

**Lift** tabbable’s cases as the shared catalog for FocusLock **and** Overlay `initialFocus`. Prefer Radix stance on positive `tabindex` (document order; optionally warn). Do not ship tabbable’s `displayCheck` modes as public API.

### Shards / branches

A Popover portalled out of a Dialog is outside the lock DOM. Without registration, the trap yanks focus back.

**Vendor.** react-focus-lock `shards` (`Lock.js` `workingArea = [observed, ...shards]`). Radix FocusScope `branches` + registry (issue #3423). Aria uses a focus-scope **tree** (portals as child scopes) — no shards prop. focus-trap multi-`containers` throws if positive tabindex spans containers.

**Lift** Radix `branches` semantics under our name `shards`. **Leave** `group` / `whiteList` / `data-focus-lock` / sidecar as public props.

### Restore after Presence

Vendors restore on deactivate/unmount. Overlay needs restore **after Presence exit**. focus-lock `return-focus.ts` (`captureFocusRestore`, walk siblings if the node is gone) is the proximity algorithm. react-focus-lock defers a microtask. Radix `setTimeout(0)`. Aria RAF.

**Lift** proximity restore. **Leave** “restore on unmount.” Wire to Presence complete; `disabled` while closed-but-mounted.

### `initialFocus`: omitted | ref | `false`

focus-trap: `initialFocus === false` means **do not move**. react-focus-lock `autoFocus={false}` **blurs to body** — different and aggressive. Radix skips `<a>` on mount autofocus (`removeLinks`). Aria `autoFocus` → first tabbable.

**Lift** focus-trap’s `false`. Map: omitted → first tabbable; ref → that node; `false` → skip. **Leave** data-attribute autofocus DSLs.

### No wrapper, no `as`

Kashey always wraps a `div` (`as` prop) plus local `data-focus-guard` sentinels. Aria injects `<span hidden>` sentinels. Radix uses **document-edge** guards (`focus-guards.tsx`, issue #2812 reflow). Ariakit `FocusTrap` is a visually hidden tab stop, not a manager — **contrast only**.

**Leave** wrapper/`as`/sidecar. Slot onto Overlay.Content. Lift Tab-loop behaviour (Aria/focus-trap keydown or Radix loop) and shared edge guards only if Slot cannot host the listeners.

### Reclaim: null relatedTarget, removed node

Chrome can CPU-spin focusing a deleted node. `focusout` with `relatedTarget === null` is not a reliable “escaped.”

**Vendor.** Radix: do nothing on null `relatedTarget`; MutationObserver when focus falls to `body` after removal. Aria: skip virtual modality on Android Chrome TalkBack.

**Lift** Radix null-relatedTarget + removed-node → focus container.

### Nesting pause

Two reclaimers fight. Radix `focusScopesStack.pause`. focus-trap `trapStack`. react-focus-lock is “last trap wins.”

**Lift** stack pause aligned with Overlay’s layer stack. Lower FocusLock pauses while a nested **modal** layer is top. Shards cover **non-modal** portalled children of the same lock.

### Shadow DOM

`activeElement` is the host. tabbable walks slots/`assignedElements`. focus-lock `FOCUS_ALLOW` only works on light-DOM hosts. focus-trap `composedPath` / `shadowDom.test.js`.

**Lift** tabbable shadow/slot + composedPath for events. Iframes/`crossFrame` stay out of freeze unless Overlay documents iframe content.

---

## Convergence

| Piece | Primary | Leave |
| --- | --- | --- |
| Tabbable catalog | tabbable | Ariakit radio rule |
| Shards | Radix branches | Kashey groups / Aria-only tree |
| Restore algorithm | focus-lock `return-focus` | restore-on-unmount timing |
| `initialFocus: false` | focus-trap | react-focus-lock blur |
| Tab loop | Aria / Radix | Ariakit FocusTrapRegion as the lock |
| Solver | one (focus-lock or equivalent) | combining two libraries |

Pair with Radix `focus-scope` for Overlay behaviour tests. Do not take Floating UI `FloatingFocusManager`.
