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

**LANDED (2026-09-28, P2A finish-line crew):** Combobox owned the contract
(`registerOption` + `isBranch`, sequenced `treeExpansionRequest`,
sole-authored-Tree `popupRole`, `data-active`-on-`activeValue` publication
rule) and Tree implemented its side with no new props — cases `TR-CB-01`–`06`
+ `TR-COMP-03` proven in CT against the live Combobox on React 17/18/19.
`data-active` semantics are not forked: standalone keeps roving-focus
publication, nested previews the source's virtual focus (Listbox
derivation parity). Follow-up owned elsewhere: the harness-deletion
micro-task removes Combobox's temporary `TreeBridgeHarness` and re-proofs
`CB-TREE-01` / `CB-COMP-03` (+ the now-obsolete Tree-popup survey) natively.

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

**LANDED (2026-09-26, Tree-FEATURES crew):** the lib-wide strategy is the
Portal-owned event contract (Portal FEATURES #1: React attaches listeners
per portal container on mount and switch — no shim, no per-consumer fork).
Tree rides it with owning-root reads only: traversal was already `rootEl`-scoped
(`querySelectorAll`/`closest`/`contains` — no `document.activeElement`
assumption existed), and the single `document`-global read (the RTL
`document.dir` fallback) became a shadow-host-chain walk (`resolveIsRtl`,
light-DOM identical). Proven by a real `TR-ENV-03` CT (open-ShadowRoot
mount: vertical/horizontal/Home/End/typeahead parity, owning-root focus
asserts, RTL-through-host-chain). No Tree event fork added.

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

**CREW FINDING — VERIFY-BLOCKED (2026-09-26, Tree-FEATURES crew):** the three
requirements are jointly unsatisfiable against the shipped Slot kernel, so
this item needs an HQ call, not more crew effort:
- `useSlotRegistration` registers in `useLayoutEffect` (`Slot.ts`), which
  never runs under `renderToString` — and React renders parents before
  children, so no registration (effect- or render-phase) can inform
  `Tree.Item`'s render-time branch/leaf decision without children
  inspection.
- Proven with the real kernel (temporary colocated test, since removed): a
  `useSlot`-reading parent with a registering Group child emits leaf-path
  SSR HTML — no `aria-expanded`, no row wrapper.
- But `TR-ENV-01` pins branch-path SSR HTML (`aria-expanded="true"` in
  `renderToString` output) and this item demands zero behavioral delta plus
  hydration proof. Replacing the scan necessarily degrades SSR output and
  adds a post-hydration leaf→branch DOM restructure.
HQ picks: (a) keep the render-time scan (SPEC work-order item 6 closed as
won't-do), or (b) accept degraded SSR branch HTML + a `TR-ENV-01` rewrite
as the item's real cost. No Tree source changed for this item.

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
