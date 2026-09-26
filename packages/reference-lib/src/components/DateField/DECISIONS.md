# DateField decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: locale-aware controlled ISO date textbox folding into picker or range picker.

## Landed (context, 2-4 lines)

The quarantine-landing arc staged quarantine's `parse.ts` pure kit verbatim
(unwired, unexported — API frozen), added 23 kit-contract unit tests and 12
snap-free `DF-*` CT re-targets (SPEC 12/64), and kept `DateField.tsx` byte-untouched:
zero API/visual/behavior change, UX verdict LAND. Crew log:
`.agents/missions/quarantine-landing/date-field.md`. Landing commit: `95bf1a2c1`.

## Candidate features (quarantine-sourced)

### 1. Controlled-locale text engine — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx` (dirty-session
  machine, `formatLocalDate`/`parseLocalDate` wiring) + `parse.ts` (already
  staged); cases `DF-FMT-01`–`05`, `DF-EDT-01`–`09`, `DF-CMT-01`–`07`,
  downstream `DF-COMP-01`, `DF-COMP-03`.
- **API sketch:** no new props — behavior change: input displays locale
  `formatToParts` text instead of the ISO string; typing runs a dirty session
  (`data-editing`) that publishes `onChange(ISODate|null)` only for complete
  valid edits; partial text stays visible without publishing; blur/Enter
  commits or reverts to formatted controlled text; `preventDefault` on blur
  suspends commit; composition suspends parsing; canonical `YYYY-MM-DD`
  accepted as interchange in any locale.
- **Why not landed:** feature-needs-rewrite — wiring the staged kit changes
  every displayed string and the `onChange` contract (raw-text echo → ISO
  gate), i.e. a visual + behavior change, which the mission forbids.
- **Revisit when:** HQ charters the controlled-locale rework with `parse.ts`
  (staged, proven by 23 unit tests) as its foundation. Manual gates
  `DF-MAN-01`/`02` (OS IME, mobile keyboards) ride along with this engine.
- **Open questions:** none on shape — TESTS.md freeze decisions 4–7 specify
  it fully; only scheduling.

### 2. Required explicit locale (no default) — verdict: OPEN

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx:688` + `:1539`
  (`throw` without `locale`); case `DF-FMT-06` (quarantine unit).
- **API sketch:** `locale: string` becomes required on `DateField` /
  `DateField.Range`; omitting it throws
  `[reference-ui] DateField requires an explicit locale prop.` No
  `navigator.language` read, ever; SSR markup identical across environments.
- **Why not landed:** API removal — current `locale` is optional with an
  `'en-US'` default, and deleting a default is a breaking change the mission
  forbids. The throw also only makes sense atop candidate 1 (with ISO
  display, locale barely matters).
- **Revisit when:** candidate 1 is chartered — the locale-default question
  must be settled in the same design pass, before any code.
- **Open questions:** does HQ accept breaking every default-locale consumer
  for SSR determinism, or keep an explicit opt-in default (e.g. require
  `locale` only when a Picker is present)? Is a dev-only warning an
  acceptable middle step?

### 3. Caret-aware segment stepping — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx`
  (`getSegmentAtCaret`/`stepDateSegment` wiring); cases `DF-KEY-01`–`04`,
  `DF-KEY-07` (`KEY-05`/`06` no-ops already landed as honest proofs).
- **API sketch:** no new props — behavior: unprevented ArrowUp/Down steps
  the day/month/year segment under the caret (±1, Shift = ±10) with
  Calendar Gregorian carry (`31/01/2024` + 1 month → `2024-02-29`); caret
  on a separator uses the nearest numeric segment; from null/incomplete
  text, or when disabled/read-only, stepping stays a no-op; each step is
  a commit boundary publishing one ISO.
- **Why not landed:** needs candidate 1 — caret→segment mapping requires
  locale grammar display (current ISO text has fixed segments the freeze
  does not bless) plus `selectionStart` tracking that does not exist.
- **Revisit when:** candidate 1 lands; the staged `parse.ts` already
  contains the pure stepping functions, proven by unit tests.
- **Open questions:** none — TESTS.md freeze decision 6 and `DateField.md`
  §"Caret-aware segment stepping" specify it fully.

### 4. Part-Resolution Law — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx` Slot-context
  merge (`finalInputProps = merge(inputDefaults, rootInputProps,
  explicitInputProps, managedMachineProps)`); case `DF-DOM-03`; design
  `DateField.md` §"Part-resolution law".
- **API sketch:** no new props — contract: root shorthand props
  (`placeholder`, `className`, `onInput`) seed the implicit input; explicit
  `DateField.Input` props override; managed `value`/combobox role/a11y
  always win; authored handlers run before machine observations.
- **Why not landed:** rewrite-class — current code resolves children by
  sniffing (`displayName`, `__refPart`, `role === 'combobox'`), and
  replacing that with Slot registration touches every compound path.
  Sniffing works; the Law is determinism, not a missing capability.
- **Revisit when:** candidate 1 or 5 is chartered — whichever rewrite first
  opens the compound layout owns replacing sniffing with the Law, proven
  by `DF-DOM-03`.
- **Open questions:** none — the Law is specified verbatim in TESTS.md
  freeze decision 9.

### 5. Range namespace (`Range` / `Start` / `End`, drafts, Apply/Cancel) — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx:1103`–`1861`
  (`DateFieldRange`, `DateRangeValue`/`DateRangeDraft` types) +
  `DateField.book.tsx` (`FoldedRange`, `WithRange` stories); cases
  `DF-RANGE-01`–`06`, `DF-COMP-05`, `DF-COMP-06`.
- **API sketch:** new exports `DateField.Range`, `DateField.Start`,
  `DateField.End` + types `DateRangeValue` (`{ start, end } | null`),
  `DateRangeDraft`; `Range` manages two draft buffers, `activeEndpoint`
  with focused-field pane sync, end-only drafts (Calendar gets `null`,
  never an invalid shape), typed-inversion preservation with `canApply`
  gating, and Apply/Cancel/Escape transactions; `name` accepts
  `{ start?: string; end?: string }` for split hidden inputs.
- **Why not landed:** feature-needs-design-plus-rewrite — the largest
  single API addition in quarantine (~750 lines), each endpoint needs
  candidate 1's dirty session, and the mission froze the export surface
  (`DateField.tsx`/`index.ts` untouched).
- **Revisit when:** candidate 1 lands (endpoint editing is two dirty
  sessions) and HQ confirms the `name={{ start, end }}` form shape plus
  Apply-vs-live-commit UX.
- **Open questions:** Apply-on-selection vs explicit Apply button for the
  folded range picker? Should `canApply=false` block popover close or
  just the commit?

### 6. Constraint API (`isDateUnavailable`, typed min/max gating, no clamp) — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx`
  (`isDateUnavailable` prop, `isDateWithinConstraints` gating);
  cases `DF-BND-01`–`04` (quarantine unit + e2e).
- **API sketch:** new prop `isDateUnavailable?: (date: ISODate) => boolean`
  on `DateField`/`Range` (forwarded to slotted Calendar as a managed
  prop); behavior: complete typed dates outside `min`/`max` or marked
  unavailable never request `onChange` — they sit in the buffer until
  commit, then revert; a programmatic out-of-range value still displays
  with managed invalid; `min > max` or non-canonical bounds fail loudly
  with a diagnostic and no edit session. No min/max clamp, ever (SPEC
  "Won't do").
- **Why not landed:** needs candidate 1 — gating hooks into the dirty
  session's publish path, which does not exist yet (current `min`/`max`
  are accepted props with no typed-input enforcement).
- **Revisit when:** candidate 1 lands; pure predicate
  (`isDateWithinConstraints`) is already staged in `parse.ts` with unit
  coverage.
- **Open questions:** none on semantics — TESTS.md freeze decision 5 and
  SPEC "Won't do" settle no-clamp; only the `min > max` diagnostic
  wording is open (throw vs dev-warning).

### 7. Slotted Calendar progressive disclosure + live grid sync — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx:277`–`318`
  (`DateFieldCalendar` bound alias) + picker layer; cases `DF-CAL-02`,
  `DF-CAL-04` (quarantine e2e).
- **API sketch:** `DateField.Calendar` becomes a true bound alias —
  `value`, `onChange`, `locale`, `mode`, `min`, `max`,
  `isDateUnavailable` managed from DateField and omitted from required
  props — so a slotted `<Calendar firstDayOfWeek month onMonthChange>`
  or explicit `<DateField.Calendar>` customizes grid/pane/day rendering
  without re-specifying invariants; typing a complete date moves the
  open Calendar pane without dismissing the popover.
- **Why not landed:** needs candidates 1 and 6 — managed `locale`/`min`/
  `max`/`isDateUnavailable` do not exist to forward yet, and live sync
  needs the publish path. (Current `DateFieldCalendar` is a full
  Calendar passthrough, not a bound alias.)
- **Revisit when:** candidates 1 and 6 land; then the alias is a thin
  prop-omission wrapper plus the `DF-CAL-04` customization proof.
- **Open questions:** none — `DateField.md` §"Managed Calendar props"
  lists the managed set exactly.

### 8. Submit-boundary blocking + reset reformat — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx` form observers;
  cases `DF-FRM-03`, `DF-FRM-05` (quarantine e2e; `FRM-01`/`02` landed).
- **API sketch:** no new props — behavior: every dirty DateField observes
  `requestSubmit()`; a failed blur/Enter boundary blocks submit until a
  documented resolution; `form.reset()` reformats to controlled text
  without changing the controlled ISO value (`HTMLFormElement.submit()`
  stays outside the guarantee, same as NumberField).
- **Why not landed:** needs candidate 1 — there is no dirty/failed-boundary
  state to observe or block on until dirty sessions exist.
- **Revisit when:** candidate 1 lands; mirror NumberField's settled
  submit/reset rules verbatim.
- **Open questions:** none — `DateField.md` §"Validity, forms, submit, and
  reset" defers to NumberField's rules.

### 9. Native `required` / `valueMissing` contract — verdict: OPEN

- **Source:** quarantine commit `1150c8e6e`, `DateField.tsx` (`required`
  passthrough, never `setCustomValidity`); case `DF-FRM-04` (quarantine
  e2e; SPEC marks it `[ ]` — untested on reference-system).
- **API sketch:** new props `required?: boolean` (possibly `readOnly?`,
  `invalid?` alongside — quarantine has all three; current has neither)
  passed to the visible input; empty required field reports platform
  `valueMissing`; DateField never calls `setCustomValidity` for date
  constraints; `invalid` stays an ARIA/style signal that never blocks
  submit by itself.
- **Why not landed:** small API addition the landing crew judged out of
  scope (behavior-adjacent prop surface, mission froze props) — not
  technically blocked on the rewrite.
- **Revisit when:** any HQ walkthrough minute — this is the cheapest
  OPEN item: one passthrough prop + one CT proof, no engine needed.
- **Open questions:** land `required` alone, or the full
  `required`/`readOnly`/`invalid` trio with `data-*` observable state
  (`data-empty`, `data-invalid`, …) in one pass?

### 10. ShadowRoot composition — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `matrix/lib/tests/e2e`
  `DF-ENV-01` + `DF-COMP-04` titles (quarantine e2e; scoped lookup +
  shadow portal asserted there).
- **API sketch:** no new props — guarantee: form association, scoped
  events, popover portal, and keyboard nav all function inside an open
  ShadowRoot; picker portals into the owning root, not `document.body`.
- **Why not landed:** blocked upstream — needs the Overlay-crew
  shadow-portal contract first; authoring a DateField shadow test blind
  (against a portal that does not exist) would be theater. Flagged in
  the crew log as an Overlay-crew handoff.
- **Revisit when:** Overlay ships its shadow-portal contract; then port
  the two quarantine titles as honest CT proofs.
- **Open questions:** none for DateField — the contract design belongs
  to the Overlay crew.

### 11. RTL direction inheritance — verdict: DEFERRED

- **Source:** quarantine commit `1150c8e6e`, `matrix/lib/tests/e2e`
  `DF-ENV-02` title (`en-GB` under `dir="rtl"`); quarantine e2e.
- **API sketch:** no new props — guarantee: direction is inherited from
  DOM and changes caret presentation only; segment order stays locale
  `formatToParts` (never mirrored).
- **Why not landed:** vacuous without candidate 1 — current ISO display
  has no locale segments to (not) swap, so the case can only be proven
  honestly once locale grammar renders.
- **Revisit when:** candidate 1 lands; port the quarantine title as a CT
  proof in the same pass.
- **Open questions:** none.

## Suspected gaps (no quarantine source)

### 1. `aria-controls` wiring on the combobox input — verdict: OPEN

- **Evidence:** TESTS.md `DF-CAL-01` requires `aria-controls` matching the
  picker ID, but quarantine's own e2e never asserted it (crew log
  "Surprises"), so neither implementation wires it; UX a11y finding #1
  (`date-field.md` "Nested UX verdict"); SPEC `DF-CAL-01` scoping note.
- **API sketch:** no new props — when `DateField.Picker` upgrades the
  input to `role="combobox"`, set `aria-controls={pickerId}` alongside
  the existing `aria-haspopup`/`aria-expanded`/`aria-autocomplete`;
  remove the SPEC scoping caveat and extend `DF-CAL-01` to assert it.
- **Why not landed:** inventing an attribute no corpus test demands was
  judged scope creep during landing — but the contract (TESTS.md) does
  demand it; only the tests are silent.
- **Revisit when:** any HQ walkthrough minute — one attribute + one
  assertion, no engine needed. Pairs naturally with candidate 9.
- **Open questions:** generated-ID stability rule (unique within one
  React root per `DateField.md`) — confirm the picker ID generator
  before wiring.

### 2. Trigger-toggle focus retention — verdict: DEFERRED

- **Evidence:** TESTS.md `DF-CAL-03` requires "input keeps focus" on
  trigger toggle; crew log "Surprises" (second click toggles closed via
  `Overlay.Trigger`; input-focus step left unasserted); UX a11y context;
  SPEC `DF-CAL-03` scoping note.
- **API sketch:** no new props — behavior: clicking `DateField.Trigger`
  toggles the picker while focus stays on (or returns to) the text
  input, so keyboard typists never lose their caret.
- **Why not landed:** Overlay focus domain — toggle + focus choreography
  belongs to `Overlay.Trigger`, not DateField event code; landing
  asserted the toggle and scoped focus out honestly.
- **Revisit when:** Overlay settles trigger focus-retention semantics;
  then extend `DF-CAL-03` to assert input focus.
- **Open questions:** none for DateField — design lives with Overlay.

### 3. Click-to-open vs caret placement — verdict: OPEN

- **Evidence:** UX a11y finding #2 — click-anywhere-opens blocks caret
  placement in the text (crew log "Nested UX verdict"); no TESTS.md
  case covers single-click caret positioning in an already-open field.
- **API sketch:** behavior-only, two candidate shapes: (a) opening click
  still places the caret where clicked (open + position in one
  gesture); (b) first click opens, click-while-open positions the caret
  without toggling closed. Either way typing stays immediate per
  `DF-CAL-01`.
- **Why not landed:** no quarantine source and no TESTS.md case — pure
  UX-debt surfacing; picking a shape is product design, not a port.
- **Revisit when:** HQ picks shape (a) or (b) — implementation is a
  small pointer-handler change with one CT proof.
- **Open questions:** which shape matches sibling combobox behavior —
  and does either conflict with the APG Date Picker combobox contract
  TESTS.md cites?

### 4. Accessible name for the label-less childless default — verdict: OPEN

- **Evidence:** UX a11y finding #4 — childless `<DateField />` with no
  sibling Label renders an input with no accessible name (crew log
  "Nested UX verdict"); TESTS.md always mounts a Label, so no case
  covers the bare default.
- **API sketch:** no new props — policy decision with three candidate
  shapes: (a) docs-only (bare usage is author error, Label always
  required); (b) `placeholder` reflected as fallback name; (c) dev-only
  warning when childless input has no `aria-label`/`aria-labelledby`
  and no associated Label.
- **Why not landed:** no quarantine source — policy question HQ must
  answer before any code or docs change.
- **Revisit when:** HQ picks a shape; (a) is a docs line, (b)/(c) are
  small patches with one CT proof each.
- **Open questions:** is placeholder-as-name (b) acceptable a11y, or
  does HQ prefer the strict docs-only stance (a)?

## Non-decisions (rejected outright)

- Controlled-only rewrite: deleting `defaultValue` + internal state
  (quarantine `DateField.tsx` vs current `DateField.tsx:10,242`) —
  breaking API removal, Recon Exhibit 1 class; rejection in crew log
  "Triage" SKIP + "Brief" (API frozen).
- Required `value` prop (quarantine `value: ISODate | null` required vs
  current optional `value?`) — same breaking class; same pointers.
- Quarantine `DateField.book.tsx` locale + Range stories (`FoldedRange`,
  `WithRange`, `locale="en-GB"` rewrites) — SUSPECT look-and-feel /
  unlanded-API showcase; rejection in crew log "Triage" SKIP
  (quarantine book.tsx) + landing commit message.
- Shared-theme focus-ring edits from the Field freeze commit
  (`field.ts`/`focus-visible.ts`, Recon Exhibit 3) — global blast
  radius, never DateField's to port; non-port recorded in crew log
  "Brief" (suspect Exhibit 3) and "Handoffs" (theme crew owns
  FI-CSS-06/COMP-04 ring propagation).
- Digit-table quirk "fixes" inside the staged `parse.ts` (beng U+096C,
  fullwide Devanagari 2–9) — verbatim-port discipline, cleanup belongs
  to a future normalization pass; recorded in crew log "What was
  ported" + "Handoffs".

## Walkthrough notes for HQ

- Most important (user impact): **candidate 1, the controlled-locale
  text engine** — today the field shows raw `2026-08-31` and echoes
  garbage to `onChange`; every typed-date user feels this. In Book,
  open the Atomic story, type `31/04/2024` and blur: nothing reverts,
  nothing validates — that is the missing engine.
- Second: **candidate 5, the Range namespace** — there is no range
  picker at all (`DateField.Range`/`Start`/`End` do not exist); booking
  flows cannot be built. In Book, note the story list ends at
  WithPicker — quarantine's `FoldedRange`/`WithRange` stories show what
  was declined.
- Third: **candidate 2, required explicit locale** — the one breaking
  API call HQ must make before candidate 1 starts (keep the `'en-US'`
  default vs throw). Nothing to click in Book; decide from the SSR
  determinism argument in `DF-FMT-06`.
- Cheap wins if HQ wants motion today: candidate 9 (`required`
  passthrough) + suspected-gap 1 (`aria-controls`) are each one prop /
  one attribute with one CT proof and no engine dependency.
