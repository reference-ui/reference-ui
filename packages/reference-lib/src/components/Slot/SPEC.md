# Slot SPEC

Current freeze, cases, and proof. Design narrative: [Slot.md](./Slot.md).
Case catalog: [TESTS.md](./TESTS.md).

Vitest: `Slot.test.tsx` (colocated; re-targeted from quarantine matrix suite)
Playwright CT: `__e2e__/Slot.ct.spec.ts` (`SL-COMP-01`–`04`)

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Slot is the named-region registry
(`createSlotRootContext`, `SlotRoot`), not Radix `asChild` merge.

Visual polish is not this gate. Do not add a `<Slot>` host or a global
singleton root.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Public | `createSlotRootContext`, `SlotRoot`, `resolveSlotVisibility`, helpers |
| Registration | Live getters + `deps`; unregister only on unmount |
| Scan | `scanById` first match; `getAll` stable while the set is unchanged |
| Visibility | omitted → visible; `hidden` wins; `visible: false` → unmounted |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Closest to freeze. Store + composition smokes exist. |
| Production | **Yes.** Provider, hook, StrictMode, and scan cases proven in colocated Vitest. |
| Named `[x]` | 56 / 56 |
| Playwright | 4 (`SL-COMP-01`–`04`, CT) |
| Vitest | 52 (colocated `SL-TYPE-01` through `SL-READ-07`) |

### Gaps & incoherence

- Store is a hand-rolled `Map` + subscribers (`Slot.ts`). Quarantine
  re-backed it on Zustand vanilla; the full 52-case suite passes
  identically on the Map, so the rewrite was not ported (no stability
  delta; same facade, no API fork). Freeze / `hooks.md` / VENDOR pin
  Zustand — revisit only with a failing case or a measured need.
- Compounds that should sit on this kernel still sniff children
  (`displayName`, `__refPart`) instead of registering parts. That is not a
  Slot bug; it is why Slot must finish before DateField/Menu/Tabs unfold.
- `TESTS.md` marks all 56 cases `[x]`. Every case is now proven by a passing test title (52 Vitest + 4 CT).

### Vendor

**Lift:** `vendor/design-system/page-layout/slots/core` (`core.test.ts`,
`react.test.tsx`), `slots/hooks/useSlotRegistration.ts`,
`tests/slot-live-content.test.tsx`, `tests/region-visibility.test.tsx`.

**Leave:** PageLayout, `getRegisteredSlots`, Radix `packages/react/slot`
(`asChild` merge).

### Case index

- `[x]` `SL-TYPE-01`, `SL-REG-01`–`04`, `SL-UNREG-01`–`04`, `SL-SCAN-01`–`04`,
  `SL-SCANALL-01`–`03`, `SL-ALL-01`–`04`, `SL-META-01`–`03`, `SL-SUB-01`–`06`,
  `SL-VER-01`, `SL-VIS-01`–`02`, `SL-HELP-01`–`02`, `SL-COMP-01`–`04`,
  `SL-PROV-01`–`03`, `SL-USE-01`–`02`, `SL-HOOK-01`–`06`, `SL-READ-01`–`07`

### Work order

1. ~~Port `SL-PROV` / `SL-USE` / `SL-HOOK` / `SL-READ` titles (StrictMode
   `SL-HOOK-06`).~~ Done — colocated `Slot.test.tsx`, 52/52 green.
2. ~~Confirm Zustand vs keep the Map — freeze says Zustand; do not fork a
   second registry API.~~ Resolved: keep the Map. The quarantine
   Zustand rewrite is behavior-identical on the full contract (52/52
   pass on the Map), so per landing rules (tests + hardening only,
   re-target not copy) it stays out. Same facade — no fork.
3. Keep `SL-COMP-*` as the composition gate only.
4. Do not mark TESTS.md `[x]` as proof.

### Won't do

Visual polish. Radix merge Slot. Portal-as-named-region.

### Done when

Every TESTS.md case ID appears in a passing title and is `[x]` here.
Compounds register parts through this kernel instead of child sniffing.
