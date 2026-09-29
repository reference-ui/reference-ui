# NumberField SPEC

Current freeze, cases, and proof. Design narrative: [NumberField.md](./NumberField.md).
Case catalog: [TESTS.md](./TESTS.md).

Playwright: `matrix/lib/tests/e2e/number-field.spec.ts`
Unit: `matrix/lib/tests/unit/number-field.test.ts` (missing)
Page: `/number-field`

## Legend

- `[x]` A passing Playwright or Vitest title contains this case ID.
- `[ ]` Specified in TESTS.md; not proven by a passing test title.
- `[~]` A title exists but asserts the prototype, not the freeze.

TESTS.md checkboxes mean **specified**, not proven.

## Next agent

**API and TESTS.md are the contract.** This is the dirty-session template
DateField will copy. Input is a **textbox**, never `role=spinbutton`.
`locale` is required. `value` is required controlled `number | null`.

Visual polish is not this gate. Current e2e **encodes the wrong host**.

### Surface

| Axis | Freeze |
| :--- | :--- |
| Anatomy | Root `div` → Group `div[role=group]` (Field bezel) → Input `input[type=text]` + optional steppers |
| State | required `value` + required `locale`; dirty buffer; `commitBehavior` snap \| validate |
| ARIA | textbox; no `aria-value*` |
| Form | hidden canonical when `name` set; no `setCustomValidity` for constraints |
| Step | one lattice; Shift = `10 * step`; no wheel |

### Status (2026-09-10; proofs updated 2026-09-28)

| | |
| :--- | :--- |
| Engine | Controlled textbox + dirty draft/commit, Group host, hidden form pipeline. |
| Production | **No** (Intl parser + live-request + lattice flips remain). |
| Named `[x]` | 134 / 148 |
| Playwright | 48/48 CT on React 17/18/19 (NFLAST-2 §1 slices F+G: EDIT-12/15/16/17/18 + CompositionFixture) |
| Vitest | 130 green across unit + type files (NFLAST-2 slices A–E: +16 Intl titles EDIT-05/PARSE-01/02/03/06/08/09/10/11/12/13/15/16/17/18/19) |
| API | FEATURES #1 landed 2026-09-26: required controlled `value` + required `locale`, no `defaultValue`, no env default; FEATURES #2 landed (any-no-change suppression). PATCHES §4 (Group) + §5-core (form/state/hidden/submit/reset) + §8 remainder (textbox proof, unnamed-Input diagnostic) landed 2026-09-28. |

### Gaps & incoherence

- ~~Intl parser takes ASCII + one active numbering-system digit set.~~
  DONE 2026-09-28 (NFLAST-2 slices A–E): full digit/sign/group/affix/
  exponent/bidi grammar + fail-fast matrix + 2000-vector proof
  (`NF-PARSE-*` COMPLETE except `07`, which rides §1 paste work).
  Composition session COMPLETE (`NF-EDIT-11`/`12`/`17`/`18`:
  composingRef, invalid-restore, fallout invalidation). REMAIN:
  filtering/paste/caret (`NF-EDIT-02`/`07`–`09`), `NF-COMP-02`/`04`,
  `NF-DYNAMIC-05`, `NF-ENV-02`/`06`, 4 manual gates.
- ~~No live parseable-edit requests (B-19 commit-only).~~ RULED +
  LANDED in unit (NFLAST leg 3a, 2026-09-28, ruling (c) in DECISIONS.md):
  live raw requests with per-session dedupe, echo-aware dirty session;
  `NF-EDIT-03`/`04`/`14`, `NF-COMMIT-01`/`04`/`08`/`11`, `NF-DYNAMIC-01`
  proven in unit. CT re-pins parked (next wave). `NF-EDIT-05` full title
  rides the Intl leg (needs the non-ASCII parser; ASCII core inside
  `NF-EDIT-03`).
- ~~Snap lattice is min-anchored with half-up ties and lattice-clamped
  max (signed-off W-02).~~ RULED + LANDED (NFLAST leg 1, 2026-09-28,
  ruling (a) in DECISIONS.md): zero-anchored, away-from-zero ties,
  endpoint preservation, order endpoint→lattice→rounding→final-clamp;
  `NF-MATH-03`/`04`/`05`/`06`/`09`/`10`/`11`/`12` proven, W-02 snap
  titles re-pinned.
- ~~Validate mode rejects off-step/out-of-range (signed-off W-02).~~
  RULED + LANDED (NFLAST leg 2, 2026-09-28, ruling (b) in DECISIONS.md):
  retain-and-report-invalid; `NF-MATH-13` (unit) + `NF-COMMIT-06` (CT)
  proven, 3 W-02 validate titles re-pinned. `onInvalidCommit` is
  advisory (fires after `onChange`, range-first) — flagged
  least-surprise interpolation, API shape untouched.
- `NF-DOM-02`–`04` visual titles were rehomed: `NF-DOM-01` rewritten to
  the freeze (textbox + Group), `NF-DOM-02`/`NF-SURF-01`/`NF-FORM-02`
  added as catalog CT.

### Vendor

**Lift:** `vendor/base-ui/packages/react/src/number-field`;
`vendor/react-spectrum/packages/@react-aria/numberfield`;
`@internationalized/number`; Zag `number-input` as **contrast** (spinbutton
machine).

**Leave:** spinbutton / ScrubArea; Field/Form providers; wheel;
smallStep/largeStep.

### Case index

- `[x]` `NF-TYPE-01`, `NF-TYPE-02`, `NF-TYPE-03`, `NF-TYPE-04`, `NF-DOM-01`,
  `NF-DOM-02`, `NF-DOM-03`, `NF-DOM-04`, `NF-DOM-05`, `NF-DOM-06`,
  `NF-DOM-07`, `NF-DOM-08`, `NF-DOM-09`, `NF-MATH-01`, `NF-MATH-02`,
  `NF-MATH-03`, `NF-MATH-04`, `NF-MATH-05`, `NF-MATH-06`, `NF-MATH-07`,
  `NF-MATH-08`, `NF-MATH-09`, `NF-MATH-10`, `NF-MATH-11`, `NF-MATH-12`,
  `NF-MATH-13`, `NF-MATH-14`, `NF-MATH-15`, `NF-EDIT-04`,
  `NF-EDIT-13`, `NF-EDIT-19`, `NF-COMMIT-03`, `NF-COMMIT-07`, `NF-COMMIT-10`,
  `NF-KEY-01`, `NF-KEY-02`, `NF-KEY-03`, `NF-KEY-04`, `NF-KEY-05`,
  `NF-KEY-07`, `NF-STEP-01`, `NF-STEP-02`, `NF-STEP-03`, `NF-STEP-04`,
  `NF-STEP-05`, `NF-STEP-06`, `NF-STEP-07`, `NF-STEP-08`, `NF-STEP-09`,
  `NF-STEP-10`, `NF-STEP-11`, `NF-STEP-12`, `NF-STEP-13`, `NF-STEP-14`,
  `NF-STEP-15`, `NF-FORM-01`, `NF-FORM-02`, `NF-FORM-03`, `NF-FORM-04`,
  `NF-FORM-05`, `NF-FORM-06`, `NF-FORM-07`, `NF-FORM-08`, `NF-FORM-10`,
  `NF-FORM-13`, `NF-A11Y-01`, `NF-A11Y-02`, `NF-A11Y-03`, `NF-A11Y-05`,
  `NF-A11Y-06`, `NF-SURF-01`, `NF-DYNAMIC-03`, `NF-DYNAMIC-04`,
  `NF-ENV-01`, `NF-ENV-03`, `NF-ENV-05`, `NF-ENV-07`, `NF-FORMAT-01`,
  `NF-FORMAT-02`, `NF-FORMAT-03`, `NF-FORMAT-04`, `NF-FORMAT-05`,
  `NF-FORMAT-06`, `NF-FORMAT-07`, `NF-FORMAT-08`, `NF-PARSE-04`,
  `NF-PARSE-05`, `NF-PARSE-14`, `NF-EDIT-01`, `NF-EDIT-06`, `NF-EDIT-10`,
  `NF-EDIT-11`, `NF-EDIT-14`, `NF-COMMIT-01`, `NF-COMMIT-02`, `NF-COMMIT-04`,
  `NF-COMMIT-05`, `NF-COMMIT-06`, `NF-COMMIT-09`, `NF-KEY-06`, `NF-FORM-09`, `NF-A11Y-04`,
  `NF-DYNAMIC-02`, `NF-ENV-04`, `NF-COMP-01`, `NF-COMP-03`,
  `NF-FORM-11`, `NF-FORM-12`, `NF-FORM-14`, `NF-EDIT-03`,
  `NF-COMMIT-08`, `NF-COMMIT-11`, `NF-DYNAMIC-01`, `NF-EDIT-05`,
  `NF-PARSE-02`, `NF-PARSE-15`, `NF-PARSE-16`, `NF-PARSE-03`,
  `NF-PARSE-06`, `NF-PARSE-17`, `NF-PARSE-08`, `NF-PARSE-09`,
  `NF-PARSE-10`, `NF-PARSE-12`, `NF-PARSE-18`, `NF-PARSE-11`,
  `NF-PARSE-13`, `NF-PARSE-01`, `NF-PARSE-19`, `NF-EDIT-12`,
  `NF-EDIT-15`, `NF-EDIT-16`, `NF-EDIT-17`, `NF-EDIT-18`
  (ported from quarantine recon 2026-09-25 as stability wins, re-targeted
  to the current spinbutton + uncontrolled engine: spinbutton kept per
  frozen visuals; `defaultValue` + optional `locale` preserved per recon
  exhibit 1; ±Infinity bounds legal as unbounded sentinels; lattice /
  snap / dirty-session / Intl meanings NOT ported. `NF-STEP-02` native
  click only; `NF-ENV-05` StrictMode-on-19 only. PATCHES §7 landed
  2026-09-26 as standalone hold-repeat on the live-clamp engine: steppers
  step the current value with one request per step (`NF-STEP-12` adapted —
  no dirty candidate until PATCHES §1); matrix timing proof at
  `NF-STEP-04`/`05` still pending outside this package. PATCHES §6 landed
  2026-09-26 in the FEATURES §1 major bump: required stepper names
  (`NF-TYPE-04` type boundary, `NF-DOM-09` runtime unit + CT, `NF-STEP-01`
  rewritten to freeze-name meaning). P2C landed 2026-09-28: PATCHES §4
  Group host + anatomy diagnostics (`NF-DOM-01` rewritten to freeze,
  `NF-DOM-02`/`03`/`04`/`07`/`08`, `NF-SURF-01`, full `NF-STEP-11`
  capability incl. bounds/readOnly/dirty, `NF-STEP-13` readOnly branch,
  `NF-DYNAMIC-04`, `NF-ENV-03`); PATCHES §5-core form/state pipeline
  (`NF-FORM-01`–`08` except `09`, `NF-FORM-10`/`13`,
  `NF-COMMIT-03`/`07`/`10`, `NF-A11Y-06`, `NF-DYNAMIC-03`,
  `NF-MATH-15` validity display); PATCHES §8 remainder (textbox proof,
  `NF-A11Y-01`/`02`/`03`/`05`, grammar `inputMode` per `NF-ENV-07` with
  `none`-as-snap derivation flagged for HQ.) Wave-2 landed 2026-09-28
  (+28: full `NF-FORMAT-*`, `NF-PARSE-04`/`05`/`14`, `NF-EDIT-01`/`06`/
  `10`/`11`/`14`, `NF-COMMIT-01`/`02`/`04`/`05`/`09`, `NF-KEY-06`,
  `NF-FORM-09`, `NF-A11Y-04`, `NF-DYNAMIC-02`, `NF-ENV-04`,
  `NF-COMP-01`/`03`): trailing-decimal parser flip, isComposing key
  guard; 40 CT green on React 17/18/19, 105 unit green.
- `[ ]` remaining `NF-PARSE-*` (`07` only — rides §1 paste work),
  `NF-MATH-*` COMPLETE, remaining `NF-EDIT-*`
  (`02`, `07`–`09`), `NF-COMMIT-*` COMPLETE,
  `NF-DYNAMIC-05`,
  remaining `NF-ENV-*` (`02`, `06`),
  `NF-COMP-02`, `NF-COMP-04`, `NF-MANUAL-*` (4 manual release gates)

Not catalog: FEATURES #2 suppression trio (no freeze ID — behavior wart
fix, decided any-no-change).

### Work order

1. ~~Strip spinbutton. Rewrite `NF-DOM-01`.~~ Done (P2C 2026-09-28;
   uncontrolled + locale default stripped by FEATURES #1, 2026-09-26).
2. ~~Group / Field-surface + named steppers.~~ Done (P2C 2026-09-28,
   PATCHES §4 + Field-crew handshake green).
3. ~~Dirty buffer + commit boundaries (core).~~ Done (B-19 + P2C
   failed/pending boundaries + NFLAST leg 3a live-request/echo unit;
   filtering + CT re-pins remain).
4. Intl parse/format + composition done (NFLAST-2 2026-09-28, slices
   A–G: full `NF-PARSE-*` except `07`, `NF-EDIT-05`/`12`/`15`–`18`;
   recipes in `.agents/missions/landing-sequence/NFLAST2.md`).
   REMAIN: filtering/paste/caret (`NF-EDIT-02`/`07`–`09`, `NF-PARSE-07`
   — onPaste/beforeinput/caret-map engine unbuilt), `NF-COMP-02`/`04`,
   `NF-DYNAMIC-05`, `NF-ENV-02`/`06` (shadow audit: scope 3
   document-global lookups — input labelledby ~L858, stepper gate
   ~L1402 needs button-ref threading, ENV-04 ~L2465).
5. ~~Step lattice freeze — HQ call first (zero-anchor? ties? endpoints?),
   then `NF-MATH-03`–`06`/`09`–`12` + repeat timings.~~ Done (NFLAST
   legs 1–2, 2026-09-28, rulings (a)+(b)); `NF-MATH-*` complete.
6. ~~Forms / submit / reset (core).~~ Done (P2C 2026-09-28; FORM
   leg 2026-09-28 landed `NF-FORM-09`/`11`/`12`/`14` event-order CT,
   43 green on React 17/18/19).

### Won't do

Wheel. ScrubArea. Visual polish. DateField until this dirty-session
contract exists.

### Done when

Public API matches NumberField.md (textbox). Every automated TESTS.md ID is
`[x]` here. Manual gates remain manual.
