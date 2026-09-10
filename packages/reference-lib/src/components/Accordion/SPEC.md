# Accordion SPEC

Current freeze, cases, and proof. Design narrative: [Accordion.md](./Accordion.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/accordion.spec.ts`
Page: `/accordion`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Policy over nested Collapsibles.
Headers remain native Tab stops — **do not** put Accordion on RovingFocus.

Visual polish is not this gate. No `defaultValue`. No extra Item/Trigger
product API unless freeze is amended.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Root | `div`; nested `Collapsible` with `id` |
| Value | controlled; `expansion` single \| multiple; single may request `null` |
| Keyboard | `headers` \| `none`; optional header traversal, not roving `tabIndex` |
| Presence | each item is a Collapsible |
| Find | items inherit Collapsible `hiddenUntilFound`; `beforematch` expands the matched item (single may swap) |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. One smoke for single expand + arrows. |
| Production | **No.** |
| Named `[x]` | 1 / 41 (`AC-DOM-01`) |
| Playwright | 1 |
| Vitest | 0 |

### Gaps & incoherence

- `defaultValue` + internal store. Freeze: controlled-only.
- Extra `keyboard: 'arrows'` and public `Accordion.Item` / `.Trigger` /
  `.Content` aliases vs freeze “nested Collapsible”.
- Keyboard via `querySelectorAll('button[aria-expanded]')` — no item
  registry, no identity errors (`AC-DOM-05` / `08`).
- Multiple emit order not canonicalized to DOM order (`AC-MULTI-04`).
- No `hiddenUntilFound` passthrough; `beforematch` must expand the matched
  item (single mode swaps to it) via the item Collapsible.

### Vendor

**Lift:** Radix accordion tests; Base UI AccordionRoot + `beforematch`
expand-on-find (`vendor/base-ui/.../accordion/panel/AccordionPanel.tsx`);
Spectrum DisclosureGroup (collapsible single).

**Leave:** heading wrappers as required anatomy; RovingFocus one-tab-stop.

### Case index

- `[x]` `AC-DOM-01`
- `[ ]` remaining `AC-DOM-*`, `AC-SINGLE-*`, `AC-MULTI-*`, `AC-KEY-*`,
  `AC-NEST-*`, `AC-PRES-01`, `AC-ENV-*`, `AC-A11Y-01`, `AC-COMP-*`

### Work order

1. Controlled-only + discriminated single/multiple types.
2. Item registry by `id`; competing `open` diagnostic.
3. Header traversal without roving `tabIndex`; prove `AC-KEY-11`.
4. Expand e2e for SINGLE / MULTI / KEY / PRES.

### Won't do

Second disclosure runtime. Horizontal orientation. Visual FAQ chrome.

### Done when

Public API matches Accordion.md. Every TESTS.md ID is `[x]` here.
