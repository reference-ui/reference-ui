IN PROGRESS — Slot reactive API breaking-clean redesign (slot-api crew)
Branch: reference-system (staying; never switch; never commit).

## Brief
HQ complaint: the Slot reactive API (`useScanById`/`useGetAll`/`useScanAll`) is a
LEAKY ABSTRACTION — `scan` is internal registry vocabulary no slot consumer should
think about. Per `docs/MISSIONS/API-STANCE.md`: no external consumers yet, no V2 —
make the CLEAN BREAKING change now, migrate in-repo consumers in the same change,
no deprecation shims.

## (1) API audit (consumer-facing surface of `packages/reference-lib/src/components/Slot/Slot.ts`, re-exported via `index.ts` → package root)
LEAKY — removed/renamed:
- `SlotRoot.scanById(slotId)` — `scan` is iteration-mechanic vocabulary. Hosts read
  a named region; they never "scan" anything. → `getById(slotId)`.
- `SlotRoot.scanAll(predicate)` — same leak, plus `predicate` is CS vocabulary. → `select(filter)`.
- `useScanById(slotId)` — the headline leak: every host's render code says `scan`. → `useSlot(slotId)`.
- `useGetAll()` — not `scan`, but leaky in the second sense: `get` promises a
  one-shot read while the hook is a live subscription; also asymmetric with any
  `useSlot*` family. Named in the HQ complaint directly. → `useSlots()` (+ filtered form).
- `useScanAll` (FEATURES.md §1, unshipped) — never lands under that name; the
  wanted capability ships as the `useSlots(filter)` overload.
KEPT — deliberate, with reason:
- `SlotRegistration` — the domain record type (what `register()` stores); "registration"
  is the domain word, not an implementation leak. Renaming would churn every
  signature for zero consumer gain.
- `register` / `unregister` — fill-side domain verbs; accurate on both sides.
- `getAll()` — accurate imperative vocabulary with pinned cached-snapshot semantics
  (SL-ALL-03); only the *hook* wrapper was misnamed.
- `useRoot` / `SlotRoot` / `createSlotRootContext` / Provider `root` prop — scoping
  + test seam + advanced escape hatch (design law: Provider is the root boundary).
  Normal host code no longer needs `useRoot` after this change (story proves it).
- `subscribe` / `getVersion` — the `useSyncExternalStore` contract for custom
  bindings (same exposure as Zustand vanilla). Mechanics, but load-bearing ones.
- `useSlotRegistration`, `UseSlotRegistrationOptions` — fill-side API, clean.
- `resolveSlotVisibility`, `SlotVisibility`, `ResolvedSlotVisibility`,
  `createSlotCacheKey`, `transformSlotElements` — host helpers, clean vocabulary.
- Case IDs (`SL-SCAN-*`, `SL-SCANALL-*`, …) — stable opaque keys, not consumer API.
  Kept; human prose retitled.

## In-repo consumer grep (repo-wide, regex)
`useScanById|useGetAll|scanById|scanAll|createSlotRootContext|SlotRoot|useSlotRegistration|useRoot|resolveSlotVisibility|createSlotCacheKey|transformSlotElements`
→ hits ONLY inside `packages/reference-lib/src/components/Slot/` (+ package-root
re-export line + a generated-string copy in `reference-mcp` catalog + VENDOR.md
history). Tree/Menu/Tabs/DateField do NOT consume the kernel yet (consistent with
DECISIONS.md walkthrough: they still sniff children — consumer-side future work,
not this mission). So migration = Slot dir only; consumer-suite runs are
no-collateral regression proof. `reference-mcp/.../library-catalog.ts` embeds a
stale Slot.md string copy — OUT OF SCOPE (read-only elsewhere); flagged as
follow-up to regenerate.

## (2) Streamlined proposal (shipped as designed here)
Consumer-framed: hosts READ regions. Noun stays `slot` (the domain word);
verbs become get/select/subscribe, never scan.
```ts
// Root (imperative / test seam — same class, renamed reads)
root.getById(slotId: string): SlotRegistration<TMeta> | undefined  // was scanById
root.select(filter: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[] // was scanAll
root.getAll(): SlotRegistration<TMeta>[]  // unchanged
// Context (reactive — the actual consumer surface)
useSlot(slotId: string): SlotRegistration<TMeta> | undefined  // was useScanById
useSlots(filter?: (slot: SlotRegistration<TMeta>) => boolean): SlotRegistration<TMeta>[] // was useGetAll + NEW filtered form
```
Host code before/after:
```tsx
const title = useScanById('title')            →  const title = useSlot('title')
const all = useGetAll()                       →  const all = useSlots()
const root = useRoot()                        →  (deleted)
root.scanAll(s => s.slotId.startsWith('a'))   →  useSlots(s => s.slotId.startsWith('a'))
```
FEATURES.md §1 open calls — resolved:
- Predicate identity: inline closures supported, NO `useCallback` required. The
  filter is held in a latest-ref; the store subscription is version-based so a new
  closure identity never resubscribes — zero resubscribe cost by construction.
- Snapshot selector shape: ONE `useSyncExternalStore`. No-filter path snapshots
  `root.getAll()` (root-owned cache, as before). Filtered path computes the
  selection inside `getSnapshot` against the latest filter.
- Result identity (SL-READ-07 analog): filtered results are element-wise compared
  against the cached array — same match set (same length, `===` per slot) returns
  the IDENTICAL array, so unrelated registrations neither re-render the host
  (snapshot bail-out) nor break memoization downstream. New array only when the
  match set actually changes. Pinned by new SL-READ-11 (+ SL-READ-08/09/10/12).
Why `useSlots(filter?)` (one hook) over `useSlotsWhere` (third hook): smallest
contract that holds forever (API-STANCE) — one selection hook, optional filter,
mirrors `Array.filter` which every consumer already knows. Param named `filter`,
not `predicate`.

## Progress
- Implemented breaking-clean in `Slot.ts`: `getById`/`select(filter)` on
  `SlotRoot`; `useSlot`/`useSlots(filter?)` on the context; old exports
  removed outright, no shims. `useSlots` = one `useSyncExternalStore` with
  latest-filter ref + element-wise identity cache (see proposal above).
- `Slot.story.tsx` `HostLayout` migrated: `useSlot('title')`, `useSlots()`,
  `useSlots(s => ...actions...)` inline — `useRoot` import GONE from host
  code. The FEATURES.md gap site (imperative scan-in-render) is deleted.
- `Slot.test.tsx`: all 52 cases migrated (call sites + titles), 5 new cases
  added (`SL-READ-08`–`12`: order, empty, update, identity-across-unrelated,
  inline-filter-no-resubscribe). Docs migrated: `Slot.md`, `TESTS.md`,
  `SPEC.md` (61/61), `FEATURES.md` (§1 → shipped), `DECISIONS.md` (landed
  note + gap 1 SHIPPED), CT `SL-COMP-03` title. Case IDs kept as stable keys.
- Proof: `pnpm agentct Slot --unit` → 57/57; `pnpm agentct Slot --e2e` →
  4/4 react19, snapshots unmodified. Consumers (no-collateral proof):
  Tree unit 3 + E2E 52/52; Menu unit 8 + E2E 30/30; Tabs unit 17 + E2E 6/6;
  DateField unit 23 + E2E 15/15 — all green. `tsc --noEmit`: Slot.ts clean;
  only Slot-test errors are 2 pre-existing `props.id` lines byte-identical
  to HEAD (repo has wider pre-existing tsc noise: ct.ts, Listbox, Tabs).
- UX review: NESTED reviewer spawn ACCEPTED (not pool-full) — verdict PASS:
  Look PASS zero drift (5 baselines git-clean, story diff identifiers-only);
  Feel APPROVE 4/4 renames + HostLayout reactive fix as enhancement;
  Accessibility no findings (headless, no DOM). Full text in child session
  log (subagent 01a0dd7f-9257…); reviewer noted Slot CT artifacts since
  wiped by sibling runs — ruled from baselines + diffs instead.
- Surprises: (1) ZERO in-repo Slot consumers outside the Slot dir —
  Tree/Menu/Tabs/DateField never adopted the kernel (child-sniffing still),
  so migration was Slot-contained; (2) `reference-mcp` library-catalog
  embeds a stale Slot.md string copy — out of scope, needs regeneration;
  (3) nested spawn succeeded despite sibling pressure.
- Handoffs: consumer compounds (Tree/Menu/Tabs/DateField SPECs) still need
  to register parts through this kernel instead of sniffing children —
  future mission, now against the CLEAN `useSlot`/`useSlots` surface.
  Regenerate `reference-mcp` library-catalog Slot entry (stale `useScanById`
  string). No V2, no shims — per API-STANCE.

## Files touched (Slot dir + this log only)
- `packages/reference-lib/src/components/Slot/Slot.ts` (new API)
- `packages/reference-lib/src/components/Slot/Slot.test.tsx` (52 migrated + 5 new)
- `packages/reference-lib/src/components/Slot/Slot.story.tsx` (host on new hooks)
- `packages/reference-lib/src/components/Slot/__e2e__/Slot.ct.spec.ts` (title only)
- `packages/reference-lib/src/components/Slot/Slot.md`, `TESTS.md`, `SPEC.md`,
  `FEATURES.md`, `DECISIONS.md` (docs)
- `.agents/missions/quarantine-landing/slot-api.md` (this log)

COMPLETE
