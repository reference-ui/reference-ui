# NumberField decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: uncontrolled spinbutton input with live clamp, steppers, optional bounds.

## Landed (context, 2-4 lines)

Quarantine-landing ported 7 current-API stability wins P1–P7 (handler chaining
fixing dead typing, native modified-arrows, primary-button steppers, verbatim
cleanFloat, managed authority, numeric validation throws), added 15 unit + 11
CT assertion-only titles (16 CT total), and reached SPEC 24/148 with 14
snapshots untouched and green. UX verdict APPROVE (self-review; nested spawn
pool-full twice). Crew log:
`.agents/missions/quarantine-landing/number-field.md`; landing commit
`9aa967526` (verified via `git log`).

## Candidate features (quarantine-sourced)

### 1. Controlled-only state + required locale — verdict: OPEN

- **Source:** quarantine commit `975fec1ae`,
  `packages/reference-lib/src/components/NumberField/NumberField.tsx`
  (required `value` + `locale`, `defaultValue` + internal state deleted),
  unit case IDs `NF-TYPE-01`/`NF-TYPE-02`, fixture
  `matrix/lib/src/number-field.tsx` (fully controlled harness); recon §4
  exhibit 1 (uncontrolled-mode deletion as mangling).
- **API sketch:** `value: number | null` required; `locale: string` required
  with no `'en-US'` or environment default; delete `defaultValue` and the
  internal value store; runtime rejects NaN (P7 landed the throw shape, but
  `±Infinity` bounds stay legal as unbounded sentinels where the freeze
  requires finite — see Non-decisions).
- **Why not landed:** breaking rewrite. Recon flags uncontrolled-mode
  deletion as mangling, landing law froze the API, and the current engine
  keeps `defaultValue` + optional `locale` (today accepted-but-ignored).
  Porting the rewrite file itself was SUSPECT; the *contract question* is
  what stays open here.
- **Revisit when:** HQ authorizes the breaking freeze release (major bump +
  consumer migration). Every DEFERRED item below queues behind this one.
- **Open questions:** migration path for in-repo uncontrolled consumers
  (Field story, Showcase, book — all verified sane but uncontrolled):
  flag-day, codemod, or interim dual-mode? Is required-locale with no env
  default still the product call?

### 2. Dirty edit session + commit boundaries — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (buffer/dirty
  session, commit pipeline), e2e case IDs `NF-EDIT-01`–`NF-EDIT-18`,
  `NF-COMMIT-01`–`NF-COMMIT-11`, `NF-DOM-08`, `NF-DYNAMIC-01`/`NF-DYNAMIC-05`
  (landed: only `NF-EDIT-04`/`NF-EDIT-13` re-targeted to the clamp engine).
- **API sketch:** private transient text buffer + dirty flag with
  `data-editing`/`data-empty`; `commitBehavior?: "snap" | "validate"`
  (default `"snap"`); blur/Enter/step as commit boundaries with
  commit-retry and failed-boundary submit blocking; live-request dedupe;
  explicitly no raw-text callback, controlled text prop, or commit callback.
- **Why not landed:** full engine rewrite — the current live `Number()`
  clamp on every keystroke is the opposite architecture, and landing kept
  it per the freeze-visuals / freeze-API law.
- **Revisit when:** freeze manufacture after §1 (commit needs a controlled
  value to commit against); SPEC work order step 3.
- **Open questions:** none on API — TESTS.md freeze decisions 4/7/8/9 and
  the `NF-EDIT-*`/`NF-COMMIT-*` catalog are final; only scheduling is open.

### 3. Intl parse/format + grammar-derived inputMode — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (Intl parser/
  formatter), unit case IDs `NF-PARSE-01`–`NF-PARSE-19`,
  `NF-FORMAT-01`/`02`/`05`–`08`, e2e `NF-PARSE-07`,
  `NF-FORMAT-03`/`04`, `NF-DYNAMIC-02`, `NF-ENV-01`/`02`/`07`.
- **API sketch:** `formatOptions?: Intl.NumberFormatOptions` (default
  `{}`); `Intl.NumberFormat`/`formatToParts` as the single token authority
  (digits, signs, grouping incl. en-IN 3-2-2, currency/percent/unit affixes,
  exponents, accounting, bidi); supported-numbering-system allowlist rule
  (`NF-PARSE-15`/`16`); `inputMode` derived from accepted grammar + commit
  policy (`NF-ENV-07`).
- **Why not landed:** rewrite-scoped; current `locale` is vestigial
  (accepted, ignored, deliberately unvalidated per P7) and there is no
  formatter, parser, or dirty text to hang Intl on.
- **Revisit when:** freeze manufacture (SPEC work order step 4); needs the
  supported-Intl/ICU matrix declared plus the seeded 2,000-vector public
  round-trip proof (`NF-PARSE-19`).
- **Open questions:** which Intl/ICU matrix HQ supports (SSR byte-equality
  scope, `NF-ENV-01`/`02`) — a deployment question, not an API redesign.

### 4. Zero-anchored step lattice + snap/validate math — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (lattice/snap/
  validate), unit case IDs `NF-MATH-03`/`04`/`05`/`06`/`09`/`10`/`11`/`12`/
  `13`/`15` plus percent-step default (`NF-MATH-01` partial — landed
  re-targeted without it); landed: `NF-MATH-01`/`02`/`07`/`08`/`14` only.
- **API sketch:** no new props — pure behavior: one zero-anchored lattice
  `k*step` shared by keys and steppers; directional off-grid stepping;
  first step from null selects the in-range value nearest zero; snap order
  endpoint-preservation → nearest-lattice (away-from-zero ties) → authored
  rounding → final clamp; validate mode retains invalid numbers with
  managed invalid state; `step` defaults to `0.01` for percent style.
- **Why not landed:** semantics change on the clamp engine (today: naive
  `current ± step` + clamp). Only the portable kernel landed: verbatim
  `cleanFloat` (`NF-MATH-07`/`08`/`14`) and validation throws (`NF-MATH-02`).
- **Revisit when:** freeze manufacture with §2 (commit boundaries execute
  the snap/validate order); SPEC work order step 5.
- **Open questions:** none on API — freeze decisions 6/7 and the `NF-MATH-*`
  catalog are final.

### 5. Group part + Field-surface host — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (`NumberField.Group`
  + part-registry diagnostics), e2e case IDs `NF-DOM-03`/`04`/`07`/`08`,
  `NF-SURF-01` (plus unit `NF-DOM-03`).
- **API sketch:** `<NumberField.Group status?: "warning">` rendering
  `div[role="group"][data-reference-field]`, consuming Field's bezel recipe
  (no nested `<Field>`); exactly-one-Group / exactly-one-Input diagnostics;
  arbitrary authored siblings allowed with only named parts joining
  behavior; managed `data-*`/focus state on the group node.
- **Why not landed:** a new part plus chrome/bezel change; landing froze
  visuals and the current flat anatomy (root → input + steppers, no Group).
- **Revisit when:** freeze manufacture (SPEC work order step 2); needs a
  Field-crew handshake on the shared bezel recipe (`FI-SURF-01`).
- **Open questions:** none on API — `NF-SURF-01` and Field.md's host
  contract are final.

### 6. Hidden canonical form pipeline — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (hidden input,
  submit/reset/validity wiring), e2e case IDs `NF-DOM-02`,
  `NF-FORM-01`–`NF-FORM-14`.
- **API sketch:** new root props `name?`, `form?`, `required?`, `readOnly?`,
  `invalid?`; exactly one root-direct `input[type=hidden]` carrying
  canonical `String(value)` (`""` for null); managed numeric validity via
  `aria-invalid`/`data-invalid` with native text-input flags untouched;
  submit prevention + failed-boundary blocking (all dirty fields process
  every submit); focus-preserving reset semantics; never `setCustomValidity`
  for numeric constraints.
- **Why not landed:** new props plus form-event behavior the current engine
  has none of (no `name`, no hidden input, no submit/reset wiring);
  rewrite-scoped.
- **Revisit when:** freeze manufacture after §2 (dirty/failed-boundary
  state drives submit blocking); SPEC work order step 6.
- **Open questions:** none on API — the `NF-FORM-*` catalog and freeze
  decision 5 are final.

### 7. Required stepper accessible names — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (stepper name
  union + runtime check), unit case IDs `NF-TYPE-04`, `NF-DOM-09`, e2e
  `NF-STEP-01`; freeze decision 12.
- **API sketch:** Increment/Decrement props require the
  `aria-label` | `aria-labelledby` union (nonempty) at the type boundary;
  runtime rejects missing/empty/unresolved names with a descriptive dev
  diagnostic and the offender does not register or activate; no English
  fallback, no locale translation.
- **Why not landed:** breaking type change; current steppers carry no
  naming requirement (P5 kept `aria-label` consumer-overridable).
- **Revisit when:** ships with the §1 breaking release (same major bump);
  cannot land earlier without breaking unnamed consumers twice.
- **Open questions:** none on API — freeze decision 12 is final; the only
  question is the §1 release vehicle.

### 8. Hold-repeat + touch/pointer session semantics — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx` (pointer timers +
  cleanup branches), e2e case IDs `NF-STEP-03`/`04`/`05`/`06`/`07`/`08`/
  `10`/`12`/`13`/`14`/`15` (landed: `NF-STEP-09`, `NF-STEP-11` partial,
  `NF-STEP-02` native-click only).
- **API sketch:** no new props — timed behavior: immediate step on primary
  pointerdown, first repeat at exactly 400ms, then every 60ms; pointer
  leave ends the session, pressed re-entry steps immediately with a fresh
  400ms delay; >8 CSS px touch movement / scroll / pinch / blur / unmount /
  disable cancels; `data-pressed` lifetime; compatibility click never
  duplicates; steppers step a complete dirty candidate without intermediate
  commit.
- **Why not landed:** brand-new timed behavior needing fake-timer +
  touch-harness proof; landing kept single-click stepping (plus the
  non-primary guard P3 and capability pins P5).
- **Revisit when:** freeze manufacture, or a standalone behavior PR with
  matrix timing proof (`NF-STEP-04`/`05` boundaries) — the one DEFERRED
  item separable from the rewrite.
- **Open questions:** none on API — freeze decision 14 and the `NF-STEP-*`
  catalog are final.

### 9. Textbox exposure (spinbutton removal) — verdict: DEFERRED

- **Source:** quarantine commit `975fec1ae`, same `.tsx`
  (`input[type=text]`, no `aria-value*`), e2e case IDs `NF-A11Y-01`,
  `NF-DOM-01` (SPEC `[~]` — the title exists but asserts spinbutton),
  unit `NF-A11Y-02` (unnamed-Input diagnostic).
- **API sketch:** Input renders `input[type=text]` with plain textbox
  semantics — never `role=spinbutton`, never numeric `aria-value*` (P1
  already strips forged copies; the freeze removes the real ones too);
  unnamed Input produces a descriptive dev diagnostic without inventing
  label markup.
- **Why not landed:** 14 frozen snapshots assert spinbutton and stayed
  green unmodified; the VoiceOver rationale (recast inputs can lose AT
  focus) is documented in NumberField.md but paint was frozen.
- **Revisit when:** freeze manufacture with an HQ-verified snapshot
  rebaseline — SPEC work order step 1 explicitly orders "strip spinbutton…
  rewrite `NF-DOM-01`".
- **Open questions:** none on API — freeze contract and the VoiceOver
  reason are final; HQ's only job is eyeballing the rebaselined paint.

### 10. Redundant onChange suppression at bounds — verdict: OPEN

- **Source:** crew-log triage note ("redundant-onChange suppression (no
  quarantine grounding for steppers — deferred)"); no case ID — quarantine
  grounded outward no-op for keys (`NF-KEY-01`) but nothing for steppers.
- **API sketch:** no new props — when a step/key result equals the current
  value (clamped at a bound), emit no `onChange`. Today Increment at max
  re-fires `onChange(max)` (`NumberField.tsx` increment/decrement always
  call `onChange?.(nextVal)` after clamping).
- **Why not landed:** landing refused to invent behavior quarantine never
  grounded; the wart survives in the shipped engine.
- **Revisit when:** a contract ruling can land anytime — small behavior PR
  plus assertion-only CT titles, no rewrite needed.
- **Open questions:** scope of suppression — bounds only, or any no-change
  step? And should keys be ruled explicitly to match (`NF-KEY-01` already
  says outward-boundary no-op; extend the sentence to steppers)?

## Suspected gaps (no quarantine source)

### 1. Wheel pass-through proof — verdict: OPEN

- **Evidence:** zero wheel code in the current engine (`grep -i wheel` on
  `NumberField.tsx` and the fixture is clean), so `NF-EDIT-19` behavior
  already holds — but SPEC lists it `[ ]` unproven, and quarantine's e2e
  title was never re-targeted because the landing suite stopped at 11 new
  titles.
- **API sketch:** no API — one assertion-only CT title: wheel inside a
  scrollable ancestor leaves value, callback log, text, selection, and
  managed data unchanged with `defaultPrevented` false.
- **Why not landed:** killer reason — not missing behavior, only a missing
  title; unscheduled, not blocked.
- **Revisit when:** any CT pass can close it in minutes.
- **Open questions:** none — `NF-EDIT-19` contract text is final.

### 2. Book Default story accessible name — verdict: OPEN

- **Evidence:** crew-log UX verdict, pre-existing observation: the Default
  story ships an unnamed Input; naming stays the app's job via preserved
  `aria-label` passthrough (pinned `NF-DOM-05`), but the demo itself is
  the worst example.
- **API sketch:** no API — add `aria-label` to the story Inputs (Default /
  WithBounds / Disabled) plus a docs line that naming is the app's job.
- **Why not landed:** killer reason — demo hygiene, below the landing bar;
  explicitly flagged, not forgotten.
- **Revisit when:** the next story touch.
- **Open questions:** none.

### 3. smallStep / largeStep / Alt-modified stepping — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left", NumberField.md
  "Deliberately left", and freeze decision 6 (one lattice, fixed
  `10 * step` Shift delta, Alt native). A catalog walker will ask for
  fine/coarse steps.
- **API sketch:** what HQ would be asking for: `smallStep`/`largeStep`
  props, configurable coarse deltas, Alt+Arrow stepping amounts.
- **Why not landed:** killer reason — one public lattice keeps every
  interaction's values valid under every other step; a second lattice can
  manufacture step-invalid values, and Alt must stay native (P2 landed
  that half: `NF-KEY-03`).
- **Revisit when:** a consumer shows a stepping need the fixed `10 * step`
  Shift delta cannot serve — none has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 4. Wheel stepping — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left", NumberField.md
  "Deliberately left", and freeze decision 6 ("no wheel"); `NF-EDIT-19`
  (suspected gap §1) proves the absence.
- **API sketch:** what HQ would be asking for: `allowWheel`-style opt-in
  (already type-rejected per `NF-TYPE-03`) or default wheel-to-step.
- **Why not landed:** killer reason — accidental changes are high-risk,
  and React's passive delegated wheel listener cannot reconcile
  consumer-first cancellation with reliable scroll prevention without a
  second event system.
- **Revisit when:** never through this component — a wheel-stepping need is
  a Slider composition question, not a NumberField prop.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 5. ScrubArea / drag-to-change — verdict: DECLINED

- **Evidence:** refused by TESTS.md "Deliberately left" and NumberField.md
  "Deliberately left"; Zag ScrubArea is documented contrast, not source.
- **API sketch:** what HQ would be asking for: `NumberField.ScrubArea`,
  pointer lock, acceleration, virtual cursor.
- **Why not landed:** killer reason — continuous-pointer dragging with
  geometry is Slider's territory; it duplicates that component for no
  frozen composition.
- **Revisit when:** a frozen composition needs pointer-drag numeric entry
  that a Slider+NumberField pairing cannot express — none exists.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 6. Custom parser/formatter props + raw-text/commit callbacks — verdict: DECLINED

- **Evidence:** refused by freeze decision 4 (no raw text callback or
  controlled text prop), `NF-TYPE-02` (rejects parser functions, commit
  callbacks, reason/detail params), TESTS.md "Deliberately left", and the
  vendor-closure notes (Base UI reason objects/`cancel()`, Stately
  setters, and uncontrolled mirrors deliberately left).
- **API sketch:** what HQ would be asking for: `parse`/`format` function
  props, `onTextChange`, `onCommit`, reason/detail callback args,
  imperative methods.
- **Why not landed:** killer reason — a custom parser or text callback is
  a second numeric authority beside the single `onChange` request channel;
  `locale` + `formatOptions` is the customization surface, and Intl is the
  parser.
- **Revisit when:** a supported-locale need proves inexpressible via
  `Intl.NumberFormatOptions` — that reopens the Intl-allowlist decision
  (§3), never a function-prop escape hatch.
- **Open questions:** none — hard DECLINED (the one-line killer above).

## Non-decisions (rejected outright)

- Mechanical port of quarantine's 2382-line `.tsx` rewrite — SUSPECT per
  crew-log triage; any freeze is clean manufacture from TESTS.md, never a
  lift (the contract question itself is candidate §1).
- Visual/styling/chrome edits riding in the quarantine `.tsx` — rejected
  in crew-log triage; 14 frozen snapshots green unmodified.
- `defaultValue` deletion as an isolated drive-by (breaking, without the
  freeze + migration) — recon §4 exhibit 1, crew-log SUSPECT; the contract
  version is candidate §1.
- Lattice / null-step / snap fragments cherry-picked onto the live-clamp
  engine — rejected in crew-log triage; coherent only as candidate §4
  inside the freeze.
- Quarantine's required-finite-bounds validation shape (`±Infinity`
  rejected) — adapted at landing (P7): current unbounded sentinels kept;
  SPEC re-target note.

## Walkthrough notes for HQ

- Most important: candidate §1 controlled-only + required locale (OPEN) —
  the flag-day decision behind all seven DEFERRED freeze items. Try it in
  Book: the Default story (42) works fully uncontrolled today — type,
  step, clear — and §1 deletes exactly that; weigh the major bump plus
  the Field-story/Showcase/book migration before anything else sequences.
- Second: candidate §10 redundant onChange at bounds (OPEN) — the only
  unblocked behavior wart in the shipped engine. Try it in Book: open the
  WithBounds story, step past one bound, and watch `onChange` re-fire with
  the unchanged value; the ruling (bounds-only vs any-no-change
  suppression) is the cheapest decision on this page.
- Third: candidate §9 textbox vs spinbutton (DEFERRED) — the snapshot/AT
  tension. Inspect `role=spinbutton` + `aria-valuenow` on the Book Default
  Input, then read the VoiceOver rationale in NumberField.md; the
  rebaseline needs HQ eyes whenever §1 schedules it.
- The seven DEFERRED freeze items (§2–§8) need no HQ product input —
  TESTS.md declares no unresolved API decision, so they are crew-routing
  slips that auto-sequence behind §1 plus the noted Field-crew (§5) and
  ICU-matrix (§3) handshakes.
