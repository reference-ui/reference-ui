# Field SPEC

Current freeze, cases, and proof. Design narrative: [Field.md](./Field.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright CT: `__e2e__/Field.ct.spec.ts` (stories in `Field.story.tsx`)
Vitest: `Field.test.tsx` (colocated)
Matrix: `matrix/lib/tests/e2e/field.spec.ts`, page `/field` (untouched by this landing)

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

### Status (2026-09-25, quarantine-landing Field crew)

| | |
| :--- | :--- |
| Engine | Thin host exists. Chrome recipe is in `core/theme/primitives/forms/field.ts`. |
| Production | **Yes, except `FI-CSS-06`.** 19 / 20 case IDs proven by CT/unit titles (2 bezel-subset scoped). |
| Named `[x]` | 19 / 20 (`FI-CSS-06` blocked — see gaps) |
| Playwright CT | 20 (19 carry `FI-*` IDs; prefix/suffix is unnumbered) |
| Vitest | 1 (`FI-TYPE-01`) |

### Finish-line P2B (2026-09-28, date crew)

Landed PATCHES #2 (hosted DateField typing/publish session re-added
verbatim over the proven DateField contract, plus a Range
two-inputs-one-bezel hosted title) and PATCHES #3 (hosted token-picker
commit/remove flows over proven Combobox CB-COMMIT/CB-SELECT semantics).
`FI-COMP-02` is now full; `FI-COMP-04` is full except ring-on-opener,
which still waits on the `FI-CSS-06` theme fix. No `Field.tsx` change.

| | |
| :--- | :--- |
| Named `[x]` | 19 / 20 (`FI-CSS-06` blocked — see gaps) |
| Playwright CT | 21 (20 carry `FI-*` IDs; prefix/suffix is unnumbered) |

### Gaps & incoherence

- `FI-CSS-06` (no bezel ring when a nested Button is keyboard-focused)
  is **blocked, not proven**: the current `setupFocusVisible` tracker
  sets `data-focus-visible` on the Field host for *any*
  keyboard-focused descendant, so the bezel rings on button focus.
  Quarantine fixed this inside the shared-theme files — SUSPECT
  material per recon (Exhibit 3) and outside Field scope. Proving
  `FI-CSS-06` needs a theme-crew change to focus propagation; the
  `FI-COMP-04` ring-on-opener/chip assertions wait on the same fix.
- Focus path polyfill reason (resolved): browsers natively fire
  `:focus-visible` on `<input>`/`<textarea>` even on pointer clicks.
  `setupFocusVisible` sets `[data-focus-visible]` on keyboard
  navigation only, so mouse clicks change the bezel border without a
  ring while Tab applies it (`FI-CSS-05`).
- `FI-DOM-04` dropped (invented title, never in TESTS.md).
- `FI-TYPE-01` proven by the colocated `Field.test.tsx` compile
  fixture (`@ts-expect-error` over the omitted ARIA surface).

### Vendor

**No lift.** Leave Base UI / Aria Field providers. Own generated Input
recipes + `:has()`.

### Case index

- [x] `FI-DOM-01` — wrapping `div`, no `role`, `data-reference-field`.
- [x] `FI-DOM-02` — no ARIA validity copied from the enclosed input;
  plus a runtime title proving the prohibited surface is stripped
  from JS callers and the data pins cannot be spoofed.
- [x] `FI-DOM-03` — `data-status="warning"` only when
  `status="warning"` (toggle on and off).
- [x] `FI-TYPE-01` — public type omits `role` and validity ARIA
  (colocated compile fixture).
- [x] `FI-CSS-01` — descendant Input enters embedded mode; bezel
  carries the border.
- [x] `FI-CSS-02` — sibling Input outside Field stays fully chromed.
- [x] `FI-CSS-03` — Textarea and Select embed via the same
  descendant selector.
- [x] `FI-CSS-04` — surface hosts embed DateField, Combobox.Input,
  and NumberField.Input.
- [x] `FI-CSS-05` — mouse click changes bezel border without a
  ring; Tab puts the 2px ring on Field, not on Input.
- [ ] `FI-CSS-06` — BLOCKED (theme focus propagation; see gaps).
- [x] `FI-CSS-07` — invalid chrome follows `:has([aria-invalid])`
  on the input only.
- [x] `FI-CSS-08` — disabled chrome from the enclosed control, not
  a nested Button.
- [x] `FI-CSS-09` — read-only chrome from `[readonly]` on the
  enclosed input.
- [x] `FI-CSS-10` — warning chrome from `data-status` stacks with
  invalid without implying it.
- [x] `FI-SURF-01` — one bezel recipe across Field, Field+DateField,
  Field+Combobox.Input, and NumberField.Group.
- [x] `FI-LAY-01` — prefix, control, action in authored order, one row.
- [x] `FI-COMP-01` — Label `htmlFor` stays on the input; AT
  attributes live on Input.
- [x] `FI-COMP-02` — compound DateField bezel wraps input + trigger
  with hosted typing/publish sessions, plus a Range two-inputs-one-bezel
  hosted title (PATCHES #2, finish-line P2B).
- [x] `FI-COMP-03` — NumberField.Group consumes the recipe with no
  nested Field (double-bezel wrap is application error).
- [x] `FI-COMP-04` — token picker hosting: label/input-embed/opener/
  chips/portal/invalid-bezel plus hosted commit/remove flows (PATCHES #3,
  finish-line P2B). Ring-on-opener waits on the `FI-CSS-06` theme fix.

### Work order

1. [x] Automate `FI-CSS-01`–`10` computed chrome (except blocked `FI-CSS-06`).
2. [x] `FI-SURF-01` / `FI-COMP-03` vs NumberField.Group identity.
3. [x] `FI-TYPE-01` compile fixture.
4. [x] Align focus selector docs with `field.ts`.

### Won't do

Form/Label providers. Field.Chip. Checkbox/Switch bezels. Visual restyle.

### Done when

Every TESTS.md ID is `[x]` here except blocked `FI-CSS-06`.
NumberField.Group shares the recipe without nesting Field. [DONE
except `FI-CSS-06`, which needs the theme crew]
