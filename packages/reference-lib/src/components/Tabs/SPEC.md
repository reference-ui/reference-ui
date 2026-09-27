# Tabs SPEC

Current freeze, cases, and proof. Design narrative: [Tabs.md](./Tabs.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/tabs.spec.ts`
Colocated: `Tabs.test.tsx` (contract IDs) + `__e2e__/Tabs.ct.spec.ts`
Page: `/tabs`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Optional `value` (HQ EOD
2026-09-26 optional-value exception; the required-`value` cut and its
dual-mode restoration are both superseded).
Movement is RovingFocus (typeahead off). Tabs owns activation policy only.

Visual polish is not this gate. No `variant`.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Transparent root; List / Tab / Panel fixed hosts + roles |
| State | `value?` (omitted = self-managed from first tab); `orientation?`; `activation?` (horizontal / automatic) |
| ARIA | `aria-controls` only on the selected Tab |
| Panels | all stay mounted; inactive use native `hidden` |

### Status (2026-09-10; proofs updated 2026-09-26)

| | |
| :--- | :--- |
| Engine | Prototype. Does not compose RovingFocus (blocked, see below). |
| Production | **No.** |
| Named `[x]` | 21 / 49 |
| Playwright | 10 CT (3 snapshot + 7 assertion-only) |
| Vitest | 30 tests (contract IDs + FEATURES pins) |

### Gaps & incoherence

- Root `disabled` — not in freeze: removed 2026-09-26 (FEATURES #1,
  partial). Seeding props are gone EOD 2026-09-26 (HQ optional-value
  exception: Tabs keeps uncontrolled support with `value` simply
  optional, self-managed from the first tab).
- `variant` (`line` / `pill`) — PERMANENT kernel API 2026-09-27 (HQ):
  no deletion, no headless split. (The 2026-09-26 retention rationale —
  the member-form collection gap — is fixed in styletrace+atomic and
  closed in `docs/bugs/TABS_RECIPE_COLLECTION.md`; retention is now
  design, not pipeline necessity.) Prepackaged as kernel recipes
  (`tabsListRecipe`/`tabsTabRecipe`); authors extend via normal
  `css()`/`recipe()` through the open `variant` prop.
- Reinvents arrows on List. Freeze: RovingFocus. BLOCKED 2026-09-26
  (FEATURES #2): the kernel stripped controlled current-id with no
  set-currentness export, so composition cannot keep the
  selection-driven tab stop (frozen `TB-SELECT-03`); needs a RovingFocus
  currentness input or Tabs stays forked.
- [x] ~~`tabIndex={isSelected ? 0 : -1}` ties the tab stop to selection~~ —
  fixed 2026-09-25: roving stop follows focus, selection re-syncs it
  (`TB-MANUAL-01` proven in Vitest + CT).
- Line/pill chrome in List/Tab: system recipes since 2026-09-27 (was
  kernel-inline props); visuals byte-identical, all 22 CT snapshots green.

### Vendor

**Lift:** Aria Tabs tests + `useTab` selected-only `aria-controls`; Radix
activation / focus-blur regressions.

**Leave:** deselectable / nullable value.

### Case index

- `[x]` `TB-DOM-01`, `TB-DOM-02`, `TB-DOM-03`, `TB-DOM-04`, `TB-DOM-05`,
  `TB-DOM-07`, `TB-DOM-08`, `TB-DOM-10`, `TB-DOM-11`, `TB-DOM-12`,
  `TB-DOM-14`, `TB-SELECT-03`, `TB-SELECT-04`, `TB-SELECT-07`,
  `TB-MANUAL-01`, `TB-MANUAL-04`, `TB-AUTO-02`, `TB-AUTO-06`,
  `TB-NEST-01`, `TB-EVENT-03`, `TB-DYNAMIC-03`
  (`TB-DOM-02`/`TB-DOM-05` proven by pre-existing CT titles, recorded
  2026-09-25; `TB-SELECT-03`/`TB-SELECT-07`/`TB-DYNAMIC-03` pinned
  2026-09-26 in Vitest + CT.)
- `[ ]` remaining `TB-DOM-*`, `TB-SELECT-*`, `TB-AUTO-*`, `TB-MANUAL-*`,
  `TB-EVENT-*`, `TB-DYNAMIC-*`, `TB-NEST-*`, `TB-ENV-*`, `TB-A11Y-01`,
  `TB-COMP-*`

### Work order

1. Require controlled `value`; remove seeding props / root `disabled`.
   DONE 2026-09-26 (FEATURES #1, partial — `variant` retained, see
   Gaps), then SUPERSEDED EOD 2026-09-26 (HQ optional-value exception:
   `value` optional, self-managed from the first tab, no seeding prop).
2. Compose RovingFocus; Tabs owns automatic vs manual only. BLOCKED —
   needs a kernel currentness input (see Gaps).
3. Manual mode: focus can leave the selected tab stop. DONE (roving
   stop follows focus since 2026-09-25).
4. Port SELECT / AUTO / MANUAL / EVENT with real IDs.

### Won't do

Indicator / panel transitions as kernel. Provider API. Overlay in panels.

### Done when

Public API matches Tabs.md (TRUE 2026-09-26 — optional `value?`,
`orientation?`, `activation?`, `variant?`, per-Tab `disabled?`,
per-Panel `keepMounted?`; no root `disabled`, no seeding prop).
Every TESTS.md ID is `[x]` here. Arrows come from RovingFocus.
