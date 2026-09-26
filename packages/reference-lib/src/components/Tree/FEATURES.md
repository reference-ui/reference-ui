# Tree features (need design)

Every open/deferred Tree item that needs a product, UX, or architecture
call before code. Triage moved all 4 here; [PATCHES.md](./PATCHES.md)
holds the mechanical list (currently empty).

## 1. Combobox virtual-focus bridge + commit routing (from DECISIONS candidate #1, DEFERRED)

**What it does:** Lets a Tree nested directly in a `Combobox.Popover`
participate in combobox interaction: DOM focus stays on the input while
`aria-activedescendant` tracks the virtually focused visible treeitem,
horizontal keys expand/collapse under virtual focus, and activation
commits one scalar through `Combobox.onChange` only. The virtually
focused item also publishes `data-active` as a preview hook independent
of `aria-selected`.

**API:** No new Tree props — nesting auto-registers the visible item set
through a shared bridge (`combobox.registerOption` / `setActiveValue` /
`activeValue` wiring, per quarantine `b8b5f1aff`). Cases `TR-CB-01`–`06`,
`TR-COMP-03`; fixture "Combobox Tree Integration" in
`matrix/lib/src/tree.tsx`.

**Revisit when:** Combobox owns the bridge contract — adapter shape,
`data-active` reconciliation (focus vs virtual-active), and the
commit-authority proof land together on the Combobox side.

**Maintainer take:** Good to add only as a Combobox-owned contract; Tree must not fork `data-active` semantics alone.

## 2. Shadow-root focus discovery and traversal (from DECISIONS candidate #2, DEFERRED)

**What it does:** Makes a Tree mounted in an open ShadowRoot behave
identically to light DOM: vertical, horizontal, Home/End, and typeahead
commands all work because focus reads use the owning root instead of
assuming `document.activeElement`. Case `TR-ENV-03` (spec only — no
quarantine source change proved it).

**API:** No new props. `document.activeElement` assumptions become
owning-root reads (`getRootNode()`); shadow-portal key events must also
survive React container-delegation retargeting (native target retargets
to the host, so item handlers never fire) — same skip as Switch
`SW-ENV-03`.

**Revisit when:** A lib-wide shadow strategy exists (portal retargeting
solved once, in shared infrastructure) with a passing CT that mounts Tree
in an open ShadowRoot.

**Maintainer take:** Good to add only as a lib-wide shadow strategy; a Tree-only fix would fork the event model.

## 3. Slot / part registration replacing `Children.forEach` sniffing (from DECISIONS gap #1, OPEN)

**What it does:** Internal architecture change with zero behavioral
delta: `Tree.Item` learns it owns a `Tree.Group` via Slot composition /
part registration context instead of scanning children element types at
render time. Same authored JSX. (SPEC.md "Gaps & incoherence", work
order item 6.)

**API:** No public prop change. The render-time scan is SSR-safe for the
two-path branch/leaf DOM; registration state must prove equally
hydration-safe.

**Revisit when:** The library settles a shared Slot/part-registration
pattern other components already use, so Tree follows a proven shape
instead of inventing one.

**Maintainer take:** Good to add once a proven shared Slot pattern exists; not worth inventing one for Tree alone.

## 4. Shared `RovingFocus` for roving (from DECISIONS gap #2, OPEN)

**What it does:** Internal engine swap with an identical key map:
Up/Down/Home/End move through the visible set via the shared
`RovingFocus` engine (registration + visible-set filter) instead of
`querySelector` traversal. Behavior is fully proven today via
`TR-KEY-01`–`08` on DOM queries; typeahead already moved onto the shared
`TypeaheadModel`.

**API:** No public prop change. Requires `RovingFocus` to support
visible-set / filtered membership natively, so Tree doesn't reimplement
collapse filtering on top (and must preserve the visible-only invariant:
collapsed descendants absent from the set).

**Revisit when:** `RovingFocus` supports visible-set membership natively,
with the `TR-KEY-08` stale-registration proof re-run after the swap.

**Maintainer take:** Good to add once the shared engine owns visibility filtering; a Tree-side filter on top buys nothing.
