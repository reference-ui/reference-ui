# DateField SPEC

Current freeze, cases, and proof. Design narrative: [DateField.md](./DateField.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/date-field.spec.ts`
Unit: `matrix/lib/tests/unit/date-field.test.ts` (missing)
Page: `/date-field`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**Last hard manufacturing job in the 24.** API and TESTS.md are the
contract. Do not start until NumberField dirty-session and Calendar ISO /
day-range exist to copy.

Visual polish is not this gate. No DateSegment spinbuttons. No JS `Date`
public API.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Dual-host | childless → `input[type=text]`; compound → Field bezel |
| State | required `value` + required `locale`; ISO out; dirty localized string |
| Parts | Input, Trigger, Picker, Calendar alias; **Range** + Start / End |
| Open | Picker upgrades to APG combobox; click or `Alt+ArrowDown`; focus does not open |
| Step | caret day/month/year; Gregorian carry; from null/incomplete = no-op |
| Resolve | Part-Resolution Law, not displayName sniffing |

### Status (2026-09-10)

| | |
| :--- | :--- |
| Engine | Prototype ISO-string input + popup Calendar. |
| Production | **No.** |
| Named `[x]` | 0 / 64 |
| Playwright | 3 titles; open/synthesis smoke, not parse/step/range |
| Vitest | 0 |
| Catalog `[ ]` | `DF-COMP-05`, `DF-COMP-06` (only TESTS.md unchecked items) |

### Reconciliation (2026-09-25, quarantine-landing)

Ported the quarantine `parse.ts` pure kit **verbatim** (staged, unwired —
wiring it would change display text and is out of scope) plus 23 colocated
unit tests proving the kit, and 12 CT re-targets proving current behavior.
`DateField.tsx` is byte-untouched: visuals, API, and behavior frozen.

| | |
| :--- | :--- |
| Named `[x]` | 14 / 64 (CT re-targets against current ISO display) |
| CT | 17 titles green (3 pre-existing + 14 `DF-*`); 8 frozen snapshots unmodified |
| Vitest | 23 parse-kit contract tests (carry no `DF-*` IDs per TESTS.md `[unit]` law) |

### FEATURES campaign (2026-09-26, features-DateField crew)

Landed FEATURES #1 (required `locale`, throw-for-all), #3 (Constraint API:
bounds throw, `isDateUnavailable`, picker-select gating, managed invalid —
typed-path gating waits on the PATCHES #1 engine), #4b (click-while-open
positions caret, proof-pinned), #5 (label-less naming policy, docs-only).
`DateField.tsx` behavior change: invalid bounds / missing locale throw;
no visual delta (all 8 frozen snapshots pass unmodified).

| | |
| :--- | :--- |
| Named `[x]` | 17 / 64 |
| CT | 20 titles green (3 pre-existing + 15 `DF-*` + 2 FEATURES proofs); 8 frozen snapshots unmodified |
| Vitest | 28 tests (25 parse-kit + 3 `renderToString` component proofs carrying `DF-FMT-06` / `DF-BND-04`) |

### PATCHES #7 shadow remainder (2026-09-26, shadow-remainder crew)

Overlay FEATURES #1 (automatic `getRootNode` shadow destination rule)
shipped in-tree, unblocking PATCHES #7. Landed test-only per "zero
DateField design": two shadow fixtures + two honest CT proofs, no
`DateField.tsx` change, no new snapshots.

| | |
| :--- | :--- |
| Named `[x]` | 19 / 64 |
| CT | 22 titles green (3 pre-existing + 17 `DF-*` + 2 FEATURES proofs); 8 frozen snapshots unmodified |

### Playtest PATCHES #1 engine (2026-09-27, date crew)

Landed the controlled-locale text engine: dirty buffer + ISO-gated
live/commit paths, locale `formatLocalDate` display, min/max +
`isDateUnavailable` rejection without clamp, managed invalid
(programmatic constraint + failed boundary), `data-editing` /
`data-empty`, composition suspension. Closes B-15 (validation),
B-16 typing path (picker path was already gated), and the DateField
facet of B-24 (locale display + parse). Out of scope, still open:
stepping (PATCHES #2), submit/reset observers (PATCHES #5), the
`invalid`-prop union (SPEC follow-up), Range, `DF-CAL-04`, `DF-ENV-02`.

| | |
| :--- | :--- |
| Named `[x]` | 45 / 64 |
| CT | 44 titles green (22 pre-existing re-targeted to locale display + 22 engine proofs); 8 frozen snapshots pass unmodified within 2% tolerance (text-only delta — baselines still show pre-fix ISO text, flagged for HQ) |
| Vitest | 30 tests (25 parse-kit + 5 component proofs incl. locale-display asserts) |

### Finish-line P2B (2026-09-28, date crew)

Landed PATCHES #2 (caret-aware stepping: ±1/Shift-±10 per segment with
Gregorian carry, each step commits one ISO, lockout past constraints),
PATCHES #5 (submit/reset observers mirroring NumberField NF-FORM-06/07/08:
failed-boundary blocking, process-once-then-block dirty submits,
reformat-without-callback reset with capture veto), and FEATURES #2
(`DateField.Range` / `Start` / `End`: two endpoint sessions, draft /
committed snapshots, pending-in-draft Calendar anchors, apply-on-completion
with no Apply button, Escape/Cancel restore, focused-endpoint pane sync,
split or shared form names). Settled takes: step-onto-violation locks out;
`canApply=false` blocks commit, never close; anchor clicks restart the
draft; accepted live echo reformats both endpoints. Out of scope, still
open: `DF-CAL-04` (PATCHES #4 slotted binding), `DF-ENV-02` (PATCHES #8 RTL).

| | |
| :--- | :--- |
| Named `[x]` | 60 / 64 |
| CT | 57 titles green (44 pre-existing + 3 stepping + 2 submit/reset + 8 range); 8 frozen snapshots pass unmodified |
| Vitest | 33 tests (25 parse-kit + 5 component proofs + 2 stepping-carry DOM proofs + 1 Range guard proof) |

### Gaps & incoherence

- ~~`defaultValue` (uncontrolled) still exists~~ — landed (HQ controlled-only
  rule, `docs/MISSIONS/API-STANCE.md`): `defaultValue` deleted, `value` +
  `onChange` + `locale` required and throwing; in-repo consumers migrated.
- ~~No `DateField.Range` / Start / End~~ — landed (finish-line P2B,
  2026-09-28): real namespace with draft transactions, not glued fields.
- ~~No locale `formatToParts` parse/format; input shows the ISO string~~ —
  landed (playtest PATCHES #1, 2026-09-27): locale display + parse,
  dirty session, ISO-gated `onChange`, `data-editing`.
- ~~No caret-aware stepping (`selectionStart` unused)~~ — landed
  (finish-line P2B, 2026-09-28): PATCHES #2 wired, `DF-KEY-*` all green.
- ~~`onChange` fed raw text; no ISO gate~~ — landed (same): invalid,
  impossible, and out-of-constraints text never publishes; commit
  reverts with managed invalid.
- ~~Child sniffing instead of Slot / Part-Resolution Law~~ — landed
  (PATCHES #3): parts register into Slot ids, host merges per the Law.
- Combobox attrs complete incl. `aria-controls` link (PATCHES #9);
  `required` passthrough landed (PATCHES #6); submit/reset landed
  (finish-line P2B, 2026-09-28 — PATCHES #5, `DF-FRM-03` / `DF-FRM-05`).
- `DF-DOM-02` / `03` / `DF-CAL-01` titles exist as popup smokes. They do not
  prove dual-host, locale grammar, or caret stepping.

### Vendor

**Lift:** `vendor/react-spectrum` DateField / DatePicker /
`HiddenDateInput` tests; `@internationalized/date` (`parseDate`, Gregorian
constrain); Zag `date-input` / `date-picker` as **contrast**.

**Leave:** DateSegment spinbuttons; `CalendarDate` public API; I18nProvider
locale default; packaged un-unfoldable DatePicker DOM; two-digit year
windows; min/max clamp.

### Case index

- `[x]` `DF-DOM-01` — childless resolves to one text input; ref targets it
- `[x]` `DF-DOM-02` — folded picker renders bezel + synthesized input/trigger;
  day select commits and dismisses
- `[x]` `DF-DOM-03` — Part-Resolution Law: explicit placeholder wins,
  root/explicit classes merge, authored `onInput` executes, managed
  value/role authoritative
- `[x]` `DF-DOM-04` — hidden input only with `name`; carries ISO or `""`
- `[x]` `DF-DOM-05` — display follows controlled prop; `onChange` silent;
  no `data-editing` (asserted against ISO display, not locale text)
- `[x]` `DF-KEY-05` — ArrowUp/Down no-op on null (no stepping exists; honest
  no-op proof, not a stepping proof)
- `[x]` `DF-KEY-06` — ArrowUp/Down no-op when disabled or read-only
- `[x]` `DF-CAL-01` — full APG attrs (`role`, `aria-haspopup`,
  `aria-expanded`, `aria-autocomplete`, `aria-controls` linked to the
  picker id) + deliberate activation + day commit/dismiss
- `[x]` `DF-CAL-03` — trigger `tabIndex={-1}`, `type="button"`, toggles
  picker, focus stays on (returns to) the text input
- `[x]` `DF-FRM-01` — submit sends canonical ISO via hidden input
- `[x]` `DF-FRM-02` — submit sends `""` for controlled null
- `[x]` `DF-FRM-04` — `required` reaches the visible input on both hosts;
  empty required reports platform `valueMissing`; no `setCustomValidity`
- `[x]` `DF-COMP-02` — `htmlFor` label focuses; submit sends `2000-01-15`-style
  canonical ISO (Field-crew handoff, proven with `2024-02-01`)
- `[x]` `DF-ENV-03` — `onChange` payloads are `string` (never `Date`); current
  component echoes raw text, never `null` from typing
- `[x]` `DF-FMT-06` — missing `locale` throws on both hosts; SSR markup
  deterministic with explicit locale (unit `renderToString` proof)
- `[x]` `DF-BND-04` — `min > max` / non-canonical bounds throw during render,
  fail-closed with no edit session (unit `renderToString` proof)
- `[x]` `DF-BND-02` — programmatic out-of-range value displays with managed
  `aria-invalid` / `data-invalid` (asserted against ISO display, not locale
  text; `invalid`-prop union completes with the PATCHES #6 trio follow-up)
- `[x]` `DF-ENV-01` — childless named field inside an open ShadowRoot:
  shadow tree owns the inputs, typing publishes `onChange` (scoped
  events), same-tree submit serializes canonical ISO via the hidden input
- `[x]` `DF-COMP-04` — folded picker inside an open ShadowRoot: focus
  alone does not open, `Alt+ArrowDown` opens, the picker portals into the
  owning shadow root (never `document.body`) via the Overlay automatic
  destination rule, Escape closes, trigger toggle + day commit bubble to
  light-DOM state and dismiss
- `[x]` `DF-FMT-01`, `DF-FMT-02`, `DF-FMT-03`, `DF-FMT-04`,
  `DF-FMT-05`, `DF-EDT-01`, `DF-EDT-02`, `DF-EDT-03`, `DF-EDT-04`,
  `DF-EDT-05`, `DF-EDT-06`, `DF-EDT-07`, `DF-EDT-08`, `DF-EDT-09`,
  `DF-CMT-01`, `DF-CMT-02`, `DF-CMT-03`, `DF-CMT-04`, `DF-CMT-05`,
  `DF-CMT-06`, `DF-CMT-07`, `DF-BND-01`, `DF-BND-03`, `DF-CAL-02`,
  `DF-COMP-01`, `DF-COMP-03` (playtest PATCHES #1 engine, 2026-09-27)
- `[x]` `DF-KEY-01`, `DF-KEY-04`, `DF-KEY-07` (CT stepping proofs),
  `DF-KEY-02`, `DF-KEY-03` (unit Gregorian-carry proofs),
  `DF-FRM-03`, `DF-FRM-05` (CT submit/reset proofs), `DF-RANGE-01`,
  `DF-RANGE-02`, `DF-RANGE-03`, `DF-RANGE-04`, `DF-RANGE-05`,
  `DF-RANGE-06`, `DF-COMP-05`, `DF-COMP-06` (CT range proofs —
  finish-line P2B, 2026-09-28)
- `[ ]` `DF-CAL-04` (PATCHES #4 slotted binding), `DF-ENV-02`
  (PATCHES #8 RTL)
- ~~`DF-ENV-01`, `DF-COMP-04` — ShadowRoot composition~~ — landed
  (PATCHES #7): the Overlay-crew shadow-portal contract (Overlay FEATURES
  #1, automatic rule) shipped and both proofs are green
- `[ ]` `DF-MAN-01`, `DF-MAN-02` — manual release gates

### Work order

1. Controlled ISO + required locale; dual-host without sniffing
   (`DF-DOM-*`).
2. Dirty session + locale `formatToParts` (`DF-FMT-*` / `DF-EDT-*`).
3. Caret segment step + Gregorian carry (`DF-KEY-*`) — needs Calendar ISO
   kit.
4. Picker APG + managed Calendar day bind (`DF-CAL-*`).
5. **`DateField.Range` draft / Apply** (`DF-RANGE-*`).
6. Forms + ID’d e2e/unit (`DF-FRM-*`). Manual IME gates stay manual.

### Won't do

DateSegment spinbuttons. JS `Date` public API. Two-digit year windows.
Clamping. Natural-language parse. Visual polish.
**Separate `minValue` / `maxValue`** — availability is one predicate
(`isDateUnavailable`) shared with Calendar; no min/max clamp on typed input
(out-of-range keeps the dirty session and reports invalid, never coerces).

### Done when

Public API matches DateField.md. Every automated TESTS.md ID is `[x]` here.
Range is a real namespace, not two DateFields glued in a Book story.
