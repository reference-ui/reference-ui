# Slot test contract

Vitest: `matrix/lib/tests/unit/slot.test.ts`
Browser smoke: `matrix/lib/tests/e2e/slot.spec.ts`
Page: `/slot`

Slot is the named-region registry: `SlotRoot` plus
`createSlotRootContext`. Unit tests own the store and hook matrix. The
browser smoke proves a compound host renders live part elements in named
regions.

## Source evidence

Lift cases from `vendor/design-system/page-layout/slots`, not the
implementation:

- `slots/core/core.test.ts` — register, overwrite by registration id,
  duplicate slot ids, unregister, `scanById` first match, `scanAll`,
  `getAll` cache identity, metadata, subscribe / unsubscribe.
- `slots/core/react.test.tsx` — `createSlotRootContext` Provider, custom
  root, isolated default roots, `useRoot` throw, mount/unmount
  registration, metadata, `useScanById` / `useGetAll` updates.
- `slots/hooks/useSlotRegistration.ts` — live getters, `deps`, split
  register / unregister effects. No equivalent unit file; behaviour is
  proven here as kernel cases.
- `tests/slot-live-content.test.tsx` — in-place content refresh without a
  remount key. Port the assertion, not the PageLayout fixture.
- `tests/region-visibility.test.tsx` — `hidden` vs `visible={false}`,
  hidden wins, in-place register on toggle (no `unregister`).

Contrast only:

- `vendor/radix-primitives/packages/react/slot` — `asChild` merge. Not this
  primitive.
- PageLayout `getRegisteredSlots`, sidebar pipelines, and product part
  wrappers — consume `scanById` / `scanAll`; they are not Slot API.

## Required cases

### Public type and factory

- [ ] `SL-TYPE-01` `[reference]` `[unit]` —
  **Slot should type the root generic, registration options, and hook
  results when `createSlotRootContext` is instantiated.**
  Compile `createSlotRootContext<{ icon: string; open?: boolean }>()` and
  pass `useSlotRegistration` an element, that meta, and a `SlotVisibility`
  object. Assert `useScanById` is `SlotRegistration<{ icon: string;
  open?: boolean }> | undefined`, `useGetAll` is an array of that
  registration, `resolveSlotVisibility` accepts omitted/`undefined`
  visibility, and that a mismatched meta object and a non-element
  `element` fail type checking.

### SlotRoot registration

- [ ] `SL-REG-01` `[vendor]` `[unit]` —
  **SlotRoot should register a slot.**
  Call `register` with one registration id, slot id `"test-slot"`, and a
  marked element. Assert `getAll()` has length 1 with that slot id and
  element, and `getVersion()` is greater than the empty-root version.
- [ ] `SL-REG-02` `[vendor]` `[unit]` —
  **SlotRoot should register multiple slots.**
  Register two different registration ids. Assert `getAll()` has length 2
  in registration order and version advanced for each register.
- [ ] `SL-REG-03` `[vendor]` `[unit]` —
  **SlotRoot should overwrite a slot with the same registration id.**
  Register id `r1` with element `"First"`, then register `r1` again with
  `"Second"`. Assert `getAll()` still has length 1 and the element is
  `"Second"`.
- [ ] `SL-REG-04` `[vendor]` `[unit]` —
  **SlotRoot should allow the same slot id with different registration
  ids.**
  Register `r1` and `r2` both with `slotId: "duplicate"`. Assert
  `getAll()` has length 2.

### Unregistration

- [ ] `SL-UNREG-01` `[vendor]` `[unit]` —
  **SlotRoot should unregister a slot.**
  Register then unregister that id. Assert `getAll()` is empty and version
  advanced.
- [ ] `SL-UNREG-02` `[vendor]` `[unit]` —
  **SlotRoot should handle unregistering a non-existent slot.**
  Call `unregister` with an id that was never registered. Assert no throw.
- [ ] `SL-UNREG-03` `[reference]` `[unit]` —
  **SlotRoot should leave version and subscribers unchanged when
  unregistering a missing id.**
  On an empty root and on a root that has other entries, unregister a
  missing id. Assert existing entries unchanged, `getVersion()` unchanged,
  and subscribers not notified. (Vendor always increments; we do not.)
- [ ] `SL-UNREG-04` `[vendor]` `[unit]` —
  **SlotRoot should only unregister the specific registration id.**
  Register `r1`/`"slot-1"` and `r2`/`"slot-2"`, then unregister `r1`.
  Assert `getAll()` has length 1 and the survivor is `"slot-2"`.

### Scan by id

- [ ] `SL-SCAN-01` `[vendor]` `[unit]` —
  **SlotRoot should find a slot by exact id.**
  Register `"target-slot"` and assert `scanById("target-slot")` returns
  that slot id and the same element.
- [ ] `SL-SCAN-02` `[vendor]` `[unit]` —
  **SlotRoot should return undefined for a non-existent id.**
  Assert `scanById("non-existent")` is `undefined` on empty and on a root
  that has other ids.
- [ ] `SL-SCAN-03` `[vendor]` `[unit]` —
  **SlotRoot should return the first match when multiple slots have the
  same id.**
  Register `r1` then `r2` both as `"duplicate"` with elements `"First"`
  then `"Second"`. Assert `scanById("duplicate")` is `"First"`.
- [ ] `SL-SCAN-04` `[reference]` `[unit]` —
  **SlotRoot should not treat a prefixed sibling as an exact id match.**
  Register `"title"`, `"title.extra"`, and `"body"`. Assert
  `scanById("title")` returns only the exact `"title"` registration.

### Scan all

- [ ] `SL-SCANALL-01` `[vendor]` `[unit]` —
  **SlotRoot should find all slots matching a predicate.**
  Register `"actions.primary"`, `"actions.secondary"`, and `"title"`.
  Assert `scanAll(s => s.slotId.startsWith("actions"))` returns only the
  two action slots in registration order.
- [ ] `SL-SCANALL-02` `[vendor]` `[unit]` —
  **SlotRoot should return an empty array when no matches.**
  Assert `scanAll` with a failing predicate on a populated root is `[]`,
  not `undefined`.
- [ ] `SL-SCANALL-03` `[vendor]` `[unit]` —
  **SlotRoot should return all slots when the predicate is always true.**
  Assert `scanAll(() => true)` has the same order and length as `getAll()`
  on a three-slot root, without sharing array identity with `getAll()`.

### Get all and snapshot identity

- [ ] `SL-ALL-01` `[vendor]` `[unit]` —
  **SlotRoot should return an empty array for a new root.**
  Assert `getAll()` is `[]`.
- [ ] `SL-ALL-02` `[vendor]` `[unit]` —
  **SlotRoot should return all registered slots.**
  Register two slots and assert `getAll()` contains both in register
  order.
- [ ] `SL-ALL-03` `[vendor]` `[unit]` —
  **SlotRoot should return the cached array when slots are unchanged.**
  Call `getAll()` twice with no register/unregister between. Assert
  strict array identity (`===`).
- [ ] `SL-ALL-04` `[vendor]` `[unit]` —
  **SlotRoot should return a new array after slots change.**
  Call `getAll()`, register another id, call `getAll()` again. Assert the
  second array is not the first and has length 2.

### Metadata

- [ ] `SL-META-01` `[vendor]` `[unit]` —
  **SlotRoot should store and retrieve metadata.**
  Register with `{ priority: 1, label: "Test Item" }` on a typed root.
  Assert `scanById` returns that meta.
- [ ] `SL-META-02` `[vendor]` `[unit]` —
  **SlotRoot should allow undefined metadata.**
  Register with omitted `meta`. Assert `scanById` yields `undefined` meta
  and does not throw.
- [ ] `SL-META-03` `[vendor]` `[unit]` —
  **SlotRoot should filter slots by metadata.**
  Register `{ priority: 1 }` and `{ priority: 10 }`. Assert
  `scanAll(s => (s.meta?.priority ?? 0) >= 5)` returns only the high
  entry.

### Subscriptions and version

- [ ] `SL-SUB-01` `[vendor]` `[unit]` —
  **SlotRoot should notify subscribers on register.**
  Subscribe, then register. Assert the listener ran once and
  `getVersion()` increased.
- [ ] `SL-SUB-02` `[vendor]` `[unit]` —
  **SlotRoot should notify subscribers on unregister.**
  Subscribe on a populated root, unregister that id. Assert one
  notification and a version bump.
- [ ] `SL-SUB-03` `[vendor]` `[unit]` —
  **SlotRoot should notify multiple subscribers.**
  Attach two listeners, register once, and assert both ran once.
- [ ] `SL-SUB-04` `[vendor]` `[unit]` —
  **SlotRoot should return an unsubscribe function.**
  Subscribe, register (one call), unsubscribe, register again. Assert the
  retired listener stays at one call.
- [ ] `SL-SUB-05` `[vendor]` `[unit]` —
  **SlotRoot should handle an unsubscribe function called multiple
  times.**
  Call the same unsubscribe twice. Assert no throw.
- [ ] `SL-SUB-06` `[reference]` `[unit]` —
  **SlotRoot should keep notifying remaining subscribers when one
  listener throws.**
  Subscribe a throwing listener then a recording listener, register once.
  Assert the recording listener ran and the throw did not swallow the
  update.
- [ ] `SL-VER-01` `[reference]` `[unit]` —
  **SlotRoot should not bump version when only live element or meta
  content changes.**
  Hold a registered object whose `element` / `meta` getters later return
  new values without a structural `register`. Assert `getVersion()` is
  unchanged, `getAll()` array identity is unchanged, and subscribers are
  not notified, while subsequent reads return the new element and meta.

### Visibility helpers

- [ ] `SL-VIS-01` `[vendor]` `[unit]` —
  **`resolveSlotVisibility` should collapse flags into visible, hidden,
  or unmounted.**
  Parameterize omitted flags, `{ visible: true }`, `{ visible: false }`,
  `{ hidden: true }`, `{ hidden: false, visible: false }`, and
  `{ hidden: true, visible: false }`. Assert `"visible"`, `"unmounted"`,
  and `"hidden"` respectively, with `hidden: true` winning when both
  would hide.
- [ ] `SL-VIS-02` `[reference]` `[unit]` —
  **SlotRoot should store visibility without dropping the registration.**
  Register with `{ visible: false }` and with `{ hidden: true }`. Assert
  `scanById` still returns each slot and its flags, and that
  `resolveSlotVisibility` on those flags matches `SL-VIS-01`.

### Cache key and transform helpers

- [ ] `SL-HELP-01` `[vendor]` `[unit]` —
  **`createSlotCacheKey` should join sorted slot ids.**
  Pass two registrations in reverse id order. Assert the key is the
  sorted `slotId` list joined by `","` and is equal for the same set in
  either order.
- [ ] `SL-HELP-02` `[vendor]` `[unit]` —
  **`transformSlotElements` should clone each element with host-supplied
  props.**
  Pass a `createProps` that adds a marked data attribute from `slotId`.
  Assert each result is a clone of the original type, carries those
  props, and that `getAll()` itself is not cloned.

### Provider and useRoot

- [ ] `SL-PROV-01` `[vendor]` `[unit]` —
  **`createSlotRootContext` should create a provider that wraps
  children.**
  Render the returned `Provider` around a `useRoot` consumer. Assert the
  result is a `SlotRoot` and the provider adds no extra DOM host of its
  own.
- [ ] `SL-PROV-02` `[vendor]` `[unit]` —
  **Provider should accept a custom root instance.**
  Construct a `SlotRoot`, pass it as `root`, and assert `useRoot()` is
  strictly that instance.
- [ ] `SL-PROV-03` `[vendor]` `[unit]` —
  **Provider should create a new root if none is provided.**
  Render two providers with no `root` prop. Assert each `useRoot()` is a
  `SlotRoot` and the two instances are not the same.
- [ ] `SL-USE-01` `[vendor]` `[unit]` —
  **`useRoot` should throw when used outside of a provider.**
  Render `useRoot` with no ancestor `Provider`. Assert a descriptive
  error and no implicit global root.
- [ ] `SL-USE-02` `[vendor]` `[unit]` —
  **`useRoot` should return the root instance.**
  Assert the instance exposes `getAll`, `scanById`, and `scanAll`.

### useSlotRegistration

- [ ] `SL-HOOK-01` `[vendor]` `[unit]` —
  **`useSlotRegistration` should register the slot on mount.**
  Mount a filler under `Provider` with slot id `"test"`. Assert
  `getAll()` has length 1 and that slot id after mount.
- [ ] `SL-HOOK-02` `[vendor]` `[unit]` —
  **`useSlotRegistration` should unregister the slot on unmount.**
  Mount then unmount the filler. Assert `getAll()` is empty.
- [ ] `SL-HOOK-03` `[vendor]` `[unit]` —
  **`useSlotRegistration` should handle metadata.**
  Register with `{ priority: 5 }` on a typed context. Assert
  `scanById("test")?.meta` equals that object.
- [ ] `SL-HOOK-04` `[reference]` `[unit]` —
  **`useSlotRegistration` should expose live element, meta, and
  visibility without re-registering.**
  Keep the filler mounted, rerender it with a new child element and new
  meta while keeping the same slot id. Assert version and `getAll()`
  array identity are unchanged, subscribers to the root are not notified,
  and a sibling consumer that rerenders in the same parent turn reads the
  new element and meta.
- [ ] `SL-HOOK-05` `[reference]` `[unit]` —
  **`useSlotRegistration` should re-register in place when `slotId` or
  `deps` change.**
  Parameterize a change to `slotId` and to a `deps` value that tracks
  `visible` / `hidden`. Assert each change calls `register` for the same
  registration id, notifies subscribers, bumps version, and does **not**
  call `unregister`. Unrelated parent rerenders without those changes
  must not re-register.
- [ ] `SL-HOOK-06` `[reference]` `[react:all]` —
  **`useSlotRegistration` should settle one registration under
  StrictMode replay.**
  Mount a filler under StrictMode, then unmount. Assert no leaked
  registration after replay, one live entry while mounted, and a clean
  empty root after final unmount.

### useScanById and useGetAll

- [ ] `SL-READ-01` `[vendor]` `[unit]` —
  **`useScanById` should return a slot by id.**
  Pre-register `"target"` on a custom root. Assert the hook returns that
  slot.
- [ ] `SL-READ-02` `[vendor]` `[unit]` —
  **`useScanById` should return undefined for a non-existent id.**
  Assert `undefined` on an empty root.
- [ ] `SL-READ-03` `[vendor]` `[unit]` —
  **`useScanById` should update when a slot is registered.**
  Render the hook on an empty root, then `register` that id. Assert the
  consumer rerenders from `undefined` to the registration.
- [ ] `SL-READ-04` `[vendor]` `[unit]` —
  **`useGetAll` should return all slots.**
  Pre-register two ids. Assert the hook's array has length 2.
- [ ] `SL-READ-05` `[vendor]` `[unit]` —
  **`useGetAll` should return an empty array for an empty root.**
  Assert `[]`, not `undefined`.
- [ ] `SL-READ-06` `[vendor]` `[unit]` —
  **`useGetAll` should update when slots change.**
  Start empty, register one, unregister it. Assert length 0 → 1 → 0.
- [ ] `SL-READ-07` `[reference]` `[unit]` —
  **`useGetAll` should keep array identity while only live content
  changes.**
  After `SL-HOOK-04`, assert the hook did not emit a new array.

## Composition gates

- [ ] `SL-COMP-01` `[reference]` `[browser]` —
  **A host should render registered parts in named regions when fillers
  are siblings that commit first.**
  Mount `{children}` then `MyComponentLayout` under one `Provider`. Have
  `MyComponentTitle` and `MyComponentActions` call `useSlotRegistration`
  for `"title"` and `"actions"`. Assert the title element appears in the
  header region and the actions element in the footer, and the filling
  parts host neither.
- [ ] `SL-COMP-02` `[vendor]` `[browser]` —
  **A host should refresh slotted content on an in-place rerender
  without a remount key.**
  Keep the same `MyComponentTitle` / body filler mounted, change
  registered text from `"A"` to `"B"` without changing the part's React
  key. Assert the regions show `"B"`, the old text is gone, and a
  mount-counter inside the slotted body is still 1.
- [ ] `SL-COMP-03` `[reference]` `[browser]` —
  **A host should scan a prefix of slot ids when several entries share
  a region kind.**
  Register `"actions.primary"` and `"actions.secondary"` plus an unrelated
  `"title"`. From the layout, `scanAll` with an `"actions"` prefix. Assert
  only the action elements render in the actions region, in registration
  order, using `createSlotCacheKey` only as a memo input — not as a React
  child key that collapses duplicates.
- [ ] `SL-COMP-04` `[vendor]` `[browser]` —
  **A host should honor `resolveSlotVisibility` without unregistering.**
  Toggle a filler from visible to `hidden: true` then `visible: false`.
  Assert hidden keeps the region mounted with `display: none` and the
  same DOM node, `register` ran and `unregister` did not, unmounted
  removes the region from the tree while the filler remains registered,
  and restoring `visible` shows current live content. Hidden wins when
  both flags would hide.

## Out of scope

- Radix `asChild` / prop-merge Slot and a public `Slottable`.
- PageLayout `getRegisteredSlots`, sidebar pipelines, and product
  `useTitleSlot` wrappers.
- Portal relocation and Presence lifetime.
- A document-global default root.
- Putting `element` in Zustand state.
