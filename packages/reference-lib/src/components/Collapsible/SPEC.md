# Collapsible SPEC

Current freeze, cases, and proof. Design narrative: [Collapsible.md](./Collapsible.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/collapsible.spec.ts`
Page: `/collapsible`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Controlled disclosure + Presence exit +
measured size vars. Accordion owns collection policy.

Visual polish is not this gate. No default chevron, no `hideIcon`, no GSAP as
public motion.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Parts | Transparent root; Trigger `button`; Content `div` |
| State | controlled `open` / `onChange`; omitted outside Accordion → controlled false |
| Exit | Presence; `aria-controls` stays through exit |
| Size | `--reference-collapsible-content-{height,width}` |
| Find | `hiddenUntilFound?`; closed content stays Ctrl+F-discoverable; `beforematch` opens it and skips author motion once |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype. Open/close + size var smoke. |
| Production | **No.** |
| Named `[x]` | 4 / 39 |
| Playwright | 2 |
| Vitest | 0 |

### Gaps & incoherence

- `defaultOpen`, `onOpenChange` alias, internal open store. Freeze is
  controlled-only.
- Default chevron + `hideIcon` / `icon` chrome — not in the API.
- GSAP `animateCollapse`. Freeze: apps own CSS from measured vars.
- `aria-controls` only when open. `CO-DOM-03`: keep through Presence exit.
- No `hiddenUntilFound` / `beforematch`. Freeze: closed content stays
  find-in-page discoverable and opens on match, skipping motion once.

### Vendor

**Lift:** Radix collapsible + Presence/measure; Base UI panel interrupt /
measure tests + `hiddenUntilFound` / `beforematch` reveal
(`vendor/base-ui/.../collapsible/panel/useCollapsiblePanel.ts`); Aria
Disclosure.

**Leave:** uncontrolled `<details>` / `defaultOpen`.

### Case index

- `[x]` `CO-DOM-01`, `CO-DOM-02`, `CO-DOM-04`, `CO-SIZE-01`
- `[ ]` remaining `CO-DOM-*`, `CO-ACT-*`, `CO-PRES-*`, `CO-SIZE-*`,
  `CO-NEST-*`, `CO-ENV-*`, `CO-COMP-*`

### Work order

1. Controlled-only; remove `defaultOpen` / icon chrome.
2. Keep `aria-controls` through exit; Presence wiring.
3. Publish size vars; stop owning GSAP collapse as the kernel.
4. `hiddenUntilFound` + `beforematch` reveal (skip motion once).
5. Port `CO-PRES` / `CO-ACT` browser cases.

### Won't do

Accordion collection policy. Prescribed visual height recipe.

### Done when

Public API matches Collapsible.md. Every TESTS.md ID is `[x]` here.
