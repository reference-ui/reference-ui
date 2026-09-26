# Slot decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

Named-region registry: parts register elements; hosts render them.

Open work has moved out of this file: mechanical items live in
[PATCHES.md](./PATCHES.md) (currently none), design items in
[FEATURES.md](./FEATURES.md).

## Landed (context, 2-4 lines)

Landing ported quarantine's 18 matrix cases (`SL-PROV`/`USE`/`HOOK`/`READ`)
as a colocated `Slot.test.tsx` (52/52 unit + 4/4 CT green, snapshots
unmodified) and deliberately declined the Zustand store rewrite as
behavior-identical on the full contract. No visuals: headless registry,
UX APPROVE via artifact review. Crew log:
`.agents/missions/quarantine-landing/slot.md`; landing commit `4b0793d7c`.

Reactive API redesign (HQ no-`scan` stance, `docs/MISSIONS/API-STANCE.md`):
breaking-clean rename — `scanById` → `getById`, `scanAll` → `select`,
`useScanById` → `useSlot`, `useGetAll` → `useSlots()` — plus the deferred
`useScanAll` capability shipped as the `useSlots(filter)` overload
(inline filters, element-wise result identity; `SL-READ-08`–`12`). Old
exports removed outright, no shims; zero in-repo consumers existed outside
the Slot dir so migration was Slot-contained. Case IDs kept as stable keys.
Crew log: `.agents/missions/quarantine-landing/slot-api.md`.

## Candidate features (quarantine-sourced)

Quarantine's Slot freeze (`e04a64c8f`) surfaced exactly one functional
delta beyond the 18 ported test cases; its SPEC gaps line reads "None"
and it added no public API, so this section has one item.

### 1. Zustand vanilla-backed SlotRoot — verdict: DECLINED

- **Source:** quarantine commit `e04a64c8f`, `Slot.ts` rewrite; no case ID
  (no new titles — covered by the existing `SL-*` contract).
- **API sketch:** internal only, same public facade. Per-instance
  zustand/vanilla store holding `{ version, entries, cachedList }`,
  immutable Map+list per mutation, `subscribe` delegating to the store
  with per-listener try/catch. Zero public signature changes.
- **Why not landed:** behavior-identical — the full 52-case suite passes
  on the unchanged hand-rolled Map (52/52 pre-port run, no stability
  delta), and landing takes tests + hardening only (re-target, not
  copy; recon suspect bucket = rewritten sources).
- **Revisit when:** a failing case the Map cannot satisfy, or a measured
  stability/perf delta (subscriber fan-out, concurrent-mode tearing).
- **Open questions:** none — hard DECLINED. Killer reason: identical
  behavior on the full contract, so the rewrite buys nothing but a
  dependency.

## Suspected gaps (no quarantine source)

### 1. Reactive `useScanAll(predicate)` hook — verdict: SHIPPED as `useSlots(filter)`

Was [FEATURES.md §1](./FEATURES.md); landed in the reactive API redesign
with all three design calls resolved (inline-filter identity, snapshot
selector shape, element-wise result identity). See [FEATURES.md
shipped](./FEATURES.md) and `SL-READ-08`–`12`.

### 2. Document-global default root — verdict: DECLINED

- **Evidence:** `SL-USE-01` pins throw-outside-provider with "no implicit
  global root"; `Slot.md` ("Provider is the root boundary") and
  `TESTS.md` out-of-scope both say Leave; SPEC "Do not add a global
  singleton root."
- **API sketch:** what it would add — `useRoot()` falling back to a
  module-level singleton instead of throwing, or a default-export root
  instance shared by all consumers.
- **Why not landed:** factory isolation is the design: two `MyComponent`
  trees must not share a registry, nested providers shadow, a custom
  `root` is captured once. A global root breaks all three.
- **Revisit when:** never expected — would require HQ to overturn the
  Provider-is-the-boundary design law.
- **Open questions:** none — hard DECLINED. Killer reason: a shared root
  lets two compound trees corrupt each other's regions; the throw is
  the feature (`SL-USE-01`).

### 3. Radix-style asChild / prop-merge Slot + Slottable — verdict: DECLINED

- **Evidence:** `TESTS.md` out-of-scope ("Radix `asChild` / prop-merge
  Slot and a public `Slottable`"); `Slot.md` ("Registration is not
  asChild merge"); SPEC Won't-do ("Radix merge Slot").
- **API sketch:** what it would add — a `<Slot>` host merging props onto
  a single child plus a `Slottable` pass-through, per
  `vendor/radix-primitives/packages/react/slot`.
- **Why not landed:** a different primitive sharing only a name;
  merge-onto-a-child lives in `ReferenceSlotPartProps`
  (`components.md`: FocusLock, RovingFocus, Tooltip.Trigger), not here.
- **Revisit when:** never under this component — a merge primitive would
  ship as a separate export, not as Slot.
- **Open questions:** none — hard DECLINED. Killer reason: name
  collision only; merging props onto one child is unrelated to a
  named-region registry.

Omitted with stated reason: PageLayout `getRegisteredSlots`, sidebar
pipelines, and product part wrappers (consumer-owned, built on
`getById`/`select` — not Slot API); Portal relocation (Portal owns
DOM relocation; `Slot.md` "Sibling consume, not Portal"); element in
store state (anti-pattern `SL-VER-01` forbids — content is not state).

## Non-decisions (rejected outright)

- Quarantine `Slot.book.tsx` fixture not ported — `Slot.story.tsx` + CT
  spec already gate composition (log §Progress, §Visual check).
- Matrix-only paths (`matrix/lib/tests/unit/slot.test.tsx`, `/slot`
  page) not kept — suite re-targeted colocated per landing rule
  (landing commit `4b0793d7c`).
- No mangling-class items existed for Slot — headless registry with no
  uncontrolled mode, motion, or focus styling to strip (recon §4
  exhibits don't touch Slot; log: "nothing SUSPECT-visual").

## Walkthrough notes for HQ

- Slot has no Book story by design (renders no DOM) — instead run
  `pnpm agentct Slot` (52 unit + 4 CT), read `Slot.story.tsx`
  `HostLayout`, and view the 5 snapshot baselines in `__e2e__`.
- Most important 1/3 — keep-the-Map (candidate 1, DECLINED above): the
  only real quarantine delta, declined on a 52/52 evidence run. Feel it
  by diffing `git show components-quarantine:.../Slot/Slot.ts` against
  current `Slot.ts`: identical facade, different engine.
- Most important 2/3 — reactive selection shipped ([FEATURES.md
  shipped](./FEATURES.md)): the former `useScanAll` gap is now the
  `useSlots(filter)` overload. Feel it at `Slot.story.tsx` `HostLayout`,
  where the host selects the `"actions"` region reactively with an inline
  filter and no longer touches `useRoot` at all.
- Most important 3/3 — no global root (gap 2, DECLINED above): the
  design law. Feel it via `SL-USE-01` — `useRoot` outside a Provider
  throws, so two compound trees can never share a registry.
- Mechanical follow-ups: none — [PATCHES.md](./PATCHES.md) is empty by
  triage, not by omission (the one deferred item needs design).
- Outstanding work is consumer-side, not Slot: Tree (`SPEC.md:89,136`),
  Switch (`SPEC.md:103`), and DateField (`SPEC.md:70`) still sniff
  children instead of registering parts through this kernel. Slot is
  done when compounds register through it (SPEC Done-when).
