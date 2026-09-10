# Switch SPEC

Current freeze, cases, and proof. Design narrative: [Switch.md](./Switch.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/switch.spec.ts`
Page: `/switch`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Required controlled `checked`. Default
thumb if omitted. Apps style travel via `data-state` only.

Visual polish is not this gate. No `defaultChecked`, no hidden checkbox, no
geometry CSS vars.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Host | `button[type=button][role=switch]` |
| Thumb | `span`; omitted → one default thumb |
| State | required `checked`; `onChange?(boolean)`; `disabled?` |
| ARIA | `aria-checked` true/false — not `aria-pressed`, not mixed |
| Form | application HTML; Switch does not serialize (no hidden checkbox / `name`) |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype button + thumb. |
| Production | **No.** |
| Named `[x]` | 3 / 27 (`SW-DOM-01`–`03` in one smoke) |
| Playwright | 1 |
| Vitest | 0 |

### Gaps & incoherence

- `checked?` + `defaultChecked` + internal store. Freeze: `checked` required,
  no uncontrolled mode.
- Hardcoded thumb `transform` / transition. Freeze: no geometry authority;
  `data-state` only.
- `displayName === 'SwitchThumb'` sniffing instead of part identity.
- Type Omit misses `aria-checked` / `aria-pressed` vs freeze.

### Vendor

**Lift:** Radix `packages/react/switch/src/switch.test.tsx` (controlled,
`data-state` on root and thumb, native activation). Base UI
`packages/react/src/switch` (button + Thumb anatomy).

**Leave:** Aria `input` host; form-field wiring; Radix `defaultChecked`.

### Case index

- `[x]` `SW-DOM-01`, `SW-DOM-02`, `SW-DOM-03`
- `[ ]` `SW-TYPE-01`, remaining `SW-DOM-*`, `SW-ACT-*`, `SW-NAME-*`,
  `SW-ENV-*`, `SW-A11Y-01`, `SW-COMP-*`

### Work order

1. Require `checked`; remove `defaultChecked` / local flip.
2. Remove hardcoded thumb transform; keep `data-state`.
3. Detect authored `Switch.Thumb` structurally (Slot or part marker), not
   `displayName`.
4. Port `SW-ACT` / `SW-NAME` / `SW-ENV` titles.

### Won't do

Visual thumb polish. Orientation props.

**Hidden form checkbox** (Radix ships a `BubbleInput`; we don't). A boolean
switch is trivially bound to an application `input`, so serializing it here
would add a second source of truth and an uncontrolled seam the freeze
forbids. Same stance as Slider. NumberField/DateField *do* serialize because
their canonical value is a parsed/formatted scalar the app can't reconstruct
from raw text.

### Done when

Public API matches Switch.md. Every TESTS.md ID is `[x]` here.
