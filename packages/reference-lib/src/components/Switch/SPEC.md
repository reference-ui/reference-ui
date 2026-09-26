# Switch SPEC

Current freeze, cases, and proof. Design narrative: [Switch.md](./Switch.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `__e2e__/Switch.ct.spec.ts` (colocated CT; quarantine matrix cases re-targeted here)
Vitest: `ssr.test.tsx`, `Switch.test.tsx`, `types.test.tsx` (colocated)
Page: `/switch` (quarantine matrix fixture; CT mounts `Switch.story.tsx` ParityFixture)

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

### Status (2026-09-25 landing)

| | |
| :--- | :--- |
| Engine | Hardened button + thumb (landing). |
| Production | **No** — freeze items 1–2 superseded, see Landing note. |
| Named `[x]` | 23 / 27 |
| Playwright | 22 |
| Vitest | 4 |

### Landing note (quarantine-landing, 2026-09-25)

Quarantine ported as **tests + hardening only**. Deliberate divergences
from the freeze catalog above, per recon (mangling exhibits 1–2):

- Uncontrolled mode (`defaultChecked` + internal store) is **preserved**,
  not removed. Freeze work-order item 1 is superseded.
- Thumb `transform` / transition is **preserved**. Freeze work-order
  item 2 is superseded; visuals are frozen per LANDING.md.
- `SW-ACT-08` is re-targeted: pins the controlled-without-`onChange`
  readout (holds `checked`); uncontrolled-without-`onChange` toggles
  its own DOM by design.
- `SW-DOM-04` asserts extra-child presence, not visibility: the themed
  track clips extra authored children (matrix page was unstyled).
- Not ported: `SW-DOM-08` (quarantine e2e only re-proved the DOM-04
  swap), `SW-COMP-01` (covered by existing CT + `SW-ACT-03` +
  `SW-NAME-01`), `SW-ENV-03` (synthetic shadow-DOM harness, not lib
  behavior), `SW-COMP-03` (Overlay/RovingFocus territory).
- Source hardening (no visual change): `Switch.Thumb` forwards ref;
  consumer `aria-pressed` is stripped at runtime; managed
  `type`/`role`/`aria-checked`/`data-state` win over consumer conflicts.

### Features-campaign note (quarantine-landing, 2026-09-26)

FEATURES #2, #3, #5 landed; #1 (restyle) and #4 (thumb ref) stay HELD.
Deliberate divergences from the TESTS.md freeze catalog, per triage:

- `SW-TYPE-01` is re-targeted: the Omit now also hides `aria-checked` /
  `aria-pressed` / `data-state` / `data-disabled`, and `onChange` is widened
  to `(checked, event)`. Single-argument handlers keep working.
- `SW-DOM-04`'s extra child is now covered by the `Switch.md` doc note
  (extras are clipped; keep them decorative and `aria-hidden`) — no guard
  built, none proven necessary.
- No visual change: all 7 snapshots must pass byte-identical.

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

- `[x]` `SW-TYPE-01` (re-targeted: `defaultChecked` allowed + pinned)
- `[x]` `SW-DOM-01`, `SW-DOM-02`, `SW-DOM-03`, `SW-DOM-04`, `SW-DOM-05`,
  `SW-DOM-06`, `SW-DOM-07`
- `[x]` `SW-ACT-01`, `SW-ACT-02`, `SW-ACT-03`, `SW-ACT-04`, `SW-ACT-05`,
  `SW-ACT-06`, `SW-ACT-07`, `SW-ACT-08` (re-targeted, see Landing note)
- `[x]` `SW-NAME-01`, `SW-NAME-02`
- `[x]` `SW-ENV-01`, `SW-ENV-02`, `SW-ENV-04`
- `[x]` `SW-A11Y-01`
- `[x]` `SW-COMP-02`
- `[ ]` `SW-DOM-08`, `SW-ENV-03`, `SW-COMP-01`, `SW-COMP-03` (not ported,
  see Landing note)

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
