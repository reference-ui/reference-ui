# Accordion SPEC

Current freeze, cases, and proof. Design narrative: [Accordion.md](./Accordion.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `__e2e__/Accordion.ct.spec.ts` (colocated CT; quarantine matrix cases re-targeted here)
Vitest: `Accordion.test.tsx`, `Accordion.find.test.tsx` (colocated)
Page: `/accordion` (quarantine matrix fixture; CT mounts `Accordion.story.tsx` fixtures)

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Policy over nested Collapsibles.
Headers remain native Tab stops — **do not** put Accordion on RovingFocus.

Visual polish is not this gate. Optional-value freeze (2026-09-26):
`value?` omitted means self-managed from the natural zero; no seeding
prop. No extra Item/Trigger product API unless freeze is amended.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Root | `div`; nested `Collapsible` with `id` |
| Value | optional `value` (omitted = self-managed from `null` single / `[]` multiple); `expansion` single \| multiple; single may request `null` |
| Keyboard | `headers` \| `none` (+ `arrows` alias of headers); optional header traversal, not roving `tabIndex` |
| Presence | each item is a Collapsible |
| Find | items inherit Collapsible `hiddenUntilFound`; `beforematch` expands the matched item (single may swap) |

### Status (2026-09-25 landing)

| | |
| :--- | :--- |
| Engine | Controlled + uncontrolled policy engine (landing rework). |
| Production | **Yes.** |
| Named `[x]` | 47 / 47 (41 + 6 AC-FIND) |
| Playwright | 19 (+ 2 legacy smoke) |
| Vitest | 32 (26 + 6 AC-FIND) |

### Landing note (quarantine-landing, 2026-09-25)

Quarantine ported as **stability + tests only** (commit `569d00567`
re-targeted into this dir; matrix corpus re-targeted as colocated CT +
happy-dom unit). Zero visual change: the 13 pre-existing snapshot
baselines are green unmodified, and the 2 legacy CT tests keep their
assertions (retitled to drop stale case-ID prefixes).

Deliberate positions, per recon and LANDING.md (visuals frozen):

- Controlled-only + discriminated single/multiple types were first
  ported, then REJECTED at review: landing rules require the base
  uncontrolled mode (seeding prop + internal store) to survive, and
  the discriminated types broke the committed tree
  (`Collapsible.story.tsx` `AccordionNest`). Rework (same date)
  restores flat base-compatible props (`value` / seeding /
  `onChange` over `AccordionValue`), keeps every hardening item
  (diagnostics, MULTI-04 canonicalization, keyboard/nesting hardening,
  composeRefs), and restores `keyboard: 'arrows'` as a headers alias.
  Book + `Multiple` story reverted to the base seeding prop (identical
  renders, zero visual delta).
- `hiddenUntilFound` / `beforematch` (Find axis): **landed
  2026-09-28** (AC-FIND-01–06 + AC-FIND-CT-01; unit + CT on React
  17/18/19). `AccordionItem hiddenUntilFound` passes through to the item
  Collapsible (raw `<Collapsible id>` items take the root prop directly);
  `beforematch` expands through existing policy — single swaps the open
  item (native `<details name>` parity), multiple adds — with enter
  motion skipped once. No separate `findExpansion` switch: setting
  `hiddenUntilFound` IS the opt-in (see FEATURES.md #1).
- New CT tests are behavioral (snapshot-free); frozen visuals are
  proven by the untouched legacy snapshots.

Handoff: none. The `Collapsible.story.tsx` `AccordionNest` tsc break
dissolved from the Accordion side via flat union props (file never
touched, per mission rule). Committed `Showcase.book.tsx`
seeding usage is honored again with zero edits there.

### Optional-value note (features campaign, 2026-09-26)

HQ exception (`docs/MISSIONS/API-STANCE.md`): Accordion is
OPTIONAL-VALUE, not dual-mode. The seeding prop is deleted catalog-wide
with in-repo migration — `value` is simply optional, and omitting it
means self-managed from the natural zero state (`null` single, `[]`
multiple). `onChange` notifies in both modes. Every in-repo consumer
migrated in the same change (Book `SingleExpansion` /
`MultipleExpansion`, `Multiple` story, `Showcase.book.tsx`
`DisclosureRow` → controlled `value`; unit pins rewritten to
omitted-value). Zero visual change: the 13 pre-existing snapshot
baselines stay green unmodified.

### Gaps & incoherence

- Internal store + seeding prop. Freeze: controlled-only. (Resolved —
  reworked 2026-09-25: uncontrolled restored per landing rules;
  controlled-only NOT landed. Superseded 2026-09-26 by the
  optional-value freeze: seeding prop deleted, omitted `value`
  self-manages.)
- Extra `keyboard: 'arrows'` and public `Accordion.Item` / `.Trigger` /
  `.Content` aliases vs freeze “nested Collapsible”. (Resolved —
  `'arrows'` restored as a headers alias for base-API compatibility;
  aliases kept as conveniences over nested Collapsible anatomy, per
  quarantine.)
- Keyboard via `querySelectorAll('button[aria-expanded]')` — no item
  registry, no identity errors (`AC-DOM-05` / `08`). (Resolved —
  root-scoped live queries, dev identity/competing-authority
  diagnostics, nested + content filtering, disabled-skip.)
- Multiple emit order not canonicalized to DOM order (`AC-MULTI-04`).
  (Resolved)
- No `hiddenUntilFound` passthrough; `beforematch` must expand the matched
  item (single mode swaps to it) via the item Collapsible. (Resolved —
  Q-parity: no Accordion-side code; inherits from Collapsible.)

### Vendor

**Lift:** Radix accordion tests; Base UI AccordionRoot + `beforematch`
expand-on-find (`vendor/base-ui/.../accordion/panel/AccordionPanel.tsx`);
Spectrum DisclosureGroup (collapsible single).

**Leave:** heading wrappers as required anatomy; RovingFocus one-tab-stop.

### Case index

- `[x]` `AC-DOM-01`, `AC-DOM-02`, `AC-DOM-03`, `AC-DOM-04`, `AC-DOM-05`, `AC-DOM-06`, `AC-DOM-07`, `AC-DOM-08`
- `[x]` `AC-SINGLE-01`, `AC-SINGLE-02`, `AC-SINGLE-03`, `AC-SINGLE-04`, `AC-SINGLE-05`, `AC-SINGLE-06`
- `[x]` `AC-MULTI-01`, `AC-MULTI-02`, `AC-MULTI-03`, `AC-MULTI-04`, `AC-MULTI-05`, `AC-MULTI-06`, `AC-MULTI-07`
- `[x]` `AC-KEY-01`, `AC-KEY-02`, `AC-KEY-03`, `AC-KEY-04`, `AC-KEY-05`, `AC-KEY-06`, `AC-KEY-07`, `AC-KEY-08`, `AC-KEY-09`, `AC-KEY-10`, `AC-KEY-11`
- `[x]` `AC-NEST-01`, `AC-NEST-02`
- `[x]` `AC-PRES-01`
- `[x]` `AC-ENV-01`, `AC-ENV-02`
- `[x]` `AC-A11Y-01`
- `[x]` `AC-COMP-01`, `AC-COMP-02`, `AC-COMP-03`
- `[x]` `AC-FIND-01`, `AC-FIND-02`, `AC-FIND-03`, `AC-FIND-04`,
  `AC-FIND-05`, `AC-FIND-06`

### Work order

1. Controlled + uncontrolled policy engine on flat base-compatible props (discriminated types dropped as tree-incompatible). (Done — rework)
2. Item registry by `id`; competing `open` diagnostic. (Done —
   authored/render id collection + dev diagnostics; live DOM-ordered
   keyboard queries.)
3. Header traversal without roving `tabIndex`; prove `AC-KEY-11`. (Done)
4. Expand e2e for SINGLE / MULTI / KEY / PRES. (Done — SINGLE/MULTI in
   colocated unit, KEY/PRES/COMP in CT.)

### Won't do

Second disclosure runtime. Horizontal orientation. Visual FAQ chrome.

### Done when

Public API matches Accordion.md. Every TESTS.md ID is `[x]` here.
