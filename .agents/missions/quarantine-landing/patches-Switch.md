# patches-Switch log

IN PROGRESS

## Brief
Implement packages/reference-lib/src/components/Switch/PATCHES.md exactly (item 1: Structural Thumb identity).

## Design (item 1)
Source candidate text (DECISIONS pre-split): detection must survive "Fragment
wrapping and HOC forwarding" with no displayName read and no walker machinery.
Element-type inspection cannot see through an HOC (opaque component type), so
the mechanism is rendered-DOM structural reconciliation:
- `authoredThumbPresent` state, seeded by a static direct-child reference check
  (`child.type === SwitchThumb` — no displayName read, no fragment penetration)
  so SSR/first paint is already correct for bare + direct-authored shapes
  (required by ssr.test.tsx authored-SSR count==1).
- `useIsomorphicLayoutEffect` (Tabs convention) counts direct-child
  `[data-reference-switch-thumb]` nodes from the root (internal ref composed
  with the forwarded ref via Accordion's `composeRefs` convention) and corrects
  state pre-paint. Fragment/HOC/conditional thumbs are all visible in rendered
  structure.
- Default thumb still rendered as `<SwitchThumb />` — identical paint, zero DOM
  change in steady state; snapshots must pass byte-identical.
- Known transient: Fragment/HOC-authored SSR HTML contains 2 thumbs (effect
  never runs on server); hydration is consistent (client first render matches)
  and the layout effect corrects pre-paint. No test pins SSR fragment/HOC shape.

## Changes
- `Switch.tsx`: as above; deleted the `displayName === 'SwitchThumb'` read.
  `SwitchThumb.displayName = 'SwitchThumb'` assignment kept (write, devtools).
- `Switch.story.tsx`: `ForwardedSwitchThumb` HOC helper; dom-04 shape union +
  `fragment`/`forwarded` branches + buttons.
- `__e2e__/Switch.ct.spec.ts`: SW-DOM-04 extended through fragment + forwarded
  shapes (count==1 each), restored asserts new testids absent.
- `Switch.test.tsx`: PATCHES-01 unit test (bare/direct/fragment/forwarded = 1).

## Proof
- `pnpm agentct Switch`: unit 6/6 (workspace React 19, incl. new PATCHES-01),
  e2e 22/22 react19 — all 7 visual snapshots passed byte-identical, unmodified
  (git shows only the 4 source/test files changed; no PNG touched, no
  *-actual/*-diff outputs).
- Targeted `pnpm agentct Switch "SW-DOM-04"`: 1/1 — extended test walks
  thumbless(1) → authored(1) → fragment(1) → forwarded(1) → restored(1).
- `npx tsc --noEmit -p packages/reference-lib`: zero Switch errors
  (remaining Slot/Tabs errors pre-existing, other crews').
- Banned-token grep on Switch.tsx: no displayName read (write kept), no
  Symbol.for, no __referencePart, no Fragment reference in code.
- Branch `reference-system` throughout; no commit (per brief).

## UX review (nested ux-designer child, agent_path main/ux-review-switch-patches/1)
- Look: PASS (frozen, verified from diff + baseline PNGs + CT screenshot).
- Feel: (1) fragment/forwarded thumbs suppressing the default — APPROVED
  (defect repair, pre-paint so no flash); (2) displayName-spoofing wrappers
  no longer suppress the default — APPROVED (entailed by the no-displayName
  acceptance; more sensible behavior).
- A11y: no findings. Awareness-only flag (matches known transient above):
  SSR HTML for fragment/forwarded shapes ships 2 thumbs; hydration-consistent,
  corrected pre-paint; visible only in degenerate no-JS case, non-semantic
  spans, no SR impact.
- Verdict: ship it.

COMPLETE
