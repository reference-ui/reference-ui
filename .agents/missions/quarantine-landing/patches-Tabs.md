IN PROGRESS — Tabs PATCHES crew (reference-system)

## Brief
Implement `packages/reference-lib/src/components/Tabs/PATCHES.md` exactly:
1. Registration maps (identity registry) — explicit Tab `id` flows into Panel's
   `aria-labelledby`; insert/reorder/remove keep IDs stable. Pins: TB-DOM-06,
   TB-DYNAMIC-01/02.
2. ShadowRoot focus tracking — deep active-element walk so arrows work inside a
   ShadowRoot. Pin: TB-ENV-03.

Guardrails: API-STANCE (no breaking change beyond the doc — both items are
internal, no public API delta); visuals frozen (snapshots pass unmodified);
prove with `pnpm agentct Tabs`; nested ux-designer review; one commit
(`Tabs: land PATCHES`) adding ONLY the Tabs dir.

## Plan
- Tabs.tsx: per-instance tab/panel registries (value-keyed, isomorphic-layout-effect
  subscribe/unsubscribe + version bump); Panel `aria-labelledby` and Tab
  `aria-controls` resolve through the registry with the existing generated-ID
  fallback (SSR markup unchanged); deep-active-element helper for the List keydown.
- Tests: TB-DOM-06 + TB-DYNAMIC-01/02 (behavioral half; diagnostic half DECLINED
  per DECISIONS #10) in Tabs.test.tsx; TB-ENV-03 as ShadowTabs story + CT spec
  (assertion-only, no snapshots).

## Landed
- PATCHES #1 (identity registry): `registerTab`/`registerPanel` + `getTabId`/
  `getPanelId` on internal context; `{ id, element, disabled }` tab entries and
  `{ id, element }` panel entries subscribed in an isomorphic layout effect with
  entry-identity-checked cleanup; version bump re-renders linkage readers.
  Both ARIA directions resolve through the registry (TB-DOM-06 cites both).
- PATCHES #2 (shadow focus): `getDeepActiveElement` (`getRootNode` +
  `shadowRoot.activeElement` walk) in the List keydown; light-DOM behavior
  identical.
- Incidental fix REQUIRED by #1: `baseId` pinned in state — the CT React 17
  `useId` shim returns a fresh id every render, which churned registry deps
  into an infinite update loop (all 7 specs failed pre-fix, 7/7 post-fix).
  No API or visual effect on any major.
- Tests: +3 unit (TB-DOM-06, TB-DYNAMIC-01, TB-DYNAMIC-02 behavioral half),
  +1 CT (TB-ENV-03 via new ShadowTabs story). No snapshots added or modified.

## Evidence
- `pnpm agentct Tabs`: unit 20/20; e2e React 19 7/7, snapshots unmodified.
- `pnpm agentct Tabs --e2e --react 17,18`: 7/7 + 7/7 (behavioral).
- TB-ENV-03 finish screenshot viewed: Billing focused+selected in shadow,
  panel visible, log exactly `billing` (video/webm not attachable; Tabs has
  no presence motion — assertions + screenshot cover it).
- tsc: Tabs.tsx/story/spec clean; Tabs.test.tsx has only 2 pre-existing
  errors (lines 275, 710 — untouched code, DOM-lib strictness).
- UX (nested, subagent 01a0dd86): ship it — look PASS (frozen), all three
  feel rulings APPROVED, no new a11y issues. Awareness-only: selected-only
  `aria-controls` is a pre-existing APG variant, out of brief.

COMPLETE
