# Field decisions

Status: **Draft** — becomes Final only on HQ's explicit walkthrough
acceptance, per decision, never by exhaustion.

One line: the visual bezel around a form control; chrome only, no semantics.

## Landed (context, 2-4 lines)

Quarantine-landing ported the runtime ARIA-strip plus data pins (`Field.tsx`), the
`FI-TYPE-01` compile fixture, 8 contract fixtures, and a 3→20 CT suite (19/20 IDs
proven, `FI-CSS-06` theme-blocked); visuals frozen, UX sign-off LAND. Crew log:
`.agents/missions/quarantine-landing/field.md`; landing commit `a3a84954c`.

## Candidate features (quarantine-sourced)

### 1. Nested-button focus exclusion — verdict: DEFERRED

- **Source:** quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`,
  case IDs `FI-CSS-06` + `FI-COMP-04` step 7 (ring-on-opener/chip).
- **API sketch:** no new props — a behavior contract: keyboard focus on a nested
  `Button` (clear, opener, chip) keeps its own ring and never sets Field
  `data-focus-visible` or the 2px bezel ring; asserted via Tab-to-button +
  computed outline + `hasFocusVisible === false`.
- **Why not landed:** fails on the current theme — `setupFocusVisible` sets
  `data-focus-visible` on the Field host for *any* keyboard-focused descendant.
  Quarantine fixed this inside the shared-theme files (SUSPECT Exhibit 3 drive-by,
  outside Field scope), so landing scoped it out rather than enshrine wrong behavior.
- **Revisit when:** the theme crew narrows focus propagation (re-derived cleanly, not
  ported) so only text-input focus marks the Field host; then Field adopts the
  `FI-CSS-06` + COMP-04 ring titles unchanged.
- **Open questions:** none for Field — the contract text in TESTS.md is final; the
  only question is theme-crew scheduling.

### 2. Hosted DateField typing/publish sessions — verdict: DEFERRED

- **Source:** quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`,
  case ID `FI-COMP-02` (fill + Enter steps).
- **API sketch:** no Field API — a hosted proof: `fill('2026-10-15')` + Enter inside
  the Field bezel publishes ISO `onChange` (`Value: 2026-10-15`) with the bezel still
  wrapping input + trigger and the Calendar staying portalled. Landed suite keeps the
  bezel subset only (wrap/trigger/portalled assertions).
- **Why not landed:** typing and picking sessions are DateField-owned per TESTS.md
  "Owned elsewhere"; quarantine's steps assert DateField behavior through a Field
  fixture, and DateField.Range shared-bezel sessions (`DF-COMP-05`) ride the same proof.
- **Revisit when:** the DateField crew proves its session contract; Field then re-adds
  the two hosted fill/publish assertions (plus a Range two-inputs-one-bezel hosted title).
- **Open questions:** none for Field — session semantics (dirty/commit/ISO) are
  DateField product questions, not Field's.

### 3. Hosted token-picker commit/remove flows — verdict: DEFERRED

- **Source:** quarantine commit `3b2afd0b1`, `matrix/lib/tests/e2e/field.spec.ts`,
  case ID `FI-COMP-04` steps 8–9 (option commit, chip removal).
- **API sketch:** no Field API — a hosted proof: clicking option Bob fires one scalar
  Combobox `onChange`, application chips update, Combobox renders no token nodes;
  clicking chip Alice removes it with no Combobox `onChange`. Landed suite keeps the
  Field-owned subset (label/embed/opener/chips/portal/invalid-bezel).
- **Why not landed:** scalar commit and chip-state flows are Combobox-owned per TESTS.md
  "Owned elsewhere"; quarantine's steps assert Combobox behavior through a Field fixture.
- **Revisit when:** the Combobox crew proves commit/remove semantics; Field then re-adds
  the two hosted flow assertions verbatim.
- **Open questions:** none for Field — commit shape and chip-state ownership are
  Combobox + application questions, not Field's.

## Suspected gaps (no quarantine source)

### 1. Field.Label / Field.Error parts + implicit wiring — verdict: DECLINED

- **Evidence:** the catalog-walker reflex ("every form component needs Label/Error
  parts"); explicitly refused by `Field.md` §"Deliberately left", TESTS.md "Out of
  scope", SPEC.md "Won't do" and "Next agent" (`Do not add Label / Control / Error parts`).
- **API sketch:** what HQ would be asking for: `<Field.Label>`, `<Field.Error>`,
  implicit `htmlFor`/`aria-describedby` wiring, required-indicators on the bezel.
- **Why not landed:** killer reason — HTML already defines this: `<Label htmlFor>`
  targets the labelable input and descriptions live on the input (`FI-COMP-01`
  proves it). A provider part would copy Base UI / React Aria Field, which the freeze
  leaves on purpose (Field.md "Problems we own: Double chrome").
- **Revisit when:** a consumer shows a labeling/error pattern that `htmlFor` +
  `aria-describedby` on the control cannot express — no such case has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 2. Form/Field React context provider — verdict: DECLINED

- **Evidence:** same catalog-walker reflex; refused by `Field.md` ("no Zustand store,
  no React context, no subscription"; "Provide a public Form/Field React context" in
  "What Field does not do") and TESTS.md freeze decision 10 ("must not become a React
  state owner").
- **API sketch:** `<Field.Provider>` / form context syncing invalid/disabled/focus
  between bezel and control.
- **Why not landed:** killer reason — a context flag lets bezel and input disagree if
  the flag drifts; the `:has()` selector makes disagreement a CSS impossibility with
  zero runtime (Field.md "Bezel vs control state disagreement").
- **Revisit when:** never on this axis — any state-sync need is evidence the control
  should own ARIA it currently lacks, not that Field should own state.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 3. Status beyond warning — verdict: DECLINED

- **Evidence:** `FI-TYPE-01` asserts `status="error"` is a *type error*; `Field.md`
  ("`status="warning"` is the only Field-owned visual state") and TESTS.md freeze
  decision 3. A walker will ask for `error`/`success`/`info`.
- **API sketch:** `status?: "warning" | "error" | "success" | "info"` with matching
  `data-status` chrome.
- **Why not landed:** killer reason — error already has a native channel
  (`aria-invalid` on the control driving `:has()` chrome, `FI-CSS-07`); a second
  error prop reintroduces exactly the two-owner disagreement the freeze removed.
  Warning exists only because it has no native ARIA equivalent.
- **Revisit when:** a product warning-like state with no ARIA equivalent needs bezel
  chrome distinct from amber — HQ must name the state first; `error` is never it.
- **Open questions:** none — hard DECLINED for `error` (the one-line killer above).

### 4. Control-state mirroring on the host — verdict: DECLINED

- **Evidence:** refused by `Field.md` ("Field does **not** copy `aria-invalid`,
  `disabled`, or `readOnly` onto itself") and TESTS.md "Out of scope" ("copying
  control state into Field data attributes"); `FI-DOM-02` proves the absence.
- **API sketch:** `data-invalid` / `data-disabled` / `data-required` mirrored onto
  `div[data-reference-field]` for styling hooks or test selectors.
- **Why not landed:** killer reason — mirrored attributes are a second source of truth
  that can disagree with the control; `:has()` selectors already give styling the same
  reach with one owner. (NumberField.Group publishes managed `data-*` only because
  NumberField already owns those states — Field never will.)
- **Revisit when:** a styling or testing need proves unreachable via `:has()` against
  the control — no such need has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 5. Checkbox / radio / Switch bezels — verdict: DECLINED

- **Evidence:** refused by SPEC.md "Won't do" ("Checkbox/Switch bezels"), TESTS.md
  "Out of scope", and `Field.md` "Deliberately left".
- **API sketch:** embedding `input[type=checkbox|radio]` or Switch parts in the Field
  descendant recipe so toggles surrender chrome inside a bezel.
- **Why not landed:** killer reason — those are not text-field bezels; a box around a
  checkbox is grouping, not an input bezel, and conflating them breaks the embed
  selector's meaning (`:is(input, textarea, select)` deliberately tag-wide, type-blind).
- **Revisit when:** HQ defines a grouped-toggle visual that genuinely shares the bezel
  recipe rather than just wanting a box — name the composition first.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 6. Nested-Field merge — verdict: DECLINED

- **Evidence:** `FI-COMP-03` proves wrapping Group in Field renders two bezels *as
  application error*; `Field.md` ("Do not nest Field inside Field"), TESTS.md "Out of
  scope" ("nested Field").
- **API sketch:** Field detecting a Field-surface ancestor and merging chrome into a
  single bezel instead of rendering double borders.
- **Why not landed:** killer reason — silent merge hides an authoring bug and makes the
  recipe's "one host, one bezel" invariant untestable; the double bezel is the diagnostic.
- **Revisit when:** never as silent behavior — if double-bezel authoring becomes common,
  the answer is a dev-time warning, not a merge (itself a new decision).
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 7. Field.Chip / token-row primitive — verdict: DECLINED

- **Evidence:** refused by SPEC.md "Won't do" ("Field.Chip"), TESTS.md "Out of scope"
  ("`Field.Chip`, Combobox.Chips"), `Field.md` §"Token picker".
- **API sketch:** `<Field.Chip>` / `<Field.Tokens>` parts plus opener-as-`Combobox.Trigger`
  wiring for the People composition.
- **Why not landed:** killer reason — a chip part copies Button for no new invariant:
  chips are named native buttons from application token state, the chevron stays an
  application Button (Input XOR Trigger still holds), and wrapping rows are StyleProps
  (`FI-COMP-04` proves the whole composition without new parts).
- **Revisit when:** a token interaction needs bezel-owned behavior (not styling) that a
  native Button cannot carry — no such behavior has surfaced.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 8. role="group" on Field — verdict: DECLINED

- **Evidence:** `FI-DOM-01` proves no `role`; `FI-TYPE-01` type-rejects `role="group"`;
  refused by TESTS.md "Out of scope" and `Field.md` ("`role="group"` belongs on
  specialized compositions that genuinely group controls").
- **API sketch:** allowing `role` (typically `"group"`) on the Field host for AT grouping.
- **Why not landed:** killer reason — a bezel around one control groups nothing; the
  role belongs on real groups (`NumberField.Group` keeps `role="group"` as a
  Field-surface host, `FI-SURF-01`), and a spurious group role adds AT noise.
- **Revisit when:** a Field composition genuinely groups multiple labelable controls in
  one bezel (DateField.Range sessions may surface this) — the role would still live on
  the owning composition, not on Field itself.
- **Open questions:** none — hard DECLINED (the one-line killer above).

### 9. Catalogue fields (CurrencyField / TagField / SearchField) — verdict: DECLINED

- **Evidence:** refused by `Field.md` §"Convergence" ("No CurrencyField / TagField /
  SearchField catalogue"); every named composition (Amount, Date, People) is documented
  as Field + controls + application Buttons.
- **API sketch:** ready-made composed components bundling Field with prefix/suffix/chip
  layouts.
- **Why not landed:** killer reason — each catalogue entry would freeze one layout that
  authors already express in ~10 lines of composition, while splitting the recipe's
  single-owner story across N components.
- **Revisit when:** usage data shows one composition copied verbatim across many
  consumers with drift — promote that one composition to a recipe doc first, a component
  never before that.
- **Open questions:** none — hard DECLINED (the one-line killer above).

## Non-decisions (rejected outright)

- Shared-theme focus-ring suppression (`field.ts` global `outline/boxShadow/borderColor`
  neutering, blast radius beyond Field) — recon Exhibit 3, crew log "Deliberately NOT ported".
- Shared-theme focus-visible propagation narrowing *as quarantined* (`focus-visible.ts`
  text-input-only edit) — SUSPECT as ported; behavior must be re-derived cleanly by the
  theme crew, crew log "Handoffs / follow-ups".
- Quarantine's 100ms post-toggle color reads (mid-transition flake) — re-targeted to
  300ms + settle waits at landing, crew log "Surprises"; timing tactic, not a decision.

## Walkthrough notes for HQ

- Most important: §1 nested-button focus exclusion (DEFERRED) — the only proven-missing
  Field behavior; try it in Book (Default story, Tab to the clear button) and watch the
  bezel ring when it shouldn't, then weigh theme-crew scheduling.
- Second: §3 status beyond warning (DECLINED) — if HQ wants `status="error"`, that
  reopens the two-owner disagreement the whole freeze exists to prevent; read the killer
  reason before asking.
- Third: §1–§3 of suspected gaps (Label/Error parts, provider, mirroring — all DECLINED)
  — together they define what Field *is* (a CSS bezel, not a form provider); accepting
  any one of them re-founds the component, so walk them as a set.
- The two DEFERRED hosted proofs (§2 DateField sessions, §3 token-picker flows) need no
  HQ product input — they are crew-routing slips, and they auto-close when those crews land.
