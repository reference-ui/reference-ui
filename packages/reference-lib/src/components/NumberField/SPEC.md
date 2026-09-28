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
| Named `[x]` | 68 / 148 |
| Playwright | 27 CT on React 17/18/19 (snapshots intact, 4 new freeze titles) |
| Vitest | 84 unit + 5 type (63 title IDs + 5 A11Y IDs) |
| API | FEATURES #1 landed 2026-09-26: required controlled `value` + required `locale`, no `defaultValue`, no env default; FEATURES #2 landed (any-no-change suppression). PATCHES §4 (Group) + §5-core (form/state/hidden/submit/reset) + §8 remainder (textbox proof, unnamed-Input diagnostic) landed 2026-09-28. |

### Gaps & incoherence

- Intl parser is ASCII + locale punctuation only (`NF-PARSE-*` unproven
  except through commit vectors); full numbering-system/affix grammar,
  paste/composition filtering, and caret work remain (PATCHES §2 / §1
  completion).
- No live parseable-edit requests: typing publishes only at commit
  boundaries (B-19). `NF-EDIT-03`/`NF-EDIT-05`/`NF-COMMIT-08`/`NF-COMMIT-11`
  want live requests with dedupe — contradicts pinned B-19 titles, needs
  HQ reconciliation before manufacture.
- Snap lattice is min-anchored with half-up ties and lattice-clamped max
  (signed-off W-02); TESTS.md freeze wants zero-anchored, away-from-zero
  ties, endpoint preservation (`NF-MATH-03`/`04`/`09`/`10`/`11`/`12`) —
  open HQ call, flagged in the P2C mission log.
- Validate mode rejects off-step/out-of-range (signed-off W-02);
  `NF-MATH-13`/`NF-COMMIT-06` want retain-and-report-invalid — open HQ
  call, flagged in the P2C mission log. `onInvalidCommit` coherence
  argues for the reject model.
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
  `NF-MATH-07`, `NF-MATH-08`, `NF-MATH-14`, `NF-MATH-15`, `NF-EDIT-04`,
  `NF-EDIT-13`, `NF-EDIT-19`, `NF-COMMIT-03`, `NF-COMMIT-07`, `NF-COMMIT-10`,
  `NF-KEY-01`, `NF-KEY-02`, `NF-KEY-03`, `NF-KEY-04`, `NF-KEY-05`,
  `NF-KEY-07`, `NF-STEP-01`, `NF-STEP-02`, `NF-STEP-03`, `NF-STEP-04`,
  `NF-STEP-05`, `NF-STEP-06`, `NF-STEP-07`, `NF-STEP-08`, `NF-STEP-09`,
  `NF-STEP-10`, `NF-STEP-11`, `NF-STEP-12`, `NF-STEP-13`, `NF-STEP-14`,
  `NF-STEP-15`, `NF-FORM-01`, `NF-FORM-02`, `NF-FORM-03`, `NF-FORM-04`,
  `NF-FORM-05`, `NF-FORM-06`, `NF-FORM-07`, `NF-FORM-08`, `NF-FORM-10`,
  `NF-FORM-13`, `NF-A11Y-01`, `NF-A11Y-02`, `NF-A11Y-03`, `NF-A11Y-05`,
  `NF-A11Y-06`, `NF-SURF-01`, `NF-DYNAMIC-03`, `NF-DYNAMIC-04`,
  `NF-ENV-01`, `NF-ENV-03`, `NF-ENV-05`, `NF-ENV-07`
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
  `none`-as-snap derivation flagged for HQ.)
- `[ ]` `NF-PARSE-*`, `NF-FORMAT-*`, remaining `NF-MATH-*` (`03`–`06`,
  `09`–`13`), remaining `NF-EDIT-*`, remaining `NF-COMMIT-*` (`01`, `02`,
  `04`–`06`, `08`, `09`, `11`), `NF-KEY-06`, remaining `NF-FORM-*` (`09`,
  `11`, `12`, `14`), `NF-DYNAMIC-01`, `NF-DYNAMIC-02`, `NF-DYNAMIC-05`,
  remaining `NF-ENV-*` (`02`, `04`, `06`), `NF-COMP-*`, `NF-MANUAL-*`
  (4 manual release gates)

Not catalog: FEATURES #2 suppression trio (no freeze ID — behavior wart
fix, decided any-no-change).

### Work order

1. ~~Strip spinbutton. Rewrite `NF-DOM-01`.~~ Done (P2C 2026-09-28;
   uncontrolled + locale default stripped by FEATURES #1, 2026-09-26).
2. ~~Group / Field-surface + named steppers.~~ Done (P2C 2026-09-28,
   PATCHES §4 + Field-crew handshake green).
3. ~~Dirty buffer + commit boundaries (core).~~ Done (B-19 + P2C
   failed/pending boundaries; live-request + filtering remain).
4. Intl parse/format (`NF-PARSE-*` / `NF-FORMAT-*`) + filtering/paste/
   composition/caret (PATCHES §1 completion + §2).
5. Step lattice freeze — HQ call first (zero-anchor? ties? endpoints?),
   then `NF-MATH-03`–`06`/`09`–`12` + repeat timings.
6. ~~Forms / submit / reset (core).~~ Done (P2C 2026-09-28;
   `NF-FORM-09`/`11`/`12`/`14` event-order cases remain).

### Won't do

Wheel. ScrubArea. Visual polish. DateField until this dirty-session
contract exists.

### Done when

Public API matches NumberField.md (textbox). Every automated TESTS.md ID is
`[x]` here. Manual gates remain manual.
