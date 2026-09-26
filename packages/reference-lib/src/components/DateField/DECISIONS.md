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

## Candidate features (moved — index only)

The 11 quarantine-sourced candidates now live in PATCHES.md (mechanical,
test-pinnable) and FEATURES.md (needs HQ design). Titles preserved; full
text moved.

1. **Controlled-locale text engine** (was DEFERRED) → PATCHES.md #1: fully specified, scheduling only.
2. **Required explicit locale (no default)** (was OPEN) → FEATURES.md #1: breaking call HQ must make.
3. **Caret-aware segment stepping** (was DEFERRED) → PATCHES.md #2: fully specified, needs PATCHES #1 display.
4. **Part-Resolution Law** (was DEFERRED) → PATCHES.md #3: specified verbatim, determinism work.
5. **Range namespace (`Range` / `Start` / `End`, drafts, Apply/Cancel)** (was DEFERRED) → FEATURES.md #2: Apply UX + `canApply` semantics open.
6. **Constraint API (`isDateUnavailable`, typed min/max gating, no clamp)** (was DEFERRED) → FEATURES.md #3: diagnostic mechanism (throw vs dev-warning) open.
7. **Slotted Calendar progressive disclosure + live grid sync** (was DEFERRED) → PATCHES.md #4: managed set listed exactly.
8. **Submit-boundary blocking + reset reformat** (was DEFERRED) → PATCHES.md #5: mirrors NumberField's settled rules.
9. **Native `required` / `valueMissing` contract** (was OPEN) → PATCHES.md #6: one passthrough prop + one proof, no engine needed.
10. **ShadowRoot composition** (was DEFERRED) → PATCHES.md #7: port two titles once the Overlay contract ships.
11. **RTL direction inheritance** (was DEFERRED) → PATCHES.md #8: port one title once PATCHES #1 renders locale segments.

## Suspected gaps (moved — index only)

The 4 no-quarantine-source gaps moved the same way.

1. **`aria-controls` wiring on the combobox input** (was OPEN) → PATCHES.md #9: one attribute + one assertion.
2. **Trigger-toggle focus retention** (was DEFERRED) → PATCHES.md #10: one assertion once Overlay settles focus semantics.
3. **Click-to-open vs caret placement** (was OPEN) → FEATURES.md #4: HQ picks shape (a) or (b).
4. **Accessible name for the label-less childless default** (was OPEN) → FEATURES.md #5: HQ picks policy (a), (b), or (c).

## Non-decisions (rejected outright)

- ~~Controlled-only rewrite: deleting `defaultValue` + internal state
  (quarantine `DateField.tsx` vs current `DateField.tsx:10,242`) —
  breaking API removal, Recon Exhibit 1 class; rejection in crew log
  "Triage" SKIP + "Brief" (API frozen).~~ SUPERSEDED by the HQ
  controlled-only rule (`docs/MISSIONS/API-STANCE.md`, 2026-09-26):
  landing FROZE the API, the features campaign FINALIZES it — the
  rewrite landed as required `value` + `onChange` with throwing guards.
- ~~Required `value` prop (quarantine `value: ISODate | null` required vs
  current optional `value?`) — same breaking class; same pointers.~~
  SUPERSEDED the same way — `value` is now required (null = empty).
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

Full item text now lives in PATCHES.md (do-it mechanics) and FEATURES.md
(design choices) — this section is the feel-it order for the walkthrough.

- Most important (user impact): **PATCHES.md #1, the controlled-locale
  text engine** — today the field shows raw `2026-08-31` and echoes
  garbage to `onChange`; every typed-date user feels this. In Book,
  open the Atomic story, type `31/04/2024` and blur: nothing reverts,
  nothing validates — that is the missing engine.
- Second: **FEATURES.md #2, the Range namespace** — there is no range
  picker at all (`DateField.Range`/`Start`/`End` do not exist); booking
  flows cannot be built. In Book, note the story list ends at
  WithPicker — quarantine's `FoldedRange`/`WithRange` stories show what
  was declined.
- Third: **FEATURES.md #1, required explicit locale** — the one breaking
  API call HQ must make before PATCHES #1 starts (keep the `'en-US'`
  default vs throw). Nothing to click in Book; decide from the SSR
  determinism argument in `DF-FMT-06`.
- Cheap wins if HQ wants motion today: PATCHES.md #6 (`required`
  passthrough) + PATCHES.md #9 (`aria-controls`) are each one prop /
  one attribute with one CT proof and no engine dependency.
