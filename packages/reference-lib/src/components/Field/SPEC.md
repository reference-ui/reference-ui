# Field SPEC

Current freeze, cases, and proof. Design narrative: [Field.md](./Field.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/field.spec.ts`
Page: `/field`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** Field is a CSS bezel, not a form
provider. `NumberField.Group` consumes the same recipe.

Visual polish is not this gate. Do not add Label / Control / Error parts.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Host | `div[data-reference-field]`, no `role` |
| Owned prop | `status?: "warning"` → `data-status` |
| Chrome | descendant `input, textarea, select` surrender standalone chrome |
| Focus | `:has(:is(input, textarea, select):focus-visible)`, not `:focus-within` |
| Group | `NumberField.Group` is a Field-surface host, not a nested Field |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Thin host exists. Chrome recipe is in `core/theme/primitives/forms/field.ts`. |
| Production | **No.** CSS/SURF/COMP unproven. |
| Named `[x]` | 3 / 20 (`FI-DOM-01`–`03` bundled in one title) |
| Playwright | 2 |
| Vitest | 0 |

### Gaps & incoherence

- Focus path uses `data-focus-visible` + JS `setupFocusVisible`, not the
  freeze's pure `:has(...:focus-visible)`. Align the recipe or amend freeze
  decision 5 with a named polyfill reason.
- `FI-DOM-04` is an invented visual title, not in TESTS.md. Do not treat it
  as contract proof.
- No `FI-TYPE-01` compile fixture.

### Vendor

**No lift.** Leave Base UI / Aria Field providers. Own generated Input
recipes + `:has()`.

### Case index

- `[x]` `FI-DOM-01`, `FI-DOM-02`, `FI-DOM-03`
- `[ ]` `FI-TYPE-01`, `FI-CSS-01`–`10`, `FI-SURF-01`, `FI-LAY-01`,
  `FI-COMP-01`–`04`

Invented, not catalog: `FI-DOM-04` (visual focus ring). Rehome or drop.

### Work order

1. Automate `FI-CSS-01`–`10` computed chrome.
2. `FI-SURF-01` / `FI-COMP-03` vs NumberField.Group identity.
3. `FI-TYPE-01` compile fixture.
4. Align focus selector docs with `field.ts` (or change `field.ts`).

### Won't do

Form/Label providers. Field.Chip. Checkbox/Switch bezels. Visual restyle.

### Done when

Every TESTS.md ID is `[x]` here. NumberField.Group shares the recipe without
nesting Field.
