# DateField patches (mechanical backlog)

Fully-specified OPEN/DEFERRED items from DECISIONS.md: a test could pin
each one today — only scheduling or an upstream dependency blocks them.
For items needing an HQ design call, see FEATURES.md.

### 1. Controlled-locale text engine (from DECISIONS candidate #1)

- **What:** locale `formatToParts` display + dirty-session ISO-gated `onChange`; partial text stays visible, blur/Enter commits or reverts.
- **Acceptance:** proofs for `DF-FMT-01`–`05`, `DF-EDT-01`–`09`, `DF-CMT-01`–`07`, `DF-COMP-01`/`03` green, plus manual `DF-MAN-01`/`02`.
- **Source:** quarantine `1150c8e6e` `DateField.tsx` + staged `parse.ts`; shape in TESTS.md freeze decisions 4–7.

### 2. Caret-aware segment stepping (from DECISIONS candidate #3)

- **What:** unprevented ArrowUp/Down steps the day/month/year segment under the caret (±1, Shift = ±10) with Gregorian carry; each step commits one ISO.
- **Acceptance:** `DF-KEY-01`–`04`, `DF-KEY-07` proofs green (`KEY-05`/`06` no-ops already landed); needs PATCHES #1 display first.
- **Source:** quarantine `getSegmentAtCaret`/`stepDateSegment`; pure fns already staged in `parse.ts` with unit coverage.

### 3. Part-Resolution Law (from DECISIONS candidate #4)

- **What:** replace child-sniffing with Slot registration: root shorthand seeds the implicit input, explicit `DateField.Input` overrides, managed props always win, authored handlers run first.
- **Acceptance:** `DF-DOM-03` proof green.
- **Source:** quarantine Slot-context merge; Law verbatim in TESTS.md freeze decision 9.

### 4. Slotted Calendar bound alias + live grid sync (from DECISIONS candidate #7)

- **What:** `DateField.Calendar` becomes a true bound alias (managed `value`/`onChange`/`locale`/`mode`/`min`/`max`/`isDateUnavailable` omitted from required props); typing a complete date moves the open pane without dismissing.
- **Acceptance:** `DF-CAL-02`, `DF-CAL-04` proofs green; needs PATCHES #1 and FEATURES #3 first.
- **Source:** quarantine `DateField.tsx:277`–`318`; managed set in `DateField.md` §"Managed Calendar props".

### 5. Submit-boundary blocking + reset reformat (from DECISIONS candidate #8)

- **What:** every dirty field observes `requestSubmit()` (failed boundary blocks submit until resolution); `form.reset()` reformats without changing controlled ISO.
- **Acceptance:** `DF-FRM-03`, `DF-FRM-05` proofs green, mirroring NumberField's settled rules; needs PATCHES #1 first.
- **Source:** quarantine form observers; rules in `DateField.md` §"Validity, forms, submit, and reset".

### 6. Native `required` / `valueMissing` passthrough (from DECISIONS candidate #9)

- **What:** pass `required` to the visible input; empty required reports platform `valueMissing`; never `setCustomValidity` for date constraints.
- **Acceptance:** one CT proof (`DF-FRM-04`) green; no engine needed. (Full `required`/`readOnly`/`invalid` trio + `data-*` state is follow-up scope, not a blocker.)
- **Source:** quarantine `required` passthrough; SPEC `DF-FRM-04` (`[ ]` — untested on reference-system).

### 7. ShadowRoot composition proofs (from DECISIONS candidate #10)

- **What:** port the two quarantine shadow titles as honest CT proofs once the Overlay shadow-portal contract ships (picker portals into the owning root).
- **Acceptance:** `DF-ENV-01`, `DF-COMP-04` proofs green; blocked on the Overlay crew, zero DateField design.
- **Source:** quarantine `matrix/lib/tests/e2e` titles; handoff in crew log `.agents/missions/quarantine-landing/date-field.md`.

### 8. RTL direction inheritance proof (from DECISIONS candidate #11)

- **What:** under `dir="rtl"`, direction changes caret presentation only; segment order stays locale `formatToParts`, never mirrored.
- **Acceptance:** `DF-ENV-02` (`en-GB` under rtl) proof green; needs PATCHES #1 display first.
- **Source:** quarantine e2e title.

### 9. `aria-controls` wiring on the combobox input (from DECISIONS gap #1)

- **What:** when `DateField.Picker` upgrades the input to `role="combobox"`, set `aria-controls={pickerId}`; remove the SPEC scoping caveat.
- **Acceptance:** extended `DF-CAL-01` asserting `aria-controls` matches the picker ID green; confirm the picker ID generator first.
- **Source:** TESTS.md `DF-CAL-01` contract; UX a11y finding #1.

### 10. Trigger-toggle focus retention (from DECISIONS gap #2)

- **What:** clicking `DateField.Trigger` toggles the picker while focus stays on (or returns to) the text input.
- **Acceptance:** extended `DF-CAL-03` asserting input focus green; DateField-side is one assertion once Overlay settles trigger focus-retention semantics.
- **Source:** TESTS.md `DF-CAL-03`; crew log "Surprises".
