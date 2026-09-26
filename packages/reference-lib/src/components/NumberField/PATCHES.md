# NumberField patches

Mechanical, fully-specified items moved out of DECISIONS.md. Every entry is
test-pinnable today: no product, UX, or design call remains — only scheduling
(most queue behind the FEATURES.md §1 breaking release). Likely-to-do list.

### 1. Dirty edit session + commit boundaries (from DECISIONS candidate #2)

- **What:** Private transient text buffer + dirty flag with `data-editing`/`data-empty`; `commitBehavior?: "snap" | "validate"` (default `"snap"`); blur/Enter/step commit boundaries with commit-retry and failed-boundary submit blocking.
- **Acceptance:** `NF-EDIT-*`/`NF-COMMIT-*` catalog green (only `NF-EDIT-04`/`NF-EDIT-13` re-targeted today) plus live-request dedupe; TESTS.md freeze decisions 4/7/8/9 hold; no raw-text callback, controlled text prop, or commit callback exists.
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §2; SPEC work order step 3 (needs a controlled value — after FEATURES.md §1).

### 2. Intl parse/format + grammar-derived inputMode (from DECISIONS candidate #3)

- **What:** `formatOptions?: Intl.NumberFormatOptions` (default `{}`); `Intl.NumberFormat`/`formatToParts` as the single token authority; supported-numbering-system allowlist; `inputMode` derived from accepted grammar + commit policy.
- **Acceptance:** `NF-PARSE-*`/`NF-FORMAT-*` catalogs green plus the seeded 2,000-vector public round-trip proof (`NF-PARSE-19`); supported-Intl/ICU matrix declared (SSR byte-equality scope per `NF-ENV-01`/`02`).
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §3; SPEC work order step 4.

### 3. Zero-anchored step lattice + snap/validate math (from DECISIONS candidate #4)

- **What:** One zero-anchored lattice `k*step` shared by keys and steppers; directional off-grid stepping; first step from null picks the in-range value nearest zero; snap order endpoint-preservation → nearest-lattice (away-from-zero ties) → authored rounding → final clamp; validate mode retains invalid numbers; `step` defaults to `0.01` for percent style.
- **Acceptance:** `NF-MATH-03`/`04`/`05`/`06`/`09`/`10`/`11`/`12`/`13`/`15` plus percent-step default (`NF-MATH-01` partial) green; freeze decisions 6/7 hold.
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §4; SPEC work order step 5 (with §1 above — commit boundaries execute the snap/validate order).

### 4. Group part + Field-surface host (from DECISIONS candidate #5)

- **What:** `<NumberField.Group status?: "warning">` rendering `div[role="group"][data-reference-field]`, consuming Field's bezel recipe (no nested `<Field>`); exactly-one-Group / exactly-one-Input diagnostics; arbitrary authored siblings allowed, only named parts join behavior.
- **Acceptance:** `NF-DOM-03`/`04`/`07`/`08`, `NF-SURF-01` (plus unit `NF-DOM-03`) green; Field-crew handshake on the shared bezel recipe (`FI-SURF-01`).
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §5; SPEC work order step 2.

### 5. Hidden canonical form pipeline (from DECISIONS candidate #6)

- **What:** New root props `name?`, `form?`, `required?`, `readOnly?`, `invalid?`; exactly one root-direct `input[type=hidden]` carrying canonical `String(value)` (`""` for null); managed numeric validity via `aria-invalid`/`data-invalid`; submit prevention + failed-boundary blocking; focus-preserving reset; never `setCustomValidity` for numeric constraints.
- **Acceptance:** `NF-DOM-02`, `NF-FORM-01`–`NF-FORM-14` green; freeze decision 5 holds.
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §6; SPEC work order step 6 (after §1 above — dirty/failed-boundary state drives submit blocking).

### 6. Required stepper accessible names (from DECISIONS candidate #7)

- **What:** Increment/Decrement props require the `aria-label` | `aria-labelledby` union (nonempty) at the type boundary; runtime rejects missing/empty/unresolved names with a descriptive dev diagnostic and the offender neither registers nor activates; no English fallback, no locale translation.
- **Acceptance:** `NF-TYPE-04`, `NF-DOM-09`, `NF-STEP-01` green; freeze decision 12 holds; ships in the same major bump as FEATURES.md §1 (never earlier — no double-break of unnamed consumers).
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §7.

### 7. Hold-repeat + touch/pointer session semantics (from DECISIONS candidate #8)

- **What:** Immediate step on primary pointerdown, first repeat at exactly 400ms, then every 60ms; pointer-leave ends the session, pressed re-entry steps immediately with a fresh 400ms delay; >8 CSS px touch movement / scroll / pinch / blur / unmount / disable cancels; `data-pressed` lifetime; compatibility click never duplicates; steppers step a complete dirty candidate without intermediate commit.
- **Acceptance:** `NF-STEP-03`/`04`/`05`/`06`/`07`/`08`/`10`/`12`/`13`/`14`/`15` green under fake timers + touch harness, with matrix timing proof at the `NF-STEP-04`/`05` boundaries; freeze decision 14 holds. Separable from the rewrite — may land as a standalone behavior PR.
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §8.

### 8. Textbox exposure (spinbutton removal) (from DECISIONS candidate #9)

- **What:** Input renders `input[type=text]` with plain textbox semantics — never `role=spinbutton`, never numeric `aria-value*`; unnamed Input produces a descriptive dev diagnostic without inventing label markup.
- **Acceptance:** `NF-A11Y-01`, rewritten `NF-DOM-01`, unit `NF-A11Y-02` green against an HQ-verified snapshot rebaseline (14 frozen snapshots currently assert spinbutton); VoiceOver rationale in NumberField.md unchanged.
- **Source:** Quarantine `975fec1ae` NumberField.tsx; DECISIONS candidate §9; SPEC work order step 1 ("strip spinbutton… rewrite `NF-DOM-01`").

### 9. Wheel pass-through proof (from DECISIONS gap #1)

- **What:** Behavior already holds (zero wheel code in the engine) — close it with one assertion-only CT title.
- **Acceptance:** New CT title proves wheel inside a scrollable ancestor leaves value, callback log, text, selection, and managed data unchanged with `defaultPrevented` false; SPEC `NF-EDIT-19` flips `[ ]` → proven.
- **Source:** `NF-EDIT-19` contract text (final); DECISIONS gap §1; closable in any CT pass, minutes of work.

### 10. Book Default story accessible name (from DECISIONS gap #2)

- **What:** Add `aria-label` to the story Inputs (Default / WithBounds / Disabled) plus a docs line that naming is the app's job.
- **Acceptance:** Stories render named Inputs; naming-passthrough pin `NF-DOM-05` still green; demo no longer the worst example.
- **Source:** Crew-log UX verdict (pre-existing observation); DECISIONS gap §2; next story touch.
